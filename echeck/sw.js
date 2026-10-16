const CACHE = "echeck-v0.6.10-beaddfea";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll([new Request("./", {cache: "reload"}), new Request("./index.html", {cache: "reload"})]))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("echeck-v") && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(new Request(e.request, {cache: "no-cache"})).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
