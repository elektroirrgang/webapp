# KI für die Irrgang-Apps

Die Apps sind vorbereitet (`src/ki.js`). Ohne Zugang bleibt alles wie bisher. Eingeschaltet wird in der **Übersicht › Einstellungen › KI** (nur Admin).

Was die KI dann kann:
- **Gebäudetechnik › Liste einfügen › Foto:** Verteiler fotografieren, die KI schreibt die Stromkreisliste (danach „Prüfen“ wie gewohnt).
- **Gebäudetechnik › Diktieren:** das Gesprochene wertet die KI aus statt der festen Regeln (Regeln bleiben als Rückfall).
- **Baustelle › Übergabe › Erzählen:** frei erzählen, die KI füllt Stand, Offen und Material.

## Weg 1: Azure OpenAI (Microsoft)

1. Im Azure-Portal eine Ressource **Azure OpenAI** anlegen und ein Modell mit Bildverständnis bereitstellen (z. B. `gpt-4o`). Den **Deployment-Namen** und den **Endpunkt** (`https://<name>.openai.azure.com`) notieren.
2. In der Ressource unter *Zugriffssteuerung (IAM)* den Mitarbeitern (am besten einer Gruppe) die Rolle **Cognitive Services OpenAI User** geben.
3. In der App-Registrierung der Irrgang-Apps unter *API-Berechtigungen* **Azure Cognitive Services › user_impersonation** hinzufügen und die Administratorzustimmung erteilen.
4. Unter *Netzwerk/CORS* der Ressource `https://webapp.elektro-irrgang.de` erlauben, falls der Browser sonst blockiert.
5. In der Übersicht › Einstellungen › KI: Anbieter „Azure OpenAI“, Endpunkt und Deployment eintragen, „Speichern und einschalten“, dann „KI verbinden“ und „Verbindung testen“.

Kein Schlüssel in der App: Jeder meldet sich mit seinem Microsoft-Konto an.

## Weg 2: Eigener Server (Cloudflare Worker, Vorlage `ki-worker.js`)

1. Bei Cloudflare einen Worker anlegen und `ki-worker.js` einfügen.
2. Geheimnisse setzen: `ANTHROPIC_API_KEY` (Schlüssel des KI-Anbieters), `ERLAUBTE_DOMAIN` = `elektro-irrgang.de`, optional `KI_MODELL`.
3. In der Übersicht › Einstellungen › KI: Anbieter „Eigener Server“, Adresse des Workers eintragen, einschalten, testen.

Der Worker prüft bei jeder Anfrage das Microsoft-Token (nur Firmenkonten) und gibt den Schlüssel nie heraus.

## Datenschutz

Fotos und Texte gehen an den KI-Anbieter. Vor dem Einschalten mit dem Chef klären: Anbieter, Serverstandort (bei Azure EU-Region wählbar), Vertrag zur Auftragsverarbeitung. Keine Kundennamen diktieren, wenn es nicht nötig ist.
