"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Utensils, TrendingUp, Lightbulb, Clock, AlertCircle, Star, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore, dateKey, getFoodToday, type FoodEntry, type FartRecord, useProfileFood, useProfileFarts } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const FOOD_LIFESPAN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Expanded preset list — beans, cabbage, etc + nuts, fish, porridge and many more
const PRESET_FOODS: { key: string; icon: string }[] = [
  { key: "food_beans", icon: "🫘" },
  { key: "food_cabbage", icon: "🥬" },
  { key: "food_broccoli", icon: "🥦" },
  { key: "food_dairy", icon: "🥛" },
  { key: "food_chips", icon: "🍟" },
  { key: "food_soda", icon: "🥤" },
  { key: "food_onion", icon: "🧅" },
  { key: "food_egg", icon: "🥚" },
  { key: "food_bread", icon: "🍞" },
  { key: "food_fastfood", icon: "🍔" },
  { key: "food_nuts", icon: "🥜" },
  { key: "food_fish", icon: "🐟" },
  { key: "food_porridge", icon: "🥣" },
  { key: "food_rice", icon: "🍚" },
  { key: "food_apple", icon: "🍎" },
  { key: "food_banana", icon: "🍌" },
  { key: "food_corn", icon: "🌽" },
  { key: "food_mushroom", icon: "🍄" },
  { key: "food_meat", icon: "🥩" },
  { key: "food_soup", icon: "🍲" },
  { key: "food_cheese", icon: "🧀" },
  { key: "food_potato", icon: "🥔" },
  { key: "food_carrot", icon: "🥕" },
  { key: "food_coffee", icon: "☕" },
  { key: "food_beer", icon: "🍺" },
  { key: "food_garlic", icon: "🧄" },
  { key: "food_pepper", icon: "🌶️" },
  { key: "food_sweets", icon: "🍬" },
];

function getFoodAge(ts: string): number {
  return Date.now() - new Date(ts).getTime();
}

function isExpired(ts: string): boolean {
  return getFoodAge(ts) > FOOD_LIFESPAN_MS;
}

function isExpiringSoon(ts: string): boolean {
  const age = getFoodAge(ts);
  return age > FOOD_LIFESPAN_MS * 0.75 && age <= FOOD_LIFESPAN_MS;
}

function hoursLeft(ts: string): number {
  const left = FOOD_LIFESPAN_MS - getFoodAge(ts);
  return Math.max(0, Math.ceil(left / (60 * 60 * 1000)));
}

