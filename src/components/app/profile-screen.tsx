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
  QrCode,
  MapPin,
  CloudSun,
  RefreshCw,
  Github,
  Shield,
} from "lucide-react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore, type AccentColor, type ThemeMode } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { LANGUAGES, translations } from "@/lib/i18n";
import { toast } from "sonner";
import {
  installNotifications,
  requestNotificationPermission,
  notificationPermission,
} from "@/lib/notifications";
import { buildExportPayload, downloadText, readFileAsText } from "@/lib/export";
import { dateKey } from "@/lib/store";
import { qrToDataURL } from "@/lib/qr";
import { APP_VERSION, forceUpdate } from "@/lib/version";
import { useManualUpdateCheck } from "@/components/pwa/update-banner";
import { InstallButton } from "@/components/pwa/install-button";
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
  const food = useStore((s) => s.food);
  const moods = useStore((s) => s.moods);
  const unlocked = useStore((s) => s.unlockedAchievements);

  const [achOpen, setAchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateCheck = useManualUpdateCheck();
  const handleCheckUpdates = updateCheck.check;

  // Generate QR code asynchronously when dialog opens
  useEffect(() => {
    if (!qrOpen) return;
    let cancelled = false;
    const url = typeof window !== "undefined" ? window.location.href : "";
    qrToDataURL(url, 8).then((data) => {
      if (!cancelled) setQrData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [qrOpen]);

  // Install notifications when settings change
  useEffect(() => {
    installNotifications({
      enabled: settings.notificationsEnabled,
      evening: settings.eveningReminder,
      water: settings.waterReminder,
      morning: settings.morningReminder,
      gentle: settings.gentleReminder,
      lang: settings.language,
    });
  }, [
    settings.notificationsEnabled,
    settings.eveningReminder,
    settings.waterReminder,
    settings.morningReminder,
    settings.gentleReminder,
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
    (payload as any).food = food;
    (payload as any).moods = moods;
    const json = JSON.stringify(payload, null, 2);
    const filename = `fart-counter-backup-${dateKey(new Date())}.json`;
    const ok = downloadText(filename, json, "application/json");
    toast(ok ? t("toast_data_exported") : t("export_failed"), { icon: ok ? "✅" : "⚠️" });
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
      toast(ok ? t("toast_data_imported") : t("toast_import_failed"), { icon: ok ? "✅" : "⚠️" });
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

  async function handleCopyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers without clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast(t("share_app_link_copied"), { icon: "📋" });
    } catch {
      toast(t("export_failed"), { icon: "⚠️" });
    }
  }

  const perm = notificationPermission();

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("settings_title")}</h1>

      {/* Achievements shortcut */}
      <Card className="cursor-pointer p-4 transition-colors hover:bg-muted/40" onClick={() => setAchOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xl">🏆</div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("achievements_title")}</p>
            <p className="text-xs text-muted-foreground">
              {unlocked.length} / 18 {t("achievements_unlocked").toLowerCase()}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Share card */}
      <Card className="cursor-pointer p-4 transition-colors hover:bg-muted/40" onClick={() => setShareOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xl">📤</div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("share_card_section")}</p>
            <p className="text-xs text-muted-foreground">{t("generate_share_card")}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* QR code */}
      <Card className="cursor-pointer p-4 transition-colors hover:bg-muted/40" onClick={() => setQrOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xl">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("share_app_qr")}</p>
            <p className="text-xs text-muted-foreground">{t("share_app_link")}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Language */}
      <SectionCard icon={<Globe className="h-4 w-4" />} title={t("language_section")}>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <Button
              key={l.id}
              variant={lang === l.id ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(l.id)}
              className="font-semibold"
            >
              {l.flag} {l.label}
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

      {/* Accent */}
      <SectionCard icon={<Palette className="h-4 w-4" />} title={t("accent_section")}>
        <div className="grid grid-cols-4 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              aria-label={translations[lang][a.key] ?? translations.en[a.key]}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all ${
                settings.accent === a.id ? "border-foreground scale-105" : "border-transparent hover:border-border"
              }`}
            >
              <span className="h-8 w-8 rounded-full shadow-md" style={{ backgroundColor: a.color }} />
              <span className="text-[9px] font-medium leading-tight text-center text-muted-foreground">
                {translations[lang][a.key] ?? translations.en[a.key]}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Sound & Vibration */}
      <SectionCard icon={<Volume2 className="h-4 w-4" />} title={t("sound_settings_section")}>
        <ToggleRow icon={<Volume2 className="h-4 w-4" />} label={t("sound_enabled")} checked={settings.soundEnabled} onChange={(v) => setSetting("soundEnabled", v)} />
        <ToggleRow icon={<Vibrate className="h-4 w-4" />} label={t("vibration_enabled")} checked={settings.vibrationEnabled} onChange={(v) => setSetting("vibrationEnabled", v)} />
        <ToggleRow icon={<MapPin className="h-4 w-4" />} label={t("map_enable")} checked={settings.geoEnabled} onChange={(v) => setSetting("geoEnabled", v)} />
        <ToggleRow icon={<CloudSun className="h-4 w-4" />} label={t("weather_enable")} checked={settings.weatherEnabled} onChange={(v) => setSetting("weatherEnabled", v)} />
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={<Bell className="h-4 w-4" />} title={t("notifications_section")}>
        {perm === "denied" && (
          <p className="mb-2 rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">{t("notif_permission_denied")}</p>
        )}
        <ToggleRow icon={<Bell className="h-4 w-4" />} label={t("notifications_enabled")} checked={settings.notificationsEnabled} onChange={handleNotificationsToggle} />
        {settings.notificationsEnabled && (
          <>
            <ToggleRow icon={<span className="text-sm">🌙</span>} label={t("reminder_evening")} checked={settings.eveningReminder} onChange={(v) => setSetting("eveningReminder", v)} />
            <ToggleRow icon={<span className="text-sm">💧</span>} label={t("reminder_water")} checked={settings.waterReminder} onChange={(v) => setSetting("waterReminder", v)} />
            <ToggleRow icon={<span className="text-sm">☀️</span>} label={t("reminder_morning")} checked={settings.morningReminder} onChange={(v) => setSetting("morningReminder", v)} />
            <ToggleRow icon={<span className="text-sm">🤔</span>} label={t("notif_gentle_reminder_title")} checked={settings.gentleReminder} onChange={(v) => setSetting("gentleReminder", v)} />
          </>
        )}
        {/* Honest limitation note */}
        <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
          {t("notif_limitation_note")}
        </p>
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
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
        <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)} className="mt-2 w-full text-destructive hover:text-destructive">
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t("reset_data")}
        </Button>
      </SectionCard>

      {/* About */}
      <SectionCard icon={<Info className="h-4 w-4" />} title={t("about_section")}>
        {/* Version info */}
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("app_version")}</p>
            <p className="text-lg font-black tabular-nums">v{APP_VERSION}</p>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={handleCheckUpdates} disabled={updateCheck.state === "checking"}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${updateCheck.state === "checking" ? "animate-spin" : ""}`} />
            {t("check_updates")}
          </Button>
        </div>
        {/* Update status */}
        {updateCheck.state === "available" && updateCheck.newVersion && (
          <div className="mb-2 rounded-lg border-2 border-primary/40 bg-primary/10 px-3 py-2">
            <p className="text-xs font-bold text-primary">{t("update_available")}</p>
            <p className="text-[11px] text-muted-foreground">
              v{APP_VERSION} → v{updateCheck.newVersion}
            </p>
            <Button size="sm" className="mt-2 h-7 w-full" onClick={() => forceUpdate()}>
              <RefreshCw className="mr-1 h-3 w-3" />
              {t("update_now")}
            </Button>
          </div>
        )}
        {updateCheck.state === "latest" && (
          <p className="mb-2 rounded-md bg-green-500/10 px-2 py-1.5 text-[11px] text-green-600 dark:text-green-400">
            ✓ {t("update_current")}
          </p>
        )}
        {updateCheck.state === "error" && (
          <p className="mb-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
            ⚠ {t("weather_error")}
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">{t("about_text")}</p>
        <p className="mt-2 rounded-md bg-primary/10 px-2 py-1.5 text-[11px] text-primary/90">{t("medical_disclaimer")}</p>

        {/* Install App button */}
        <InstallButton />

        {/* GitHub link */}
        <a
          href="https://github.com/agent-slon-lab/fart-counter"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
        >
          <Github className="h-3.5 w-3.5" />
          {t("app_source_code")} →
        </a>
        {/* Privacy Policy link */}
        <Link
          href="/privacy"
          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          {t("app_privacy")} →
        </Link>
      </SectionCard>

      <AchievementsList open={achOpen} onOpenChange={setAchOpen} />
      <ShareCardDialog open={shareOpen} onOpenChange={setShareOpen} />

      {/* QR dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-center">{t("share_app_qr")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-md">
              {qrData ? (
                <img src={qrData} alt="QR" className="h-64 w-64" />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">{t("landing_qr_title")}</p>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full">
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {t("share_app_link")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset confirm */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reset_data")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_reset")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </Card>
  );
}

function ToggleRow({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
