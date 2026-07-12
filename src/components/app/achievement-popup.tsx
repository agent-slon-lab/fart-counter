"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AchievementDef } from "@/lib/achievements";
import { useT } from "@/hooks/use-t";
import { Button } from "@/components/ui/button";

interface Props {
  achievement: AchievementDef;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: Props) {
  const { t } = useT();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => {
            const colors = ["#84cc16", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7"];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.3;
            const dur = 1.5 + Math.random() * 1.5;
            const color = colors[i % colors.length];
            return (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${left}%`,
                  backgroundColor: color,
                  animationDelay: `${delay}s`,
                  animationDuration: `${dur}s`,
                }}
              />
            );
          })}
        </div>

        <motion.div
          className="relative w-full max-w-xs rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-2xl"
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
            className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-5xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
          >
            {achievement.icon}
          </motion.div>
          <h2 className="mb-1 text-xl font-bold">{t(achievement.nameKey)}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {t(achievement.descKey)}
          </p>
          <Button onClick={onClose} className="w-full" size="lg">
            🎉 {t("ach_keep_going")}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
