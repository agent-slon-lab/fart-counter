"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore, dateKey, getTotalAllTime } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { getWindinessLevel } from "@/lib/achievements";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const CARD_W = 360;
const CARD_H = 640;

export function ShareCardDialog({ open, onOpenChange }: Props) {
  const { t, lang } = useT();
  const farts = useStore((s) => s.farts);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const total = getTotalAllTime(farts);
  const level = getWindinessLevel(total);

  // Best day
  const byDay = new Map<string, number>();
  for (const f of farts) {
    const k = dateKey(new Date(f.ts));
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  let bestDay: { date: string; count: number } | null = null;
  for (const [date, count] of byDay.entries()) {
    if (!bestDay || count > bestDay.count) bestDay = { date, count };
  }
  const bestDayLabel = bestDay
    ? new Date(bestDay.date + "T00:00:00").toLocaleDateString(
        lang === "ru" ? "ru-RU" : "en-US",
        { day: "numeric", month: "long" }
      )
    : "—";

  const monthTotal = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return farts.filter((f) => {
      const d = new Date(f.ts);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  })();

  const funnyText =
    lang === "ru"
      ? `Я пукнул ${total} раз. ${total > 100 ? "Я в топ-10% самых ветреных!" : "Дорога только начинается!"}`
      : `I farted ${total} times. ${total > 100 ? "Top 10% windiest!" : "Just getting started!"}`;

  /** Build the shareable card as an SVG string with only hex/rgb colors. */
  function buildSVG(): string {
    const grad = level.color;
    // Escape text for XML
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    // Wrap long funnyText into multiple lines (max ~28 chars per line)
    const wrapText = (text: string, maxLen: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > maxLen) {
          if (cur) lines.push(cur.trim());
          cur = w;
        } else {
          cur = (cur + " " + w).trim();
        }
      }
      if (cur) lines.push(cur.trim());
      return lines;
    };
    const funnyLines = wrapText(funnyText, 32);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${grad}"/>
      <stop offset="60%" stop-color="#1a1f17"/>
      <stop offset="100%" stop-color="#0c0f0a"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="20" fill="url(#bg)"/>

  <!-- Decorative big emoji (top-right) -->
  <text x="${CARD_W - 20}" y="120" font-size="180" text-anchor="end" opacity="0.18">${level.emoji}</text>
  <text x="${CARD_W - 20}" y="40" font-size="22" text-anchor="end">💨</text>

  <!-- Header -->
  <text x="24" y="48" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2.2" opacity="0.85">${esc(t("share_card_title")).toUpperCase()}</text>
  <text x="24" y="66" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.5" opacity="0.6">${esc(t("app_name")).toUpperCase()}</text>

  <!-- Total -->
  <text x="24" y="280" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" letter-spacing="1.5" opacity="0.75">${esc(t("share_card_total")).toUpperCase()}</text>
  <text x="24" y="370" fill="#ffffff" font-family="Arial, sans-serif" font-size="96" font-weight="900">${total}</text>

  <!-- Best day + Level cards -->
  <rect x="24" y="410" width="${(CARD_W - 56) / 2}" height="70" rx="8" fill="rgba(255,255,255,0.12)"/>
  <text x="34" y="430" fill="#ffffff" font-family="Arial, sans-serif" font-size="9" letter-spacing="1.4" opacity="0.75">${esc(t("share_card_best_day")).toUpperCase()}</text>
  <text x="34" y="452" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="700">${bestDay?.count ?? 0}</text>
  <text x="34" y="470" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" opacity="0.85">${esc(bestDayLabel)}</text>

  <rect x="${24 + (CARD_W - 56) / 2 + 8}" y="410" width="${(CARD_W - 56) / 2}" height="70" rx="8" fill="rgba(255,255,255,0.12)"/>
  <text x="${34 + (CARD_W - 56) / 2 + 8}" y="430" fill="#ffffff" font-family="Arial, sans-serif" font-size="9" letter-spacing="1.4" opacity="0.75">${esc(t("share_card_level")).toUpperCase()}</text>
  <text x="${34 + (CARD_W - 56) / 2 + 8}" y="452" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="700">${level.emoji}</text>
  <text x="${34 + (CARD_W - 56) / 2 + 8}" y="470" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" opacity="0.9">${esc(t(level.levelKey))}</text>

  <!-- Funny text box -->
  <rect x="24" y="498" width="${CARD_W - 48}" height="${Math.max(48, funnyLines.length * 16 + 16)}" rx="8" fill="rgba(0,0,0,0.32)"/>
  ${funnyLines
    .map(
      (line, i) =>
        `<text x="${CARD_W / 2}" y="${518 + i * 16}" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${esc(line)}</text>`
    )
    .join("\n  ")}

  <!-- Footer -->
  <text x="24" y="${CARD_H - 24}" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" opacity="0.6">${dateKey(new Date())}</text>
  <text x="${CARD_W - 24}" y="${CARD_H - 24}" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" opacity="0.6" text-anchor="end">• ${monthTotal} ${lang === "ru" ? "в этом месяце" : "this month"}</text>
</svg>`;
  }

  /** Render the SVG to a canvas via an Image — no html2canvas needed. */
  async function generateCanvas(): Promise<HTMLCanvasElement | null> {
    try {
      const svg = buildSVG();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";
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
      if (!ctx) {
        URL.revokeObjectURL(url);
        return null;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return canvas;
    } catch (e) {
      console.error("share card render failed", e);
      return null;
    }
  }

  async function handleShare() {
    setBusy(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) {
        toast(t("share_card_failed"), { icon: "⚠️" });
        return;
      }
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast(t("share_card_failed"), { icon: "⚠️" });
          return;
        }
        const file = new File([blob], "fart-stats.png", { type: "image/png" });
        const navAny = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
        };
        if (navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share) {
          try {
            await navAny.share({
              files: [file],
              title: t("share_card_title"),
              text: funnyText,
            });
            toast(t("share_card_shared"), { icon: "📤" });
          } catch {
            // user cancelled — silent
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "fart-stats.png";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast(t("share_card_copied"), { icon: "💾" });
        }
      }, "image/png");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) {
        toast(t("share_card_failed"), { icon: "⚠️" });
        return;
      }
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `fart-stats-${dateKey(new Date())}.png`;
      a.click();
      toast(t("share_card_copied"), { icon: "💾" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{t("share_card_title")}</DialogTitle>

        {/* Live preview of the card — uses HEX colors so it looks the same as the exported PNG */}
        <div style={{ backgroundColor: "#1a1f17", padding: "16px" }}>
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "relative",
              width: "100%",
              overflow: "hidden",
              borderRadius: "16px",
              padding: "20px",
              background: `linear-gradient(135deg, ${level.color} 0%, #1a1f17 60%, #0c0f0a 100%)`,
              aspectRatio: "9 / 16",
              maxHeight: "60vh",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", right: "-24px", top: "-24px", fontSize: "180px", opacity: 0.18, userSelect: "none", lineHeight: 1 }}>
              {level.emoji}
            </div>
            <div style={{ position: "absolute", right: "12px", top: "12px", fontSize: "22px" }}>💨</div>

            <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.85, margin: 0 }}>
                  {t("share_card_title")}
                </p>
                <p style={{ marginTop: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.6, margin: 0 }}>
                  {t("app_name")}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.75, margin: 0 }}>
                    {t("share_card_total")}
                  </p>
                  <p style={{ fontSize: "60px", fontWeight: 900, lineHeight: 1, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {total}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.12)", padding: "8px" }}>
                    <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.75, margin: 0 }}>
                      {t("share_card_best_day")}
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                      {bestDay?.count ?? 0}
                    </p>
                    <p style={{ fontSize: "10px", opacity: 0.85, margin: 0 }}>{bestDayLabel}</p>
                  </div>
                  <div style={{ borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.12)", padding: "8px" }}>
                    <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.75, margin: 0 }}>
                      {t("share_card_level")}
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                      {level.emoji}
                    </p>
                    <p style={{ fontSize: "10px", opacity: 0.9, margin: 0 }}>{t(level.levelKey)}</p>
                  </div>
                </div>

                <p style={{ borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.32)", padding: "8px", textAlign: "center", fontSize: "11px", fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
                  {funnyText}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.6 }}>
                <span>{dateKey(new Date())}</span>
                <span>• {monthTotal} {lang === "ru" ? "в этом месяце" : "this month"}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", borderTop: "1px solid #2a2f25", backgroundColor: "#1a1f17", padding: "12px" }}>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={busy}>
            <Download className="mr-1.5 h-4 w-4" />
            {t("share_card_save")}
          </Button>
          <Button size="sm" onClick={handleShare} disabled={busy}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {t("share_card_share")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
