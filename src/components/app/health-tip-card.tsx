"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useT } from "@/hooks/use-t";

/**
 * Health tip card — shows a random health tip on each app open.
 * Placed on Home under water + bowel/walk block.
 * 20 tips about gut health: walking, water, fiber, regularity, etc.
 */
export function HealthTipCard() {
  const { t } = useT();

  // Random tip index on each mount (changes on app open / navigation)
  const tipIdx = useMemo(() => 1 + Math.floor(Math.random() * 20), []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-primary">
          {t("health_tip_title" as never)}
        </span>
      </div>
      <p className="text-xs leading-snug text-foreground">
        {t(`health_tip_${tipIdx}` as never)}
      </p>
    </Card>
  );
}
