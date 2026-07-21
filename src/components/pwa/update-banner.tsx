"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import {
  APP_VERSION,
  fetchLatestVersion,
  compareVersions,
  shouldCheckInBackground,
  markCheckedNow,
  forceUpdate,
} from "@/lib/version";

/**
 * Update banner — checks for new versions:
 * - Always on app launch (after 2s delay)
 * - In background: once per 24h
 * - Manual: when user clicks "Check for updates" in About section
 *
 * Shows a banner at the top when a new version is available.
 */
export function UpdateBanner() {
  const { t } = useT();
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Check AFTER app is fully loaded — non-blocking
  useEffect(() => {
    let cancelled = false;
    async function check() {
      // Wait 10s after launch — let app fully render first, then check in background
      await new Promise((r) => setTimeout(r, 10000));
      if (cancelled) return;
      // Skip if we already checked today (background throttle)
      if (!shouldCheckInBackground()) return;
      const info = await fetchLatestVersion();
      if (cancelled || !info) return;
      markCheckedNow();
      if (compareVersions(info.version, APP_VERSION) > 0) {
        setNewVersion(info.version);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpdate() {
    setUpdating(true);
    await forceUpdate();
  }

  function handleDismiss() {
    setNewVersion(null);
  }

  return (
    <AnimatePresence>
      {newVersion && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[60] mx-auto max-w-[480px] safe-top"
        >
          <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-primary bg-background p-2 shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight">{t("update_available")}</p>
              <p className="text-[10px] text-muted-foreground">
                v{APP_VERSION} → <span className="font-semibold text-primary">v{newVersion}</span>
              </p>
            </div>
            <Button size="sm" onClick={handleUpdate} disabled={updating} className="h-8 px-3">
              {updating ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              {t("update_now")}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
              aria-label={t("update_later")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook for manual "Check for updates" button. */
export function useManualUpdateCheck() {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "checking" | "available" | "latest" | "error">("idle");
  const [newVersion, setNewVersion] = useState<string | null>(null);

  async function check() {
    setState("checking");
    const info = await fetchLatestVersion();
    if (!info) {
      setState("error");
      return;
    }
    markCheckedNow();
    if (compareVersions(info.version, APP_VERSION) > 0) {
      setNewVersion(info.version);
      setState("available");
    } else {
      setState("latest");
    }
  }

  return { state, newVersion, check, t, APP_VERSION };
}
