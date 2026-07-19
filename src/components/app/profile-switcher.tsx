"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { useStore, type Profile } from "@/lib/store";
import { useT } from "@/hooks/use-t";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AVATAR_OPTIONS_ADULT = ["💨", "👨", "👩", "👦", "👧", "🧑", "👴", "👵", "🐕", "🦊", "🐸", "🦉"];
const AVATAR_OPTIONS_BABY = ["👶", "🍼", "🧸", "🐥", "🐰", "🐝", "🦁", "🐼", "🦄", "⭐", "🌙", "🌈"];

function getProfileDescription(name: string, type: "adult" | "baby", t: (k: string) => string): string {
  const lower = name.toLowerCase();
  if (type === "baby") return t("profile_desc_baby");
  // Funny descriptions based on name
  if (lower.includes("муж") || lower.includes("husband") || lower.includes("мужа")) return t("profile_desc_husband");
  if (lower.includes("жен") || lower.includes("wife") || lower.includes("жена")) return t("profile_desc_wife");
  if (lower.includes("сын") || lower.includes("kid") || lower.includes("kid") || lower.includes("ребен")) return t("profile_desc_kid");
  if (lower.includes("me") || lower.includes("я") || lower === "me") return t("profile_desc_me");
  return t("profile_desc_other");
}

export function ProfileSwitcher() {
  const { t } = useT();
  const profiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.settings.activeProfileId);
  const setActiveProfile = useStore((s) => s.setActiveProfile);
  const addProfile = useStore((s) => s.addProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);

  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"adult" | "baby">("adult");
  const [newAvatar, setNewAvatar] = useState("👨");

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  function handleAdd() {
    if (!newName.trim()) return;
    addProfile({ name: newName.trim(), type: newType, avatar: newAvatar });
    setNewName("");
    setNewType("adult");
    setNewAvatar("👨");
    setAddOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      deleteProfile(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <>
      {/* Switcher button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors"
      >
        <span className="text-base">{activeProfile?.avatar ?? "💨"}</span>
        <span className="max-w-[60px] truncate">{activeProfile?.name ?? "Me"}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Profile selection dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-center">{t("profile_switch")}</DialogTitle>
          </DialogHeader>

          {/* Profile list */}
          <div className="space-y-1.5">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                  p.id === activeProfileId ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <button
                  onClick={() => {
                    setActiveProfile(p.id);
                    setOpen(false);
                  }}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getProfileDescription(p.name, p.type, t)}
                    </p>
                  </div>
                </button>
                {p.id === activeProfileId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                {p.id !== "me" && (
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    aria-label={t("profile_delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add button */}
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("profile_add")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add profile dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle>{t("profile_add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="profile-name">{t("profile_name")}</Label>
              <Input
                id="profile-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("profile_default_name")}
                className="mt-1.5"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div>
              <Label>{t("profile_type")}</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setNewType("adult");
                    setNewAvatar("💨");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                    newType === "adult" ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  💨 {t("profile_type_adult")}
                </button>
                <button
                  onClick={() => {
                    setNewType("baby");
                    setNewAvatar("👶");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                    newType === "baby" ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  👶 {t("profile_type_baby")}
                </button>
              </div>
            </div>
            <div>
              <Label>{t("profile_avatar")}</Label>
              <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                {(newType === "baby" ? AVATAR_OPTIONS_BABY : AVATAR_OPTIONS_ADULT).map((a) => (
                  <button
                    key={a}
                    onClick={() => setNewAvatar(a)}
                    className={`flex h-10 items-center justify-center rounded-xl border-2 text-xl transition-all ${
                      newAvatar === a ? "border-primary bg-primary/10 scale-110" : "border-border"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {newType === "baby" && (
                <p className="mt-2 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] text-blue-600 dark:text-blue-400">
                  {t("profile_baby_hint")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={!newName.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile_delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("profile_confirm_delete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
