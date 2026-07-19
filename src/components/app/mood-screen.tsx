"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useStore, getMoodToday, useProfileFarts, useProfileMoods, type MoodDay } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const MOODS: { mood: MoodDay["mood"]; emoji: string; color: string; labelKey: string }[] = [
  { mood: "happy", emoji: "😄", color: "#22c55e", labelKey: "mood_happy" },
  { mood: "neutral", emoji: "😐", color: "#eab308", labelKey: "mood_neutral" },
  { mood: "tired", emoji: "😴", color: "#6366f1", labelKey: "mood_tired" },
  { mood: "sad", emoji: "😔", color: "#3b82f6", labelKey: "mood_sad" },
  { mood: "angry", emoji: "😠", color: "#ef4444", labelKey: "mood_angry" },
];

export function MoodScreen() {
  const { t } = useT();
  const moods = useProfileMoods();
  const farts = useProfileFarts();
  const setMood = useStore((s) => s.setMood);

  const todayMood = getMoodToday(moods);

  // Correlation: avg farts per day for each mood
  const moodStats = useMemo(() => {
    const stats: Record<string, { sum: number; days: number }> = {};
    for (const m of moods) {
      const dayFarts = farts.filter((f) => {
        const d = new Date(f.ts);
        const y = d.getFullYear();
        const mo = d.getMonth();
        const da = d.getDate();
        const md = new Date(m.date + "T00:00:00");
        return y === md.getFullYear() && mo === md.getMonth() && da === md.getDate();
      }).length;
      if (!stats[m.mood]) stats[m.mood] = { sum: 0, days: 0 };
      stats[m.mood].sum += dayFarts;
      stats[m.mood].days++;
    }
    return MOODS.map((m) => ({
      ...m,
      avg: stats[m.mood]?.days ? +(stats[m.mood].sum / stats[m.mood].days).toFixed(1) : 0,
      days: stats[m.mood]?.days ?? 0,
    })).filter((m) => m.days > 0);
  }, [moods, farts]);

  function handleSetMood(mood: MoodDay["mood"]) {
    setMood(mood);
    toast(t("toast_mood_saved"), { icon: "😊", duration: 1000 });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("mood_tracker")}</h1>

      <Card className="p-5">
        <p className="mb-4 text-center text-sm text-muted-foreground">{t("mood_today")}</p>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map(({ mood, emoji, color, labelKey }) => {
            const active = todayMood === mood;
            return (
              <motion.button
                key={mood}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSetMood(mood)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all ${
                  active ? "scale-105" : "border-transparent opacity-70"
                }`}
                style={active ? { borderColor: color, backgroundColor: `${color}15` } : { backgroundColor: "var(--muted)" }}
                aria-label={t(labelKey as never)}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-[9px] font-semibold leading-tight text-center">{t(labelKey as never)}</span>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Correlation */}
      <Card className="p-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{t("mood_correlation")}</p>
        {moodStats.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("mood_no_data")}</p>
        ) : (
          <div className="space-y-3">
            {moodStats.map((m) => (
              <div key={m.mood}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="text-lg">{m.emoji}</span>
                    {t(m.labelKey as never)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    <b>{m.avg}</b> 💨 · {m.days}d
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (m.avg / 30) * 100)}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
