// Service Worker for Fart Counter PWA — CACHE-FIRST strategy for max speed.
// Version bumped on each release to invalidate old caches.
const CACHE = "fart-counter-v1.4.4";
const PRECACHE = [
  "/",
  "/manifest.json",
  "/version.json",
  "/icon-192.png",
  "/icon-512.png",
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
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: cache-first for instant load, update in background
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req).then((cached) => {
        // Serve from cache immediately (instant!)
        const networkFetch = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached || caches.match("/"));
        return cached || networkFetch;
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
