"""Extract a glyph outline from a font as normalised SVG path data (used to build motif line art).

usage: python3 extract_glyph.py FONT.woff2 CODEPOINT_HEX [SIZE]
Prints JSON {d, w, h}: the path is scaled into a SIZE×SIZE box (y down), centred.
"""
import json
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
cp = int(sys.argv[2], 16)
size = float(sys.argv[3]) if len(sys.argv) > 3 else 100.0
gs = font.getGlyphSet()
name = font.getBestCmap()[cp]
bp = BoundsPen(gs)
gs[name].draw(bp)
x0, y0, x1, y1 = bp.bounds
w, h = x1 - x0, y1 - y0
s = size / max(w, h)
ox = (size - w * s) / 2 - x0 * s
oy = (size - h * s) / 2 + y1 * s
pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
gs[name].draw(TransformPen(pen, (s, 0, 0, -s, ox, oy)))
print(json.dumps({"d": pen.getCommands(), "w": size, "h": size}))
