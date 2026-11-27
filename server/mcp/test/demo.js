/* Demo-Server zum Ausprobieren mit Claude – nur Demodaten der Apps, keine echten Kunden.
   npm run demo  → legt ./daten-demo an, erzeugt einen Entwickler-Schlüssel und startet den Server auf Port 8787.
   Von außen erreichbar machen z. B. mit:  cloudflared tunnel --url http://127.0.0.1:8787  */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const hier = path.dirname(fileURLToPath(import.meta.url)), wurzel = path.resolve(hier, ".."), ordner = path.join(wurzel, "daten-demo");
const appDemo = path.resolve(wurzel, "..", "..", "src", "demo.js");
if (!fs.existsSync(path.join(ordner, "kunden"))) {
  const stumm = () => {}, ctx = vm.createContext({ console, Date, Math, JSON, Object, Array, String, Number, Set, Map, addEventListener: stumm, setInterval: stumm, setTimeout: stumm, document: { addEventListener: stumm }, window: {}, IC: {}, localStorage: { getItem: () => null, setItem: stumm } });
  vm.runInContext(fs.readFileSync(appDemo, "utf8").replace(/^(const|let) /gm, "var "), ctx);
  for (const [art, L] of Object.entries(ctx.demoDaten())) if (Array.isArray(L)) for (const r of L) { fs.mkdirSync(path.join(ordner, art), { recursive: true }); fs.writeFileSync(path.join(ordner, art, r.id + ".json"), JSON.stringify(r)); }
}
const keyDatei = path.join(ordner, ".demo-schluessel");
const key = fs.existsSync(keyDatei) ? fs.readFileSync(keyDatei, "utf8").trim() : "irr_demo_" + crypto.randomBytes(18).toString("base64url");
fs.writeFileSync(keyDatei, key);
Object.assign(process.env, { SPEICHER: "datei", DATEI_ORDNER: ordner, SCHLUESSEL_IN_URL: "true", PORT: process.env.PORT || "8787",
  MCP_SCHLUESSEL: JSON.stringify([{ name: "Max (Demo)", hash: crypto.createHash("sha256").update(key).digest("hex"), rechte: "entwickler" }]) });
console.log(`\nDemo-Schlüssel: ${key}\nIn Claude als Konnektor-Adresse:  https://<deine-tunnel-adresse>/mcp/k/${key}\n`);
await import("../src/start.js");
