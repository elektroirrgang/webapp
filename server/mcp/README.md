# Irrgang MCP-Server

Damit eine KI (z. B. **Nexilo**) in den Irrgang-Apps lesen und schreiben kann – über den offenen Standard
**MCP** (Model Context Protocol). Jede KI, die MCP spricht, kann andocken; ihr hängt an keinem Anbieter.

```
KI (Nexilo …) ──MCP──► Irrgang MCP-Server ──► Speicher
                         (dieser Ordner)       heute: SharePoint (dieselben Daten wie die Apps)
                                               Ziel:  eigene SQL-Server-Datenbank auf dem Firmenserver
```

Der Speicher ist austauschbar (`SPEICHER=` in `.env`). Die Werkzeuge bleiben gleich, wenn die Apps später
von SharePoint auf den SQL Server umziehen.

## Werkzeuge (Stand 0.1)

| Lesen | Schreiben (nur mit Recht „schreiben“) |
|---|---|
| `lage_heute` – offene Vorgänge, aktive Baustellen, Termine, fällige Prüfungen | `vorgang_anlegen` – neuer Vorgang (Stufe Anruf) |
| `kunden_suchen`, `kunde_lesen` | `vorgang_notiz` – Notiz an Vorgang |
| `vorgaenge_auflisten`, `vorgang_lesen` | `tagesstand_anlegen` – Übergabe zu einer Baustelle |
| `baustellen_auflisten`, `baustelle_lesen` | `material_anfordern` |
| `pruefungen_faellig` (Ladeeinrichtungen, Maschinen/Anlagen) | `termin_anlegen` – Firmentermin |
| `handbuch_suchen`, `handbuch_artikel_lesen` | `handbuch_vorschlag` – gilt erst nach Freigabe in der App |
| `termine_auflisten`, `material_anforderungen` | |

**Bewusst nicht dabei:** Löschen, freies Ändern beliebiger Datensätze, Prüfprotokolle verändern.
Jede Änderung steht im Datensatz (`updatedBy` = Name + „(KI)“, `quelle: "mcp"`) und im MCP-Protokoll.

## Sicherheit

- Der Server lauscht nur auf `127.0.0.1`. Von außen geht es ausschließlich über den **Cloudflare Tunnel** (kein offener Port am Router).
- Zugang nur mit **Schlüssel** (`Authorization: Bearer irr_…`) oder **Microsoft-Token** der Firma.
  In `.env` stehen nur SHA-256-Hashes der Schlüssel.
- Jeder Schlüssel hat entweder „lesen“ oder „schreiben“. Ein Lese-Schlüssel sieht die Schreib-Werkzeuge gar nicht.
- Keine Geheimnisse im Repo: `.env` steht in `.gitignore`.

## Einrichten auf dem Windows-Server (Kurzfassung)

> Vorher: Freigabe von Joachim, dass auf dem Firmenserver installiert werden darf. Die SCC-Datenbank wird **nicht** angefasst.

1. **Node.js 22 LTS** installieren (nodejs.org, Windows-Installer).
2. Diesen Ordner nach `C:\Irrgang\mcp` kopieren, dort `npm install --omit=dev` ausführen.
3. `.env.beispiel` nach `.env` kopieren und ausfüllen.
4. Schlüssel für Nexilo erzeugen: `npm run schluessel -- "Nexilo" schreiben` – Hash in `.env`, Schlüssel an Nexilo.
5. Testlauf: `npm start` → im Browser `http://127.0.0.1:8787/gesund` muss `{"ok":true…}` zeigen.
6. Als Windows-Dienst einrichten (startet nach Neustart von selbst), z. B. mit NSSM: `nssm install IrrgangMCP "C:\Program Files\nodejs\node.exe" "C:\Irrgang\mcp\src\start.js"`.
7. Cloudflare Tunnel: `mcp.elektro-irrgang.de` → `http://127.0.0.1:8787`.

### Speicher SharePoint (sofort nutzbar)
App-Registrierung in Microsoft Entra mit **Anwendungsberechtigung `Sites.Selected`**, danach dieser App nur für die
Website *ElektroIrrgangApps* Lese-/Schreibrecht geben. Client-ID und Geheimnis in `.env`.

### Speicher SQL Server (Ziel)
Eigene Datenbank `IrrgangApps` und eigener SQL-Benutzer mit Rechten **nur** auf diese Datenbank.
Tabellen legt der Server beim ersten Start selbst an (`dbo.datensatz`, `dbo.mcp_protokoll`).

## Test

`npm test` – startet den Server mit den Demodaten der Apps (keine echten Kundendaten) und ruft alle wichtigen
Werkzeuge über einen echten MCP-Client auf.
