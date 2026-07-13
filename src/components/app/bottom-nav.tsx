"use client";

import { motion } from "framer-motion";
import { Home, History, BarChart3, Settings, Utensils, Sparkles } from "lucide-react";
import { useT } from "@/hooks/use-t";

export type TabId = "home" | "history" | "food" | "insights" | "stats" | "profile";

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, onChange }: Props) {
  const { t } = useT();
  const items: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "home", label: t("tab_home"), icon: Home },
    { id: "history", label: t("tab_history"), icon: History },
    { id: "food", label: t("tab_food"), icon: Utensils },
    { id: "insights", label: t("tab_insights"), icon: Sparkles },
    { id: "stats", label: t("tab_stats"), icon: BarChart3 },
    { id: "profile", label: t("tab_profile"), icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-[480px] items-stretch border-t border-border bg-background/95 backdrop-blur-md safe-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative flex h-7 w-7 items-center justify-center">
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className={`text-[9px] font-medium leading-none ${isActive ? "font-semibold" : ""}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
