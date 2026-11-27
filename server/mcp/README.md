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

## Werkzeuge (Stand 0.3)

| Lesen | Schreiben (nur mit Recht „schreiben“) |
|---|---|
| `lage_heute` – offene Vorgänge, aktive Baustellen, Termine, fällige Prüfungen | `vorgang_anlegen` – neuer Vorgang (Stufe Anruf) |
| `kunden_suchen`, `kunde_lesen` | `vorgang_notiz` – Notiz an Vorgang |
| `vorgaenge_auflisten`, `vorgang_lesen` | `tagesstand_anlegen` – Übergabe zu einer Baustelle |
| `baustellen_auflisten`, `baustelle_lesen` | `material_anfordern` |
| `pruefungen_faellig` (Ladeeinrichtungen, Maschinen/Anlagen) | `termin_anlegen` – Firmentermin |
| `handbuch_suchen`, `handbuch_artikel_lesen` | `handbuch_vorschlag` – gilt erst nach Freigabe in der App |
| `termine_auflisten`, `material_anforderungen` | `ordner_anlegen`, `ordner_zugriff_setzen` |
| `ordner_auflisten`, `ordner_inhalt` | |

Für Dienste wie Nexilo **bewusst nicht dabei:** Löschen, freies Ändern beliebiger Datensätze, Prüfprotokolle verändern.
Jede Änderung steht im Datensatz (`updatedBy` = Name + „(KI)“, `quelle: "mcp"`) und im MCP-Protokoll.

### Ordner mit Zugriffsrechten (seit 0.3, Vorbereitung für die eigene Datenbank)

Für Firmensachen, die nur bestimmte Personen sehen dürfen – z. B. „Firma“ (Logos, Verträge) nur für Joachim und Max.
Datenarten wie in den Apps: `ordner` `{ id, name, elternId?, zugriff?: [{ wer, recht }] }`, Dateien bekommen `ordnerId`.

- `wer`: Mail-Adresse, `rolle:admin`, `rolle:buero`, `rolle:monteur`, `dienst:<Schlüsselname>` (z. B. Nexilo) oder `alle`
- `recht`: `lesen` < `schreiben` < `verwalten` (Rechte ändern, verschieben, löschen)
- Ohne eigene Liste erbt ein Ordner vom Elternordner; oberste Ordner ohne Liste sind für alle Mitarbeiter.
- Hat ein Ordner eine Liste, gilt **nur** sie – auch Admins und Entwickler ohne Eintrag sehen ihn nicht.
  Jede Liste braucht mindestens einen Eintrag mit `verwalten`; sich selbst aussperren geht nicht.
- Durchgesetzt im Server (`src/zugriff.js`, Hülle um den Speicher) – für alle Werkzeuge, auch `dev_…` und die Suche über alles.
- **Keine Kennwörter für Ordner:** ein Kennwort versteckt nur die Anzeige; die Rechte hängen an der Anmeldung.
- Noch offen: Dateiinhalt selbst (heute in SharePoint; auf dem Firmenserver als Datei auf der Platte + Eintrag in der Datenbank),
  Anzeige in der Bibliothek der Apps, Ordnernamen im MCP-Protokoll (für Entwickler sichtbar).

### Entwickler-Werkzeuge (nur Recht „entwickler“)

Für die Arbeit an den Apps mit Claude: alles sehen, Fehler finden, reparieren – nichts geht verloren.

| Werkzeug | Wofür |
|---|---|
| `dev_datenarten` | alle Datenarten mit Anzahl aktiv/gelöscht und letzter Änderung |
| `dev_felder` | Aufbau einer Datenart aus den echten Daten (Felder, Typen, Häufigkeit, Beispiel) |
| `dev_abfragen` | Bedingungen auf Felder (`a.naechste kleiner 2026-12-31`), Volltext, Sortierung, nur bestimmte Felder, Anzahl |
| `dev_lesen` | Datensatz roh, auch gelöschte |
| `dev_suche_alles` | ein Begriff über alle Datenarten (Auftragsnummer, Name, ID) |
| `dev_pruefen` | Datenqualität: Verweise ins Leere, doppelte Kunden, fehlende id/updated |
| `dev_aendern` | Felder setzen/entfernen (Pfade mit Punkt), Grund ist Pflicht |
| `dev_anlegen` | Datensatz in beliebiger Datenart |
| `dev_loeschen` | nur `deleted: true` wie in den Apps – wiederherstellbar |
| `dev_rueckgaengig` | holt die Fassung aus der Sicherung zurück (auch Anlegen/Löschen) |
| `dev_protokoll` | wer hat wann was über MCP geändert |

Vor jeder Änderung wird die alte Fassung in `mcp_sicherung` abgelegt. Geänderte Datensätze bekommen ein neues
`updated`, damit die Apps sie beim nächsten Abgleich übernehmen.

### Mit Claude verbinden (Entwickler)

Schlüssel erzeugen: `npm run schluessel -- "Max" entwickler`. Dann in **Claude Code**:

```
claude mcp add --transport http irrgang https://mcp.elektro-irrgang.de/mcp --header "Authorization: Bearer irr_…"
```

> Datenschutz: Was Claude über MCP abfragt, geht an Anthropic (USA). Für Firmen- und Kundendaten vorher mit
> Joachim klären und ein Geschäftskonto mit Auftragsverarbeitungsvertrag nutzen.

## Sicherheit

- Der Server lauscht nur auf `127.0.0.1`. Von außen geht es ausschließlich über den **Cloudflare Tunnel** (kein offener Port am Router).
- Zugang nur mit **Schlüssel** (`Authorization: Bearer irr_…`) oder **Microsoft-Token** der Firma.
  In `.env` stehen nur SHA-256-Hashes der Schlüssel.
- Jeder Schlüssel hat „lesen“, „schreiben“ oder „entwickler“. Werkzeuge außerhalb der eigenen Rechte sind gar nicht sichtbar.
- Microsoft-Anmeldung: Rolle Admin/Entwickler → „entwickler“, alle anderen → „schreiben“.
- Ordner mit Zugriffsliste sieht nur, wer drinsteht (siehe oben) – unabhängig von „entwickler“.
- Keine Geheimnisse im Repo: `.env` steht in `.gitignore`.

## Einrichten auf dem Windows-Server (Kurzfassung)

> Vorher: Freigabe von Joachim, dass auf dem Firmenserver installiert werden darf. Die SCC-Datenbank wird **nicht** angefasst.

1. **Node.js 22 LTS** installieren (nodejs.org, Windows-Installer).
2. Diesen Ordner nach `C:\Irrgang\mcp` kopieren, dort `npm install --omit=dev` ausführen.
3. `.env.beispiel` nach `.env` kopieren und ausfüllen.
4. Schlüssel erzeugen: `npm run schluessel -- "Nexilo" schreiben` bzw. `npm run schluessel -- "Max" entwickler` – Hash in `.env`, Schlüssel an Nexilo bzw. in Claude.
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
