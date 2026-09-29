"""Builds the Maximum Leverage bar-M symbol (from Weave pick g6) on one grid.

Grid: bar 12 units, gap 4 (3:1, the proportion that makes g6 read as M;
equal bars and gaps were tried and let the red gaps overpower the bars).
Four bars, 60 x 48 glyph. All four bar tops sit on a single V with a 3:4
fall (0.75), so the inner bars bottom out at 27 of 48. Square-cut bars.
Run: python3 build.py  (writes the SVGs next to this file)
"""
SIGNAL, CARBON = "#E5261A", "#0E0E0F"
B, G = 12, 4               # bar, gap
W, H = 4 * B + 3 * G, 48   # glyph box
FALL = 0.75                # V slope

def v(x):                  # top of the V at x (glyph coords)
    return FALL * min(x, W - x)

def bars(ox=0, oy=0, k=1.0):
    out = []
    for i in range(4):
        x0 = i * (B + G); x1 = x0 + B
        pts = [(x0, v(x0)), (x1, v(x1)), (x1, H), (x0, H)]
        out.append("M" + " L".join(f"{ox + k*x:g} {oy + k*y:g}" for x, y in pts) + " Z")
    return " ".join(out)

def svg(vb, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')

# 1. Untiled symbol: red bars, tight box
open("ml-symbol.svg", "w").write(svg(f"0 0 {W} {H}", f'<path fill="{SIGNAL}" d="{bars()}"/>', "Maximum Leverage"))

# 2. Tile: red squircle-free rounded square, bars knocked out (transparent)
T, R = 80, 16              # tile size, corner radius = 2 bars
ox, oy = (T - W) / 2, (T - H) / 2
tile = (f"M{R} 0 H{T-R} A{R} {R} 0 0 1 {T} {R} V{T-R} A{R} {R} 0 0 1 {T-R} {T} "
        f"H{R} A{R} {R} 0 0 1 0 {T-R} V{R} A{R} {R} 0 0 1 {R} 0 Z")
open("ml-symbol-tile.svg", "w").write(svg(f"0 0 {T} {T}", f'<path fill="{SIGNAL}" fill-rule="evenodd" d="{tile} {bars(ox, oy)}"/>', "Maximum Leverage"))

# 3. Tile on Carbon (for places that can't show transparency, e.g. social avatars)
open("ml-symbol-tile-carbon.svg", "w").write(svg(f"0 0 {T} {T}",
    f'<rect width="{T}" height="{T}" fill="{CARBON}"/><path fill="{SIGNAL}" fill-rule="evenodd" d="{tile} {bars(ox, oy)}"/>', "Maximum Leverage"))

# 4. Untiled symbol on Carbon, round-avatar safe (glyph at 56% of the circle)
A = 100; k = 56 / W
open("ml-avatar.svg", "w").write(svg(f"0 0 {A} {A}",
    f'<rect width="{A}" height="{A}" fill="{CARBON}"/><path fill="{SIGNAL}" d="{bars((A - W*k)/2, (A - H*k)/2 + 1, k)}"/>', "Maximum Leverage"))

# 5. 16px favicon, hinted by hand to whole pixels: 2px bars, 1px gaps, a 2px centre
#    gap so the V stays open, 45-degree tops, glyph 12 x 10 centred in the tile.
def fav_bar(x0, top_out, top_in, left_is_out):
    x1 = x0 + 2
    a, b = (top_out, top_in) if left_is_out else (top_in, top_out)
    return f"M{x0} {a} L{x1} {b} L{x1} 13 L{x0} 13 Z"
fb = " ".join([fav_bar(2, 3, 5, True), fav_bar(5, 6, 8, True), fav_bar(9, 6, 8, False), fav_bar(12, 3, 5, False)])
ftile = "M3 0 H13 A3 3 0 0 1 16 3 V13 A3 3 0 0 1 13 16 H3 A3 3 0 0 1 0 13 V3 A3 3 0 0 1 3 0 Z"
open("ml-favicon-16.svg", "w").write(svg("0 0 16 16", f'<path fill="{SIGNAL}" fill-rule="evenodd" d="{ftile} {fb}"/>', "Maximum Leverage"))
print("ok")
