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

## 2. API-Berechtigungen (eingeschränkt auf eine SharePoint-Website)

Die Apps arbeiten **nur auf einer eigenen, geschützten SharePoint-Website** (z. B. „Prüfprotokolle“). Deshalb reicht `Sites.Selected` – die App sieht keine anderen Dateien, Websites oder OneDrives.

**API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Delegierte Berechtigungen**

- `User.Read` – Name und E-Mail des angemeldeten Mitarbeiters
- `Sites.Selected` – Zugriff nur auf die Website(s), für die die App ausdrücklich freigeschaltet wird
- `Files.ReadWrite.AppFolder` – *optional, für später:* persönliche Notizen im eigenen App-Ordner des Mitarbeiters im OneDrive (kein Zugriff auf andere Dateien)

Danach **„Administratorzustimmung für … erteilen“**.

**Freischalten der Website für die App** (einmalig, durch einen Admin), z. B. mit PnP PowerShell:

```powershell
Grant-PnPAzureADAppSitePermission -AppId "<Anwendungs-ID>" -DisplayName "Elektro Irrgang Apps" `
  -Site "https://<firma>.sharepoint.com/sites/Pruefprotokolle" -Permissions Write
```

(alternativ per Graph: `POST /sites/{site-id}/permissions` mit `roles: ["write"]` für die Anwendungs-ID). **Falls es bereits eine SharePoint-Ablage für Kundenunterlagen gibt:** dieselbe Freischaltung auch dort, damit die App fertige Prüfprotokolle zusätzlich im jeweiligen Kundenordner ablegen kann. Gibt es keine, legt die App die Kundenordner auf der Website „Prüfprotokolle“ selbst an. Zusätzlich brauchen die Mitarbeiter selbst **Bearbeiten**-Rechte auf der Website – bei delegierten Rechten gilt immer die Schnittmenge aus App-Freigabe und Benutzerrechten.

*Alternative:* Ohne eigene Website (Freigabe-Link auf einen Ordner) bräuchte die App `Files.ReadWrite.All`. Das ist nicht nötig, wenn die Website eingerichtet wird.

## 3. App-Rolle „Admin“ (für die Geschäftsleitung)

In der App gilt: Jeder bearbeitet nur seine eigenen Prüfungen, sieht aber alle. Wer die Rolle **Admin** hat, darf alle bearbeiten und löschen.

1. App-Registrierung → **App-Rollen → App-Rolle erstellen**
   - Anzeigename: `Admin`
   - Zulässige Mitgliedstypen: **Benutzer/Gruppen**
   - Wert: `Admin` (genau so geschrieben)
   - Beschreibung: `Darf alle Prüfprotokolle bearbeiten`
2. **Unternehmensanwendungen → EVSE-Prüfprotokoll → Benutzer und Gruppen → Benutzer hinzufügen** → Geschäftsführer der Rolle **Admin** zuweisen.
3. Unter **Eigenschaften** „Zuweisung erforderlich?“ = **Ja** und die Mitarbeiter **einzeln** zuweisen (ohne Rolle bzw. Rolle „Admin“). Dann können sich nur diese Personen anmelden. Einzelzuweisung geht mit den vorhandenen Lizenzen; eine Zuweisung über Gruppen bräuchte Entra ID P1 und ist bei der Teamgröße nicht nötig.

## 4. SharePoint-Website

- Eigene, geschützte SharePoint-Website, z. B. **„Prüfprotokolle“** (Mitglieder: nur die Mitarbeiter aus der Liste, Bearbeiten-Rechte).
- Benötigt wird die **Adresse der Website**, z. B. `https://<firma>.sharepoint.com/sites/Pruefprotokolle`. Soll die App in einem Unterordner arbeiten, die Adresse bis dorthin, z. B. `…/sites/Pruefprotokolle/Freigegebene Dokumente/Apps`.

**Eingerichtet (20.10.2026):** Website `https://elektroirrgang.sharepoint.com/sites/ElektroIrrgangApps` mit drei Bibliotheken. Die App verteilt die Daten so:

```
Kundendaten/_App-Daten/        kunden/ standorte/ einstellungen/ dateien/ vorgaenge/
Prüfprotokolle/<Kunde>/<Standort>/…pdf                    ← lesbare PDFs
Prüfprotokolle/_App-Daten/     ladeparks/ pruefungen/ katalog/ fotos/ (EVSE, E-Check)
Baustellen/_App-Daten/         baustellen/ eintraege/ material/ notizen/ fotos/ (Baustelle)
```

Die Zuordnung steht in `BIB` in jeder App. Fehlt eine Bibliothek, landet die Art in der Standard-Bibliothek der Website.

Persönliche Notizen („nur ich“) kommen **nicht** in diesen Ordner, sondern in den eigenen OneDrive des Mitarbeiters (App-Ordner). So kann sie auch niemand mit Ordnerrechten lesen.

Empfehlung: Ordner auf einer SharePoint-Teamwebsite statt im persönlichen OneDrive, damit die Daten nicht an ein einzelnes Benutzerkonto gebunden sind.

## 5. Bitte zurückmelden

| Wert | Wo zu finden |
|---|---|
| **Verzeichnis-ID (Mandanten-ID)** | App-Registrierung → Übersicht |
| **Anwendungs-ID (Client-ID)** | App-Registrierung → Übersicht |
| **Adresse der SharePoint-Website** | Website öffnen → Adresse aus der Adressleiste |
| *falls vorhanden:* **Adresse der Bibliothek mit den Kundenordnern** | Kundenordner-Bibliothek öffnen → Adresse aus der Adressleiste |

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
