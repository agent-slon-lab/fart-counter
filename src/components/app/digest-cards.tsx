"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, Utensils, Star, TrendingUp, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useStore, dateKey, useProfilePoops, useProfileFood, type PoopRecord, type FoodEntry } from "@/lib/store";
import { useT } from "@/hooks/use-t";

const WEEKDAY_KEYS = ["weekday_mon", "weekday_tue", "weekday_wed", "weekday_thu", "weekday_fri", "weekday_sat", "weekday_sun"];
const PERIOD_DAYS = 7;

export function DigestCards() {
  const { t } = useT();
  const poops = useProfilePoops();
  const food = useProfileFood();

  // Filter last 7 days
  const periodMs = PERIOD_DAYS * 24 * 3600 * 1000;
  const now = Date.now();
  const startDate = new Date(now - periodMs);

  const periodPoops = useMemo(
    () => poops.filter((p) => new Date(p.ts).getTime() >= startDate.getTime()),
    [poops]
  );
  const periodFood = useMemo(
    () => food.filter((f) => new Date(f.ts).getTime() >= startDate.getTime()),
    [food]
  );

  // Days tracked (distinct days with poops)
  const daysTracked = useMemo(() => {
    const days = new Set<string>();
    periodPoops.forEach((p) => days.add(dateKey(new Date(p.ts))));
    return days.size;
  }, [periodPoops]);

  // 1. Average rhythm
  const avgRhythm = daysTracked > 0 ? (periodPoops.length / daysTracked).toFixed(1) : "0";

  // 2. Top Bristol type
  const topType = useMemo(() => {
    if (periodPoops.length === 0) return null;
    const counts: Record<number, number> = {};
    periodPoops.forEach((p) => {
      if (p.bristolType) counts[p.bristolType] = (counts[p.bristolType] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    const [type, count] = entries.sort((a, b) => b[1] - a[1])[0];
    const pct = Math.round((Number(count) / periodPoops.length) * 100);
    return { type: Number(type), pct };
  }, [periodPoops]);

  // 3. Food trigger (food with most symptoms after)
  const foodTrigger = useMemo(() => {
    if (periodFood.length === 0 || periodPoops.length === 0) return null;
    const byName = new Map<string, { symptoms: number; total: number }>();
    for (const f of periodFood) {
      const eatTime = new Date(f.ts).getTime();
      // Find poops within 24h after eating
      const nextPoops = periodPoops.filter((p) => {
        const diff = new Date(p.ts).getTime() - eatTime;
        return diff > 0 && diff < 24 * 3600 * 1000;
      });
      const cur = byName.get(f.name) ?? { symptoms: 0, total: 0 };
      cur.total++;
      cur.symptoms += nextPoops.filter((p) => p.symptoms).length;
      byName.set(f.name, cur);
    }
    const entries = Array.from(byName.entries());
    if (entries.length === 0) return null;
    // Find food with most symptom-associated poops after it
    const sorted = entries.sort((a, b) => b[1].symptoms - a[1].symptoms);
    if (sorted[0][1].symptoms === 0) return null;
    return { name: sorted[0][0], symptoms: sorted[0][1].symptoms };
  }, [periodFood, periodPoops]);

  // 4. Best day (day with fewest symptoms, or fewest poops if no symptoms)
  const bestDay = useMemo(() => {
    if (periodPoops.length === 0) return null;
    const byDay: Record<string, { poops: number; symptoms: number }> = {};
    periodPoops.forEach((p) => {
      const dk = dateKey(new Date(p.ts));
      if (!byDay[dk]) byDay[dk] = { poops: 0, symptoms: 0 };
      byDay[dk].poops++;
      if (p.symptoms) byDay[dk].symptoms++;
    });
    const entries = Object.entries(byDay);
    if (entries.length === 0) return null;
    // Best = fewest symptoms, then fewest poops
    const sorted = entries.sort((a, b) => {
      if (a[1].symptoms !== b[1].symptoms) return a[1].symptoms - b[1].symptoms;
      return a[1].poops - b[1].poops;
    });
    const bestDate = new Date(sorted[0][0] + "T12:00:00");
    const monIdx = (bestDate.getDay() + 6) % 7;
    return { dayIdx: monIdx, poops: sorted[0][1].poops, symptoms: sorted[0][1].symptoms };
  }, [periodPoops]);

  // 5. Progress (days tracked)
  const progress = daysTracked;

  // 6. Random funny insight (changes on mount — client only to avoid hydration mismatch)
  const [insightIdx, setInsightIdx] = useState(1);
  useEffect(() => {
    setInsightIdx(1 + Math.floor(Math.random() * 20));
  }, []);

  // No data
  if (periodPoops.length === 0) {
    return (
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary">{t("digest_section" as never)}</span>
          <span className="text-[10px] text-muted-foreground">· {t("digest_period" as never)}</span>
        </div>
        <p className="py-3 text-center text-sm text-muted-foreground">{t("digest_no_data" as never)}</p>
      </Card>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring" as const, stiffness: 200, damping: 20 },
    }),
  };

  return (
    <div className="space-y-3">
      {/* Section title */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase tracking-widest text-primary">{t("digest_section" as never)}</span>
        <span className="text-[10px] text-muted-foreground">· {t("digest_period" as never)}</span>
      </div>

      {/* Cards grid — 2 columns */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. Average rhythm */}
        <DigestCard
          icon={<Calendar className="h-4 w-4" />}
          title={t("digest_avg_rhythm" as never)}
          value={avgRhythm}
          unit={t("digest_avg_rhythm_unit" as never)}
          desc={t("digest_avg_rhythm_desc" as never)}
          color="blue"
          index={0}
          variants={cardVariants}
        />

        {/* 2. Top type — show Bristol icon + type name + description by category */}
        {topType && (
          <DigestCard
            icon={<Trophy className="h-4 w-4" />}
            title={t("digest_top_type" as never)}
            value={`${t("bowel_bristol_type" as never)} ${topType.type}: ${t(`bowel_bristol_${topType.type}` as never)}`}
            unit={`${topType.pct}% ${t("digest_top_type_unit" as never)}`}
            desc={
              topType.type === 4 ? t("digest_top_type_desc_normal" as never)
              : topType.type <= 2 ? t("digest_top_type_desc_constipation" as never)
              : topType.type >= 6 ? t("digest_top_type_desc_diarrhea" as never)
              : t("digest_avg_rhythm_desc" as never)
            }
            color="amber"
            index={1}
            variants={cardVariants}
          />
        )}

        {/* 3. Food trigger */}
        {foodTrigger && (
          <DigestCard
            icon={<Utensils className="h-4 w-4" />}
            title={t("digest_food_trigger" as never)}
            value={foodTrigger.name}
            unit={`${foodTrigger.symptoms} ${t("digest_food_trigger_unit" as never)}`}
            desc={t("digest_food_trigger_desc" as never)}
            color="red"
            index={2}
            variants={cardVariants}
          />
        )}

        {/* 4. Best day */}
        {bestDay && (
          <DigestCard
            icon={<Star className="h-4 w-4" />}
            title={t("digest_best_day" as never)}
            value={t(WEEKDAY_KEYS[bestDay.dayIdx] as never)}
            unit={
              bestDay.symptoms === 0
                ? t("digest_best_day_unit" as never)
                : t("digest_best_day_unit_with" as never).replace("{n}", String(bestDay.symptoms))
            }
            desc={t("digest_best_day_desc" as never)}
            color="green"
            index={3}
            variants={cardVariants}
          />
        )}

        {/* 5. Progress — proper pluralization */}
        <DigestCard
          icon={<TrendingUp className="h-4 w-4" />}
          title={t("digest_progress" as never)}
          value={String(progress)}
          unit={
            progress === 1 ? t("digest_progress_unit_one" as never)
            : progress >= 2 && progress <= 4 ? t("digest_progress_unit_few" as never)
            : t("digest_progress_unit_many" as never)
          }
          desc={t("digest_progress_desc" as never)}
          color="purple"
          index={4}
          variants={cardVariants}
        />
      </div>

      {/* 6. Insight of the day (full width) */}
      <motion.div
        custom={5}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary">
              {t("digest_insight_title" as never)}
            </span>
          </div>
          <p className="text-sm font-medium italic leading-snug">
            «{t(`digest_insight_${insightIdx}` as never)}»
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

interface DigestCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  desc: string;
  color: "blue" | "amber" | "red" | "green" | "purple";
  index: number;
  variants: any;
}

const COLOR_MAP = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-600 dark:text-red-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-600 dark:text-green-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400" },
};

function DigestCard({ icon, title, value, unit, desc, color, index, variants }: DigestCardProps) {
  const colors = COLOR_MAP[color];
  return (
    <motion.div custom={index} variants={variants} initial="hidden" animate="visible">
      <Card className={`h-full border ${colors.border} ${colors.bg} p-3`}>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={colors.text}>{icon}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</span>
        </div>
        <p className={`font-black leading-tight ${colors.text} ${value.length > 12 ? "text-sm" : value.length > 8 ? "text-lg" : "text-2xl"}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{unit}</p>
        <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{desc}</p>
      </Card>
    </motion.div>
  );
}
