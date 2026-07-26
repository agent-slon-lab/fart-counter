"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, useProfileWalks } from "@/lib/store";
import { useT } from "@/hooks/use-t";

const DISMISS_KEY_PREFIX = "fart-counter-walk-dismissed-";

/**
 * Walk reminder banner:
 * - Shows after 15:00 (3 PM)
 * - AND user hasn't logged a walk today
 * - AND walkReminderEnabled is on
 * - AND not dismissed today
 * - Auto-hides when user logs a walk (reactive)
 * - Shows random funny walk reminder from 5 variants
 */
export function WalkReminderBanner() {
  const { t } = useT();
  const walks = useProfileWalks();
  const walkReminderEnabled = useStore((s) => s.settings.walkReminderEnabled);
  const [visible, setVisible] = useState(false);

  const reminderIdx = useMemo(() => 1 + Math.floor(Math.random() * 5), []);

  // Today's walk count (reactive)
  const todayWalkCount = useMemo(() => {
    const today = dateKey(new Date());
    return walks.filter((w) => dateKey(new Date(w.ts)) === today).length;
  }, [walks]);

  const today = dateKey(new Date());
  const isDismissed = typeof localStorage !== "undefined" && localStorage.getItem(DISMISS_KEY_PREFIX + today) === "1";

  // Auto-hide if user logged a walk OR dismissed OR disabled
  useEffect(() => {
    if (todayWalkCount > 0 || isDismissed || !walkReminderEnabled) {
      setVisible(false);
      return;
    }
    const hour = new Date().getHours();
    if (hour < 15) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [todayWalkCount, isDismissed, walkReminderEnabled]);

  function handleDismiss() {
    try { localStorage.setItem(DISMISS_KEY_PREFIX + today, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[56] mx-auto max-w-[480px] safe-top animate-[slideDown_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-green-500/50 bg-background p-2 shadow-2xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15">
          <span className="text-lg">🚶</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight text-green-600 dark:text-green-400">
            {t("walk_reminder_title" as never)}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug">
            {t(`walk_reminder_${reminderIdx}` as never)}
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={handleDismiss}
          className="h-8 shrink-0 bg-green-500 text-white hover:bg-green-600 px-3"
        >
          {t("walk_reminder_dismiss" as never)}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={handleDismiss}
          aria-label="dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
