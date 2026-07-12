"use client";

import { useStore } from "@/lib/store";
import { translations, pluralize, type TranslationKey, type Language } from "@/lib/i18n";

/** Translation hook — returns a `t(key)` function bound to the current language. */
export function useT() {
  const language = useStore((s) => s.settings.language);
  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.ru[key] ?? String(key);
  };
  return { t, lang: language };
}

/** Re-export pluralize for convenience. */
export { pluralize };
export type { Language };
