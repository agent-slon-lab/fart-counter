"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, getTodayCount, getWaterToday } from "@/lib/store";
import { useT } from "@/hooks/use-t";

const WELCOME_KEY_PREFIX = "fart-counter-welcome-shown-";

/**
 * Welcome popup — shows a friendly greeting when user opens the app.
 * Shows once per day, with different messages based on time of day and stats.
 *
 * Triggers:
 * - Morning (5:00-11:00): morning greeting
 * - Day (11:00-17:00): day greeting
 * - Evening (17:00-21:00): evening greeting
 * - Night (21:00-5:00): night greeting
 *
 * Special overrides:
 * - If 0 farts today → zero_farts message
 * - If 0 water today → no_water message (morning/day only)
 * - If 10-20 farts → good_norm message
 * - If >20 farts → overload message
 */
export function WelcomePopup() {
  const { t } = useT();
  const farts = useStore((s) => s.farts);
  const water = useStore((s) => s.water);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("💨");

  useEffect(() => {
    // Check if already shown today
    const today = dateKey(new Date());
    const key = WELCOME_KEY_PREFIX + today;
    if (localStorage.getItem(key) === "1") return;

    const now = new Date();
    const hour = now.getHours();
    const todayCount = getTodayCount(farts);
    const waterCount = getWaterToday(water);

    // Determine time-of-day category
    let category: "morning" | "day" | "evening" | "night";
    let defaultEmoji: string;
    if (hour >= 5 && hour < 11) {
      category = "morning";
      defaultEmoji = "☀️";
    } else if (hour >= 11 && hour < 17) {
      category = "day";
      defaultEmoji = "🌤️";
    } else if (hour >= 17 && hour < 21) {
      category = "evening";
      defaultEmoji = "🌅";
    } else {
      category = "night";
      defaultEmoji = "🌙";
    }

    // Pick a message — prioritize special conditions
    let msgKey: string;
    let msgEmoji: string = defaultEmoji;

    // Priority 1: special stats conditions
    if (todayCount === 0 && hour >= 11) {
      // No farts at all (only after morning — morning itself is ok)
      msgKey = `welcome_zero_farts`;
      msgEmoji = "🤔";
    } else if (todayCount >= 10 && todayCount <= 20) {
      msgKey = `welcome_good_norm`;
      msgEmoji = "🌱";
    } else if (todayCount > 20) {
      msgKey = `welcome_overload`;
      msgEmoji = "🚶";
    } else if (waterCount === 0 && (category === "morning" || category === "day")) {
      msgKey = `welcome_no_water`;
      msgEmoji = "💧";
    } else if (todayCount > 0 && todayCount < 10) {
      // Few farts — time-based greeting
      const variants = [1, 2, 3, 4];
      const pick = variants[Math.floor(Math.random() * variants.length)];
      msgKey = `welcome_${category}_${pick}`;
    } else {
      // Default: time-based greeting
      const variants = [1, 2, 3, 4];
      const pick = variants[Math.floor(Math.random() * variants.length)];
      msgKey = `welcome_${category}_${pick}`;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(t(msgKey));
    setEmoji(msgEmoji);

    // Delay 1s after launch
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [farts, water, t]);

  function handleDismiss() {
    const today = dateKey(new Date());
    localStorage.setItem(WELCOME_KEY_PREFIX + today, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="relative w-full max-w-xs rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-2xl"
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Big emoji icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
              className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-6xl"
            >
              {emoji}
            </motion.div>

            <p className="mb-5 text-lg font-bold leading-snug">{message}</p>

            <Button onClick={handleDismiss} size="lg" className="w-full">
              {t("welcome_dismiss")}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
