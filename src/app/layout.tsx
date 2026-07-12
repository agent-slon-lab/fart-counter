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
  title: "Счётчик Пуков — Fart Counter",
  description:
    "Офлайн PWA для отслеживания пуков. Юмор, статистика, достижения. Никаких серверов, никакой слежки.",
  manifest: "/manifest.json",
  applicationName: "Счётчик Пуков",
  keywords: [
    "fart counter",
    "счётчик пуков",
    "PWA",
    "offline",
    "health tracker",
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
    title: "Счётчик Пуков",
    description: "Офлайн PWA для отслеживания пуков.",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-hidden`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
