import base64, datetime, pathlib, shutil, subprocess

root = pathlib.Path(__file__).resolve().parent.parent
b64 = lambda p: base64.b64encode((root / p).read_bytes()).decode()
import hashlib, re
# Versionsnummer wird von Hand in der Datei VERSION gepflegt (Major.Minor.Patch, 1.0.0 = mit Synchronisation)
V = (root / "VERSION").read_text(encoding="utf-8").strip()
n = V
version = f"{V} · {datetime.date.today().strftime('%d.%m.%Y')}"


def baue(quelle, ziel, icon):
    html = (root / quelle).read_text(encoding="utf-8")
    html = html.replace("<!--JSPDF-->", (root / "vendor/jspdf.umd.min.js").read_text(encoding="utf-8"))
    html = html.replace("<!--MSAL-->", (root / "vendor/msal-browser-3.28.1.min.js").read_text(encoding="utf-8"))
    html = html.replace("<!--EHANDWERK-->", "data:image/jpeg;base64," + b64("brand/e-handwerk.jpg"))
    html = html.replace("<!--VERSION-->", version)
    html = html.replace("/*DEMO*/", (root / "src/demo.js").read_text(encoding="utf-8"))
    html = html.replace("/*PROFIL*/", (root / "src/profil.js").read_text(encoding="utf-8"))
    html = html.replace("/*ANFORDERUNG*/", (root / "src/anforderung.js").read_text(encoding="utf-8"))
    html = html.replace("/*VORGAENGE*/", (root / "src/vorgaenge.js").read_text(encoding="utf-8"))
    html = html.replace("/*MATERIAL*/", (root / "src/material.js").read_text(encoding="utf-8"))
    html = html.replace("/*ZEICHNEN*/", (root / "src/zeichnen.js").read_text(encoding="utf-8"))
    html = html.replace("/*AUFNAHME*/", (root / "src/aufnahme.js").read_text(encoding="utf-8"))
    html = html.replace('href="manifest.webmanifest"', f'href="manifest.webmanifest?v={n}"')
    html = html.replace("<!--ICON-->", "data:image/png;base64," + b64(icon))
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


for app in ("evse", "uebersicht", "baustelle"):
    (root / app / "pdfjs").mkdir(exist_ok=True)
    for f in ("pdf.min.js", "pdf.worker.min.js"):
        shutil.copyfile(root / "vendor/pdfjs" / f, root / app / "pdfjs" / f)
