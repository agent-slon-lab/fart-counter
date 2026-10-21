// Quiet update chain for Fart Counter PWA (v1.9.3).
//
// The app is offline-first: it ALWAYS opens from cache instantly. Updates are
// discovered and downloaded ONLY in the background, by probing a chain of
// sources — the primary deployment and the GitHub Pages mirror:
//
//     probe Vercel (timeout 1s) -> probe GitHub Pages (timeout 1s) -> stay local
//
// HARD RULES:
//   - The mirror is a reserve DOWNLOAD source only. NEVER a redirect.
//     This module never performs any page navigation (all redirect APIs on
//     the location object are banned); the only navigation is
//     window.location.reload() ONCE
//     (guarded by a sessionStorage flag against reload loops).
//   - localStorage (user data) is never touched.
//   - Probes fail silently within 1 second; the user never waits or notices.
//   - A discovered update is applied only after the freshly downloaded
//     service worker CONFIRMS (GET_VERSION protocol) that it is genuinely
//     newer than the current one. If the same-origin SW is stale (mirror
//     sync lag or a frozen local mirror) we do nothing at all — no loops.
//
// NOTE ON CROSS-ORIGIN REGISTRATION: browsers only allow same-origin SW
// scripts, so the update is always fetched from the CURRENT origin
// (registration.update()). The chain tells us THAT a newer version exists;
// delivery comes from the origin that actually has it — for RU users that
// is the same-origin mirror, for everyone else the primary deployment.
// Both origins serve identical bytes (auto-synced by GitHub Actions).

import { APP_VERSION, compareVersions, type VersionInfo } from "@/lib/version";

/** Update sources in probe order: primary first, mirror as fallback. */
export const UPDATE_SOURCES = [
  "https://fart-counter-lake.vercel.app", // primary (may be SNI-blocked in RU)
  "https://agent-slon-lab.github.io", // mirror (reachable from RU)
] as const;

const PROBE_TIMEOUT_MS = 1000;
const VERSION_ANSWER_TIMEOUT_MS = 2500;
/** sessionStorage flag: at most ONE auto-reload per browser session. */
const RELOAD_FLAG = "fc-sw-update-reloaded";

export interface FoundUpdate {
  version: string;
  source: string;
  info: VersionInfo;
}

/** Fetch with a hard timeout; resolves null on any failure. Silent. */
async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { cache: "no-store", signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Probe one origin's /version.json. Fails silently within PROBE_TIMEOUT_MS. */
async function probeVersion(origin: string): Promise<VersionInfo | null> {
  const res = await fetchWithTimeout(
    `${origin}/version.json?t=${Date.now()}`,
    PROBE_TIMEOUT_MS
  );
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    if (!data || !data.version) return null;
    return {
      version: String(data.version),
      updatedAt: data.updatedAt,
      changelogUrl: data.changelogUrl,
    };
  } catch {
    return null;
  }
}

export interface ChainResult {
  /** A NEWER version found somewhere in the chain (or null). */
  found: FoundUpdate | null;
  /** True if at least one source answered (for manual check UX). */
  reached: boolean;
}

/**
 * Probe the source chain: Vercel (1s) -> GitHub Pages (1s).
 * Stops at the first source that actually has a NEWER version.
 * Both origins already serve `Access-Control-Allow-Origin: *`,
 * so cross-origin probes work in both directions.
 */
export async function checkForUpdates(): Promise<ChainResult> {
  let reached = false;
  for (const source of UPDATE_SOURCES) {
    const info = await probeVersion(source);
    if (!info) continue;
    reached = true;
    if (compareVersions(info.version, APP_VERSION) > 0) {
      return { found: { version: info.version, source, info }, reached };
    }
  }
  return { found: null, reached };
}

/**
 * Ask a service worker its VERSION via the GET_VERSION protocol.
 * Resolves null if the worker doesn't answer in time (e.g. an old SW
* without the protocol — treated as "unknown", never as "newer").
 */
