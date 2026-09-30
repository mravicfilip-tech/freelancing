"""Brand patterns v3, redrawn as clean vectors from the three Weave concepts the client picked (p01, p02, p08).
v1 (scattered motifs) and v2 (skyline, signal code) were retired as generic.

1. Summit   topographic contour lines that climb to the mark. The innermost line is the mark's own outline in Signal.
2. Ripple   op-art stripes at the mark's 60 degree angle, bent and bunched where a hidden lever pushes into them.
3. Slabs    a solid field cut into slabs along the bar angle (60 degrees) and the lever angle; a few slabs are pushed
            out of line, showing the ground underneath, like pieces being levered.

All three are fixed-size panels (they are compositions, not repeats) in Carbon, Chalk and Signal.
Run: python3 build_patterns.py, then node render.cjs patterns/jobs.json
"""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt
from skimage import measure
from shapely.geometry import Polygon, LineString, box
from shapely.ops import split
from shapely import affinity
from geometry import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "patterns")
os.makedirs(OUT, exist_ok=True)
SIZES = {"16x9": (1920, 1080), "4x5": (1080, 1350), "1x1": (1080, 1080), "band": (1920, 480)}
jobs = []


def save(name, w, h, body, bg):
    open(os.path.join(OUT, name + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
        f'<rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>\n')
    jobs.append({"src": f"patterns/{name}.svg", "out": f"patterns/{name}.png", "w": w, "h": h, "type": "png"})


def pts_d(pts, closed=False):
    s = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return s + (" Z" if closed else "")


def chaikin(pts, n=2, closed=False):
    for _ in range(n):
        out = []
        m = len(pts) if closed else len(pts) - 1
        for i in range(m):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            out += [(0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])]
        if not closed:
            out = [pts[0]] + out + [pts[-1]]
        pts = out
    return pts


# ---------- mark as polygons (for masks and outlines) ----------
def mark_polys(x, y, width):
    """The mark placed with its top-left at (x, y), scaled to width. Returns shapely polygons."""
    s = width / SYMBOL_W
    polys = []
    for b, l in zip(BASES, LENS):
        tip = (b[0] + D[0] * l, b[1] + D[1] * l)
        polys.append(LineString([b, tip]).buffer(R, quad_segs=16))
    # lever: a capsule from the foot, cut by the line parallel to the tall bar (R + GAP from its axis)
    far = (FOOT[0] + U[0] * 260, FOOT[1] + U[1] * 260)
    lev = LineString([FOOT, far]).buffer(R, quad_segs=16)
    p0 = BASES[2]
    off = R + GAP
    c = (p0[0] + N[0] * off, p0[1] + N[1] * off)
    half = Polygon([(c[0] - D[0] * 900, c[1] - D[1] * 900), (c[0] + D[0] * 900, c[1] + D[1] * 900),
                    (c[0] + D[0] * 900 + N[0] * 900, c[1] + D[1] * 900 + N[1] * 900),
                    (c[0] - D[0] * 900 + N[0] * 900, c[1] - D[1] * 900 + N[1] * 900)])
    polys.append(lev.intersection(half))
    return [affinity.translate(affinity.scale(p, s, s, origin=(0, 0)), x, y) for p in polys]


# ---------- 1. Summit ----------
def noise_field(X, Y, seed, scale):
    rng = np.random.default_rng(seed)
    n = np.zeros_like(X)
    for k in range(5):
        fx, fy = rng.uniform(0.6, 1.8, 2) / scale * (1 + k * 0.6)
        ph = rng.uniform(0, 2 * np.pi, 2)
        n += np.sin(X * fx + ph[0]) * np.cos(Y * fy + ph[1]) / (1 + k)
    return n / 2.2


