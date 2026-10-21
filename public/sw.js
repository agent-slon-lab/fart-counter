// Service Worker for Fart Counter PWA — OFFLINE-FIRST (v1.9.3).
//
// HARD RULES (see CHANGELOG [1.9.3]):
//   1. The app ALWAYS opens from cache instantly — network NEVER blocks startup,
//      even if the origin is down or blocked (SNI).
//   2. Updates are downloaded only in the background by the client-side source
//      chain (src/lib/update-chain.ts): probe Vercel (1s) -> probe GitHub Pages
//      (1s) -> stay local. This file is not involved in that decision.
//   3. NO redirects: this file never performs any page navigation (all
//      redirect APIs are banned here). The mirror is a reserve UPDATE
//      source only, never a redirect target.
//   4. localStorage is never touched here — user data is untouchable.
//
// Client <-> SW handshake protocol (quiet updates):
//   client -> SW: { type: "GET_VERSION" }   => SW -> client: { type: "VERSION", version }
//   client -> SW: "SKIP_WAITING"            => SW activates immediately.
// The client verifies the downloaded SW is genuinely NEWER before skipWaiting —
// this protects against mirror-sync lag and frozen local mirrors (no reload loops).
const VERSION = "1.9.3";
const CACHE = "fart-counter-v" + VERSION;

const PRECACHE = [
  "/",
  "/landing",
  "/privacy",
  "/manifest.json",
  "/version.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  // Precache app shell; allSettled so one failed resource (e.g. a missing
  // aux route on a mirror) doesn't break the whole install.
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  // No skipWaiting here — the client decides via SKIP_WAITING after it has
  // verified the new version. This prevents mid-session surprises.
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "GET_VERSION" && event.source) {
    event.source.postMessage({ type: "VERSION", version: VERSION });
  }
});

self.addEventListener("activate", (event) => {
  // Purge every cache from older versions.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  // Background: prefetch all build chunks so the app becomes fully
  // offline-capable right after the first successful load.
  event.waitUntil(prefetchBuildChunks());
  self.clients.claim();
});

/**
 * Prefetch all _next/static/* chunks discovered from the "/" HTML.
 * Runs in background after activation; failures are ignored.
 */
async function prefetchBuildChunks() {
  try {
    const cache = await caches.open(CACHE);
    const res = await fetch("/");
    if (!res.ok) return;
    const html = await res.text();
    const chunkUrls = new Set();
    const regex = /\/_next\/static\/[^"'\s<)]+/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      chunkUrls.add(match[0]);
    }
    const urls = Array.from(chunkUrls);
    await Promise.allSettled(urls.map((url) => cache.add(url)));
  } catch {
    // Prefetch failed — app still works online
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin probes bypass SW

  // Navigation: CACHE-FIRST — instant start, zero network wait.
  // ignoreSearch: PWA shortcut "/?action=fart" matches cached "/".
  // ignoreVary: Next.js responses may carry Vary headers (RSC etc.) that
  // would otherwise make plain navigations miss the precached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((cached) => {
        if (cached) {
          return cached; // INSTANT — served fully from the device
        }
        // First ever load or a route never cached: go to network, cache it.
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(async () => {
            // Network failed — fall back to the cached app shell.
            const shell = await caches.match("/", {
              ignoreSearch: true,
              ignoreVary: true,
            });
            if (shell) return shell;
            // Last resort: tiny offline stub (shell should always exist).
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Офлайн</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem"><h2>📴 Офлайн</h2><p>Приложение загружается. Проверьте соединение.</p><button onclick="location.reload()">🔄 Перезагрузить</button></body></html>',
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          });
      })
    );
    return;
  }

  // /version.json: NETWORK-FIRST (always fresh — the update chain reads it;
  // offline falls back to cache, then to an empty object).
  if (url.pathname === "/version.json") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((c) => c || new Response("{}", { status: 200 }))
        )
    );
    return;
  }

  // _next/static/* chunks: CACHE-FIRST (immutable, content-hashed).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached || new Response("", { status: 504 }));
      })
    );
    return;
  }

  // /locales/*.json: CACHE-FIRST with silent background revalidate.
  if (url.pathname.startsWith("/locales/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            })
            .catch(() => {});
          return cached;
        }
        return fetch(req)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(
            () =>
              cached ||
              new Response("{}", {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
          );
      })
    );
    return;
  }

  // Other static assets: CACHE-FIRST.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (!res || res.status !== 200 || res.type === "opaque") return res;
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
