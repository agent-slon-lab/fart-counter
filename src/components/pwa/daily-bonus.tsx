"use client";

import { useEffect, useState } from "react";
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

    // Delay 3s after launch (after welcome popup which shows at 2.5s)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);
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
    visible && (
      <div
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClaim}
      >
        <div
          className="relative w-full max-w-xs rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-2xl animate-[popIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="mx-auto my-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 animate-[bounceIn_0.4s_ease-out_0.1s_both]"
          >
            <Gift className="h-10 w-10 text-primary" />
          </div>

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
        </div>
      </div>
    )
  );
}
