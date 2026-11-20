// Minimal offline shell for the PWA: cache the dashboard shell; gifts always load fresh.
const CACHE = "hilo-shell-v1";
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/dashboard", "/icon-192.png"])).catch(() => {})));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/g/")) return;
  if (url.pathname === "/dashboard") e.respondWith(fetch(e.request).catch(() => caches.match("/dashboard")));
});
