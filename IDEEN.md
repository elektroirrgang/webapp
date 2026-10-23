# Geplant / Hintergrund

## Bearbeitungssperre bei gleichzeitigem Arbeiten (erst nach funktionierender Microsoft-Anbindung)

- Wer ein Protokoll (EVSE-Prüfung, Aufnahmeprotokoll) offen hat, ist Bearbeiter; das Gerät meldet sich alle ~20 s über eine Sperrdatei im gemeinsamen Ordner.
- Andere sehen „Max Pevec bearbeitet gerade – seit 10:02“, können lesen, aber nicht ändern, und „Bearbeitung anfragen“.
- Der Bearbeiter bekommt „X möchte bearbeiten“ mit „Speichern und freigeben“ / „Ich arbeite noch“. Ohne Reaktion nach ca. 2 Minuten automatisch speichern und freigeben (Fall: Telefonat, Weitermachen vergessen).
- App geschlossen oder Gerät weggelegt: Sperre läuft nach ca. 2 Minuten von selbst ab.
- Grenzen: keine Push-Nachricht bei geschlossener App (kein eigener Server); ohne Netz keine Sperre möglich, dann gilt weiter „neuere Änderung gewinnt“ mit Hinweis.
- Offen: Gilt es für Prüfungen und Aufnahmen? 2 Minuten okay? Darf der Chef (Admin) sofort übernehmen?

## Kundendaten aus SCC Mobile übernehmen (erst nach funktionierender Synchronisierung)

- Max versucht, die Kundenliste aus SCC Mobile zu exportieren und schickt sie einmal; dann gemeinsam aufräumen, prüfen und importieren.
- Hilfreich im Export: Kundennummer, Name, Straße, PLZ, Ort, Telefon, E-Mail, Ansprechpartner. Die Kundennummer dient als Schlüssel, damit beim Import keine Doppelten entstehen.
- Bis dahin meckert das System nicht, wenn bei Kunde oder Baustelle keine Adresse hinterlegt ist.
- Standorte bleiben unabhängig von der Kundenart: auch Privatkunden können mehrere Häuser oder einen Laden haben, Firmenkunden (z. B. Sarstedt) mehrere Werke.

## Gebäude mit Etagen und Räumen für Prüfungen

- Bei einem Objekt (z. B. Einfamilienhaus) Etagen angeben und darin Räume anlegen.
- Prüfungen / Messungen später je Raum erfassen.
- Offen: wie das im Prüfprotokoll dargestellt wird (nach Etage und Raum gegliedert?), und in welcher App (E-Check / Erstprüfung).
- Vorgehen wie bei den Haftnotizen: erst Entwürfe zeigen, dann bauen.

## Netzwerkprüfung: Inhalt des PDF-Berichts wählbar (Wunsch von Max, 23.10.2026)

- Beim Erstellen des Berichts per Schalter festlegen, was hineinkommt. Mögliche Teile:
  - Auftragsdaten, Messgerät, Verkabelung (immer)
  - Messergebnisse je Link als Tabelle
  - Wiremap-Bild je Link
  - Mängelliste
  - Netzwerkschrank als Zeichnung (Vorderansicht wie in „Infrastruktur“)
  - Bestückungs- bzw. Stückliste des Schranks
  - Patchfeld-Belegung (Port → Dose/Raum)
  - Dosenliste je Etage/Raum
- Auswahl je Bericht merken; dazu eine Firmen-Vorgabe (wie die Etiketten-Profile).
- Vorher in Ruhe die Oberfläche der Netzwerkprüfung neu anordnen (Max am Laptop), Etiketten-Editor bekommt dabei einen festen Platz.

## Netzwerkprüfung: Import aus dem SignalTEK (nächste Woche)

- SignalTEK II liefert CSV (nur bestanden/nicht bestanden) und PDF (je Seite ein Link: Länge, Paarlängen, Skew, Kabeltyp, Geschwindigkeit, Duplex, Tx/Rx/Fehler). Text aus dem PDF lässt sich auslesen, pdf.js liegt schon in vendor/.
- Fehlt noch: ein Bericht vom SignalTEK NT (per USB-Stick), am besten mit Bildern.
- Offen: Tests am Gerät nach Dosen benennen („1.13“) oder Zuordnung beim Import in der App.
- Uhr am SignalTEK II ist falsch gestellt (Berichte zeigen 2010).

## Brother-Etiketten: Musterdateien fehlen noch

- Aus der App je eine Verteiler-Datei: Band 6, 18, 24 mm; Trennzeichen Markierungspunkte, Gedankenstrich, Fett, Rahmen, Kein; eine Kombi-Datei (vertikal, Umkehren, Block 3 = 2,0).
- Bestätigt: App öffnet unsere .lbxs (9 mm, Linie, 24 × 18 mm).

## Handy: weniger Funktionen (Wunsch von Max, 23.10.2026)

- Am Handy nur, was man vor Ort tippt (Dosen anlegen, messen, Mängel, Fotos). Planen wie den Netzwerkschrank bestücken gehört an den PC/das iPad.
- Offen: was genau rausfliegt und ob das Handy die Schrankansicht nur noch zum Anschauen zeigt. „Mobil“ heißt bei Max iPad und Handy – Grenze also eher Handy-Breite (< 600 px), nicht iPad.
