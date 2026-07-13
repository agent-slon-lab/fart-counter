"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download } from "lucide-react";
import type { AchievementDef } from "@/lib/achievements";
import { useT } from "@/hooks/use-t";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  achievement: AchievementDef;
  onClose: () => void;
}

const CARD_W = 360;
const CARD_H = 480;

export function AchievementPopup({ achievement, onClose }: Props) {
  const { t, lang } = useT();
  const totalFarts = useStore((s) => s.farts.length);
  const [sharing, setSharing] = useState(false);

  function buildSVG(): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const name = esc(t(achievement.nameKey));
    const desc = esc(t(achievement.descKey));
    const unlockedLabel = esc(t("ach_unlocked"));
    const appName = esc(t("app_name"));
    const keepGoing = esc(t("ach_keep_going"));
    const totalLabel = esc(t("share_card_total"));
    const color = achievement.color;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="60%" stop-color="#1a1f17"/>
      <stop offset="100%" stop-color="#0c0f0a"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="20" fill="url(#bg)"/>
  <text x="${CARD_W - 24}" y="100" font-size="140" text-anchor="end" opacity="0.2">${achievement.icon}</text>
  <text x="24" y="44" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2.2" opacity="0.85">${unlockedLabel.toUpperCase()}</text>
  <text x="24" y="62" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.5" opacity="0.6">${appName.toUpperCase()}</text>
  <text x="${CARD_W / 2}" y="200" font-size="100" text-anchor="middle">${achievement.icon}</text>
  <text x="${CARD_W / 2}" y="260" fill="#ffffff" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle">${name}</text>
  <text x="${CARD_W / 2}" y="290" fill="#ffffff" font-family="Arial, sans-serif" font-size="13" opacity="0.85" text-anchor="middle">${desc}</text>
  <rect x="80" y="330" width="${CARD_W - 160}" height="50" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="${CARD_W / 2}" y="352" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.5" opacity="0.75" text-anchor="middle">${totalLabel.toUpperCase()}</text>
  <text x="${CARD_W / 2}" y="374" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="900" text-anchor="middle">${totalFarts}</text>
  <text x="${CARD_W / 2}" y="430" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" opacity="0.6" text-anchor="middle">${keepGoing} 💨</text>
</svg>`;
  }

  async function generateCanvas(): Promise<HTMLCanvasElement | null> {
    try {
      const svg = buildSVG();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W * scale;
      canvas.height = CARD_H * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return null; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return canvas;
    } catch (e) {
      console.error("achievement card render failed", e);
      return null;
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) { toast(t("share_card_failed"), { icon: "⚠️" }); return; }
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "achievement.png", { type: "image/png" });
        const navAny = navigator as Navigator & {
          canShare?: (d: { files: File[] }) => boolean;
          share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
        };
        const text = lang === "ru"
          ? `Я открыл достижение «${t(achievement.nameKey)}» в Счётчике Пуков! 💨`
          : `I unlocked "${t(achievement.nameKey)}" in Fart Counter! 💨`;
        if (navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share) {
          try {
            await navAny.share({ files: [file], title: t("ach_unlocked"), text });
            toast(t("share_card_shared"), { icon: "📤" });
          } catch { /* cancelled */ }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "achievement.png"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast(t("share_card_copied"), { icon: "💾" });
        }
      }, "image/png");
    } finally {
      setSharing(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => {
            const colors = ["#84cc16", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7"];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.3;
            const dur = 1.5 + Math.random() * 1.5;
            return (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${left}%`,
                  backgroundColor: colors[i % colors.length],
                  animationDelay: `${delay}s`,
                  animationDuration: `${dur}s`,
                }}
              />
            );
          })}
        </div>

        <motion.div
          className="relative w-full max-w-xs rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-2xl"
          style={{ borderColor: achievement.color }}
          initial={{ scale: 0, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            {t("ach_unlocked")}
          </div>
          <motion.div
            className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
            style={{ backgroundColor: `${achievement.color}26` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
          >
            {achievement.icon}
          </motion.div>
          <h2 className="mb-1 text-xl font-bold">{t(achievement.nameKey)}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t(achievement.descKey)}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              ✅ {t("ach_keep_going")}
            </Button>
            <Button size="sm" onClick={handleShare} disabled={sharing}>
              <Share2 className="mr-1 h-3.5 w-3.5" />
              {t("share_achievement")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
