// Zustand store with localStorage persistence for Fart Counter PWA
// Offline-first: all data lives in the browser, no backend.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Language } from "./i18n";

// ===== Data types =====

export type FartTag = "silent" | "smelly";

export interface FartRecord {
  id: string;
  /** ISO timestamp */
  ts: string;
  tags: FartTag[];
}

export interface WaterDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
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
}

export interface AppState {
  // Data
  farts: FartRecord[];
  water: WaterDay[];

  // Settings
  settings: AppSettings;

  // Achievements: ids that have been unlocked (persisted, so we don't re-pop)
  unlockedAchievements: string[];

  // Actions — Farts
  addFart: (tags?: FartTag[]) => string | null;
  removeLastFartToday: () => void;
  deleteFart: (id: string) => void;
  setFartCountForDay: (dateYYYYMMDD: string, count: number) => void;
  addManualFart: (dateYYYYMMDD: string, count: number, tags?: FartTag[]) => void;

  // Actions — Water
  addWater: () => void;
  removeWater: () => void;

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
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

// ===== Store =====

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      farts: [],
      water: [],
      settings: {
        language: "ru",
        theme: "system",
        accent: "green",
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: false,
        eveningReminder: true,
        waterReminder: false,
      },
      unlockedAchievements: [],

      addFart: (tags = []) => {
        const rec: FartRecord = { id: uid(), ts: new Date().toISOString(), tags };
        set((s) => ({ farts: [...s.farts, rec] }));
        return rec.id;
      },

      removeLastFartToday: () => {
        const tk = todayKey();
        const farts = get().farts;
        // find last fart with today's date
        for (let i = farts.length - 1; i >= 0; i--) {
          if (dateKey(new Date(farts[i].ts)) === tk) {
            const next = [...farts];
            next.splice(i, 1);
            set({ farts: next });
            return;
          }
        }
      },

      deleteFart: (id) =>
        set((s) => ({ farts: s.farts.filter((f) => f.id !== id) })),

      setFartCountForDay: (dateYYYYMMDD, count) => {
        set((s) => {
          const others = s.farts.filter(
            (f) => dateKey(new Date(f.ts)) !== dateYYYYMMDD
          );
          // distribute count across the day at random-ish times
          const newRecs: FartRecord[] = [];
          const base = new Date(dateYYYYMMDD + "T12:00:00");
          for (let i = 0; i < count; i++) {
            const offset = Math.floor(
              (i / Math.max(count, 1)) * 12 * 3600 * 1000
            );
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
            const offset = Math.floor(
              (i / Math.max(count, 1)) * 12 * 3600 * 1000
            );
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
          if (idx === -1) {
            return { water: [...s.water, { date: tk, count: 1 }] };
          }
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
          if (next[idx].count <= 1) {
            next.splice(idx, 1);
          } else {
            next[idx] = { ...next[idx], count: next[idx].count - 1 };
          }
          return { water: next };
        });
      },

      setLanguage: (language) =>
        set((s) => ({ settings: { ...s.settings, language } })),

      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),

      setAccent: (accent) =>
        set((s) => ({ settings: { ...s.settings, accent } })),

      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

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
            unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
              ? parsed.unlockedAchievements
              : get().unlockedAchievements,
            settings: parsed.settings
              ? { ...get().settings, ...parsed.settings }
              : get().settings,
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
          unlockedAchievements: [],
        }),
    }),
    {
      name: "fart-counter-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
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
