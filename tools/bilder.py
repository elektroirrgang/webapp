"""Herstellerbilder auf den eigenen Server holen (Datenschutz: keine IP-Adressen an Hersteller).

  python3 tools/bilder.py          → bilder/liste.json aus allen Bild-Adressen in src/ neu schreiben
  python3 tools/bilder.py --holen  → zusätzlich fehlende Bilder herunterladen (läuft in der GitHub Action,
                                      weil die Entwicklungsumgebung die Herstellerseiten nicht erreicht)
build.py setzt nur Bilder ein, deren Datei wirklich in bilder/ liegt; alle anderen bleiben bei der Original-Adresse."""
import hashlib, json, pathlib, re, sys, urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
ziel = root / "bilder"; ziel.mkdir(exist_ok=True)
MUSTER = re.compile(r"https://[^\"' )`\\]+?\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\"' )`\\]*)?", re.I)

def adressen():
    s = set()
    for f in sorted((root / "src").glob("*.*")):
        if f.suffix in (".html", ".js"):
            s.update(MUSTER.findall(f.read_text(encoding="utf-8")))
    return sorted(s)

def name(u):
    ext = re.search(r"\.(jpg|jpeg|png|webp|gif|avif)(?:\?|$)", u, re.I).group(1).lower()
    return hashlib.sha1(u.encode()).hexdigest()[:16] + "." + ("jpg" if ext == "jpeg" else ext)

liste = {u: name(u) for u in adressen()}
(ziel / "liste.json").write_text(json.dumps(liste, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
print(f"{len(liste)} Bild-Adressen")

if "--holen" in sys.argv:
    ok = neu = fehler = 0
    for u, n in liste.items():
        d = ziel / n
        if d.exists() and d.stat().st_size > 0:
            ok += 1; continue
        try:
            r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "Accept": "image/avif,image/webp,image/*,*/*"})
            with urllib.request.urlopen(r, timeout=30) as a:
                b = a.read(); t = a.headers.get("Content-Type", "")
            if len(b) < 200 or not (t.startswith("image/") or b[:4] in (b"\x89PNG", b"RIFF") or b[:3] == b"\xff\xd8\xff"):
                raise ValueError(f"kein Bild ({t}, {len(b)} Bytes)")
            d.write_bytes(b); neu += 1
        except Exception as e:
            fehler += 1; print("FEHLT", u, "–", e)
    print(f"vorhanden {ok}, neu {neu}, fehlgeschlagen {fehler}")