def summit(w, h, line, peak, place, width_frac, step=4, gap=None, seed=7):
    mw = w * width_frac if w <= h else h * width_frac * 1.45
    mh = mw * SYMBOL_H / SYMBOL_W
    cx, cy = place
    mx, my = cx - mw / 2, cy - mh / 2
    polys = mark_polys(mx, my, mw)
    # rasterise the mark, then distance to it
    pad = 60
    gw, gh = (w + 2 * pad) // step, (h + 2 * pad) // step
    img = Image.new("L", (gw, gh), 0)
    dr = ImageDraw.Draw(img)
    for p in polys:
        dr.polygon([((x + pad) / step, (y + pad) / step) for x, y in p.exterior.coords], fill=255)
    mask = np.array(img) > 0
    dist = distance_transform_edt(~mask) * step
    Y, X = np.mgrid[0:gh, 0:gw].astype(float) * step
    n = noise_field(X, Y, seed, 260.0)
    field = dist * (1 + 0.22 * n) + 12 * n
    gap = gap or max(22, min(w, h) * 0.036)
    paths = []
    level = gap * 0.9
    k = 0
    while level < field.max():
        for c in measure.find_contours(field, level):
            pts = [(p[1] * step - pad, p[0] * step - pad) for p in c]
            if len(pts) < 6:
                continue
            closed = abs(pts[0][0] - pts[-1][0]) < 1 and abs(pts[0][1] - pts[-1][1]) < 1
            pts = chaikin(pts[::2] if len(pts) > 60 else pts, 2, closed)
            paths.append(pts_d(pts, closed))
        level += gap; k += 1
    sw = max(2.2, min(w, h) * 0.0029)
    body = f'<g fill="none" stroke="{line}" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round">' + "".join(f'<path d="{d}"/>' for d in paths) + "</g>"
    # the summit: the mark itself as an outline in the peak colour
    outline = []
    from shapely.ops import unary_union
    u = unary_union(polys).buffer(sw * 3.2, quad_segs=12)
    geoms = getattr(u, "geoms", [u])
    for g in geoms:
        outline.append(pts_d(list(g.exterior.coords), True))
    body += f'<g fill="none" stroke="{peak}" stroke-width="{sw * 2.4:.2f}" stroke-linejoin="round">' + "".join(f'<path d="{d}"/>' for d in outline) + "</g>"
    return body


# ---------- 2. Ripple ----------
def ripple(w, h, ink, bg, spacing=None, seed=3):
    spacing = spacing or max(22, min(w, h) * 0.03)
    rng = np.random.default_rng(seed)
    # two pushes: the lever's contact point, and a smaller echo
    c1 = np.array([w * 0.58, h * 0.5]); c2 = np.array([w * 0.28, h * 0.78])
    s1, s2 = min(w, h) * 0.34, min(w, h) * 0.22
    a1, a2 = spacing * 7.5, -spacing * 3.2
    Dv, Nv = np.array(D), np.array(N)
    diag = math.hypot(w, h)
    def disp(p):
        d1 = np.exp(-np.sum((p - c1) ** 2, axis=-1) / (2 * s1 ** 2))
        d2 = np.exp(-np.sum((p - c2) ** 2, axis=-1) / (2 * s2 ** 2))
        wave = 0.35 * spacing * np.sin(np.dot(p, Dv) / (diag * 0.18))
        return a1 * d1 + a2 * d2 + wave
    ts = np.linspace(-diag, diag, 420)
    origin = np.array([w / 2, h / 2])
    def boundary(o):
        p = origin[None, :] + ts[:, None] * Dv[None, :] + o * Nv[None, :]
        return p + disp(p)[:, None] * Nv[None, :]
    bands = []
    kmax = int(diag / spacing) + 4
    for k in range(-kmax, kmax, 2):
        b1 = boundary(k * spacing); b2 = boundary((k + 1) * spacing)
        poly = np.vstack([b1, b2[::-1]])
        bands.append(pts_d([tuple(p) for p in poly], True))
    return f'<g fill="{ink}">' + "".join(f'<path d="{d}"/>' for d in bands) + "</g>"


