"use client";

import { useState } from "react";
import { Shield, Database, Globe, Wifi, Eye, Trash2, Github, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import Link from "next/link";

export function PrivacyClient() {
  const language = useStore((s) => s.settings.language);
  const dict = translations[language] ?? translations.en;
  const t = (k: string) => dict[k] ?? translations.en[k] ?? translations.ru[k] ?? k;
  const isRu = language === "ru";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isRu ? "Назад в приложение" : "Back to app"}
          </Link>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black">
            {isRu ? "Политика конфиденциальности" : "Privacy Policy"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRu ? "Версия 1.0 · 17 июля 2026" : "Version 1.0 · July 17, 2026"}
          </p>
        </div>

        {/* Principle */}
        <div className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-lg font-bold">
            {isRu
              ? "Никакой слежки. Никаких серверов. Никакой рекламы."
              : "No tracking. No servers. No ads."}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <PrivacySection
            icon={<Eye className="h-5 w-5" />}
            title={isRu ? "1. Какие данные мы собираем?" : "1. What data do we collect?"}
          >
            {isRu
              ? "Никакие. Приложение не запрашивает имя, email, телефон, аккаунты или пароли. Нет cookie для отслеживания. Нет рекламных идентификаторов."
              : "None. The app does not request name, email, phone, accounts, or passwords. No tracking cookies. No advertising identifiers."}
          </PrivacySection>

          <PrivacySection
            icon={<Database className="h-5 w-5" />}
            title={isRu ? "2. Где хранятся данные?" : "2. Where is data stored?"}
          >
            {isRu
              ? "Все данные хранятся локально в вашем браузере (localStorage). Они никогда не покидают ваше устройство. Данные включают: записи пуков, счётчик воды, дневник питания, настроение, настройки."
              : "All data is stored locally in your browser (localStorage). It never leaves your device. Data includes: fart records, water counter, food diary, mood, settings."}
          </PrivacySection>

          <PrivacySection
            icon={<Globe className="h-5 w-5" />}
            title={isRu ? "3. Геолокация" : "3. Geolocation"}
          >
            {isRu
              ? "Геолокация опциональна и используется только для получения местной погоды и определения часового пояса. Координаты не сохраняются и не передаются третьим лицам. Если вы отключите геолокацию — приложение будет работать нормально."
              : "Geolocation is optional and used only for getting local weather and determining timezone. Coordinates are not stored and not shared with third parties. If you disable geolocation — the app works fine."}
          </PrivacySection>

          <PrivacySection
            icon={<Wifi className="h-5 w-5" />}
            title={isRu ? "4. Внешние API" : "4. External APIs"}
          >
            {isRu
              ? "Приложение обращается к бесплатному Open-Meteo API для погоды (без ключа, без отслеживания). Для IP-геолокации используются geolocation-db.com и ipwho.is (IP не сохраняется)."
              : "The app uses free Open-Meteo API for weather (no key, no tracking). For IP geolocation it uses geolocation-db.com and ipwho.is (IP is not stored)."}
          </PrivacySection>

          <PrivacySection
            icon={<Shield className="h-5 w-5" />}
            title={isRu ? "5. Реклама и аналитика" : "5. Advertising and analytics"}
          >
            {isRu
              ? "Нет рекламы. Нет аналитики. Нет трекеров. Мы не используем Google Analytics, Yandex.Metrica, Facebook Pixel или любые другие трекеры."
              : "No ads. No analytics. No trackers. We do not use Google Analytics, Yandex.Metrica, Facebook Pixel, or any other trackers."}
          </PrivacySection>

          <PrivacySection
            icon={<Trash2 className="h-5 w-5" />}
            title={isRu ? "6. Удаление данных" : "6. Deleting data"}
          >
            {isRu
              ? "Чтобы удалить все данные: откройте приложение → Профиль → Данные → «Сбросить все данные». Или очистите данные сайта в настройках браузера."
              : "To delete all data: open app → Profile → Data → \"Reset all data\". Or clear site data in your browser settings."}
          </PrivacySection>

          <PrivacySection
            icon={<Github className="h-5 w-5" />}
            title={isRu ? "7. Открытый исходный код" : "7. Open source"}
          >
            {isRu
              ? "Исходный код полностью открыт на GitHub. Любой может проверить, что приложение не собирает данные."
              : "The source code is fully open on GitHub. Anyone can verify that the app does not collect data."}
            <a
              href="https://github.com/agent-slon-lab/fart-counter"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              github.com/agent-slon-lab/fart-counter
            </a>
          </PrivacySection>
        </div>

        {/* Future note */}
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {isRu
              ? "⚠️ Если мы добавим серверные функции (например, глобальную карту пуков), мы обновим эту Политику и явно запросим ваше согласие."
              : "⚠️ If we add server-side features (e.g., a global fart map), we will update this Policy and explicitly ask for your consent."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 Fart Counter. {isRu ? "Сделано с 💨 и любовью." : "Made with 💨 and love."}</p>
          <p className="mt-1">{isRu ? "Без серверов, без слежки." : "No servers, no tracking."}</p>
        </div>
      </div>
    </div>
  );
}

function PrivacySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
