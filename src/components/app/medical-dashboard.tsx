"use client";

import { useMemo, useState } from "react";
import { Clock, TrendingUp, PieChart, AlertTriangle, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useProfilePoops, useProfileFood, dateKey } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import {
  computeHourlyHeatmap,
  computeLagWindows,
  computeRiskRatios,
  computeFodmapProfile,
  hourToPartKey,
  type RiskRatioResult,
} from "@/lib/medical-analytics";
import { FODMAP_LABELS } from "@/lib/fodmap";

type Period = 7 | 14 | 30 | 90;

interface Props {
  /** When rendered inside the medical PDF report (print mode) */
  forPrint?: boolean;
  /** Override period (otherwise show selector) */
  fixedPeriod?: Period;
  /** Compact display (smaller cards) */
  compact?: boolean;
}

/**
 * MedicalDashboard — clinically-oriented summary used in both:
 * - insights-screen.tsx (interactive, with period selector)
 * - medical-report.tsx (print-friendly, fixed 30-day period)
 *
 * Sections:
 * 1. Hourly heatmap (24 cells, color-coded by density)
 * 2. Lag-window reactions (0-2h / 2-6h / 6-24h)
 * 3. Risk Ratio table (RR + 95% CI for each food ≥3 exposures)
 * 4. FODMAP profile (distribution of food by category)
 */
