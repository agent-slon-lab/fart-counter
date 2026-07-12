"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import {
  ACHIEVEMENTS,
  checkAchievements,
} from "@/lib/achievements";
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AchievementsList({ open, onOpenChange }: Props) {
  const { t } = useT();
  const farts = useStore((s) => s.farts);
  const unlocked = useStore((s) => s.unlockedAchievements);

  const shouldUnlock = useMemo(() => new Set(checkAchievements(farts)), [farts]);
  const unlockedCount = ACHIEVEMENTS.filter((a) => shouldUnlock.has(a.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>🏆 {t("achievements_title")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {unlockedCount}/{ACHIEVEMENTS.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto thin-scroll pr-1">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = shouldUnlock.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                  isUnlocked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/40 opacity-70"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl ${
                    isUnlocked ? "bg-primary/15" : "bg-muted grayscale"
                  }`}
                >
                  {isUnlocked ? a.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">{t(a.nameKey)}</p>
                    {isUnlocked && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                        {t("achievements_unlocked")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(a.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
