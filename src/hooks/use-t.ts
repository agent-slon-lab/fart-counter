"use client";

import { useStore } from "@/lib/store";
import { translations, pluralize, type Language } from "@/lib/i18n";

/** Translation hook — returns a `t(key)` function bound to the current language. */
export function useT() {
  const language = useStore((s) => s.settings.language);
  const t = (key: string): string => {
    const dict = translations[language] ?? translations.en;
    return dict[key] ?? translations.en[key] ?? translations.ru[key] ?? String(key);
  };
  return { t, lang: language };
}

/** Re-export pluralize for convenience. */
export { pluralize };
export type { Language };
