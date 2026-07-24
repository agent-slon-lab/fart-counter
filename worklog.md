
---
Task ID: food-expansion-v5
Agent: main (Z.ai Code)
Task: Expand food presets (nuts, fish, porridge, etc), save user's custom foods for quick re-add, build food↔fart correlation warning system with funny messages

Work Log:
- Added 18 new preset foods (food_nuts, food_fish, food_porridge, food_rice, food_apple, food_banana, food_corn, food_mushroom, food_meat, food_soup, food_cheese, food_potato, food_carrot, food_coffee, food_beer, food_garlic, food_pepper, food_sweets) to i18n.ts for RU + EN
- Added same 18 food translations to i18n-extra.json for ES/PT/DE/FR/HI (warning messages fall back to EN via existing t() fallback chain)
- Added 12 funny warning messages (food_warn_1..12) + warning title/subtitle/3 intensity labels + My Foods UI strings
- store.ts: added `customFoods: string[]` state, `addCustomFood(name)` + `removeCustomFood(name)` actions, included in importData/resetAllData, bumped persist version 4→5 with migration
- food-screen.tsx full rewrite:
  - PRESET_FOODS expanded from 10 → 28 items
  - New "My Foods" card with saved custom foods (one-tap re-add + remove)
  - Custom food input now auto-saves to customFoods list + shows "Saved to My foods" toast
  - New `tryAddFood()` gate: if food eaten ≥2 times before AND avg farts ≥3 in 24h window → opens WarningDialog
  - WarningDialog: picks 1 of 12 random funny warnings, color/emoji scales by severity (3-5 💨 amber, 6-9 🔥 orange, 10+ 💥 red), "Maybe not 😅" cancels, "Add anyway!" confirms
- Lint: clean (0 errors)
- Dev log: all GET / 200, no compile errors
- Agent Browser verified end-to-end:
  - Add food dialog shows all 28 presets with correct icons + labels
  - Custom food "Борщ" added → appeared in Eaten Today + My Foods section
  - Injected test data (5 farts + 2nd Борщ entry) → correlation showed "Борщ 4 💨 · 2×" + Top Trigger card
  - Clicking Борщ in My Foods triggered WarningDialog with "Run while you still can! 🏃"
  - "Add anyway!" → food added (count 2→3)
  - "Maybe not 😅" → cancelled (count stayed 3)
  - No runtime errors in console

Stage Summary:
- Food diary now has 28 presets (was 10) covering nuts/fish/porridge/rice/fruits/veg/meat/dairy/drinks/spices
- Custom foods auto-saved to reusable "My Foods" list — users never re-type the same food
- Correlation warning system live: 3rd+ time eating a known gas-trigger food shows a funny warning dialog with random message (date/couch/elevator/fire/etc jokes) and severity-scaled UI
- All 7 languages have new food translations; warning text falls back to EN for non-RU/EN locales
- Store version bumped to 5 with backward-compatible migration