export function MedicalDashboard({ forPrint = false, fixedPeriod, compact = false }: Props) {
  const { t, lang } = useT();
  const poops = useProfilePoops();
  const food = useProfileFood();
  const [period, setPeriod] = useState<Period>(fixedPeriod ?? 7);

  const periodMs = period * 24 * 3600 * 1000;
  const now = Date.now();
  const startDate = new Date(now - periodMs);

  const periodPoops = useMemo(
    () => poops.filter((p) => new Date(p.ts).getTime() >= startDate.getTime()),
    [poops, period]
  );
  const periodFood = useMemo(
    () => food.filter((f) => new Date(f.ts).getTime() >= startDate.getTime()),
    [food, period]
  );

  const heatmap = useMemo(() => computeHourlyHeatmap(periodPoops), [periodPoops]);
  const lag = useMemo(() => computeLagWindows(periodFood, periodPoops), [periodFood, periodPoops]);

  const riskResults = useMemo(
    () =>
      computeRiskRatios(periodFood, periodPoops, (key) => {
        // Try i18n key first, fall back to raw name
        return t(`food_${key.replace("food_", "")}` as never) ?? key;
      }),
    [periodFood, periodPoops, t, lang]
  );

  const fodmap = useMemo(() => computeFodmapProfile(periodFood), [periodFood]);

  const hasAnyData = periodPoops.length > 0 || periodFood.length > 0;
  if (!hasAnyData) {
    return (
      <Card className={`p-4 ${forPrint ? "border" : ""}`}>
        <p className="py-3 text-center text-sm text-muted-foreground">
          {t("lag_window_no_data" as never)}
        </p>
      </Card>
    );
  }

  const pad = compact ? "p-3" : "p-4";

  return (
    <div className={forPrint ? "space-y-3" : "space-y-4"}>
      {/* Period selector (only when interactive) */}
      {!forPrint && !fixedPeriod && (
        <Card className={`${pad}`}>
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("medical_dashboard_section" as never)}
            </span>
          </div>
          <div className="flex gap-2">
            {([7, 14, 30] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 rounded-lg border-2 px-2 py-1.5 text-xs font-semibold transition-all ${
                  period === p ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                {p === 7 && t("medical_dashboard_7d" as never)}
                {p === 14 && t("medical_dashboard_14d" as never)}
                {p === 30 && t("medical_dashboard_30d" as never)}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Heatmap */}
      <Card className={`${pad}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("heatmap_title" as never)}
            </span>
          </div>
          {heatmap.peakHour >= 0 && (
            <span className="text-[10px] text-muted-foreground">
              {t("heatmap_peak" as never)}: {String(heatmap.peakHour).padStart(2, "0")}:00 · {t(hourToPartKey(heatmap.peakHour) as never)}
            </span>
          )}
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">{t("heatmap_desc" as never)}</p>

        {heatmap.total === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("lag_window_no_data" as never)}</p>
        ) : (
          <div>
            <div className="grid grid-cols-12 gap-0.5 sm:grid-cols-24">
              {heatmap.counts.map((c, h) => {
                const intensity = heatmap.max > 0 ? c / heatmap.max : 0;
                const color = heatColor(intensity);
                return (
                  <div
                    key={h}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: color }}
                    title={`${String(h).padStart(2, "0")}:00 — ${c}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>{t("heatmap_legend_low" as never)}</span>
              <div className="flex gap-0.5">
                {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                  <div key={v} className="h-2 w-3 rounded-sm" style={{ backgroundColor: heatColor(v) }} />
                ))}
              </div>
              <span>{t("heatmap_legend_high" as never)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Lag Windows */}
      <Card className={`${pad}`}>
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("lag_window_section" as never)}
          </span>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">{t("lag_window_desc" as never)}</p>

        {lag.every((w) => w.reactions === 0) ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("lag_window_no_data" as never)}</p>
        ) : (
          <div className="space-y-1.5">
            {lag.map((w) => {
              const wKey = `lag_window_${w.windowId.replace("-", "_").replace("h", "")}` as never;
              const pct = w.share;
              return (
                <div key={w.windowId} className="flex items-center gap-2 text-xs">
                  <span className="w-32 shrink-0 font-medium">{t(wKey)}</span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-primary/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
                    {w.reactions}/{w.totalFoodWithResponse} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Risk Ratio */}
      <Card className={`${pad}`}>
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("risk_ratio" as never)}
          </span>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">{t("risk_ratio_desc" as never)}</p>

        {riskResults.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("risk_min_samples" as never)}</p>
        ) : (
          <div className="space-y-1.5">
            {riskResults.slice(0, 8).map((r) => (
              <RiskRatioRow key={r.key} r={r} t={t} />
            ))}
          </div>
        )}
      </Card>

      {/* FODMAP Profile */}
      <Card className={`${pad}`}>
        <div className="mb-2 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("fodmap_section" as never)}
          </span>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">{t("report_fodmap_desc" as never)}</p>

        {fodmap.every((e) => e.count === 0) ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("lag_window_no_data" as never)}</p>
        ) : (
          <div className="space-y-1.5">
            {fodmap
              .filter((e) => e.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((e) => (
                <div key={e.category} className="flex items-center gap-2 text-xs">
                  <span className="w-6 shrink-0 text-base">{e.label.emoji}</span>
                  <span className="w-32 shrink-0 font-medium">
                    {lang === "ru" ? e.label.ru : e.label.en}
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-primary/70"
                      style={{ width: `${e.share}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                    {e.count} · {e.share}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RiskRatioRow({ r, t }: { r: RiskRatioResult; t: (k: never) => string }) {
  // Interpret RR
  let badge: { label: string; color: string };
  if (r.rr === Infinity) {
    badge = { label: t("risk_ratio_high" as never), color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40" };
  } else if (r.rr >= 2) {
    badge = { label: t("risk_ratio_high" as never), color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40" };
  } else if (r.rr > 1) {
    badge = { label: t("risk_ratio_neutral" as never), color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40" };
  } else if (r.rr > 0 && r.rr < 1) {
    badge = { label: t("risk_ratio_protective" as never), color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40" };
  } else {
    badge = { label: t("risk_ratio_neutral" as never), color: "bg-muted text-muted-foreground border-border" };
  }

  const rrDisplay = r.rr === Infinity ? "∞" : r.rr.toFixed(2);
  const ciLow = r.ciLow === 0 ? "0" : r.ciLow.toFixed(2);
  const ciHigh = r.ciHigh === Infinity ? "∞" : r.ciHigh.toFixed(2);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold">{r.name}</span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${badge.color}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="tabular-nums">
          RR {rrDisplay} ({ciLow}–{ciHigh})
        </span>
        <span className="tabular-nums">
          {r.symptomaticExposed}/{r.exposures} {t("risk_ratio_exposed" as never)} ·{" "}
          {r.symptomaticUnexposed}/{r.unexposed} {t("risk_ratio_unexposed" as never)}
        </span>
      </div>
    </div>
  );
}

/**
 * Returns a Tailwind-friendly inline color for given intensity 0..1.
 * Low → light gray, high → green/red gradient based on intensity.
 */
function heatColor(intensity: number): string {
  if (intensity === 0) return "rgba(0,0,0,0.04)";
  // Interpolate from light-green → strong primary
  const i = Math.min(1, Math.max(0, intensity));
  // 220 (light green) → 142 (lime-500) hue shift via simple RGB blend
  const r = Math.round(220 + (132 - 220) * i);
  const g = Math.round(252 + (204 - 252) * i);
  const b = Math.round(231 + (25 - 231) * i);
  return `rgb(${r}, ${g}, ${b})`;
}
