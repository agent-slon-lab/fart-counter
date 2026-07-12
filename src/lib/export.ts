// Data export utilities (CSV / JSON) + download helper

import type { FartRecord, WaterDay, AppSettings } from "./store";
import { dateKey } from "./store";

export interface ExportPayload {
  farts: FartRecord[];
  water: WaterDay[];
  settings: AppSettings;
  unlockedAchievements: string[];
  exportedAt: string;
  schema: "fart-counter/v1";
}

export function buildExportPayload(
  farts: FartRecord[],
  water: WaterDay[],
  settings: AppSettings,
  unlockedAchievements: string[]
): ExportPayload {
  return {
    farts,
    water,
    settings,
    unlockedAchievements,
    exportedAt: new Date().toISOString(),
    schema: "fart-counter/v1",
  };
}

/** Build CSV: one row per day with totals + tag counts. */
export function buildCSV(farts: FartRecord[]): string {
  const byDay = new Map<string, { total: number; silent: number; smelly: number }>();
  for (const f of farts) {
    const k = dateKey(new Date(f.ts));
    const cur = byDay.get(k) ?? { total: 0, silent: 0, smelly: 0 };
    cur.total++;
    if (f.tags.includes("silent")) cur.silent++;
    if (f.tags.includes("smelly")) cur.smelly++;
    byDay.set(k, cur);
  }
  const rows = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const header = "date,total,silent,smelly";
  const lines = rows.map(([date, c]) => `${date},${c.total},${c.silent},${c.smelly}`);
  return [header, ...lines].join("\n");
}

export function downloadText(filename: string, content: string, mime: string): boolean {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
