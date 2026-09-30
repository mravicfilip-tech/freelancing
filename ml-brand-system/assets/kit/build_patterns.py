"""Brand patterns, all derived from the mark (60 degree bars, 2 : 3 : 4 rhythm, the lever).

Tiles are seamless SVGs for backgrounds (CSS background-image or a Figma pattern fill).
Panels are fixed-size graphics that don't repeat (rising dots, supergraphic, step band).
Run: python3 build_patterns.py, then node render.cjs patterns/jobs.json
"""
import json, math, os
from geometry import *

HERE = os.path.dirname(os.path.abspath(__file__))
TILES = os.path.join(HERE, "patterns", "tiles")
PANELS = os.path.join(HERE, "patterns", "panels")
PREV = os.path.join(HERE, "patterns", "preview")
for d in (TILES, PANELS, PREV):
    os.makedirs(d, exist_ok=True)

# colourways: background, pattern ink (tonal, low contrast), strong ink (for panels)
WAYS = {
    "carbon": (CARBON, "#1D1D20", SIGNAL),
    "chalk":  (CHALK, "#E2E0DA", SIGNAL),
    "signal": (SIGNAL, "#CF1F14", CHALK),
}
BARS = [capsule(b, D, l) for b, l in zip(BASES, LENS)]
LEVER = lever_path()
SYM = "".join(f'<path d="{p}"/>' for p in BARS + [LEVER])
TRIPLET = "".join(f'<path d="{p}"/>' for p in BARS)
PEAK = f'<path d="{BARS[2]}"/><path d="{LEVER}"/>'   # tall bar plus lever: the peak


def wrap(w, h, items):
    """items: list of (x, y, svg). Draws each 9 times so the tile repeats seamlessly."""
    out = []
    for x, y, s in items:
        for dx in (-w, 0, w):
            for dy in (-h, 0, h):
                out.append(f'<g transform="translate({x + dx:.2f} {y + dy:.2f})">{s}</g>')
    return "".join(out)


def tile_file(name, w, h, bg, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.2f}" height="{h:.2f}">'
            f'<rect width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>{body}</svg>\n')


def preview_file(w, h, bg, body, pw=1600, ph=1000):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {pw} {ph}" width="{pw}" height="{ph}">'
            f'<defs><pattern id="p" patternUnits="userSpaceOnUse" width="{w:.2f}" height="{h:.2f}">'
            f'<rect width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>{body}</pattern></defs>'
            f'<rect width="{pw}" height="{ph}" fill="url(#p)"/></svg>\n')


jobs = []
tiles_made = {}


def add_tile(key, w, h, make):
    for way, (bg, ink, strong) in WAYS.items():
        body = make(ink)
        n = f"{key}-{way}"
        open(os.path.join(TILES, n + ".svg"), "w").write(tile_file(n, w, h, bg, body))
        open(os.path.join(PREV, n + ".svg"), "w").write(preview_file(w, h, bg, body))
        jobs.append({"src": f"patterns/preview/{n}.svg", "out": f"patterns/preview/{n}.png", "w": 1600, "h": 1000, "type": "png"})
    tiles_made[key] = (w, h)


# 1. Momentum field: the three rising bars, staggered
k = 0.3
trip = lambda ink: f'<g fill="{ink}" transform="scale({k})">{TRIPLET}</g>'
add_tile("momentum", 150, 130, lambda ink: wrap(150, 130, [(0, 0, trip(ink)), (75, 65, trip(ink))]))

# 2. Lever hatch: 60 degree pinstripes
p = 12.0
hh = p * math.tan(math.radians(60))
def hatch(ink):
    lines = []
    for i in range(-3, 4):
        x0 = i * p
        lines.append(f'<line x1="{x0 - p:.2f}" y1="{2 * hh:.2f}" x2="{x0 + 2 * p:.2f}" y2="{-hh:.2f}"/>')
    return f'<g stroke="{ink}" stroke-width="1.6" stroke-linecap="round">{"".join(lines)}</g>'
add_tile("hatch", p, hh, hatch)

# 3. Step rhythm: small staircases rising 2 : 3 : 4, rounded corners
def steps(ink):
    path = "M12 78 H58 V64 H104 V43 H150 V15 H196"
    return f'<path d="{path}" fill="none" stroke="{ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
