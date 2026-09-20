/**
 * Clinical analytics for medical mode.
 *
 * Three independent analyses (all use the same data inputs):
 * 1. Heatmap by hour of day — when do bowel visits happen?
 * 2. Lag Windowing — in which time window (0-2h/2-6h/6-24h) after eating a food
 *    does a bowel visit with symptoms appear most often?
 * 3. Risk Ratio — for each food, RR = P(symptom | food within 24h) / P(symptom | no food)
 *    Minimum 3 exposures to be reported (filter out noise).
 *
 * All functions are pure & deterministic — given the same inputs, same outputs.
 * Used by insights-screen.tsx and medical-report.tsx.
 */

import type { FoodEntry, PoopRecord } from "./store";
import { FODMAP_MAP, FODMAP_LABELS, LAG_WINDOWS, type FodmapCategory } from "./fodmap";

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MIN_EXPOSURES = 3;

// ===== 1. Hourly heatmap =====

export interface HourlyHeatmap {
  /** Hour-of-day 0..23 → count of bowel visits */
  counts: number[];
  /** max count (for color scaling) */
  max: number;
  /** total visits */
  total: number;
  /** peak hour (0..23), or -1 if no data */
  peakHour: number;
}

export function computeHourlyHeatmap(poops: PoopRecord[]): HourlyHeatmap {
  const counts = new Array(24).fill(0);
  for (const p of poops) {
    const h = new Date(p.ts).getHours();
    if (h >= 0 && h < 24) counts[h]++;
  }
  const total = poops.length;
  const max = Math.max(...counts, 0);
  let peakHour = -1;
  if (total > 0) {
    let best = -1;
    for (let h = 0; h < 24; h++) {
      if (counts[h] > best) {
        best = counts[h];
        peakHour = h;
      }
    }
  }
  return { counts, max, total, peakHour };
}

/** Get part-of-day label key for given hour. */
export function hourToPartKey(hour: number): string {
  if (hour >= 5 && hour < 12) return "heatmap_axis_morning";
  if (hour >= 12 && hour < 18) return "heatmap_axis_afternoon";
  if (hour >= 18 && hour < 23) return "heatmap_axis_evening";
  return "heatmap_axis_night";
}

// ===== 2. Lag Windowing =====

export interface LagWindowResult {
  windowId: string;
  startMs: number;
  endMs: number;
  /** Number of bowel visits with symptoms that occurred within this window after a food event */
  reactions: number;
  /** Total food events that had ANY bowel visit within 24h */
  totalFoodWithResponse: number;
  /** reactions / totalFoodWithResponse * 100 */
  share: number;
}

/**
 * For each lag window (0-2h, 2-6h, 6-24h), find how many food events had a symptomatic
 * bowel visit in that window. A food event can be counted in multiple windows if
 * symptoms recur, but typically each food → next symptomatic poop falls into one window.
 */
export function computeLagWindows(food: FoodEntry[], poops: PoopRecord[]): LagWindowResult[] {
  const symptomaticPoops = poops.filter((p) => hasSymptoms(p));
  if (food.length === 0 || symptomaticPoops.length === 0) {
    return LAG_WINDOWS.map((w) => ({
      windowId: w.id,
      startMs: w.startMs,
      endMs: w.endMs,
      reactions: 0,
      totalFoodWithResponse: 0,
      share: 0,
    }));
  }

  // For each food event, find the EARLIEST symptomatic poop within 24h.
  // Then place that food→poop pair in the matching window.
  let totalFoodWithResponse = 0;
  const reactionsPerWindow = LAG_WINDOWS.map(() => 0);

  for (const f of food) {
    const eatTime = new Date(f.ts).getTime();
    let earliestDiff = Infinity;
    for (const p of symptomaticPoops) {
      const diff = new Date(p.ts).getTime() - eatTime;
      if (diff > 0 && diff < DAY_MS && diff < earliestDiff) {
        earliestDiff = diff;
      }
    }
    if (earliestDiff < Infinity) {
      totalFoodWithResponse++;
      for (let i = 0; i < LAG_WINDOWS.length; i++) {
        const w = LAG_WINDOWS[i];
        if (earliestDiff >= w.startMs && earliestDiff < w.endMs) {
          reactionsPerWindow[i]++;
          break;
        }
      }
    }
  }

  return LAG_WINDOWS.map((w, i) => ({
    windowId: w.id,
    startMs: w.startMs,
    endMs: w.endMs,
    reactions: reactionsPerWindow[i],
    totalFoodWithResponse,
    share: totalFoodWithResponse > 0 ? Math.round((reactionsPerWindow[i] / totalFoodWithResponse) * 100) : 0,
  }));
}

// ===== 3. Risk Ratio =====

export interface RiskRatioResult {
  /** Food display name (translated already by caller) */
  name: string;
  /** Original food key (for FODMAP lookup) */
  key: string;
  /** FODMAP category (if known) */
  fodmap: FodmapCategory | "unknown";
  /** Number of food events within 24h before a bowel visit (exposed) */
  exposures: number;
  /** Number of exposed events where the bowel visit had symptoms */
  symptomaticExposed: number;
  /** Number of bowel visits NOT preceded by this food within 24h (unexposed) */
  unexposed: number;
  /** Number of unexposed bowel visits with symptoms */
  symptomaticUnexposed: number;
  /** Risk ratio = (symptomaticExposed/exposures) / (symptomaticUnexposed/unexposed) */
  rr: number;
  /** Lower bound of 95% CI (Wald) */
  ciLow: number;
  /** Upper bound of 95% CI (Wald) */
  ciHigh: number;
  /** True if meets minimum sample size */
  sufficient: boolean;
}

