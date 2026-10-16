# Irrgang Apps – Anbindung an Microsoft 365

Gilt für alle Apps (Startseite, EVSE, Baustelle, später Hausinstallation): **eine** App-Registrierung, **ein** freigegebener Ordner.

Die App ist eine Web-App (eine HTML-Datei, läuft offline auf den iPads). Damit die Prüfprotokolle aller Mitarbeiter in einem gemeinsamen Ordner der Firma landen, meldet sich jeder Nutzer einmal mit seinem Microsoft-Mitarbeiterkonto an. Die App liest und schreibt dann über **Microsoft Graph** direkt in den freigegebenen Ordner. Ein eigener Server ist nicht nötig.

Benötigt wird eine **App-Registrierung in Microsoft Entra ID**. Aufwand für einen Admin: ca. 15 Minuten.

## 1. App registrieren

Entra Admin Center → **Identität → Anwendungen → App-Registrierungen → Neue Registrierung**

| Feld | Wert |
|---|---|
| Name | `EVSE-Prüfprotokoll` |
| Unterstützte Kontotypen | **Nur Konten in diesem Organisationsverzeichnis** (Single Tenant) |
| Umleitungs-URI – Plattform | **Single-Page-Anwendung (SPA)** |
| Umleitungs-URIs – Adressen | `https://webapp.elektro-irrgang.de/uebersicht/`<br>`https://webapp.elektro-irrgang.de/evse/`<br>`https://webapp.elektro-irrgang.de/baustelle/`<br>`https://webapp.elektro-irrgang.de/echeck/`<br>`https://elektroirrgang.github.io/webapp/uebersicht/`<br>`https://elektroirrgang.github.io/webapp/evse/`<br>`https://elektroirrgang.github.io/webapp/baustelle/`<br>`https://elektroirrgang.github.io/webapp/echeck/` |

Eine Registrierung („Elektro Irrgang Apps“) gilt für alle Apps. Die Adressen unter `elektroirrgang.github.io` gelten nur für die Übergangszeit, bis `webapp.elektro-irrgang.de` eingerichtet ist; danach können sie entfernt werden. Die Adressen müssen **genau so** eingetragen werden, mit `https://` und dem Schrägstrich am Ende.

Kein Client-Geheimnis und kein Zertifikat nötig: Die Anmeldung läuft als SPA mit PKCE.

## 2. API-Berechtigungen

**API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Delegierte Berechtigungen**

- `User.Read` – Name und E-Mail des angemeldeten Mitarbeiters
- `Files.ReadWrite.All` – Lesen/Schreiben im freigegebenen Ordner (im Namen des angemeldeten Nutzers, nur dort, wo der Nutzer ohnehin Rechte hat)
- `Mail.Send` – *optional:* fertige Prüfprotokolle direkt aus der App vom Konto des angemeldeten Mitarbeiters an info@elektro-irrgang.de senden (nur im Namen des angemeldeten Nutzers, kein Zugriff auf Postfächer)

Danach **„Administratorzustimmung für … erteilen“**.

*Alternative mit geringeren Rechten:* Liegt der Ordner auf einer **SharePoint-Teamwebsite** (nicht im OneDrive einer Person), kann statt `Files.ReadWrite.All` auch `Sites.Selected` verwendet werden; dann muss der Website zusätzlich gezielt Schreibzugriff für die App erteilt werden. Bitte kurz Bescheid geben, falls dieser Weg gewünscht ist.

## 3. App-Rolle „Admin“ (für die Geschäftsleitung)

In der App gilt: Jeder bearbeitet nur seine eigenen Prüfungen, sieht aber alle. Wer die Rolle **Admin** hat, darf alle bearbeiten und löschen.

1. App-Registrierung → **App-Rollen → App-Rolle erstellen**
   - Anzeigename: `Admin`
   - Zulässige Mitgliedstypen: **Benutzer/Gruppen**
   - Wert: `Admin` (genau so geschrieben)
   - Beschreibung: `Darf alle Prüfprotokolle bearbeiten`
2. **Unternehmensanwendungen → EVSE-Prüfprotokoll → Benutzer und Gruppen → Benutzer hinzufügen** → Geschäftsführer der Rolle **Admin** zuweisen.
3. Empfohlen: Unter **Eigenschaften** „Zuweisung erforderlich?“ = **Ja** und alle Mitarbeiter, die prüfen, zuweisen (ohne Rolle oder als Gruppe). Dann können sich nur diese Personen anmelden.

## 4. Ordner

- Ordner **„Prüfprotokolle“** auf einer SharePoint-Teamwebsite (empfohlen) oder im OneDrive der Geschäftsleitung.
- Alle prüfenden Mitarbeiter brauchen **Bearbeiten**-Rechte auf diesen Ordner.
- Benötigt wird der **Freigabe-Link** des Ordners (Ordner → Teilen → Link kopieren).

Die App legt darin an:

```
<freigegebener Ordner>/
  <Kunde>/<Standort>/[<Ladepark>/]<Auftragsnr>_<Prüfart>_….pdf   ← lesbare PDFs aus EVSE
  _App-Daten/                                                   ← Daten der Apps, bitte nicht von Hand ändern
    kunden/ standorte/                ← gemeinsame Kundendatenbank aller Apps
    ladeparks/ pruefungen/ katalog/   ← EVSE
    baustellen/ eintraege/            ← Baustelle
    einstellungen/                    ← Mitarbeiterliste, Protokoll-Empfänger
    fotos/ dateien/                   ← Fotos, Kunden-Ablage
```

