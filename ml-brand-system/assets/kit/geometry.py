"""Maximum Leverage mark: the single source of truth for its geometry.

Symbol space is the viewBox 0 0 344 215 (y down).
- Three bars at 60 degrees, stroke width 52, round ends, bottoms on one line,
  lengths between cap centres 94.5 / 141 / 188 (heights rise 2 : 3 : 4).
- The lever: one more stroke of the same weight from its foot at (318, 188.8),
  leaning up and left; its top is cut parallel to the tallest bar, 14 units clear of it.
Everything here returns filled outlines (no strokes), so files work in any tool.
"""
import math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

SIGNAL, CARBON, CHALK, WHITE = "#E5261A", "#0E0E0F", "#F3F2EF", "#FFFFFF"
W, R = 52.0, 26.0
D = (0.5, -math.sqrt(3) / 2)          # bar axis, pointing up
N = (math.sqrt(3) / 2, 0.5)           # right-hand normal of the bar axis
BASES = [(26.0, 188.8), (109.9, 188.8), (193.8, 188.8)]
LENS = [94.5, 141.0, 188.0]
FOOT = (318.0, 188.8)
_u = (-0.388, -0.922); _m = math.hypot(*_u)
U = (_u[0] / _m, _u[1] / _m)          # lever axis, pointing up
GAP = 14.0
SYMBOL_W, SYMBOL_H = 344.0, 215.0


def _f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def _pt(p):
    return f"{_f(p[0])} {_f(p[1])}"


def capsule(base, axis, length, r=R):
    """Filled stadium from base (cap centre) along axis for length."""
    nx, ny = axis[1] * -1, axis[0]            # left normal of axis
    tip = (base[0] + axis[0] * length, base[1] + axis[1] * length)
    a = (base[0] - nx * r, base[1] - ny * r)
    b = (tip[0] - nx * r, tip[1] - ny * r)
    c = (tip[0] + nx * r, tip[1] + ny * r)
    d = (base[0] + nx * r, base[1] + ny * r)
    return f"M{_pt(a)} L{_pt(b)} A{_f(r)} {_f(r)} 0 0 1 {_pt(c)} L{_pt(d)} A{_f(r)} {_f(r)} 0 0 1 {_pt(a)} Z"


def lever_path():
    """The lever: round foot, straight top cut parallel to the tall bar."""
    ln = (-U[1], U[0])                          # normal of lever axis
    p0 = BASES[2]
    off = R + GAP

    def hit(start):
        t = (off - ((start[0] - p0[0]) * N[0] + (start[1] - p0[1]) * N[1])) / (U[0] * N[0] + U[1] * N[1])
        return (start[0] + U[0] * t, start[1] + U[1] * t)

    e1 = (FOOT[0] + ln[0] * R, FOOT[1] + ln[1] * R)
    e2 = (FOOT[0] - ln[0] * R, FOOT[1] - ln[1] * R)
    t1, t2 = hit(e1), hit(e2)
    return f"M{_pt(e1)} L{_pt(t1)} L{_pt(t2)} L{_pt(e2)} A{_f(R)} {_f(R)} 0 0 0 {_pt(e1)} Z"


def symbol_paths():
    return [capsule(b, D, l) for b, l in zip(BASES, LENS)] + [lever_path()]


# ---------- wordmark ----------
_FONT = None


def _font(path):
    global _FONT
    if _FONT is None:
        _FONT = TTFont(path)
    return _FONT


def wordmark(text, font_path, cap_height, tracking_em=0.32):
    """Outline text in Michroma. Returns (path_d, width, cap_height) with the cap top at y=0."""
    f = _font(font_path)
    upm = f["head"].unitsPerEm
    cap = f["OS/2"].sCapHeight
    s = cap_height / cap
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f["hmtx"]
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    x = 0.0
    track = tracking_em * upm
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, x * s, cap * s))
        gs[g].draw(tp)
        adv = hmtx[g][0]
        x += adv + (track if i < len(text) - 1 else 0)
    return pen.getCommands(), x * s, cap_height
