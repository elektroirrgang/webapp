/* Die MCP-Werkzeuge. Lesen darf jeder angemeldete Dienst, Schreiben nur mit Recht „schreiben“.
   Geschrieben wird nur über eigene, enge Werkzeuge (Vorgang, Notiz, Tagesstand, Material, Termin, Handbuch-Vorschlag) –
   kein freies Ändern beliebiger Datensätze. So bleiben die Daten so aufgebaut, wie die Apps sie erwarten.
   Jede Änderung: Datensatz mit createdBy/updatedBy (quelle "mcp") + Eintrag im MCP-Protokoll. */
import { z } from "zod";

const T = 864e5;
const heute = () => new Date().toISOString().slice(0, 10);
const plusTage = n => new Date(Date.now() + n * T).toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const klein = s => String(s ?? "").toLowerCase();
const kundeName = k => k ? (k.name || [k.vorname, k.nachname].filter(Boolean).join(" ") || k.id) : "";
const adresse = o => [o.strasse, [o.plz, o.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
const VG_S = ["anruf", "anfrage", "auftrag", "termin", "ausgefuehrt"];
const vgStufe = v => { let i = -1; VG_S.forEach((k, j) => { if (v.s && v.s[k]) i = j; }); return i; };
const vgZu = v => !!((v.s && v.s.ausgefuehrt) || v.erledigt || v.abgelehnt);
const vgStatus = v => v.abgelehnt ? "abgelehnt" : vgZu(v) ? "ausgeführt" : ["neu", "Anruf", "Anfrage", "Auftrag", "Termin"][vgStufe(v) + 1] || "offen";
const passt = (q, ...felder) => { const w = klein(q).split(/\s+/).filter(Boolean); const t = klein(JSON.stringify(felder)); return w.every(x => t.includes(x)); };
const plusMonate = (iso, m) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + (+m || 0)); return d.toISOString().slice(0, 10); };
const antwort = (daten, text) => ({ content: [{ type: "text", text: (text ? text + "\n\n" : "") + JSON.stringify(daten, null, 1) }] });
const fehler = text => ({ isError: true, content: [{ type: "text", text }] });

