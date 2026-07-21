// Zustand store with localStorage persistence for Fart Counter PWA v2
// Offline-first: all data lives in the browser, no backend.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Language } from "./i18n";

// ===== Data types =====

export type FartTag =
  | "silent"
  | "smelly"
  | "loud"
  | "long"
  | "toilet"
  | "accidental"
  | "whisper"
  | "burst"
  | "musical"
  | "wave"
  | "frog";

export type FartSound =
  | "classic"
  | "squeaker"
  | "rumble"
  | "machine_gun"
  | "whoopee"
  | "thunder"
  | "squeak"
  | "deflate"
  | "whisper"
  | "burst"
  | "musical"
  | "wave"
  | "frog"
  | "random";

export interface FartRecord {
  id: string;
  /** ISO timestamp */
  ts: string;
  tags: FartTag[];
  /** Sound used (for replay / stats) */
  sound?: FartSound;
  /** Optional geo coordinates */
  lat?: number;
  lng?: number;
  /** Country code (set when geo is captured) */
  country?: string;
  /** Profile ID this record belongs to */
  profileId?: string;
}

export interface WaterDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  /** Profile ID */
  profileId?: string;
}

export interface FoodEntry {
  id: string;
  ts: string;
  /** food key (beans, cabbage, ...) or custom text */
  name: string;
  /** Profile ID */
  profileId?: string;
}

export interface MoodDay {
  /** YYYY-MM-DD */
  date: string;
  mood: "happy" | "neutral" | "sad" | "angry" | "tired";
  /** Profile ID */
  profileId?: string;
}

export interface WeatherSnapshot {
  /** YYYY-MM-DD */
  date: string;
  tempC?: number;
  pressureHpa?: number;
  humidity?: number;
  condition?: string;
}

export interface Profile {
  id: string;
  name: string;
  type: "adult" | "baby";
  avatar: string;
  age?: number;
}

export type AccentColor = "green" | "pink" | "blue" | "gold" | "rainbow" | "sunset" | "ocean" | "galaxy";
export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
  accent: AccentColor;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  eveningReminder: boolean;
  waterReminder: boolean;
  morningReminder: boolean;
  gentleReminder: boolean;
  /** Selected fart sound */
  fartSound: FartSound;
  /** Enable geo-marking when farting */
  geoEnabled: boolean;
  /** Enable weather correlation */
  weatherEnabled: boolean;
  /** Active profile ID */
  activeProfileId: string;
}

export interface AppState {
  // Data
  farts: FartRecord[];
  water: WaterDay[];
  food: FoodEntry[];
  moods: MoodDay[];
  weather: WeatherSnapshot[];
  /** Anonymous world-ranking contribution: country code → count */
  worldRank: Record<string, number>;
  /** User profiles (multi-profile support) */
  profiles: Profile[];

  // Gamification
  xp: number;
  streak: number;
  lastFartDay: string | null;
  lastBonusDay: string | null;
  purchasedItems: string[];
  fartsTodayForXP: number; // tracks farts today for XP cap

  // Settings
  settings: AppSettings;

  // Achievements
  unlockedAchievements: string[];

  // Actions — Farts
  addFart: (opts?: { tags?: FartTag[]; sound?: FartSound; geo?: { lat: number; lng: number; country?: string } }) => string | null;
  removeLastFartToday: () => void;
  deleteFart: (id: string) => void;
  setFartCountForDay: (dateYYYYMMDD: string, count: number) => void;
  addManualFart: (dateYYYYMMDD: string, count: number, tags?: FartTag[]) => void;

  // Actions — Water
  addWater: () => void;
  removeWater: () => void;

  // Actions — Food
  addFood: (name: string) => void;
  removeFood: (id: string) => void;

  // Actions — Mood
  setMood: (mood: MoodDay["mood"]) => void;

  // Actions — Weather
  recordWeather: (snap: WeatherSnapshot) => void;