/**
 * For each food, compute Risk Ratio of symptoms.
 * RR = P(symptom | food eaten in last 24h) / P(symptom | food NOT eaten in last 24h)
 *
 * A bowel visit is "exposed" to food X if food X was eaten in [poopTime - 24h, poopTime).
 * "Unexposed" = no food X in that window.
 *
 * Minimum 3 exposures to be reported (smaller samples filtered out).
 */
export function computeRiskRatios(
  food: FoodEntry[],
  poops: PoopRecord[],
  foodNameResolver: (key: string) => string
): RiskRatioResult[] {
  if (poops.length === 0) return [];

  // Group food by name (preset key or custom text)
  const foodByName = new Map<string, FoodEntry[]>();
  for (const f of food) {
    const arr = foodByName.get(f.name) ?? [];
    arr.push(f);
    foodByName.set(f.name, arr);
  }

  const results: RiskRatioResult[] = [];

  for (const [name, events] of foodByName) {
    // Only consider foods with ≥3 events
    if (events.length < MIN_EXPOSURES) continue;

    let exposures = 0;
    let symptomaticExposed = 0;
    let unexposed = 0;
    let symptomaticUnexposed = 0;

    for (const p of poops) {
      const poopTime = new Date(p.ts).getTime();
      const windowStart = poopTime - DAY_MS;
      const isExposed = events.some(
        (f) => {
          const t = new Date(f.ts).getTime();
          return t >= windowStart && t < poopTime;
        }
      );
      const isSymptomatic = hasSymptoms(p);
      if (isExposed) {
        exposures++;
        if (isSymptomatic) symptomaticExposed++;
      } else {
        unexposed++;
        if (isSymptomatic) symptomaticUnexposed++;
      }
    }

    // Need at least 3 exposures AND ≥3 unexposed for meaningful comparison
    if (exposures < MIN_EXPOSURES || unexposed < MIN_EXPOSURES) continue;

    const pExposed = exposures > 0 ? symptomaticExposed / exposures : 0;
    const pUnexposed = unexposed > 0 ? symptomaticUnexposed / unexposed : 0;
    // Avoid division by zero — use continuity correction
    const rr = pUnexposed > 0 ? pExposed / pUnexposed : (pExposed > 0 ? Infinity : 1);

    // 95% CI (Wald log): se = sqrt(1/a - 1/n1 + 1/c - 1/n2)
    // where a = symptomaticExposed, n1 = exposures, c = symptomaticUnexposed, n2 = unexposed
    let ciLow = 0;
    let ciHigh = Infinity;
    if (rr > 0 && rr < Infinity) {
      const se = Math.sqrt(
        Math.max(0, 1 / Math.max(1, symptomaticExposed) - 1 / exposures) +
        Math.max(0, 1 / Math.max(1, symptomaticUnexposed) - 1 / unexposed)
      );
      const logRR = Math.log(rr);
      ciLow = Math.exp(logRR - 1.96 * se);
      ciHigh = Math.exp(logRR + 1.96 * se);
    }

    results.push({
      name: foodNameResolver(name),
      key: name,
      fodmap: FODMAP_MAP[name] ?? "unknown",
      exposures,
      symptomaticExposed,
      unexposed,
      symptomaticUnexposed,
      rr,
      ciLow,
      ciHigh,
      sufficient: true,
    });
  }

  // Sort by RR descending (highest risk first), but cap Infinity at top
  return results.sort((a, b) => {
    if (a.rr === Infinity && b.rr === Infinity) return 0;
    if (a.rr === Infinity) return -1;
    if (b.rr === Infinity) return 1;
    return b.rr - a.rr;
  });
}

// ===== 4. FODMAP profile =====

export interface FodmapProfileEntry {
  category: FodmapCategory;
  label: { ru: string; en: string; emoji: string };
  count: number;
  /** % of total FODMAP-classified food events */
  share: number;
}

/**
 * Aggregate food events by FODMAP category. Foods with no FODMAP mapping are skipped
 * (custom user-added foods can't be auto-classified).
 */
export function computeFodmapProfile(food: FoodEntry[]): FodmapProfileEntry[] {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const f of food) {
    const cat = FODMAP_MAP[f.name];
    if (!cat) continue;
    counts[cat] = (counts[cat] ?? 0) + 1;
    total++;
  }
  const entries: FodmapProfileEntry[] = [];
  for (const cat of Object.keys(FODMAP_LABELS) as FodmapCategory[]) {
    const count = counts[cat] ?? 0;
    entries.push({
      category: cat,
      label: FODMAP_LABELS[cat],
      count,
      share: total > 0 ? Math.round((count / total) * 100) : 0,
    });
  }
  return entries;
}

// ===== Helpers =====

function hasSymptoms(p: PoopRecord): boolean {
  if (p.symptoms && p.symptoms.trim().length > 0) return true;
  if (p.tenesmus) return true;
  if (p.incomplete) return true;
  if (p.painLevel && p.painLevel >= 1) return true;
  return false;
}

export { FODMAP_MAP, FODMAP_LABELS, LAG_WINDOWS, MIN_EXPOSURES };
