"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Droplets, Droplet, Wind, Volume2, Lightbulb, Shuffle } from "lucide-react";
import {
  useStore,
  getTodayCount,
  getWaterToday,
  type FartTag,
  type FartSound,
} from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { playFartSound, playWaterSound, primeAudio } from "@/lib/sounds";
import { vibrateFart, vibrateWater } from "@/lib/haptics";
import { getFactOfDay, getRandomFact } from "@/lib/facts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translations } from "@/lib/i18n";

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

const TAG_OPTIONS: { tag: FartTag; icon: string; labelKey: string; sound: FartSound }[] = [
  { tag: "silent", icon: "🤫", labelKey: "silent", sound: "squeak" },
  { tag: "smelly", icon: "💀", labelKey: "smelly", sound: "rumble" },
  { tag: "loud", icon: "📢", labelKey: "loud", sound: "thunder" },
  { tag: "long", icon: "⏱️", labelKey: "long", sound: "deflate" },
  { tag: "toilet", icon: "🚽", labelKey: "toilet", sound: "whoopee" },
  { tag: "accidental", icon: "😰", labelKey: "accidental", sound: "squeaker" },
  { tag: "whisper", icon: "🍃", labelKey: "whisper", sound: "whisper" },
  { tag: "burst", icon: "💥", labelKey: "burst", sound: "burst" },
  { tag: "musical", icon: "🎵", labelKey: "musical", sound: "musical" },
  { tag: "wave", icon: "🌊", labelKey: "wave", sound: "wave" },
  { tag: "frog", icon: "🐸", labelKey: "frog", sound: "frog" },
];

const SOUND_OPTIONS: FartSound[] = [
  "classic",
  "squeaker",
  "rumble",
  "machine_gun",
  "whoopee",
  "thunder",
  "squeak",
  "deflate",
  "whisper",
  "burst",
  "musical",
  "wave",
  "frog",
  "random",
];

// Resolve sound for the central big button:
// - If "random" → pick a random sound from all 13
// - Otherwise → use the configured sound
function resolveBigButtonSound(setting: FartSound): FartSound {
  if (setting === "random") {
    const all = SOUND_OPTIONS.filter((s) => s !== "random");
    return all[Math.floor(Math.random() * all.length)];
  }
  return setting;
}

