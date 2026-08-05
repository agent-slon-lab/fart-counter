"use client";

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useT } from "@/hooks/use-t";

const TIP_COUNT = 20;

/**
 * Health tip card — shows a random health tip on each app open.
 * Placed on Home under water + bowel/walk block.
 * 20 tips about gut health: walking, water, fiber, regularity, etc.
 *
 * NOTE: Random index is generated on CLIENT only (in useEffect) to avoid
 * SSR hydration mismatch (server and client would generate different numbers).
 */
export function HealthTipCard() {
  const { t } = useT();
  // Start with tip #1 (same on server and client — no mismatch)
  const [tipIdx, setTipIdx] = useState(1);

  // Pick random tip AFTER mount (client-only — no hydration error)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTipIdx(1 + Math.floor(Math.random() * TIP_COUNT));
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-primary">
          {t("health_tip_title" as never)}
        </span>
      </div>
      <p className="text-xs leading-snug text-foreground" suppressHydrationWarning>
        {t(`health_tip_${tipIdx}` as never)}
      </p>
    </Card>
  );
}
