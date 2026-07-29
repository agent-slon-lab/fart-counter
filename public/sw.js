// Service Worker for Fart Counter PWA — CACHE-FIRST for instant load + FULL OFFLINE.
// Version bumped on each release to invalidate old caches.
const CACHE = "fart-counter-v1.6.9";
const PRECACHE = [
  "/",
  "/manifest.json",
  "/version.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  // Use allSettled so one failed resource doesn't break the whole install
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  // After activation, prefetch all JS/CSS chunks in background for FULL OFFLINE
  event.waitUntil(prefetchBuildChunks());
  self.clients.claim();
});

/**
 * Prefetch all _next/static/* chunks in background after activation.
 * This makes the app fully offline-capable after first successful load.
 */
async function prefetchBuildChunks() {
  try {
    const cache = await caches.open(CACHE);
    // Fetch the HTML to discover chunk URLs
    const res = await fetch("/");
    if (!res.ok) return;
    const html = await res.text();
    // Extract _next/static/* URLs from the HTML
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
  if (url.origin !== self.location.origin) return;

  // Navigation: CACHE-FIRST (instant!) + update in background
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req).then((cached) => {
        // Serve from cache INSTANTLY if available
        if (cached) {
          // Update cache in background (stale-while-revalidate)
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }).catch(() => {});
          return cached;
        }
        // No cache — try network, fallback to cached "/" (offline support)
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(async () => {
          // Network failed — serve cached "/" (the app shell)
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          // Last resort: return a basic offline page
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Офлайн</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem"><h2>📴 Офлайн</h2><p>Приложение загружается. Проверьте соединение.</p><button onclick="location.reload()">🔄 Перезагрузить</button></body></html>',
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        });
      })
    );
    return;
  }

  // _next/static/* chunks: CACHE-FIRST (these are immutable, hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (!res || res.status !== 200) return res;
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached || new Response("", { status: 504 }));
      })
    );
    return;
  }

  // /locales/*.json: CACHE-FIRST with background update
  if (url.pathname.startsWith("/locales/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((res) => {
          if (!res || res.status !== 200) return res;
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached || new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
      })
    );
    return;
  }

  // Static assets: CACHE-FIRST
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
