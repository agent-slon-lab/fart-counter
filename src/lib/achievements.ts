// Achievements logic for Fart Counter v3 — rebalanced for longer grind + legendary achievements

import type { FartRecord, FoodEntry, MoodDay } from "./store";
import { dateKey } from "./store";

export interface AchievementDef {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  color: string;
  category: "count" | "streak" | "tags" | "time" | "social" | "special" | "legendary";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === Count-based (rebalanced harder) ===
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
  // === Streak (rebalanced harder) ===
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
  // === Tags (rebalanced harder) ===
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
  {
    id: "whisperer",
    nameKey: "ach_whisperer_name",
    descKey: "ach_whisperer_desc",
    icon: "🍃",
    color: "#84cc16",
    category: "tags",
  },
  {
    id: "sniper",
    nameKey: "ach_sniper_name",
    descKey: "ach_sniper_desc",
    icon: "🎯",
    color: "#dc2626",
    category: "tags",
  },
  // === Time ===
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
  // === Special ===
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
  // === Legendary (long grind) ===
  {
    id: "year_windiness",
    nameKey: "ach_year_windiness_name",
    descKey: "ach_year_windiness_desc",
    icon: "🏆",
    color: "#fbbf24",
    category: "legendary",
  },
  {
    id: "wind_lord",
    nameKey: "ach_wind_lord_name",
    descKey: "ach_wind_lord_desc",
    icon: "👑",
    color: "#a855f7",
    category: "legendary",
  },
  {
    id: "world_citizen",
    nameKey: "ach_world_citizen_name",
    descKey: "ach_world_citizen_desc",
    icon: "🌎",
    color: "#0ea5e9",
    category: "legendary",
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

  // Per-day counts
  const countsByDay = new Map<string, number>();
  for (const f of farts) {
    const k = dateKey(new Date(f.ts));
    countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1);
  }

  // 2. marathoner — 20 farts in one day (was 15)
  // 3. hurricane — 80+ in one day (was 50)
  // 4. centurion — 150+ in one day (was 100)
  for (const c of countsByDay.values()) {
    if (c >= 20) unlockable.push("marathoner");
    if (c >= 80) unlockable.push("hurricane");
    if (c >= 150) unlockable.push("centurion");
  }

  // 5. windbreaker — 500 farts all-time (was 100)
  if (farts.length >= 500) unlockable.push("windbreaker");

  // 6. champion — 2000 farts all-time (was 500)
  if (farts.length >= 2000) unlockable.push("champion");

  // 7. week_stability — 14 consecutive days in norm (was 7)
  const inNorm = new Set<string>();
  for (const [k, c] of countsByDay.entries()) if (c >= 10 && c <= 20) inNorm.add(k);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let bestStreak = 0;
  let cur = 0;
  // Check up to 365 days back
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    if (inNorm.has(dateKey(d))) {
      cur++;
      bestStreak = Math.max(bestStreak, cur);
    } else cur = 0;
  }
  if (bestStreak >= 14) unlockable.push("week_stability");

  // 8. month_stability — 60 consecutive days in norm (was 30)
  if (bestStreak >= 60) unlockable.push("month_stability");

  // 9. silent_deadly — 50 silent farts (was 10)
  const silentCount = farts.filter((f) => f.tags.includes("silent")).length;
  if (silentCount >= 50) unlockable.push("silent_deadly");

  // 10. stinky_one — 50 smelly farts (was 10)
  const smellyCount = farts.filter((f) => f.tags.includes("smelly")).length;
  if (smellyCount >= 50) unlockable.push("stinky_one");

  // 11. loud_and_proud — 50 loud farts (was 10)
  const loudCount = farts.filter((f) => f.tags.includes("loud")).length;
  if (loudCount >= 50) unlockable.push("loud_and_proud");

  // 12. toilet_philosopher — 100 in toilet (was 20)
  const toiletCount = farts.filter((f) => f.tags.includes("toilet")).length;
  if (toiletCount >= 100) unlockable.push("toilet_philosopher");

  // 13. whisperer — 30 whispers (new tag)
  const whisperCount = farts.filter((f) => f.tags.includes("whisper")).length;
  if (whisperCount >= 30) unlockable.push("whisperer");

  // 14. sniper — 30 burst (new tag)
  const burstCount = farts.filter((f) => f.tags.includes("burst")).length;
  if (burstCount >= 30) unlockable.push("sniper");

  // 15. morning_routine — fart before 8 AM
  const hasMorning = farts.some((f) => new Date(f.ts).getHours() < 8);
  if (hasMorning) unlockable.push("morning_routine");

  // 16. night_owl — fart 0-3 AM
  const hasNight = farts.some((f) => {
    const h = new Date(f.ts).getHours();
    return h >= 0 && h < 3;
  });
  if (hasNight) unlockable.push("night_owl");

  // 17. lunch_break — fart 12-14
  const hasLunch = farts.some((f) => {
    const h = new Date(f.ts).getHours();
    return h >= 12 && h < 14;
  });
  if (hasLunch) unlockable.push("lunch_break");

  // 18. weekend_warrior — 100+ on weekends (was 30)
  let weekendCount = 0;
  for (const f of farts) {
    const day = new Date(f.ts).getDay();
    if (day === 0 || day === 6) weekendCount++;
  }
  if (weekendCount >= 100) unlockable.push("weekend_warrior");

  // 19. food_explorer — 30+ food entries (was 10)
  if (food.length >= 30) unlockable.push("food_explorer");

  // 20. globetrotter — 3+ countries
  const countries = new Set<string>();
  for (const f of farts) if (f.country) countries.add(f.country);
  if (countries.size >= 3) unlockable.push("globetrotter");

  // === Legendary ===
  // 21. year_windiness — 365 days with at least 1 fart each
  if (bestStreak >= 365 || farts.length >= 5000) {
    // Actually check distinct days
    if (countsByDay.size >= 365) unlockable.push("year_windiness");
  }

  // 22. wind_lord — 5000 farts all-time
  if (farts.length >= 5000) unlockable.push("wind_lord");

  // 23. world_citizen — 10+ countries
  if (countries.size >= 10) unlockable.push("world_citizen");

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