// Get the bound sound for a tag (always uses tag's own sound, ignoring header setting)
function resolveTagSound(tag: FartTag): FartSound {
  const found = TAG_OPTIONS.find((o) => o.tag === tag);
  return found ? found.sound : "classic";
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
  const fartSound = useStore((s) => s.settings.fartSound);
  const geoEnabled = useStore((s) => s.settings.geoEnabled);
  const setSetting = useStore((s) => s.setSetting);
  const contributeToRank = useStore((s) => s.contributeToRank);

  const count = getTodayCount(farts);
  const waterCount = getWaterToday(water);
  const zone = getZone(count);

  const [popping, setPopping] = useState(false);
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const [soundOpen, setSoundOpen] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [fact, setFact] = useState<string | null>(null);
  const puffIdRef = useRef(0);

  // Set fact of the day on client (avoids SSR date mismatch)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFact(factIndex === 0 ? getFactOfDay(lang) : getRandomFact(lang));
  }, [lang, factIndex]);

  function handleAddFart(tags: FartTag[] = []) {
    primeAudio();
    // geo capture if enabled
    let geo: { lat: number; lng: number; country?: string } | undefined;
    if (geoEnabled && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Note: this fires async, but we already added the fart without geo.
          // For v2, we accept that geo is best-effort. Future: pre-fetch.
        },
        () => {},
        { timeout: 3000, maximumAge: 60000 }
      );
    }
    // Determine sound: tags ALWAYS use their own bound sound;
    // central big button (no tags) uses the header setting (could be random)
    const sound = tags.length > 0
      ? resolveTagSound(tags[0])
      : resolveBigButtonSound(fartSound);

    addFart({ tags, sound, geo });
    // Contribute to anonymous world rank (uses localStorage, no server)
    // Country is approximated from locale timezone as a privacy-friendly proxy.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const country = tz.split("/").pop() || "Unknown";
    contributeToRank(country);
    if (soundEnabled) playFartSound(sound);
    if (vibEnabled) vibrateFart();
    setPopping(true);
    setTimeout(() => setPopping(false), 320);

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

    toast(t("toast_fart_added"), { duration: 1200, icon: "💨" });
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

  function previewSound(s: FartSound) {
    primeAudio();
    playFartSound(s);
  }

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

  const dict = translations[lang] ?? translations.en;
  const soundLabel = (s: FartSound) => dict[`sound_${s}`] ?? translations.en[`sound_${s}`] ?? s;

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Header: date + sound selector */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {t("today")}
          </p>
          <p className="text-xs text-foreground/80">{dateStr}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={() => setSoundOpen(true)}
          aria-label={t("sound_section")}
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{soundLabel(fartSound)}</span>
        </Button>
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
                zone === "low" ? "bg-yellow-500" : zone === "normal" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {zoneStyles.label}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {puffs.map((p) => (
              <span
                key={p.id}
                className="puff-particle"
                style={{ backgroundColor: p.color, "--dx": `${p.dx}px` } as React.CSSProperties}
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
          className={`relative flex h-52 w-52 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-shadow ${
            popping ? "animate-fart-pop shadow-primary/50" : "shadow-primary/30"
          }`}
          aria-label={t("add_fart")}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-primary/30" />
          <span className="pointer-events-none absolute inset-2 rounded-full ring-2 ring-primary-foreground/20" />
          <Wind className="mb-1 h-12 w-12" strokeWidth={2.5} />
          <span className="text-3xl font-black leading-none">+1</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-widest opacity-90">
            {t("add_fart")}
          </span>
        </motion.button>
      </div>

      {/* Fact of the day */}
      <Card className="border-primary/30 bg-primary/5 p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("fact_of_day_title")}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFactIndex((i) => i + 1)}
            aria-label={t("fact_next")}
          >
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-snug">
          {fact || "…"}
        </p>
      </Card>

      {/* Tag buttons — all visible at once, grid 3 columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {TAG_OPTIONS.map(({ tag, icon, labelKey }) => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            onClick={() => handleAddFart([tag])}
            className="flex flex-col items-center gap-0.5 py-2.5"
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[10px] font-semibold leading-tight">{t(labelKey)}</span>
          </Button>
        ))}
      </div>

      {/* Undo */}
      <Button variant="ghost" size="sm" onClick={handleUndo} disabled={count === 0} className="text-muted-foreground">
        <Minus className="mr-1 h-4 w-4" />
        {t("cancel_fart")}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">{t("normal_range_hint")}</p>

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
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Array.from({ length: Math.max(8, waterCount) }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ scale: i < waterCount ? 1 : 0.85, opacity: i < waterCount ? 1 : 0.3 }}
              className={`flex h-7 w-6 items-end justify-center rounded-b-md rounded-t-sm border-2 ${
                i < waterCount ? "border-blue-400 bg-blue-400/30" : "border-muted-foreground/30 bg-transparent"
              }`}
            >
              {i < waterCount && <div className="mb-0.5 h-4 w-3 rounded-sm bg-blue-400/80" />}
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
          <Button variant="outline" size="sm" onClick={handleWaterRemove} disabled={waterCount === 0}>
            <span className="mr-1 text-base leading-none">−</span>
            {t("drink_glass")}
          </Button>
        </div>
      </Card>

      {/* Sound selector dialog */}
      <Dialog open={soundOpen} onOpenChange={setSoundOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {t("sound_section")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {SOUND_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => previewSound(s)}
                onDoubleClick={() => {
                  setSetting("fartSound", s);
                  toast(`✅ ${soundLabel(s)}`, { duration: 1000 });
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                  fartSound === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <span className="text-2xl">
                  {s === "classic" ? "💨" : s === "squeaker" ? "🐾" : s === "rumble" ? "🌩️" : s === "machine_gun" ? "🔫" : s === "whoopee" ? "🛋️" : s === "thunder" ? "⛈️" : s === "squeak" ? "🐭" : s === "deflate" ? "🎈" : s === "whisper" ? "🍃" : s === "burst" ? "💥" : s === "musical" ? "🎵" : s === "wave" ? "🌊" : s === "frog" ? "🐸" : "🎲"}
                </span>
                <span className="text-[10px] font-semibold">{soundLabel(s)}</span>
                {fartSound === s && <span className="text-[9px] text-primary">✓</span>}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {t("sound_preview")} · 2× {t("save")}
          </p>
          <Button
            onClick={() => {
              setSetting("fartSound", fartSound);
              setSoundOpen(false);
            }}
          >
            {t("save")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
