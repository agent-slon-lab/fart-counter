"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useStore, useProfileFarts, getTodayCount } from "@/lib/store";
import { getLevel, getLevelProgress, STREAK_MILESTONES, getHealthWarning } from "@/lib/levels";
import { useT } from "@/hooks/use-t";

export function GamificationBar() {
  const { t } = useT();
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const allProfiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.settings.activeProfileId);
  const activeProfile = allProfiles.find((p) => p.id === activeProfileId);
  const isBaby = activeProfile?.type === "baby";
  const farts = useProfileFarts();
  const todayCount = getTodayCount(farts);

  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const nextLevel = progress.next;
  const xpToNext = nextLevel ? nextLevel - xp : 0;

  // Health warning
  const healthKey = getHealthWarning(todayCount, isBaby);
  const healthMsg = healthKey ? t(healthKey).replace("{n}", String(todayCount)) : null;

  // Next streak milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streak);

  return (
    <div className="space-y-2">
      {/* Streak + Level row */}
      <div className="flex gap-2">
        {/* Streak */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/5 p-2.5">
          <Flame className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black leading-none text-orange-500">{streak}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{t("streak_days")}</p>
          </div>
        </div>

        {/* Level */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
          <span className="text-xl shrink-0">{level.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-none">{t(level.nameKey)}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">
              {nextLevel
                ? `${xpToNext} XP →`
                : t("level_max")}
            </p>
          </div>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground shrink-0">{xp} XP</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
        {nextLevel && (
          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{nextLevel}</span>
        )}
      </div>

      {/* Health warning */}
      {healthMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3 text-xs font-medium ${
            todayCount > (isBaby ? 50 : 40)
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {healthMsg}
        </motion.div>
      )}

      {/* Streak milestone hint */}
      {streak > 0 && nextMilestone && (
        <p className="text-center text-[10px] text-muted-foreground">
          {t("streak_keep")} → {nextMilestone.emoji} {nextMilestone.days} {t("streak_days")}
        </p>
      )}
    </div>
  );
}
