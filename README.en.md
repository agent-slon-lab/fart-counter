# 💨 Fart Counter

> **Free offline PWA for tracking farts and GI health.** Humor, stats, 23 achievements, food diary, medical tracker, clinical analytics. No ads, no tracking.

**Version: 1.9.1**

[▶️ Watch 30s demo](https://youtube.com/shorts/SU068NOUf_8)

🇷🇺 **Русская версия:** [README.md](./README.md)

---

## 📱 Install on your phone

Open the app on your phone and add to home screen:

**🌐 Link:** [fart-counter-lake.vercel.app](https://fart-counter-lake.vercel.app/)

- 🤖 **Android (Chrome):** open link → menu (⋮) → "Install app"
- 🍎 **iPhone (Safari):** open link → Share → "Add to Home Screen"

---

## 🌟 Features

### 🎭 Two app modes

- 🔥 **Fun mode** — full features: farts, tags, sounds, gamification, shop, humor
- 🩺 **Medical mode** — serious GI tracker: food, toilet, analytics, doctor report. No jokes

Switch in Profile. Medical mode hides fart sections, shop, history — pure clinical interface remains.

### Core (fun mode)
- 📊 **Fart counter** with big +1 button and animation
- 🏷️ **11 tags**: Silent, Smelly, Loud, Long, In toilet, Accidental, Whisper, Burst, Musical, Wave, Frog
- 🔊 **14 sounds** + auto-selection by tag
- 🏆 **23 achievements** (20 + 3 legendary)
- 📈 **Statistics** with charts (Week/Month/Year) + CSV/JSON export
- 📅 **Journal** with calendar

### 🩺 Medical GI tracker (both modes)

#### Bowel data (Bristol Stool Scale)
- 🚽 **Bristol Stool Scale** (type 1-7, medical standard) with SVG icons
- 😣 **Tenesmus** — urge without result
- 🚫 **Feeling of incomplete evacuation**
- 📊 **VAS pain scale 0-10** (Visual Analog Scale)
- 🔊 **Borborygmi** (rumbling) in symptoms list
- 📝 **Symptoms**: bloating, pain, nausea, heartburn, cramps, rumbling
- ✏️ **Edit records** (time + Bristol + symptoms)

#### Food diary
- 🍔 **28 presets** (beans, fish, porridge, coffee, etc.) + custom foods
- 📏 **Portion size** (small 🟢 / medium 🟡 / large 🔴)
- 🌾 **FODMAP tagging** based on Monash University:
  - ✅ Low FODMAP (safe)
  - 🌾 Oligosaccharides (fructans + GOS): wheat, onion, garlic, legumes
  - 🥛 Lactose: dairy
  - 🍎 Fructose: apples, honey, HFCS
  - 🍬 Polyols: mushrooms, sugar alcohols
  - ⚠️ Other trigger: high-fat, caffeine, spicy, alcohol

### 📊 Clinical analytics (Insights, medical mode + PDF)

- 📊 **Hourly Heatmap** — 24-hour distribution of bowel visits, color intensity, peak hour
- ⏱️ **Lag Windowing** — reaction-time analysis in 3 windows after eating:
  - **0-2h (stomach)** — reflux/fat intolerance
  - **2-6h (small intestine)** — SIBO/rapid transit
  - **6-24h (large intestine)** — FODMAP fermentation
- ⚠️ **Risk Ratio (RR)** — for each food with ≥3 exposures:
  - Formula: RR = P(symptom|after food) ÷ P(symptom|no food)
  - 95% confidence interval (Wald)
  - Badges: "Elevated risk" (RR≥2), "No notable", "Fewer symptoms" (RR<1)
- 🥗 **FODMAP profile** — distribution of consumed foods by 6 Monash categories with progress bars
- 📅 Period selector: **7 / 14 / 30 days**

### 📄 Doctor report
- 🏥 **Medical report** (PDF via browser print)
- Contains: summary, Bristol distribution, top food triggers, trend chart, symptoms log
- + **Summary dashboard** with heatmap, lag analysis, Risk Ratio and FODMAP profile
- 📊 **CSV export** of raw data
- 📅 Period selector: **7 / 30 / 90 days**

### Analytics (fun mode)
- 🧠 **AI insights** — up to 9 automatic patterns (top weekday, peak time, streak, correlations)
- 📅 **Weekly cycle** — visible from day 1
- 🕐 **Time of day** — 4 periods (Night/Morning/Afternoon/Evening)
- 📊 **Monthly trend** with sparkline
- 🔮 **Fart predictor** with confidence %

### Reminders (humorous, fun mode)
- 🌅 **Morning toilet** (after 10:00) — 5 funny variants
- 🚶 **Walk** (after 15:00) — 5 variants about peristalsis
- 🌙 **Evening** — don't forget to log your farts

### Other
- 💧 **Water counter**
- 🚶 **Walk tracker** (+8 XP per walk)
- 😊 **Mood diary** + correlation with farts
- 🌤️ **Weather and farts** — funny correlations
- 🌍 **World ranking** (anonymous)
- 💡 **100 facts** in 7 languages (education in both modes)
- 📤 **Share cards** (Spotify Wrapped style)
- 👶 **Baby mode** — for babies: soft colors, gas instead of farts
- 🛡️ **Anti-farm profiles** — XP/achievements only on primary profile
- 🎮 **Levels never decrease** when buying from shop (maxXp)
- 🏆 **Levels grid** (12 levels: 🌱 → 🚀)
- 🎨 **Themes** + 8 accents
- 🌐 **7 languages**: 🇷🇺 🇬🇧 🇪🇸 🇵🇹 🇩🇪 🇫🇷 🇮🇳
- 📱 **PWA**: offline, install on phone, notifications
- 🔄 **Auto-update**

---

## 🧪 Test data for verifying medical features

Ready-to-use backup with 30 days of data (36 poops + 68 food events + 18 walks + 31 days of water):
[download `fart-counter-medical-test-data.json`](https://fart-counter-lake.vercel.app/download/fart-counter-medical-test-data.json)

**How to use:**
1. Open the app → Profile → Backup → "🔄 Restore from file"
2. Select the downloaded file
3. Switch to Medical mode (Profile → 🩺 Medical)
4. Open Insights — you'll see all 4 clinical analytics sections

---

## 🚀 Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## 📦 Install on phone (as PWA)

### Android (Chrome)
Open link → menu (⋮) → "Install app"

### iPhone (Safari)
Open link in Safari → Share → "Add to Home Screen"

---

## 🛠 Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand + localStorage |
| Charts | Recharts |
| Animations | Framer Motion |
| Sounds | Web Audio API (synthesis) |
| QR code | custom implementation (0 dependencies) |
| FODMAP | Monash University Low FODMAP Diet |

---

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # App (PWA)
│   └── landing/            # Landing for SEO
├── components/
│   ├── app/                # Screens
│   │   ├── medical-dashboard.tsx  # Heatmap + lag + RR + FODMAP
│   │   └── medical-report.tsx     # PDF report for doctor
│   ├── pwa/                # Install prompt, Update banner
│   └── ui/                # shadcn/ui
├── lib/
│   ├── i18n.ts             # 7 languages (844 keys each)
│   ├── store.ts            # Zustand store v9
│   ├── medical-analytics.ts # Heatmap, lag, RR, FODMAP functions
│   ├── fodmap.ts           # FODMAP map + lag windows
│   ├── achievements.ts     # 23 achievements
│   ├── sounds.ts           # 14 sounds
│   ├── facts.ts            # 100 facts
│   ├── version.ts          # Update checker
│   ├── notifications.ts    # Notifications
│   ├── qr.ts               # QR generator
│   └── export.ts           # CSV/JSON export
└── hooks/
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── version.json            # Current version
├── download/               # Test data for QA
└── icon-*.png              # Icons
```

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md)

### Key versions
- **v1.9.1** — Medical Dashboard: heatmap, lag windowing, risk ratio, FODMAP profile (Insights + PDF)
- **v1.9.0** — Clinical upgrade: FODMAP tags, portion size, tenesmus, VAS, borborygmi
- **v1.8.0** — App mode switcher (Fun/Medical) + Medical Insights
- **v1.7.x** — UI/UX improvements, i18n in 7 languages, PWA optimization

---

**Made with 💨 and love. No servers, no tracking. Not a substitute for medical consultation.**
