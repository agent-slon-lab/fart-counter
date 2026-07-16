"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Download, FileJson, FileSpreadsheet, TrendingUp, Trophy, Activity, Calendar as CalIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, dateKey, type FartRecord } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";
import { buildCSV, buildExportPayload, downloadText } from "@/lib/export";

type Period = "week" | "month" | "year";

export function StatsScreen() {
  const { t, lang } = useT();
  const farts = useStore((s) => s.farts);
  const water = useStore((s) => s.water);
  const unlocked = useStore((s) => s.unlockedAchievements);
  const settings = useStore((s) => s.settings);
  const [period, setPeriod] = useState<Period>("week");

  // Build chart data based on period
  const chartData = useMemo(() => buildChartData(farts, period), [farts, period]);

  // Compute aggregate stats for the selected period
  const stats = useMemo(() => computeStats(farts, period), [farts, period]);

  // All-time stats
  const totalAllTime = farts.length;

  // Tag distribution (all-time, since tags are rare)
  const tagStats = useMemo(() => {
    let silent = 0;
    let smelly = 0;
    for (const f of farts) {
      if (f.tags.includes("silent")) silent++;
      if (f.tags.includes("smelly")) smelly++;
    }
    const tagged = silent + smelly;
    const regular = farts.length - new Set(
      farts.filter((f) => f.tags.length > 0).map((f) => f.id)
    ).size;
    return { silent, smelly, regular: Math.max(0, regular), tagged };
  }, [farts]);

  function handleExportCSV() {
    const csv = buildCSV(farts);
    const filename = `fart-counter-${dateKey(new Date())}.csv`;
    const ok = downloadText(filename, csv, "text/csv;charset=utf-8");
    toast(ok ? t("export_success") : t("export_failed"), {
      icon: ok ? "✅" : "⚠️",
    });
  }

  function handleExportJSON() {
    const payload = buildExportPayload(farts, water, settings, unlocked);
    const json = JSON.stringify(payload, null, 2);
    const filename = `fart-counter-backup-${dateKey(new Date())}.json`;
    const ok = downloadText(filename, json, "application/json");
    toast(ok ? t("export_success") : t("export_failed"), {
      icon: ok ? "✅" : "⚠️",
    });
  }

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("stats_title")}</h1>

      {/* Period switcher */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">{t("period_week")}</TabsTrigger>
          <TabsTrigger value="month">{t("period_month")}</TabsTrigger>
          <TabsTrigger value="year">{t("period_year")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Chart */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("chart_title")}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {t("normal_range")}
          </span>
        </div>
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
            {t("no_data_period")}
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -22 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} ${t("farts_label")}`, ""]}
                />
                <ReferenceLine y={10} stroke="#84cc16" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.count < 10
                          ? "var(--chart-3)"
                          : entry.count <= 20
                          ? "var(--chart-1)"
                          : "var(--chart-4)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400" /> &lt;10
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" /> 10–20
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> &gt;20
          </span>
        </div>
      </Card>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("average_per_day")}
          value={stats.average.toFixed(1)}
          suffix={t("farts_label")}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label={t("max_day")}
          value={String(stats.max)}
          suffix={t("farts_label")}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label={t("min_day")}
          value={stats.min === Infinity ? "0" : String(stats.min)}
          suffix={t("farts_label")}
        />
        <StatCard
          icon={<CalIcon className="h-4 w-4" />}
          label={t("total_all_time")}
          value={String(totalAllTime)}
          suffix={t("farts_label")}
        />
      </div>

      {/* Tag distribution */}
      <Card className="p-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          {t("silent_loud_ratio")}
        </p>
        {tagStats.tagged === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            {t("no_data_period")}
          </p>
        ) : (
          <div className="space-y-2">
            <TagBar
              label={`🤫 ${t("silent")}`}
              value={tagStats.silent}
              total={farts.length}
              color="#a855f7"
            />
            <TagBar
              label={`💀 ${t("smelly")}`}
              value={tagStats.smelly}
              total={farts.length}
              color="#ef4444"
            />
            <TagBar
              label={`💨 ${t("regular")}`}
              value={farts.length - tagStats.silent - tagStats.smelly}
              total={farts.length}
              color="#84cc16"
            />
          </div>
        )}
      </Card>

      {/* Export */}
      <Card className="p-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          {t("export_csv")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {t("export_csv")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson className="mr-1.5 h-4 w-4" />
            {t("export_json")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card className="p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black tabular-nums">
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
    </Card>
  );
}

function TagBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ===== chart data builders =====

interface ChartPoint {
  label: string;
  date: string;
  count: number;
}

function buildChartData(farts: FartRecord[], period: Period): ChartPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "week") {
    // Last 7 days
    const points: ChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const k = dateKey(d);
      const count = farts.filter((f) => dateKey(new Date(f.ts)) === k).length;
      points.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        date: k,
        count,
      });
    }
    return points;
  }

  if (period === "month") {
    // Last 30 days, grouped into 6 buckets of 5 days each
    const buckets: ChartPoint[] = [];
    for (let b = 5; b >= 0; b--) {
      const start = new Date(today.getTime() - (b * 5 + 4) * 86400000);
      const end = new Date(today.getTime() - b * 5 * 86400000);
      let count = 0;
      for (const f of farts) {
        const fd = new Date(f.ts);
        fd.setHours(0, 0, 0, 0);
        if (fd >= start && fd <= end) count++;
      }
      buckets.push({
        label: `${start.getDate()}.${start.getMonth() + 1}`,
        date: dateKey(start),
        count,
      });
    }
    return buckets;
  }

  // year — last 12 months
  const months: ChartPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = farts.filter((f) => {
      const fd = new Date(f.ts);
      return fd.getFullYear() === y && fd.getMonth() === m;
    }).length;
    months.push({
      label: d.toLocaleDateString(undefined, { month: "short" }),
      date: `${y}-${String(m + 1).padStart(2, "0")}`,
      count,
    });
  }
  return months;
}

function computeStats(farts: FartRecord[], period: Period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = today.getTime() - (days - 1) * 86400000;

  const counts: number[] = [];
  const byDay = new Map<string, number>();
  for (const f of farts) {
    const fd = new Date(f.ts);
    fd.setHours(0, 0, 0, 0);
    if (fd.getTime() < cutoff) continue;
    const k = dateKey(fd);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  // Include all days in range (even zero days for average)
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    counts.push(byDay.get(dateKey(d)) ?? 0);
  }
  const total = counts.reduce((a, b) => a + b, 0);
  const withRecords = counts.filter((c) => c > 0);
  return {
    total,
    average: counts.length > 0 ? total / counts.length : 0,
    max: withRecords.length > 0 ? Math.max(...withRecords) : 0,
    min: withRecords.length > 0 ? Math.min(...withRecords) : 0,
  };
}
