/* Speicher „SharePoint“: liest und schreibt genau die JSON-Dateien, die die Apps heute abgleichen.
   Website ElektroIrrgangApps, je Datenart eine Bibliothek (wie BIB in den Apps), darin _App-Daten/<Datenart>/<id>.json.
   Anmeldung als App (Client-ID + Geheimnis) mit der Berechtigung Sites.Selected – nur diese eine Website.
   Schreiben wie die Apps: neuere Fassung („updated“) gewinnt, ETag schützt vor gleichzeitigem Überschreiben. */
import { KONFIG } from "../konfig.js";

const BIB = { kunden: "Kundendaten", standorte: "Kundendaten", profile: "Kundendaten", einstellungen: "Kundendaten", dateien: "Kundendaten", vorgaenge: "Kundendaten", protokolle: "Kundendaten",
  ladeparks: "Prüfprotokolle", pruefungen: "Prüfprotokolle", katalog: "Prüfprotokolle", geraete: "Prüfprotokolle", gebaeude: "Prüfprotokolle", echecks: "Prüfprotokolle",
  baustellen: "Baustellen", eintraege: "Baustellen", anforderungen: "Baustellen", material: "Baustellen", notizen: "Baustellen",
  fotos: "Kundendaten", handbuch: "Kundendaten", bfristen: "Kundendaten", anlagen: "Kundendaten", wuensche: "Kundendaten", termine: "Kundendaten", mcp_protokoll: "Kundendaten" };
const GRAPH = "https://graph.microsoft.com/v1.0";
const sicher = s => /^[\w.-]{1,120}$/.test(String(s));

export function sharepointSpeicher() {
  if (!KONFIG.spClientId || !KONFIG.spClientSecret) throw new Error("SP_CLIENT_ID und SP_CLIENT_SECRET fehlen in .env");
  let tok = null, tokBis = 0, drives = null;
  const cache = new Map(); /* art → {zeit, liste} – 30 s, damit die KI nicht bei jeder Frage alles neu lädt */

  async function token() {
    if (tok && Date.now() < tokBis - 60000) return tok;
    const r = await fetch(`https://login.microsoftonline.com/${KONFIG.tenantId}/oauth2/v2.0/token`, { method: "POST",
      body: new URLSearchParams({ client_id: KONFIG.spClientId, client_secret: KONFIG.spClientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }) });
    const j = await r.json(); if (!r.ok) throw new Error("Microsoft-Anmeldung der App fehlgeschlagen: " + (j.error_description || r.status));
    tok = j.access_token; tokBis = Date.now() + j.expires_in * 1000; return tok;
  }
  async function g(pfad, opt = {}) {
    for (let v = 0; v < 4; v++) {
      const r = await fetch(pfad.startsWith("http") ? pfad : GRAPH + pfad, { ...opt, headers: { Authorization: "Bearer " + await token(), ...(opt.headers || {}) } });
      if ([429, 503, 504].includes(r.status)) { await new Promise(x => setTimeout(x, Math.min(+(r.headers.get("Retry-After") || 2), 10) * 1000)); continue; }
      return r;
    }
    throw new Error("Microsoft ist gerade ausgelastet");
  }
  async function bibliotheken() {
    if (drives) return drives;
    const m = /^https:\/\/([^/]+)\/sites\/([^/?#]+)/i.exec(KONFIG.spSite); if (!m) throw new Error("SP_SITE ist keine SharePoint-Website");
    const site = await (await g(`/sites/${m[1]}:/sites/${m[2]}`)).json(); if (!site.id) throw new Error("SharePoint-Website nicht erreichbar");
    const liste = (await (await g(`/sites/${site.id}/drives`)).json()).value || [];
    const dn = d => [d.name, decodeURIComponent((d.webUrl || "").split("/").pop() || "")];
    drives = {}; for (const n of new Set(Object.values(BIB))) { const d = liste.find(x => dn(x).includes(n)); if (d) drives[n] = d.id; }
    return drives;
  }
  async function ordner(art) {
    const d = (await bibliotheken())[BIB[art] || "Kundendaten"]; if (!d) throw new Error(`Bibliothek für ${art} fehlt`);
    return `/drives/${d}/root:/${encodeURIComponent(KONFIG.spDatenOrdner)}/${encodeURIComponent(art)}`;
  }
  return {
    name: "sharepoint",
    async arten() {
      const D = await bibliotheken(), out = new Set();
      for (const d of Object.values(D)) { const r = await g(`/drives/${d}/root:/${encodeURIComponent(KONFIG.spDatenOrdner)}:/children?$top=200&$select=name,folder`);
        if (r.ok) for (const x of (await r.json()).value || []) if (x.folder && sicher(x.name)) out.add(x.name); }
      return [...out];
    },
    async protokollLesen(n = 50) { return (await this.alle("mcp_protokoll")).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, n); },
    async alle(art, { geloeschte = false } = {}) {
      if (!sicher(art)) return [];
      const ck = art + (geloeschte ? "|alle" : ""), c = cache.get(ck); if (c && Date.now() - c.zeit < 30000) return c.liste;
      let url = `${await ordner(art)}:/children?$top=200&$select=name,id,@microsoft.graph.downloadUrl`, out = [];
      const dateien = [];
      while (url) { const r = await g(url); if (r.status === 404) break; const j = await r.json(); dateien.push(...(j.value || [])); url = j["@odata.nextLink"] || null; }
      for (let i = 0; i < dateien.length; i += 8) {
        const teil = await Promise.all(dateien.slice(i, i + 8).filter(f => f.name.endsWith(".json")).map(async f => {
          try { const r = await fetch(f["@microsoft.graph.downloadUrl"]); return r.ok ? await r.json() : null; } catch { return null; } }));
        out.push(...teil.filter(r => r && (geloeschte || !r.deleted) && !r.demo));
      }
      cache.set(ck, { zeit: Date.now(), liste: out }); return out;
    },
    async lesen(art, id, { geloeschte = false } = {}) {
      if (!sicher(art) || !sicher(id)) return null;
      const r = await g(`${await ordner(art)}/${encodeURIComponent(id)}.json:/content`);
      if (!r.ok) return null; const rec = await r.json(); return rec && (geloeschte || !rec.deleted) ? rec : null;
    },
    async schreiben(art, rec) {
      if (!sicher(art) || !sicher(rec.id)) throw new Error("Ungültige Datenart oder ID");
      const pfad = `${await ordner(art)}/${encodeURIComponent(rec.id)}.json`;
      const alt = await g(`${pfad}`);
      const kopf = { "Content-Type": "application/json" };
      if (alt.ok) { const meta = await alt.json(); kopf["If-Match"] = meta.eTag; }
      const r = await g(`${pfad}:/content`, { method: "PUT", headers: kopf, body: JSON.stringify(rec) });
      if (r.status === 412) throw new Error("Der Datensatz wurde gerade woanders geändert – bitte noch einmal versuchen");
      if (!r.ok) throw new Error(`Speichern in SharePoint fehlgeschlagen (${r.status})`);
      cache.delete(art); cache.delete(art + "|alle"); return rec;
    },
    async protokoll(e) {
      const id = `${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
      await this.schreiben("mcp_protokoll", { id, ...e, updated: Date.now() }).catch(() => {});
    }
  };
}