  // Actions — World rank
  contributeToRank: (country: string, count?: number) => void;
  setWorldRank: (rank: Record<string, number>) => void;

  // Actions — Profiles
  addProfile: (profile: Omit<Profile, "id">) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;

  // Actions — Gamification
  addXP: (amount: number) => void;
  claimDailyBonus: () => number;
  purchaseItem: (itemId: string, cost: number) => boolean;
  resetDailyXPCounter: () => void;

  // Actions — Settings
  setLanguage: (lang: Language) => void;
  setTheme: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

  // Actions — Achievements
  unlockAchievement: (id: string) => boolean;
  isAchievementUnlocked: (id: string) => boolean;

  // Actions — Data management
  importData: (data: string) => boolean;
  resetAllData: () => void;
}

// ===== Helpers =====

function todayKey(): string {
  return dateKey(new Date());
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Store =====

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      farts: [],
      water: [],
      food: [],
      moods: [],
      weather: [],
      worldRank: {},
      profiles: [{ id: "me", name: "Me", type: "adult", avatar: "🧑" }],

      // Gamification
      xp: 999999, // SANDBOX: max XP for testing shop
      streak: 0,
      lastFartDay: null,
      lastBonusDay: null,
      purchasedItems: [],
      fartsTodayForXP: 0,

      settings: {
        language: "en",
        theme: "system",
        accent: "green",
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: false,
        eveningReminder: true,
        waterReminder: false,
        morningReminder: false,
        gentleReminder: false,
        fartSound: "classic",
        geoEnabled: false,
        weatherEnabled: false,
        activeProfileId: "me",
      },
      unlockedAchievements: [],

      addFart: (opts) => {
        const activeProfileId = get().settings.activeProfileId;
        const rec: FartRecord = {
          id: uid(),
          ts: new Date().toISOString(),
          tags: opts?.tags ?? [],
          sound: opts?.sound,
          profileId: activeProfileId,
        };
        if (opts?.geo) {
          rec.lat = opts.geo.lat;
          rec.lng = opts.geo.lng;
          rec.country = opts.geo.country;
        }
        const today = todayKey();
        const state = get();

        // XP: +10 per fart, but capped at 30 farts/day (max 300 XP/day)
        const MAX_XP_FARTS = 30;
        const fartsTodayForXP = state.lastFartDay === today ? state.fartsTodayForXP : 0;
        const xpGain = fartsTodayForXP < MAX_XP_FARTS ? 10 : 0;

        // Streak: check if this is the first fart today
        let newStreak = state.streak;
        if (state.lastFartDay !== today) {
          // Check if yesterday had farts (or grace period)
          const yesterday = dateKey(new Date(Date.now() - 86400000));
          if (state.lastFartDay === yesterday) {
            newStreak = state.streak + 1;
          } else if (state.lastFartDay === null) {
            newStreak = 1;
          } else {
            // Streak broken, but grace period: if 2 days ago had farts, keep streak
            const twoDaysAgo = dateKey(new Date(Date.now() - 2 * 86400000));
            if (state.lastFartDay === twoDaysAgo) {
              newStreak = state.streak + 1; // grace period
            } else {
              newStreak = 1; // reset
            }
          }
        }

        set((s) => ({
          farts: [...s.farts, rec],
          xp: s.xp + xpGain,
          streak: newStreak,
          lastFartDay: today,
          fartsTodayForXP: fartsTodayForXP + 1,
        }));
        return rec.id;
      },

      removeLastFartToday: () => {
        const tk = todayKey();
        const activeProfileId = get().settings.activeProfileId;
        const farts = get().farts;
        for (let i = farts.length - 1; i >= 0; i--) {
          if (dateKey(new Date(farts[i].ts)) === tk && (farts[i].profileId || "me") === activeProfileId) {
            const next = [...farts];
            next.splice(i, 1);
            const state = get();
            // XP ROLLBACK (Approach B): deduct 10 XP if this fart earned XP
            const xpDeduct = state.fartsTodayForXP > 0 ? 10 : 0;
            set({
              farts: next,
              xp: Math.max(0, state.xp - xpDeduct),
              fartsTodayForXP: Math.max(0, state.fartsTodayForXP - 1),
            });
            return;
          }
        }
      },

      deleteFart: (id) => set((s) => ({ farts: s.farts.filter((f) => f.id !== id) })),

      setFartCountForDay: (dateYYYYMMDD, count) => {
        set((s) => {
          const others = s.farts.filter((f) => dateKey(new Date(f.ts)) !== dateYYYYMMDD);
          const newRecs: FartRecord[] = [];
          const base = new Date(dateYYYYMMDD + "T12:00:00");
          for (let i = 0; i < count; i++) {
            const offset = Math.floor((i / Math.max(count, 1)) * 12 * 3600 * 1000);
            newRecs.push({
              id: uid(),
              ts: new Date(base.getTime() - 6 * 3600 * 1000 + offset).toISOString(),
              tags: [],
            });
          }
          return { farts: [...others, ...newRecs] };
        });
      },

      addManualFart: (dateYYYYMMDD, count, tags = []) => {
        set((s) => {
          const base = new Date(dateYYYYMMDD + "T12:00:00");
          const newRecs: FartRecord[] = [];
          for (let i = 0; i < count; i++) {
            const offset = Math.floor((i / Math.max(count, 1)) * 12 * 3600 * 1000);
            newRecs.push({
              id: uid(),
              ts: new Date(base.getTime() - 6 * 3600 * 1000 + offset).toISOString(),
              tags: [...tags],
            });
          }
          return { farts: [...s.farts, ...newRecs] };
        });
      },

      addWater: () => {
        const tk = todayKey();
        const pid = get().settings.activeProfileId;
        set((s) => {
          const idx = s.water.findIndex((w) => w.date === tk && (w.profileId || "me") === pid);
          if (idx === -1) return { water: [...s.water, { date: tk, count: 1, profileId: pid }] };
          const next = [...s.water];
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
          return { water: next };
        });
      },

      removeWater: () => {
        const tk = todayKey();
        const pid = get().settings.activeProfileId;
        set((s) => {
          const idx = s.water.findIndex((w) => w.date === tk && (w.profileId || "me") === pid);
          if (idx === -1) return s;
          const next = [...s.water];
          if (next[idx].count <= 1) next.splice(idx, 1);
          else next[idx] = { ...next[idx], count: next[idx].count - 1 };
          return { water: next };
        });
      },

      addFood: (name) => {
        const pid = get().settings.activeProfileId;
        const rec: FoodEntry = { id: uid(), ts: new Date().toISOString(), name, profileId: pid };
        set((s) => ({ food: [...s.food, rec] }));
      },

      removeFood: (id) => set((s) => ({ food: s.food.filter((f) => f.id !== id) })),

      setMood: (mood) => {
        const tk = todayKey();
        const pid = get().settings.activeProfileId;
        set((s) => {
          const others = s.moods.filter((m) => !(m.date === tk && (m.profileId || "me") === pid));
          return { moods: [...others, { date: tk, mood, profileId: pid }] };
        });
      },

      recordWeather: (snap) => {
        set((s) => {
          const others = s.weather.filter((w) => w.date !== snap.date);
          return { weather: [...others, snap] };
        });
      },

      contributeToRank: (country, count = 1) => {
        if (!country) return;
        set((s) => ({
          worldRank: {
            ...s.worldRank,
            [country]: (s.worldRank[country] ?? 0) + count,
          },
        }));
      },

      setWorldRank: (rank) => set({ worldRank: rank }),

      // ===== Profile actions =====
      addProfile: (profile) => {
        const id = uid();
        const newProfile: Profile = { ...profile, id };
        set((s) => ({ profiles: [...s.profiles, newProfile] }));
      },

      updateProfile: (id, updates) => {
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deleteProfile: (id) => {
        if (id === "me") return; // Can't delete default profile
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          // If active profile was deleted, switch to "me"
          const activeProfileId = s.settings.activeProfileId === id ? "me" : s.settings.activeProfileId;
          return { profiles, settings: { ...s.settings, activeProfileId } };
        });
      },

      setActiveProfile: (id) => {
        set((s) => ({ settings: { ...s.settings, activeProfileId: id } }));
      },

      // ===== Gamification actions =====
      addXP: (amount) => {
        set((s) => ({ xp: s.xp + amount }));
      },

      claimDailyBonus: () => {
        const today = todayKey();
        const state = get();
        if (state.lastBonusDay === today) return 0; // Already claimed

        // Bonus = 50 XP + streak * 10 (max +200 from streak)
        const streakBonus = Math.min(state.streak * 10, 200);
        const total = 50 + streakBonus;

        set((s) => ({ xp: s.xp + total, lastBonusDay: today }));
        return total;
      },

      purchaseItem: (itemId, cost) => {
        const state = get();
        if (state.xp < cost) return false;
        if (state.purchasedItems.includes(itemId)) return false;
        set((s) => ({
          xp: s.xp - cost,
          purchasedItems: [...s.purchasedItems, itemId],
        }));
        return true;
      },

      resetDailyXPCounter: () => {
        set({ fartsTodayForXP: 0 });
      },

      setLanguage: (language) => set((s) => ({ settings: { ...s.settings, language } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setAccent: (accent) => set((s) => ({ settings: { ...s.settings, accent } })),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      unlockAchievement: (id) => {
        const cur = get().unlockedAchievements;
        if (cur.includes(id)) return false;
        set({ unlockedAchievements: [...cur, id] });
        return true;
      },

      isAchievementUnlocked: (id) => get().unlockedAchievements.includes(id),

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed || typeof parsed !== "object") return false;
          set({
            farts: Array.isArray(parsed.farts) ? parsed.farts : get().farts,
            water: Array.isArray(parsed.water) ? parsed.water : get().water,
            food: Array.isArray(parsed.food) ? parsed.food : get().food,
            moods: Array.isArray(parsed.moods) ? parsed.moods : get().moods,
            weather: Array.isArray(parsed.weather) ? parsed.weather : get().weather,
            worldRank: parsed.worldRank && typeof parsed.worldRank === "object" ? parsed.worldRank : get().worldRank,
            unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : get().unlockedAchievements,
            settings: parsed.settings ? { ...get().settings, ...parsed.settings } : get().settings,
          });
          return true;
        } catch {
          return false;
        }
      },

      resetAllData: () =>
        set({
          farts: [],
          water: [],
          food: [],
          moods: [],
          weather: [],
          worldRank: {},
          unlockedAchievements: [],
        }),
    }),
    {
      name: "fart-counter-store-v2",
      storage: createJSONStorage(() => localStorage),
      version: 4,
      // NO skipHydration — let Zustand hydrate synchronously from localStorage (instant)
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        if (version < 2) {
          persisted = {
            ...persisted,
            food: [],
            moods: [],
            weather: [],
            worldRank: {},
            settings: {
              language: persisted.settings?.language ?? "en",
              theme: persisted.settings?.theme ?? "system",
              accent: persisted.settings?.accent ?? "green",
              soundEnabled: persisted.settings?.soundEnabled ?? true,
              vibrationEnabled: persisted.settings?.vibrationEnabled ?? true,
              notificationsEnabled: persisted.settings?.notificationsEnabled ?? false,
              eveningReminder: persisted.settings?.eveningReminder ?? true,
              waterReminder: persisted.settings?.waterReminder ?? false,
              morningReminder: false,
              gentleReminder: false,
              fartSound: "classic",
              geoEnabled: false,
              weatherEnabled: false,
              activeProfileId: "me",
            },
          };
        }
        if (version < 3) {
          if (persisted.farts) {
            persisted.farts = persisted.farts.map((f: any) => ({ ...f, profileId: f.profileId || "me" }));
          }
          if (persisted.water) {
            persisted.water = persisted.water.map((w: any) => ({ ...w, profileId: w.profileId || "me" }));
          }
          if (persisted.food) {
            persisted.food = persisted.food.map((f: any) => ({ ...f, profileId: f.profileId || "me" }));
          }
          if (persisted.moods) {
            persisted.moods = persisted.moods.map((m: any) => ({ ...m, profileId: m.profileId || "me" }));
          }
          persisted.profiles = persisted.profiles || [{ id: "me", name: "Me", type: "adult", avatar: "💨" }];
          if (persisted.settings) {
            persisted.settings.activeProfileId = persisted.settings.activeProfileId || "me";
          }
        }
        if (version < 4) {
          // v3 → v4: Add gamification fields + update default avatar
          persisted.xp = persisted.xp || 0;
          persisted.streak = persisted.streak || 0;
          persisted.lastFartDay = persisted.lastFartDay || null;
          persisted.lastBonusDay = persisted.lastBonusDay || null;
          persisted.purchasedItems = persisted.purchasedItems || [];
          persisted.fartsTodayForXP = persisted.fartsTodayForXP || 0;
          // Update default "Me" avatar from 💨 to 🧑
          if (persisted.profiles) {
            persisted.profiles = persisted.profiles.map((p: any) => {
              if (p.id === "me" && p.avatar === "💨") {
                return { ...p, avatar: "🧑" };
              }
              return p;
            });
          }
        }
        return persisted;
      },
    }
  )
);

