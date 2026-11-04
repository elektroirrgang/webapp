import base64, datetime, json, pathlib, shutil, subprocess

root = pathlib.Path(__file__).resolve().parent.parent
b64 = lambda p: base64.b64encode((root / p).read_bytes()).decode()
import hashlib, re
# Versionsnummer wird von Hand in der Datei VERSION gepflegt (Major.Minor.Patch, 1.0.0 = mit Synchronisation)
V = (root / "VERSION").read_text(encoding="utf-8").strip()
n = V
version = f"{V} · {datetime.date.today().strftime('%d.%m.%Y')}"


# Herstellerbilder vom eigenen Server: nur Einträge, deren Datei in bilder/ wirklich liegt (tools/bilder.py)
_liste = root / "bilder" / "liste.json"
BILDER = {u: n for u, n in (json.loads(_liste.read_text(encoding="utf-8")).items() if _liste.exists() else []) if (root / "bilder" / n).exists()}


def baue(quelle, ziel, icon):
    html = (root / quelle).read_text(encoding="utf-8")
    html = html.replace("/*PDFSTIL*/", (root / "src/pdfstil.js").read_text(encoding="utf-8"))
    html = html.replace("<!--JSPDF-->", (root / "vendor/jspdf.umd.min.js").read_text(encoding="utf-8"))
    html = html.replace("<!--MSAL-->", (root / "vendor/msal-browser-3.28.1.min.js").read_text(encoding="utf-8"))
    html = html.replace("<!--EHANDWERK-->", "data:image/jpeg;base64," + b64("brand/e-handwerk.jpg"))
    html = html.replace("<!--VERSION-->", version)
    html = html.replace("/*BIBLIOTHEK*/", (root / "src/bibliothek.js").read_text(encoding="utf-8") + "\n" + (root / "src/ablage.js").read_text(encoding="utf-8"))
    html = html.replace("/*DEMO*/", (root / "src/demo.js").read_text(encoding="utf-8") + "\n" + (root / "src/tour.js").read_text(encoding="utf-8"))
    html = html.replace("/*FELDER*/", (root / "src/felder.css").read_text(encoding="utf-8"))
    html = html.replace("/*KOPF*/", (root / "src/kopf.js").read_text(encoding="utf-8").replace("/*BILDER*/{}", json.dumps(BILDER, ensure_ascii=False)))
    html = html.replace("/*PROFIL*/", (root / "src/profil.js").read_text(encoding="utf-8") + "\n" + (root / "src/wuensche.js").read_text(encoding="utf-8"))
    html = html.replace("/*ANFORDERUNG*/", (root / "src/anforderung.js").read_text(encoding="utf-8"))
    html = html.replace("/*ABGLEICH*/", (root / "src/abgleich.js").read_text(encoding="utf-8"))
    html = html.replace("/*ANSCHLUSS*/", (root / "src/anschluss.js").read_text(encoding="utf-8").replace("/*MFTSVG*/\"\"", json.dumps((root / "src/geraete/pruefgeraet.svg").read_text(encoding="utf-8"), ensure_ascii=False)).replace("/*FEVSVG*/\"\"", json.dumps((root / "src/geraete/fev300.svg").read_text(encoding="utf-8"), ensure_ascii=False)))
    html = html.replace("/*FILTER*/", (root / "src/filter.js").read_text(encoding="utf-8"))
    html = html.replace("/*KUNDE*/", (root / "src/kunde.js").read_text(encoding="utf-8") + "\n" + (root / "src/ki.js").read_text(encoding="utf-8") + "\n" + (root / "src/handbuch-link.js").read_text(encoding="utf-8") + "\n" + (root / "src/suche.js").read_text(encoding="utf-8") + "\n" + (root / "src/foto-markieren.js").read_text(encoding="utf-8") + "\n" + (root / "src/plausi.js").read_text(encoding="utf-8") + "\n" + (root / "src/rechner.js").read_text(encoding="utf-8") + "\n" + (root / "src/scanner.js").read_text(encoding="utf-8"))
    html = html.replace("/*ECHECKPRUEF*/", (root / "src/echeck-pruef.js").read_text(encoding="utf-8"))
    html = html.replace("/*LEGENDE*/", (root / "src/legende.js").read_text(encoding="utf-8"))
    html = html.replace("/*VERTEILER*/", (root / "src/verteiler.js").read_text(encoding="utf-8") + "\n" + (root / "src/material-daten.js").read_text(encoding="utf-8") + "\n" + (root / "src/vt-aufnahme.js").read_text(encoding="utf-8") + "\n" + (root / "src/zaehlerschrank.js").read_text(encoding="utf-8") + "\n" + (root / "src/zs-zeichnung.js").read_text(encoding="utf-8") + "\n" + (root / "src/vt-uebersicht.js").read_text(encoding="utf-8") + "\n" + (root / "src/anlagenpass.js").read_text(encoding="utf-8"))
    html = html.replace("/*QR*/", (root / "vendor/qrcode-generator.min.js").read_text(encoding="utf-8") + "\n" + (root / "src/qr.js").read_text(encoding="utf-8") + "\n" + (root / "src/knx.js").read_text(encoding="utf-8"))
    html = html.replace("/*PDFANSICHT*/", (root / "src/pdfansicht.js").read_text(encoding="utf-8"))
    html = html.replace("/*HANDBUCH*/", (root / "src/handbuch-vorlage.js").read_text(encoding="utf-8") + "\n" + (root / "src/handbuch.js").read_text(encoding="utf-8"))
    html = html.replace("/*FRISTEN*/", (root / "src/fristen.js").read_text(encoding="utf-8") + "\n" + (root / "src/betrieb.js").read_text(encoding="utf-8"))
    html = html.replace("/*DATEIEN*/", (root / "src/dateien.js").read_text(encoding="utf-8"))
    html = html.replace("/*VORGAENGE*/", (root / "src/vorgaenge.js").read_text(encoding="utf-8"))
    html = html.replace("/*ANLAGEN*/", (root / "src/anlagen.js").read_text(encoding="utf-8"))
    html = html.replace("/*KALENDER*/", (root / "src/kalender.js").read_text(encoding="utf-8"))
    html = html.replace("/*MATERIAL*/", (root / "src/material-daten.js").read_text(encoding="utf-8") + "\n" + (root / "src/material.js").read_text(encoding="utf-8"))
    html = html.replace("/*ZEICHNEN*/", (root / "src/zeichnen.js").read_text(encoding="utf-8"))
    html = html.replace("/*AUFNAHME*/", (root / "src/aufnahme.js").read_text(encoding="utf-8") + "\n" + (root / "src/abnahme.js").read_text(encoding="utf-8") + "\n" + (root / "src/schreiben.js").read_text(encoding="utf-8") + "\n" + (root / "src/texte.js").read_text(encoding="utf-8"))
    html = html.replace('href="manifest.webmanifest"', f'href="manifest.webmanifest?v={n}"')
    html = html.replace("<!--ICON_FAV-->", "data:image/png;base64," + b64(icon.split("/")[0] + "/icon-rund-64.png"))  # abgerundet für den Browser-Tab
    html = html.replace("<!--ICON-->", "data:image/png;base64," + b64(icon))
    html = html.replace("<!--ICON_START-->", "data:image/png;base64," + b64("uebersicht/icon-180.png"))
    html = html.replace("<!--ICON_EVSE-->", "data:image/png;base64," + b64("evse/icon-180.png"))
    html = html.replace("<!--ICON_BAU-->", "data:image/png;base64," + b64("baustelle/icon-180.png"))
    html = html.replace("<!--ICON_ECHECK-->", "data:image/png;base64," + b64("echeck/icon-180.png"))
    html = html.replace("<!--LOGO_HELL-->", "data:image/png;base64," + b64("brand/logo-hell.png"))
    html = html.replace("<!--LOGO_DUNKEL-->", "data:image/png;base64," + b64("brand/logo-dunkel.png"))
    for w in (400, 600, 700, 800):
        html = html.replace(f"<!--F{w}-->", b64(f"vendor/fonts/manrope-latin-{w}-normal.woff2"))
    (root / ziel).write_text(html, encoding="utf-8")
    # Cache-Name des Service Workers folgt automatisch Version + Inhalt, nie mehr von Hand hochzählen
    sw = root / pathlib.Path(ziel).parent / "sw.js"
    h = hashlib.sha1(html.encode("utf-8")).hexdigest()[:8]
    t = sw.read_text(encoding="utf-8")
    t = re.sub(r'const CACHE = "([a-z]+)-v[^"]*"', lambda m: f'const CACHE = "{m.group(1)}-v{V}-{h}"', t, count=1)
    sw.write_text(t, encoding="utf-8")
    print(f"{ziel}: {len(html)} Zeichen, Cache {m.group(1) if (m:=re.search(r'const CACHE = \"([^\"]+)\"', t)) else '?'}")


