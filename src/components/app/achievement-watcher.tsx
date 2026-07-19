"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, useProfileFarts, useProfileFood, useProfileMoods } from "@/lib/store";
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
 * OPTIMIZED: Only re-checks achievements when fart/food/mood COUNT changes,
 * not on every re-render. Uses refs to track previous counts.
 */
export function AchievementWatcher() {
  const farts = useProfileFarts();
  const food = useProfileFood();
  const moods = useProfileMoods();
  const unlocked = useStore((s) => s.unlockedAchievements);
  const unlockAchievement = useStore((s) => s.unlockAchievement);
  const soundEnabled = useStore((s) => s.settings.soundEnabled);
  const vibEnabled = useStore((s) => s.settings.vibrationEnabled);
  const notifEnabled = useStore((s) => s.settings.notificationsEnabled);
  const { t, lang } = useT();

  const [queue, setQueue] = useState<AchievementDef[]>([]);
  const [current, setCurrent] = useState<AchievementDef | null>(null);
  const seenRef = useRef<Set<string>>(new Set(unlocked));
  const prevCountRef = useRef({ farts: -1, food: -1, moods: -1 });

  // Only check achievements when COUNT changes (not on every render)
  useEffect(() => {
    const fartsCount = farts.length;
    const foodCount = food.length;
    const moodsCount = moods.length;
    const prev = prevCountRef.current;

    // Skip if counts haven't changed (initial load sets refs)
    if (prev.farts === fartsCount && prev.food === foodCount && prev.moods === moodsCount) {
      return;
    }
    prevCountRef.current = { farts: fartsCount, food: foodCount, moods: moodsCount };

    const shouldUnlock = checkAchievements(farts, food, moods);
    const newly: AchievementDef[] = [];
    for (const id of shouldUnlock) {
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        const wasUnlocked = unlocked.includes(id);
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
  }, [farts.length, food.length, moods.length]);

  // Initialize seen set from already-unlocked
  useEffect(() => {
    seenRef.current = new Set(unlocked);
  }, [unlocked]);

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