add_tile("steps", 240, 104, lambda ink: wrap(240, 104, [(0, 4, steps(ink))]))

# 4. Peak rhythm: the tall bar and lever, repeated in offset rows
k2 = 0.22
peak = lambda ink: f'<g fill="{ink}" transform="scale({k2}) translate(-167.8 0)">{PEAK}</g>'
add_tile("peaks", 96, 84, lambda ink: wrap(96, 84, [(0, 0, peak(ink)), (48, 42, peak(ink))]))


# ---------- panels ----------
SIZES = {"16x9": (1920, 1080), "4x5": (1080, 1350), "1x1": (1080, 1080)}


def panel(n, w, h, body, bg):
    open(os.path.join(PANELS, n + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>\n')
    jobs.append({"src": f"patterns/panels/{n}.svg", "out": f"patterns/panels/{n}.png", "w": w, "h": h, "type": "png"})


# 5. Rising dots: dots grow from bottom-left to top-right along the mark's diagonal
def dots(w, h, ink, step=30, rmax=13):
    out = []
    ax, ay = math.cos(math.radians(30)), -math.sin(math.radians(30))   # direction of growth
    span = abs(ax) * w + abs(ay) * h
    for y in range(step // 2, h, step):
        for x in range(step // 2, w, step):
            t = (x * ax + (y - h) * ay) / span
            r = rmax * max(0.0, t) ** 1.15
            if r > 0.7:
                out.append(f'<circle cx="{x}" cy="{y}" r="{r:.2f}"/>')
    return f'<g fill="{ink}">{"".join(out)}</g>'

for way, (bg, ink, strong) in WAYS.items():
    for sname, (w, h) in SIZES.items():
        panel(f"dots-{way}-{sname}", w, h, dots(w, h, {"carbon": "#34343A", "chalk": "#D6D3CC", "signal": "#C21D13"}[way]), bg)


# 6. Supergraphic: the mark cropped huge, bleeding off the bottom right
def supergraphic(w, h, ink):
    s = h * 1.15 / SYMBOL_H
    x = w - SYMBOL_W * s * 0.97
    y = h - SYMBOL_H * s * 0.86
    return f'<g fill="{ink}" transform="translate({x:.1f} {y:.1f}) scale({s:.4f})">{SYM}</g>'

for way, (bg, ink, strong) in WAYS.items():
    for sname, (w, h) in SIZES.items():
        panel(f"super-{way}-{sname}", w, h, supergraphic(w, h, ink if way != "carbon" else "#1A1A1D"), bg)
        panel(f"super-{way}-strong-{sname}", w, h, supergraphic(w, h, strong), bg)


# 7. Step band: one continuous step line rising across a banner
def band(w, h, ink, n=9):
    x0, x1, yb, yt = h * 0.5, w - h * 0.5, h * 0.78, h * 0.22
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    # rises follow a 2 : 3 : 4 feel, getting bigger to the right
    rises = [1 + i * 0.35 for i in range(n)]
    tot = sum(rises); y = yb; d = f"M{x0:.1f} {y:.1f}"
    for i in range(n):
        d += f" H{xs[i + 1] - (x1 - x0) / n * 0.5:.1f}"
        y -= (yb - yt) * rises[i] / tot
        d += f" V{y:.1f}"
    d += f" H{x1:.1f}"
    return f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="{max(3, h * 0.035):.1f}" stroke-linecap="round" stroke-linejoin="round"/>'

for way, (bg, ink, strong) in WAYS.items():
    for sname, (w, h) in {"1920x240": (1920, 240), "1500x500": (1500, 500), "600x120": (600, 120)}.items():
        panel(f"stepband-{way}-{sname}", w, h, band(w, h, strong), bg)

json.dump(jobs, open(os.path.join(HERE, "patterns", "jobs.json"), "w"), indent=1)
json.dump({k: {"w": v[0], "h": v[1]} for k, v in tiles_made.items()}, open(os.path.join(HERE, "patterns", "tiles.json"), "w"), indent=1)
print(len(tiles_made), "tile patterns x", len(WAYS), "colourways;", len(jobs), "renders queued")
