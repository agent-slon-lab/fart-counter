// Achievements logic for Fart Counter v2 — 15+ achievements with emoji icons

import type { FartRecord, FoodEntry, MoodDay } from "./store";
import { dateKey } from "./store";
import type { TranslationKey } from "./i18n";

export interface AchievementDef {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string; // emoji
  /** optional gradient color for the badge */
  color: string;
  /** category for filtering */
  category: "count" | "streak" | "tags" | "time" | "social" | "special";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Count-based
  {
    id: "first_breath",
    nameKey: "ach_first_breath_name",
    descKey: "ach_first_breath_desc",
    icon: "🌬️",
    color: "#84cc16",
    category: "count",
  },
  {
    id: "marathoner",
    nameKey: "ach_marathoner_name",
    descKey: "ach_marathoner_desc",
    icon: "🏃",
    color: "#22c55e",
    category: "count",
  },
  {
    id: "windbreaker",
    nameKey: "ach_windbreaker_name",
    descKey: "ach_windbreaker_desc",
    icon: "💨",
    color: "#10b981",
    category: "count",
  },
  {
    id: "hurricane",
    nameKey: "ach_hurricane_name",
    descKey: "ach_hurricane_desc",
    icon: "🌪️",
    color: "#ef4444",
    category: "count",
  },
  {
    id: "centurion",
    nameKey: "ach_centurion_name",
    descKey: "ach_centurion_desc",
    icon: "💯",
    color: "#f59e0b",
    category: "count",
  },
  {
    id: "champion",
    nameKey: "ach_champion_name",
    descKey: "ach_champion_desc",
    icon: "👑",
    color: "#a855f7",
    category: "count",
  },
  // Streak
  {
    id: "week_stability",
    nameKey: "ach_week_stability_name",
    descKey: "ach_week_stability_desc",
    icon: "📅",
    color: "#3b82f6",
    category: "streak",
  },
  {
    id: "month_stability",
    nameKey: "ach_month_stability_name",
    descKey: "ach_month_stability_desc",
    icon: "🗓️",
    color: "#6366f1",
    category: "streak",
  },
  // Tags
  {
    id: "silent_deadly",
    nameKey: "ach_silent_deadly_name",
    descKey: "ach_silent_deadly_desc",
    icon: "🤫",
    color: "#a855f7",
    category: "tags",
  },
  {
    id: "stinky_one",
    nameKey: "ach_stinky_one_name",
    descKey: "ach_stinky_one_desc",
    icon: "💀",
    color: "#6b7280",
    category: "tags",
  },
  {
    id: "loud_and_proud",
    nameKey: "ach_loud_and_proud_name",
    descKey: "ach_loud_and_proud_desc",
    icon: "📢",
    color: "#f97316",
    category: "tags",
  },
  {
    id: "toilet_philosopher",
    nameKey: "ach_toilet_philosopher_name",
    descKey: "ach_toilet_philosopher_desc",
    icon: "🚽",
    color: "#0ea5e9",
    category: "tags",
  },
  // Time-based
  {
    id: "morning_routine",
    nameKey: "ach_morning_routine_name",
    descKey: "ach_morning_routine_desc",
    icon: "🌅",
    color: "#fbbf24",
    category: "time",
  },
  {
    id: "night_owl",
    nameKey: "ach_night_owl_name",
    descKey: "ach_night_owl_desc",
    icon: "🦉",
    color: "#1e40af",
    category: "time",
  },
  {
    id: "lunch_break",
    nameKey: "ach_lunch_break_name",
    descKey: "ach_lunch_break_desc",
    icon: "🍽️",
    color: "#dc2626",
    category: "time",
  },
  // Special
  {
    id: "weekend_warrior",
    nameKey: "ach_weekend_warrior_name",
    descKey: "ach_weekend_warrior_desc",
    icon: "🎉",
    color: "#ec4899",
    category: "special",
  },
  {
    id: "food_explorer",
    nameKey: "ach_food_explorer_name",
    descKey: "ach_food_explorer_desc",
    icon: "🥦",
    color: "#16a34a",
    category: "special",
  },
  {
    id: "globetrotter",
    nameKey: "ach_globetrotter_name",
    descKey: "ach_globetrotter_desc",
    icon: "🌍",
    color: "#0d9488",
    category: "special",
  },
];

