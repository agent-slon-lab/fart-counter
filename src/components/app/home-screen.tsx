"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Droplets, Droplet, Wind, Skull } from "lucide-react";
import { useStore, getTodayCount, getWaterToday, dateKey } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { playFartSound, playWaterSound, primeAudio } from "@/lib/sounds";
import { vibrateFart, vibrateWater } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Puff {
  id: number;
  dx: number;
  color: string;
}

function getZone(count: number): "low" | "normal" | "high" {
  if (count < 10) return "low";
  if (count <= 20) return "normal";
  return "high";
}

export function HomeScreen() {
  const { t, lang } = useT();
  const farts = useStore((s) => s.farts);
  const water = useStore((s) => s.water);
  const addFart = useStore((s) => s.addFart);
  const removeLastFartToday = useStore((s) => s.removeLastFartToday);
  const addWater = useStore((s) => s.addWater);
  const removeWater = useStore((s) => s.removeWater);
  const soundEnabled = useStore((s) => s.settings.soundEnabled);
  const vibEnabled = useStore((s) => s.settings.vibrationEnabled);

  const count = getTodayCount(farts);
  const waterCount = getWaterToday(water);
  const zone = getZone(count);

  const [popping, setPopping] = useState(false);
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const puffIdRef = useRef(0);

  function handleAddFart(tags: ("silent" | "smelly")[] = []) {
    primeAudio();
    addFart(tags);
    if (soundEnabled) playFartSound();
    if (vibEnabled) vibrateFart();
    setPopping(true);
    setTimeout(() => setPopping(false), 320);

    // spawn puffs
    const colors = ["#84cc16", "#facc15", "#f97316", "#a855f7", "#ec4899"];
    const newPuffs: Puff[] = Array.from({ length: 4 }).map(() => ({
      id: ++puffIdRef.current,
      dx: (Math.random() - 0.5) * 120,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setPuffs((p) => [...p, ...newPuffs]);
    setTimeout(() => {
      setPuffs((p) => p.filter((x) => !newPuffs.find((n) => n.id === x.id)));
    }, 950);

    toast(t("toast_fart_added"), {
      duration: 1200,
      icon: "💨",
    });
  }

  function handleUndo() {
    if (count === 0) return;
    removeLastFartToday();
    if (vibEnabled) vibrateFart();
    toast(t("toast_fart_removed"), { duration: 1200, icon: "↩️" });
  }

  function handleWaterAdd() {
    primeAudio();
    addWater();
    if (soundEnabled) playWaterSound();
    if (vibEnabled) vibrateWater();
    toast(t("toast_water_added"), { duration: 1000, icon: "💧" });
  }

  function handleWaterRemove() {
    if (waterCount === 0) return;
    removeWater();
    if (vibEnabled) vibrateWater();
    toast(t("toast_water_removed"), { duration: 1000, icon: "↩️" });
  }

  // Zone styling
  const zoneStyles = {
    low: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-600 dark:text-yellow-400",
      label: t("below_norm"),
      glow: "shadow-yellow-500/20",
    },
    normal: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-600 dark:text-green-400",
      label: t("in_norm"),
      glow: "shadow-green-500/30",
    },
    high: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-600 dark:text-red-400",
      label: t("danger_zone"),
      glow: "shadow-red-500/30",
    },
  }[zone];

  const todayDate = new Date();
  const dateStr = todayDate.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Header: date */}
      <div className="pt-1 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("today")}
        </p>
        <p className="text-sm text-foreground/80">{dateStr}</p>
      </div>

      {/* Counter card */}
      <Card
        className={`relative overflow-hidden border-2 ${zoneStyles.border} ${zoneStyles.bg} ${zoneStyles.glow} p-6 shadow-lg transition-colors`}
      >
        <div className="text-center">
          <motion.div
            className={`text-7xl font-black tabular-nums ${zoneStyles.text} animate-num-pop`}
            key={count}
          >
            {count}
          </motion.div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t("farts_today")}
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${zoneStyles.bg} ${zoneStyles.text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                zone === "low"
                  ? "bg-yellow-500"
                  : zone === "normal"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            {zoneStyles.label}
          </div>
        </div>

        {/* Puff particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {puffs.map((p) => (
              <span
                key={p.id}
                className="puff-particle"
                style={
                  {
                    backgroundColor: p.color,
                    "--dx": `${p.dx}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {/* Big +1 button */}
      <div className="relative flex justify-center py-2">
        <motion.button
          onClick={() => handleAddFart([])}
          whileTap={{ scale: 0.92 }}
          className={`relative flex h-56 w-56 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-shadow ${
            popping ? "animate-fart-pop shadow-primary/50" : "shadow-primary/30"
          }`}
          aria-label={t("add_fart")}
        >
          {/* Ripple */}
          <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-primary/30" />
          <span className="pointer-events-none absolute inset-2 rounded-full ring-2 ring-primary-foreground/20" />
          <Wind className="mb-1 h-12 w-12" strokeWidth={2.5} />
          <span className="text-3xl font-black leading-none">
            +1
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-widest opacity-90">
            {t("add_fart")}
          </span>
        </motion.button>
      </div>

      {/* Tag buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddFart(["silent"])}
          className="flex flex-col items-center gap-1 py-3"
        >
          <Wind className="h-4 w-4 opacity-60" />
          <span className="text-[10px] font-semibold leading-tight">
            {t("silent")}
          </span>
          <span className="text-xs font-black">+1</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddFart(["smelly"])}
          className="flex flex-col items-center gap-1 py-3"
        >
          <Skull className="h-4 w-4 opacity-60" />
          <span className="text-[10px] font-semibold leading-tight">
            {t("smelly")}
          </span>
          <span className="text-xs font-black">+1</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddFart(["silent", "smelly"])}
          className="flex flex-col items-center gap-1 py-3"
        >
          <span className="text-base leading-none">🤫💀</span>
          <span className="text-[9px] font-semibold leading-tight">
            {t("silent")}+{t("smelly")}
          </span>
          <span className="text-xs font-black">+1</span>
        </Button>
      </div>

      {/* Undo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        disabled={count === 0}
        className="text-muted-foreground"
      >
        <Minus className="mr-1 h-4 w-4" />
        {t("cancel_fart")}
      </Button>

      {/* Normal hint */}
      <p className="text-center text-[11px] text-muted-foreground">
        {t("normal_range_hint")}
      </p>

      {/* Water tracker */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold">{t("water_tracker")}</span>
          </div>
          <span className="text-sm font-bold tabular-nums">
            {waterCount} {t("water_glasses")}
          </span>
        </div>

        {/* Glasses visualization */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Array.from({ length: Math.max(8, waterCount) }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ scale: i < waterCount ? 1 : 0.85, opacity: i < waterCount ? 1 : 0.3 }}
              className={`flex h-7 w-6 items-end justify-center rounded-b-md rounded-t-sm border-2 ${
                i < waterCount
                  ? "border-blue-400 bg-blue-400/30"
                  : "border-muted-foreground/30 bg-transparent"
              }`}
            >
              {i < waterCount && (
                <div className="mb-0.5 h-4 w-3 rounded-sm bg-blue-400/80" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleWaterAdd}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Droplet className="mr-1 h-4 w-4" />
            {t("drink_glass")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWaterRemove}
            disabled={waterCount === 0}
          >
            <Minus className="mr-1 h-4 w-4" />
            {t("remove_glass")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
