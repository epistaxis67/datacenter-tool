#!/usr/bin/env python3
"""Erzeugt Logo + Probesymbole fuer DATA CENTER (Marco Schmitt) als SVG.

Aufruf:  python3 build.py
Schreibt nach ./svg/ und ./vorschau.html
Alle Symbole nutzen currentColor, damit ein Tool sie frei einfaerben kann.
"""
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "svg"
OUT.mkdir(exist_ok=True)

RED = "#FF1F1F"
INK = "#111111"


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


# ---------------------------------------------------------------- Schrift
# Geometrische Strichschrift, Versalhoehe 100, Strich 11.
# Jede Glyphe: (Breite, [Pfade]) mit Ursprung oben links.
S = 13  # Strichstaerke
h = S / 2


def glyph(ch):
    if ch == "D":
        w = 72
        return w, [f"M{h},{-h} V{100+h} M{h},{h} H{28} A{50-h},{50-h} 0 0 1 {28},{100-h} H{h}"]
    if ch == "A":
        w = 92
        return w, [f"M0,{100+h} L{w/2},{-2} L{w},{100+h}", f"M{w*0.2},{68} H{w*0.8}"]
    if ch == "T":
        w = 76
        return w, [f"M0,{h} H{w}", f"M{w/2},{h} V{100+h}"]
    if ch in "CE":
        w = 86
        r = 50 - h
        cx, cy = 50, 50
        a = math.radians(42)  # Oeffnung rechts
        x1, y1 = cx + r * math.cos(a), cy - r * math.sin(a)
        x2, y2 = cx + r * math.cos(a), cy + r * math.sin(a)
        paths = [f"M{f(x1)},{f(y1)} A{r},{r} 0 1 0 {f(x2)},{f(y2)}"]
        if ch == "E":  # rundes Є mit Mittelbalken
            paths.append(f"M{h},50 H{w-6}")
        return w, paths
    if ch == "N":
        w = 74
        return w, [f"M{h},{100+h} V{h} L{w-h},{100-h} V{-h}"]
    if ch == "R":
        w = 74
        return w, [f"M{h},{100+h} V{h} H{34} A{26-h},{26-h} 0 0 1 {34},{52} H{h}", f"M{30},{52} L{w},{100+h}"]
    raise ValueError(ch)


def text_line(word, pitch, y):
    """Zeichenkette mit festem Mittenabstand (pitch), zentriert um x=0."""
    n = len(word)
    out = []
    for i, ch in enumerate(word):
        w, paths = glyph(ch)
        cx = (i - (n - 1) / 2) * pitch
        tx = cx - w / 2
        for p in paths:
            out.append(f'<path transform="translate({f(tx)},{f(y)})" d="{p}"/>')
    return out


FUTURA = ROOT / "futura_glyphs.json"


def futura_line(word, pitch, y):
    """Futura-Medium-Umrisse (aus futura_glyphs.json), Buchstabenmitten im Abstand pitch.
    E ist wie im Original eine Sonderform (gibt es in Futura nicht): schmales halbes Oval
    mit senkrecht abgeschnittenen Enden, halb so breit wie hoch, kuerzerer Mittelbalken."""
    import json
    data = json.loads(FUTURA.read_text(encoding="utf-8"))
    G, stem = data["glyphs"], data["stem"]
    G = dict(G, E=e_glyph(stem))
    n = len(word)
    out = []
    for i, ch in enumerate(word):
        g = G[ch]
        cx = (i - (n - 1) / 2) * pitch
        tx = cx - (g["x0"] + g["x1"]) / 2
        for d in [g["d"]] + g.get("extra", []):
            out.append(f'<path transform="translate({f(tx)},{f(y)})" d="{d}"/>')
    return out


E_WIDTH = 50  # Breite des E bei Versalhoehe 100 (aus dem Foto gemessen)


def e_glyph(stem):
    w = E_WIDTH
    tv = stem * 1.15     # senkrechte Strichstaerke (links im Bogen), optisch wie das C
    th = stem * 0.95     # waagrechte Strichstaerke (Arme, Balken)
    bowl = (f"M{f(w)},0 A{f(w)},50 0 0 0 {f(w)},100 V{f(100 - th)} "
            f"A{f(w - tv)},{f(50 - th)} 0 0 1 {f(w)},{f(th)} Z")
    bar_x0, bar_x1 = tv * 0.5, w - 5
    bar = (f"M{f(bar_x0)},{f(50 - th / 2)} H{f(bar_x1)} V{f(50 + th / 2)} "
           f"H{f(bar_x0)} Z")
    # Balken als eigener Pfad, sonst entsteht beim Ueberlappen ein Loch
    return {"d": bowl, "extra": [bar], "x0": 0, "x1": w}