// ===== Selectors / derived helpers =====

export function getFartsForDate(farts: FartRecord[], date: Date): FartRecord[] {
  const key = dateKey(date);
  return farts.filter((f) => dateKey(new Date(f.ts)) === key);
}

export function getCountForDate(farts: FartRecord[], date: Date): number {
  return getFartsForDate(farts, date).length;
}

export function getTodayCount(farts: FartRecord[]): number {
  return getCountForDate(farts, new Date());
}

export function getTotalAllTime(farts: FartRecord[]): number {
  return farts.length;
}

export function getWaterToday(water: WaterDay[]): number {
  const tk = todayKey();
  return water.find((w) => w.date === tk)?.count ?? 0;
}

export function getMoodToday(moods: MoodDay[]): MoodDay["mood"] | null {
  const tk = todayKey();
  return moods.find((m) => m.date === tk)?.mood ?? null;
}

export function getFoodToday(food: FoodEntry[]): FoodEntry[] {
  const tk = todayKey();
  return food.filter((f) => dateKey(new Date(f.ts)) === tk);
}

// ===== Profile-aware selectors (filter by activeProfileId) =====

export function useProfileFarts(): FartRecord[] {
  const farts = useStore((s) => s.farts);
  const pid = useStore((s) => s.settings.activeProfileId);
  return farts.filter((f) => (f.profileId || "me") === pid);
}

export function useProfileWater(): WaterDay[] {
  const water = useStore((s) => s.water);
  const pid = useStore((s) => s.settings.activeProfileId);
  return water.filter((w) => (w.profileId || "me") === pid);
}

export function useProfileFood(): FoodEntry[] {
  const food = useStore((s) => s.food);
  const pid = useStore((s) => s.settings.activeProfileId);
  return food.filter((f) => (f.profileId || "me") === pid);
}

export function useProfileMoods(): MoodDay[] {
  const moods = useStore((s) => s.moods);
  const pid = useStore((s) => s.settings.activeProfileId);
  return moods.filter((m) => (m.profileId || "me") === pid);
}
