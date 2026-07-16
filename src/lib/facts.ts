// Fart facts library — 100 facts per language (RU/EN/ES/PT/DE/FR full, HI partial with EN fallback)

import type { Language } from "./i18n";

import ruFacts from "./facts-ru.json";
import enFacts from "./facts-en.json";
import esFacts from "./facts-es.json";
import ptFacts from "./facts-pt.json";
import deFacts from "./facts-de.json";
import frFacts from "./facts-fr.json";
import hiFacts from "./facts-hi.json";

const ALL_FACTS: Record<Language, string[]> = {
  ru: ruFacts as string[],
  en: enFacts as string[],
  es: esFacts as string[],
  pt: ptFacts as string[],
  de: deFacts as string[],
  fr: frFacts as string[],
  hi: hiFacts as string[],
};

/** Get all facts for a language (falls back to English if language has fewer facts). */
export function getFacts(lang: Language): string[] {
  const facts = ALL_FACTS[lang] ?? [];
  const enFacts = ALL_FACTS.en;
  // If the language has fewer than 50 facts, top up with English
  if (facts.length < 50 && enFacts.length > facts.length) {
    return [...facts, ...enFacts.slice(facts.length)];
  }
  return facts.length > 0 ? facts : enFacts;
}

/** Get the "fact of the day" — deterministic based on the date so it doesn't change on every render. */
export function getFactOfDay(lang: Language, date: Date = new Date()): string {
  const facts = getFacts(lang);
  if (facts.length === 0) return "";
  // Day-of-year based index
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const idx = dayOfYear % facts.length;
  return facts[idx];
}

/** Get a random fact (different each call). */
export function getRandomFact(lang: Language): string {
  const facts = getFacts(lang);
  if (facts.length === 0) return "";
  return facts[Math.floor(Math.random() * facts.length)];
}
