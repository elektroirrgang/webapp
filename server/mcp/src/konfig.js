/* Einstellungen kommen aus Umgebungsvariablen oder einer Datei „.env“ neben package.json (nie ins Repo – steht in .gitignore).
   Vorlage: .env.beispiel */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envDatei = path.join(wurzel, ".env");
if (fs.existsSync(envDatei)) {
  for (const zeile of fs.readFileSync(envDatei, "utf8").split(/\r?\n/)) {
    const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
const e = (k, std = "") => (process.env[k] ?? std).trim();

export const KONFIG = {
  wurzel,
  port: +e("PORT", "8787"),
  host: e("HOST", "127.0.0.1"),            // nur lokal; von außen kommt man über den Tunnel
  speicher: e("SPEICHER", "datei"),          // datei | sharepoint | sqlserver
  dateiOrdner: e("DATEI_ORDNER", path.join(wurzel, "daten")),
  /* Microsoft-Anmeldung (gleiche Firma wie die Apps) */
  tenantId: e("TENANT_ID", "b54e9ff3-72c8-45ce-8ae1-a2713c4998de"),
  apiAudience: e("API_AUDIENCE"),            // z. B. api://<App-ID> – leer = Microsoft-Token werden nicht angenommen
  /* SharePoint (heutiger Speicher der Apps) – App-Anmeldung mit Sites.Selected */
  spClientId: e("SP_CLIENT_ID"),
  spClientSecret: e("SP_CLIENT_SECRET"),
  spSite: e("SP_SITE", "https://elektroirrgang.sharepoint.com/sites/ElektroIrrgangApps"),
  spDatenOrdner: e("SP_DATEN_ORDNER", "_App-Daten"),
  /* SQL Server (Ziel) */
  sql: {
    server: e("SQL_SERVER", "localhost"),
    instanz: e("SQL_INSTANZ"),
    datenbank: e("SQL_DATENBANK", "IrrgangApps"),
    benutzer: e("SQL_BENUTZER"),
    passwort: e("SQL_PASSWORT"),
    verschluesseln: e("SQL_VERSCHLUESSELN", "true") === "true",
    zertifikatVertrauen: e("SQL_ZERTIFIKAT_VERTRAUEN", "true") === "true"
  },
  /* Zugangsschlüssel für Dienste wie Nexilo: JSON-Liste [{"name":"Nexilo","hash":"<sha256>","rechte":"schreiben"}]
     Schlüssel erzeugen: npm run schluessel -- "Nexilo" schreiben */
  /* Nur zum Testen mit Demodaten: Schlüssel in der Adresse (…/mcp/k/<Schlüssel>), weil die Claude-App keine eigenen Kopfzeilen kann.
     Für echte Daten AUS lassen – dann Microsoft-Anmeldung. */
  schluesselInUrl: e("SCHLUESSEL_IN_URL", "false") === "true",
  schluessel: (() => { try { return JSON.parse(e("MCP_SCHLUESSEL", "[]")); } catch { return []; } })()
};
