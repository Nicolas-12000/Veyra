/**
 * Veyra Service Worker — Offline-first caching strategy
 * 
 * Strategy:
 *  - Static assets (JS, CSS, images, fonts): Cache-first
 *  - API calls: Network-first with fallback
 *  - Navigation: Network-first, fallback to cached index
 */

const CACHE_NAME = "veyra-v1";
const STATIC_CACHE = "veyra-static-v1";

// Static assets to pre-cache
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/favicon.ico",
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Disable service worker caching in local development to prevent stale bundle issues
  const hostname = self.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  ) {
    return;
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Next.js internal requests
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }))
    );
    return;
  }

  // API: network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) =>
          cached || new Response(JSON.stringify({ error: "Offline" }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          })
        )
      )
    );
    return;
  }

  // Navigation: network-first, fallback to /dashboard
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/dashboard").then((cached) => cached || fetch("/"))
      )
    );
    return;
  }

  // Default: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
