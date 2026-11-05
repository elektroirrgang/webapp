# Geplant / Hintergrund

## Merkliste Max (05.11.2026)
- **Kalender verbinden** (Übersicht › Kalender) – noch offen, Max will es sich merken.
- **Hallen bei Merten** (Bauteil F, G, H): nächste Woche Foto vom Hallenplan machen – danach entscheiden: Hallen-Begriffe (Ebene/Bereich), „Raum im Raum“ für Büros am Rand, Stützenraster (Achsen) als Ortsangabe, Raumarten Hochregallager/Versand/Rampe/Kompressorraum/Leitstand.
- **Wohnhaus testen:** das eigene Haus als Beispiel aufnehmen (Außenbereich, Werkstatt, Keller).
- **KNX-Vorlage je Raumart** (z. B. Büro = 2 Präsenzmelder, 1 RTR, 2 Jalousieaktoren) – vorgeschlagen, nicht beantwortet.
- **Suche auf der Kundenseite findet auch Räume/Verteiler** – vorgeschlagen, nicht beantwortet.
- **Als Nächstes:** UI-Fixes und Optimierungen.
- **Verteilerbau – neue Bauteile** (Max, 05.11.2026):
  - **Neozed (D01/D02)** als echtes Bauteil: Sockel 1-/3-polig, TE-Breite, Sicherung und Passhülse je Pol. Material ist in der Firmenliste schon da (Neozed-Elemente, LINOCUR D02, Schraubkappen, Passhülsen). DIAZED für Altbestand.
  - **NH nicht im Verteiler:** Bei Irrgang sitzen die NH-Sicherungen im **Hausanschlusskasten (HAK)** – eigener Kasten, Max schickt ein Foto. NH-Leisten nur bei sehr großen Verteilungen.
  - **Hutschienen-Netzteile** und **KNX-Spannungsversorgung**.
  - **KNX-Aktoren allgemein** (Schalt-, Jalousie-, Dimm-, Heizungsaktoren …): Hersteller **MDT** und **Schneider**, Altbestand viel **Merten**. **Hager KNX nicht** (wird bei Irrgang nicht verwendet).
  - Weiter offen: fehlende LS-Werte (B6, B13, B40–B63, C-Typen), FI Typ B (Wallbox/PV), FI 2-polig/25 A, Brandschutzschalter (AFDD), Überspannungsschutz Typ 2/3 im Unterverteiler, Reihenklemmen und Phasenschienen als Bauteil.

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
- Fotos markieren (1.7.62, „Markieren“ direkt nach dem Foto seit 1.7.69): Kundenordner legt „… markiert.jpg“ als Kopie an, Prüfungs-/Baustellenfotos werden ersetzt.
- Betriebsfristen/Unterweisungen (1.7.63): Vorlagen-Intervalle sind Vorschläge (DGUV V3, ASR A2.2) – mit dem Chef abgleichen. Fahrzeuge bewusst nicht als eigene Verwaltung (Max: bei unserer Größe nicht nötig).
- Plausibilitätsprüfung (1.7.66): Hinweise unter dem Messfeld (Tippfehler, Einheit, Quervergleich, Rechenweg Ik). In Gebäudetechnik nur mit Testdaten im Code geprüft, nicht im echten Messfenster – beim nächsten E-Check drauf achten.
- Bedenkenanmeldung/Behinderungsanzeige (1.7.65): Brieftext vom Chef abnehmen lassen.
- Nachschlagewerk: Max zeigt, was es schon gibt (Stand 04.11.2026) – dann entscheiden, ob ins Betriebshandbuch oder eigener Bereich.
- Texte aus der Übergabe (1.7.67): Stundenzettel (SCC) und Berichtsheft (Ezubis, nur Azubis, die beteiligt waren) zum Kopieren; nach Regeln, mit KI-Knopf sobald KI an ist. Ezubis: Tagesberichte täglich (Datum steht dort schon); Wochenbericht = ein Thema, das noch nicht dran war (z. B. erster KNX-Bewegungsmelder) – macht Max bisher mit einer KI. Später (Max: „lieber noch nicht“): Wochenbericht-Vorschlag aus den Übergaben der Woche + Liste der schon behandelten Themen, braucht KI.
- Abnahmeprotokoll (1.7.64): Abnahme-Satz im PDF („… erklärt die Abnahme … (§ 640 BGB)“) vom Chef prüfen lassen.

