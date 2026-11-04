# Geplant / Hintergrund

## KI (vorbereitet 04.11.2026 – wartet auf Zugang, Entscheidung Chef/Microsoft)
- Eingebaut, aber aus: `src/ki.js`, Einstellungen in der Übersicht › Einstellungen › KI (nur Admin). Anleitung: `server/README.md`.
- Weg 1 Azure OpenAI mit Microsoft-Anmeldung (kein Schlüssel in der App), Weg 2 eigener Server `server/ki-worker.js`.
- Schon angeschlossen: Liste einfügen › Foto (Verteiler ablesen), Diktieren (KI statt Regeln, Regeln als Rückfall), Baustelle › Übergabe › Erzählen.
- Ideen für später: Mängeltext aus Stichworten ausformulieren, Prüfbericht-Zusammenfassung für den Kunden, Material aus Foto der Lieferscheine, Anlagenpass mit Kurzfazit.
- Vor dem Einschalten: Datenschutz (Anbieter, EU-Region, Auftragsverarbeitung) mit dem Chef klären.
- Mit Achenbach besprechen (Wunsch Max, 04.11.2026): Bilderkennung muss dabei sein – das Modell braucht Bildverständnis (z. B. gpt-4o), sonst geht „Foto → Liste“ nicht.

## QR-Aufkleber: öffentliche Seite für Fremde (Entscheidung Max, 03.11.2026: über Microsoft) – wartet auf Achenbach

- Ziel: Wer den Aufkleber am Verteiler scannt und nicht angemeldet ist, sieht eine Irrgang-Seite mit **Verteilerlegende** und **Bedienungsanleitungen** der Anlage. Er kann **nichts bearbeiten oder löschen**, aber eine **Bemerkung** schreiben, die bei uns als Vorgang in der Übersicht landet; wir arbeiten sie danach in die Pläne ein.
- Mitarbeiter scannen wie bisher und landen direkt im Verteiler in der App. Die vorgedruckten Bögen funktionieren weiter.
- Öffentlich wird nur, was freigegeben ist (Schalter „Für Aufkleber freigeben“ im Verteiler, sinnvoll erst nach „abgeschlossen“). Kein Kundenname, keine Adresse.
- Technik: kleiner Vermittler als **Azure Function** – liest mit eigener App-Berechtigung nur die freigegebenen Verteiler aus unserem SharePoint und nimmt Bemerkungen entgegen (Spam-Schutz: Name/Telefon Pflicht, Begrenzung je Aufkleber). Kosten bei unserer Menge praktisch 0 €.
- **Von Achenbach (Microsoft-Admin) brauchen wir:**
  1. Azure-Abonnement (nutzungsbasiert) für die Firma bzw. Zugang zu einem vorhandenen.
  2. App-Registrierung für den Vermittler mit der Berechtigung **Sites.Selected**, freigegeben nur für die SharePoint-Seite „ElektroIrrgangApps“ (lesen; schreiben nur für den Ordner der Bemerkungen).
  3. Eine Azure Function (Verbrauchsplan) anlegen oder uns die Rechte dafür geben; Code und Einrichtung macht Claude.
  4. Optional: Unterdomain wie q.elektro-irrgang.de für die öffentliche Seite.
- Noch zu klären: Soll auch das letzte Prüfprotokoll (E-Check) öffentlich sichtbar sein? Bemerkungen zusätzlich als Mail an info@?
- Erst danach bauen. Danach den Scanner (Kamera-Ansicht) neu gestalten – gefällt Max so nicht.

