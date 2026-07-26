"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, useProfilePoops } from "@/lib/store";
import { useT } from "@/hooks/use-t";

const DISMISS_KEY_PREFIX = "fart-counter-bowel-morning-dismissed-";

/**
 * Morning bowel reminder banner:
 * - Shows after 10:00 AM
 * - AND user hasn't logged a poop today
 * - AND bowelTrackingEnabled is on
 * - AND not dismissed today
 * - Shows random funny reminder from 5 variants
 */
export function BowelMorningBanner() {
  const { t } = useT();
  const poops = useProfilePoops();
  const bowelTrackingEnabled = useStore((s) => s.settings.bowelTrackingEnabled);
  const [visible, setVisible] = useState(false);

  // Pick random reminder once per mount
  const reminderIdx = useMemo(() => 1 + Math.floor(Math.random() * 5), []);

  useEffect(() => {
    if (!bowelTrackingEnabled) return;

    const now = new Date();
    const hour = now.getHours();
    // Only after 10:00 AM
    if (hour < 10) return;

    const today = dateKey(now);
    const dismissKey = DISMISS_KEY_PREFIX + today;
    if (localStorage.getItem(dismissKey) === "1") return;

    // Check if user already logged a poop today
    const todayPoops = poops.filter((p) => dateKey(new Date(p.ts)) === today);
    if (todayPoops.length > 0) return;

    // Delay 2.5s after launch
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [poops, bowelTrackingEnabled]);

  function handleDismiss() {
    const today = dateKey(new Date());
    localStorage.setItem(DISMISS_KEY_PREFIX + today, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[56] mx-auto max-w-[480px] safe-top animate-[slideDown_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-amber-500/50 bg-background p-2 shadow-2xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <span className="text-lg">🚽</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight text-amber-600 dark:text-amber-400">
            {t("bowel_morning_title" as never)}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug">
            {t(`bowel_morning_${reminderIdx}` as never)}
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={handleDismiss}
          className="h-8 shrink-0 bg-amber-500 text-white hover:bg-amber-600 px-3"
        >
          {t("bowel_morning_dismiss" as never)}
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
