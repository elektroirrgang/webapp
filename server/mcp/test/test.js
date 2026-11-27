/* Test mit den Demodaten der Apps (src/demo.js) – keine echten Kundendaten.
   Startet den Server mit Datei-Speicher, ruft die Werkzeuge über einen echten MCP-Client auf. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const hier = path.dirname(fileURLToPath(import.meta.url)), ordner = path.join(hier, "_daten");
const repo = path.resolve(hier, "..", "..", "..");
let fehler = 0; const ok = (b, t) => { console.log(`${b ? "OK  " : "FEHLER"} ${t}`); if (!b) fehler++; };

/* 1) Demodaten aus der App erzeugen */
fs.rmSync(ordner, { recursive: true, force: true });
const stumm = () => {}, ctx = vm.createContext({ console, Date, Math, JSON, Object, Array, String, Number, Set, Map, addEventListener: stumm, setInterval: stumm, setTimeout: stumm, document: { addEventListener: stumm }, window: {}, IC: {}, localStorage: { getItem: () => null, setItem: stumm } });
vm.runInContext(fs.readFileSync(path.join(repo, "src", "demo.js"), "utf8").replace(/^(const|let) /gm, "var "), ctx);
const D = ctx.demoDaten();
let n = 0;
for (const [art, liste] of Object.entries(D)) if (Array.isArray(liste)) for (const r of liste) {
  fs.mkdirSync(path.join(ordner, art), { recursive: true }); fs.writeFileSync(path.join(ordner, art, r.id + ".json"), JSON.stringify(r)); n++; }
fs.mkdirSync(path.join(ordner, "handbuch"), { recursive: true });
fs.writeFileSync(path.join(ordner, "handbuch", "hb-test.json"), JSON.stringify({ id: "hb-test", kapitel: "allgemein", titel: "Kaffee und Getränke", inhalt: "Getränke sind frei.\n?? interner Hinweis", stand: 1, updated: Date.now() }));
ok(n > 30, `${n} Demodatensätze angelegt`);

/* 2) Server starten */
const schl = "irr_test_" + crypto.randomBytes(8).toString("hex"), lese = "irr_lese_" + crypto.randomBytes(8).toString("hex");
const h = s => crypto.createHash("sha256").update(s).digest("hex");
const port = 8799;
const srv = spawn(process.execPath, [path.join(hier, "..", "src", "start.js")], { env: { ...process.env, PORT: String(port), SPEICHER: "datei", DATEI_ORDNER: ordner,
  MCP_SCHLUESSEL: JSON.stringify([{ name: "Test-KI", hash: h(schl), rechte: "schreiben" }, { name: "Nur-Lesen", hash: h(lese), rechte: "lesen" }]) }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise(r => srv.stdout.once("data", r));
const url = new URL(`http://127.0.0.1:${port}/mcp`);
const verbinden = async key => { const c = new Client({ name: "test", version: "1" }); await c.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { Authorization: "Bearer " + key } } })); return c; };
const text = r => r.content.map(x => x.text).join("");
try {
  const ohne = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  ok(ohne.status === 401, "ohne Schlüssel → 401");
  const falsch = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer irr_falsch" }, body: "{}" });
  ok(falsch.status === 401, "falscher Schlüssel → 401");

  const c = await verbinden(schl);
  const W = (await c.listTools()).tools.map(t => t.name);
  ok(W.length >= 17, `${W.length} Werkzeuge: ${W.join(", ")}`);
  const lage = await c.callTool({ name: "lage_heute", arguments: {} }); ok(/vorgaenge_offen/.test(text(lage)), "lage_heute");
  const ks = await c.callTool({ name: "kunden_suchen", arguments: { text: "bergland" } }); ok(/Autohaus Bergland/.test(text(ks)), "kunden_suchen findet Bergland");
  const kl = await c.callTool({ name: "kunde_lesen", arguments: { kunde_id: "demo-k2" } }); ok(/Ladeinfrastruktur Werkstatt/.test(text(kl)) && /Werkstatt/.test(text(kl)), "kunde_lesen mit Baustellen und Standorten");
  const vg = await c.callTool({ name: "vorgaenge_auflisten", arguments: {} }); ok(/Notbeleuchtung/.test(text(vg)), "vorgaenge_auflisten");
  const fr = await c.callTool({ name: "pruefungen_faellig", arguments: { tage: 60 } }); ok(/ueberfaellig": true/.test(text(fr)), "pruefungen_faellig mit überfälligen");
  const hb = await c.callTool({ name: "handbuch_artikel_lesen", arguments: { artikel_id: "hb-test" } }); ok(/frei/.test(text(hb)) && !/interner Hinweis/.test(text(hb)), "Handbuch ohne „noch offen“-Zeilen");
  const neu = await c.callTool({ name: "vorgang_anlegen", arguments: { kunde_id: "demo-k3", anliegen: "Steckdose in Halle 2 defekt", dringend: true } });
  const id = JSON.parse(text(neu).split("\n\n").pop()).id; const rec = JSON.parse(fs.readFileSync(path.join(ordner, "vorgaenge", id + ".json"), "utf8"));
  ok(rec.kundeId === "demo-k3" && rec.s.anruf && rec.createdBy.name === "Test-KI (KI)" && rec.quelle === "mcp", "vorgang_anlegen schreibt App-Format");
  const ts = await c.callTool({ name: "tagesstand_anlegen", arguments: { baustelle_id: "demo-b1", stand: "Steckdosen im EG gesetzt", offen: "Bad" } }); ok(!ts.isError, "tagesstand_anlegen");
  const ma = await c.callTool({ name: "material_anfordern", arguments: { positionen: [{ text: "NYM-J 3×1,5", menge: 50, einheit: "m" }] } }); ok(!ma.isError, "material_anfordern");
  const fx = await c.callTool({ name: "kunde_lesen", arguments: { kunde_id: "../../etc" } }); ok(fx.isError, "ungültige ID wird abgewiesen");
  const prot = fs.readFileSync(path.join(ordner, "mcp-protokoll.jsonl"), "utf8").trim().split("\n"); ok(prot.length === 3, `Protokoll hat ${prot.length} Einträge`);
  await c.close();

  const l = await verbinden(lese); const LW = (await l.listTools()).tools.map(t => t.name);
  ok(!LW.includes("vorgang_anlegen") && LW.includes("kunden_suchen"), "Nur-Lesen-Schlüssel sieht keine Schreib-Werkzeuge");
  await l.close();
} finally { srv.kill(); }
console.log(fehler ? `\n${fehler} Fehler` : "\nAlles grün"); process.exit(fehler ? 1 : 0);
