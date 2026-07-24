"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { resolveTranslation, loadExtraTranslations, areExtraTranslationsLoaded, pluralize, type Language } from "@/lib/i18n";

/**
 * Translation hook — returns a `t(key)` function bound to the current language.
 * For es/pt/de/fr/hi, loads translations lazily from /locales/{lang}.json on first use.
 * RU/EN are bundled inline (instant).
 */
export function useT() {
  const language = useStore((s) => s.settings.language);
  // Re-render trigger when extra translations load
  const [, setTick] = useState(0);

  // Load extra translations on language change (if not already loaded)
  useEffect(() => {
    if (language === "ru" || language === "en") return; // inline, no fetch
    if (areExtraTranslationsLoaded(language)) return; // already cached
    let cancelled = false;
    loadExtraTranslations(language).then(() => {
      if (!cancelled) setTick((n) => n + 1); // trigger re-render
    });
    return () => { cancelled = true; };
  }, [language]);

  const t = useCallback((key: string): string => {
    return resolveTranslation(language, key);
  }, [language]);

  return { t, lang: language };
}

/** Re-export pluralize for convenience. */
export { pluralize };
export type { Language };
