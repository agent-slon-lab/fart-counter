"use client";

import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { LEVELS, getLevel } from "@/lib/levels";
import { useT } from "@/hooks/use-t";
import { Check, Lock } from "lucide-react";

/**
 * Levels grid — shows all 12 levels with current/locked/unlocked states.
 * Level is calculated from maxXp (never decreases on purchase).
 */
export function LevelsGrid() {
  const { t } = useT();
  const maxXp = useStore((s) => s.maxXp);
  const currentLevel = getLevel(maxXp);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("levels_grid_title" as never) || "Уровни"}
        </span>
        <span className="text-xs font-bold text-primary">
          {maxXp.toLocaleString()} XP
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {LEVELS.map((lvl) => {
          const isUnlocked = maxXp >= lvl.minXp;
          const isCurrent = currentLevel.level === lvl.level;
          const isLocked = !isUnlocked;

          return (
            <div
              key={lvl.level}
              className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all ${
                isCurrent
                  ? "border-primary bg-primary/10 scale-105 shadow-md"
                  : isUnlocked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30 opacity-60"
              }`}
            >
              {/* Level number badge */}
              <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${
                isCurrent ? "bg-primary text-primary-foreground" : isUnlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {lvl.level}
              </span>

              {/* Status icon */}
              {isLocked && (
                <Lock className="absolute top-1 left-1 h-3 w-3 text-muted-foreground" />
              )}
              {isCurrent && (
                <span className="absolute top-1 left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </span>
              )}

              {/* Emoji */}
              <span className={`text-2xl ${isLocked ? "grayscale opacity-50" : ""}`}>
                {lvl.emoji}
              </span>

              {/* Name */}
              <span className="text-[9px] font-bold leading-tight">
                {t(lvl.nameKey as never)}
              </span>

              {/* XP threshold */}
              <span className={`text-[8px] tabular-nums ${isUnlocked ? "text-primary" : "text-muted-foreground"}`}>
                {lvl.minXp === 0 ? "0" : `${lvl.minXp.toLocaleString()}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress hint */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        {t("levels_grid_hint" as never) || "Уровень не снижается при покупке в магазине"}
      </p>
    </Card>
  );
}
