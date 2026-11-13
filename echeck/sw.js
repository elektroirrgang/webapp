const CACHE = "echeck-v1.10.1-a8c59266";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll([new Request("./", {cache: "reload"}), new Request("./index.html", {cache: "reload"})]))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("echeck-v") && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
/* Produktbilder (/bilder/…) liegen im SharePoint der Firma, nicht öffentlich. Die App schickt nach der Anmeldung die Liste
   Pfad → Download-Adresse (gilt rund 1 h). Bilder kommen aus dem gemeinsamen Cache „irrgang-bilder“ oder über diese Liste. */
let BILD_URL = null;
const BILD_CACHE = "irrgang-bilder", BILD_LISTE = "/__bilder-liste";
self.addEventListener("message", e => { const d = e.data || {}; if (!d.bilderListe) return; BILD_URL = d.bilderListe;
  caches.open(BILD_CACHE).then(c => c.put(BILD_LISTE, new Response(JSON.stringify(d.bilderListe), {headers: {"Content-Type": "application/json"}}))); });
function bildListe(c) { return BILD_URL ? Promise.resolve(BILD_URL) : c.match(BILD_LISTE).then(m => m ? m.json() : {}).then(j => (BILD_URL = j || {})).catch(() => ({})); }
function bildHolen(req, pfad) {
  return caches.open(BILD_CACHE).then(c => c.match(pfad).then(m => m || bildListe(c).then(L => {
    const netz = () => fetch(req).then(r => { if (r.ok) c.put(pfad, r.clone()); return r; });
    if (!L[pfad]) return netz();
    return fetch(L[pfad]).then(r => { if (!r.ok) return netz(); const typ = r.headers.get("Content-Type") || ""; c.put(pfad, r.clone()); return r; }).catch(netz);
  })));
}
self.addEventListener("fetch", e => {
  { const u = new URL(e.request.url); if (e.request.method === "GET" && u.origin === location.origin && u.pathname.startsWith("/bilder/") && !u.pathname.endsWith(".json")) { e.respondWith(bildHolen(e.request, decodeURIComponent(u.pathname))); return; } }
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(new Request(e.request, {cache: "no-cache"})).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
self.addEventListener("notificationclick", e => { e.notification.close(); const ml = (e.notification.data || {}).ml || "";
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(cs => { const c = cs[0]; if (c) { c.postMessage({ml}); return c.focus(); } return self.clients.openWindow("./"); })); });
