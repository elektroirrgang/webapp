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
- **Aktionen zur Seite:** im ⋮-Menü der App, nicht als Knöpfe im Inhalt.
- **Hauptaktion:** der rote Knopf unten rechts (FAB), z. B. „+ Prüfung“, „+ Baustelle“. Höchstens einer pro Seite.
- **Seitenleiste / Tab-Leiste:** nur die großen Bereiche der App. Nachschlagewerke (Katalog) hängen an ihrem Bereich, nicht als eigener Punkt.

## Listen
- Oben die Suchleiste, rechts darin der Filterknopf (Sortieren + Filtern, `filter.js`).
- Ohne Suche und Filter: Kurzliste mit höchstens 5 Einträgen – erst „Angepinnt“, dann „Zuletzt bearbeitet“. Rechts im Abschnittskopf „Alle n“. Mit Suche oder Filter immer die ganze Liste.
- Rechtsklick (PC) bzw. lange drücken (mobil) auf einen Eintrag öffnet ein kleines Menü: Anpinnen, Löschen …
- Darunter ein Hinweis in Klein, was Rechtsklick/lange drücken macht.

## Abschnittskopf
- Titel links (roter `sec-lbl`), rechts höchstens:
  - **„Alle n“** als Textknopf, wenn der Abschnitt gekürzt ist,
  - **runder, gefüllter Knopf** (`+`, Kamera …) zum direkten Anlegen in diesem Abschnitt.
- Den `+` gibt es nur, wenn die Seite **keinen FAB für dasselbe** hat – sonst zwei Knöpfe für eine Sache. Beispiel: Baustelle → Notizen und Übergaben je mit `+`; Prüfungsliste → FAB, kein `+` im Abschnitt.
- Nachschlage-Abschnitte (z. B. „Aus dem Katalog“) bekommen kein `+`, nur „Alle n“.
- Code: außerhalb von Karten `kdKopf(titel, aktion, label)`, in Karten `karteKopf(titel, aktion, label)` (beide in `kunde.js`). Aussehen in `felder.css`.
- Keine „… hinzufügen“-Zeilen am Ende einer Liste mehr – das macht der `+` im Kopf. Leere Abschnitte sagen in einem Satz, was hier hinkommt.

## Kacheln (Katalog)
- Wie der Wallbox-Katalog in EVSE: Kachel mit weißem Bildfeld (4:3), darunter Name fett, eine Zeile Eckdaten, eine Zeile Art in Grau. Gruppiert nach Hersteller.
- Vorschau-Reihen (z. B. „Aus dem Katalog“) zeigen genau eine Reihe: Handy 2 × 2, iPad 4, Laptop 5, großer Monitor 6.
- Steckbrief-Seite: „Steckbrief“ mit Bild links und Daten rechts, darunter Aufklapper „Bei uns …“.
