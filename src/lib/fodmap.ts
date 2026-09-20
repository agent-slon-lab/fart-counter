/**
 * FODMAP classification for food presets.
 * Based on Monash University Low FODMAP Diet.
 * 
 * Categories:
 * - "low" — Low FODMAP (generally safe)
 * - "oligo" — Oligosaccharides (fructans + GOS): wheat, onion, garlic, legumes
 * - "lactose" — Lactose: dairy products
 * - "fructose" — Excess fructose: apples, pears, honey
 * - "polyol" — Polyols (sorbitol, mannitol): mushrooms, stone fruits
 * - "trigger" — Non-FODMAP trigger: high fat, caffeine, spicy, alcohol
 */

export type FodmapCategory = "low" | "oligo" | "lactose" | "fructose" | "polyol" | "trigger";

export const FODMAP_MAP: Record<string, FodmapCategory> = {
  food_beans: "oligo",       // GOS (galacto-oligosaccharides)
  food_cabbage: "low",      // Low FODMAP but may cause gas (raffinose in large amounts)
  food_broccoli: "low",      // Low FODMAP
  food_dairy: "lactose",     // Lactose
  food_chips: "trigger",     // High fat
  food_soda: "fructose",     // High fructose corn syrup
  food_onion: "oligo",       // Fructans (very high)
  food_egg: "low",           // Low FODMAP (protein)
  food_bread: "oligo",       // Wheat fructans
  food_fastfood: "trigger",  // High fat + multiple triggers
  food_nuts: "oligo",        // Cashews high GOS, most others low
  food_fish: "low",          // Low FODMAP (protein)
  food_porridge: "low",      // Oats are low FODMAP
  food_rice: "low",          // Low FODMAP
  food_apple: "fructose",   // Fructose + sorbitol (high)
  food_banana: "low",        // Low FODMAP (ripe)
  food_corn: "low",          // Low FODMAP
  food_mushroom: "polyol",  // Mannitol (high)
  food_meat: "low",          // Low FODMAP (protein)
  food_soup: "low",          // Varies, assume low
  food_cheese: "low",        // Hard cheese is low FODMAP
  food_potato: "low",       // Low FODMAP
  food_carrot: "low",       // Low FODMAP
  food_coffee: "trigger",   // Caffeine stimulates peristalsis
  food_beer: "oligo",       // Fructans + gluten
  food_garlic: "oligo",     // Fructans (very high)
  food_pepper: "trigger",   // Spicy
  food_sweets: "polyol",   // Sugar alcohols, polyols
};

export const FODMAP_LABELS: Record<FodmapCategory, { ru: string; en: string; emoji: string }> = {
  low:     { ru: "Низкое FODMAP",   en: "Low FODMAP",        emoji: "✅" },
  oligo:   { ru: "Олигосахариды",   en: "Oligosaccharides",   emoji: "🌾" },
  lactose: { ru: "Лактоза",         en: "Lactose",            emoji: "🥛" },
  fructose:{ ru: "Фруктоза",        en: "Fructose",           emoji: "🍎" },
  polyol:  { ru: "Полиолы",         en: "Polyols",            emoji: "🍬" },
  trigger: { ru: "Другой триггер",  en: "Other trigger",      emoji: "⚠️" },
};

/**
 * Lag windows for clinical correlation:
 * 0-2h: Stomach/esophagus reaction (reflux, fat intolerance)
 * 2-6h: Small intestine (SIBO, rapid transit)
 * 6-24h: Large intestine fermentation (FODMAP gas production)
 */
export const LAG_WINDOWS = [
  { id: "0-2h",  startMs: 0,               endMs: 2 * 3600 * 1000,  label: "0-2ч (желудок)" },
  { id: "2-6h",  startMs: 2 * 3600 * 1000, endMs: 6 * 3600 * 1000,  label: "2-6ч (тонкий кишечник)" },
  { id: "6-24h", startMs: 6 * 3600 * 1000, endMs: 24 * 3600 * 1000, label: "6-24ч (толстый кишечник)" },
] as const;
