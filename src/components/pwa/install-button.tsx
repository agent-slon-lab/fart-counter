"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Apple, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-t";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "installed" | "android" | "ios-safari" | "ios-other" | "desktop" | "other";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  // Check if already installed (standalone mode)
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandalone) return "installed";

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isChrome = /Chrome|Chromium|Edg/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua);

  if (isIOS) {
    return isSafari ? "ios-safari" : "ios-other";
  }
  if (isAndroid) return "android";
  if (isChrome && !isMobile) return "desktop";
  return "other";
}

/**
 * Install App button — shows in Profile.
 * - Hidden if PWA already installed
 * - On Android/Desktop Chrome: triggers native install prompt
 * - On iOS: shows instructions dialog
 */
export function InstallButton() {
  const { t } = useT();
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(detectPlatform());

    function onBIP(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  // Don't render if already installed
  if (platform === "installed") {
    return (
      <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 py-2 text-xs font-medium text-green-600 dark:text-green-400">
        <Download className="h-3.5 w-3.5" />
        {t("install_app_done")}
      </div>
    );
  }

  async function handleClick() {
    // If we have a native prompt (Android/Desktop Chrome) — use it
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // No native prompt (iOS or unsupported) — show instructions dialog
      setDialogOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Smartphone className="h-3.5 w-3.5" />
        {t("install_app")}
      </button>

      <InstallDialog open={dialogOpen} onOpenChange={setDialogOpen} platform={platform} />
    </>
  );
}

function InstallDialog({
  open,
  onOpenChange,
  platform,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  platform: Platform;
}) {
  const { t } = useT();

  // Determine which platform instructions to show
  // If platform is "other", default to showing all 3 tabs
  const showPlatform = platform === "ios-other" ? "ios-other" : platform === "ios-safari" ? "ios-safari" : platform;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-center">{t("install_dialog_title")}</DialogTitle>
        </DialogHeader>

        {/* iOS other browser warning */}
        {showPlatform === "ios-other" && (
          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-center">
            <Apple className="mx-auto mb-2 h-8 w-8 text-amber-500" />
            <p className="text-sm font-bold">{t("install_iphone_other")}</p>
          </div>
        )}

        {/* iOS Safari instructions */}
        {showPlatform === "ios-safari" && (
          <InstallSteps
            icon={<Apple className="h-5 w-5" />}
            title={t("install_iphone_title")}
            steps={[
              t("install_iphone_step1"),
              t("install_iphone_step2"),
              t("install_iphone_step3"),
            ]}
          />
        )}

        {/* Android instructions (fallback if no native prompt) */}
        {showPlatform === "android" && (
          <InstallSteps
            icon={<Smartphone className="h-5 w-5" />}
            title={t("install_android_title")}
            steps={[
              t("install_android_step1"),
              t("install_android_step2"),
              t("install_android_step3"),
            ]}
          />
        )}

        {/* Desktop instructions */}
        {showPlatform === "desktop" && (
          <InstallSteps
            icon={<Monitor className="h-5 w-5" />}
            title={t("install_desktop_title")}
            steps={[
              t("install_desktop_step1"),
              t("install_desktop_step2"),
              t("install_desktop_step3"),
            ]}
          />
        )}

        {/* Other — show all 3 */}
        {showPlatform === "other" && (
          <div className="space-y-3">
            <InstallSteps
              icon={<Smartphone className="h-5 w-5" />}
              title={t("install_android_title")}
              steps={[
                t("install_android_step1"),
                t("install_android_step2"),
                t("install_android_step3"),
              ]}
            />
            <InstallSteps
              icon={<Apple className="h-5 w-5" />}
              title={t("install_iphone_title")}
              steps={[
                t("install_iphone_step1"),
                t("install_iphone_step2"),
                t("install_iphone_step3"),
              ]}
            />
            <InstallSteps
              icon={<Monitor className="h-5 w-5" />}
              title={t("install_desktop_title")}
              steps={[
                t("install_desktop_step1"),
                t("install_desktop_step2"),
                t("install_desktop_step3"),
              ]}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InstallSteps({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  steps: string[];
}) {
  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <p className="text-sm font-bold">{title}</p>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-sm leading-snug">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
