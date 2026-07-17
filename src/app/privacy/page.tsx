import type { Metadata } from "next";
import { PrivacyClient } from "./privacy-client";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Fart Counter",
  description: "Политика конфиденциальности приложения Счётчик Пуков. Без рекламы, без слежки, без серверов.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