## Neu am 04.11.2026 (live) – offen zum Nachschauen
- Fotos markieren (1.7.62): Kundenordner legt „… markiert.jpg“ als Kopie an, Prüfungs-/Baustellenfotos werden ersetzt. Idee: gleich nach dem Fotografieren „Markieren?“ anbieten.
- Betriebsfristen/Unterweisungen (1.7.63): Vorlagen-Intervalle sind Vorschläge (DGUV V3, ASR A2.2) – mit dem Chef abgleichen. Fahrzeuge bewusst nicht als eigene Verwaltung (Max: bei unserer Größe nicht nötig).
- Plausibilitätsprüfung (1.7.66): Hinweise unter dem Messfeld (Tippfehler, Einheit, Quervergleich, Rechenweg Ik). In Gebäudetechnik nur mit Testdaten im Code geprüft, nicht im echten Messfenster – beim nächsten E-Check drauf achten.
- Bedenkenanmeldung/Behinderungsanzeige (1.7.65): Brieftext vom Chef abnehmen lassen.
- Nachschlagewerk: Max zeigt, was es schon gibt (Stand 04.11.2026) – dann entscheiden, ob ins Betriebshandbuch oder eigener Bereich.
- Abnahmeprotokoll (1.7.64): Abnahme-Satz im PDF („… erklärt die Abnahme … (§ 640 BGB)“) vom Chef prüfen lassen.

## Offen aus der Sitzung vom 03.11.2026

- Ablauf Zählerschrank → Stromkreise → Material deutlich verkürzen (dauert für „mal eben eine Legende“ zu lange); Bugs beim Anordnen sammelt Max mit Screenshots.
- Foto einer Papierliste direkt in der App erkennen (braucht KI-Dienst, Kosten je Foto, Datenschutz mit dem Chef klären). Bis dahin: Foto an Claude, Claude macht die Text/CSV-Datei für „Liste einfügen“.
- Einbauplatz („R1 · Platz 5–7“) auch auf die gedruckte Legende / ins PDF?
- Alte Verteiler im Schema „F 1.0.1“ auf Betriebsmittelkennzeichen (-F1, -F1.1 …) umstellen? (bisher bewusst nicht angefasst)
- Stromstoßschalter, Installations- und Zeitrelais: bleiben -K oder wie Schütz -Q? (Max fragt in der Schule nach)
- Mehrere Telefonnummern auch bei Ansprechpartnern.
- TAB NS der GWN (Gemeindewerke Nümbrecht) besorgen → genaue Pflichtpunkte der Bestückung eintragen; prüfen, ob ganz 51588 GWN-Netz ist.
- „Aufbau ändern“: Hersteller-Modell (z. B. ZB53S + ZK5EH24 + ZU59VT7APZ2) auch nachträglich wählbar machen, damit es in der Materialliste steht.
- 10-Jahres-Frist (Prüfprotokolle, Verteilerlegenden inkl. „Ältere Stände“) steht bisher nur im Datenschutzhinweis – es gibt noch keine automatische Löschung/Erinnerung nach Ablauf. Bei Bedarf: Liste „Frist abgelaufen“ für den Chef statt stillem Löschen.
- EVSE Standortseite / „Ladeparks“ später klarer trennen (Max 04.11.2026): Standort = eigene Adresse (z. B. Werk Rommelsdorf, Werk Elfenroth). Mehrere Ladestellen an DERSELBEN Adresse sind kein weiterer Standort – Begriff und Darstellung für die Ebene darunter (heute „Ladepark“) überarbeiten, z. B. „Ladebereich“ (Parkplatz Nord, Tiefgarage). Standortseite danach auf den gemeinsamen Aufbau (kdSeite) bringen.
- Kopfzeile oben rechts in allen Apps vereinheitlichen (heute: Übersicht/Baustelle Glocke, EVSE ⋮-Menü, Gebäudetechnik nur Profilbild).
- Feature-Ideen (04.11.2026, Max will alle): (1) Beschriftungsstreifen für die Automaten-Reihen auf dem Brother P-touch drucken – je Gerät 17,5 mm × TE, BMK + Bezeichnung; (2) Stromkreis-Rechner: Länge + Querschnitt → Spannungsfall %, Zs/Abschaltbedingung, Vergleich mit Messwerten; (3) Legende diktieren (in Arbeit); (4) Prüftasten-Erinnerung für Kunden über die QR-Seite (Kalendereintrag alle 6 Monate).
- Bibliothek: eigene Kategorie „Pläne“ neben Prüfprotokollen/Berichten (Legende erscheint im Filter noch unter „Prüfprotokolle“).

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
