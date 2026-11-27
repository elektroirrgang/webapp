/* Irrgang MCP-Server – Start.
   Endpunkte:  POST /mcp   (MCP, Streamable HTTP, zustandslos: jede Anfrage bringt ihren Schlüssel/Token mit)
               GET  /gesund (läuft er? – ohne Anmeldung, ohne Daten)
   Läuft nur auf 127.0.0.1; von außen erreichbar über den Cloudflare Tunnel (siehe README). */
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { KONFIG } from "./konfig.js";
import { anmelden } from "./anmeldung.js";
import { speicherOeffnen } from "./speicher/index.js";
import { werkzeugeAnmelden } from "./werkzeuge.js";
import { entwicklerWerkzeuge } from "./entwickler.js";

const VERSION = "0.2.0";
const S = await speicherOeffnen();

function json(res, code, obj, kopf = {}) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", ...kopf }); res.end(JSON.stringify(obj)); }
async function koerper(req) {
  const teile = []; let n = 0;
  for await (const t of req) { n += t.length; if (n > 2_000_000) throw Object.assign(new Error("zu groß"), { code: 413 }); teile.push(t); }
  const s = Buffer.concat(teile).toString("utf8"); return s ? JSON.parse(s) : undefined;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/gesund") return json(res, 200, { ok: true, version: VERSION, speicher: S.name });
    let kopf = req.headers.authorization;
    const km = /^\/mcp\/k\/(irr_[\w-]+)$/.exec(url.pathname);
    if (km && KONFIG.schluesselInUrl) kopf = "Bearer " + km[1];
    else if (url.pathname !== "/mcp") return json(res, 404, { fehler: "Nicht gefunden" });
    if (req.method !== "POST") return json(res, 405, { jsonrpc: "2.0", error: { code: -32000, message: "Nur POST (zustandsloser Server)" }, id: null }, { Allow: "POST" });
    const ich = await anmelden(kopf);
    if (!ich) return json(res, 401, { fehler: "Nicht angemeldet" }, { "WWW-Authenticate": 'Bearer realm="irrgang-mcp"' });
    const body = await koerper(req);
    const mcp = new McpServer({ name: "irrgang", title: "Elektro Irrgang", version: VERSION },
      { instructions: "Daten der Irrgang-Apps (Elektro Irrgang, Waldbröl): Kunden, Vorgänge, Baustellen mit Tagesständen, Prüffristen, Betriebshandbuch, Firmentermine, Materialanforderungen. Antworte auf Deutsch. Vor dem Schreiben kurz zusammenfassen, was angelegt wird. Kundendaten nur für die Arbeit verwenden. Entwickler-Werkzeuge (dev_…): vor Änderungen mit dev_felder/dev_lesen den Aufbau prüfen, Änderungen klein halten, Sicherungs-ID nennen." });
    werkzeugeAnmelden(mcp, S, ich);
    entwicklerWerkzeuge(mcp, S, ich);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close(); mcp.close(); });
    await mcp.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (e) {
    if (!res.headersSent) json(res, e.code === 413 ? 413 : 400, { jsonrpc: "2.0", error: { code: -32700, message: e.code === 413 ? "Anfrage zu groß" : "Ungültige Anfrage" }, id: null });
    console.error(new Date().toISOString(), e.message);
  }
});
server.listen(KONFIG.port, KONFIG.host, () => console.log(`Irrgang MCP ${VERSION} läuft auf http://${KONFIG.host}:${KONFIG.port}/mcp – Speicher: ${S.name}`));
