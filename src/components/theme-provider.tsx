"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Applies theme (light/dark/system) and accent color (green/pink/blue/gold)
 * to the <html> element based on the persisted store settings.
 * Also registers a service worker for offline PWA support.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.settings.theme);
  const accent = useStore((s) => s.settings.accent);
  const language = useStore((s) => s.settings.language);

  // Apply dark/light class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(mode);
    };
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) =>
        apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  // Apply accent attribute
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accent);
  }, [accent]);

  // Apply <html lang="...">
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Register service worker for offline PWA
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // ignore registration errors (e.g. during dev)
        });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return <>{children}</>;
}
