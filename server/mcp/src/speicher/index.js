import { KONFIG } from "../konfig.js";
import { dateiSpeicher } from "./datei.js";

export async function speicherOeffnen() {
  if (KONFIG.speicher === "sqlserver") return (await import("./sqlserver.js")).sqlSpeicher();
  if (KONFIG.speicher === "sharepoint") return (await import("./sharepoint.js")).sharepointSpeicher();
  return dateiSpeicher(KONFIG.dateiOrdner);
}
