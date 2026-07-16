"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Zap, ShieldOff, WifiOff, Gift, Wind, BarChart3, Trophy, Share2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const ONBOARDED_KEY = "fart-counter-onboarded";

interface Props {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
  const { t } = useT();
  const setLanguage = useStore((s) => s.setLanguage);
  const currentLang = useStore((s) => s.settings.language);
  const [step, setStep] = useState(0);

  function markOnboarded() {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      // ignore
    }
    onComplete();
  }

  function handleLangSelect(lang: Language) {
    setLanguage(lang);
  }

  function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      markOnboarded();
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleSkip() {
    markOnboarded();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
      {/* Skip button (top-right) */}
      {step > 0 && (
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 safe-top flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label={t("onboarding_skip")}
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Back button (top-left, only on step > 0) */}
      {step > 0 && (
        <button
          onClick={handleBack}
          className="absolute left-4 top-4 safe-top flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label={t("onboarding_back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              {/* Big icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary text-6xl shadow-2xl"
              >
                💨
              </motion.div>

              <h1 className="text-3xl font-black mb-2">{t("onboarding_welcome_title")}</h1>
              <p className="text-sm text-muted-foreground mb-8">{t("onboarding_welcome_subtitle")}</p>

              {/* Language selector */}
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {t("onboarding_choose_lang")}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLangSelect(l.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                      currentLang === l.id
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>

              <Button onClick={handleNext} size="lg" className="w-full">
                {t("onboarding_get_started")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="lightweight"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/15 text-primary"
              >
                <Zap className="h-14 w-14" />
              </motion.div>

              <h2 className="text-2xl font-black mb-2">{t("onboarding_lightweight_title")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("onboarding_lightweight_subtitle")}</p>

              <div className="space-y-2 mb-8 text-left">
                <FeatureRow icon={<Gift className="h-4 w-4" />} text={t("onboarding_free")} />
                <FeatureRow icon={<ShieldOff className="h-4 w-4" />} text={t("onboarding_no_ads")} />
                <FeatureRow icon={<ShieldOff className="h-4 w-4" />} text={t("onboarding_no_tracking")} />
                <FeatureRow icon={<WifiOff className="h-4 w-4" />} text={t("onboarding_offline")} />
              </div>

              <Button onClick={handleNext} size="lg" className="w-full">
                {t("onboarding_next")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="quickstart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/15 text-primary"
              >
                <Wind className="h-14 w-14" />
              </motion.div>

              <h2 className="text-2xl font-black mb-2">{t("onboarding_quickstart_title")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("onboarding_quickstart_subtitle")}</p>

              <div className="space-y-3 mb-8 text-left">
                <StepRow num={1} icon={<Wind className="h-4 w-4" />} text={t("onboarding_step1")} />
                <StepRow num={2} icon={<BarChart3 className="h-4 w-4" />} text={t("onboarding_step2")} />
                <StepRow num={3} icon={<Trophy className="h-4 w-4" />} text={t("onboarding_step3")} />
                <StepRow num={4} icon={<Share2 className="h-4 w-4" />} text={t("onboarding_step4")} />
              </div>

              <Button onClick={handleNext} size="lg" className="w-full text-base font-bold">
                {t("onboarding_start_farting")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="text-sm font-medium">{text}</span>
      <span className="ml-auto text-primary">✓</span>
    </div>
  );
}

function StepRow({ num, icon, text }: { num: number; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {num}
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

/** Check if onboarding has been completed (client-side only). */
export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}
