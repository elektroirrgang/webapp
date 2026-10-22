"""Abgerundete App-Symbole für PC (Windows/macOS/Chrome-Tab) und Android-Fallback.
Quelle ist das quadratische icon-512.png jeder App (bleibt unverändert, ebenso icon-180 fürs iPhone/iPad – iOS rundet selbst
und macht durchsichtige Ecken schwarz). Ergebnis: icon-rund-<größe>.png mit durchsichtigen Ecken.
Aufruf: python3 tools/icons_rund.py"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
root = Path(__file__).resolve().parent.parent
RAND, RADIUS, SS = 0.035, 0.225, 4   # Abstand zum Rand, Eckenradius (Anteil der Kachel), Kantenglättung
INHALT = {32: 0.94, 64: 0.88, 192: 0.84, 512: 0.84}   # Symbol innerhalb der Kachel kleiner, damit es nicht an die runden Ecken stößt
for app in ["uebersicht", "evse", "baustelle", "echeck"]:
    src = Image.open(root / app / "icon-512.png").convert("RGBA")
    for g in [32, 64, 192, 512]:
        G = g * SS; m = round(G * RAND); w = G - 2 * m
        kachel = Image.new("RGBA", (w, w), (255, 255, 255, 255)); i = round(w * INHALT[g]); kachel.paste(src.resize((i, i), Image.LANCZOS), ((w - i) // 2, (w - i) // 2))
        maske = Image.new("L", (w, w), 0); ImageDraw.Draw(maske).rounded_rectangle([0, 0, w - 1, w - 1], radius=round(w * RADIUS), fill=255)
        bild = Image.new("RGBA", (G, G), (0, 0, 0, 0))
        if g >= 64:   # ganz leichter Schatten, damit das weiße Symbol auf hellem Grund nicht verschwimmt
            sch = Image.new("L", (G, G), 0); sch.paste(maske, (m, m + round(G * .008)))
            sch = sch.filter(ImageFilter.GaussianBlur(G * .012)).point(lambda v: v * 0.22)
            bild.putalpha(sch)
        bild.paste(kachel, (m, m), maske)
        bild.resize((g, g), Image.LANCZOS).save(root / app / f"icon-rund-{g}.png", optimize=True)
    print(app, "ok")
