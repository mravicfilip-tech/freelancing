"""Brand patterns, v2 (v1 retired: scattered motifs read as generic). Each one is a system built from the mark's own geometry, not a scattered motif.

1. Skyline      the full mark repeated edge to edge on one baseline, rising out of the bottom edge. Repeats sideways.
2. Signal code  the tagline written in bars: each letter is three bars in the mark's three heights (base 3), a full stop is the lever.
                Every E comes out as short, medium, tall: the mark itself.

Also here: the supergraphic, the mark cropped huge with the lever in view.
Tiles are seamless SVGs (CSS background-image, Figma pattern fill). Panels are fixed-size graphics.
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

WAYS = {  # background, tonal ink, strong ink
    "carbon": (CARBON, "#1F1F23", SIGNAL),
    "chalk":  (CHALK, "#E1DFD8", SIGNAL),
    "signal": (SIGNAL, "#CC1F14", CHALK),
}
T60 = math.tan(math.radians(60))
BARS = [capsule(b, D, l) for b, l in zip(BASES, LENS)]
LEVER = lever_path()
MARK = "".join(f'<path d="{p}"/>' for p in BARS + [LEVER])
jobs = []


def wrap(w, h, items):
    out = []
    for x, y, s in items:
        for dx in (-w, 0, w):
            for dy in (-h, 0, h):
                out.append(f'<g transform="translate({x + dx:.2f} {y + dy:.2f})">{s}</g>')
    return "".join(out)


def write_tile(key, way, w, h, body, scale):
    bg = WAYS[way][0]
    n = f"{key}-{way}"
    open(os.path.join(TILES, n + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w * scale:.2f}" height="{h * scale:.2f}">'
        f'<rect x="-1" y="-1" width="{w + 2:.2f}" height="{h + 2:.2f}" fill="{bg}"/>{body}</svg>\n')
    pw, ph = 1600, 1000
    open(os.path.join(PREV, n + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {pw} {ph}" width="{pw}" height="{ph}"><defs>'
        f'<pattern id="p" patternUnits="userSpaceOnUse" width="{w * scale:.3f}" height="{h * scale:.3f}">'
        f'<g transform="scale({scale})"><rect x="-1" y="-1" width="{w + 2:.2f}" height="{h + 2:.2f}" fill="{bg}"/>{body}</g></pattern></defs>'
        f'<rect width="{pw}" height="{ph}" fill="url(#p)"/></svg>\n')
    jobs.append({"src": f"patterns/preview/{n}.svg", "out": f"patterns/preview/{n}.png", "w": pw, "h": ph, "type": "png"})
    return {"w": round(w * scale, 3), "h": round(h * scale, 3)}


def panel(n, w, h, body, bg):
    open(os.path.join(PANELS, n + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>\n')
    jobs.append({"src": f"patterns/panels/{n}.svg", "out": f"patterns/panels/{n}.png", "w": w, "h": h, "type": "png"})


tiles = {}

# ---------- 1. Skyline ----------
SKY_P = SYMBOL_W + 52.0                 # mark to mark: one bar width of air after the lever
SKY_H = 180.0                           # crop: the marks rise out of the bottom edge
for way, (bg, ink, strong) in WAYS.items():
    unit = f'<g fill="{ink}">{MARK}</g>'
    body = "".join(f'<g transform="translate({dx:.1f} {SKY_H - 188.8 + 12:.1f})">{unit}</g>' for dx in (-SKY_P, 0, SKY_P))
    tiles["skyline"] = write_tile("skyline", way, SKY_P, SKY_H, body, 0.5)
    for sname, (w, h), sc, col in (("16x9", (1920, 1080), 0.62, ink), ("1920x400", (1920, 400), 0.9, ink), ("strong-1920x400", (1920, 400), 0.9, strong)):
        n = max(3, int(w / (SKY_P * sc)) + 2)
        band = "".join(f'<g transform="translate({i * SKY_P * sc - SKY_P * sc * 0.3:.1f} {h - SKY_H * sc:.1f}) scale({sc})"><g transform="translate(0 {SKY_H - 188.8 + 12:.1f})"><g fill="{col}">{MARK}</g></g></g>' for i in range(n))
        panel(f"skyline-{way}-{sname}", w, h, band, bg)

# ---------- 2. Signal code ----------
TEXT = "LESS EFFORT. MORE SCALE."
CODE_LENS = [LENS[0], LENS[1], LENS[2]]    # base 3 digits 0, 1, 2 -> the mark's three bar lengths
BAR_STEP = BASES[1][0] - BASES[0][0]        # 83.9, the mark's own bar spacing
LETTER_GAP = 60.0
WORD_GAP = 170.0


def code_line(text, ink, e_ink=None):
    parts, x = [], 26.0
    for ch in text:
        if ch == " ":
            x += WORD_GAP; continue
        if ch == ".":
            # the lever closes the sentence
            parts.append(f'<g transform="translate({x - 318 + 26 + 10:.1f} 0)"><path d="{LEVER}"/></g>')
            x += 26 + 26 + LETTER_GAP + 20; continue
        n = ord(ch.upper()) - 64
        digits = [(n // 9) % 3, (n // 3) % 3, n % 3]
        fill = f' fill="{e_ink}"' if (e_ink and ch.upper() == "E") else ""
        for i, dg in enumerate(digits):
            parts.append(f'<path{fill} d="{capsule((x + i * BAR_STEP, 188.8), D, CODE_LENS[dg])}"/>')
        x += 2 * BAR_STEP + LETTER_GAP + 52
    return f'<g fill="{ink}">{"".join(parts)}</g>', x - 26 + WORD_GAP


# panels
SIZES = {"16x9": (1920, 1080), "4x5": (1080, 1350), "1x1": (1080, 1080)}
for way, (bg, ink, strong) in WAYS.items():
    tone = {"carbon": "#2A2A2F", "chalk": "#D9D6CF", "signal": "#C21D13"}[way]
    # the tagline as a single strong band
    line, lw = code_line(TEXT, strong)
    s = 1760 / lw
    panel(f"code-band-{way}-1920x320", 1920, 320, f'<g transform="translate(80 {160 - 108 * s:.1f}) scale({s:.4f})">{line}</g>', bg)
    # poster: the tagline set as three lines of code, every E (short, medium, tall: the mark) in the strong colour
    for sname, (w, h) in SIZES.items():
        words = ["LESS", "EFFORT.", "MORE SCALE."] if sname == "16x9" else ["LESS", "EFFORT.", "MORE", "SCALE."]
        rows, widths = [], []
        for wd in words:
            ln, lw2 = code_line(wd, tone, strong); rows.append(ln); widths.append(lw2 - WORD_GAP)
        sc = (w - 2 * w * 0.08) / max(widths)
        lh = 300 * sc
        top = (h - lh * len(rows)) / 2
        body = "".join(f'<g transform="translate({w * 0.08:.1f} {top + i * lh:.1f}) scale({sc:.4f})">{r}</g>' for i, r in enumerate(rows))
        panel(f"code-poster-{way}-{sname}", w, h, body, bg)

# supergraphic stays: the mark cropped huge, lever in view
for way, (bg, ink, strong) in WAYS.items():
    for sname, (w, h) in SIZES.items():
        s = h * 1.15 / SYMBOL_H
        g = f'<g fill="{strong}" transform="translate({w - SYMBOL_W * s * 0.97:.1f} {h - SYMBOL_H * s * 0.86:.1f}) scale({s:.4f})">{MARK}</g>'
        panel(f"super-{way}-{sname}", w, h, g, bg)

json.dump(jobs, open(os.path.join(HERE, "patterns", "jobs.json"), "w"), indent=1)
json.dump(tiles, open(os.path.join(HERE, "patterns", "tiles.json"), "w"), indent=1)
print(len(tiles), "tile patterns;", len(jobs), "renders queued")
