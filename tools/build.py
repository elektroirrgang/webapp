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
# Bilder, die schon im SharePoint liegen (Stand der Liste bilder/alle.json), behalten ihre Zuordnung auch ohne Datei auf dem Server
_alle_json = root / "bilder" / "alle.json"
_IM_SP = set(json.loads(_alle_json.read_text(encoding="utf-8"))) if _alle_json.exists() else set()
BILDER = {u: n for u, n in (json.loads(_liste.read_text(encoding="utf-8")).items() if _liste.exists() else []) if (root / "bilder" / n).exists() or n in _IM_SP}



# ---- Hover nur für echte Maus (Max 13.11.2026) ----
# Am Handy bleibt ein :hover nach dem Antippen "hängen" (z. B. Kreis unter dem Zurück-Pfeil auf der nächsten Seite),
# manche Android-Geräte melden sogar (hover:hover). Darum wird beim Bauen JEDE :hover-Regel in den Haupt-<style>-Blöcken
# in @media (hover:hover) and (pointer:fine) gelegt; bestehende (hover:hover)-Abfragen bekommen "and (pointer:fine)" dazu.
# Quelltext bleibt unverändert, neue Regeln sind automatisch mit erfasst.
_HQ = "(hover:hover) and (pointer:fine)"
def _sel_teilen(sel):
    teile, tiefe, start = [], 0, 0
    for i, ch in enumerate(sel):
        if ch in "([": tiefe += 1
        elif ch in ")]": tiefe -= 1
        elif ch == "," and tiefe == 0: teile.append(sel[start:i]); start = i + 1
    teile.append(sel[start:]); return [t for t in (x.strip() for x in teile) if t]
def _block_ende(css, j):
    tiefe, i, n = 0, j, len(css)
    while i < n:
        if css.startswith("/*", i):
            k = css.find("*/", i + 2); i = n if k < 0 else k + 2; continue
        c = css[i]
        if c in "\"'":
            k = i + 1
            while k < n and css[k] != c:
                k += 2 if css[k] == "\\" else 1
            i = k + 1; continue
        if c == "{": tiefe += 1
        elif c == "}":
            tiefe -= 1
            if tiefe == 0: return i
        i += 1
    return n - 1
# zusätzlich: nach Bedienung mit dem Finger (Klasse "tipp" an <html>, setzt kopf.js) gilt kein :hover – auch wenn das Gerät "Maus" meldet.
# :where() hält die Spezifität gleich, die Reihenfolge der Regeln bleibt.
def _tipp(sel):
    return sel if re.match(r"^(:root|html)\b", sel) else ":where(html:not(.tipp)) " + sel
def hover_maus(css, in_hover=False, nur_tipp=False):
    out, i, n = [], 0, len(css)
    while i < n:
        if css[i].isspace():
            k = i
            while k < n and css[k].isspace(): k += 1
            out.append(css[i:k]); i = k; continue
        if css.startswith("/*", i):
            k = css.find("*/", i + 2); k = n if k < 0 else k + 2; out.append(css[i:k]); i = k; continue
        j = css.find("{", i); k = css.find("}", i)
        if j < 0 or (0 <= k < j): out.append(css[i:]); break
        kopf = css[i:j]; e = _block_ende(css, j); innen = css[j + 1:e]; pre = kopf.strip()
        if pre.startswith("@media"):
            hq = "hover:hover" in pre.replace(" ", "")
            if hq and "pointer:fine" not in pre.replace(" ", ""): kopf = re.sub(r"\(\s*hover\s*:\s*hover\s*\)", "(hover:hover) and (pointer:fine)", kopf)
            out.append(kopf + "{" + hover_maus(innen, in_hover or hq, hq) + "}")
        elif pre.startswith("@supports") or pre.startswith("@layer") or pre.startswith("@container"):
            out.append(kopf + "{" + hover_maus(innen, in_hover) + "}")
        elif pre.startswith("@") or ":hover" not in pre:
            out.append(css[i:e + 1])
        elif in_hover:   # schon in einer (hover:hover)-Abfrage: nur die Finger-Sperre ergänzen
            ws = kopf[:len(kopf) - len(kopf.lstrip())]
            S = _sel_teilen(pre); H = [x for x in S if ":hover" in x]; R = [x for x in S if ":hover" not in x]
            out.append(ws + ",".join(R + [_tipp(x) for x in H]) + "{" + innen + "}")
        else:
            ws = kopf[:len(kopf) - len(kopf.lstrip())]
            S = _sel_teilen(pre); H = [x for x in S if ":hover" in x]; R = [x for x in S if ":hover" not in x]
            if R: out.append(ws + ",".join(R) + "{" + innen + "}"); ws = ""
            out.append(ws + "@media " + _HQ + "{" + ",".join(_tipp(x) for x in H) + "{" + innen + "}}")
        i = e + 1
    return "".join(out)
