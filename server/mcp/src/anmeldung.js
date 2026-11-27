/* Wer ruft an? Zwei Wege:
   1. Zugangsschlüssel (für Dienste wie Nexilo): „Authorization: Bearer irr_…“ – gespeichert wird nur der SHA-256-Hash.
   2. Microsoft-Anmeldung (Mitarbeiter): Zugriffstoken für unsere API (API_AUDIENCE), geprüft gegen die Schlüssel von Microsoft.
   Rechte: „lesen“ oder „schreiben“. Rollen wie in den Apps: Admin/Entwickler, Buero/Büro, sonst Monteur. */
import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { KONFIG } from "./konfig.js";

export const hash = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const gleich = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

let jwks = null;
async function microsoftToken(token) {
  if (!KONFIG.apiAudience || !KONFIG.tenantId) return null;
  jwks ||= createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${KONFIG.tenantId}/discovery/v2.0/keys`));
  const { payload: p } = await jwtVerify(token, jwks, {
    issuer: [`https://login.microsoftonline.com/${KONFIG.tenantId}/v2.0`, `https://sts.windows.net/${KONFIG.tenantId}/`],
    audience: KONFIG.apiAudience
  });
  const rollen = Array.isArray(p.roles) ? p.roles : [];
  const mail = String(p.preferred_username || p.upn || p.email || "").toLowerCase();
  return {
    name: p.name || mail, mail, quelle: "microsoft",
    admin: rollen.includes("Admin") || rollen.includes("Entwickler"),
    buero: rollen.includes("Buero") || rollen.includes("Büro"),
    rechte: "schreiben"
  };
}

/** Liefert die anrufende Person/den Dienst oder null (dann 401). */
export async function anmelden(kopf) {
  const m = /^Bearer\s+(.+)$/i.exec(kopf || "");
  if (!m) return null;
  const token = m[1].trim();
  if (token.startsWith("irr_")) {
    const h = hash(token), k = KONFIG.schluessel.find(x => x && x.hash && gleich(String(x.hash), h));
    return k ? { name: k.name, mail: k.mail || "", quelle: "schluessel", ki: true, admin: false, buero: !!k.buero, rechte: k.rechte === "schreiben" ? "schreiben" : "lesen" } : null;
  }
  try { return await microsoftToken(token); } catch { return null; }
}
