/**
 * Auto-backup system — saves full app data to a JSON file.
 * File persists in Downloads folder, survives browser cache clear.
 */

import type { AppState } from "./store";
import { dateKey } from "./store";

const BACKUP_KEY = "fart-counter-last-backup";

/**
 * Check if it's time for a weekly backup (Sunday or 7+ days since last backup).
 */
export function shouldAutoBackup(): boolean {
  try {
    const lastBackup = localStorage.getItem(BACKUP_KEY);
    if (!lastBackup) return true; // Never backed up

    const lastDate = new Date(lastBackup);
    const now = new Date();
    const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    // Backup if 7+ days passed OR it's Sunday
    if (diffDays >= 7) return true;
    if (now.getDay() === 0 && dateKey(now) !== dateKey(lastDate)) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Trigger automatic backup — downloads JSON file silently.
 * Called on app open if shouldAutoBackup() returns true.
 */
export function autoBackup(state: AppState): void {
  try {
    const data = {
      state,
      version: 8,
      backedUpAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fart-counter-backup-${dateKey(new Date())}.json`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    // Mark backup done
    localStorage.setItem(BACKUP_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

/**
 * Manual backup — same as auto, but user-initiated.
 */
export function manualBackup(state: AppState): boolean {
  try {
    const data = {
      state,
      version: 8,
      backedUpAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fart-counter-backup-${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    localStorage.setItem(BACKUP_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore from a backup JSON file.
 * Returns the state object or null if invalid.
 */
export function parseBackup(json: string): { state: AppState; version: number } | null {
  try {
    const data = JSON.parse(json);
    if (!data.state || !data.state.farts) return null;
    return { state: data.state, version: data.version ?? 8 };
  } catch {
    return null;
  }
}
