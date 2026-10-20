const CACHE = "evse-v0.20.0-3c2a9e83", BILDER = "evse-bilder";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll([new Request("./", {cache: "reload"}), new Request("./index.html", {cache: "reload"}), new Request("./pdfjs/pdf.min.js", {cache: "reload"}), new Request("./pdfjs/pdf.worker.min.js", {cache: "reload"})]))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("evse-v") && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const eigen = new URL(e.request.url).origin === location.origin;
  if (!eigen && e.request.destination === "image") {
    e.respondWith(caches.open(BILDER).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(fetch(eigen ? new Request(e.request, {cache: "no-cache"}) : e.request).then(r => { const copy = r.clone(); if (eigen && r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