def torn_shape(w, hgt, seed=7):
    """Rechteck mit ausgerissenem Rand, zentriert um 0,0."""
    rnd = random.Random(seed)
    pts = []
    x0, y0, x1, y1 = -w / 2, -hgt / 2, w / 2, hgt / 2
    edges = [((x0, y0), (x1, y0), (0, -1)), ((x1, y0), (x1, y1), (1, 0)),
             ((x1, y1), (x0, y1), (0, 1)), ((x0, y1), (x0, y0), (-1, 0))]
    walk = 0.0
    for (ax, ay), (bx, by), (nx, ny) in edges:
        length = math.hypot(bx - ax, by - ay)
        steps = int(length / 16)
        for i in range(steps):
            t = i / steps
            px, py = ax + (bx - ax) * t, ay + (by - ay) * t
            # langsamer Zufallsweg = grobe Buchten, dazu feines Splittern
            walk = max(-38, min(30, walk + rnd.uniform(-11, 11)))
            off = walk + rnd.uniform(-7, 7)
            # Ecken leicht einreissen
            if min(t, 1 - t) < 0.05:
                off -= 22
            pts.append((px + nx * off, py + ny * off))
            # gelegentlich ein Splitter: schmale Spitze zwischen zwei Punkten
            if rnd.random() < 0.10:
                sx, sy = px + (bx - ax) / length * 8, py + (by - ay) / length * 8
                spike = off + rnd.uniform(14, 32)
                pts.append((sx + nx * spike, sy + ny * spike))
    return "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts) + " Z"


def logo_svg(with_bg=True, text_color=INK, bg=RED):
    pitch1, pitch2 = 214, 152
    line_gap = 158
    top = -(100 + line_gap + 100) / 2
    body = []
    if with_bg:
        body.append(f'<path fill="{bg}" d="{torn_shape(1225, 690)}"/>')
    if FUTURA.exists():
        body.append(f'<g fill="{text_color}">')
        body += futura_line("DATA", pitch1, top)
        body += futura_line("CENTER", pitch2, top + 100 + line_gap)
    else:  # Ersatz ohne Futura-Daten: handgezeichnete Strichschrift
        body.append(f'<g fill="none" stroke="{text_color}" stroke-width="{S}" stroke-miterlimit="10">')
        body += text_line("DATA", pitch1, top)
        body += text_line("CENTER", pitch2, top + 100 + line_gap)
    body.append("</g>")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-680 -420 1360 840">'
            f'<title>DATA CENTER</title>{"".join(body)}</svg>')


# ---------------------------------------------------------------- Symbole
# Alle im Feld 200x200, Strich 6, Farbe = currentColor.
def sym(name, inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" '
            f'fill="none" stroke="currentColor" stroke-width="6">'
            f'<title>{name}</title>{inner}</svg>')


def chip():
    g = ['<rect x="55" y="55" width="90" height="90" rx="5" fill="currentColor" stroke="none"/>',
         '<rect x="70" y="70" width="60" height="60" rx="2" stroke="#fff" stroke-width="3" class="cut"/>']
    pins = []
    for i in range(7):
        p = 64 + i * 12
        pins += [f"M{p},55 V34", f"M{p},145 V166", f"M55,{p} H34", f"M145,{p} H166"]
    g.append(f'<path stroke-width="5" d="{" ".join(pins)}"/>')
    # Pin-Enden als Pads
    pads = []
    for i in range(7):
        p = 64 + i * 12
        for x, y in ((p, 30), (p, 170), (30, p), (170, p)):
            pads.append(f'<circle cx="{x}" cy="{y}" r="3.5" fill="currentColor" stroke="none"/>')
    g += pads
    # Leiterbahnen im Kern (ausgespart)
    g.append('<path class="cut" stroke="#fff" stroke-width="3" '
             'd="M80,80 H95 L105,90 V110 M120,80 V95 L110,105 H90 M80,120 H100 L110,110 M120,120 V112"/>')
    for x, y in ((80, 80), (120, 80), (80, 120), (120, 120)):
        g.append(f'<circle class="cut" cx="{x}" cy="{y}" r="3.5" fill="#fff" stroke="none"/>')
    return "".join(g)


