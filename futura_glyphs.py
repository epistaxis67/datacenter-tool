#!/usr/bin/env python3
"""Einmalig: liest Futura Medium vom Mac und schreibt die Umrisse der Logo-Buchstaben
nach futura_glyphs.json (Versalhoehe = 100, y nach unten). Braucht fonttools.

Die Schriftdatei selbst wird NICHT weitergegeben, nur die Buchstabenumrisse des Logos.
"""
import json
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTCollection

FONT = "/System/Library/Fonts/Supplemental/Futura.ttc"
STYLE = "Futura Medium"
LETTERS = "DATCNRI"

font = next(f for f in TTCollection(FONT).fonts if f["name"].getDebugName(4) == STYLE)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
cap = font["OS/2"].sCapHeight
k = 100 / cap

out = {"style": STYLE, "glyphs": {}}
for ch in LETTERS:
    name = cmap[ord(ch)]
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    gs[name].draw(TransformPen(pen, (k, 0, 0, -k, 0, 100)))  # skalieren + y spiegeln
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    out["glyphs"][ch] = {"d": pen.getCommands(), "adv": gs[name].width * k,
                         "x0": x0 * k, "x1": x1 * k}

# Strichstaerke = Breite des I, fuer den Mittelbalken des Є
out["stem"] = out["glyphs"]["I"]["x1"] - out["glyphs"]["I"]["x0"]
Path(__file__).with_name("futura_glyphs.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
print("Strich:", round(out["stem"], 2))
