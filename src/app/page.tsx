"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav, type TabId } from "@/components/app/bottom-nav";
import { HomeScreen } from "@/components/app/home-screen";
import { HistoryScreen } from "@/components/app/history-screen";
import { StatsScreen } from "@/components/app/stats-screen";
import { ProfileScreen } from "@/components/app/profile-screen";
import { FoodScreen } from "@/components/app/food-screen";
import { InsightsScreen } from "@/components/app/insights-screen";
import { ShopScreen } from "@/components/app/shop-screen";
import { AchievementWatcher } from "@/components/app/achievement-watcher";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { UpdateBanner } from "@/components/pwa/update-banner";
import { EveningReminderBanner } from "@/components/pwa/evening-reminder-banner";
import { Onboarding, hasCompletedOnboarding } from "@/components/pwa/onboarding";
import { WelcomePopup } from "@/components/pwa/welcome-popup";
import { DailyBonusPopup } from "@/components/pwa/daily-bonus";
import { ProfileSwitcher } from "@/components/app/profile-switcher";
import { useT } from "@/hooks/use-t";
import { useStore } from "@/lib/store";
import type { Language } from "@/lib/i18n";

const SUPPORTED_LANGS: Language[] = ["ru", "en", "es", "pt", "de", "fr", "hi"];

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const browserLang = (navigator.language || "en").toLowerCase();
  const exact = browserLang.split("-")[0];
  if (SUPPORTED_LANGS.includes(exact as Language)) return exact as Language;
  return "en";
}

export default function Home() {
  const { t } = useT();
  const [tab, setTab] = useState<TabId>("home");
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const primeAudioOnce = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const setLanguage = useStore((s) => s.setLanguage);

  useEffect(() => {
    const storeKey = "fart-counter-store-v2";
    const hasPersisted = localStorage.getItem(storeKey) !== null;

    if (!hasPersisted) {
      const detected = detectBrowserLanguage();
      if (detected !== "en") {
        setLanguage(detected);
      }
    }

    setMounted(true);

    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, [setLanguage]);

  useEffect(() => {
    if (primeAudioOnce.current) return;
    const handler = () => {
      import("@/lib/sounds").then((m) => m.primeAudio());
      primeAudioOnce.current = true;
      window.removeEventListener("pointerdown", handler);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      {mounted && showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">💨</span>
          <div className="leading-none" suppressHydrationWarning>
            <p className="text-sm font-black" suppressHydrationWarning>{t("app_name")}</p>
            <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>{t("app_tagline")}</p>
          </div>
        </div>
        {mounted && <ProfileSwitcher />}
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-24 thin-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="pt-3"
          >
            {tab === "home" && <HomeScreen />}
            {tab === "history" && (
              <>
                <HistoryScreen />
                <StatsScreen />
              </>
            )}
            {tab === "food" && <FoodScreen />}
            {tab === "insights" && <InsightsScreen />}
            {tab === "shop" && <ShopScreen />}
            {tab === "profile" && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <AchievementWatcher />
      <InstallPrompt />
      <UpdateBanner />
      <EveningReminderBanner />
      <WelcomePopup />
      <DailyBonusPopup />
    </div>
  );
}
