/* Ordner mit Zugriffsrechten (Vorbereitung für die eigene Datenbank, Max 27.11.2026).
   Gedacht für Firmensachen (Logos, Verträge …), die nur bestimmte Personen sehen dürfen – z. B. „Firma“ nur für Joachim und Max.

   Aufbau wie alle anderen Daten der Apps (eine Datenart, ein JSON je Datensatz), damit die Apps es später 1:1 übernehmen:
     ordner:  { id, name, elternId?, zugriff?: [{ wer, recht }] }
     dateien: { …wie bisher…, ordnerId? }   – Dateien in einem Ordner erben dessen Rechte
   wer:   Mail-Adresse („m.pevec@elektro-irrgang.de“), „rolle:admin“ | „rolle:buero“ | „rolle:monteur“,
          „dienst:<Name des Zugangsschlüssels>“ (z. B. Nexilo) oder „alle“ (alle angemeldeten Mitarbeiter)
   recht: „lesen“ < „schreiben“ < „verwalten“ (verwalten = Rechte ändern, umbenennen, löschen)

   Regeln:
   - Ein Ordner ohne eigene Liste erbt von seinem Elternordner. Ein oberster Ordner ohne Liste ist für alle Mitarbeiter
     (verwalten dort nur Admins).
   - Hat ein Ordner eine Liste, gilt NUR sie – auch Admins und Entwickler kommen ohne Eintrag nicht hinein
     (Joachim wollte „nur Joachim und ich“, nicht „alle Admins“). Damit niemand sich aussperrt, braucht jede Liste
     mindestens einen Eintrag mit „verwalten“.
   - Kennwörter für Ordner gibt es bewusst nicht: Ein Kennwort versteckt nur die Anzeige, die Rechte müssen am Server hängen.
   - Durchgesetzt wird hier im Server (Hülle um den Speicher) – für alle Werkzeuge, auch die Entwickler-Werkzeuge. */

export const RECHTE = ["lesen", "schreiben", "verwalten"];
const stufe = r => RECHTE.indexOf(r);
const GESCHUETZT = new Set(["ordner", "dateien"]);

/** Wer ist „ich“ in der Sprache der Zugriffslisten? */
export function kennungen(ich) {
  const k = new Set(["alle"]);
  if (ich.mail) k.add(String(ich.mail).toLowerCase());
  if (ich.quelle === "schluessel" && ich.name) k.add("dienst:" + String(ich.name).toLowerCase());
  if (ich.admin) k.add("rolle:admin");
  if (ich.buero) k.add("rolle:buero");
  if (!ich.admin && !ich.buero && ich.quelle !== "schluessel") k.add("rolle:monteur");
  return k;
}

/** Höchstes Recht von „ich“ auf einen Ordner (null = kein Zugriff). O = Map id → Ordner. */
export function rechtAuf(ich, ordnerId, O, K = kennungen(ich)) {
  const gesehen = new Set();
  let o = O.get(ordnerId);
  if (!o || o.deleted) return null;
  while (o) {
    if (gesehen.has(o.id)) return null; /* Ring im Baum – lieber gar nichts zeigen */
    gesehen.add(o.id);
    if (Array.isArray(o.zugriff) && o.zugriff.length) {
      let best = -1;
      for (const z of o.zugriff) if (K.has(String(z.wer || "").toLowerCase())) best = Math.max(best, stufe(z.recht));
      return best >= 0 ? RECHTE[best] : null;
    }
    if (!o.elternId) return K.has("rolle:admin") ? "verwalten" : "schreiben"; /* oberster Ordner ohne Liste: alle Mitarbeiter; Rechte ändern nur Admins */
    o = O.get(o.elternId);
    if (!o || o.deleted) return null;
  }
  return null;
}
export const darf = (recht, noetig) => recht != null && stufe(recht) >= stufe(noetig);