Persönliche Notizen („nur ich“) kommen **nicht** in diesen Ordner, sondern in den eigenen OneDrive des Mitarbeiters (App-Ordner). So kann sie auch niemand mit Ordnerrechten lesen.

Empfehlung: Ordner auf einer SharePoint-Teamwebsite statt im persönlichen OneDrive, damit die Daten nicht an ein einzelnes Benutzerkonto gebunden sind.

## 5. Bitte zurückmelden

| Wert | Wo zu finden |
|---|---|
| **Verzeichnis-ID (Mandanten-ID)** | App-Registrierung → Übersicht |
| **Anwendungs-ID (Client-ID)** | App-Registrierung → Übersicht |
| **Freigabe-Link des Ordners** | Ordner → Teilen → Link kopieren |

Diese drei Werte werden in der App eingetragen (`CONFIG` am Anfang von `src/app.html`). Geheim sind sie nicht – es sind keine Passwörter.

## So funktioniert der Abgleich

Es gibt **keinen eigenen Server**. Die App spricht direkt mit Microsoft Graph – immer im Namen und mit den Rechten der angemeldeten Person.

1. **Jedes Gerät hat eine vollständige Kopie** im Browser-Speicher. Die Apps funktionieren dadurch auch ohne Netz (Keller, Tiefgarage).
2. **Jeder Datensatz ist eine kleine Datei** (`<id>.json`, wenige KB) im passenden Unterordner von `_App-Daten`. Eine Prüfung = eine Datei, ein Kunde = eine Datei.
3. **Hochladen:** Änderungen werden auf dem Gerät markiert und ca. 2 Sekunden später hochgeladen. Ohne Netz bleiben sie in der Warteschlange, bis wieder Verbindung besteht.
4. **Herunterladen:** beim Öffnen der App, beim Zurückkehren in die App, alle 2 Minuten während sie offen ist und über „Jetzt abgleichen“. Es werden nur Dateien geladen, deren Versionskennung (eTag) sich geändert hat.
5. **Gleichzeitige Änderung:** Beim Hochladen prüft SharePoint die Version (`If-Match`). Hat jemand dieselbe Datei inzwischen geändert, gewinnt die **neuere** Änderung; die App zeigt dann einen Hinweis. Zusammengeführt wird nicht feldweise. Da Prüfungen und Übergaben nur der Ersteller (oder ein Admin) bearbeitet, kommt das praktisch kaum vor.
6. **Löschen:** Datensätze werden als gelöscht markiert statt entfernt, damit alle Geräte davon erfahren.
7. **Fotos und PDFs** laufen über eine eigene Warteschlange. Fotos werden vorher verkleinert. PDFs über 3,5 MB werden in Teilen hochgeladen.

**Wer was sehen darf, regelt SharePoint:** Wer Rechte auf den freigegebenen Ordner hat, kann die Apps nutzen. Wer sie verliert (z. B. ausgeschieden), bekommt keine Daten mehr – auch nicht, wenn die App noch auf seinem Gerät liegt. Daten, die schon auf seinem Gerät liegen, bleiben dort, bis die App gelöscht wird; deshalb Firmengeräte bei Austritt zurücksetzen bzw. die App entfernen.

**Mengengerüst:** einige hundert bis tausend kleine JSON-Dateien pro Jahr plus Fotos (je ca. 0,2–0,5 MB) und PDFs. Für SharePoint unkritisch.

**Stand:** Der Abgleich ist gegen eine nachgebaute Microsoft-Schnittstelle getestet (drei Geräte, Konflikte, PDF-Ablage, Katalog), noch nicht gegen den echten Mandanten. Der erste echte Test folgt direkt nach der Einrichtung.

## Eigene Adresse (DNS)

Zwei Einträge bei der Domain elektro-irrgang.de:

```
Typ    Name                                     Wert
CNAME  webapp                                   elektroirrgang.github.io.
TXT    _github-pages-challenge-elektroirrgang   5ad4e9daec1712b04a0c371c3c8a01
```

Der TXT-Eintrag bestätigt GitHub, dass die Domain der Firma gehört (Schutz gegen Übernahme der Subdomain). Bestehende Einträge (Website, Mail) bleiben unverändert.

## Gut zu wissen

- **Datenschutz:** Kundendaten liegen ausschließlich im Microsoft-365-Mandanten der Firma und auf den iPads. GitHub stellt nur die leere App bereit.
- **Offline:** Ohne Netz wird auf dem iPad gespeichert und später abgeglichen.
- **Rechte:** „Nur der Ersteller bearbeitet“ wird von der App durchgesetzt. Wer Schreibrechte auf den Ordner hat, könnte die Dateien technisch auch direkt in OneDrive/SharePoint ändern. Das ist bei einem gemeinsamen Ordner unvermeidbar; der Ordner `_App-Daten` sollte daher nicht von Hand bearbeitet werden.
- **Anmeldung:** Microsoft-Standardanmeldung (MSAL.js, Version 3.28.1, in die App eingebettet). Bedingter Zugriff und MFA des Mandanten gelten wie gewohnt.
