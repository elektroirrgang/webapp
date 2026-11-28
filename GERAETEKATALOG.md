# Geräte im Verteiler

## Bestücken (ab 1.11.4)

Ein Fenster für alles: Tabs **Reihen, Automaten, RCD, FI/LS, Sonstiges** (Artikel aus der Firmen-Materialliste) und **Katalog** (alle Katalog-Geräte). Oben filtert die Herstellerzeile (im Katalog-Tab zusätzlich die Gerätegruppe). Eine Kachel antippen wählt sie aus, jedes weitere Antippen zählt hoch; unten stehen Anzahl (− / +) und „Einsetzen“. Mehrere Automaten bekommen die Bezeichnung „?“, die Wofür-Frage kommt nur bei genau einem.

Artikel aus der Materialliste zeigen das Katalogbild nur, wenn Modell und Aufdruck genau stimmen (`gkMatAsset` in `src/geraetekatalog.js`): Katalogeintrag mit der Artikelnummer als `article` oder `model`, sonst die Liste `GK_MAT_SERIE` (Serienbilder, deren Aufdruck genau ein Artikel ist, z. B. MBS-Bild = MBS116). Alles andere behält das bisherige Bild. Nachgereichte Varianten mit der vollen Artikelnummer als Modell oder Artikel werden automatisch zugeordnet – in Auswahl, Verteilerzeichnung und Materialübersicht.

Im Bestückungsdialog **Gerät → Gerätekatalog** öffnen. 2.184 Varianten lassen sich nach Hersteller, Kategorie und Text filtern. Die Liste lädt zunächst 48 Vorschauen; „Weitere anzeigen“ ergänzt die nächsten. Eine Kachel setzt das Gerät ein. In der Verteilerzeichnung öffnet Antippen die Produktansicht; dort sind Beschriftung und Austausch erreichbar.

## Maße und Speicherung

Die Breite stammt aus den Millimetermaßen des Katalogs. Eine 6,2-mm-Klemme wird beispielsweise im 18-mm-Raster mit 0,3444 TE platziert. Die Berechnung bleibt ungerundet, nur die Anzeige wird gekürzt. Die Gerätehöhe wird proportional erhalten; der vorhandene Frontbezug richtet die Bilder aus. Der Frontbezug aus einer Basisgrafik ist kein zusätzlich verifizierter mechanischer Montageanker. Hohe Teile erhalten in der Reihenansicht entsprechend mehr Platz.

Jede platzierte Instanz speichert unter `katalog` Asset-ID, Hersteller, Modell, bestätigte Artikelnummer (falls vorhanden), Millimetermaße und ein eingebettetes Bild. Das schützt bereits angelegte Verteiler vor späteren Änderungen am Bildbestand und ermöglicht die Darstellung ohne erneuten Download. Die Beschriftung bleibt in den bisherigen Feldern der Legende. Die Grundgrafik wird nicht verändert. Kopien erhalten eigene Instanz-IDs und unabhängige bearbeitbare Projektdaten. Ein eingebettetes Bild benötigt zusätzlichen Platz in Gerätespeicher, Sicherung und Abgleich.

`sourceModelId` im Bildindex ist eine interne Nummer der Basisdaten, keine Hersteller-Artikelnummer. Herkunft und Quellen bleiben unter `provenance` erhalten. Herkunft (u. a. Electromarker, Nutzung per E-Mail erlaubt) und Ablage stehen in `src/katalog/NUTZUNG.md`.

## Klemmblöcke, Beschriftungen und Brücken

Im Katalog **Klemmblock planen** wählen. Das dynamische Profil umfasst zunächst WAGO **2004-1201** und Zweifach-Brücken **2004-402**. Weitere Klemmenbilder sind im Katalog vorhanden; daraus folgt keine automatische Brückenkompatibilität.

- Klemmen hinzufügen, einzeln beschriften oder nummerieren. „Fest“ schützt eine manuelle Beschriftung vor dem Nummerieren.
- Netz-ID und gegebenenfalls RCD-Gruppe je Klemme ausdrücklich eintragen. Gleiche sichtbare Texte erzeugen keine elektrische Verbindung.
- Zwei direkt benachbarte Klemmen und denselben Brückenschacht A oder B auswählen. Jede Brücke bleibt ein eigenes Objekt und lässt sich einzeln entfernen.
- Unterschiedliche Netze/RCD-Gruppen, unpassende Artikel, falsches Raster und doppelt belegte Schächte werden zurückgewiesen.
- Rückgängig/Wiederholen gelten während des Bearbeitens. Beim Entfernen einer Klemme werden ihre Brücken entfernt. Beim Kopieren werden keine Kontakte auf die neue Klemme übertragen.
- „Übernehmen“ speichert `klemmenProjekt` zusammen mit der gerenderten Darstellung. Erneutes Antippen des Blocks öffnet „Klemmen und Brücken“. SVG-Export und Vorschau benutzen dieselbe Layoutfunktion.

Das Profil ist eine visuelle Planungsvorlage mit aus der Zeichnung abgeleiteten Schachtkoordinaten. Mehrpolige, überspringende oder beliebige andere Brücken sowie N-Trennschieber sind damit nicht automatisch freigegeben. Weitere Profile müssen mit konkretem Artikel, Etagen, Kontaktbelegung und Herstellerunterlagen ergänzt werden.

## Quellen, Build und Prüfung

- `src/katalog/index.json`: stabile Asset-IDs, Maße, Variantenparameter, Herkunft und SHA-256 je Bild.
- Bilder: **nicht im Projekt** und nicht öffentlich. Sie liegen im SharePoint unter `_App/Bilder` als `katalog~assets~<id>.<endung>` und werden über `../bilder/katalog/assets/…` wie die Produktbilder geladen (nur nach der Anmeldung). Hochladen: Gebäudetechnik › Einstellungen › Labor › „Gerätekatalog-Bilder hochladen“, Ordner „Katalog“ wählen – Zuordnung über SHA-256. Herkunft und Erlaubnis: `src/katalog/NUTZUNG.md`.
- `src/geraetekatalog.js` und `.css`: Auswahl, Instanzen, Klemmblockeditor.
- `src/katalog/profiles.json` und `klemmen-engine.js`: ausdrücklich unterstützte Brückenprofile und Layout.
- `node tools/import-katalog.cjs <Katalog-Ordner>` importiert ein aktualisiertes Übergabepaket.
- `python3 tools/build.py` erzeugt die Apps; Index und Profile werden eingebettet, Bilder nicht.
- `node tools/test-katalog.cjs` prüft alle Bildprüfsummen, Millimeterbreiten, Reihenaufteilung, Suche, Schutzdaten, Speicherung im Gebäude, unabhängige Kopien, Brückengrenzen und JavaScript-Syntax der vier gebauten Apps.

Für die getrennte lokale UI-Vorschau: erst bauen, dann `node tools/preview-katalog.cjs` und `python3 -m http.server 8766 --bind 127.0.0.1` ausführen. Danach `http://127.0.0.1:8766/tools/katalog-vorschau.html` öffnen. Die Vorschau nutzt ausschließlich eigene Beispieldaten und ändert weder die Microsoft-Anmeldung noch Produktionsdaten. Die erzeugte Vorschau-Datei wird nicht eingecheckt.

Die vollständige lokale App kann sich ohne passende lokale Redirect-URI nicht bei Microsoft anmelden. Die Anmeldekonfiguration wird für diesen Katalog nicht verändert. Vor dem Livegang bleibt die abschließende Prüfung im angemeldeten Programm einschließlich der bestehenden Schrank-/PDF-Ansichten erforderlich.
