# Stil der Irrgang-Apps

Gilt für alle Apps (Übersicht, EVSE, Baustelle, E-Check). Vorbild ist EVSE. Google M3 mit Apple-Bedienlogik. Neue Seiten werden aus diesen Bausteinen gebaut – keine eigenen Muster erfinden.

## Grundregeln
- Gefüllte Flächen statt Rahmen und Outlines. Keine Häkchen als Deko (auch nicht im aktiven Chip).
- Umlaute bleiben Umlaute – überall, auch in Dateinamen und Exporten.
- „mobil“ heißt iPad und Handy. Breit = ab 744 px.
- Unterseiten bleiben in der App-Spalte – kein Vollbild.

## Seite
- **Kopf:** Titel, darunter optional ein Untertitel. Auf Unterseiten links der Zurück-Pfeil (breit: runder Knopf, mobil: Pfeil).
- **Bereiche einer Unterseite:** mobil als Tabs unter dem Kopf, breit als Auswahl rechts im Kopf (`spick`).
- **Aktionen zur Seite:** im ⋮-Menü der App, nicht als Knöpfe im Inhalt. Hat das Menü nur „Bearbeiten“ (und „Löschen“), gibt es **kein ⋮**: Bearbeiten steht als Schnellaktion auf der Seite (Kunde/Standort: fünfter Knopf neben Anrufen, E-Mail, Route, Webseite), Löschen unten links im Bearbeiten-Fenster.
- **Kopfleiste rechts:** Profilbild 40 px; Knöpfe davor mit 8 px Abstand, alle mittig auf einer Linie.
- **Knöpfe auf Karten** (z. B. Zoom und Info auf der Kundenkarte) stehen in derselben Flucht wie die Abschnittsknöpfe und Listenpfeile.
- **Hauptaktion:** der rote Knopf unten rechts (FAB), z. B. „+ Prüfung“, „+ Baustelle“. Höchstens einer pro Seite.
- **Seitenleiste / Tab-Leiste:** nur die großen Bereiche der App. Nachschlagewerke (Katalog) hängen an ihrem Bereich, nicht als eigener Punkt.

## Listen
- Oben die Suchleiste, rechts darin der Filterknopf (Sortieren + Filtern, `filter.js`).
- Ohne Suche und Filter: Kurzliste mit höchstens 5 Einträgen – erst „Angepinnt“, dann „Zuletzt bearbeitet“. Rechts im Abschnittskopf „Alle n“. Mit Suche oder Filter immer die ganze Liste.
- Rechtsklick (PC) bzw. lange drücken (mobil) auf einen Eintrag öffnet ein kleines Menü: Anpinnen, Löschen …
- Darunter ein Hinweis in Klein, was Rechtsklick/lange drücken macht.

## Abschnittskopf
- Titel links (roter `sec-lbl`, 16 px fett), rechts höchstens:
  - **„Alle n“** als Textknopf, wenn der Abschnitt gekürzt ist,
  - **runder, gefüllter Knopf** (`+`, Kamera …) zum direkten Anlegen in diesem Abschnitt.
- Den `+` gibt es nur, wenn die Seite **keinen FAB für dasselbe** hat – sonst zwei Knöpfe für eine Sache. Beispiel: Baustelle → Notizen und Übergaben je mit `+`; Prüfungsliste → FAB, kein `+` im Abschnitt.
- Nachschlage-Abschnitte (z. B. „Aus dem Katalog“) bekommen kein `+`, nur „Alle n“.
- Die Knöpfe rechts stehen in der Flucht der Pfeile (›) der Listenzeilen darunter.
- Code: außerhalb von Karten `kdKopf(titel, aktion, label)`, in Karten `karteKopf(titel, aktion, label)` (beide in `kunde.js`). Aussehen in `felder.css`.
- Keine „… hinzufügen“-Zeilen am Ende einer Liste mehr – das macht der `+` im Kopf. Leere Abschnitte sagen in einem Satz, was hier hinkommt.

## Kacheln (Katalog)
- Wie der Wallbox-Katalog in EVSE: Kachel mit weißem Bildfeld (4:3), darunter Name fett, eine Zeile Eckdaten, eine Zeile Art in Grau. Gruppiert nach Hersteller.
- Vorschau-Reihen (z. B. „Aus dem Katalog“) zeigen genau eine Reihe: Handy 2 × 2, iPad 4, Laptop 5, großer Monitor 6.
- Steckbrief-Seite: „Steckbrief“ mit Bild links und Daten rechts, darunter Aufklapper „Bei uns …“.

## Abgleich (Profilbild und Konto-Seite)
- Punkt am Profilbild: grün = abgeglichen, grau = offline, rot = Fehler oder Anmeldung abgelaufen (pulsiert langsam).
- Während des Abgleichs dreht ein feiner grüner Ring ums Profilbild, der Punkt pulsiert; danach „ploppt“ er einmal. Mindestens 0,9 s sichtbar.
- Konto-Seite (Profilbild antippen): direkt unter „Konto“ die Abgleich-Karte – Zustand, letzter Abgleich, wartende Änderungen; antippen = jetzt abgleichen bzw. neu anmelden.
- Konto-Seite (`kontoSeite` in `profil.js`), Reihenfolge in allen Apps: Konto · Abgleich-Karte · Darstellung (Darstellung, Start mit, Textgröße) · Apps · Dieses Gerät (Benachrichtigungen, Speicher) · Verwaltung (Mitarbeiter, Backup, Kundenordner) · App-Eigenes (EVSE: Wissen, Prüfungen/Archiv) · Info · Entwickler (inkl. Demo-Vorschau).
- „Backup“ (Sicherung erstellen/laden, Inhalt, Erinnerung) ist eine eigene Unterseite und nur für Chef und Entwickler sichtbar (`ME.admin`).
- Code: `syncAnzeige`, `syncKarte`, `backupView` in `profil.js`, Aussehen in `felder.css`.

## Bibliothek – Kundenordner
- Ordner-Ansicht: Alle Kunden › Kunde › sieben feste Ordner › Standort/Baustelle. Sie zeigt Dateien und zusätzlich Aufträge, Prüfungen ohne PDF, E-Checks und Baustellen als Einträge.
- Seltene Admin-Aktionen zu einem Datensatz (Zusammenführen, Löschen) stehen im Bearbeiten-Fenster, auf dem Handy über dem Fuß, auf dem PC im Fuß links.

## Konto-Unterseiten
- Zeilen mit Pfeil öffnen eine eigene Seite (Konto, Abgleich, Speicher, Mitarbeiter, Backup, Kundenordner); schnelle Auswahl ohne viel Inhalt (Darstellung, Start mit, Textgröße) bleibt ein kleines Fenster.
- Abgleich-Karte: Karte antippen öffnet die Seite „Abgleich“, der Knopf „Abgleichen“ gleicht sofort ab.
- Info: Liste (Entwicklung der Apps, Impressum, Datenschutz), darunter die Karte mit App-Symbol, Version und Firmenadresse – die Karte antippen öffnet „Über die App“.
- Profilbild bekommt auf der Konto-Seite keinen Ring (nur der Demo-Ring bleibt). „Entwickler“ ist einklappbar (je Gerät gemerkt).
- Datenschutz ist eine gemeinsame Seite für alle Apps (`datenschutzView` in `profil.js`).
- Code: `KONTO_SEITEN` in `profil.js`; die Apps hängen sie in `render()` ein.
