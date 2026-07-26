"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore, dateKey, useProfilePoops, useProfileFood, type PoopRecord, type FoodEntry } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const FOOD_WINDOW_HOURS = 24; // food eaten within last 24h before poop counts

export function BowelScreen({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang } = useT();
  const poops = useProfilePoops();
  const food = useProfileFood();
  const addPoop = useStore((s) => s.addPoop);
  const removePoop = useStore((s) => s.removePoop);
  const bowelTrackingEnabled = useStore((s) => s.settings.bowelTrackingEnabled);
  const setSetting = useStore((s) => s.setSetting);

  const [consistency, setConsistency] = useState<PoopRecord["consistency"]>("normal");

  // Last 7 days of poops
  const weekPoops = useMemo(() => {
    const now = Date.now();
    return poops
      .filter((p) => now - new Date(p.ts).getTime() < 7 * 24 * 3600 * 1000)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [poops]);

  // Today count
  const todayCount = useMemo(() => {
    const tk = dateKey(new Date());
    return poops.filter((p) => dateKey(new Date(p.ts)) === tk).length;
  }, [poops]);

  // Time since last poop
  const timeSince = useMemo(() => {
    if (poops.length === 0) return null;
    const sorted = [...poops].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    const last = new Date(sorted[0].ts).getTime();
    const diffMs = Date.now() - last;
    const hours = Math.floor(diffMs / (3600 * 1000));
    const days = Math.floor(hours / 24);
    return { hours, days, totalMs: diffMs };
  }, [poops]);

  // Warning if >24h
  const showWarning = timeSince && timeSince.hours >= 24;
  const warnIdx = useMemo(() => {
    if (!showWarning) return 1;
    return 1 + Math.floor(Math.random() * 12);
  }, [showWarning, open]);

  // Food correlation: which foods eaten within 24h before a poop
  const correlation = useMemo(() => {
    return computeBowelFoodCorrelation(food, poops);
  }, [food, poops]);

  function handleAdd() {
    addPoop(consistency);
    // Show XP toast
    const todayPoopsCount = poops.filter((p) => dateKey(new Date(p.ts)) === dateKey(new Date())).length;
    if (todayPoopsCount < 3) {
      toast(t("bowel_xp_gain" as never), { icon: "✅", duration: 1500 });
    } else {
      toast(t("bowel_xp_capped" as never), { icon: "📊", duration: 1500 });
    }
  }

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚽 {t("bowel_tracker" as never)}
          </DialogTitle>
        </DialogHeader>

        {/* Disabled hint */}
        {!bowelTrackingEnabled ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{t("bowel_disabled_hint" as never)}</p>
            <Button size="sm" onClick={() => setSetting("bowelTrackingEnabled", true)}>
              {t("bowel_enable" as never)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Today count */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("bowel_today" as never)}
              </span>
              <span className="text-2xl font-black tabular-nums">{todayCount}</span>
            </div>

            {/* Time since last */}
            {timeSince && (
              <div className={`rounded-lg px-3 py-2 text-center ${showWarning ? "bg-orange-500/10" : "bg-muted/30"}`}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("bowel_last_time" as never)}
                </p>
                <p className={`text-lg font-bold ${showWarning ? "text-orange-500" : ""}`}>
                  {timeSince.days > 0 ? `${timeSince.days}д ${timeSince.hours % 24}ч` : `${timeSince.hours}ч`}
                </p>
              </div>
            )}

            {/* Warning if >24h */}
            {showWarning && (
              <div className="rounded-xl border-2 border-orange-500/50 bg-orange-500/10 p-3 text-center">
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {t("bowel_warning_subtitle" as never).replace("{h}", String(timeSince?.hours ?? 24))}
                </p>
                <p className="mt-1 text-sm font-black">
                  {t(`bowel_warning_${warnIdx}` as never)}
                </p>
              </div>
            )}

            {/* Consistency selector */}
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("bowel_consistency" as never)}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["hard", "normal", "loose"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setConsistency(c)}
                    className={`rounded-lg border-2 px-2 py-1.5 text-xs font-semibold transition-all ${
                      consistency === c ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t(`bowel_${c}` as never)}
                  </button>
                ))}
              </div>
            </div>

            {/* Add button */}
            <Button onClick={handleAdd} className="w-full" size="lg">
              🚽 {t("bowel_went" as never)}
            </Button>

            {/* 7-day history */}
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("bowel_history" as never)}
              </p>
              {weekPoops.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">{t("bowel_no_records" as never)}</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto thin-scroll">
                  {weekPoops.slice(0, 20).map((p) => {
                    const d = new Date(p.ts);
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                      >
                        <span className="text-base">🚽</span>
                        <div className="flex-1">
                          <p className="font-medium">
                            {d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}{" "}
                            {d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {p.consistency && (
                            <p className="text-[10px] text-muted-foreground">
                              {t(`bowel_${p.consistency}` as never)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removePoop(p.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-destructive/20"
                          aria-label="delete"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Food correlation */}
            {correlation.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("bowel_correlation" as never)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {correlation.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5 text-xs">
                      <span className="font-medium">{c.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {c.avgHours}ч · {c.times}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disable button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                setSetting("bowelTrackingEnabled", false);
                onOpenChange(false);
              }}
            >
              {t("bowel_disable" as never)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Compute correlation: for each food name, average hours between eating and next poop within 24h. */
function computeBowelFoodCorrelation(
  food: FoodEntry[],
  poops: PoopRecord[]
): { name: string; avgHours: number; times: number }[] {
  if (poops.length === 0) return [];
  const byName = new Map<string, { sum: number; times: number }>();

  for (const f of food) {
    const eatTime = new Date(f.ts).getTime();
    // Find next poop within 24h after eating
    let nextPoop: PoopRecord | null = null;
    let minDiff = Infinity;
    for (const p of poops) {
      const poopTime = new Date(p.ts).getTime();
      const diff = poopTime - eatTime;
      if (diff > 0 && diff < FOOD_WINDOW_HOURS * 3600 * 1000 && diff < minDiff) {
        minDiff = diff;
        nextPoop = p;
      }
    }
    if (nextPoop) {
      const hours = +(minDiff / (3600 * 1000)).toFixed(1);
      const cur = byName.get(f.name) ?? { sum: 0, times: 0 };
      cur.sum += hours;
      cur.times++;
      byName.set(f.name, cur);
    }
  }

  return Array.from(byName.entries())
    .map(([name, v]) => ({
      name,
      avgHours: v.times > 0 ? Math.round(v.sum / v.times) : 0,
      times: v.times,
    }))
    .filter((c) => c.times >= 1)
    .sort((a, b) => a.avgHours - b.avgHours); // fastest-triggering first
}
