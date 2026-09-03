// Version checking logic for Fart Counter PWA

export const APP_VERSION = "1.7.8";

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
 * Smooth update flow — no data loss:
 * 1. Send SKIP_WAITING to the waiting service worker
 * 2. Listen for controllerchange (fires when new SW takes over)
 * 3. Reload page — new SW serves fresh HTML + correct chunks
 * 4. Zustand persist writes synchronously, so all data is safe
 *
 * Fallback: if no SW or no waiting worker, just reload.
 */
export async function forceUpdate(): Promise<void> {
  // Check if Service Worker is available
  if (!("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration();

    if (reg && reg.waiting) {
      // New SW is waiting — tell it to skip waiting
      reg.waiting.postMessage("SKIP_WAITING");

      // Listen for controller change (new SW takes over)
      // Then reload once — data is safe in localStorage (Zustand writes sync)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      }, { once: true });

      // Safety timeout: if controllerchange doesn't fire in 5s, reload anyway
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else {
      // No waiting SW — just reload (fresh HTML from network)
      window.location.reload();
    }
  } catch {
    // Fallback: clear caches + unregister + reload (old behavior)
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {}
    window.location.reload();
  }
}
