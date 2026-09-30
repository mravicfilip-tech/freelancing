"""Social templates from the research round (Weave concepts I06 and I09).

Lever post (I06): the photo sits in a window cut at the mark's 60 degree bar angle, a Signal bar leans beside it,
and the headline sits on Carbon below. The photo window is a bar and the Signal stroke is its partner, so the post
reads as the mark without showing the logo big. Templates ship with a grey photo slot (group id="photo").
The examples use the Weave concept photo as a stand-in until real client photography exists.
Tally poster (I09): the Tally field with the result set in Host Grotesk.
All type is outlined, so files need no fonts. Run: python3 build_templates.py, then node render.cjs templates/jobs.json
"""
import base64, io, json, math, os, re
from PIL import Image
from geometry import *
import build_patterns as bp

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "templates")
os.makedirs(OUT, exist_ok=True)
SANS = os.path.join(HERE, "fonts", "HostGrotesk-400.ttf")
SANS_M = os.path.join(HERE, "fonts", "HostGrotesk-500.ttf")
PHOTO = os.path.join(HERE, "..", "..", "explorations", "weave", "patterns", "i06.jpg")
SLOT = "#2A2A2E"
T30 = math.tan(math.radians(30))  # horizontal run per unit of height on a 60 degree edge
jobs = []


def lockup(colour_file, x, y, width):
    s = open(os.path.join(HERE, "logo", "svg", colour_file)).read()
    vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s).group(1, 2))
    inner = re.sub(r"^.*?<title>.*?</title>", "", s, flags=re.S).replace("</svg>", "").strip()
    k = width / vw
    return f'<g transform="translate({x:.1f} {y:.1f}) scale({k:.4f})">{inner}</g>', vh * k


def text_lines(lines, x, y, size, leading=1.12, font=SANS):
    """lines: list of [(text, colour), ...]. size is the cap height. Returns svg and the bottom y."""
    out = []
    for i, runs in enumerate(lines):
        cx = x
        for t, col in runs:
            d, tw, _ = wordmark(t, font, size, tracking_em=-0.01)
            out.append(f'<path fill="{col}" transform="translate({cx:.1f} {y + i * size / 0.7 * leading:.1f})" d="{d}"/>')
            cx += tw + size * 0.36
    return "".join(out), y + (len(lines) - 1) * size / 0.7 * leading + size


def photo_uri(w, h):
    """The stand-in photo: the concept's photo area, cover-fitted to w x h."""
    im = Image.open(PHOTO).convert("RGB").crop((60, 0, 928, 640))
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    ox = round((im.width - w) * 0.12)  # keep the concept's red stroke (right side) out of frame
    im = im.crop((ox, 0, ox + round(w), round(h)))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=84)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def save(name, w, h, body):
    open(os.path.join(OUT, name + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')
    jobs.append({"src": f"templates/{name}.svg", "out": f"templates/{name}.png", "w": w, "h": h, "type": "png"})


# ---------- lever post ----------
LEVER = {  # size: (w, h, window height, window right edge at the bottom, headline cap height)
    "4x5": (1080, 1350, 0.56, 0.62, 64),
    "1x1": (1080, 1080, 0.58, 0.62, 52),
    "9x16": (1080, 1920, 0.56, 0.60, 80),
}
HEAD = [[("Somebody called", CHALK)], [("you last night.", CHALK)], [("Who answered?", CHALK)]]


def lever_post(size, example):
    w, h, hf, rf, cap = LEVER[size]
    hp = h * hf
    xr = w * rf
    win = [(0, hp), (hp * T30, 0), (xr + hp * T30, 0), (xr, hp)]
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in win)
    body = [f'<rect width="{w}" height="{h}" fill="{CARBON}"/>',
            f'<polygon points="0,0 {hp * T30:.1f},0 0,{hp:.1f}" fill="{CHALK}"/>',
            f'<clipPath id="win"><polygon points="{pts}"/></clipPath>',
            f'<g id="photo" clip-path="url(#win)">']
    if example:
        body.append(f'<image x="0" y="0" width="{w}" height="{hp:.0f}" preserveAspectRatio="xMidYMid slice" href="{photo_uri(w, hp)}"/>')
    else:
        body.append(f'<rect width="{w}" height="{hp:.1f}" fill="{SLOT}"/>')
        d, tw, _ = wordmark("PHOTO: OWNER AT WORK", SANS_M, 16, tracking_em=0.12)
        body.append(f'<path fill="#6E6B66" transform="translate({(xr + hp * T30 - tw) / 2:.1f} {hp / 2:.1f})" d="{d}"/>')
    body.append("</g>")
    # the Signal bar: the mark's stroke width relative to the window, parallel to its right edge
    r = w * 0.036
    gap = r * 0.55
    off = r + gap  # distance from the edge to the bar's axis, measured along the normal
    e = h * 0.06  # how far the bar's foot drops below the window
    edge = (xr - D[0] * e, hp - D[1] * e)
    base = (edge[0] + N[0] * off, edge[1] + N[1] * off)
    body.append(f'<path fill="{SIGNAL}" d="{capsule(base, D, h * 0.30, r)}"/>')
    m = w * 0.06
    t, bottom = text_lines(HEAD, m, hp + h * 0.1, cap)
    body.append(t)
    lk, lh = lockup("ml-horizontal-signal-chalk.svg", 0, 0, w * 0.36)
    body.append(lk.replace("translate(0.0 0.0)", f"translate({w - m - w * 0.36:.1f} {h - m - lh:.1f})"))
    save(f"lever-post-{'example' if example else 'template'}-{size}", w, h, "".join(body))


for size in LEVER:
    lever_post(size, False)
    lever_post(size, True)

# ---------- tally poster ----------
for size, (w, h) in {"4x5": (1080, 1350), "9x16": (1080, 1920)}.items():
    fh = h * (0.68 if size == "4x5" else 0.72)
    field = bp.tally(w, fh, *bp.TALLY_DATA, "#2A2A2E", SIGNAL)
    m = w * 0.06
    total, won = bp.TALLY_DATA
    t, bottom = text_lines([[(f"{total:,} calls answered.", CHALK)], [(f"{won} won back.", SIGNAL)]], m, fh + h * 0.05, 58 if size == "4x5" else 84)
    cap_d, cw, _ = wordmark("One mark is four calls. Red: missed, then won back.", SANS, 17, tracking_em=0)
    lk, lh = lockup("ml-horizontal-signal-chalk.svg", 0, 0, w * 0.3)
    save(f"tally-poster-{size}", w, h,
         f'<rect width="{w}" height="{h}" fill="{CARBON}"/>{field}{t}'
         f'<path fill="#8A8782" transform="translate({m:.1f} {h - m - 17:.1f})" d="{cap_d}"/>'
         + lk.replace("translate(0.0 0.0)", f"translate({w - m - w * 0.3:.1f} {h - m - lh:.1f})"))

json.dump(jobs, open(os.path.join(OUT, "jobs.json"), "w"), indent=1)
print(len(jobs), "templates")
