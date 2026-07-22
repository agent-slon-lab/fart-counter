"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Check, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore, type AccentColor } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { SHOP_ITEMS, type ShopItem } from "@/lib/levels";
import { toast } from "sonner";

export function ShopScreen() {
  const { t } = useT();
  const xp = useStore((s) => s.xp);
  const purchasedItems = useStore((s) => s.purchasedItems);
  const purchaseItem = useStore((s) => s.purchaseItem);
  const activeBadge = useStore((s) => s.activeBadge);
  const setActiveBadge = useStore((s) => s.setActiveBadge);
  const setAccent = useStore((s) => s.setAccent);
  const settings = useStore((s) => s.settings);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const categories = ["badge", "theme"] as const;
  const categoryLabels: Record<string, string> = {
    badge: t("shop_category_badge"),
    theme: t("shop_category_theme"),
  };

  function handleBuy(item: ShopItem) {
    if (purchasedItems.includes(item.id)) return;
    if (xp < item.cost) {
      toast(t("shop_insufficient"), { icon: "⚠️" });
      return;
    }
    setConfirmItem(item);
  }

  function confirmPurchase() {
    if (!confirmItem) return;
    const ok = purchaseItem(confirmItem.id, confirmItem.cost);
    if (ok) {
      toast(`${confirmItem.icon} ${t("shop_purchased")}!`, { icon: "✅" });
    } else {
      toast(t("shop_insufficient"), { icon: "⚠️" });
    }
    setConfirmItem(null);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="h-5 w-5" />
          {t("shop_title")}
        </h1>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5">
          <span className="text-sm font-black text-primary">{xp}</span>
          <span className="text-[10px] font-bold text-primary">XP</span>
        </div>
      </div>

      {/* Referral — Coming Soon */}
      <Card className="border-dashed border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm font-bold">{t("referral_coming_soon")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("referral_desc")}</p>
      </Card>

      {/* Shop items by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {categoryLabels[cat]}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SHOP_ITEMS.filter((item) => item.category === cat).map((item) => {
              const purchased = purchasedItems.includes(item.id);
              const canAfford = xp >= item.cost;
              const isBadgeEquipped = item.category === "badge" && activeBadge === item.id;
              const isThemeActive = item.category === "theme" && settings.accent === item.id.replace("theme_", "");
              const isApplied = isBadgeEquipped || isThemeActive;
              return (
                <Card
                  key={item.id}
                  className={`relative p-3 transition-all ${
                    purchased && !isApplied ? "" : isApplied ? "border-primary/40 bg-primary/5" : canAfford ? "border-primary/40" : ""
                  }`}
                >
                  <div className="mb-2 text-center">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <p className="text-center text-xs font-bold leading-tight">{t(item.nameKey)}</p>
                  <p className="mt-0.5 text-center text-[10px] text-muted-foreground leading-tight">
                    {t(item.descKey)}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {purchased ? (
                      <Button
                        size="sm"
                        variant={isApplied ? "default" : "outline"}
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          if (item.category === "badge") {
                            setActiveBadge(item.id);
                          } else if (item.category === "theme") {
                            const accentId = item.id.replace("theme_", "") as AccentColor;
                            setAccent(accentId);
                          }
                          toast(isApplied ? "✓" : `${item.icon} ${t("shop_applied")}`, { duration: 800 });
                        }}
                      >
                        {isApplied ? t("shop_applied") : t("shop_apply")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        className="h-7 px-2 text-[11px]"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                      >
                        {!canAfford && <Lock className="mr-1 h-2.5 w-2.5" />}
                        {item.cost} XP
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirm purchase dialog */}
      <AlertDialog open={!!confirmItem} onOpenChange={(o) => !o && setConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmItem?.icon} {confirmItem && t(confirmItem.nameKey)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("shop_confirm").replace("{cost}", String(confirmItem?.cost ?? 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>{t("shop_buy")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
