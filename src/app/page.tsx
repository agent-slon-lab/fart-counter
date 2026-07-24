"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
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

/**
 * Detect user's preferred language using 3 strategies (in priority order):
 * 1. navigator.languages[] — full preference list (most accurate)
 * 2. navigator.language — single language (fallback)
 * 3. Timezone hint — if browser is English but timezone is Russian-speaking region, suggest RU
 *
 * Only called on FIRST VISIT (no persisted store). Returning users keep their saved language.
 */
function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";

  // Strategy 1: Check navigator.languages array (e.g. ["ru-RU", "ru", "en-US", "en"])
  const langs = Array.isArray(navigator.languages) ? navigator.languages : [];
  for (const l of langs) {
    const code = (l || "").toLowerCase().split("-")[0];
    if (SUPPORTED_LANGS.includes(code as Language)) return code as Language;
  }

  // Strategy 2: navigator.language single value
  const browserLang = (navigator.language || "en").toLowerCase();
  const exact = browserLang.split("-")[0];
  if (SUPPORTED_LANGS.includes(exact as Language)) return exact as Language;

  // Strategy 3: Timezone hint — catches users with English browser in non-English countries
  // (e.g. developer in Russia with English Chrome, or expat in Spain with English browser)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    // Russian-speaking timezones (Russia, Belarus, Kazakhstan)
    if (/^(Europe\/(Moscow|Kaliningrad|Samara|Volgograd|Saratov|Astrakhan|Ulyanovsk|Kirov|Simferopol|Minsk|Kiev|Kyiv)|Asia\/(Yekaterinburg|Omsk|Novosibirsk|Krasnoyarsk|Irkutsk|Yakutsk|Vladivostok|Magadan|Kamchatka|Anadyr|Sakhalin|Chita|Khandyga|Ust-Nera|Tomsk|Barnaul|Novokuznetsk|Almaty|Bishkek|Tashkent|Yerevan|Tbilisi|Baku))/.test(tz)) {
      return "ru";
    }
    // Spanish-speaking timezones (Spain, Latin America)
    if (/^(Europe\/Madrid|Atlantic\/Canary|America\/(New_York|Chicago|Denver|Los_Angeles|Argentina|Bogota|Caracas|Santiago|Lima|Mexico_City|Monterrey|Guayaquil|Asuncion|Montevideo|Tegucigalpa|San_Jose|Panama|Santo_Domingo|Havana|La_Paz|Managua|El_Salvador|Guatemala))/.test(tz)) {
      return "es";
    }
    // Portuguese-speaking (Brazil, Portugal)
    if (/^(America\/(Sao_Paulo|Bahia|Manaus|Fortaleza|Recife|Belem|Brasilia|Rio_Braneiro|Porto_Velho|Maceio|Natal|Cuiaba|Campo_Grande|Florianopolis|Goiania|Curitiba)|Europe\/Lisbon|Atlantic\/Azores|Atlantic\/Madeira)/.test(tz)) {
      return "pt";
    }
    // German-speaking (Germany, Austria, Switzerland)
    if (/^(Europe\/(Berlin|Vienna|Zurich|Luxembourg|Amsterdam))/.test(tz)) {
      return "de";
    }
    // French-speaking (France, Belgium, Switzerland partial)
    if (/^(Europe\/(Paris|Brussels|Luxembourg|Monaco))/.test(tz)) {
      return "fr";
    }
    // India
    if (/^Asia\/(Kolkata|Calcutta|Delhi|Mumbai|Chennai|Bangalore|Hyderabad|Ahmedabad|Karachi|Dhaka|Colombo|Kathmandu)/.test(tz)) {
      return "hi";
    }
  } catch {
    // timezone detection failed — fall through to default
  }

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

  // SCROLL TO TOP: useLayoutEffect fires AFTER DOM update, BEFORE paint
  // This guarantees the user NEVER sees the old scroll position
  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    // Also try window scroll (some browsers scroll the window, not the element)
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [tab]);

  // SCROLL TO TOP: Direct handler — scroll immediately on click
  const handleTabChange = useCallback((newTab: TabId) => {
    // Scroll BEFORE changing tab (clears old position)
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setTab(newTab);
    // useLayoutEffect will fire after render and scroll again
  }, []);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      {mounted && showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base shadow-sm">💨</span>
          <div className="leading-none" suppressHydrationWarning>
            <p className="text-sm font-black" suppressHydrationWarning>{t("app_name")}</p>
            <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>{t("app_tagline")}</p>
          </div>
        </div>
        {mounted && <ProfileSwitcher />}
      </header>

      {/* NO AnimatePresence — direct render for instant scroll */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-24 thin-scroll">
        <div key={tab} className="pt-3">
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
        </div>
      </main>

      <BottomNav active={tab} onChange={handleTabChange} />
      <AchievementWatcher />
      <InstallPrompt />
      <UpdateBanner />
      <EveningReminderBanner />
      <WelcomePopup />
      <DailyBonusPopup />
    </div>
  );
}
