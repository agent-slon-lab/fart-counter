"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, getTodayCount } from "@/lib/store";
import { useT } from "@/hooks/use-t";

const DISMISS_KEY_PREFIX = "fart-counter-evening-dismissed-";

/**
 * Evening reminder banner — checks on app launch:
 * - If current hour >= 21 (9 PM)
 * - AND user has fewer than 5 farts today
 * - AND user hasn't dismissed this banner today
 * → Show banner at top: "Don't forget to log your farts!"
 *
 * Dismissing stores today's date in localStorage so it won't show again today.
 */
export function EveningReminderBanner() {
  const { t } = useT();
  const farts = useStore((s) => s.farts);
  const eveningReminder = useStore((s) => s.settings.eveningReminder);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!eveningReminder) return;
    // Only check on client (avoids SSR mismatch)
    const now = new Date();
    const hour = now.getHours();
    // Show only after 21:00 (9 PM)
    if (hour < 21) return;

    const today = dateKey(now);
    const dismissKey = DISMISS_KEY_PREFIX + today;
    if (localStorage.getItem(dismissKey) === "1") return;

    const todayCount = getTodayCount(farts);
    // Show if user has fewer than 5 farts today
    if (todayCount >= 5) return;

    // Delay 1.5s after launch to not overlap with other banners
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [farts, eveningReminder]);

  function handleDismiss() {
    const today = dateKey(new Date());
    localStorage.setItem(DISMISS_KEY_PREFIX + today, "1");
    setVisible(false);
  }

  function handleCountNow() {
    // Scroll to top — user is already on Home screen (where the +1 button is)
    window.scrollTo({ top: 0, behavior: "smooth" });
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[55] mx-auto max-w-[480px] safe-top"
        >
          <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-indigo-500/50 bg-background p-2 shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15">
              <Moon className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight">{t("evening_banner_title")}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{t("evening_banner_body")}</p>
            </div>
            <Button
              size="sm"
              onClick={handleCountNow}
              className="h-8 shrink-0 px-3"
            >
              {t("evening_banner_count_now")}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
              aria-label={t("evening_banner_dismiss")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