/** Prüft eine neue Zugriffsliste, wirft bei Fehlern. */
export function listePruefen(zugriff) {
  if (zugriff == null) return;
  if (!Array.isArray(zugriff)) throw new Error("zugriff muss eine Liste sein");
  for (const z of zugriff) {
    if (!z || typeof z.wer !== "string" || !z.wer.trim()) throw new Error("Jeder Eintrag braucht „wer“");
    if (!RECHTE.includes(z.recht)) throw new Error(`Recht „${z.recht}“ gibt es nicht (lesen, schreiben, verwalten)`);
  }
  if (zugriff.length && !zugriff.some(z => z.recht === "verwalten")) throw new Error("Mindestens eine Person braucht „verwalten“ – sonst sperrt sich jeder aus");
}

/** Hülle um den Speicher: Ordner und Dateien, die „ich“ nicht sehen darf, gibt es für diese Anfrage einfach nicht. */
export function geschuetzt(S, ich) {
  const K = kennungen(ich);
  let cache = null;
  const ordnerMap = async () => cache ||= new Map((await S.alle("ordner", { geloeschte: true })).map(o => [o.id, o]));
  const recht = async (art, r) => {
    if (!r) return null;
    if (art === "ordner") return rechtAuf(ich, r.id, await ordnerMap(), K);
    if (art === "dateien") return r.ordnerId ? rechtAuf(ich, r.ordnerId, await ordnerMap(), K) : "verwalten";
    if (art === "mcp_sicherung" && GESCHUETZT.has(r.art)) return r.vorher ? recht(r.art, r.vorher) : "verwalten";
    return "verwalten";
  };
  return {
    ...S,
    name: S.name,
    async alle(art, o) {
      const L = await S.alle(art, o);
      if (!GESCHUETZT.has(art) && art !== "mcp_sicherung") return L;
      const out = [];
      for (const r of L) if (await recht(art, r)) out.push(r);
      return out;
    },
    async lesen(art, id, o) {
      const r = await S.lesen(art, id, o);
      return r && (await recht(art, r)) ? r : null;
    },
    async schreiben(art, rec) {
      if (GESCHUETZT.has(art)) {
        const alt = await S.lesen(art, rec.id, { geloeschte: true });
        if (art === "ordner") {
          listePruefen(rec.zugriff);
          const O = await ordnerMap();
          if (alt) {
            /* bestehender Ordner: Name/Inhalt ändern = schreiben, Rechte/Elternordner/Löschen = verwalten */
            const r = rechtAuf(ich, alt.id, O, K);
            const heikel = JSON.stringify(alt.zugriff || null) !== JSON.stringify(rec.zugriff || null) || (alt.elternId || "") !== (rec.elternId || "") || !!rec.deleted !== !!alt.deleted;
            if (!darf(r, heikel ? "verwalten" : "schreiben")) throw new Error("Keine Berechtigung für diesen Ordner");
          } else if (rec.elternId) {
            if (!darf(rechtAuf(ich, rec.elternId, O, K), "schreiben")) throw new Error("Keine Berechtigung für den Elternordner");
          } else if (!ich.admin) throw new Error("Oberste Ordner legen nur Admins an");
          if (rec.elternId && !O.has(rec.elternId)) throw new Error("Elternordner gibt es nicht");
          if (rec.zugriff && rec.zugriff.length) {
            /* wer eine Liste setzt, muss danach selbst noch verwalten dürfen */
            const probe = new Map(O); probe.set(rec.id, rec);
            if (!darf(rechtAuf(ich, rec.id, probe, K), "verwalten")) throw new Error("Du würdest dich selbst aussperren – trag dich mit „verwalten“ ein");
          }
          cache = null;
        } else {
          const O = await ordnerMap();
          for (const oid of new Set([alt && alt.ordnerId, rec.ordnerId].filter(Boolean)))
            if (!darf(rechtAuf(ich, oid, O, K), "schreiben")) throw new Error("Keine Berechtigung für diesen Ordner");
        }
      }
      return S.schreiben(art, rec);
    }
  };
}
