"use client";

import { useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore, dateKey, useProfileFarts, useProfilePoops, useProfileFood, useProfileWater, useProfileWalks, type FartRecord, type PoopRecord, type FoodEntry, type WaterDay, type WalkRecord } from "@/lib/store";
import { useT } from "@/hooks/use-t";

type Period = 7 | 30 | 90;

export function MedicalReport({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang } = useT();
  const farts = useProfileFarts();
  const poops = useProfilePoops();
  const food = useProfileFood();
  const water = useProfileWater();
  const walks = useProfileWalks();
  const [period, setPeriod] = useState<Period>(30);

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  // Filter data by period
  const periodMs = period * 24 * 3600 * 1000;
  const now = Date.now();
  const startDate = new Date(now - periodMs);

  const periodFarts = useMemo(() => farts.filter((f) => new Date(f.ts).getTime() >= startDate.getTime()), [farts, period]);
  const periodPoops = useMemo(() => poops.filter((p) => new Date(p.ts).getTime() >= startDate.getTime()), [poops, period]);
  const periodFood = useMemo(() => food.filter((f) => new Date(f.ts).getTime() >= startDate.getTime()), [food, period]);
  const periodWalks = useMemo(() => walks.filter((w) => new Date(w.ts).getTime() >= startDate.getTime()), [walks, period]);

  // Days tracked (distinct days with ANY record)
  const daysTracked = useMemo(() => {
    const days = new Set<string>();
    [...periodFarts, ...periodPoops].forEach((r) => days.add(dateKey(new Date(r.ts))));
    return days.size;
  }, [periodFarts, periodPoops]);

  // Averages
  const avgFarts = daysTracked > 0 ? (periodFarts.length / daysTracked).toFixed(1) : "0";
  const avgPoops = daysTracked > 0 ? (periodPoops.length / daysTracked).toFixed(1) : "0";
  const avgWater = daysTracked > 0 ? (water.filter((w) => new Date(w.date).getTime() >= startDate.getTime()).reduce((s, w) => s + w.count, 0) / daysTracked).toFixed(1) : "0";
  const walksWeek = periodWalks.length > 0 ? Math.round((periodWalks.length / period) * 7) : 0;

  // Bristol distribution
  const bristolDist = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    periodPoops.forEach((p) => {
      if (p.bristolType) dist[p.bristolType]++;
    });
    return dist;
  }, [periodPoops]);
  const maxBristol = Math.max(...Object.values(bristolDist), 1);

  // Food triggers (correlation with farts)
  const fartTriggers = useMemo(() => computeFartFoodCorrelation(periodFood, periodFarts), [periodFood, periodFarts]);
  // Food triggers (correlation with poops — time to next poop)
  const poopTriggers = useMemo(() => computePoopFoodCorrelation(periodFood, periodPoops), [periodFood, periodPoops]);

  // 30-day chart data
  const chartData = useMemo(() => {
    const data: { date: string; farts: number; poops: number }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = dateKey(d);
      const f = periodFarts.filter((r) => dateKey(new Date(r.ts)) === key).length;
      const p = periodPoops.filter((r) => dateKey(new Date(r.ts)) === key).length;
      data.push({ date: key, farts: f, poops: p });
    }
    return data;
  }, [periodFarts, periodPoops, period]);
  const maxChartVal = Math.max(...chartData.map((d) => Math.max(d.farts, d.poops)), 1);

  // Symptoms log
  const symptomsLog = useMemo(() => {
    return periodPoops
      .filter((p) => p.symptoms)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 10);
  }, [periodPoops]);

  const dateRange = `${startDate.toLocaleDateString(locale, { day: "numeric", month: "short" })} — ${new Date().toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📄 {t("report_section" as never)}
          </DialogTitle>
        </DialogHeader>

        {/* Period selector (hidden in print) */}
        <div className="print:hidden flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("report_period" as never)}:</span>
          {([7, 30, 90] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all ${
                period === p ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              {t(`report_period_${p}` as never)}
            </button>
          ))}
        </div>

        {/* Print button */}
        <Button onClick={handlePrint} className="print:hidden w-full" size="lg">
          <Printer className="mr-2 h-4 w-4" />
          {t("report_print" as never)}
        </Button>

        {/* Report content (visible in print) */}
        <div className="report-content rounded-lg border p-4 text-sm">
          {/* Header */}
          <div className="mb-4 border-b pb-3 text-center">
            <h1 className="text-lg font-black">💨 {t("report_title" as never)}</h1>
            <p className="text-xs text-muted-foreground">{t("report_subtitle" as never)}</p>
            <p className="mt-1 text-xs">{t("report_date_range" as never)}: {dateRange}</p>
            <p className="text-xs text-muted-foreground">{daysTracked} {t("report_days_tracked" as never)}</p>
          </div>

          {daysTracked === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("report_no_data" as never)}</p>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider">{t("report_summary" as never)}</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border p-2">
                    <p className="text-muted-foreground">{t("report_avg_farts" as never)}</p>
                    <p className="text-lg font-bold">{avgFarts}</p>
                    <p className="text-[10px] text-muted-foreground">{t("report_norm" as never)}: 10-20</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-muted-foreground">{t("report_avg_poops" as never)}</p>
                    <p className="text-lg font-bold">{avgPoops}</p>
                    <p className="text-[10px] text-muted-foreground">{t("report_norm" as never)}: 1-2</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-muted-foreground">{t("report_water_avg" as never)}</p>
                    <p className="text-lg font-bold">{avgWater}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-muted-foreground">{t("report_walks_week" as never)}</p>
                    <p className="text-lg font-bold">{walksWeek}</p>
                  </div>
                </div>
              </div>

              {/* Bristol distribution */}
              {periodPoops.some((p) => p.bristolType) && (
                <div className="mb-4">
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wider">{t("report_bristol_distribution" as never)}</h2>
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((bt) => {
                      const count = bristolDist[bt];
                      const pct = periodPoops.length > 0 ? Math.round((count / periodPoops.length) * 100) : 0;
                      return (
                        <div key={bt} className="flex items-center gap-2 text-xs">
                          <img
                            src={`/bristol/type${bt}.svg`}
                            alt={`Type ${bt}`}
                            className="h-5 w-7 shrink-0 object-contain"
                          />
                          <span className="w-20 shrink-0">
                            {t("bowel_bristol_type" as never)} {bt}: {t(`bowel_bristol_${bt}` as never)}
                          </span>
                          <div className="flex-1 h-4 bg-muted rounded">
                            <div
                              className={`h-full rounded ${bt === 4 ? "bg-green-500" : bt <= 2 ? "bg-amber-500" : bt >= 6 ? "bg-red-500" : "bg-blue-400"}`}
                              style={{ width: `${(count / maxBristol) * 100}%` }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right tabular-nums">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Food triggers */}
              {(fartTriggers.length > 0 || poopTriggers.length > 0) && (
                <div className="mb-4">
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wider">{t("report_food_triggers" as never)}</h2>
                  {fartTriggers.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-muted-foreground mb-1">💨 {t("report_food_trigger_farts" as never)}:</p>
                      {fartTriggers.slice(0, 5).map((c) => (
                        <div key={c.name} className="flex justify-between text-xs border-b py-0.5">
                          <span>{c.name}</span>
                          <span className="tabular-nums">{c.avgFarts} {t("report_food_trigger_farts" as never)} · {c.times}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {poopTriggers.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">🚽 {t("report_food_trigger_poops" as never)}:</p>
                      {poopTriggers.slice(0, 5).map((c) => (
                        <div key={c.name} className="flex justify-between text-xs border-b py-0.5">
                          <span>{c.name}</span>
                          <span className="tabular-nums">~{c.avgHours}ч · {c.times}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chart */}
              <div className="mb-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider">{t("report_30day_chart" as never)}</h2>
                <div className="flex items-end gap-px h-24 border-b">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-primary/60"
                        style={{ height: `${(d.farts / maxChartVal) * 100}%`, minHeight: d.farts > 0 ? 2 : 0 }}
                        title={`${d.date}: ${d.farts} ${t("report_farts_chart_label" as never)}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-center mt-1 text-muted-foreground">
                  {t("report_farts_chart_label" as never)} ({t("report_period" as never)} {period} {lang === "ru" ? "дн" : "days"})
                </p>
              </div>

              {/* Symptoms log */}
              {symptomsLog.length > 0 && (
                <div className="mb-4">
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wider">{t("report_symptoms_log" as never)}</h2>
                  <div className="space-y-1">
                    {symptomsLog.map((p) => (
                      <div key={p.id} className="text-xs border-b py-0.5">
                        <span className="font-medium">
                          {new Date(p.ts).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                          {new Date(p.ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {p.bristolType && <span className="text-muted-foreground"> · {t("bowel_bristol_type" as never)} {p.bristolType}</span>}
                        <span className="text-amber-600 dark:text-amber-400"> · {p.symptoms}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 border-t pt-2 text-center">
                <p className="text-[10px] text-muted-foreground">{t("report_signature" as never)} · v1.7.5</p>
                <p className="text-[9px] text-muted-foreground italic">{t("report_disclaimer" as never)}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Food → fart correlation: for each food, avg farts in 24h after eating */
function computeFartFoodCorrelation(food: FoodEntry[], farts: FartRecord[]): { name: string; avgFarts: number; times: number }[] {
  const byName = new Map<string, { sum: number; times: number }>();
  const now = Date.now();
  for (const f of food) {
    const start = new Date(f.ts).getTime();
    const end = Math.min(start + 24 * 3600 * 1000, now);
    if (end <= start) continue;
    const count = farts.filter((fr) => {
      const t = new Date(fr.ts).getTime();
      return t >= start && t <= end;
    }).length;
    const cur = byName.get(f.name) ?? { sum: 0, times: 0 };
    cur.sum += count;
    cur.times++;
    byName.set(f.name, cur);
  }
  return Array.from(byName.entries())
    .map(([name, v]) => ({ name, avgFarts: v.times > 0 ? +(v.sum / v.times).toFixed(1) : 0, times: v.times }))
    .sort((a, b) => b.avgFarts - a.avgFarts);
}

/** Food → poop correlation: for each food, avg hours until next poop within 24h */
function computePoopFoodCorrelation(food: FoodEntry[], poops: PoopRecord[]): { name: string; avgHours: number; times: number }[] {
  if (poops.length === 0) return [];
  const byName = new Map<string, { sum: number; times: number }>();
  for (const f of food) {
    const eatTime = new Date(f.ts).getTime();
    let minDiff = Infinity;
    for (const p of poops) {
      const diff = new Date(p.ts).getTime() - eatTime;
      if (diff > 0 && diff < 24 * 3600 * 1000 && diff < minDiff) minDiff = diff;
    }
    if (minDiff < Infinity) {
      const hours = +(minDiff / (3600 * 1000)).toFixed(1);
      const cur = byName.get(f.name) ?? { sum: 0, times: 0 };
      cur.sum += hours;
      cur.times++;
      byName.set(f.name, cur);
    }
  }
  return Array.from(byName.entries())
    .map(([name, v]) => ({ name, avgHours: v.times > 0 ? Math.round(v.sum / v.times) : 0, times: v.times }))
    .sort((a, b) => a.avgHours - b.avgHours);
}

/** CSV export helper */
export function exportCSV() {
  const store = useStore.getState();
  const pid = store.settings.activeProfileId;
  const farts = store.farts.filter((f) => (f.profileId || "me") === pid);
  const poops = store.poops.filter((p) => (p.profileId || "me") === pid);
  const food = store.food.filter((f) => (f.profileId || "me") === pid);
  const walks = store.walks.filter((w) => (w.profileId || "me") === pid);
  const water = store.water.filter((w) => (w.profileId || "me") === pid);

  const rows: string[] = [];
  rows.push("Type,DateTime,BristolType,Symptoms,Minutes,Count,Tags,Notes");

  farts.forEach((f) => {
    rows.push(`Fart,${f.ts},,,,${1},,${(f.tags || []).join(";")}`);
  });
  poops.forEach((p) => {
    rows.push(`Poop,${p.ts},${p.bristolType || ""},${p.symptoms || ""},,,,`);
  });
  food.forEach((f) => {
    rows.push(`Food,${f.ts},,,,,,${f.name}`);
  });
  walks.forEach((w) => {
    rows.push(`Walk,${w.ts},,,${w.minutes || ""},,,,`);
  });
  water.forEach((w) => {
    rows.push(`Water,${w.date}T12:00:00,,,,${w.count},,,`);
  });

  const csv = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fart-counter-export-${dateKey(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
