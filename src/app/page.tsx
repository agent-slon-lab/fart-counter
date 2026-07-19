"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav, type TabId } from "@/components/app/bottom-nav";
import { HomeScreen } from "@/components/app/home-screen";
import { AchievementWatcher } from "@/components/app/achievement-watcher";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { UpdateBanner } from "@/components/pwa/update-banner";
import { EveningReminderBanner } from "@/components/pwa/evening-reminder-banner";
import { Onboarding, hasCompletedOnboarding } from "@/components/pwa/onboarding";
import { WelcomePopup } from "@/components/pwa/welcome-popup";
import { ProfileSwitcher } from "@/components/app/profile-switcher";
import { useT } from "@/hooks/use-t";
import { useStore } from "@/lib/store";
import type { Language } from "@/lib/i18n";

// CODE SPLITTING: Lazy load non-home screens for faster initial load
const HistoryScreen = lazy(() => import("@/components/app/history-screen").then(m => ({ default: m.HistoryScreen })));
const StatsScreen = lazy(() => import("@/components/app/stats-screen").then(m => ({ default: m.StatsScreen })));
const ProfileScreen = lazy(() => import("@/components/app/profile-screen").then(m => ({ default: m.ProfileScreen })));
const FoodScreen = lazy(() => import("@/components/app/food-screen").then(m => ({ default: m.FoodScreen })));
const InsightsScreen = lazy(() => import("@/components/app/insights-screen").then(m => ({ default: m.InsightsScreen })));

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
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const primeAudioOnce = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const setLanguage = useStore((s) => s.setLanguage);

  useEffect(() => {
    // 1. Rehydrate store from localStorage (was skipped during SSR)
    useStore.persist.rehydrate();

    // 2. Check if this is a first-time visitor (no persisted data)
    const storeKey = "fart-counter-store-v2";
    const hasPersisted = localStorage.getItem(storeKey) !== null;

    // 3. If first visit, detect browser language
    if (!hasPersisted) {
      const detected = detectBrowserLanguage();
      if (detected !== "en") {
        setLanguage(detected);
      }
    }

    // 4. Mark as hydrated
    setHydrated(true);

    // 5. Check onboarding
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, [setLanguage]);

  // Prime audio on first user interaction (mobile autoplay policy)
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

  // Scroll to top on tab change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  // Full-screen loading until hydrated (prevents SSR/client mismatch)
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      {/* Onboarding (shown only once) */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      {/* App header */}
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">💨</span>
          <div className="leading-none">
            <p className="text-sm font-black">{t("app_name")}</p>
            <p className="text-[10px] text-muted-foreground">{t("app_tagline")}</p>
          </div>
        </div>
        <ProfileSwitcher />
      </header>

      {/* Screen content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-24 thin-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pt-3"
          >
            {tab === "home" && <HomeScreen />}
            {tab !== "home" && (
              <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                {tab === "history" && <HistoryScreen />}
                {tab === "food" && <FoodScreen />}
                {tab === "insights" && <InsightsScreen />}
                {tab === "stats" && <StatsScreen />}
                {tab === "profile" && <ProfileScreen />}
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <AchievementWatcher />
      <InstallPrompt />
      <UpdateBanner />
      <EveningReminderBanner />
      <WelcomePopup />
    </div>
  );
}