baue("src/start.html", "uebersicht/index.html", "uebersicht/icon-180.png")
baue("src/app.html", "evse/index.html", "evse/icon-180.png")
baue("src/baustelle.html", "baustelle/index.html", "baustelle/icon-180.png")
baue("src/echeck.html", "echeck/index.html", "echeck/icon-180.png")


for app in ("evse", "uebersicht", "baustelle", "echeck"):
    (root / app / "pdfjs").mkdir(exist_ok=True)
    for f in ("pdf.min.js", "pdf.worker.min.js"):
        shutil.copyfile(root / "vendor/pdfjs" / f, root / app / "pdfjs" / f)


# Öffentliche Info-Seite hinter den QR-Aufklebern (/q/) – ohne Daten, nur Kontakt; angemeldete Mitarbeiter gehen weiter in die App
def baue_qr():
    html = (root / "src/qr-seite.html").read_text(encoding="utf-8")
    html = html.replace("<!--LOGO_HELL-->", "data:image/png;base64," + b64("brand/logo-hell.png"))
    html = html.replace("<!--LOGO_DUNKEL-->", "data:image/png;base64," + b64("brand/logo-dunkel.png"))
    html = html.replace("<!--ICON_FAV-->", "data:image/png;base64," + b64("echeck/icon-rund-64.png"))
    for w in (400, 700, 800):
        html = html.replace(f"<!--F{w}-->", b64(f"vendor/fonts/manrope-latin-{w}-normal.woff2"))
    (root / "q").mkdir(exist_ok=True)
    (root / "q" / "index.html").write_text(html, encoding="utf-8")
    shutil.copyfile(root / "src/fi-pruefung.ics", root / "q" / "fi-pruefung.ics")
    print(f"q/index.html: {len(html)} Zeichen")


baue_qr()
