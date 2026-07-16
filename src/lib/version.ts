// Version checking logic for Fart Counter PWA

export const APP_VERSION = "1.1.0";

export interface VersionInfo {
  version: string;
  updatedAt?: string;
  changelogUrl?: string;
}

/**
 * Compare two SemVer versions.
 * Returns: 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Fetch the latest version info from /version.json.
 * Uses cache-busting to always get fresh data.
 */
export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      version: String(data.version || ""),
      updatedAt: data.updatedAt,
      changelogUrl: data.changelogUrl,
    };
  } catch {
    return null;
  }
}

const LAST_CHECK_KEY = "fart-counter-last-update-check";

/**
 * Check if 24 hours have passed since last check.
 */
export function shouldCheckInBackground(): boolean {
  try {
    const last = localStorage.getItem(LAST_CHECK_KEY);
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    if (isNaN(lastTime)) return true;
    const dayMs = 24 * 60 * 60 * 1000;
    return Date.now() - lastTime >= dayMs;
  } catch {
    return true;
  }
}

/**
 * Remember that we just checked for updates.
 */
export function markCheckedNow(): void {
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

/**
 * Force-reload the app, clearing all caches.
 * 1. Unregister all service workers
 * 2. Clear all caches
 * 3. Reload the page
 */
export async function forceUpdate(): Promise<void> {
  try {
    // Clear caches
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore
  }
  // Hard reload with cache-bust
  window.location.reload();
}
