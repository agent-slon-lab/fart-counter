# 💨 Fart Counter

> **Free offline PWA for tracking your farts.** Humor, stats, 23 achievements, food diary, weather, world map. No ads, no tracking.

**Version: 1.4.6**

🇷🇺 **Русская версия:** [README.md](./README.md)

---

## 📱 Install on your phone

Open the app on your phone and add to home screen:

**🌐 Link:** [fart-counter-lake.vercel.app](https://fart-counter-lake.vercel.app/)

- 🤖 **Android (Chrome):** open link → menu (⋮) → "Install app"
- 🍎 **iPhone (Safari):** open link → Share → "Add to Home Screen"

---

## 🌟 Features

- 📊 **Fart counter** with big +1 button and animation
- 🏷️ **11 tags**: Silent, Smelly, Loud, Long, In toilet, Accidental, Whisper, Burst, Musical, Wave, Frog
- 🔊 **14 sounds** + auto-selection by tag
- 🏆 **23 achievements** (20 + 3 legendary)
- 📈 **Statistics** with charts (Week/Month/Year) + CSV/JSON export
- 📅 **Journal** with calendar
- 🍔 **Food diary** — find your triggers
- 😊 **Mood diary**
- 🌤️ **Weather and farts** — funny correlations
- 🔮 **Fart predictor**
- 🌍 **World ranking** (anonymous)
- 💡 **100 facts** in 7 languages
- 📤 **Share cards** (Spotify Wrapped style)
- 🎨 **Themes** + 4 accents
- 🌐 **7 languages**: 🇷🇺 🇬🇧 🇪🇸 🇵🇹 🇩🇪 🇫🇷 🇮🇳
- 📱 **PWA**: offline, install on phone, notifications
- 🔄 **Auto-update**

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
│   ├── pwa/                # Install prompt, Update banner
│   └── ui/                 # shadcn/ui
├── lib/
│   ├── i18n.ts             # 7 languages
│   ├── store.ts            # Zustand store
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
└── icon-*.png              # Icons
```

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md)

---

**Made with 💨 and love. No servers, no tracking.**
