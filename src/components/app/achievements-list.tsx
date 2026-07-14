"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { ACHIEVEMENTS, checkAchievements, type AchievementDef } from "@/lib/achievements";
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AchievementsList({ open, onOpenChange }: Props) {
  const { t } = useT();
  const farts = useStore((s) => s.farts);
  const food = useStore((s) => s.food);
  const moods = useStore((s) => s.moods);
  const unlocked = useStore((s) => s.unlockedAchievements);

  const shouldUnlock = useMemo(() => new Set(checkAchievements(farts, food, moods)), [farts, food, moods]);
  const unlockedCount = ACHIEVEMENTS.filter((a) => shouldUnlock.has(a.id)).length;

  // Split into categories
  const regular = ACHIEVEMENTS.filter((a) => a.category !== "legendary");
  const legendary = ACHIEVEMENTS.filter((a) => a.category === "legendary");

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
          {regular.map((a) => (
            <AchievementRow key={a.id} a={a} isUnlocked={shouldUnlock.has(a.id)} t={t} />
          ))}

          {legendary.length > 0 && (
            <>
              <div className="sticky top-0 z-10 bg-background/95 px-1 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                  👑 {t("ach_legendary_section")}
                </p>
              </div>
              {legendary.map((a) => (
                <AchievementRow key={a.id} a={a} isUnlocked={shouldUnlock.has(a.id)} t={t} />
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AchievementRow({
  a,
  isUnlocked,
  t,
}: {
  a: AchievementDef;
  isUnlocked: boolean;
  t: (k: string) => string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border p-3 transition-colors"
      style={
        isUnlocked
          ? { borderColor: `${a.color}66`, backgroundColor: `${a.color}14` }
          : { backgroundColor: "var(--muted)", opacity: 0.7 }
      }
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
        style={
          isUnlocked
            ? { backgroundColor: `${a.color}26` }
            : { backgroundColor: "var(--muted)", filter: "grayscale(1)" }
        }
      >
        {isUnlocked ? a.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{t(a.nameKey)}</p>
          {isUnlocked && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{ backgroundColor: `${a.color}26`, color: a.color }}
            >
              {t("achievements_unlocked")}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{t(a.descKey)}</p>
      </div>
    </div>
  );
}

