import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
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
  metadataBase: new URL("https://fartcounter.app"),
  title: {
    default: "Счётчик Пуков — Fart Counter",
    template: "%s · Счётчик Пуков",
  },
  description:
    "Бесплатное офлайн PWA для отслеживания пуков. Юмор, статистика, 18 достижений, дневник питания, погода, мировая карта. Без рекламы, без слежки. 7 языков.",
  manifest: "/manifest.json",
  applicationName: "Счётчик Пуков",
  keywords: [
    "fart counter",
    "счётчик пуков",
    "fart tracker",
    "PWA",
    "offline",
    "health tracker",
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
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Счётчик Пуков",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Счётчик Пуков — Fart Counter",
    description: "Бесплатное офлайн PWA для отслеживания твоей ветрености. 18 достижений, 7 языков, без рекламы.",
    type: "website",
    locale: "ru_RU",
    siteName: "Fart Counter",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fart Counter — Free offline PWA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Счётчик Пуков — Fart Counter",
    description: "Бесплатное офлайн PWA. Без рекламы, без слежки. 7 языков.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#84cc16" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f17" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