/** Compute which achievements SHOULD be unlocked given the current data. */
export function checkAchievements(
  farts: FartRecord[],
  food: FoodEntry[] = [],
  moods: MoodDay[] = []
): string[] {
  const unlockable: string[] = [];

  // 1. first_breath — any fart at all
  if (farts.length >= 1) unlockable.push("first_breath");

  // 2-3. marathoner (exactly 15) / hurricane (50+)
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

  // 5. centurion — 100 in one day
  for (const c of countsByDay.values()) if (c >= 100) unlockable.push("centurion");

  // 6. champion — 500 all-time
  if (farts.length >= 500) unlockable.push("champion");

  // 7. week_stability — 7 consecutive days in norm (10-20)
  const inNorm = new Set<string>();
  for (const [k, c] of countsByDay.entries()) if (c >= 10 && c <= 20) inNorm.add(k);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let bestStreak = 0;
  let cur = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    if (inNorm.has(dateKey(d))) {
      cur++;
      bestStreak = Math.max(bestStreak, cur);
    } else cur = 0;
  }
  if (bestStreak >= 7) unlockable.push("week_stability");

  // 8. month_stability — 30 consecutive days in norm
  if (bestStreak >= 30) unlockable.push("month_stability");

  // 9. silent_deadly — 10 silent farts
  const silentCount = farts.filter((f) => f.tags.includes("silent")).length;
  if (silentCount >= 10) unlockable.push("silent_deadly");

  // 10. stinky_one — 10 smelly farts
  const smellyCount = farts.filter((f) => f.tags.includes("smelly")).length;
  if (smellyCount >= 10) unlockable.push("stinky_one");

  // 11. loud_and_proud — 10 loud farts
  const loudCount = farts.filter((f) => f.tags.includes("loud")).length;
  if (loudCount >= 10) unlockable.push("loud_and_proud");

  // 12. toilet_philosopher — 20 in toilet
  const toiletCount = farts.filter((f) => f.tags.includes("toilet")).length;
  if (toiletCount >= 20) unlockable.push("toilet_philosopher");

  // 13. morning_routine — fart before 8 AM
  const hasMorning = farts.some((f) => new Date(f.ts).getHours() < 8);
  if (hasMorning) unlockable.push("morning_routine");

  // 14. night_owl — fart after midnight (0-3 AM)
  const hasNight = farts.some((f) => {
    const h = new Date(f.ts).getHours();
    return h >= 0 && h < 3;
  });
  if (hasNight) unlockable.push("night_owl");

  // 15. lunch_break — fart between 12 and 14
  const hasLunch = farts.some((f) => {
    const h = new Date(f.ts).getHours();
    return h >= 12 && h < 14;
  });
  if (hasLunch) unlockable.push("lunch_break");

  // 16. weekend_warrior — 30+ farts total on Sat/Sun
  let weekendCount = 0;
  for (const f of farts) {
    const day = new Date(f.ts).getDay();
    if (day === 0 || day === 6) weekendCount++;
  }
  if (weekendCount >= 30) unlockable.push("weekend_warrior");

  // 17. food_explorer — logged 10+ food entries
  if (food.length >= 10) unlockable.push("food_explorer");

  // 18. globetrotter — farted from 3+ distinct countries
  const countries = new Set<string>();
  for (const f of farts) if (f.country) countries.add(f.country);
  if (countries.size >= 3) unlockable.push("globetrotter");

  return Array.from(new Set(unlockable));
}

/** Compute "windiness level" for share card based on total farts. */
export function getWindinessLevel(total: number): {
  levelKey: string;
  emoji: string;
  color: string;
} {
  if (total < 10) return { levelKey: "level_beginner", emoji: "🌱", color: "#84cc16" };
  if (total < 50) return { levelKey: "level_amateur", emoji: "🍃", color: "#22c55e" };
  if (total < 100) return { levelKey: "level_pro", emoji: "💨", color: "#10b981" };
  if (total < 300) return { levelKey: "level_master", emoji: "🌪️", color: "#f59e0b" };
  return { levelKey: "level_legend", emoji: "👑", color: "#ef4444" };
}
