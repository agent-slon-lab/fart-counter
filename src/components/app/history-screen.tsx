"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash2, Plus, Pencil, Clock, Download, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useStore, dateKey, getFartsForDate, getCountForDate, useProfileFarts, type FartRecord } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";
import { dateKey as dk } from "@/lib/store";
import { buildExportPayload, downloadText, readFileAsText } from "@/lib/export";

export function HistoryScreen() {
  const { t, lang } = useT();
  const farts = useProfileFarts();
  const deleteFart = useStore((s) => s.deleteFart);
  const setFartCountForDay = useStore((s) => s.setFartCountForDay);
  const addManualFart = useStore((s) => s.addManualFart);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [manualValue, setManualValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import/Export handlers
  const allFarts = useStore((s) => s.farts);
  const allWater = useStore((s) => s.water);
  const allFood = useStore((s) => s.food);
  const allMoods = useStore((s) => s.moods);
  const allSettings = useStore((s) => s.settings);
  const allUnlocked = useStore((s) => s.unlockedAchievements);
  const importData = useStore((s) => s.importData);

  function handleExportAll() {
    const payload = buildExportPayload(allFarts, allWater, allSettings, allUnlocked);
    (payload as any).food = allFood;
    (payload as any).moods = allMoods;
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

  // Days with records (for calendar highlighting)
  const daysWithRecords = useMemo(() => {
    const set = new Set<string>();
    for (const f of farts) set.add(dateKey(new Date(f.ts)));
    return set;
  }, [farts]);

  // Build per-day totals for the current viewMonth
  const monthDays = useMemo(() => {
    const map = new Map<string, number>();
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    for (const f of farts) {
      const d = new Date(f.ts);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const k = dateKey(d);
        map.set(k, (map.get(k) ?? 0) + 1);
      }
    }
    return map;
  }, [farts, viewMonth]);

  const selectedFarts = useMemo(
    () =>
      getFartsForDate(farts, selectedDate).sort(
        (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
      ),
    [farts, selectedDate]
  );
  const selectedCount = selectedFarts.length;

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  function changeMonth(delta: number) {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + delta);
    setViewMonth(d);
  }

  function openEdit() {
    setEditValue(String(selectedCount));
    setEditOpen(true);
  }

  function saveEdit() {
    const n = parseInt(editValue, 10);
    if (isNaN(n) || n < 0) {
      toast(t("toast_import_failed"), { icon: "⚠️" });
      return;
    }
    setFartCountForDay(dateKey(selectedDate), n);
    setEditOpen(false);
    toast(t("save"), { icon: "✅" });
  }

  function openManual() {
    setManualValue("1");
    setManualOpen(true);
  }

  function saveManual() {
    const n = parseInt(manualValue, 10);
    if (isNaN(n) || n < 1) {
      toast(t("toast_import_failed"), { icon: "⚠️" });
      return;
    }
    addManualFart(dateKey(selectedDate), n, []);
    setManualOpen(false);
    toast(`+${n} 💨`, { icon: "✅" });
  }

  function confirmDelete() {
    if (deleteId) {
      deleteFart(deleteId);
      setDeleteId(null);
      toast(t("delete_record"), { icon: "🗑️" });
    }
  }

  // List of days in current month that have records (sorted desc)
  const monthDayList = useMemo(() => {
    return Array.from(monthDays.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, count]) => ({ date: k, count }));
  }, [monthDays]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h1 className="pt-1 text-center text-lg font-bold">{t("history_title")}</h1>

      {/* Calendar */}
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold capitalize">
            {viewMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          month={viewMonth}
          onMonthChange={setViewMonth}
          className="mx-auto p-0"
          classNames={{
            day_selected: "bg-primary text-primary-foreground",
            day_today: "ring-1 ring-primary",
          }}
          modifiers={{
            hasRecord: (date) => daysWithRecords.has(dateKey(date)),
          }}
          modifiersClassNames={{
            hasRecord: "font-bold after:content-['•'] after:absolute after:bottom-0.5 after:text-primary",
          }}
          formatters={{
            formatWeekdayName: (date) =>
              date.toLocaleDateString(locale, { weekday: "short" }),
          }}
        />
      </Card>

      {/* Selected day summary */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("total_for_day")}
            </p>
            <p className="text-2xl font-black tabular-nums">{selectedCount}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedDate.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t("edit_record")}
            </Button>
            <Button size="sm" variant="ghost" onClick={openManual}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("add_manual")}
            </Button>
          </div>
        </div>

        {/* Records list */}
        {selectedFarts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>{t("no_records")}</p>
            <p className="text-xs">{t("no_records_hint")}</p>
          </div>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto thin-scroll pr-1">
            <AnimatePresence initial={false}>
              {selectedFarts.map((rec) => (
                <RecordRow
                  key={rec.id}
                  rec={rec}
                  lang={lang}
                  onDelete={() => setDeleteId(rec.id)}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* Month overview */}
      <Card className="p-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          {viewMonth.toLocaleDateString(locale, { month: "long" })}
        </p>
        {monthDayList.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            {t("no_records")}
          </p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto thin-scroll pr-1">
            {monthDayList.map(({ date, count }) => {
              const d = new Date(date + "T00:00:00");
              const isSelected = date === dateKey(selectedDate);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(d)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/15 text-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="capitalize">
                    {d.toLocaleDateString(locale, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <Badge
                    variant={count >= 10 && count <= 20 ? "default" : "secondary"}
                    className="tabular-nums"
                  >
                    {count} 💨
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit_count")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="edit-count">{t("manual_count_label")}</Label>
            <Input
              id="edit-count"
              type="number"
              min={0}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedDate.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual add dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add_manual")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="manual-count">{t("manual_count_label")}</Label>
            <Input
              id="manual-count"
              type="number"
              min={1}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedDate.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setManualOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveManual}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_record")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import / Export — moved from Profile */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Download className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">{t("data_section")}</span>
        </div>
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
      </Card>
    </div>
  );
}

function RecordRow({
  rec,
  lang,
  onDelete,
  t,
}: {
  rec: FartRecord;
  lang: "ru" | "en" | "es" | "pt" | "de" | "fr" | "hi";
  onDelete: () => void;
  t: (k: never) => string;
}) {
  const d = new Date(rec.ts);
  const time = d.toLocaleTimeString(lang === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hasSilent = rec.tags.includes("silent");
  const hasSmelly = rec.tags.includes("smelly");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium tabular-nums">{time}</span>
        <div className="flex gap-1">
          {hasSilent && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              🤫 {t("silent" as never)}
            </Badge>
          )}
          {hasSmelly && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              💀 {t("smelly" as never)}
            </Badge>
          )}
          {!hasSilent && !hasSmelly && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 opacity-60">
              {t("regular" as never)}
            </Badge>
          )}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

// helper exported for clarity (unused import avoidance)
export { dk };
