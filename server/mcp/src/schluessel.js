/* Neuen Zugangsschlüssel erzeugen:  npm run schluessel -- "Nexilo" schreiben
   Den Schlüssel bekommt der Dienst (einmal anzeigen, nirgends speichern). In .env kommt nur die Zeile mit dem Hash. */
import crypto from "node:crypto";
import { hash } from "./anmeldung.js";

const name = process.argv[2] || "Dienst", rechte = process.argv[3] === "schreiben" ? "schreiben" : "lesen";
const schluessel = "irr_" + crypto.randomBytes(32).toString("base64url");
console.log(`\nSchlüssel für ${name} (${rechte}) – nur jetzt sichtbar, direkt an den Dienst geben:\n\n  ${schluessel}\n`);
console.log(`In .env bei MCP_SCHLUESSEL in die Liste aufnehmen:\n\n  ${JSON.stringify({ name, hash: hash(schluessel), rechte })}\n`);
