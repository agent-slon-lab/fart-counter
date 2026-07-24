// Service Worker for Fart Counter PWA — CACHE-FIRST for instant load + FULL OFFLINE.
// Version bumped on each release to invalidate old caches.
const CACHE = "fart-counter-v1.5.9";
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
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {})
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
 * Runs asynchronously — does NOT block activation.
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
    // Also prefetch /_next/static/chunks/* and /_next/static/css/* patterns
    // Cache each chunk (ignore failures — some may 404)
    const urls = Array.from(chunkUrls);
    await Promise.all(
      urls.map((url) =>
        cache.add(url).catch(() => {})
      )
    );
  } catch {
    // Prefetch failed — app still works online, just not fully offline yet
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
        // No cache — try network, fallback to "/"
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => caches.match("/"));
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
        }).catch(() => cached);
      })
    );
    return;
  }

  // Static assets: CACHE-FIRST (fastest for repeat visits)
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
