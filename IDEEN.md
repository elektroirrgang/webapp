# Geplant / Hintergrund

## Bearbeitungssperre bei gleichzeitigem Arbeiten (erst nach funktionierender Microsoft-Anbindung)

- Wer ein Protokoll (EVSE-Prüfung, Aufnahmeprotokoll) offen hat, ist Bearbeiter; das Gerät meldet sich alle ~20 s über eine Sperrdatei im gemeinsamen Ordner.
- Andere sehen „Max Pevec bearbeitet gerade – seit 10:02“, können lesen, aber nicht ändern, und „Bearbeitung anfragen“.
- Der Bearbeiter bekommt „X möchte bearbeiten“ mit „Speichern und freigeben“ / „Ich arbeite noch“. Ohne Reaktion nach ca. 2 Minuten automatisch speichern und freigeben (Fall: Telefonat, Weitermachen vergessen).
- App geschlossen oder Gerät weggelegt: Sperre läuft nach ca. 2 Minuten von selbst ab.
- Grenzen: keine Push-Nachricht bei geschlossener App (kein eigener Server); ohne Netz keine Sperre möglich, dann gilt weiter „neuere Änderung gewinnt“ mit Hinweis.
- Offen: Gilt es für Prüfungen und Aufnahmen? 2 Minuten okay? Darf der Chef (Admin) sofort übernehmen?