def shattered_cube():
    # Isometrischer Wuerfel aus drei getrennten Flaechen, oben rechts aufgesprengt
    c = (92, 108)
    r = 58
    ang = [math.radians(-90 + 60 * k) for k in range(6)]
    V = [(c[0] + r * math.cos(a), c[1] + r * math.sin(a)) for a in ang]
    faces = [[c, V[5], V[0], V[1]], [c, V[1], V[2], V[3]], [c, V[3], V[4], V[5]]]

    def shrink(face, k=0.9):
        mx = sum(p[0] for p in face) / 4
        my = sum(p[1] for p in face) / 4
        return [(mx + (x - mx) * k, my + (y - my) * k) for x, y in face]

    out = ['<defs><mask id="crack"><rect width="200" height="200" fill="#fff"/>'
           '<path d="M92,108 L104,92 L99,80 L118,64 L114,52 L136,40" stroke="#000" stroke-width="5" fill="none"/>'
           '<path d="M104,92 L124,98 L132,86 L152,90" stroke="#000" stroke-width="4" fill="none"/>'
           '<path d="M99,80 L84,66 L88,54" stroke="#000" stroke-width="3" fill="none"/>'
           '</mask></defs><g mask="url(#crack)" stroke="none" fill="currentColor">']
    for face in faces:
        pts = " ".join(f"{f(x)},{f(y)}" for x, y in shrink(face))
        out.append(f'<polygon points="{pts}"/>')
    out.append("</g>")
    rnd = random.Random(3)
    for _ in range(26):
        a = math.radians(rnd.uniform(-115, 15))
        d = rnd.uniform(64, 92)
        x, y = c[0] + 20 + d * math.cos(a), c[1] - 10 + d * math.sin(a)
        s = rnd.uniform(2, 7) * (1.3 - (d - 64) / 60)
        rot = rnd.uniform(0, 360)
        pts = []
        for k in range(3):
            aa = math.radians(rot + k * 120 + rnd.uniform(-25, 25))
            pts.append(f"{f(x + s * math.cos(aa))},{f(y + s * math.sin(aa))}")
        if 0 < x < 200 and 0 < y < 200:
            out.append(f'<polygon points="{" ".join(pts)}" fill="currentColor" stroke="none"/>')
    return "".join(out)


def seal():
    out = ['<circle cx="100" cy="100" r="44"/>',
           '<rect x="70" y="70" width="60" height="60"/>',
           '<rect x="70" y="70" width="60" height="60" transform="rotate(45 100 100)"/>',
           '<circle cx="100" cy="100" r="22" stroke-width="4"/>']
    # Segmentierter Datenring
    rnd = random.Random(11)
    circ = 2 * math.pi * 70
    dash, total = [], 0
    while total < circ - 30:
        seg = rnd.choice([8, 14, 22, 34, 50])
        gap = rnd.choice([4, 4, 6, 10])
        dash += [seg, gap]
        total += seg + gap
    dash.append(circ - total)
    dash.append(0.001)
    out.append(f'<circle cx="100" cy="100" r="70" stroke-width="16" '
               f'stroke-dasharray="{" ".join(f(d) for d in dash)}" transform="rotate(-80 100 100)"/>')
    out.append('<circle cx="100" cy="100" r="88" stroke-width="3" stroke-dasharray="22 6 4 6"/>')
    out.append('<circle cx="100" cy="100" r="55" stroke-width="2"/>')
    return "".join(out)


def sun():
    out = ['<circle cx="100" cy="100" r="30"/>', '<circle cx="100" cy="100" r="38" stroke-width="2"/>']
    rays = []
    for k in range(48):
        a = math.radians(k * 7.5)
        r2 = 92 if k % 4 == 0 else (72 if k % 2 == 0 else 60)
        rays.append(f"M{f(100 + 44 * math.cos(a))},{f(100 + 44 * math.sin(a))} "
                    f"L{f(100 + r2 * math.cos(a))},{f(100 + r2 * math.sin(a))}")
    out.append(f'<path stroke-width="3" d="{" ".join(rays)}"/>')
    # Schaltkreis-Kreuz im Zentrum
    out.append('<path stroke-width="4" d="M100,76 V90 M100,110 V124 M76,100 H90 M110,100 H124 '
               'M90,90 H110 V110 H90 Z"/>')
    for x, y in ((100, 76), (100, 124), (76, 100), (124, 100)):
        out.append(f'<circle cx="{x}" cy="{y}" r="4" fill="currentColor" stroke="none"/>')
    out.append('<circle cx="100" cy="100" r="3.5" fill="currentColor" stroke="none"/>')
    return "".join(out)


