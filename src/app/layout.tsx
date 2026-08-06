import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fart-counter-lake.vercel.app"),
  title: {
    default: "Счётчик Пуков — Fart Counter 💨",
    template: "%s · Счётчик Пуков",
  },
  description:
    "💨 Весёлый счётчик пуков с пользой для здоровья. Отслеживай пуки, еду, туалет, ходьбу. Шкала Бристоля, отчёт для врача, 18 достижений. Открытый код, без рекламы, без слежки. Офлайн. 7 языков.",
  manifest: "/manifest.json",
  applicationName: "Счётчик Пуков",
  keywords: [
    "fart counter",
    "счётчик пуков",
    "fart tracker",
    "PWA",
    "offline",
    "health tracker",
    "открытый исходный код",
    "open source",
    "contador de pedos",
    "contador de pum",
    "furz zähler",
    "compteur de pet",
  ],
  authors: [{ name: "Fart Counter" }],
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Счётчик Пуков",
    startupImage: ["/icon-512.png"],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Счётчик Пуков — весёлый трекер здоровья 💨",
    description: "💨 Отслеживай пуки, еду, туалет и ходьбу с юмором. 18 достижений, инсайты, корреляция еды и пуков. Открытый код, без рекламы, без слежки. Работает офлайн!",
    type: "website",
    locale: "ru_RU",
    siteName: "Счётчик Пуков",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Счётчик Пуков — весёлый трекер здоровья, открытый код, без рекламы",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Счётчик Пуков 💨 — весёлый трекер здоровья",
    description: "💨 Пуки + еда + туалет + ходьба. 18 достижений, инсайты. Открытый код, без рекламы, офлайн. 7 языков.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#84cc16" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f17" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* iOS Safari PWA support — required for "Add to Home Screen" */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Счётчик Пуков" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
        <SonnerToaster position="top-center" />
      </body>
    </html>
  );
}