export function FoodScreen() {
  const { t, lang } = useT();
  const food = useProfileFood();
  const farts = useProfileFarts();
  const addFood = useStore((s) => s.addFood);
  const removeFood = useStore((s) => s.removeFood);
  const customFoods = useStore((s) => s.customFoods);
  const addCustomFood = useStore((s) => s.addCustomFood);
  const removeCustomFood = useStore((s) => s.removeCustomFood);

  const [addOpen, setAddOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  // Pending food that triggered a warning — needs confirmation
  const [warnPending, setWarnPending] = useState<{ name: string; avgFarts: number; times: number } | null>(null);

  // Only show non-expired food for today's list
  const todayFood = useMemo(() => {
    return getFoodToday(food).filter((f) => !isExpired(f.ts));
  }, [food]);

  // Expired food count
  const expiredCount = useMemo(() => {
    return getFoodToday(food).filter((f) => isExpired(f.ts)).length;
  }, [food]);

  // Correlation: ONLY use non-expired food (within 24h window)
  const correlation = useMemo(() => computeCorrelation(food, farts), [food, farts]);
  // Lookup map for quick warning check: name (lowercased) -> { avgFarts, times }
  const correlationMap = useMemo(() => {
    const m = new Map<string, { avgFarts: number; times: number }>();
    for (const c of correlation) m.set(c.name.toLowerCase(), { avgFarts: c.avgFarts, times: c.times });
    return m;
  }, [correlation]);

  const topTrigger = correlation.length > 0 ? correlation[0] : null;

  /**
   * Core logic: before adding food, check history.
   * If this food was eaten >=2 times before AND averaged >=3 farts in 24h → show funny warning.
   * User can confirm or cancel.
   */
  function tryAddFood(name: string) {
    const stats = correlationMap.get(name.toLowerCase());
    if (stats && stats.times >= 2 && stats.avgFarts >= 3) {
      // Risky! Show warning dialog
      setWarnPending({ name, avgFarts: stats.avgFarts, times: stats.times });
      return;
    }
    commitAddFood(name);
  }

  function commitAddFood(name: string) {
    addFood(name);
    showFoodXP();
    setAddOpen(false);
    setCustomName("");
    setWarnPending(null);
  }

  function handleAddPreset(key: string) {
    const name = t(key as never);
    tryAddFood(name);
  }

  function handleAddCustom() {
    const name = customName.trim();
    if (!name) return;
    // Save to custom foods list for quick re-add later
    addCustomFood(name);
    tryAddFood(name);
    toast(t("food_custom_saved" as never), { icon: "⭐", duration: 1500 });
  }

  function handleAddCustomQuick(name: string) {
    tryAddFood(name);
  }

  function showFoodXP() {
    const today = dateKey(new Date());
    const pid = useStore.getState().settings.activeProfileId;
    const todayFood = getFoodToday(useStore.getState().food).filter((f) => (f.profileId || "me") === pid);
    const diaryKey = "fart-counter-food-diary-bonus-" + today + "-" + pid;
    const hadDiaryBonus = typeof localStorage !== "undefined" && localStorage.getItem(diaryKey) === "1";

    // Show appropriate toast
    if (todayFood.length === 3) {
      toast(t("food_xp_bonus"), { icon: "🎉", duration: 2000 });
    } else if (hadDiaryBonus && todayFood.length === 1) {
      toast(t("food_xp_diary"), { icon: "📝", duration: 2000 });
    } else {
      toast(t("food_xp_entry"), { icon: "✅", duration: 1500 });
    }
  }

  function handleClearExpired() {
    const expired = getFoodToday(food).filter((f) => isExpired(f.ts));
    expired.forEach((f) => removeFood(f.id));
    toast(`${expired.length} ${t("food_expired").toLowerCase()}`, { icon: "🧹" });
  }

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-lg font-bold">{t("food_diary")}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("add_food")}
        </Button>
      </div>

      {/* Lifespan hint */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-600 dark:text-blue-400">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>{t("food_lifespan")}</span>
      </div>

      {/* Today's food (only fresh) */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("food_added_today")} · {todayFood.length}
          </p>
          {expiredCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleClearExpired}>
              <Trash2 className="mr-1 h-3 w-3" />
              {t("food_clear_expired")} ({expiredCount})
            </Button>
          )}
        </div>
        {todayFood.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("no_records")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {todayFood.map((f) => (
              <FoodChip key={f.id} entry={f} locale={locale} onRemove={() => removeFood(f.id)} t={t} />
            ))}
          </div>
        )}
      </Card>

      {/* My Foods (saved custom foods for quick re-add) */}
      {customFoods.length > 0 && (
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("food_my_foods")}
            </span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{t("food_my_foods_hint")}</p>
          <div className="flex flex-wrap gap-2">
            {customFoods.map((name) => (
              <div
                key={name}
                className="group flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 py-1 pl-3 pr-1.5 text-xs"
              >
                <button
                  onClick={() => handleAddCustomQuick(name)}
                  className="font-medium hover:text-primary"
                >
                  {name}
                </button>
                <button
                  onClick={() => {
                    removeCustomFood(name);
                    toast(t("food_delete_my_food" as never), { icon: "🗑️", duration: 1200 });
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-destructive/20"
                  aria-label={t("food_delete_my_food" as never)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top trigger insight */}
      {topTrigger && topTrigger.times >= 2 && (
        <Card className="border-primary/40 bg-primary/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-primary">{t("food_top_trigger")}</span>
          </div>
          <p className="text-2xl font-black">{topTrigger.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("food_avg_after")}: <b>{topTrigger.avgFarts}</b> · {topTrigger.times} {t("food_times_eaten")}
          </p>
        </Card>
      )}

      {/* Correlation list */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("food_correlation")}
          </span>
        </div>
        {correlation.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">{t("food_no_data")}</p>
        ) : (
          <div className="space-y-2">
            {correlation.slice(0, 10).map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.avgFarts} 💨 · {c.times}×
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (c.avgFarts / 30) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add food dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              {t("add_food")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_FOODS.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => handleAddPreset(key)}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-border p-2 transition-all hover:border-primary hover:bg-primary/5"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-[9px] font-semibold text-center leading-tight">{t(key as never)}</span>
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Input
              placeholder={t("food_custom")}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddCustom} disabled={!customName.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Funny warning dialog */}
      <WarningDialog
        pending={warnPending}
        t={t}
        onCancel={() => setWarnPending(null)}
        onConfirm={() => warnPending && commitAddFood(warnPending.name)}
      />
    </div>
  );
}

function FoodChip({
  entry,
  locale,
  onRemove,
  t,
}: {
  entry: FoodEntry;
  locale: string;
  onRemove: () => void;
  t: (k: never) => string;
}) {
  const time = new Date(entry.ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const expiringSoon = isExpiringSoon(entry.ts);
  const left = hoursLeft(entry.ts);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs ${
        expiringSoon
          ? "border-orange-400/50 bg-orange-400/10"
          : "border-border bg-muted/50"
      }`}
    >
      <span className="font-medium">{entry.name}</span>
      <span className="text-muted-foreground">{time}</span>
      {expiringSoon ? (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold text-orange-500">
          <AlertCircle className="h-2.5 w-2.5" />
          {left}h
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      )}
      <button
        onClick={onRemove}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-destructive/20"
        aria-label="delete"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
      </button>
    </motion.div>
  );
}

/**
 * Funny warning dialog — shows when user tries to add a food that historically
 * caused many farts (>=3 avg in 24h, eaten >=2 times before).
 * Picks a random funny message, scales intensity by fart count.
 */
function WarningDialog({
  pending,
  t,
  onCancel,
  onConfirm,
}: {
  pending: { name: string; avgFarts: number; times: number } | null;
  t: (k: never) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Pick a random warning message (1-12) — stable per open via useMemo on pending
  const warnIdx = useMemo(() => {
    if (!pending) return 1;
    return 1 + Math.floor(Math.random() * 12);
  }, [pending]);

  if (!pending) return null;

  // Intensity label by avg fart count
  const intensityKey: never =
    pending.avgFarts >= 10 ? ("food_warning_high" as never) : pending.avgFarts >= 6 ? ("food_warning_mid" as never) : ("food_warning_low" as never);

  // Emoji scales with severity
  const emoji = pending.avgFarts >= 10 ? "💥" : pending.avgFarts >= 6 ? "🔥" : "💨";
  const bgClass =
    pending.avgFarts >= 10
      ? "border-red-500/50 bg-red-500/10"
      : pending.avgFarts >= 6
      ? "border-orange-500/50 bg-orange-500/10"
      : "border-amber-500/50 bg-amber-500/10";

  const subtitle = t("food_warning_subtitle" as never)
    .replace("{food}", pending.name)
    .replace("{n}", String(pending.avgFarts))
    .replace("{times}", String(pending.times));

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <span className="text-2xl">{emoji}</span>
            {t("food_warning_title" as never)}
          </DialogTitle>
        </DialogHeader>
        <div className={`rounded-xl border-2 p-4 text-center ${bgClass}`}>
          <p className="text-sm font-medium">{subtitle}</p>
          <p className="mt-3 text-base font-black leading-snug">
            {t(`food_warn_${warnIdx}` as never)}
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            {t(intensityKey)}
          </p>
        </div>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            {t("food_chicken_out" as never)}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {t("food_add_anyway" as never)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** For each food name, count farts in the 24h after eating each instance, then average.
 *  ONLY uses non-expired food entries (within 24h window). */
function computeCorrelation(
  food: FoodEntry[],
  farts: FartRecord[]
): { name: string; avgFarts: number; times: number }[] {
  const byName = new Map<string, { sum: number; times: number }>();
  for (const f of food) {
    // Skip expired food — it shouldn't influence correlation
    if (isExpired(f.ts)) continue;
    const start = new Date(f.ts).getTime();
    const end = start + FOOD_LIFESPAN_MS;
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