export function werkzeugeAnmelden(server, S, ich) {
  const darfSchreiben = ich.rechte === "schreiben" || ich.rechte === "entwickler";
  const wer = { name: ich.name + (ich.ki ? " (KI)" : ""), mail: ich.mail || "" };
  const kundenMap = async () => new Map((await S.alle("kunden")).map(k => [k.id, k]));

  async function speichern(werkzeug, art, rec, eingabe, neu) {
    const t = Date.now();
    if (neu) { rec.created = t; rec.createdBy = wer; }
    rec.updated = t; rec.updatedBy = wer; rec.quelle = "mcp";
    await S.schreiben(art, rec);
    await S.protokoll({ zeit: new Date(t).toISOString(), wer: wer.name, mail: wer.mail, quelle: ich.quelle, werkzeug, art, id: rec.id, eingabe });
    return rec;
  }
  const lesen = (name, cfg, fn) => server.registerTool(name, { ...cfg, annotations: { readOnlyHint: true, ...(cfg.annotations || {}) } }, async a => {
    try { return await fn(a || {}); } catch (e) { return fehler("Fehler: " + (e.message || e)); } });
  const schreiben = (name, cfg, fn) => { if (!darfSchreiben) return;
    server.registerTool(name, { ...cfg, annotations: { readOnlyHint: false, destructiveHint: false, ...(cfg.annotations || {}) } }, async a => {
      try { return await fn(a || {}); } catch (e) { return fehler("Fehler: " + (e.message || e)); } }); };

  /* ---------------- Lesen ---------------- */
  lesen("lage_heute", {
    title: "Lage heute",
    description: "Überblick für heute: offene Vorgänge (dringende zuerst), aktive Baustellen, Termine der nächsten 7 Tage, überfällige und bald fällige Prüfungen, offene Materialanforderungen."
  }, async () => {
    const K = await kundenMap();
    const vg = (await S.alle("vorgaenge")).filter(v => v.typ !== "meldung" && !vgZu(v));
    const bs = (await S.alle("baustellen")).filter(b => b.status === "aktiv");
    const tm = (await S.alle("termine")).filter(t => String(t.von || "").slice(0, 10) >= heute() && String(t.von || "").slice(0, 10) <= plusTage(7));
    const fr = await fristen(30);
    const an = (await S.alle("anforderungen")).filter(a => a.status === "angefordert");
    return antwort({
      datum: heute(),
      vorgaenge_offen: vg.sort((a, b) => (b.dringend ? 1 : 0) - (a.dringend ? 1 : 0)).slice(0, 15).map(v => ({ id: v.id, kunde: kundeName(K.get(v.kundeId)) || v.kundeName || "", anliegen: v.anliegen, status: vgStatus(v), dringend: !!v.dringend })),
      vorgaenge_offen_gesamt: vg.length,
      baustellen_aktiv: bs.map(b => ({ id: b.id, name: b.name, kunde: kundeName(K.get(b.kundeId)), auftragsnr: b.auftragsnr || "" })),
      termine_7_tage: tm.map(t => ({ id: t.id, titel: t.t, von: t.von, bis: t.bis, ort: t.ort || "" })),
      pruefungen_faellig_30_tage: fr,
      material_angefordert: an.length
    });
  });

  lesen("kunden_suchen", {
    title: "Kunden suchen",
    description: "Sucht Kunden nach Name, Kundennummer, Ort, Straße oder Ansprechpartner. Mehrere Wörter = alle müssen vorkommen.",
    inputSchema: { text: z.string().describe("Suchbegriff, z. B. „Bergland“ oder „Waldbröl Lindenweg“"), limit: z.number().int().min(1).max(50).optional() }
  }, async ({ text, limit = 10 }) => {
    const L = (await S.alle("kunden")).filter(k => passt(text, k.name, k.vorname, k.nachname, k.kdnr, k.strasse, k.ort, k.plz, k.ansprech, (k.kontakte || []).map(c => c.name)));
    return antwort(L.slice(0, limit).map(k => ({ id: k.id, name: kundeName(k), kundenart: k.art || "", kundennr: k.kdnr || "", adresse: adresse(k), tel: k.tel || "", mail: k.mail || "", ansprechpartner: k.ansprech || "" })), `${L.length} Treffer`);
  });

  lesen("kunde_lesen", {
    title: "Kunde mit allem Zugehörigen",
    description: "Ein Kunde mit Kontakten, Standorten, Vorgängen, Baustellen, Prüfungen und Anlagen.",
    inputSchema: { kunde_id: z.string() }
  }, async ({ kunde_id }) => {
    const k = await S.lesen("kunden", kunde_id); if (!k) return fehler("Kunde nicht gefunden");
    const von = async art => (await S.alle(art)).filter(x => x.kundeId === kunde_id);
    const [st, vg, bs, pr, an] = await Promise.all([von("standorte"), von("vorgaenge"), von("baustellen"), von("pruefungen"), von("anlagen")]);
    return antwort({
      kunde: { id: k.id, name: kundeName(k), kundenart: k.art || "", kundennr: k.kdnr || "", adresse: adresse(k), tel: k.tel || "", mail: k.mail || "", kontakte: k.kontakte || [] },
      standorte: st.map(s => ({ id: s.id, name: s.name, adresse: adresse(s) })),
      vorgaenge: vg.map(v => ({ id: v.id, anliegen: v.anliegen, status: vgStatus(v), auftragsnr: v.s && v.s.auftrag && v.s.auftrag.nr || "" })),
      baustellen: bs.map(b => ({ id: b.id, name: b.name, status: b.status, auftragsnr: b.auftragsnr || "" })),
      pruefungen: pr.map(p => ({ id: p.id, art: p.p && p.p.art, datum: p.p && p.p.datum, naechste: p.a && p.a.naechste || "", standort_id: p.standortId || "" })),
      anlagen: an.map(a => ({ id: a.id, nr: a.nr, bezeichnung: a.bez, hersteller: a.hersteller || "", frist_monate: a.fristM || null }))
    });
  });

  lesen("vorgaenge_auflisten", {
    title: "Vorgänge auflisten",
    description: "Vorgänge (Anruf → Anfrage → Auftrag → Termin → ausgeführt). Filter: offen (Standard), buero (wartet aufs Büro), ohne_termin, erledigt, alle. Optional nur für einen Kunden.",
    inputSchema: { filter: z.enum(["offen", "buero", "ohne_termin", "erledigt", "alle"]).optional(), kunde_id: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }
  }, async ({ filter = "offen", kunde_id, limit = 30 }) => {
    const K = await kundenMap();
    let L = (await S.alle("vorgaenge")).filter(v => v.typ !== "meldung" && (!kunde_id || v.kundeId === kunde_id));
    L = L.filter(v => filter === "alle" ? true : filter === "erledigt" ? vgZu(v) : filter === "buero" ? !vgZu(v) && vgStufe(v) === 1 : filter === "ohne_termin" ? !vgZu(v) && vgStufe(v) === 2 : !vgZu(v));
    L.sort((a, b) => (b.dringend ? 1 : 0) - (a.dringend ? 1 : 0) || (b.updated || 0) - (a.updated || 0));
    return antwort(L.slice(0, limit).map(v => ({ id: v.id, kunde: kundeName(K.get(v.kundeId)) || v.kundeName || "", kunde_id: v.kundeId || "", anliegen: v.anliegen, status: vgStatus(v), dringend: !!v.dringend,
      auftragsnr: v.s && v.s.auftrag && v.s.auftrag.nr || "", termin: v.s && v.s.termin ? { datum: v.s.termin.datum, zeit: v.s.termin.zeit || "", mit: v.s.termin.mit || "" } : null,
      zustaendig: v.zust && v.zust.name || "" })), `${L.length} Vorgänge`);
  });

  lesen("vorgang_lesen", { title: "Vorgang lesen", description: "Ein Vorgang mit allen Schritten und Notizen.", inputSchema: { vorgang_id: z.string() } }, async ({ vorgang_id }) => {
    const v = await S.lesen("vorgaenge", vorgang_id); if (!v) return fehler("Vorgang nicht gefunden");
    const k = v.kundeId ? await S.lesen("kunden", v.kundeId) : null;
    return antwort({ ...v, kunde: kundeName(k) || v.kundeName || "", status: vgStatus(v) });
  });

  lesen("baustellen_auflisten", {
    title: "Baustellen auflisten", description: "Baustellen mit Status aktiv, pausiert oder fertig.",
    inputSchema: { status: z.enum(["aktiv", "pausiert", "fertig", "alle"]).optional() }
  }, async ({ status = "aktiv" }) => {
    const K = await kundenMap();
    const L = (await S.alle("baustellen")).filter(b => status === "alle" || b.status === status);
    return antwort(L.map(b => ({ id: b.id, name: b.name, kunde: kundeName(K.get(b.kundeId)), kunde_id: b.kundeId || "", status: b.status, auftragsnr: b.auftragsnr || "" })), `${L.length} Baustellen`);
  });

  lesen("baustelle_lesen", {
    title: "Baustelle lesen", description: "Eine Baustelle mit den letzten Tagesständen (Übergaben) und offenen Materialanforderungen.",
    inputSchema: { baustelle_id: z.string(), eintraege: z.number().int().min(1).max(50).optional() }
  }, async ({ baustelle_id, eintraege = 10 }) => {
    const b = await S.lesen("baustellen", baustelle_id); if (!b) return fehler("Baustelle nicht gefunden");
    const k = b.kundeId ? await S.lesen("kunden", b.kundeId) : null;
    const E = (await S.alle("eintraege")).filter(e => e.baustelleId === baustelle_id).sort((a, c) => String(c.datum).localeCompare(String(a.datum)));
    const A = (await S.alle("anforderungen")).filter(a => a.baustelleId === baustelle_id && a.status !== "erledigt");
    return antwort({ baustelle: { id: b.id, name: b.name, status: b.status, auftragsnr: b.auftragsnr || "", kunde: kundeName(k), adresse: k ? adresse(k) : "" },
      tagesstaende: E.slice(0, eintraege).map(e => ({ id: e.id, datum: e.datum, stand: e.stand || "", offen: e.offen || "", dabei: e.dabei || [], von: e.createdBy && e.createdBy.name || "" })),
      material: A.map(a => ({ id: a.id, status: a.status, positionen: a.pos || [], notiz: a.notiz || "" })) });
  });

  async function fristen(tage, mitUeberfaellig = true) {
    const K = await kundenMap(), bis = plusTage(tage), out = [];
    for (const p of await S.alle("pruefungen")) { const n = p.a && p.a.naechste; if (n && n <= bis && (mitUeberfaellig || n >= heute()))
      out.push({ typ: "Ladeeinrichtung (EVSE)", id: p.id, kunde: kundeName(K.get(p.kundeId)), faellig: n, ueberfaellig: n < heute(), letzte: p.p && p.p.datum || "" }); }
    for (const a of await S.alle("anlagen")) { const P = (a.pruefungen || []).map(x => x.datum).filter(Boolean).sort(); if (!a.fristM || !P.length) continue;
      const n = plusMonate(P[P.length - 1], a.fristM); if (n <= bis && (mitUeberfaellig || n >= heute()))
        out.push({ typ: "Maschine/Anlage", id: a.id, kunde: kundeName(K.get(a.kundeId)), bezeichnung: [a.nr, a.bez].filter(Boolean).join(" "), faellig: n, ueberfaellig: n < heute(), letzte: P[P.length - 1] }); }
    return out.sort((a, b) => a.faellig.localeCompare(b.faellig));
  }
  lesen("pruefungen_faellig", {
    title: "Fällige Prüfungen", description: "Wiederholungsprüfungen (Ladeeinrichtungen und Maschinen/Anlagen), die in den nächsten Tagen fällig werden – überfällige werden mit angezeigt.",
    inputSchema: { tage: z.number().int().min(0).max(730).optional().describe("Zeitraum ab heute, Standard 30"), ueberfaellige: z.boolean().optional() }
  }, async ({ tage = 30, ueberfaellige = true }) => { const L = await fristen(tage, ueberfaellige); return antwort(L, `${L.length} Prüfungen bis ${plusTage(tage)}`); });

  lesen("handbuch_suchen", {
    title: "Betriebshandbuch durchsuchen", description: "Sucht im freigegebenen Betriebshandbuch von Elektro Irrgang (Arbeitszeiten, Krankmeldung, Fahrzeuge, Baustelle, Klemmen, Aderfarben, Material, Arbeitssicherheit …).",
    inputSchema: { text: z.string() }
  }, async ({ text }) => {
    const L = (await S.alle("handbuch")).filter(a => +a.stand > 0 && passt(text, a.titel, a.inhalt, a.checkliste));
    return antwort(L.map(a => ({ id: a.id, titel: a.titel, kapitel: a.kapitel, stand: a.stand, auszug: String(a.inhalt || "").replace(/^\?\?.*$/gm, "").replace(/\s+/g, " ").slice(0, 240) })), `${L.length} Artikel`);
  });
  lesen("handbuch_artikel_lesen", { title: "Handbuch-Artikel lesen", description: "Ganzer Text eines Handbuch-Artikels (ohne die internen „noch offen“-Hinweise).", inputSchema: { artikel_id: z.string() } }, async ({ artikel_id }) => {
    const a = await S.lesen("handbuch", artikel_id); if (!a || !(+a.stand > 0)) return fehler("Artikel nicht gefunden oder nicht freigegeben");
    return antwort({ id: a.id, titel: a.titel, kapitel: a.kapitel, stand: a.stand, freigegeben: a.frei || null, text: String(a.inhalt || "").split("\n").filter(z => !/^\s*\?\?/.test(z)).join("\n"), checkliste: a.checkliste || [] });
  });

  lesen("termine_auflisten", {
    title: "Firmentermine", description: "Firmentermine aus dem Kalender der Übersicht in einem Zeitraum.",
    inputSchema: { von: z.string().optional().describe("JJJJ-MM-TT, Standard heute"), bis: z.string().optional().describe("JJJJ-MM-TT, Standard +30 Tage") }
  }, async ({ von = heute(), bis = plusTage(30) }) => {
    const L = (await S.alle("termine")).filter(t => !t.privat && String(t.von || "").slice(0, 10) >= von && String(t.von || "").slice(0, 10) <= bis).sort((a, b) => String(a.von).localeCompare(String(b.von)));
    return antwort(L.map(t => ({ id: t.id, titel: t.t, von: t.von, bis: t.bis, ganztags: !!t.ganz, ort: t.ort || "", notiz: t.notiz || "" })), `${L.length} Termine`);
  });

  lesen("material_anforderungen", {
    title: "Materialanforderungen", description: "Materialanforderungen der Monteure (angefordert → bestellt → erledigt).",
    inputSchema: { status: z.enum(["angefordert", "bestellt", "erledigt", "alle"]).optional() }
  }, async ({ status = "angefordert" }) => {
    const B = new Map((await S.alle("baustellen")).map(b => [b.id, b]));
    const L = (await S.alle("anforderungen")).filter(a => status === "alle" || a.status === status);
    return antwort(L.map(a => ({ id: a.id, baustelle: a.baustelleId ? (B.get(a.baustelleId) || {}).name || a.baustelleId : "Lager", status: a.status, positionen: a.pos || [], notiz: a.notiz || "", von: a.createdBy && a.createdBy.name || "" })), `${L.length} Anforderungen`);
  });

  /* ---------------- Schreiben ---------------- */
  schreiben("vorgang_anlegen", {
    title: "Vorgang anlegen", description: "Legt einen neuen Vorgang an (Stufe „Anruf“), z. B. aus einem Telefonat oder einer Mail. Entweder kunde_id eines bestehenden Kunden oder kunde_name für Neukunden.",
    inputSchema: { anliegen: z.string().min(3), kunde_id: z.string().optional(), kunde_name: z.string().optional(), tel: z.string().optional(), dringend: z.boolean().optional(), notiz: z.string().optional() }
  }, async a => {
    if (a.kunde_id && !(await S.lesen("kunden", a.kunde_id))) return fehler("Kunde nicht gefunden – kunde_name für Neukunden verwenden");
    if (!a.kunde_id && !a.kunde_name) return fehler("kunde_id oder kunde_name angeben");
    const t = Date.now(), r = { id: uid(), anliegen: a.anliegen.trim(), s: { anruf: { wer, at: t } }, ...(a.kunde_id ? { kundeId: a.kunde_id } : { kundeName: a.kunde_name.trim() }),
      ...(a.tel ? { tel: a.tel } : {}), ...(a.dringend ? { dringend: true } : {}), notizen: a.notiz ? [{ id: uid(), wer, at: t, text: a.notiz }] : [] };
    await speichern("vorgang_anlegen", "vorgaenge", r, a, true);
    return antwort({ id: r.id }, "Vorgang angelegt – er erscheint in der Übersicht unter Aufträge.");
  });

  schreiben("vorgang_notiz", {
    title: "Notiz zu Vorgang", description: "Hängt eine Notiz an einen bestehenden Vorgang an.",
    inputSchema: { vorgang_id: z.string(), text: z.string().min(1) }
  }, async a => {
    const v = await S.lesen("vorgaenge", a.vorgang_id); if (!v) return fehler("Vorgang nicht gefunden");
    v.notizen = [...(v.notizen || []), { id: uid(), wer, at: Date.now(), text: a.text }];
    await speichern("vorgang_notiz", "vorgaenge", v, a, false); return antwort({ id: v.id }, "Notiz gespeichert.");
  });

  schreiben("tagesstand_anlegen", {
    title: "Tagesstand für Baustelle", description: "Schreibt einen Tagesstand (Übergabe) zu einer Baustelle: was gemacht wurde, was offen ist, wer dabei war.",
    inputSchema: { baustelle_id: z.string(), stand: z.string().min(1), offen: z.string().optional(), datum: z.string().optional().describe("JJJJ-MM-TT, Standard heute"), dabei: z.array(z.string()).optional() }
  }, async a => {
    if (!(await S.lesen("baustellen", a.baustelle_id))) return fehler("Baustelle nicht gefunden");
    const r = { id: uid(), baustelleId: a.baustelle_id, datum: a.datum || heute(), stand: a.stand, offen: a.offen || "", mat: [], fotos: [], dabei: a.dabei || [] };
    await speichern("tagesstand_anlegen", "eintraege", r, a, true); return antwort({ id: r.id }, "Tagesstand gespeichert.");
  });

  schreiben("material_anfordern", {
    title: "Material anfordern", description: "Legt eine Materialanforderung an (für eine Baustelle oder fürs Lager). Das Büro sieht sie unter Material.",
    inputSchema: { positionen: z.array(z.object({ text: z.string(), menge: z.number().positive(), einheit: z.string().optional() })).min(1), baustelle_id: z.string().optional(), notiz: z.string().optional() }
  }, async a => {
    if (a.baustelle_id && !(await S.lesen("baustellen", a.baustelle_id))) return fehler("Baustelle nicht gefunden");
    const t = Date.now(), r = { id: uid(), baustelleId: a.baustelle_id || "", eintragId: "", pos: a.positionen.map(p => ({ t: p.text, q: p.menge, u: p.einheit || "Stück" })), notiz: a.notiz || "", status: "angefordert", statusAm: t, statusVon: wer };
    await speichern("material_anfordern", "anforderungen", r, a, true); return antwort({ id: r.id }, "Material angefordert.");
  });

  schreiben("termin_anlegen", {
    title: "Firmentermin anlegen", description: "Legt einen Firmentermin im Kalender der Übersicht an (für alle sichtbar).",
    inputSchema: { titel: z.string().min(1), von: z.string().describe("JJJJ-MM-TTTHH:MM oder JJJJ-MM-TT bei ganztags"), bis: z.string().optional(), ganztags: z.boolean().optional(), ort: z.string().optional(), notiz: z.string().optional() }
  }, async a => {
    const ganz = !!a.ganztags || /^\d{4}-\d{2}-\d{2}$/.test(a.von), von = ganz ? a.von.slice(0, 10) + "T00:00" : a.von.slice(0, 16);
    const bis = a.bis ? (ganz ? a.bis.slice(0, 10) + "T00:00" : a.bis.slice(0, 16)) : von;
    const r = { id: uid(), t: a.titel, von, bis, ganz, ort: a.ort || "", notiz: a.notiz || "", fuer: "alle" };
    await speichern("termin_anlegen", "termine", r, a, true); return antwort({ id: r.id }, "Termin angelegt.");
  });

  schreiben("handbuch_vorschlag", {
    title: "Änderung am Handbuch vorschlagen", description: "Schlägt einen geänderten Text für einen Handbuch-Artikel vor. Er gilt erst, wenn Chef oder Büro ihn in der App freigeben.",
    inputSchema: { artikel_id: z.string(), neuer_text: z.string().min(1), begruendung: z.string().min(3) }
  }, async a => {
    const r = await S.lesen("handbuch", a.artikel_id); if (!r) return fehler("Artikel nicht gefunden");
    r.vorschlaege = [...(r.vorschlaege || []).filter(x => !x.erledigt), { id: uid(), von: wer.name, mail: wer.mail, am: heute(), titel: r.titel, kapitel: r.kapitel, inhalt: a.neuer_text, checkliste: r.checkliste || [], fotos: r.fotos || [], notiz: a.begruendung }];
    await speichern("handbuch_vorschlag", "handbuch", r, { artikel_id: a.artikel_id, begruendung: a.begruendung }, false);
    return antwort({ id: r.id }, "Vorschlag gespeichert – wartet auf Freigabe.");
  });
}
