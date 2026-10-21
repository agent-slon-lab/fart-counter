"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { APP_VERSION } from "@/lib/version";
import {
  backgroundUpdateFlow,
  checkForUpdates,
  applyUpdate,
  guardedReload,
} from "@/lib/update-chain";

/**
 * Update banner (v1.9.3 — offline-first quiet updates):
 * - 4 s after startup: probe the source chain in the background
 *   (Vercel 1 s -> GitHub Pages 1 s -> local). Probes fail silently.
 * - If a newer version is found AND the same-origin SW can really deliver it,
 *   it is applied quietly: SKIP_WAITING -> controllerchange -> ONE guarded
 *   reload (sessionStorage flag = loop protection).
 * - This banner is informational: "vA -> vB" with an "Update now" button.
 *   The 20 s countdown is the fallback window — when it hits zero the same
 *   guarded reload fires (still at most one reload per session).
 * - No dismiss/redirect: the address bar never changes, data stays intact.
 */

const LAUNCH_DELAY_MS = 4000; // background check starts 3-5 s after boot
const AUTO_APPLY_MS = 20000; // fallback window before auto-reload

export function UpdateBanner() {
  const { t } = useT();
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Background update flow, launched shortly after startup — non-blocking.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, LAUNCH_DELAY_MS));
      if (cancelled) return;
      const found = await backgroundUpdateFlow();
      if (cancelled || !found) return; // up to date / offline / not applicable
      setNewVersion(found.version);
      // Fallback window: if the quiet reload hasn't landed the update by
      // now, fire the same guarded reload when the countdown ends.
      setCountdown(AUTO_APPLY_MS / 1000);
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            stopCountdown();
            guardedReload();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    })();
    return () => {
      cancelled = true;
      stopCountdown();
    };
  }, []);

  async function handleUpdate() {
    stopCountdown();
    guardedReload(); // guarded: at most one reload per session
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
                {countdown > 0 && ` · ${countdown}s`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpdate}
              className="h-8 px-3 shrink-0"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              {t("update_now")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook for the manual "Check for updates" button (Profile section). */
export function useManualUpdateCheck() {
  const { t } = useT();
  const [state, setState] = useState<
    "idle" | "checking" | "available" | "latest" | "error"
  >("idle");
  const [newVersion, setNewVersion] = useState<string | null>(null);

  async function check() {
    setState("checking");
    const { found, reached } = await checkForUpdates();
    if (found) {
      // Newer version exists — apply it quietly right away (SKIP_WAITING +
      // one guarded reload); the panel below just informs the user.
      await applyUpdate();
      setNewVersion(found.version);
      setState("available");
      return;
    }
    if (reached) {
      // Sources answered and we are current.
      setState("latest");
    } else {
      // All probes failed (offline / blocked).
      setState("error");
    }
  }

  return { state, newVersion, check, t, APP_VERSION };
}
