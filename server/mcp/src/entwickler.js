/* Entwickler-Werkzeuge (nur Recht „entwickler“: Schlüssel mit rechte "entwickler" oder Microsoft-Rolle Admin/Entwickler).
   Voller Zugriff auf alle Datenarten – aber nichts geht unwiederbringlich verloren:
   - vor jeder Änderung wird die alte Fassung als Sicherung abgelegt (Datenart „mcp_sicherung“),
   - Löschen setzt nur deleted:true (wie die Apps) – „dev_rueckgaengig“ holt jede Fassung zurück,
   - jede Änderung steht im MCP-Protokoll.
   Geänderte Datensätze bekommen ein neues „updated“, damit die Apps sie beim nächsten Abgleich übernehmen. */
import { z } from "zod";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const MAX = 120_000; /* Zeichen pro Antwort – mehr frisst nur Platz im Gespräch */
const INTERN = ["mcp_sicherung", "mcp_protokoll"];
const REF = { kundeId: "kunden", standortId: "standorte", baustelleId: "baustellen", ladeparkId: "ladeparks", ortId: "standorte", eintragId: "eintraege", parentId: null };
function aus(daten, text) {
  let s = JSON.stringify(daten, null, 1);
  if (s.length > MAX) s = s.slice(0, MAX) + `\n… (gekürzt, ${s.length} Zeichen – Filter oder „felder“ benutzen)`;
  return { content: [{ type: "text", text: (text ? text + "\n\n" : "") + s }] };
}
const fehler = t => ({ isError: true, content: [{ type: "text", text: t }] });
const holen = (o, pfad) => String(pfad).split(".").reduce((x, k) => x == null ? undefined : x[k], o);
function setzen(o, pfad, wert) { const t = String(pfad).split("."), letzt = t.pop(); let x = o;
  for (const k of t) { if (["__proto__", "constructor", "prototype"].includes(k)) throw new Error("Ungültiger Pfad"); if (x[k] == null || typeof x[k] !== "object") x[k] = {}; x = x[k]; }
  if (["__proto__", "constructor", "prototype"].includes(letzt)) throw new Error("Ungültiger Pfad"); x[letzt] = wert; }
function entfernen(o, pfad) { const t = String(pfad).split("."), letzt = t.pop(); const x = t.reduce((a, k) => a == null ? a : a[k], o); if (x && typeof x === "object") delete x[letzt]; }
function typ(v) { return v === null ? "null" : Array.isArray(v) ? "liste" : typeof v === "object" ? "objekt" : typeof v; }
const passt = (r, w) => { const v = holen(r, w.feld), s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v), q = w.wert == null ? "" : String(w.wert);
  switch (w.op) { case "gleich": return s === q; case "ungleich": return s !== q; case "enthaelt": return s.toLowerCase().includes(q.toLowerCase());
    case "groesser": return isNaN(+s) || isNaN(+q) ? s > q : +s > +q; case "kleiner": return isNaN(+s) || isNaN(+q) ? s < q : +s < +q;
    case "leer": return v == null || s === "" || (Array.isArray(v) && !v.length); case "nicht_leer": return !(v == null || s === "" || (Array.isArray(v) && !v.length)); default: return true; } };

