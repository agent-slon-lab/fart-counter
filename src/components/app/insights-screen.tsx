"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, TrendingUp, Calendar, CloudSun, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, type FartRecord } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const WEEKDAY_KEYS = ["weekday_mon", "weekday_tue", "weekday_wed", "weekday_thu", "weekday_fri", "weekday_sat", "weekday_sun"];

export function InsightsScreen() {
  const { t, lang } = useT();
  const farts = useStore((s) => s.farts);
  const moods = useStore((s) => s.moods);
  const food = useStore((s) => s.food);
  const weather = useStore((s) => s.weather);
  const worldRank = useStore((s) => s.worldRank);
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const recordWeather = useStore((s) => s.recordWeather);
  const contributeToRank = useStore((s) => s.contributeToRank);

  // ===== Weather =====
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.weatherEnabled) return;
    let cancelled = false;
    async function fetchWeather() {
      if (!navigator.geolocation) { setWeatherErr(t("weather_error")); return; }
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            // Free open-meteo API, no key needed
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,pressure,relative_humidity,weather_code`;
            const res = await fetch(url);
            const data = await res.json();
            if (cancelled) return;
            const c = data.current;
            const snap = {
              date: dateKey(new Date()),
              tempC: Math.round(c.temperature_2m),
              pressureHpa: Math.round(c.pressure),
              humidity: Math.round(c.relative_humidity),
              condition: String(c.weather_code),
            };
            recordWeather(snap);
            setWeatherErr(null);
          } catch {
            if (!cancelled) setWeatherErr(t("weather_error"));
          } finally {
            if (!cancelled) setWeatherLoading(false);
          }
        },
        () => {
          if (!cancelled) { setWeatherErr(t("weather_error")); setWeatherLoading(false); }
        },
        { timeout: 5000, maximumAge: 30 * 60 * 1000 }
      );
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [settings.weatherEnabled, recordWeather, t]);

  const todayWeather = weather.find((w) => w.date === dateKey(new Date()));

  function weatherMessage(): string | null {
    if (!todayWeather) return null;
    const { tempC, pressureHpa, humidity, condition } = todayWeather;
    // Storm (code 95-99)
    const code = parseInt(condition ?? "0", 10);
    if (code >= 95) return t("weather_storm");
    if (code === 0 || code === 1) return t("weather_clear");
    if (humidity && humidity > 80) return t("weather_humidity_high");
    if (pressureHpa && pressureHpa < 1005) return t("weather_pressure_low");
    if (pressureHpa && pressureHpa > 1020) return t("weather_pressure_high");
    if (tempC !== undefined && tempC < 5) return t("weather_temp_cold");
    if (tempC !== undefined && tempC > 28) return t("weather_temp_hot");
    if (code >= 50 && code < 60) return t("weather_wind"); // rain-ish but use wind msg
    return null;
  }

  // ===== Weekly cycle =====
  const weeklyCycle = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const f of farts) {
      const day = new Date(f.ts).getDay();
      counts[day]++;
    }
    // reorder Mon-Sun
    const ordered = [...counts.slice(1), counts[0]];
    const max = Math.max(...ordered);
    const min = Math.min(...ordered);
    // peak: day with max count; if all zero, peak = -1 (no peak)
    const peakIdx = max > 0 ? ordered.indexOf(max) : -1;
    const lowIdx = min < max ? ordered.indexOf(min) : -1;
    return { counts: ordered, max, peakIdx, lowIdx };
  }, [farts]);

  // ===== Monthly trend =====
  const trend = useMemo(() => {
    const now = new Date();
    const thisMonth = farts.filter((f) => {
      const d = new Date(f.ts);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = farts.filter((f) => {
      const d = new Date(f.ts);
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
    }).length;
    const delta = thisMonth - lastMonth;
    if (delta > 2) return "up" as const;
    if (delta < -2) return "down" as const;
    return "stable" as const;
  }, [farts]);

  // ===== Prediction (rule-based, no LLM for now) =====
  const prediction = useMemo(() => {
    if (farts.length < 7) return null;
    // avg farts per weekday based on history
    const byWeekday = [[], [], [], [], [], [], []] as number[][];
    for (const f of farts) {
      const d = new Date(f.ts).getDay();
      byWeekday[d].push(1);
    }
    const today = new Date().getDay();
    const todayCounts = byWeekday[today];
    const avgToday = todayCounts.length > 0 ? todayCounts.length : 0;
    const avgAll = farts.length / 7;
    const ratio = avgAll > 0 ? avgToday / avgAll : 1;
    const expected = Math.round(avgAll * ratio);
    return { expected };
  }, [farts]);

  // ===== World rank =====
  const sortedRank = useMemo(() => {
    return Object.entries(worldRank).sort((a, b) => b[1] - a[1]);
  }, [worldRank]);
  const myCountry = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop() || "Unknown";
  const myRank = sortedRank.findIndex(([c]) => c === myCountry) + 1;

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
    if (settings.weatherEnabled) {
      setSetting("weatherEnabled", false);
    } else {
      setSetting("weatherEnabled", true);
    }
  }

  function toggleGeo() {
    setSetting("geoEnabled", !settings.geoEnabled);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("tab_insights")}</h1>

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

      {/* Prediction */}
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("prediction_section")}</span>
        </div>
        {prediction ? (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t("prediction_coming")}</p>
            <p className="text-4xl font-black tabular-nums text-primary">{prediction.expected}</p>
            <p className="text-xs text-muted-foreground">{t("farts_label")}</p>
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">{t("prediction_no_data")}</p>
        )}
      </Card>

      {/* Weekly cycle */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("cycles_weekly")}</span>
        </div>
        <div className="flex h-32 items-end justify-between gap-1.5">
          {weeklyCycle.counts.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(c / weeklyCycle.max) * 100}%` }}
                className="w-full rounded-t-md bg-primary"
                style={{ minHeight: 2 }}
              />
              <span className="text-[9px] font-medium text-muted-foreground">{t(WEEKDAY_KEYS[i] as never)}</span>
              <span className="text-[10px] font-bold tabular-nums">{c}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {weeklyCycle.peakIdx >= 0 && (
            <>
              {t("cycles_peak_day")}: <b className="text-primary">{t(WEEKDAY_KEYS[weeklyCycle.peakIdx] as never)}</b>
              {" · "}
            </>
          )}
          {weeklyCycle.lowIdx >= 0 && (
            <>
              {t("cycles_low_day")}: <b>{t(WEEKDAY_KEYS[weeklyCycle.lowIdx] as never)}</b>
            </>
          )}
          {weeklyCycle.peakIdx < 0 && weeklyCycle.lowIdx < 0 && t("cycles_no_data")}
        </p>
      </Card>

      {/* Monthly trend */}
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("cycles_trend")}</span>
        </div>
        <p className="text-2xl font-black">
          {trend === "up" ? t("cycles_trend_up") : trend === "down" ? t("cycles_trend_down") : t("cycles_trend_stable")}
        </p>
      </Card>

      {/* World rank */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("map_world_ranking")}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleShareRank}>
            {t("map_share_rank")}
          </Button>
        </div>
        {sortedRank.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("map_no_locations")}</p>
        ) : (
          <div>
            <div className="mb-3 rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{myCountry}</p>
              <p className="text-2xl font-black text-primary">
                {myRank > 0 ? `#${myRank}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {worldRank[myCountry] ?? 0} 💨
              </p>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto thin-scroll pr-1">
              {sortedRank.slice(0, 20).map(([country, count], i) => (
                <div
                  key={country}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                    country === myCountry ? "bg-primary/15" : "hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-right text-xs font-bold text-muted-foreground">#{i + 1}</span>
                    <span className="font-medium">{country}</span>
                  </span>
                  <span className="tabular-nums font-bold">{count} 💨</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {t("map_global_total")}: {sortedRank.reduce((s, [, c]) => s + c, 0)} 💨
            </p>
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
