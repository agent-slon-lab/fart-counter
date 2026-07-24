"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, dateKey } from "@/lib/store";
import { useT } from "@/hooks/use-t";

export function DailyBonusPopup() {
  const { t } = useT();
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const lastBonusDay = useStore((s) => s.lastBonusDay);
  const claimDailyBonus = useStore((s) => s.claimDailyBonus);
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const today = dateKey(new Date());
    if (lastBonusDay === today) return; // Already claimed

    // Delay 2s after launch (after welcome popup)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [lastBonusDay]);

  function handleClaim() {
    const total = claimDailyBonus();
    setAmount(total);
    setVisible(false);
  }

  const streakMult = Math.min(Math.floor(streak / 3) + 1, 5); // ×1 to ×5
  const baseBonus = 50;
  const streakBonus = Math.min(streak * 10, 200);
  const totalBonus = baseBonus + streakBonus;
  const tomorrowBonus = baseBonus + Math.min((streak + 1) * 10, 200);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClaim}
        >
          <motion.div
            className="relative w-full max-w-xs rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-2xl"
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
              className="mx-auto my-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15"
            >
              <Gift className="h-10 w-10 text-primary" />
            </motion.div>

            <h2 className="mb-1 text-xl font-black">{t("daily_bonus_title")}</h2>

            <div className="my-4">
              <p className="text-4xl font-black text-primary">
                +{totalBonus} XP
              </p>
              {streak >= 3 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("daily_bonus_streak")
                    .replace("{n}", String(streak))
                    .replace("{mult}", String(streakMult))}
                </p>
              )}
            </div>

            {streak > 0 && (
              <div className="mb-4 rounded-lg bg-muted/50 p-2">
                <p className="text-xs">
                  🔥 {streak} {t("streak_days")}
                </p>
              </div>
            )}

            <Button onClick={handleClaim} size="lg" className="w-full text-base font-bold">
              {t("daily_bonus_claim")} 🎁
            </Button>

            <p className="mt-3 text-[10px] text-muted-foreground">
              {t("daily_bonus_tomorrow").replace("{n}", String(tomorrowBonus))}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
