// Achievements logic for Fart Counter

import type { FartRecord } from "./store";
import { dateKey, getCountForDate } from "./store";
import type { TranslationKey } from "./i18n";

export interface AchievementDef {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  icon: string; // emoji
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_breath",
    nameKey: "ach_first_breath_name",
    descKey: "ach_first_breath_desc",
    icon: "🌬️",
  },
  {
    id: "marathoner",
    nameKey: "ach_marathoner_name",
    descKey: "ach_marathoner_desc",
    icon: "🏃",
  },
  {
    id: "windbreaker",
    nameKey: "ach_windbreaker_name",
    descKey: "ach_windbreaker_desc",
    icon: "💨",
  },
  {
    id: "hurricane",
    nameKey: "ach_hurricane_name",
    descKey: "ach_hurricane_desc",
    icon: "🌪️",
  },
  {
    id: "silent_deadly",
    nameKey: "ach_silent_deadly_name",
    descKey: "ach_silent_deadly_desc",
    icon: "🤫",
  },
  {
    id: "morning_routine",
    nameKey: "ach_morning_routine_name",
    descKey: "ach_morning_routine_desc",
    icon: "🌅",
  },
  {
    id: "week_stability",
    nameKey: "ach_week_stability_name",
    descKey: "ach_week_stability_desc",
    icon: "📅",
  },
];

export interface AchievementCheckResult {
  /** IDs of newly unlockable achievements */
  newlyUnlockable: string[];
}

/**
 * Check all achievements against the current fart records.
 * Returns the list of achievement IDs that SHOULD be unlocked
 * (caller decides what's actually new by comparing with already-unlocked set).
 */
export function checkAchievements(farts: FartRecord[]): string[] {
  const unlockable: string[] = [];

  // 1. first_breath — any fart at all
  if (farts.length >= 1) unlockable.push("first_breath");

  // 2. marathoner — exactly 15 farts in one day
  // 3. hurricane — 50+ farts in one day
  const countsByDay = new Map<string, number>();
  for (const f of farts) {
    const k = dateKey(new Date(f.ts));
    countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1);
  }
  for (const c of countsByDay.values()) {
    if (c === 15) unlockable.push("marathoner");
    if (c >= 50) unlockable.push("hurricane");
  }

  // 4. windbreaker — 100 farts all-time
  if (farts.length >= 100) unlockable.push("windbreaker");

  // 5. silent_deadly — 10 farts tagged "silent"
  const silentCount = farts.filter((f) => f.tags.includes("silent")).length;
  if (silentCount >= 10) unlockable.push("silent_deadly");

  // 6. morning_routine — a fart before 08:00 local time
  const hasMorning = farts.some((f) => {
    const d = new Date(f.ts);
    return d.getHours() < 8;
  });
  if (hasMorning) unlockable.push("morning_routine");

  // 7. week_stability — 7 consecutive days within norm (10–20)
  if (countsByDay.size > 0) {
    // Build a set of "in-norm" days
    const inNorm = new Set<string>();
    for (const [k, c] of countsByDay.entries()) {
      if (c >= 10 && c <= 20) inNorm.add(k);
    }
    // Check for 7 consecutive days in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let bestStreak = 0;
    let cur = 0;
    // walk back up to 60 days
    for (let i = 0; i < 60; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      if (inNorm.has(dateKey(d))) {
        cur++;
        bestStreak = Math.max(bestStreak, cur);
      } else {
        cur = 0;
      }
    }
    if (bestStreak >= 7) unlockable.push("week_stability");
  }

  // dedupe
  return Array.from(new Set(unlockable));
}

/** Compute "windiness level" for share card based on total farts. */
export function getWindinessLevel(total: number): {
  levelKey: TranslationKey;
  emoji: string;
  color: string;
} {
  if (total < 10) return { levelKey: "level_beginner", emoji: "🌱", color: "#84cc16" };
  if (total < 50) return { levelKey: "level_amateur", emoji: "🍃", color: "#22c55e" };
  if (total < 100) return { levelKey: "level_pro", emoji: "💨", color: "#10b981" };
  if (total < 300) return { levelKey: "level_master", emoji: "🌪️", color: "#f59e0b" };
  return { levelKey: "level_legend", emoji: "👑", color: "#ef4444" };
}
