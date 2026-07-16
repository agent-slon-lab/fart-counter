"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind, Trophy, BarChart3, Utensils, CloudSun, Globe, Languages, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { qrToDataURL } from "@/lib/qr";
import Link from "next/link";

type Platform = "android" | "iphone" | "desktop";

export function LandingClient() {
  const language = useStore((s) => s.settings.language);
  const [shareUrl, setShareUrl] = useState("");
  const [qrData, setQrData] = useState("");
  const [platform, setPlatform] = useState<Platform>("android");

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(url);
      qrToDataURL(url, 8).then((data) => {
        setQrData(data);
      });
    }
  }, []);

  const dict = translations[language] ?? translations.en;
  const t = (k: string) => dict[k] ?? translations.en[k] ?? translations.ru[k] ?? k;

  const features = [
    { icon: Wind, title: t("landing_feature_counter_title"), desc: t("landing_feature_counter_desc") },
    { icon: Trophy, title: t("landing_feature_achievements_title"), desc: t("landing_feature_achievements_desc") },
    { icon: BarChart3, title: t("landing_feature_stats_title"), desc: t("landing_feature_stats_desc") },
    { icon: Utensils, title: t("landing_feature_food_title"), desc: t("landing_feature_food_desc") },
    { icon: CloudSun, title: t("landing_feature_weather_title"), desc: t("landing_feature_weather_desc") },
    { icon: Globe, title: t("landing_feature_map_title"), desc: t("landing_feature_map_desc") },
    { icon: Languages, title: t("landing_feature_languages_title"), desc: t("landing_feature_languages_desc") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero */}
      <header className="safe-top mx-auto max-w-2xl px-4 pb-8 pt-12 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-4xl shadow-lg"
        >
          💨
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight sm:text-5xl"
        >
          {t("landing_hero_title")}
        </motion.h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t("landing_hero_subtitle")}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">✓ {t("landing_no_ads")}</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">✓ {t("landing_no_tracking")}</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">✓ {t("landing_offline")}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            {t("landing_hero_cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Screenshot mockup */}
      <section className="mx-auto max-w-2xl px-4 py-6">
        <div className="mx-auto aspect-[9/16] w-56 overflow-hidden rounded-3xl border-2 border-primary/30 bg-card shadow-2xl">
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("today")}</p>
            <div className="text-6xl font-black text-primary">0</div>
            <p className="text-sm text-muted-foreground">{t("farts_today")}</p>
            <div className="mt-2 flex h-32 w-32 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Wind className="h-10 w-10" />
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">{t("add_fart")}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="mb-2 text-center text-2xl font-bold">{t("landing_features_title")}</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t("landing_features_subtitle")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Install with platform-specific instructions */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6">
          <h2 className="mb-2 text-center text-2xl font-bold">{t("landing_install_title")}</h2>
          <p className="mb-5 text-center text-sm text-muted-foreground">{t("landing_install_desc")}</p>

          {/* QR + Open App */}
          <div className="mb-6 flex flex-col items-center gap-3">
            {qrData && (
              <div className="inline-block rounded-2xl bg-white p-3 shadow-md">
                <img src={qrData} alt="QR" className="h-48 w-48" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("landing_qr_title")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
            >
              {t("open_app")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Platform tabs */}
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("landing_install_choose_platform")}
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <PlatformTab active={platform === "android"} onClick={() => setPlatform("android")} icon="📱" label="Android" />
            <PlatformTab active={platform === "iphone"} onClick={() => setPlatform("iphone")} icon="🍎" label="iPhone" />
            <PlatformTab active={platform === "desktop"} onClick={() => setPlatform("desktop")} icon="🖥️" label="PC" />
          </div>

          {/* Platform instructions */}
          {platform === "android" && (
            <InstallSteps
              title={t("landing_install_android_title")}
              steps={[
                t("landing_install_android_step1"),
                t("landing_install_android_step2"),
                t("landing_install_android_step3"),
                t("landing_install_android_step4"),
              ]}
            />
          )}
          {platform === "iphone" && (
            <InstallSteps
              title={t("landing_install_iphone_title")}
              steps={[
                t("landing_install_iphone_step1"),
                t("landing_install_iphone_step2"),
                t("landing_install_iphone_step3"),
                t("landing_install_iphone_step4"),
              ]}
            />
          )}
          {platform === "desktop" && (
            <InstallSteps
              title={t("landing_install_desktop_title")}
              steps={[
                t("landing_install_desktop_step1"),
                t("landing_install_desktop_step2"),
                t("landing_install_desktop_step3"),
                t("landing_install_desktop_step4"),
              ]}
            />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="safe-bottom mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">{t("landing_footer")}</p>
      </footer>
    </div>
  );
}

function PlatformTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
        active ? "border-primary bg-primary/15 scale-105" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function InstallSteps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-4"
    >
      <p className="mb-3 text-sm font-bold">{title}</p>
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
    </motion.div>
  );
}