- Erledigt 04.11.2026 (1.7.69/1.7.70): Kopfzeile einheitlich (EVSE ohne ⋮), Bibliothek-Kategorie „Pläne“, mehrere Nummern bei Ansprechpartnern, Einbauplatz im Legenden-PDF, Aufbewahrung (Übersicht › Einstellungen › Verwaltung), Stromkreis-Rechner auch frei (EVSE Zuleitung, Einstellungen in EVSE/Gebäudetechnik). Beschriftungsstreifen und Rechner je Stromkreis gab es schon in der Legende.
- Prüftasten-Erinnerung für Kunden über die QR-Seite: wartet auf die öffentliche QR-Seite (Achenbach).
- QR-Scanner in allen Apps (Entwurf C: Blatt von unten, zuletzt gescannt, Filter Verteiler/Netzwerkschrank), Aufkleber auch für Netzwerkschränke – gebaut 04.11.2026 (1.7.71). Offen: in Baustelle/EVSE/Übersicht kennt der Scanner die Namen nur, wenn das Gerät den Aufkleber schon einmal gescannt hat.
- Info-Seite für Fremde (q/): Art steht seit 1.7.73 automatisch im QR-Link (&a=netz / &a=zs), Seite zeigt Netzwerk- bzw. Zählerschrank-Text. Max hat noch Ideen für den Inhalt (04.11.2026). 1.7.74: Speedtest (am Router + im Raum, Cloudflare-Messserver), Anbieter-Störungslink nach AS-Nummer, geführter Neustart, Foto senden, „Änderung melden“ für IT-Firmen.
- QR-Pflicht (1.7.77): Prüfung abschließen und Legende erstellen nur mit QR-Aufkleber, kein Überspringen; QR auf der Legende; Liste „ohne QR-Aufkleber“ in Installation/Netzwerk. Offen: Bögen ja/nein (Max klärt mit Chef), QR auf Netzwerk-Belegungsplan.
- KNX in Gebäudetechnik einbauen (Max 04.11.2026) – kommt nach dem Scanner, noch nicht anfangen.

## KNX in der Gebäudetechnik (Max, 04.11.2026) – Konzept, noch nicht gebaut
- Eigener Bereich. Gebäude wie gehabt: Bauteil › Etage/Level › Räume in fester Reihenfolge (z. B. Merten Bauteil B, Level 4, links anfangen: 413, 414, 415 …). In den Räumen die KNX-Geräte.
- Begehung vorab: einmal durch jeden Raum, je Raum zählen, was vorhanden ist, was neu kommt und was ersetzt wird (z. B. Raum 403: 4 Stellantriebe, 2 Jalousien, 1 Raumthermostat, 2 Präsenzmelder) – ohne die Leute dauernd zu stören.
- Automatische physikalische Adressen nach einem Schema, das Max vorher festlegt (Reihenfolge der Gerätearten, z. B. Jalousien zuerst), Linie und Startnummer wählbar.
- Status je Gerät als Checkliste zum Durcharbeiten: z. B. vorprogrammiert, eingebaut, konfiguriert (genaue Liste mit Max klären; nicht zwingend der Reihe nach).
- Beschriftung Brother: Reiter „KNX“ › Etiketten drucken – erzeugt CSV (Kopfzeile „Physikalische Adresse“, doppelte Nummern doppelt), weil Pro Label Tool nur Excel/CSV importiert und sich weder auf Android noch iPad Dateien übergeben lässt (getestet 04.11.). Ein-Knopf-Druck nur mit eigener App (Brother-SDK) – Chef.
- Programmier-Modus zu zweit (nur Kommunikation): Laptop fordert „3.1.36 im Raum X – Programmiertaste drücken“ an, Partner bekommt Pop-up, bestätigt „gedrückt“, Laptop programmiert in der ETS, „fertig“ → nächstes Gerät. Braucht schnellen Abgleich (alle 2–3 s) über Microsoft – testen.
- Status „Defekt/Problem“ mit Farben: z. B. markiert der Chef „Raum 403, 2 Stellantriebe funktionieren nicht“ (mit Notiz) – Max bekommt eine Zusammenfassung „folgende Geräte funktionieren nicht“, statt selbst suchen zu müssen. Auch Geräte ohne eigene Adresse (Stellantriebe, Motoren) müssen sich so markieren lassen.
- Nummerierung (Max): Linie gilt für eine Gruppe von Räumen (z. B. links der Doppeltür Raum 403–407 = Linie 6.1). Nummern laufen Raum für Raum durch (erster Raum mit 5 Geräten: 6.1.1–6.1.5, nächster Raum ab 6.1.6). Reihenfolge der Gerätearten im Raum individuell festlegbar (z. B. Jalousie zuerst).
- Noch offen: Statusliste bestätigen, Platz in der App (eigener Reiter oder mit Netzwerk), ETS-Export ja/nein.

## Kurz-Einführungen beim ersten Mal (Wunsch Max, 04.11.2026) – noch nicht gebaut
- Allgemein für alle Apps: neue oder seltene Funktionen beim ersten Benutzen kurz vorstellen (2–4 Bilder/Schritte, „Verstanden“), danach nie wieder von selbst – aber jederzeit wieder aufrufbar (z. B. Einstellungen › Hilfe).
- Merken pro Person (nicht pro Gerät), damit es auf Handy und iPad nicht doppelt kommt.
- Erste Einführung: QR-Aufkleber drucken mit dem Brother (einmal verbinden, Teilen-Menü, Pro Label Tool). Dafür braucht es Bildschirmfotos aus der Pro-Label-App (Max).

