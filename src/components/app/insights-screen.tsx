"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, TrendingUp, Calendar, CloudSun, Sparkles, Brain, Clock, Zap, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, useProfileFarts, useProfileMoods, useProfileFood, type FartRecord, type MoodDay } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const WEEKDAY_KEYS = ["weekday_mon", "weekday_tue", "weekday_wed", "weekday_thu", "weekday_fri", "weekday_sat", "weekday_sun"];
const FOOD_LIFESPAN_MS = 24 * 60 * 60 * 1000;

export function InsightsScreen() {
  const { t, lang } = useT();
  const farts = useProfileFarts();
  const moods = useProfileMoods();
  const food = useProfileFood();
  const weather = useStore((s) => s.weather);
  const worldRank = useStore((s) => s.worldRank);
  const settings = useStore((s) => s.settings);
  const streak = useStore((s) => s.streak);
  const setSetting = useStore((s) => s.setSetting);
  const recordWeather = useStore((s) => s.recordWeather);

  // ===== Weather =====
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.weatherEnabled) return;

    const todayW = weather.find((w) => w.date === dateKey(new Date()));
    if (todayW) {
      setWeatherLoading(false);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function fetchWeatherByCoords(lat: number, lon: number) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API error");
        const data = await res.json();
        if (cancelled) return;
        const c = data.current;
        const snap = {
          date: dateKey(new Date()),
          tempC: Math.round(c.temperature_2m),
          pressureHpa: Math.round(c.pressure_msl),
          humidity: Math.round(c.relative_humidity_2m),
          condition: String(c.weather_code),
        };
        recordWeather(snap);
        setWeatherErr(null);
      } catch {
        if (!cancelled) setWeatherErr(t("weather_error"));
      } finally {
        if (!cancelled) setWeatherLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    async function tryIPGeolocation() {
      const services = [
        "https://geolocation-db.com/json/",
        "https://ipwho.is/",
        "https://ipapi.co/json/",
      ];
      for (const url of services) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) return;
          const lat = data.latitude || data.lat;
          const lon = data.longitude || data.lon || data.lng;
          if (lat && lon) {
            fetchWeatherByCoords(lat, lon);
            return;
          }
        } catch {
          continue;
        }
      }
      if (!cancelled) {
        setWeatherErr(t("weather_error"));
        setWeatherLoading(false);
      }
    }

    async function fetchWeather() {
      setWeatherLoading(true);
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setWeatherErr(t("weather_error"));
          setWeatherLoading(false);
        }
      }, 10000);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            if (!cancelled) tryIPGeolocation();
          },
          { timeout: 4000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
        );
      } else {
        tryIPGeolocation();
      }
    }
    fetchWeather();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [settings.weatherEnabled, recordWeather, t]);

  const todayWeather = weather.find((w) => w.date === dateKey(new Date()));

  function weatherMessage(): string | null {
    if (!todayWeather) return null;
    const { tempC, pressureHpa, humidity, condition } = todayWeather;
    const code = parseInt(condition ?? "0", 10);
    if (code >= 95) return t("weather_storm");
    if (code === 0 || code === 1) return t("weather_clear");
    if (humidity && humidity > 80) return t("weather_humidity_high");
    if (pressureHpa && pressureHpa < 1005) return t("weather_pressure_low");
    if (pressureHpa && pressureHpa > 1020) return t("weather_pressure_high");
    if (tempC !== undefined && tempC < 5) return t("weather_temp_cold");
    if (tempC !== undefined && tempC > 28) return t("weather_temp_hot");
    if (code >= 50 && code < 60) return t("weather_wind");
    return null;
  }

  // ===== Weekly cycle (NEW: show from day 1, with averages + share %) =====
  const weeklyCycle = useMemo(() => {
    // total counts per weekday (Mon=0..Sun=6)
    const counts = [0, 0, 0, 0, 0, 0, 0];
    // distinct days with records per weekday (for averaging)
    const daysPerWeekday: Set<string>[] = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
    const seenDays = new Set<string>();
    for (const f of farts) {
      const d = new Date(f.ts);
      const jsDay = d.getDay(); // 0=Sun..6=Sat
      const monIdx = (jsDay + 6) % 7; // 0=Mon..6=Sun
      counts[monIdx]++;
      const dk = dateKey(d);
      daysPerWeekday[monIdx].add(dk);
      seenDays.add(dk);
    }
    // average per weekday = total / distinct days
    const avg = counts.map((c, i) => (daysPerWeekday[i].size > 0 ? +(c / daysPerWeekday[i].size).toFixed(1) : 0));
    const max = Math.max(...counts);
    const maxAvg = Math.max(...avg);
    const minAvg = Math.min(...avg);
    const peakIdx = max > 0 ? counts.indexOf(max) : -1;
    // low = weekday with min average (but only among weekdays that have data)
    const lowIdx = avg.findIndex((a, i) => a === minAvg && daysPerWeekday[i].size > 0);
    const totalFarts = counts.reduce((a, b) => a + b, 0);
    const todayMonIdx = (new Date().getDay() + 6) % 7;
    return {
      counts,
      avg,
      max,
      maxAvg,
      minAvg,
      peakIdx,
      lowIdx,
      daysTracked: seenDays.size,
      totalFarts,
      todayMonIdx,
      daysPerWeekdayCount: daysPerWeekday.map((s) => s.size),
    };
  }, [farts]);

  // ===== Monthly trend (NEW: with actual numbers + sparkline) =====
  const trend = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonth = farts.filter((f) => new Date(f.ts) >= thisMonthStart).length;
    const lastMonth = farts.filter((f) => {
      const d = new Date(f.ts);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    const delta = thisMonth - lastMonth;
    const pct = lastMonth > 0 ? Math.round((delta / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0);

    // Last 30 days sparkline data (count per day)
    const last30: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      last30.push(farts.filter((f) => dateKey(new Date(f.ts)) === key).length);
    }
    // last 7 days sum
    const last7 = last30.slice(-7).reduce((a, b) => a + b, 0);
    const prev7 = last30.slice(-14, -7).reduce((a, b) => a + b, 0);
    const weekDelta = last7 - prev7;
    // daily average over last 30 days
    const dailyAvg = +(last30.reduce((a, b) => a + b, 0) / 30).toFixed(1);
    // best/worst day in last 30
    const maxIdx = last30.indexOf(Math.max(...last30));
    const minIdx = last30.indexOf(Math.min(...last30));

    let direction: "up" | "down" | "stable" = "stable";
    if (delta > 2) direction = "up";
    else if (delta < -2) direction = "down";

    return {
      thisMonth,
      lastMonth,
      delta,
      pct,
      direction,
      last30,
      last7,
      prev7,
      weekDelta,
      dailyAvg,
      maxIdx,
      minIdx,
    };
  }, [farts]);

  // ===== Hourly breakdown (NEW) =====
  const hourly = useMemo(() => {
    // 4 periods: Night 0-6, Morning 6-12, Afternoon 12-18, Evening 18-24
    const periods = [0, 0, 0, 0];
    for (const f of farts) {
      const h = new Date(f.ts).getHours();
      const idx = Math.floor(h / 6);
      periods[idx]++;
    }
    const total = periods.reduce((a, b) => a + b, 0);
    const max = Math.max(...periods);
    const peakIdx = max > 0 ? periods.indexOf(max) : -1;
    const periodKeys = ["hourly_night", "hourly_morning", "hourly_afternoon", "hourly_evening"];
    const shares = periods.map((p) => (total > 0 ? Math.round((p / total) * 100) : 0));
    return { periods, max, peakIdx, total, periodKeys, shares };
  }, [farts]);

  // ===== Prediction (enhanced with weekday average) =====
  const prediction = useMemo(() => {
    if (farts.length < 3) return null;
    // Average farts per weekday based on history (using distinct days)
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const daysSet: Set<string>[] = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
    for (const f of farts) {
      const d = new Date(f.ts);
      const jsDay = d.getDay();
      const monIdx = (jsDay + 6) % 7;
      counts[monIdx]++;
      daysSet[monIdx].add(dateKey(d));
    }
    const todayMonIdx = (new Date().getDay() + 6) % 7;
    const todayDays = daysSet[todayMonIdx].size;
    const todayCounts = counts[todayMonIdx];
    const avgToday = todayDays > 0 ? todayCounts / todayDays : 0;
    // Overall daily average
    const totalDays = new Set(farts.map((f) => dateKey(new Date(f.ts)))).size;
    const overallAvg = totalDays > 0 ? farts.length / totalDays : 0;
    // Expected today: blend of weekday avg and overall avg
    const expected = todayDays >= 3
      ? Math.round(avgToday)
      : Math.round(overallAvg);
    const confidence = Math.min(100, Math.round((totalDays / 14) * 100));
    return { expected, confidence, avgToday: +avgToday.toFixed(1), overallAvg: +overallAvg.toFixed(1) };
  }, [farts]);

  // ===== World rank =====
  const sortedRank = useMemo(() => {
    return Object.entries(worldRank).sort((a, b) => b[1] - a[1]);
  }, [worldRank]);
  const myCountry = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop() || "Unknown";
  const myRank = sortedRank.findIndex(([c]) => c === myCountry) + 1;

  // ===== AI Insights (NEW: rule-based pattern detection) =====
  const aiInsights = useMemo(() => {
    const insights: string[] = [];
    if (farts.length < 3) return insights;

    // 1. Top weekday insight
    if (weeklyCycle.peakIdx >= 0 && weeklyCycle.daysPerWeekdayCount[weeklyCycle.peakIdx] >= 2) {
      insights.push(
        t("ai_insight_weekday" as never)
          .replace("{day}", t(WEEKDAY_KEYS[weeklyCycle.peakIdx] as never))
          .replace("{n}", String(weeklyCycle.avg[weeklyCycle.peakIdx]))
      );
    }

    // 2. Peak hour period
    if (hourly.peakIdx >= 0 && hourly.total >= 5) {
      insights.push(
        t("ai_insight_hour" as never)
          .replace("{period}", t(hourly.periodKeys[hourly.peakIdx] as never).toLowerCase())
          .replace("{pct}", String(hourly.shares[hourly.peakIdx]))
      );
    }

    // 3. Streak
    if (streak >= 3) {
      insights.push(t("ai_insight_streak" as never).replace("{n}", String(streak)));
    }

    // 4. Food correlation (top trigger)
    const foodCorr = computeFoodCorrelation(food, farts);
    if (foodCorr.length > 0 && foodCorr[0].times >= 2 && foodCorr[0].avgFarts >= 3) {
      insights.push(
        t("ai_insight_food" as never)
          .replace("{food}", foodCorr[0].name)
          .replace("{n}", String(foodCorr[0].avgFarts))
      );
    }

    // 5. Monthly delta
    if (trend.delta !== 0 && trend.lastMonth > 0) {
      if (trend.delta < 0) {
        insights.push(t("ai_insight_improvement" as never).replace("{n}", String(Math.abs(trend.delta))));
      } else {
        insights.push(t("ai_insight_increase" as never).replace("{n}", String(trend.delta)));
      }
    }

    // 6. Weekend vs weekday
    const weekdayCount = weeklyCycle.counts.slice(0, 5).reduce((a, b) => a + b, 0);
    const weekendCount = weeklyCycle.counts.slice(5).reduce((a, b) => a + b, 0);
    if (weekdayCount + weekendCount >= 10) {
      // Adjust for 5 vs 2 days
      const weekdayPerDay = weekdayCount / 5;
      const weekendPerDay = weekendCount / 2;
      if (weekendPerDay > weekdayPerDay * 1.3) {
        const pct = Math.round(((weekendPerDay - weekdayPerDay) / weekdayPerDay) * 100);
        insights.push(t("ai_insight_weekend" as never).replace("{pct}", String(pct)));
      } else if (weekdayPerDay > weekendPerDay * 1.3) {
        const pct = Math.round(((weekdayPerDay - weekendPerDay) / weekendPerDay) * 100);
        insights.push(t("ai_insight_weekday_more" as never).replace("{pct}", String(pct)));
      }
    }

    // 7. Daily average vs medical norm (10-20)
    if (trend.dailyAvg > 0) {
      const avgInt = Math.round(trend.dailyAvg);
      if (avgInt >= 10 && avgInt <= 20) {
        insights.push(t("ai_insight_norm" as never).replace("{n}", String(avgInt)));
      } else if (avgInt > 20) {
        insights.push(t("ai_insight_above_norm" as never).replace("{n}", String(avgInt)));
      } else if (avgInt < 10) {
        insights.push(t("ai_insight_below_norm" as never).replace("{n}", String(avgInt)));
      }
    }

    // 8. Silent/smelly ratio
    const silentCount = farts.filter((f) => f.tags?.includes("silent")).length;
    const smellyCount = farts.filter((f) => f.tags?.includes("smelly")).length;
    if (farts.length >= 10) {
      if (silentCount / farts.length >= 0.4) {
        const pct = Math.round((silentCount / farts.length) * 100);
        insights.push(t("ai_insight_silent_ratio" as never).replace("{pct}", String(pct)));
      }
      if (smellyCount / farts.length >= 0.4) {
        const pct = Math.round((smellyCount / farts.length) * 100);
        insights.push(t("ai_insight_smelly_ratio" as never).replace("{pct}", String(pct)));
      }
    }

    // 9. Mood correlation (if we have moods)
    if (moods.length >= 3 && farts.length >= 5) {
      const moodCounts: Record<string, number[]> = {};
      for (const m of moods) {
        const dayFarts = farts.filter((f) => dateKey(new Date(f.ts)) === m.date).length;
        if (!moodCounts[m.mood]) moodCounts[m.mood] = [];
        moodCounts[m.mood].push(dayFarts);
      }
      // Find mood with highest average farts
      let bestMood: string | null = null;
      let bestAvg = 0;
      for (const [mood, counts] of Object.entries(moodCounts)) {
        if (counts.length >= 2) {
          const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            bestMood = mood;
          }
        }
      }
      if (bestMood && bestAvg >= 5) {
        const moodKey = `mood_${bestMood}` as never;
        insights.push(
          t("ai_insight_mood" as never)
            .replace("{mood}", t(moodKey))
            .replace("{n}", String(Math.round(bestAvg)))
        );
      }
    }

    return insights;
  }, [farts, moods, food, weeklyCycle, hourly, trend, streak, t]);

  function handleShareRank() {
    const text = t("map_rank_format").replace("{n}", String(myRank || 0));
    const navAny = navigator as Navigator & { share?: (d: { text?: string; title?: string }) => Promise<void> };
    if (navAny.share) {
      navAny.share({ title: t("map_section"), text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => toast(t("share_app_link_copied"), { icon: "📋" }));
    }
  }

  function toggleWeather() {
    setSetting("weatherEnabled", !settings.weatherEnabled);
  }

  function toggleGeo() {
    setSetting("geoEnabled", !settings.geoEnabled);
  }

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("tab_insights")}</h1>

      {/* AI Insights (NEW - most engaging, shown first) */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-primary">{t("ai_section" as never)}</span>
          </div>
          {aiInsights.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {aiInsights.length} {t("ai_insights_count" as never)}
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("ai_desc" as never)}</p>
        {aiInsights.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("ai_no_insights" as never)}</p>
        ) : (
          <div className="space-y-2">
            {aiInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
              >
                {insight}
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Weather */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="h-4 w-4 text-amber-500" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("weather_section")}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleWeather}>
            {settings.weatherEnabled ? "ON" : "OFF"}
          </Button>
        </div>
        {!settings.weatherEnabled ? (
          <Button variant="outline" size="sm" onClick={toggleWeather} className="w-full">
            {t("weather_enable")}
          </Button>
        ) : weatherLoading ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("weather_loading")}</p>
        ) : weatherErr ? (
          <p className="py-3 text-center text-sm text-destructive">{weatherErr}</p>
        ) : todayWeather ? (
          <div>
            <div className="mb-2 flex items-baseline gap-3">
              <span className="text-3xl font-black tabular-nums">{todayWeather.tempC}°C</span>
              <span className="text-xs text-muted-foreground">
                {todayWeather.pressureHpa} hPa · {todayWeather.humidity}%
              </span>
            </div>
            {weatherMessage() && (
              <p className="rounded-md bg-primary/10 px-2 py-1.5 text-xs text-primary">{weatherMessage()}</p>
            )}
          </div>
        ) : null}
      </Card>

      {/* Prediction (enhanced) */}
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("prediction_section")}</span>
        </div>
        {prediction ? (
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("prediction_coming")}</p>
                <p className="text-4xl font-black tabular-nums text-primary">{prediction.expected}</p>
                <p className="text-xs text-muted-foreground">{t("farts_label")}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">confidence</p>
                <p className="text-lg font-bold tabular-nums">{prediction.confidence}%</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("trend_daily_avg" as never)}: {prediction.overallAvg} · {t(WEEKDAY_KEYS[weeklyCycle.todayMonIdx] as never)}: {prediction.avgToday}
            </p>
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">{t("prediction_no_data")}</p>
        )}
      </Card>

      {/* Weekly cycle (NEW: shows from day 1, with averages + share %) */}
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("cycles_weekly")}</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("cycles_weekly_desc")}</p>
        {weeklyCycle.totalFarts === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("cycles_no_data")}</p>
        ) : (
          <>
            {/* Chart: taller (h-56=224px) with count on top, bar fills most space, labels at bottom */}
            <div className="flex h-56 items-end justify-between gap-2">
              {weeklyCycle.counts.map((c, i) => {
                const heightPct = weeklyCycle.max > 0 ? (c / weeklyCycle.max) * 100 : 0;
                const isToday = i === weeklyCycle.todayMonIdx;
                const isPeak = i === weeklyCycle.peakIdx;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full">
                    {/* Count on top — fixed height so it doesn't eat bar space */}
                    <span className={`text-[11px] font-bold tabular-nums leading-none ${isToday ? "text-primary" : ""}`}>
                      {c}
                    </span>
                    {/* Bar area — takes all remaining space */}
                    <div className="flex w-full flex-1 items-end min-h-[80px]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, c > 0 ? 8 : 2)}%` }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                        className={`w-full rounded-t-lg min-h-[3px] transition-colors ${
                          isToday
                            ? "bg-primary"
                            : isPeak
                            ? "bg-primary/70"
                            : "bg-muted-foreground/40"
                        }`}
                        style={{ minHeight: c > 0 ? 8 : 3 }}
                      />
                    </div>
                    {/* Weekday label */}
                    <span className={`text-[10px] font-medium leading-none ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {t(WEEKDAY_KEYS[i] as never)}
                    </span>
                    {/* Average below */}
                    <span className="text-[9px] text-muted-foreground leading-none tabular-nums">
                      {weeklyCycle.daysPerWeekdayCount[i] > 0 ? `~${weeklyCycle.avg[i]}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-primary" /> {t("cycles_today" as never)}
              </span>
              <span>·</span>
              <span>{t("cycles_avg_label" as never)}: {t("cycles_days_count" as never)} {weeklyCycle.daysTracked}</span>
            </div>
            {/* Insight text */}
            {weeklyCycle.peakIdx >= 0 && weeklyCycle.lowIdx >= 0 && weeklyCycle.peakIdx !== weeklyCycle.lowIdx && weeklyCycle.minAvg > 0 ? (
              <p className="mt-2 rounded-md bg-primary/10 px-2 py-1.5 text-xs text-primary">
                {t("cycles_peak_vs_low" as never)
                  .replace("{peak}", t(WEEKDAY_KEYS[weeklyCycle.peakIdx] as never))
                  .replace("{n}", (weeklyCycle.maxAvg / weeklyCycle.minAvg).toFixed(1))
                  .replace("{low}", t(WEEKDAY_KEYS[weeklyCycle.lowIdx] as never))}
              </p>
            ) : weeklyCycle.peakIdx >= 0 ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">{t("cycles_no_peak_yet" as never)}</p>
            ) : null}
          </>
        )}
      </Card>

      {/* Hourly breakdown (NEW) */}
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("hourly_section" as never)}</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("hourly_desc" as never)}</p>
        {hourly.total === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("hourly_no_data" as never)}</p>
        ) : (
          <div className="space-y-2">
            {hourly.periods.map((c, i) => {
              const heightPct = hourly.max > 0 ? (c / hourly.max) * 100 : 0;
              const isPeak = i === hourly.peakIdx;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground">
                    {t(hourly.periodKeys[i] as never)}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-md bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${heightPct}%` }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                        className={`h-full rounded-md ${isPeak ? "bg-primary" : "bg-muted-foreground/40"}`}
                      />
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right text-[11px] font-bold tabular-nums">
                    {c} {hourly.shares[i] > 0 && <span className="font-normal text-muted-foreground">· {hourly.shares[i]}%</span>}
                  </span>
                </div>
              );
            })}
            {hourly.peakIdx >= 0 && (
              <p className="pt-1 text-center text-xs text-primary">
                {t("hourly_peak_at" as never).replace("{period}", t(hourly.periodKeys[hourly.peakIdx] as never).toLowerCase())}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Monthly trend (NEW: with numbers + sparkline) */}
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className={`h-4 w-4 ${trend.direction === "up" ? "text-red-500" : trend.direction === "down" ? "text-green-500" : "text-muted-foreground"}`} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("cycles_trend")}</span>
        </div>

        {/* Big trend number + delta */}
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_this_month" as never)}</p>
            <p className="text-3xl font-black tabular-nums">{trend.thisMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_last_month" as never)}</p>
            <p className="text-xl font-bold tabular-nums text-muted-foreground">{trend.lastMonth}</p>
          </div>
        </div>

        {/* Delta badge */}
        {trend.lastMonth > 0 && (
          <div className={`mb-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
            trend.direction === "up"
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : trend.direction === "down"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}>
            {trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➡️"}
            {trend.delta > 0 ? "+" : ""}{trend.delta} ({trend.pct > 0 ? "+" : ""}{trend.pct}%)
          </div>
        )}

        {/* Sparkline: last 30 days */}
        <div className="mb-2">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_30days" as never)}</p>
          <div className="flex h-12 items-end gap-px">
            {trend.last30.map((c, i) => {
              const max = Math.max(...trend.last30, 1);
              const heightPct = (c / max) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/60 transition-colors hover:bg-primary"
                  style={{ height: `${Math.max(heightPct, c > 0 ? 15 : 3)}%` }}
                  title={`${c}`}
                />
              );
            })}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_7days" as never)}</p>
            <p className="text-lg font-bold tabular-nums">{trend.last7}</p>
            {trend.prev7 > 0 && (
              <p className={`text-[10px] tabular-nums ${trend.weekDelta > 0 ? "text-red-500" : trend.weekDelta < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                {trend.weekDelta > 0 ? "+" : ""}{trend.weekDelta} vs prev
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_daily_avg" as never)}</p>
            <p className="text-lg font-bold tabular-nums">{trend.dailyAvg}</p>
            <p className="text-[10px] text-muted-foreground">/day</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("trend_best_day" as never)}</p>
            <p className="text-lg font-bold tabular-nums">{trend.last30[trend.maxIdx] || 0}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(new Date().getTime() - (29 - trend.maxIdx) * 86400000).toLocaleDateString(locale, { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
      </Card>

      {/* World rank — Coming Soon */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("map_section")}</span>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center">
          <div className="mb-2 text-3xl">🌍</div>
          <p className="text-sm font-bold">{t("map_coming_soon")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("map_coming_soon_desc")}</p>
        </div>
        {sortedRank.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("map_world_ranking")}
            </p>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{myCountry}</p>
              <p className="text-2xl font-black text-primary">
                {myRank > 0 ? `#${myRank}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {worldRank[myCountry] ?? 0} 💨
              </p>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 h-7 w-full text-xs" onClick={handleShareRank}>
              {t("map_share_rank")}
            </Button>
          </div>
        )}
      </Card>

      {/* Geo toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("map_enable")}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleGeo}>
            {settings.geoEnabled ? "ON" : "OFF"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Food correlation helper (24h window after eating) */
function computeFoodCorrelation(
  food: { id: string; ts: string; name: string; profileId?: string }[],
  farts: FartRecord[]
): { name: string; avgFarts: number; times: number }[] {
  const now = Date.now();
  const byName = new Map<string, { sum: number; times: number }>();
  for (const f of food) {
    const start = new Date(f.ts).getTime();
    // Only count farts within 24h after eating AND not in the future
    const end = Math.min(start + FOOD_LIFESPAN_MS, now);
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
