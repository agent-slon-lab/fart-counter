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
import { AchievementWatcher } from "@/components/app/achievement-watcher";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { UpdateBanner } from "@/components/pwa/update-banner";
import { EveningReminderBanner } from "@/components/pwa/evening-reminder-banner";
import { useT } from "@/hooks/use-t";

export default function Home() {
  const { t } = useT();
  const [tab, setTab] = useState<TabId>("home");
  const [hydrated, setHydrated] = useState(false);
  const primeAudioOnce = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      {/* App header */}
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">💨</span>
          <div className="leading-none">
            <p className="text-sm font-black">{t("app_name")}</p>
            <p className="text-[10px] text-muted-foreground">{t("app_tagline")}</p>
          </div>
        </div>
      </header>

      {/* Screen content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-24 thin-scroll">
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
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
              {tab === "history" && <HistoryScreen />}
              {tab === "food" && <FoodScreen />}
              {tab === "insights" && <InsightsScreen />}
              {tab === "stats" && <StatsScreen />}
              {tab === "profile" && <ProfileScreen />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <AchievementWatcher />
      <InstallPrompt />
      <UpdateBanner />
      <EveningReminderBanner />
    </div>
  );
}