# ---------- 3. Slabs ----------
def slabs(w, h, ink, ground, unit=None, seed=11):
    rng = np.random.default_rng(seed)
    unit = unit or min(w, h) * 0.075
    frame = box(-10, -10, w + 10, h + 10)
    Dv, Nv = np.array(D), np.array(N)
    Uv = np.array(U)
    diag = math.hypot(w, h) * 1.2
    rhythm = [2, 3, 4, 3, 2, 4, 3]
    gap = max(5.0, unit * 0.09)
    # strip boundaries along the normal, widths in the mark's 2 : 3 : 4 rhythm
    offs = [-diag / 2]
    i = 0
    while offs[-1] < diag / 2:
        offs.append(offs[-1] + rhythm[i % len(rhythm)] * unit); i += 1
    centre = np.array([w / 2, h / 2])
    pieces = []
    for a, b in zip(offs, offs[1:]):
        strip = Polygon([tuple(centre + Nv * a - Dv * diag), tuple(centre + Nv * a + Dv * diag),
                         tuple(centre + Nv * b + Dv * diag), tuple(centre + Nv * b - Dv * diag)]).intersection(frame)
        if strip.is_empty:
            continue
        # one or two cuts across the strip at the lever's angle
        cuts = rng.choice([1, 2], p=[0.55, 0.45])
        parts = [strip]
        for _ in range(cuts):
            t = rng.uniform(-0.35, 0.35) * diag
            p = centre + Nv * ((a + b) / 2) + Dv * t
            cut = LineString([tuple(p - Uv * diag), tuple(p + Uv * diag)])
            new = []
            for q in parts:
                try:
                    new += list(split(q, cut).geoms)
                except Exception:
                    new.append(q)
            parts = new
        pieces += [q for q in parts if q.area > unit * unit * 0.5]
    # push a few slabs out of line, along the bar axis, to show the ground
    order = sorted(range(len(pieces)), key=lambda i: -pieces[i].area)
    pushed = set(rng.choice(order[: max(4, len(order) // 2)], size=min(3, len(order)), replace=False).tolist())
    out = []
    for i, q in enumerate(pieces):
        g = q.buffer(-gap / 2, join_style=2)
        if g.is_empty:
            continue
        if i in pushed:
            g = affinity.translate(g, *(Dv * unit * rng.uniform(1.8, 2.8)))
            others = [pieces[j].buffer(-gap / 2, join_style=2) for j in range(len(pieces)) if j != i]
            for o in others:
                g = g.difference(o.buffer(gap, join_style=2))
        for geom in getattr(g, "geoms", [g]):
            if geom.geom_type == "Polygon" and geom.area > 50:
                out.append(pts_d(list(geom.exterior.coords), True))
    return f'<g fill="{ink}">' + "".join(f'<path d="{d}"/>' for d in out) + "</g>"


# ---------- colourways and output ----------
TOPO = {  # background, line, peak
    "chalk": (CHALK, CARBON, SIGNAL),
    "carbon": (CARBON, "#6E6B66", SIGNAL),
    "signal": (SIGNAL, "#7E0F09", CHALK),
}
RIPPLE = {  # background, stripes
    "carbon": (CARBON, SIGNAL),
    "chalk": (CHALK, CARBON),
    "signal": (SIGNAL, CARBON),
}
SLABS = {  # ground (shows through gaps), slabs
    "signal": (CARBON, SIGNAL),
    "chalk": (CARBON, CHALK),
    "carbon": (CARBON, "#26262B"),
}
PLACE = {"16x9": (0.66, 0.5, 0.26), "4x5": (0.5, 0.42, 0.52), "1x1": (0.5, 0.5, 0.46), "band": (0.72, 0.52, 0.44)}

for way, (bg, line, peak) in TOPO.items():
    for sname, (w, h) in SIZES.items():
        fx, fy, frac = PLACE[sname]
        save(f"summit-{way}-{sname}", w, h, summit(w, h, line, peak, (w * fx, h * fy), frac), bg)
for way, (bg, ink) in RIPPLE.items():
    for sname, (w, h) in SIZES.items():
        save(f"ripple-{way}-{sname}", w, h, ripple(w, h, ink, bg), bg)
for way, (ground, ink) in SLABS.items():
    for sname, (w, h) in SIZES.items():
        save(f"slabs-{way}-{sname}", w, h, slabs(w, h, ink, ground), ground)

json.dump(jobs, open(os.path.join(OUT, "jobs.json"), "w"), indent=1)
print(len(jobs), "pattern panels")
