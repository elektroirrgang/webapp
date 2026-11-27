/* Speicher in einem Ordner – gleicher Aufbau wie heute in SharePoint: <Ordner>/<Datenart>/<id>.json.
   Für Tests und zum Ausprobieren; im Betrieb SharePoint (jetzt) oder SQL Server (Ziel). */
import fs from "node:fs/promises";
import path from "node:path";

const sicher = s => /^[\w.-]{1,120}$/.test(String(s));

export function dateiSpeicher(ordner) {
  const pfad = (art, id) => path.join(ordner, art, `${id}.json`);
  return {
    name: "datei",
    async alle(art) {
      if (!sicher(art)) return [];
      let namen = [];
      try { namen = await fs.readdir(path.join(ordner, art)); } catch { return []; }
      const out = [];
      for (const n of namen) if (n.endsWith(".json")) {
        try { const r = JSON.parse(await fs.readFile(path.join(ordner, art, n), "utf8")); if (r && !r.deleted) out.push(r); } catch { /* kaputte Datei überspringen */ }
      }
      return out;
    },
    async lesen(art, id) {
      if (!sicher(art) || !sicher(id)) return null;
      try { const r = JSON.parse(await fs.readFile(pfad(art, id), "utf8")); return r && !r.deleted ? r : null; } catch { return null; }
    },
    async schreiben(art, rec) {
      if (!sicher(art) || !sicher(rec.id)) throw new Error("Ungültige Datenart oder ID");
      await fs.mkdir(path.join(ordner, art), { recursive: true });
      const p = pfad(art, rec.id), tmp = p + ".tmp";
      await fs.writeFile(tmp, JSON.stringify(rec), "utf8"); await fs.rename(tmp, p);
      return rec;
    },
    async protokoll(e) {
      await fs.mkdir(ordner, { recursive: true });
      await fs.appendFile(path.join(ordner, "mcp-protokoll.jsonl"), JSON.stringify(e) + "\n", "utf8");
    }
  };
}
