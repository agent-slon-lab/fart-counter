// Level system + Shop items for Fart Counter gamification

export interface LevelDef {
  level: number;
  nameKey: string;
  emoji: string;
  minXp: number;
}

export const LEVELS: LevelDef[] = [
  { level: 1, nameKey: "level_1_name", emoji: "🌱", minXp: 0 },
  { level: 2, nameKey: "level_2_name", emoji: "🍃", minXp: 500 },
  { level: 3, nameKey: "level_3_name", emoji: "💨", minXp: 1500 },
  { level: 4, nameKey: "level_4_name", emoji: "🌬️", minXp: 3000 },
  { level: 5, nameKey: "level_5_name", emoji: "🌪️", minXp: 6000 },
  { level: 6, nameKey: "level_6_name", emoji: "⚡", minXp: 10000 },
  { level: 7, nameKey: "level_7_name", emoji: "🔥", minXp: 18000 },
  { level: 8, nameKey: "level_8_name", emoji: "⭐", minXp: 30000 },
  { level: 9, nameKey: "level_9_name", emoji: "🌟", minXp: 50000 },
  { level: 10, nameKey: "level_10_name", emoji: "👑", minXp: 80000 },
  { level: 15, nameKey: "level_15_name", emoji: "💎", minXp: 200000 },
  { level: 20, nameKey: "level_20_name", emoji: "🚀", minXp: 500000 },
];

export function getLevel(xp: number): LevelDef {
  let result = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) result = l;
  }
  return result;
}

export function getNextLevel(xp: number): LevelDef | null {
  for (const l of LEVELS) {
    if (xp < l.minXp) return l;
  }
  return null; // Max level
}

export function getLevelProgress(xp: number): { current: number; next: number | null; pct: number } {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return { current: current.minXp, next: null, pct: 100 };
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return { current: current.minXp, next: next.minXp, pct: Math.min(100, (progress / range) * 100) };
}

// ===== Streak milestones =====
export const STREAK_MILESTONES: { days: number; emoji: string; rewardKey: string }[] = [
  { days: 3, emoji: "🥉", rewardKey: "streak_reward_3" },
  { days: 7, emoji: "🥇", rewardKey: "streak_reward_7" },
  { days: 14, emoji: "🏆", rewardKey: "streak_reward_14" },
  { days: 30, emoji: "🎖️", rewardKey: "streak_reward_30" },
  { days: 60, emoji: "🏅", rewardKey: "streak_reward_60" },
  { days: 100, emoji: "👑", rewardKey: "streak_reward_100" },
  { days: 365, emoji: "🌟", rewardKey: "streak_reward_365" },
];

// ===== Shop items =====
export interface ShopItem {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  cost: number;
  category: "theme" | "badge" | "feature";
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "badge_supporter",
    nameKey: "shop_badge_supporter",
    descKey: "shop_badge_supporter_desc",
    icon: "💖",
    cost: 200,
    category: "badge",
  },
  {
    id: "badge_windbreaker",
    nameKey: "shop_badge_windbreaker",
    descKey: "shop_badge_windbreaker_desc",
    icon: "💨",
    cost: 500,
    category: "badge",
  },
  {
    id: "badge_legend",
    nameKey: "shop_badge_legend",
    descKey: "shop_badge_legend_desc",
    icon: "👑",
    cost: 2000,
    category: "badge",
  },
  {
    id: "feature_stats",
    nameKey: "shop_feature_stats",
    descKey: "shop_feature_stats_desc",
    icon: "📊",
    cost: 400,
    category: "feature",
  },
  {
    id: "feature_export",
    nameKey: "shop_feature_export",
    descKey: "shop_feature_export_desc",
    icon: "📤",
    cost: 300,
    category: "feature",
  },
  {
    id: "theme_rainbow",
    nameKey: "shop_theme_rainbow",
    descKey: "shop_theme_rainbow_desc",
    icon: "🌈",
    cost: 1000,
    category: "theme",
  },
];

// ===== Health warnings =====
export function getHealthWarning(count: number, isBaby: boolean): string | null {
  if (isBaby) {
    if (count > 50) return "health_baby_overload";
    return null;
  }
  if (count > 40) return "health_danger";
  if (count > 25) return "health_warning";
  return null;
}

// XP rewards for achievements
export const ACHIEVEMENT_XP: Record<string, number> = {
  first_breath: 50,
  marathoner: 200,
  windbreaker: 500,
  hurricane: 300,
  centurion: 400,
  champion: 1000,
  week_stability: 300,
  month_stability: 1000,
  silent_deadly: 150,
  stinky_one: 150,
  loud_and_proud: 150,
  toilet_philosopher: 200,
  whisperer: 100,
  sniper: 100,
  morning_routine: 50,
  night_owl: 50,
  lunch_break: 50,
  weekend_warrior: 200,
  food_explorer: 100,
  globetrotter: 300,
  year_windiness: 5000,
  wind_lord: 10000,
  world_citizen: 2000,
};