function askWorkerVersion(worker: ServiceWorker | null): Promise<string | null> {
  return new Promise((resolve) => {
    if (!worker) {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (v: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("message", onMsg);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), VERSION_ANSWER_TIMEOUT_MS);
    const onMsg = (e: MessageEvent) => {
      const src = e.source as ServiceWorker | null;
      if (src === worker && e.data && e.data.type === "VERSION") {
        finish(String(e.data.version));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    try {
      worker.postMessage({ type: "GET_VERSION" });
    } catch {
      finish(null);
    }
  });
}

/** Reload ONCE per browser session (sessionStorage guard = loop protection). */
export function guardedReload(): void {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // sessionStorage unavailable (private mode edge) — still reload
  }
  window.location.reload();
}

/** Clear the reload guard once we are confirmed up to date. */
export function clearReloadGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // ignore
  }
}

/** Wire the one guarded reload to the controllerchange event. */
function reloadOnControllerChange(): void {
  if (!("serviceWorker" in navigator)) {
    setTimeout(guardedReload, 500);
    return;
  }
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => guardedReload(),
    { once: true }
  );
}

/**
 * Quietly apply an available update:
 *  1. registration.update() — re-fetch the SAME-ORIGIN sw.js (browsers
 *     forbid cross-origin SW scripts).
 *  2. Verify the installing/waiting worker really carries a NEWER version
 *     (GET_VERSION). If not — mirror lag or a frozen mirror — do NOTHING
 *     (silent, no reload, no loop).
 *  3. SKIP_WAITING -> controllerchange -> ONE guarded reload.
 * Returns true if an update is being applied (caller may show the banner).
 */
export async function applyUpdate(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;

    // Pull the freshest same-origin sw.js.
    try {
      await reg.update();
    } catch {
      // update() may throw offline — the waiting worker below still applies
    }

    // A brand-new worker lands in `installing`; one left over from a
    // previous session sits in `waiting`. Both are valid candidates.
    const worker = reg.installing || reg.waiting;
    if (!worker) return false;

    const workerVersion = await askWorkerVersion(worker);
    if (!workerVersion) return false; // unknown => never assume newer
    if (compareVersions(workerVersion, APP_VERSION) <= 0) return false;

    // Genuinely newer — activate quietly, reload exactly once.
    worker.postMessage("SKIP_WAITING");
    reloadOnControllerChange();
    // Fallback window: if controllerchange never fires (edge), reload
    // after 20 s anyway — still guarded, so at most one reload happens.
    setTimeout(() => guardedReload(), 20000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Align the controlling SW with the running bundle: if a NEWER worker is
 * already waiting (e.g. installed by a previous session but never activated),
 * activate it quietly with the same one-reload guarantee.
 */
async function syncWaitingWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const waiting = reg?.waiting || null;
    const controller = navigator.serviceWorker.controller;
    if (!reg || !waiting || !controller) return;
    const [waitingVersion, controllerVersion] = await Promise.all([
      askWorkerVersion(waiting),
      askWorkerVersion(controller),
    ]);
    if (!waitingVersion || !controllerVersion) return;
    if (compareVersions(waitingVersion, controllerVersion) > 0) {
      waiting.postMessage("SKIP_WAITING");
      reloadOnControllerChange();
      setTimeout(() => guardedReload(), 20000);
    }
  } catch {
    // silent
  }
}

/**
 * Full background flow (runs a few seconds after startup):
 * probe the chain -> if a newer version exists anywhere, apply it quietly.
 * Returns the found update when it is being applied (for the banner),
 * or null when we are up to date / offline / nothing applicable.
 */
export async function backgroundUpdateFlow(): Promise<FoundUpdate | null> {
  const { found } = await checkForUpdates();
  if (!found) {
    clearReloadGuard(); // confirmed up to date — re-arm the reload guard
    syncWaitingWorker(); // bring a stale controller up to the running bundle
    return null;
  }
  const applying = await applyUpdate();
  return applying ? found : null; // not applying => stay silent on current
}

/**
 * Manual "apply update now" (Profile -> Update button): if an update is
 * already in flight, the guarded reload lands it immediately; otherwise
 * run the full chain first. Never blocks, never loops (guard inside).
 */
export async function forceUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    guardedReload();
    return;
  }
  const applied = await applyUpdate();
  if (!applied) guardedReload(); // nothing to apply — plain guarded refresh
}
