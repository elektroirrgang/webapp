/* KI-Server für die Irrgang-Apps (Vorlage, Cloudflare Worker) – Weg 2 aus src/ki.js („Eigener Server“).
   Hält den Schlüssel des KI-Anbieters geheim und lässt nur angemeldete Mitarbeiter durch:
   Die App schickt ihr Microsoft-Token mit, der Worker fragt Microsoft Graph /me und prüft die Firmen-Domain.
   Geheimnisse/Einstellungen (wrangler secret put …):
     ANTHROPIC_API_KEY  Schlüssel des KI-Anbieters (hier: Anthropic Claude)
     ERLAUBTE_DOMAIN    z. B. elektro-irrgang.de
     KI_MODELL          optional, Modellname (Standard unten)
   Anfrage der App: POST {system, text, bilder:[data:image/jpeg;base64,…], json, maxTokens}  →  Antwort: {text} */
const HERKUNFT = "https://webapp.elektro-irrgang.de";
const cors = { "Access-Control-Allow-Origin": HERKUNFT, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const antwort = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return antwort({ error: "Nur POST" }, 405);
    /* 1. Wer fragt? Microsoft entscheidet, ob das Token echt ist */
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return antwort({ error: "Nicht angemeldet" }, 401);
    const me = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", { headers: { Authorization: auth } });
    if (!me.ok) return antwort({ error: "Anmeldung ungültig" }, 401);
    const u = await me.json(), mail = String(u.mail || u.userPrincipalName || "").toLowerCase();
    if (!mail.endsWith("@" + String(env.ERLAUBTE_DOMAIN || "elektro-irrgang.de").toLowerCase())) return antwort({ error: "Kein Zugriff" }, 403);
    /* 2. Anfrage prüfen und begrenzen */
    let b; try { b = await req.json(); } catch (e) { return antwort({ error: "Ungültige Anfrage" }, 400); }
    const bilder = (Array.isArray(b.bilder) ? b.bilder : []).slice(0, 4);
    if (JSON.stringify(b).length > 8e6) return antwort({ error: "Anfrage zu groß" }, 413);
    const inhalt = [
      ...bilder.map(u => { const m = String(u).match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/); return m ? { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } } : null; }).filter(Boolean),
      { type: "text", text: String(b.text || "").slice(0, 20000) + (b.json ? "\n\nAntworte ausschließlich mit gültigem JSON." : "") }
    ];
    /* 3. An den KI-Anbieter weitergeben */
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: b.modell || env.KI_MODELL || "claude-sonnet-5-5", max_tokens: Math.min(+b.maxTokens || 2500, 4000), system: String(b.system || ""), messages: [{ role: "user", content: inhalt }] })
    });
    if (!r.ok) return antwort({ error: `KI-Anbieter meldet ${r.status}` }, 502);
    const j = await r.json();
    return antwort({ text: (j.content || []).filter(x => x.type === "text").map(x => x.text).join("\n") });
  }
};