def skull():
    head = ("M100,22 C148,22 166,56 162,92 C158,124 136,160 100,178 "
            "C64,160 42,124 38,92 C34,56 52,22 100,22 Z")
    holes = ['<ellipse cx="77" cy="86" rx="17" ry="13" transform="rotate(12 77 86)" fill="#000"/>',
             '<ellipse cx="123" cy="86" rx="17" ry="13" transform="rotate(-12 123 86)" fill="#000"/>',
             '<path d="M100,104 L92,122 H108 Z" fill="#000"/>']
    teeth = []
    for i, x in enumerate(range(78, 124, 9)):
        tilt = (x - 100) * 0.12
        teeth.append(f"M{x},{132 + abs(x-100)*0.15} L{f(x + tilt)},{158 - abs(x-100)*0.2}")
    return ('<defs><mask id="sk"><rect width="200" height="200" fill="#fff"/>'
            + "".join(holes)
            + f'<path d="{" ".join(teeth)}" stroke="#000" stroke-width="5" stroke-linecap="round"/>'
            + f'</mask></defs><path d="{head}" fill="currentColor" stroke="none" mask="url(#sk)"/>')


def fix_cuts(svg):
    """Ausgesparte Linien (class=cut) als Maske statt Weiss, damit es auf jedem Grund funktioniert."""
    return svg


SYMBOLS = {
    "chip": ("Chip", chip),
    "wuerfel": ("Zersprungener Würfel", shattered_cube),
    "siegel": ("Daten-Siegel", seal),
    "sonne": ("Strahlenkern", sun),
    "schaedel": ("Schädel", skull),
}


def chip_masked():
    """Chip mit echten Aussparungen (Maske) statt weisser Linien."""
    inner = chip()
    cuts = [p for p in inner.split("/>") if 'class="cut"' in p]
    mask = "".join(c.replace('stroke="#fff"', 'stroke="#000"').replace('fill="#fff"', 'fill="#000"') + "/>"
                   for c in cuts)
    rest = "".join(p + "/>" for p in inner.split("/>") if p and 'class="cut"' not in p)
    return (f'<defs><mask id="chipcut"><rect width="200" height="200" fill="#fff"/>{mask}</mask></defs>'
            f'<g mask="url(#chipcut)">{rest}</g>')


SYMBOLS["chip"] = ("Chip", chip_masked)


VORLAGE = ROOT / "vorlage" / "data-center-logo.svg"


def logo_from_vorlage():
    """Logo aus der Foto-Nachzeichnung (vorlage/data-center-logo.svg, mit ChatGPT erstellt).
    Liefert (logo_komplett, nur_schriftzug). Der Schriftzug nutzt currentColor."""
    import re
    src = VORLAGE.read_text(encoding="utf-8")
    letters = re.findall(r'<path id="letter-\d+" d="([^"]+)"', src)
    nums = [float(n) for d in letters for n in re.findall(r"-?\d+(?:\.\d+)?", d)]
    xs, ys = nums[0::2], nums[1::2]
    pad = 6
    x0, y0 = min(xs) - pad, min(ys) - pad
    w, hgt = max(xs) - min(xs) + 2 * pad, max(ys) - min(ys) + 2 * pad
    body = "".join(f'<path d="{d}"/>' for d in letters)
    schrift = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(hgt)}">'
               f'<title>DATA CENTER – Schriftzug</title>'
               f'<g fill="currentColor" fill-rule="evenodd">{body}</g></svg>')
    # Komplettlogo: feste Breite/Hoehe entfernen, damit es frei skaliert
    komplett = re.sub(r'<svg([^>]*?) width="\d+" height="\d+"', r"<svg\1", src, count=1)
    return komplett, schrift


def main():
    files = {}
    if VORLAGE.exists():
        files["logo.svg"], files["logo-schrift.svg"] = logo_from_vorlage()
        files["logo-futura-generiert.svg"] = logo_svg()  # eigener Nachbau, nur zum Vergleich
    else:
        files["logo.svg"] = logo_svg()
        files["logo-schrift.svg"] = logo_svg(with_bg=False)
    for key, (name, fn) in SYMBOLS.items():
        files[f"symbol-{key}.svg"] = sym(name, fn())
    for name, svg in files.items():
        (OUT / name).write_text(svg, encoding="utf-8")

    # Vorschau: Symbole inline, damit currentColor greift. IDs je Symbol eindeutig machen.
    cards = []
    for key, (name, fn) in SYMBOLS.items():
        svg = files[f"symbol-{key}.svg"]
        for mid in ("crack", "sk", "chipcut"):
            svg = svg.replace(f'id="{mid}"', f'id="{mid}-{{v}}"').replace(f"url(#{mid})", f"url(#{mid}-{{v}})")
        cards.append((name, key, svg))

    def tiles(variant):
        return "".join(
            f'<figure class="tile"><div class="g">{svg.replace("{v}", variant)}</div>'
            f"<figcaption>{name}</figcaption></figure>"
            for name, key, svg in cards)

    html = f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DATA CENTER – Probe</title>
