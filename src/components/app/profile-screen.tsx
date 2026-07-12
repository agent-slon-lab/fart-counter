"use client";

import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Palette,
  Volume2,
  Vibrate,
  Bell,
  Database,
  Info,
  Trophy,
  Share2,
  Sun,
  Moon,
  Monitor,
  Upload,
  Download,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { useStore, type AccentColor, type ThemeMode } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { translations } from "@/lib/i18n";
import { toast } from "sonner";
import {
  installNotifications,
  requestNotificationPermission,
  notificationPermission,
} from "@/lib/notifications";
import { buildExportPayload, downloadText, readFileAsText } from "@/lib/export";
import { dateKey } from "@/lib/store";
import { AchievementsList } from "./achievements-list";
import { ShareCardDialog } from "./share-card-dialog";

const ACCENTS: { id: AccentColor; color: string; key: "accent_green" | "accent_pink" | "accent_blue" | "accent_gold" }[] = [
  { id: "green", color: "#84cc16", key: "accent_green" },
  { id: "pink", color: "#ec4899", key: "accent_pink" },
  { id: "blue", color: "#3b82f6", key: "accent_blue" },
  { id: "gold", color: "#f59e0b", key: "accent_gold" },
];

export function ProfileScreen() {
  const { t, lang } = useT();
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const setLanguage = useStore((s) => s.setLanguage);
  const setTheme = useStore((s) => s.setTheme);
  const setAccent = useStore((s) => s.setAccent);
  const importData = useStore((s) => s.importData);
  const resetAllData = useStore((s) => s.resetAllData);
  const farts = useStore((s) => s.farts);
  const water = useStore((s) => s.water);
  const unlocked = useStore((s) => s.unlockedAchievements);

  const [achOpen, setAchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // (Re)install notification scheduler whenever settings change
  useEffect(() => {
    installNotifications({
      enabled: settings.notificationsEnabled,
      evening: settings.eveningReminder,
      water: settings.waterReminder,
      lang: settings.language,
    });
  }, [
    settings.notificationsEnabled,
    settings.eveningReminder,
    settings.waterReminder,
    settings.language,
  ]);

  async function handleNotificationsToggle(checked: boolean) {
    if (checked) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast(t("notif_permission_denied"), { icon: "⚠️" });
        return;
      }
      toast(t("notif_enabled"), { icon: "🔔" });
      setSetting("notificationsEnabled", true);
      setSetting("eveningReminder", true);
    } else {
      setSetting("notificationsEnabled", false);
    }
  }

  function handleExportAll() {
    const payload = buildExportPayload(farts, water, settings, unlocked);
    const json = JSON.stringify(payload, null, 2);
    const filename = `fart-counter-backup-${dateKey(new Date())}.json`;
    const ok = downloadText(filename, json, "application/json");
    toast(ok ? t("toast_data_exported") : t("export_failed"), {
      icon: ok ? "✅" : "⚠️",
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const ok = importData(text);
      if (ok) {
        toast(t("toast_data_imported"), { icon: "✅" });
      } else {
        toast(t("toast_import_failed"), { icon: "⚠️" });
      }
    } catch {
      toast(t("toast_import_failed"), { icon: "⚠️" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleReset() {
    resetAllData();
    setResetOpen(false);
    toast(t("toast_data_reset"), { icon: "🗑️" });
  }

  const perm = notificationPermission();

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("settings_title")}</h1>

      {/* Achievements shortcut */}
      <Card
        className="cursor-pointer p-4 transition-colors hover:bg-muted/40"
        onClick={() => setAchOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xl">
            🏆
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("achievements_title")}</p>
            <p className="text-xs text-muted-foreground">
              {unlocked.length} / 7 {t("achievements_unlocked").toLowerCase()}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Share card shortcut */}
      <Card
        className="cursor-pointer p-4 transition-colors hover:bg-muted/40"
        onClick={() => setShareOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xl">
            📤
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("share_card_section")}</p>
            <p className="text-xs text-muted-foreground">
              {t("generate_share_card")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Language */}
      <SectionCard icon={<Globe className="h-4 w-4" />} title={t("language_section")}>
        <div className="grid grid-cols-2 gap-2">
          {(["ru", "en"] as const).map((l) => (
            <Button
              key={l}
              variant={lang === l ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(l)}
              className="font-semibold"
            >
              {l === "ru" ? "🇷🇺 Русский" : "🇬🇧 English"}
            </Button>
          ))}
        </div>
      </SectionCard>

      {/* Theme */}
      <SectionCard icon={<Palette className="h-4 w-4" />} title={t("theme_section")}>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "light" as const, icon: Sun, label: t("theme_light") },
            { id: "dark" as const, icon: Moon, label: t("theme_dark") },
            { id: "system" as const, icon: Monitor, label: t("theme_system") },
          ]).map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant={settings.theme === id ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(id as ThemeMode)}
              className="flex flex-col items-center gap-1 py-3"
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-semibold">{label}</span>
            </Button>
          ))}
        </div>
      </SectionCard>

      {/* Accent color */}
      <SectionCard icon={<Palette className="h-4 w-4" />} title={t("accent_section")}>
        <div className="grid grid-cols-4 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              aria-label={translations[lang][a.key]}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all ${
                settings.accent === a.id
                  ? "border-foreground scale-105"
                  : "border-transparent hover:border-border"
              }`}
            >
              <span
                className="h-8 w-8 rounded-full shadow-md"
                style={{ backgroundColor: a.color }}
              />
              <span className="text-[9px] font-medium leading-tight text-center text-muted-foreground">
                {translations[lang][a.key]}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Sound & Vibration */}
      <SectionCard icon={<Volume2 className="h-4 w-4" />} title={t("sound_section")}>
        <ToggleRow
          icon={<Volume2 className="h-4 w-4" />}
          label={t("sound_enabled")}
          checked={settings.soundEnabled}
          onChange={(v) => setSetting("soundEnabled", v)}
        />
        <ToggleRow
          icon={<Vibrate className="h-4 w-4" />}
          label={t("vibration_enabled")}
          checked={settings.vibrationEnabled}
          onChange={(v) => setSetting("vibrationEnabled", v)}
        />
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={<Bell className="h-4 w-4" />} title={t("notifications_section")}>
        {perm === "denied" && (
          <p className="mb-2 rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
            {t("notif_permission_denied")}
          </p>
        )}
        <ToggleRow
          icon={<Bell className="h-4 w-4" />}
          label={t("notifications_enabled")}
          checked={settings.notificationsEnabled}
          onChange={handleNotificationsToggle}
        />
        {settings.notificationsEnabled && (
          <>
            <ToggleRow
              icon={<span className="text-sm">🌙</span>}
              label={t("reminder_evening")}
              checked={settings.eveningReminder}
              onChange={(v) => setSetting("eveningReminder", v)}
            />
            <ToggleRow
              icon={<span className="text-sm">💧</span>}
              label={t("reminder_water")}
              checked={settings.waterReminder}
              onChange={(v) => setSetting("waterReminder", v)}
            />
          </>
        )}
      </SectionCard>

      {/* Data */}
      <SectionCard icon={<Database className="h-4 w-4" />} title={t("data_section")}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="mr-1.5 h-4 w-4" />
            {t("export_data")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="mr-1.5 h-4 w-4" />
            {t("import_data")}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetOpen(true)}
          className="mt-2 w-full text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t("reset_data")}
        </Button>
      </SectionCard>

      {/* About */}
      <SectionCard icon={<Info className="h-4 w-4" />} title={t("about_section")}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("about_text")}
        </p>
        <p className="mt-2 rounded-md bg-primary/10 px-2 py-1.5 text-[11px] text-primary/90">
          {t("medical_disclaimer")}
        </p>
      </SectionCard>

      <AchievementsList open={achOpen} onOpenChange={setAchOpen} />
      <ShareCardDialog open={shareOpen} onOpenChange={setShareOpen} />

      {/* Reset confirm */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reset_data")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_reset")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest">
          {title}
        </span>
      </div>
      {children}
    </Card>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
