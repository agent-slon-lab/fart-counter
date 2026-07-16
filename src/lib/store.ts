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
}

export interface WaterDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface FoodEntry {
  id: string;
  ts: string;
  /** food key (beans, cabbage, ...) or custom text */
  name: string;
}

export interface MoodDay {
  /** YYYY-MM-DD */
  date: string;
  mood: "happy" | "neutral" | "sad" | "angry" | "tired";
}

export interface WeatherSnapshot {
  /** YYYY-MM-DD */
  date: string;
  tempC?: number;
  pressureHpa?: number;
  humidity?: number;
  condition?: string;
}

export type AccentColor = "green" | "pink" | "blue" | "gold";
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
      },
      unlockedAchievements: [],

      addFart: (opts) => {
        const rec: FartRecord = {
          id: uid(),
          ts: new Date().toISOString(),
          tags: opts?.tags ?? [],
          sound: opts?.sound,
        };
        if (opts?.geo) {
          rec.lat = opts.geo.lat;
          rec.lng = opts.geo.lng;
          rec.country = opts.geo.country;
        }
        set((s) => ({ farts: [...s.farts, rec] }));
        return rec.id;
      },

      removeLastFartToday: () => {
        const tk = todayKey();
        const farts = get().farts;
        for (let i = farts.length - 1; i >= 0; i--) {
          if (dateKey(new Date(farts[i].ts)) === tk) {
            const next = [...farts];
            next.splice(i, 1);
            set({ farts: next });
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
        set((s) => {
          const idx = s.water.findIndex((w) => w.date === tk);
          if (idx === -1) return { water: [...s.water, { date: tk, count: 1 }] };
          const next = [...s.water];
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
          return { water: next };
        });
      },

      removeWater: () => {
        const tk = todayKey();
        set((s) => {
          const idx = s.water.findIndex((w) => w.date === tk);
          if (idx === -1) return s;
          const next = [...s.water];
          if (next[idx].count <= 1) next.splice(idx, 1);
          else next[idx] = { ...next[idx], count: next[idx].count - 1 };
          return { water: next };
        });
      },

      addFood: (name) => {
        const rec: FoodEntry = { id: uid(), ts: new Date().toISOString(), name };
        set((s) => ({ food: [...s.food, rec] }));
      },

      removeFood: (id) => set((s) => ({ food: s.food.filter((f) => f.id !== id) })),

      setMood: (mood) => {
        const tk = todayKey();
        set((s) => {
          const others = s.moods.filter((m) => m.date !== tk);
          return { moods: [...others, { date: tk, mood }] };
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
      version: 2,
      skipHydration: true,
      // Migrate from v1 (old store) — pull in farts/water/settings/unlockedAchievements
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        if (version < 2) {
          // best effort: keep what we can
          return {
            ...persisted,
            food: [],
            moods: [],
            weather: [],
            worldRank: {},
            settings: {
              language: persisted.settings?.language ?? "ru",
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
            },
          };
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
