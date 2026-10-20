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
