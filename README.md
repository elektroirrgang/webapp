# Elektro Irrgang · Web-Apps

Interne Web-Apps von Elektro Irrgang, Waldbröl: Übersicht (`/uebersicht/`), EVSE-Prüfprotokoll (`/evse/`), Baustelle (`/baustelle/`) und E-Check (`/echeck/`).

- Adresse: https://webapp.elektro-irrgang.de/ (Übergang: https://elektroirrgang.github.io/webapp/)
- Entwickelt von M. Pevec für Elektro Irrgang.
- Anbindung an Microsoft 365: siehe `EINRICHTUNG-MICROSOFT.md`.

Auf dem Server liegen **keine Kundendaten**, nur die leere App. Daten liegen auf den Geräten und (mit Anmeldung) im Microsoft-365-Ordner der Firma.

## Installation auf den Geräten

- **iPad/iPhone:** Adresse in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
- **Android:** Adresse in **Chrome** öffnen → ⋮ → „App installieren“. (Nicht über Samsung Internet – dort passt sich die Statusleiste nicht an.)

## Versionen

Die Versionsnummer steht in der Datei `VERSION` (Major.Minor.Patch). Bis zur 1.0.0 (mit Synchronisation) gilt: neue Funktionen erhöhen die mittlere Zahl, Korrekturen die letzte.

## Für Entwickler

- Quelltexte: `src/start.html` (Übersicht), `src/app.html` (EVSE), `src/baustelle.html`, `src/echeck.html`
- `python3 tools/build.py` baut daraus die `index.html` der vier Apps und setzt die Cache-Namen der Service Worker automatisch (Version + Inhalt).
