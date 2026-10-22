const CACHE = "bau-v0.64.0-fc9814bc";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll([new Request("./", {cache: "reload"}), new Request("./index.html", {cache: "reload"}), new Request("./pdfjs/pdf.min.js", {cache: "reload"}), new Request("./pdfjs/pdf.worker.min.js", {cache: "reload"})]))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("bau-v") && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(new Request(e.request, {cache: "no-cache"})).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
self.addEventListener("notificationclick", e => { e.notification.close(); const ml = (e.notification.data || {}).ml || "";
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(cs => { const c = cs[0]; if (c) { c.postMessage({ml}); return c.focus(); } return self.clients.openWindow("./"); })); });
