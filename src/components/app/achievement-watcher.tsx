"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  ACHIEVEMENTS,
  checkAchievements,
  type AchievementDef,
} from "@/lib/achievements";
import { playAchievementSound } from "@/lib/sounds";
import { vibrateAchievement } from "@/lib/haptics";
import { fireAchievementNotification } from "@/lib/notifications";
import { useT } from "@/hooks/use-t";
import { AchievementPopup } from "./achievement-popup";

/**
 * Watches the fart records and triggers a popup whenever a NEW achievement
 * becomes unlockable. The popup shows one achievement at a time; if multiple
 * unlock at once they are queued.
 */
export function AchievementWatcher() {
  const farts = useStore((s) => s.farts);
  const food = useStore((s) => s.food);
  const moods = useStore((s) => s.moods);
  const unlocked = useStore((s) => s.unlockedAchievements);
  const unlockAchievement = useStore((s) => s.unlockAchievement);
  const soundEnabled = useStore((s) => s.settings.soundEnabled);
  const vibEnabled = useStore((s) => s.settings.vibrationEnabled);
  const notifEnabled = useStore((s) => s.settings.notificationsEnabled);
  const { t, lang } = useT();

  const [queue, setQueue] = useState<AchievementDef[]>([]);
  const [current, setCurrent] = useState<AchievementDef | null>(null);
  const seenRef = useRef<Set<string>>(new Set(unlocked));

  // Initialize seen set from already-unlocked (so we don't re-pop on first load)
  useEffect(() => {
    seenRef.current = new Set(unlocked);
  }, [unlocked]);

  useEffect(() => {
    const shouldUnlock = checkAchievements(farts, food, moods);
    const newly: AchievementDef[] = [];
    for (const id of shouldUnlock) {
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        const wasUnlocked = unlocked.includes(id);
        // Only show popup if it wasn't already unlocked in storage
        if (!wasUnlocked) {
          const def = ACHIEVEMENTS.find((a) => a.id === id);
          if (def) {
            unlockAchievement(id);
            newly.push(def);
          }
        }
      }
    }
    if (newly.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((q) => [...q, ...newly]);
      if (soundEnabled) playAchievementSound();
      if (vibEnabled) vibrateAchievement();
      if (notifEnabled) {
        const first = newly[0];
        fireAchievementNotification(
          `${t("ach_unlocked")} ${first.icon}`,
          t(first.nameKey)
        );
      }
    }
  }, [farts, food, moods, unlocked, unlockAchievement, soundEnabled, vibEnabled, notifEnabled, t, lang]);

  // Show next popup when none is shown
  useEffect(() => {
    if (!current && queue.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  if (!current) return null;
  return (
    <AchievementPopup
      achievement={current}
      onClose={() => setCurrent(null)}
    />
  );
}