def hover_html(html):
    teile, pos = [], 0
    for m in re.finditer(r"<style([^>]*)>(.*?)</style>", html, re.S):
        a = m.start(); s0 = html.rfind("<script", 0, a); s1 = html.rfind("</script>", 0, a)
        if s0 > s1: continue   # <style> in einem Script-Text (PDF, Etiketten …) – nicht anfassen
        teile.append(html[pos:m.start(2)]); teile.append(hover_maus(m.group(2))); pos = m.end(2)
    teile.append(html[pos:]); return "".join(teile)

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
    html = html.replace("/*KUNDE*/", (root / "src/kunde.js").read_text(encoding="utf-8") + "\n" + (root / "src/parken.js").read_text(encoding="utf-8") + "\n" + (root / "src/standort.js").read_text(encoding="utf-8") + "\n" + (root / "src/kdimport.js").read_text(encoding="utf-8") + "\n" + (root / "src/ki.js").read_text(encoding="utf-8") + "\n" + (root / "src/handbuch-link.js").read_text(encoding="utf-8") + "\n" + (root / "src/suche.js").read_text(encoding="utf-8") + "\n" + (root / "src/foto-markieren.js").read_text(encoding="utf-8") + "\n" + (root / "src/plausi.js").read_text(encoding="utf-8") + "\n" + (root / "src/rechner.js").read_text(encoding="utf-8") + "\n" + (root / "src/scanner.js").read_text(encoding="utf-8") + "\n" + (root / "src/bilder-sp.js").read_text(encoding="utf-8"))
    html = html.replace("/*ECHECKPRUEF*/", (root / "src/lbx-zip.js").read_text(encoding="utf-8") + "\n" + (root / "src/echeck-pruef.js").read_text(encoding="utf-8") + "\n" + (root / "src/wisch.js").read_text(encoding="utf-8") + "\n" + (root / "src/netzplan.js").read_text(encoding="utf-8") + "\n" + (root / "src/netzmessen.js").read_text(encoding="utf-8"))
    html = html.replace("/*LEGENDE*/", (root / "src/legende.js").read_text(encoding="utf-8"))
    html = html.replace("/*VERTEILER*/", (root / "src/verteiler.js").read_text(encoding="utf-8") + "\n" + (root / "src/material-daten.js").read_text(encoding="utf-8") + "\n" + (root / "src/vt-aufnahme.js").read_text(encoding="utf-8") + "\n" + (root / "src/zaehlerschrank.js").read_text(encoding="utf-8") + "\n" + (root / "src/zs-zeichnung.js").read_text(encoding="utf-8") + "\n" + (root / "src/vt-uebersicht.js").read_text(encoding="utf-8") + "\n" + (root / "src/anlagenpass.js").read_text(encoding="utf-8"))
    html = html.replace("/*QR*/", (root / "vendor/qrcode-generator.min.js").read_text(encoding="utf-8") + "\n" + (root / "src/qr-kern.js").read_text(encoding="utf-8") + "\n" + (root / "src/qr.js").read_text(encoding="utf-8") + "\n" + (root / "src/knx.js").read_text(encoding="utf-8") + "\n" + (root / "src/raumarten.js").read_text(encoding="utf-8") + "\n" + (root / "src/gebaeude-verw.js").read_text(encoding="utf-8") + "\n" + (root / "src/knx-projekt.js").read_text(encoding="utf-8"))
    html = html.replace("/*QRWB*/", (root / "vendor/qrcode-generator.min.js").read_text(encoding="utf-8") + "\n" + (root / "src/lbx-zip.js").read_text(encoding="utf-8") + "\n" + (root / "src/qr-kern.js").read_text(encoding="utf-8") + "\n" + (root / "src/qr-wb.js").read_text(encoding="utf-8"))
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
    html = hover_html(html)
    (root / ziel).write_text(html, encoding="utf-8")
    # Cache-Name des Service Workers folgt automatisch Version + Inhalt, nie mehr von Hand hochzählen
    sw = root / pathlib.Path(ziel).parent / "sw.js"
    h = hashlib.sha1(html.encode("utf-8")).hexdigest()[:8]
    t = sw.read_text(encoding="utf-8")
    t = re.sub(r'const CACHE = "([a-z]+)-v[^"]*"', lambda m: f'const CACHE = "{m.group(1)}-v{V}-{h}"', t, count=1)
    sw.write_text(t, encoding="utf-8")
    print(f"{ziel}: {len(html)} Zeichen, Cache {m.group(1) if (m:=re.search(r'const CACHE = \"([^\"]+)\"', t)) else '?'}")


# Liste aller Bilddateien auf dem Server – für den einmaligen Umzug in den SharePoint (bilder-sp.js)
_alle = sorted(str(p.relative_to(root / "bilder")) for p in (root / "bilder").rglob("*") if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"))
if _alle: (root / "bilder" / "alle.json").write_text(json.dumps(_alle, ensure_ascii=False), encoding="utf-8")   # nach dem Löschen der Dateien bleibt die letzte Liste stehen
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
    # Impressum und Datenschutz für die öffentlichen Seiten (QR-Seite, Anmeldeseiten) – /recht/
    r = (root / "src/recht.html").read_text(encoding="utf-8")
    r = r.replace("<!--LOGO_HELL-->", "data:image/png;base64," + b64("brand/logo-hell.png"))
    r = r.replace("<!--LOGO_DUNKEL-->", "data:image/png;base64," + b64("brand/logo-dunkel.png"))
    r = r.replace("<!--ICON_FAV-->", "data:image/png;base64," + b64("echeck/icon-rund-64.png"))
    for w in (400, 700, 800):
        r = r.replace(f"<!--F{w}-->", b64(f"vendor/fonts/manrope-latin-{w}-normal.woff2"))
    (root / "recht").mkdir(exist_ok=True)
    (root / "recht" / "index.html").write_text(r, encoding="utf-8")
    print(f"recht/index.html: {len(r)} Zeichen")


baue_qr()