<style>
:root{{--bg:#c9ccd1;--ink:#111;--red:{RED};--card:#e9eaed}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif;padding:24px 16px 60px}}
main{{max-width:1000px;margin:0 auto}}
h1{{font-size:14px;letter-spacing:.3em;text-transform:uppercase;margin:0 0 16px}}
h2{{font-size:12px;letter-spacing:.25em;text-transform:uppercase;margin:40px 0 12px;opacity:.7}}
.logo{{background:repeating-linear-gradient(#b9bcc2 0 3px,#d6d8dc 3px 6px);padding:40px 16px;border-radius:6px}}
.logo svg{{display:block;width:100%;max-width:720px;margin:0 auto}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}}
.tile{{margin:0;background:var(--card);border-radius:6px;padding:14px}}
.tile .g svg{{display:block;width:100%;height:auto}}
.tile figcaption{{font-size:12px;margin-top:8px;opacity:.75}}

.duo{{grid-template-columns:1fr 1fr}}.duo svg{{display:block;width:100%;height:auto}}
.dark .tile{{background:#111;color:var(--red)}}
.red .tile{{background:var(--red);color:#111}}
p{{max-width:640px}}
</style></head><body><main>
<h1>Data Center · Probe</h1>
<div class="logo">{files["logo.svg"]}</div>
<p>Logo: Nachzeichnung aus dem Foto (Vorlage von ChatGPT). Darunter der Schriftzug allein, frei einfärbbar.</p>
<div class="grid duo"><figure class="tile" style="color:#111">{files['logo-schrift.svg']}</figure><figure class="tile" style="background:#111;color:{RED}">{files['logo-schrift.svg']}</figure></div>
<h2>Probesymbole · Tinte auf Grau</h2><div class="grid">{tiles("a")}</div>
<h2>Rot auf Schwarz</h2><div class="grid dark">{tiles("b")}</div>
<h2>Schwarz auf Rot</h2><div class="grid red">{tiles("c")}</div>
</main></body></html>"""
    (ROOT / "vorschau.html").write_text(html, encoding="utf-8")
    print("geschrieben:", ", ".join(files), "+ vorschau.html")


def build_varianten():
    """engine.js + Logo-Formen + Symbole -> varianten.html und tool.html (je eine Datei, offline)."""
    import json, re
    if not VORLAGE.exists():
        return
    src = VORLAGE.read_text(encoding="utf-8")
    torn = re.search(r'<path id="red-background"[^>]* d="([^"]+)"', src).group(1)
    letters = [d for _, d in sorted(((int(i), d) for i, d in re.findall(r'<path id="letter-(\d+)" d="([^"]+)"', src)))]
    nums = [float(n) for d in letters for n in re.findall(r"-?\d+(?:\.\d+)?", d)]
    xs, ys = nums[0::2], nums[1::2]
    box = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]
    data = json.dumps({"torn": torn, "letters": letters, "box": [round(v, 2) for v in box]})
    syms = {}
    for key in ("chip", "wuerfel", "siegel", "sonne", "schaedel"):
        f_ = OUT / f"symbol-{key}.svg"
        if f_.exists():
            syms[key] = f_.read_text(encoding="utf-8").replace("<svg ", '<svg width="400" height="400" ', 1)
    engine = ((ROOT / "engine.js").read_text(encoding="utf-8")
              .replace("/*__LOGO_DATA__*/null", data)
              .replace("/*__SYMS__*/null", json.dumps(syms)))
    for name in ("varianten", "tool"):
        tpl = ROOT / f"{name}.template.html"
        if tpl.exists():
            html = tpl.read_text(encoding="utf-8").replace("/*__ENGINE__*/", engine)
            (ROOT / f"{name}.html").write_text(html, encoding="utf-8")
            print(f"geschrieben: {name}.html")
            if name == "tool":  # Startseite fuer GitHub Pages: Link ohne Dateinamen
                (ROOT / "index.html").write_text(html, encoding="utf-8")
                print("geschrieben: index.html")

if __name__ == "__main__":
    main()
    build_varianten()
