"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind, Trophy, BarChart3, Utensils, CloudSun, Globe, Languages, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { qrToDataURL } from "@/lib/qr";
import Link from "next/link";

export function LandingClient() {
  const language = useStore((s) => s.settings.language);
  const [shareUrl, setShareUrl] = useState("");
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(url);
      setQrData(qrToDataURL(url, 6));
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
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">+1 {t("add_fart")}</p>
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

      {/* Install */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
          <h2 className="mb-2 text-2xl font-bold">{t("landing_install_title")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("landing_install_desc")}</p>
          {qrData && (
            <div className="mx-auto inline-block rounded-2xl bg-white p-3 shadow-md">
              <img src={qrData} alt="QR" className="h-44 w-44" />
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{t("landing_qr_title")}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            {t("open_app")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="safe-bottom mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">{t("landing_footer")}</p>
      </footer>
    </div>
  );
}
