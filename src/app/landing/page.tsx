import type { Metadata } from "next";
import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "Счётчик Пуков — Fart Counter | Бесплатное офлайн PWA",
  description:
    "Бесплатное офлайн PWA для отслеживания пуков. Юмор, статистика, 18 достижений, дневник питания, погода, мировая карта. Без рекламы, без слежки. 7 языков.",
  keywords: [
    "счётчик пуков",
    "fart counter",
    "fart tracker",
    "PWA",
    "offline app",
    "contador de pedos",
    "contador de pum",
    "pédó compteur",
    "furz zähler",
    "health tracker",
  ],
  openGraph: {
    title: "Счётчик Пуков — Fart Counter",
    description: "Бесплатное офлайн PWA для отслеживания твоей ветрености. 18 достижений, 7 языков, без рекламы.",
    type: "website",
    locale: "ru_RU",
    siteName: "Fart Counter",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Fart Counter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Счётчик Пуков — Fart Counter",
    description: "Бесплатное офлайн PWA. Без рекламы, без слежки. 7 языков.",
    images: ["/icon-512.png"],
  },
  alternates: {
    canonical: "/landing",
    languages: {
      ru: "/landing",
      en: "/landing",
      es: "/landing",
      pt: "/landing",
      de: "/landing",
      fr: "/landing",
      hi: "/landing",
    },
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