export function entwicklerWerkzeuge(server, S, ich) {
  if (ich.rechte !== "entwickler") return;
  const wer = { name: ich.name, mail: ich.mail || "" };
  const reg = (name, cfg, fn, nurLesen = true) => server.registerTool(name, { ...cfg, annotations: { readOnlyHint: nurLesen, destructiveHint: false } }, async a => {
    try { return await fn(a || {}); } catch (e) { return fehler("Fehler: " + (e.message || e)); } });

  async function sichern(art, vorher, werkzeug, datensatzId) {
    const id = "s-" + uid();
    await S.schreiben("mcp_sicherung", { id, art, datensatzId, vorher: vorher || null, zeit: new Date().toISOString(), wer: wer.name, werkzeug, updated: Date.now() });
    return id;
  }
  async function schreibe(werkzeug, art, rec, eingabe, vorher) {
    if (INTERN.includes(art)) throw new Error("Interne Datenart – nicht änderbar");
    const sid = await sichern(art, vorher, werkzeug, rec.id), t = Date.now();
    if (!vorher) { rec.created ||= t; rec.createdBy ||= wer; }
    rec.updated = Math.max(t, (vorher && vorher.updated || 0) + 1); rec.updatedBy = wer;
    await S.schreiben(art, rec);
    await S.protokoll({ zeit: new Date(t).toISOString(), wer: wer.name, mail: wer.mail, quelle: ich.quelle, werkzeug, art, id: rec.id, sicherung: sid, eingabe });
    return sid;
  }

  reg("dev_datenarten", { title: "Datenarten und Mengen", description: "Alle Datenarten im Speicher mit Anzahl (aktiv/gelöscht) und letzter Änderung. Einstieg für alles Weitere." }, async () => {
    const out = [];
    for (const art of (await S.arten()).sort()) { const L = await S.alle(art, { geloeschte: true }); const t = Math.max(0, ...L.map(r => +r.updated || 0));
      out.push({ art, aktiv: L.filter(r => !r.deleted).length, geloescht: L.filter(r => r.deleted).length, zuletzt: t ? new Date(t).toISOString() : null }); }
    return aus(out, `Speicher: ${S.name}`);
  });

  reg("dev_felder", { title: "Felder einer Datenart", description: "Leitet den Aufbau einer Datenart aus den echten Daten ab: welche Felder (auch verschachtelt), welcher Typ, wie oft vorhanden, Beispielwert.",
    inputSchema: { art: z.string(), tiefe: z.number().int().min(1).max(4).optional() } }, async ({ art, tiefe = 2 }) => {
    const L = await S.alle(art, { geloeschte: true }), F = new Map();
    const lauf = (o, pre, d) => { for (const [k, v] of Object.entries(o || {})) { const p = pre ? pre + "." + k : k, e = F.get(p) || { feld: p, typen: new Set(), anzahl: 0, beispiel: undefined };
      e.typen.add(typ(v)); e.anzahl++; if (e.beispiel === undefined && v != null && v !== "") e.beispiel = typeof v === "object" ? JSON.stringify(v).slice(0, 80) : v; F.set(p, e);
      if (d < tiefe && v && typeof v === "object" && !Array.isArray(v)) lauf(v, p, d + 1); } };
    L.forEach(r => lauf(r, "", 1));
    return aus([...F.values()].sort((a, b) => b.anzahl - a.anzahl).map(e => ({ ...e, typen: [...e.typen].join("|") })), `${art}: ${L.length} Datensätze`);
  });

  reg("dev_abfragen", { title: "Datensätze abfragen", description: "Flexible Abfrage über eine Datenart: Bedingungen auf Felder (auch „a.naechste“), Volltext, Sortierung, nur bestimmte Felder.",
    inputSchema: { art: z.string(), wo: z.array(z.object({ feld: z.string(), op: z.enum(["gleich", "ungleich", "enthaelt", "groesser", "kleiner", "leer", "nicht_leer"]), wert: z.any().optional() })).optional(),
      text: z.string().optional(), sortiere: z.string().optional(), absteigend: z.boolean().optional(), felder: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(1000).optional(), mit_geloeschten: z.boolean().optional(), nur_anzahl: z.boolean().optional() } },
  async a => {
    let L = await S.alle(a.art, { geloeschte: !!a.mit_geloeschten });
    for (const w of a.wo || []) L = L.filter(r => passt(r, w));
    if (a.text) { const q = a.text.toLowerCase(); L = L.filter(r => JSON.stringify(r).toLowerCase().includes(q)); }
    if (a.nur_anzahl) return aus({ anzahl: L.length });
    if (a.sortiere) L.sort((x, y) => { const p = holen(x, a.sortiere), q = holen(y, a.sortiere); return (p > q ? 1 : p < q ? -1 : 0) * (a.absteigend ? -1 : 1); });
    const n = L.length; L = L.slice(0, a.limit || 50);
    if (a.felder && a.felder.length) L = L.map(r => Object.fromEntries([["id", r.id], ...a.felder.map(f => [f, holen(r, f)])]));
    return aus(L, `${n} Treffer${n > L.length ? `, gezeigt ${L.length}` : ""}`);
  });

  reg("dev_lesen", { title: "Datensatz roh lesen", description: "Ein Datensatz vollständig, so wie er gespeichert ist (auch gelöschte).", inputSchema: { art: z.string(), id: z.string() } }, async ({ art, id }) => {
    const r = await S.lesen(art, id, { geloeschte: true }); return r ? aus(r) : fehler("Nicht gefunden"); });

  reg("dev_suche_alles", { title: "Suche über alle Datenarten", description: "Findet einen Begriff in allen Datenarten (z. B. eine Auftragsnummer, einen Namen oder eine ID).", inputSchema: { text: z.string().min(2), limit: z.number().int().min(1).max(200).optional() } },
  async ({ text, limit = 50 }) => {
    const q = text.toLowerCase(), out = [];
    for (const art of await S.arten()) { if (INTERN.includes(art)) continue;
      for (const r of await S.alle(art)) { const s = JSON.stringify(r), i = s.toLowerCase().indexOf(q); if (i >= 0) out.push({ art, id: r.id, titel: r.name || r.titel || r.t || r.anliegen || r.bez || "", fundstelle: s.slice(Math.max(0, i - 60), i + 80) }); } }
    return aus(out.slice(0, limit), `${out.length} Treffer`);
  });

  reg("dev_pruefen", { title: "Datenqualität prüfen", description: "Sucht Fehler in den Daten: Verweise ins Leere (kundeId, standortId, baustelleId …), doppelte Kunden, Datensätze ohne id/updated. Optional nur eine Datenart.",
    inputSchema: { art: z.string().optional() } }, async ({ art }) => {
    const arten = art ? [art] : (await S.arten()).filter(x => !INTERN.includes(x)), cache = new Map();
    const ids = async a => { if (!cache.has(a)) cache.set(a, new Set((await S.alle(a)).map(r => r.id))); return cache.get(a); };
    const waisen = [], ohne = [];
    for (const a of arten) for (const r of await S.alle(a)) {
      if (!r.id || !r.updated) ohne.push({ art: a, id: r.id || "(ohne id)", fehlt: [!r.id && "id", !r.updated && "updated"].filter(Boolean) });
      for (const [f, z0] of Object.entries(REF)) { let v = r[f], ziel = z0; if (!v || !ziel || a === ziel || typeof v !== "string") continue;
        if (f === "ortId" && v.startsWith("k:")) { ziel = "kunden"; v = v.slice(2); } /* Ort = Adresse des Kunden selbst */
        if (!(await ids(ziel)).has(v)) waisen.push({ art: a, id: r.id, feld: f, verweist_auf: `${ziel}/${v}` }); } }
    const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9äöüß]/g, ""), K = new Map(), doppelt = [];
    if (!art || art === "kunden") for (const k of await S.alle("kunden")) { const n = norm(k.name || [k.vorname, k.nachname].join("")) + "|" + norm(k.plz); if (!n.startsWith("|")) { if (K.has(n)) doppelt.push({ a: K.get(n), b: k.id, name: k.name }); else K.set(n, k.id); } }
    return aus({ verweise_ins_leere: waisen, doppelte_kunden: doppelt, unvollstaendig: ohne }, `${waisen.length} tote Verweise, ${doppelt.length} mögliche Doppelte, ${ohne.length} unvollständige`);
  });

  reg("dev_protokoll", { title: "MCP-Protokoll", description: "Die letzten Änderungen über MCP: wer, wann, welches Werkzeug, welcher Datensatz, welche Sicherung.", inputSchema: { anzahl: z.number().int().min(1).max(500).optional() } },
  async ({ anzahl = 50 }) => aus(await S.protokollLesen(anzahl)));

  reg("dev_aendern", { title: "Datensatz ändern", description: "Setzt oder entfernt einzelne Felder (Pfade mit Punkt, z. B. „a.naechste“). Alte Fassung wird gesichert, Rückgängig mit dev_rueckgaengig.",
    inputSchema: { art: z.string(), id: z.string(), setzen: z.record(z.string(), z.any()).optional(), entfernen: z.array(z.string()).optional(), grund: z.string().min(3).describe("Warum – steht im Protokoll") } },
  async a => {
    const vorher = await S.lesen(a.art, a.id, { geloeschte: true }); if (!vorher) return fehler("Nicht gefunden");
    const neu = structuredClone(vorher);
    for (const [p, w] of Object.entries(a.setzen || {})) { if (["id"].includes(p)) return fehler("Die id kann nicht geändert werden"); setzen(neu, p, w); }
    for (const p of a.entfernen || []) { if (p === "id") return fehler("Die id kann nicht entfernt werden"); entfernen(neu, p); }
    const sid = await schreibe("dev_aendern", a.art, neu, a, vorher);
    return aus({ id: neu.id, sicherung: sid }, "Geändert. Die Apps übernehmen es beim nächsten Abgleich.");
  }, false);

  reg("dev_anlegen", { title: "Datensatz anlegen", description: "Legt einen Datensatz in beliebiger Datenart an (Aufbau vorher mit dev_felder ansehen). Ohne id wird eine erzeugt.",
    inputSchema: { art: z.string(), daten: z.record(z.string(), z.any()), grund: z.string().min(3) } }, async a => {
    const r = { ...a.daten, id: a.daten.id || uid() };
    if (await S.lesen(a.art, r.id, { geloeschte: true })) return fehler("Diese id gibt es schon – dev_aendern benutzen");
    const sid = await schreibe("dev_anlegen", a.art, r, a, null); return aus({ id: r.id, sicherung: sid }, "Angelegt.");
  }, false);

  reg("dev_loeschen", { title: "Datensatz löschen (wiederherstellbar)", description: "Markiert einen Datensatz als gelöscht (deleted:true) – wie Löschen in den Apps. Mit dev_rueckgaengig wiederherstellbar.",
    inputSchema: { art: z.string(), id: z.string(), grund: z.string().min(3) } }, async a => {
    const vorher = await S.lesen(a.art, a.id); if (!vorher) return fehler("Nicht gefunden oder schon gelöscht");
    const sid = await schreibe("dev_loeschen", a.art, { ...structuredClone(vorher), deleted: true }, a, vorher);
    return aus({ id: a.id, sicherung: sid }, "Als gelöscht markiert.");
  }, false);

  reg("dev_rueckgaengig", { title: "Änderung rückgängig", description: "Stellt die Fassung aus einer Sicherung wieder her (Sicherungs-ID steht in der Antwort jeder Änderung und im Protokoll).",
    inputSchema: { sicherung_id: z.string() } }, async ({ sicherung_id }) => {
    const s = await S.lesen("mcp_sicherung", sicherung_id); if (!s) return fehler("Sicherung nicht gefunden");
    const jetzt = s.datensatzId ? await S.lesen(s.art, s.datensatzId, { geloeschte: true }) : null;
    if (!s.vorher) { /* war ein Anlegen → wieder löschen */
      const id = jetzt ? jetzt.id : null; if (!id) return fehler("Datensatz nicht mehr da");
      const sid = await schreibe("dev_rueckgaengig", s.art, { ...jetzt, deleted: true }, { sicherung_id }, jetzt); return aus({ id, sicherung: sid }, "Anlegen rückgängig gemacht (als gelöscht markiert).");
    }
    const sid = await schreibe("dev_rueckgaengig", s.art, structuredClone(s.vorher), { sicherung_id }, jetzt);
    return aus({ id: s.vorher.id, sicherung: sid }, "Alte Fassung wiederhergestellt.");
  }, false);
}