## QR-Aufkleber drucken – mit dem Chef besprechen (04.11.2026)
Problem: Den Kollegen ist der Druckweg zu umständlich (in der App „Drucken“ → Teilen-Menü → Pro Label Tool → Drucken). Direkt aus der Web-App per Bluetooth drucken geht nicht: Browser auf iPhone/iPad dürfen kein Bluetooth, Chrome auf Android nur Bluetooth LE (PT-E560BT funkt vermutlich klassisch – nicht geprüft).
Zu entscheiden:
- Bögen ja/nein: Im Büro vorgedruckte A4-Bögen (24 Stück, 70 × 36 mm, Folien-Etiketten) liegen im Auto; vor Ort nur aufkleben und scannen – kein Etikettendrucker, keine Brother-App. Nachteil: Etiketten kaufen; Art (Netzwerk/Zählerschrank) steht nicht im Code, Fremde müssen auf der Info-Seite selbst umschalten.
- Ohne Bögen: in der App „Drucken“ direkt ins Teilen-Menü (ein Schritt weniger) plus bebilderte Kurzanleitung inkl. einmaligem Verbinden mit dem Drucker. Dann den kleinen Knopf „Aufkleber scannen“ im Pflicht-Dialog weglassen.
- Eigene App mit Brother-SDK (echtes Drucken per Knopfdruck): großer Schritt, für iPhone Apple-Entwicklerkonto (99 € im Jahr) und Verteilung über Apple – Sache für Chef bzw. EDV Achenbach.
- Gilt auch: QR-Pflicht ist streng (kein Abschluss ohne Aufkleber). Streikt der Brother, bleibt die Prüfung an dem Tag offen.

## Lager (Gespräch 04.11.2026) – offen, Max ist unsicher, erst mit dem Chef klären
- Ablauf heute: 7:30 Start, 15–30 min packen, Chef sagt mündlich, was ansteht; gepackt wird nach Gefühl (meist zu viel, nach Chef-Mengen oft zu wenig). Sondermaterial wird bestellt.
- Lager: Gerätelager (Code), Hauptlager (links Lampen, vorne Mitte Kommissionsregal mit Zetteln – „noch Arsch“, Mitte Schalter/Steckdosen, hinten Hohlwand), Wandregal rechts (Verteilung/Automaten, Einzeladern, Abzweigdosen, Schrauben, oben Wago/Netzwerk/SAT/TK), Kabellager (Kanäle/Rohr, Kabel, Bauschaum/Trassen, Neuware).
- Ideen: Lagerplan mit Zonen + Suche; Kommissionsregal digital (K1, K2 … mit QR); Packliste nach Laufweg; Packvorlagen je Auftragsart mit Mengen pro Einheit, die aus „was kam zurück“ lernen.
- Verworfen/zurückgestellt: Inventur (nur bei Bilanzpflicht, Chef/Steuerberater fragen), Kabelreste (unklar, ob nötig), echte Bestandsführung.
- Vorschlag: zwei Wochen nur beobachten (was mitgenommen, was zurück), dann entscheiden.

## Offen aus der Sitzung vom 03.11.2026

- Ablauf Zählerschrank → Stromkreise → Material deutlich verkürzen (dauert für „mal eben eine Legende“ zu lange); Bugs beim Anordnen sammelt Max mit Screenshots.
- Foto einer Papierliste direkt in der App erkennen (braucht KI-Dienst, Kosten je Foto, Datenschutz mit dem Chef klären). Bis dahin: Foto an Claude, Claude macht die Text/CSV-Datei für „Liste einfügen“.
- Alte Verteiler im Schema „F 1.0.1“ auf Betriebsmittelkennzeichen (-F1, -F1.1 …) umstellen? (bisher bewusst nicht angefasst)
- Stromstoßschalter, Installations- und Zeitrelais: bleiben -K oder wie Schütz -Q? (Max fragt in der Schule nach)
- TAB NS der GWN (Gemeindewerke Nümbrecht) besorgen → genaue Pflichtpunkte der Bestückung eintragen; prüfen, ob ganz 51588 GWN-Netz ist.
- „Aufbau ändern“: Hersteller-Modell (z. B. ZB53S + ZK5EH24 + ZU59VT7APZ2) auch nachträglich wählbar machen, damit es in der Materialliste steht.
- EVSE Standortseite / „Ladeparks“ später klarer trennen (Max 04.11.2026): Standort = eigene Adresse (z. B. Werk Rommelsdorf, Werk Elfenroth). Mehrere Ladestellen an DERSELBEN Adresse sind kein weiterer Standort – Begriff und Darstellung für die Ebene darunter (heute „Ladepark“) überarbeiten, z. B. „Ladebereich“ (Parkplatz Nord, Tiefgarage). Standortseite danach auf den gemeinsamen Aufbau (kdSeite) bringen.

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
