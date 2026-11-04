/* ===== Betriebshandbuch: Gliederung und Entwürfe (04.11.2026) =====
   Vorschläge von Claude nach gängiger Praxis (VDE/DGUV) – gelten erst, wenn Chef oder Büro sie in der App freigeben.
   Ein gespeicherter Artikel (Datenart „handbuch“, gleiche id) ersetzt den Entwurf hier.
   Textformat: Absätze, „## Zwischenüberschrift“, „- Aufzählung“, **fett**. checkliste = Punkte zum Abhaken vor Ort. */
const HB_KAPITEL=[["firma","Unternehmen und Kunden"],["sicherheit","Arbeitssicherheit"],["baustelle","Baustelle"],["montage","Installation und Montage"],["pruefen","Prüfen und Dokumentieren"],["fahrzeug","Fahrzeug, Werkzeug, Messgeräte"],["buero","Abläufe und Büro"]];
const HB_VORLAGE=[
{id:"hb-grundsaetze",kapitel:"firma",titel:"Wofür wir stehen",inhalt:`Elektro Irrgang arbeitet sauber, sicher und nachvollziehbar. Der Kunde soll nach unserem Einsatz eine Anlage haben, die funktioniert, dokumentiert ist und die er versteht.

## Unsere Grundsätze
- **Sicherheit vor Tempo.** Wer unsicher ist, fragt – lieber einmal zu viel.
- **Ordnung.** Werkzeug, Material und Baustelle sind am Ende des Tages aufgeräumt.
- **Dokumentation.** Was wir verbauen und prüfen, steht in der App: Stromkreise, Prüfprotokolle, Übergaben, Fotos.
- **Ehrlichkeit.** Fehler und Schäden sofort melden – auch die eigenen. Nur so können wir sie beheben.
- **Ein Team.** Wissen weitergeben, Neue und Azubis mitnehmen.`},
{id:"hb-kunde",kapitel:"firma",titel:"Auftreten beim Kunden",inhalt:`Beim Kunden sind wir Gast – und das Aushängeschild der Firma.

## Ankommen
- Pünktlich sein. Wird es später, den Kunden **vorher** anrufen oder das Büro informieren.
- Freundlich vorstellen: Name, Elektro Irrgang, worum es heute geht.
- In Wohnungen Schuhüberzieher oder saubere Schuhe; Laufwege und Möbel bei Bedarf abdecken.

## Während der Arbeit
- Absprechen, wann der Strom abgeschaltet wird (Computer, Kühlgeräte, Heizung, Aufzug).
- Keine privaten Telefonate in Hörweite, keine Musik ohne Rückfrage, nicht rauchen.
- Fragen des Kunden zu Preisen oder Zusatzarbeiten nicht selbst zusagen – ans Büro weitergeben.

## Abschluss
- Kurz zeigen, was gemacht wurde und worauf er achten muss (z. B. FI-Prüftaste).
- Arbeitsplatz sauber hinterlassen, Verpackung mitnehmen.`},
{id:"hb-5sr",kapitel:"sicherheit",titel:"Die fünf Sicherheitsregeln",inhalt:`Vor jeder Arbeit an elektrischen Anlagen gelten die fünf Sicherheitsregeln nach DIN VDE 0105-100 – **immer in dieser Reihenfolge**:

1. **Freischalten** – allpolig und allseitig.
2. **Gegen Wiedereinschalten sichern** – Sicherungen mitnehmen oder sperren, Schild „Nicht schalten – es wird gearbeitet“ anbringen.
3. **Spannungsfreiheit feststellen** – allpolig an der Arbeitsstelle, mit zweipoligem Spannungsprüfer. Prüfer vorher und nachher an einer bekannten Spannung testen.
4. **Erden und kurzschließen** – in Niederspannungsanlagen, wenn Gefahr der Wiedereinschaltung oder Rückspannung besteht (z. B. PV, Notstrom, Freileitungen).
5. **Benachbarte, unter Spannung stehende Teile abdecken oder abschranken.**

Aufheben erst, wenn die Arbeit beendet ist – in umgekehrter Reihenfolge und erst nachdem alle Personen informiert sind.

## Wichtig
- Arbeiten unter Spannung nur mit ausdrücklicher Anweisung, Ausbildung und Ausrüstung.
- PV-Anlagen, Speicher und Wallboxen können von mehreren Seiten Spannung führen.`,checkliste:["Freigeschaltet (allpolig)","Gegen Wiedereinschalten gesichert, Schild angebracht","Spannungsprüfer an bekannter Spannung getestet","Spannungsfreiheit allpolig festgestellt","Wenn nötig: geerdet und kurzgeschlossen","Benachbarte aktive Teile abgedeckt"]},
{id:"hb-psa",kapitel:"sicherheit",titel:"Schutzausrüstung und Leitern",inhalt:`## Persönliche Schutzausrüstung
- Sicherheitsschuhe auf jeder Baustelle.
- Schutzbrille bei Bohr-, Stemm- und Schleifarbeiten sowie beim Arbeiten an offenen Verteilern.
- Gehörschutz bei lauten Arbeiten, Handschuhe beim Schlitzen und bei Kabeltrommeln.
- Helm, wo Baustellenordnung oder Gefahr von oben es verlangen.

## Leitern
- Vor Benutzung auf Schäden prüfen (Holme, Sprossen, Spreizsicherung, Füße).
- Stehleitern nicht als Anlegeleiter benutzen; die obersten Stufen nicht besteigen.
- Leitern nur für kurze Arbeiten. Für längere Arbeiten in der Höhe Gerüst oder Podest nutzen.
- Beschädigte Leitern sofort aussortieren und melden.`},
{id:"hb-unfall",kapitel:"sicherheit",titel:"Unfall, Stromschlag, Erste Hilfe",inhalt:`## Bei einem Stromunfall
1. **Eigenschutz:** Stromkreis abschalten, erst dann den Verletzten berühren.
2. Notruf **112** – auch wenn es dem Verletzten gut zu gehen scheint. Nach einem Stromschlag kann es Stunden später zu Herzrhythmusstörungen kommen; der Verletzte muss ärztlich untersucht werden.
3. Erste Hilfe leisten, bei Bewusstlosigkeit Atmung prüfen, ggf. Herz-Lungen-Wiederbelebung.
4. Chef informieren.

## Danach
- Jeden Unfall und jeden Beinahe-Unfall melden, auch kleine Verletzungen ins Verbandbuch eintragen.
- Die Unfallstelle möglichst unverändert lassen, bis geklärt ist, was passiert ist.

Erste-Hilfe-Kasten und Ersthelfer: steht im Fahrzeug bzw. an der Werkstatt aus.`},
{id:"hb-bs-start",kapitel:"baustelle",titel:"Baustellenstart",inhalt:`Vor dem ersten Arbeitstag auf einer neuen Baustelle einmal alles klären – das spart später Zeit und Ärger.

- Baustelle in der App **Baustelle** anlegen bzw. öffnen, Kunde und Adresse prüfen.
- Pläne, Angebot bzw. Auftrag ansehen (Bibliothek des Kunden).
- Ansprechpartner vor Ort und Telefonnummer klären.
- Baustrom, Zugang, Schlüssel, Parkmöglichkeit klären.
- Vorhandene Anlage ansehen: Schäden, fehlender Zusatzschutz, Auffälligkeiten **fotografieren und in der Übergabe festhalten**, bevor wir anfangen.`,checkliste:["Baustelle in der App angelegt","Auftrag und Pläne angesehen","Ansprechpartner und Telefon notiert","Baustrom und Zugang geklärt","Bestand fotografiert, Schäden notiert","Material für die ersten Tage angefordert"]},
{id:"hb-uebergabe",kapitel:"baustelle",titel:"Tagesübergabe schreiben",inhalt:`Am Ende jedes Arbeitstags eine Übergabe in der App **Baustelle** – damit jeder, der morgen kommt, sofort weiß, wo es weitergeht.

## Was rein gehört
- **Stand:** was heute erledigt wurde (kurz, in Stichpunkten).
- **Offen:** was als Nächstes kommt, was fehlt, was geklärt werden muss.
- **Material:** was morgen gebraucht wird – mit Menge und Einheit.
- **Fotos:** vor dem Verschließen von Schlitzen, Dosen und Verteilern.
- **Dabei:** wer mitgearbeitet hat.

Tipp: Ist die KI eingeschaltet, kannst du die Übergabe einfach erzählen.`},
{id:"hb-material",kapitel:"baustelle",titel:"Material anfordern und Lager",inhalt:`- Material in der App anfordern (Übersicht › Material bzw. in der Übergabe) – nicht per Zuruf oder Zettel.
- Möglichst einen Tag vorher anfordern; Eiliges zusätzlich telefonisch melden.
- Großhändler: EGU und Sonepar – Bestellung läuft über das Büro.
- Restmaterial zurück ins Lager, angebrochene Ringe beschriften (Typ, ungefähre Restlänge).
- Fehlmengen und Beschädigungen bei Lieferung sofort melden.`},
{id:"hb-bs-ende",kapitel:"baustelle",titel:"Baustellenabschluss und Übergabe an den Kunden",inhalt:`Bevor wir eine Baustelle verlassen bzw. an den Kunden übergeben:

- Prüfung nach DIN VDE 0100-600 durchführen und in der App dokumentieren.
- Verteiler beschriften, Legende in die Verteilertür, QR-Aufkleber anbringen.
- Abdeckungen, Rahmen und Blindstreifen vollständig.
- Kunden einweisen (Verteiler, FI-Prüftaste, besondere Geräte).
- Baustelle besenrein, Restmaterial und Werkzeug mitnehmen.
- In der App: Baustelle auf „Fertig“, letzte Übergabe mit Fotos.`,checkliste:["Prüfung durchgeführt und dokumentiert","Verteiler beschriftet, Legende in der Tür","QR-Aufkleber angebracht","Alle Abdeckungen und Rahmen montiert","Kunde eingewiesen","Baustelle sauber, Material mitgenommen","Baustelle in der App abgeschlossen"]},
{id:"hb-zonen",kapitel:"montage",titel:"Installationszonen und Montagehöhen",inhalt:`Leitungen in Wänden verlegen wir in den Installationszonen nach DIN 18015-3 – so weiß jeder später, wo nicht gebohrt werden darf.

## Waagerechte Zonen
- **Oben:** 15–45 cm unter der fertigen Decke.
- **Unten:** 15–45 cm über dem fertigen Fußboden.
- **Mitte** (nur in Räumen mit Arbeitsflächen, z. B. Küche): 100–130 cm über dem fertigen Fußboden.

## Senkrechte Zonen
- 10–30 cm neben Rohbaukanten von Türen, Fenstern und Raumecken.

Leitungen immer **senkrecht oder waagerecht** führen, nie schräg. Dosen für Schalter und Steckdosen sitzen in den Zonen.

## Unsere Standardhöhen (Mitte Dose, über fertigem Fußboden)
- Schalter: 105 cm
- Steckdosen: 30 cm
- Steckdosen über Arbeitsflächen in der Küche: 115 cm
- Abweichungen (barrierefrei, Kundenwunsch) vorher absprechen und in der Übergabe notieren.`},
{id:"hb-klemmen",kapitel:"montage",titel:"Anschließen und Klemmen",inhalt:`- Nur zugelassene Verbindungsklemmen verwenden (z. B. Wago 221, 2273); Querschnitt und Leiterart der Klemme beachten.
- Fein- und feindrähtige Leiter mit **Aderendhülse**, wenn die Klemme nicht ausdrücklich ohne zugelassen ist.
- Abisolierlänge nach Herstellerangabe, kein blankes Kupfer außerhalb der Klemme.
- Schraubklemmen mit dem richtigen Drehmoment anziehen.
- Schutzleiter immer zuerst anschließen und zuletzt lösen; grün-gelb nur als Schutzleiter.
- In Dosen Leitungen ordentlich falten, Reserve lassen, nichts quetschen.`},
{id:"hb-verteiler",kapitel:"montage",titel:"Verteiler bauen und beschriften",inhalt:`So sieht ein Verteiler von Elektro Irrgang aus – egal wer ihn gebaut hat.

## Aufbau
- Einspeisung und Hauptschalter bzw. Hauptleitungsabzweig oben, Fehlerstromschutzschalter am Anfang jeder Gruppe.
- Je Reihe ein FI mit seinen Stromkreisen; Reserve-Plätze am Reihenende.
- Phasen gleichmäßig aufteilen, Phasenschienen statt Brücken aus Einzeldraht.
- N- und PE-Klemmen geordnet in der Reihenfolge der Stromkreise.
- Leitungen sauber geführt, Bögen statt Knicke, Kabelbinder kurz abschneiden.

## Beschriftung
- Kennzeichnung nach Schema **-F1** (FI) und **-F1.1, -F1.2 …** (Automaten dahinter), siehe App Gebäudetechnik.
- Beschriftungsstreifen mit dem Brother P-touch aus der App drucken (Verteiler › Abschluss › Beschriftungsstreifen).
- Legende als PDF aus der App, ausgedruckt in die Verteilertür.
- QR-Aufkleber anbringen und in der App zuordnen.

## Vor dem Einschalten
- Alle Klemmen nachziehen, Isolationsmessung, Abdeckungen montieren.`,checkliste:["Klemmen nachgezogen","Isolationswiderstand gemessen","Drehfeld geprüft","FI über Prüftaste und mit Messgerät ausgelöst","Beschriftungsstreifen angebracht","Legende in der Tür","QR-Aufkleber zugeordnet","Abdeckungen und Blindstreifen montiert"],apps:["echeck"]},
{id:"hb-pruefung",kapitel:"pruefen",titel:"Anlagen prüfen (Erst- und Wiederholungsprüfung)",inhalt:`Jede neue oder geänderte Anlage wird vor der Übergabe geprüft (DIN VDE 0100-600), bestehende Anlagen wiederkehrend (DIN VDE 0105-100, bei Gewerbe nach DGUV Vorschrift 3).

## Ablauf
1. **Besichtigen:** Schutz gegen direktes Berühren, Auswahl der Betriebsmittel, Beschriftung, Brandschutz, Zugänglichkeit.
2. **Erproben:** FI-Prüftaste, Schalter, Not-Aus, Drehfeld.
3. **Messen:** Durchgängigkeit Schutzleiter, Isolationswiderstand, Schleifenimpedanz bzw. Abschaltbedingung, Auslösung der FI (Zeit und Strom).

## Richtwerte (siehe auch die App)
- Isolationswiderstand: mindestens 1 MΩ bei 500 V Messspannung.
- FI: Auslösezeit bei IΔN höchstens 300 ms, bei 5 × IΔN höchstens 40 ms.
- Schleifenimpedanz: Zs ≤ 230 V ÷ Abschaltstrom Ia (z. B. B16: Ia = 80 A ⇒ Zs ≤ 2,875 Ω).

Alles wird in der App **Gebäudetechnik** dokumentiert; das PDF geht an info@ zur Kontrolle durch den Chef.`,apps:["echeck"]},
{id:"hb-evse",kapitel:"pruefen",titel:"Ladeeinrichtungen (Wallbox) prüfen",inhalt:`Wallboxen und Ladesäulen prüfen wir mit der App **EVSE** und dem Adapter (z. B. Fluke FEV300) am Prüfgerät.

- Zuleitung und Schutzorgane nach DIN VDE 0100-722: je Ladepunkt eigener Stromkreis, FI Typ A mit Erkennung von Gleichfehlerströmen (6 mA DC, in der Wallbox oder separat) oder FI Typ B.
- Messungen: Schutzleiter, Isolation, Schleifenimpedanz, FI-Auslösung (auch mit Gleichfehlerstrom, wenn vorgesehen), Funktionsprüfung mit dem Adapter (Zustände A–E).
- Netzbetreiber: Jede Ladeeinrichtung muss angemeldet werden; über 12 kVA (z. B. 22 kW) braucht sie vorher eine Genehmigung.
- Protokoll in der App abschließen, „Nächste Prüfung“ setzen – dann erscheint die Frist im Prüffristen-Radar.`,apps:["evse"]},
{id:"hb-dguv",kapitel:"pruefen",titel:"Ortsveränderliche Geräte prüfen (DGUV V3)",inhalt:`Geräte mit Stecker prüfen wir nach DIN VDE 0701-0702 und dokumentieren sie in der App **Gebäudetechnik** (Geräteprüfung).

## Ablauf
1. Sichtprüfung: Gehäuse, Leitung, Stecker, Knickschutz, Aufschriften.
2. Messen: Schutzleiterwiderstand (Schutzklasse I), Isolationswiderstand, Schutzleiter- bzw. Berührungsstrom.
3. Funktionsprüfung.
4. Prüfplakette mit nächstem Termin, Ergebnis in der App.

## Richtwerte
- Schutzleiterwiderstand: höchstens 0,3 Ω bis 5 m Leitungslänge.
- Isolationswiderstand: mindestens 1 MΩ (Schutzklasse I), 2 MΩ (Schutzklasse II), 0,25 MΩ (Schutzklasse III).

Defekte Geräte sofort aus dem Verkehr ziehen, kennzeichnen und dem Betreiber melden.`,apps:["echeck"]},
{id:"hb-fahrzeug",kapitel:"fahrzeug",titel:"Fahrzeug und Werkzeug",inhalt:`Das Fahrzeug ist unser Lager unterwegs – und fährt mit unserem Namen durch die Gegend.

- Wöchentlich kurz prüfen (Checkliste unten), Schäden sofort melden.
- Ladung sichern, schwere Teile nach unten.
- Werkzeug nach Benutzung zurück an seinen Platz; Verlust oder Defekt sofort melden.
- Elektrowerkzeuge und Verlängerungen werden regelmäßig geprüft (Plakette beachten).
- Fahrzeug sauber halten, keinen Müll im Fahrerhaus.`,checkliste:["Reifen, Licht, Blinker in Ordnung","Ölstand und Kühlwasser geprüft","Warndreieck, Verbandkasten, Warnweste an Bord","Ladung gesichert","Werkzeug vollständig","Prüfplaketten an Werkzeug und Leitungen gültig"]},
{id:"hb-messgeraete",kapitel:"fahrzeug",titel:"Messgeräte und Kalibrierung",inhalt:`- Messgeräte sind in der Übersicht unter **Messgeräte** erfasst – dort steht, wann sie zur Kalibrierung müssen.
- Vor jeder Prüfung: Gerät, Messleitungen und Adapter auf Beschädigung prüfen.
- Spannungsprüfer vor und nach dem Messen an einer bekannten Spannung testen.
- Defekte oder heruntergefallene Messgeräte nicht weiter benutzen, melden.
- Abgelaufene Kalibrierung: Gerät nicht mehr für Prüfprotokolle verwenden.`},
{id:"hb-ablauf",kapitel:"buero",titel:"Vom Auftrag bis zur Rechnung",inhalt:`## Der Weg eines Auftrags
1. **Anfrage** kommt rein (Telefon, E-Mail, Meldung) – das Büro legt einen Vorgang in der Übersicht an.
2. **Termin** wird geplant (Kalender), Material angefordert.
3. **Ausführung:** Übergaben, Fotos, Material in der App Baustelle; Prüfung in Gebäudetechnik bzw. EVSE.
4. **Abschluss:** Prüfprotokoll geht an info@, der Chef prüft es.
5. **Rechnung:** das Büro schreibt die Rechnung und schickt das Protokoll mit.

## Was jeder im Blick hat
- Arbeitszeit und Material vollständig erfassen – was nicht notiert ist, kann nicht berechnet werden.
- Zusatzarbeiten, die der Kunde vor Ort wünscht, als Notiz bzw. Vorgang festhalten und mit dem Büro klären.`}];
