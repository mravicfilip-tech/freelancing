"""Builds every logo SVG from geometry.py. Run: python3 build_logo.py (then render.js for PNG and PDF)."""
import json, os
from geometry import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "logo", "svg")
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(HERE, "fonts", "Michroma.ttf")
NAME = "MAXIMUM LEVERAGE"

SYM = "".join(f'<path d="{p}"/>' for p in symbol_paths())

# name: (symbol colour, wordmark colour, what it sits on)
VARIANTS = {
    "signal":        (SIGNAL, SIGNAL, "Carbon, Chalk or white"),
    "signal-chalk":  (SIGNAL, CHALK,  "Carbon"),
    "signal-carbon": (SIGNAL, CARBON, "Chalk or white"),
    "chalk":         (CHALK,  CHALK,  "Signal, photography, dark colour"),
    "carbon":        (CARBON, CARBON, "One-colour print on light stock"),
    "white":         (WHITE,  WHITE,  "Photography, embroidery, foil"),
}


def svg(w, h, body, title="Maximum Leverage"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def symbol(colour, x=0, y=0, scale=1.0):
    return f'<g fill="{colour}" transform="translate({x:.2f} {y:.2f}) scale({scale:.5f})">{SYM}</g>'


manifest = {}

# symbol alone
for v in ("signal", "chalk", "carbon", "white"):
    c = VARIANTS[v][0]
    name = f"ml-symbol-{v}.svg"
    open(os.path.join(OUT, name), "w").write(svg(SYMBOL_W, SYMBOL_H, symbol(c)))
    manifest[name] = {"kind": "symbol", "w": SYMBOL_W, "h": SYMBOL_H, "on": VARIANTS[v][2]}

# stacked lockup: symbol 7.4 em wide, name 1 em, 0.95 em between symbol and cap top
em = SYMBOL_W / 7.4
d, ww, cap = wordmark(NAME, FONT, em * 0.75)
gap = em * 0.95
W_ = max(ww, SYMBOL_W); H_ = SYMBOL_H + gap + cap
for v, (cs, cw, on) in VARIANTS.items():
    body = symbol(cs, (W_ - SYMBOL_W) / 2, 0) + f'<path fill="{cw}" transform="translate({(W_ - ww) / 2:.2f} {SYMBOL_H + gap:.2f})" d="{d}"/>'
    name = f"ml-stacked-{v}.svg"
    open(os.path.join(OUT, name), "w").write(svg(W_, H_, body))
    manifest[name] = {"kind": "stacked", "w": W_, "h": H_, "on": on}

# horizontal lockup: symbol 3.1 em wide, gap 1.1 em, cap height centred on the symbol
em = SYMBOL_W / 3.1
d, ww, cap = wordmark(NAME, FONT, em * 0.75)
gap = em * 1.1
W_ = SYMBOL_W + gap + ww; H_ = SYMBOL_H
for v, (cs, cw, on) in VARIANTS.items():
    body = symbol(cs) + f'<path fill="{cw}" transform="translate({SYMBOL_W + gap:.2f} {(SYMBOL_H - cap) / 2:.2f})" d="{d}"/>'
    name = f"ml-horizontal-{v}.svg"
    open(os.path.join(OUT, name), "w").write(svg(W_, H_, body))
    manifest[name] = {"kind": "horizontal", "w": W_, "h": H_, "on": on}

# wordmark alone
d, ww, cap = wordmark(NAME, FONT, 100)
for v in ("signal", "chalk", "carbon", "white"):
    name = f"ml-wordmark-{v}.svg"
    open(os.path.join(OUT, name), "w").write(svg(ww, cap, f'<path fill="{VARIANTS[v][1]}" d="{d}"/>'))
    manifest[name] = {"kind": "wordmark", "w": ww, "h": cap, "on": VARIANTS[v][2]}

json.dump(manifest, open(os.path.join(HERE, "logo", "manifest.json"), "w"), indent=1)
print(len(manifest), "logo SVGs")

# render jobs: PNG at a useful size, PDF at the SVG's own size (vector)
PNG_W = {"symbol": 1024, "stacked": 1600, "horizontal": 2400, "wordmark": 2400}
for sub in ("png", "pdf"):
    os.makedirs(os.path.join(HERE, "logo", sub), exist_ok=True)
jobs = []
for name, m in manifest.items():
    base = name[:-4]
    pw = PNG_W[m["kind"]]; ph = round(pw * m["h"] / m["w"])
    jobs.append({"src": os.path.join(OUT, name), "out": os.path.join(HERE, "logo", "png", base + ".png"), "w": pw, "h": ph, "type": "png"})
    jobs.append({"src": os.path.join(OUT, name), "out": os.path.join(HERE, "logo", "pdf", base + ".pdf"), "w": round(m["w"], 2), "h": round(m["h"], 2), "type": "pdf"})
for j in jobs:
    j["src"] = os.path.relpath(j["src"], HERE); j["out"] = os.path.relpath(j["out"], HERE)
json.dump(jobs, open(os.path.join(HERE, "logo", "jobs.json"), "w"), indent=1)
