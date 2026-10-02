"""Rebrand the Diversify portfolio deck to Filip Mravić.

Only brand elements change: the logo lockups, the outlined watermark marks,
the header bar, the footer lines and the hidden search text that went with
them. Every mockup, image, headline and paragraph is left byte-for-byte as it
was, because the edits are made in the content streams themselves: a matched
path has its paint operator turned into `n` (path ends, nothing painted), and
where layering matters the replacement is drawn at that same point in the
stream so it sits under the same things the original did.

    python3 rebrand.py <input.pdf> <output.pdf> <fonts-dir>
"""
import re
import sys

import fitz  # PyMuPDF
import pikepdf

import pdfwalk

SRC, OUT, FONTS = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1920.0, 1080.0

# ── Brand ────────────────────────────────────────────────────────────────
# From filip-portfolio: src/styles/base.css tokens, src/components/BrandLogo.jsx,
# src/data/content.js.
ORANGE = (1.0, 0x42 / 255, 0x13 / 255)       # --accent  #ff4213
ACCENT_INK = (0x12 / 255,) * 3               # --accent-ink #121212
INK = (0x14 / 255, 0x12 / 255, 0x0f / 255)   # --ink #14120f
INK_SOFT = (0x55 / 255, 0x52 / 255, 0x4c / 255)  # --ink-soft #55524c
NAME = 'Filip Mravić'
ROLE = 'UX Strategy & Product Design'
CONTACT = 'mravicfilip@gmail.com'
FOOT_LEFT = ('I design digital products and enterprise platforms that turn complex '
             'workflows into clear, confident experiences.')
FOOT_RIGHT = (f'Copyright © {NAME} 2026 - This file is confidential and is not to be '
              'shared further without approval.')

MARK_W, MARK_H = 355.0, 161.0
MARK_PATH = (
    "M25.0143 77.7433C43.47 78.3311 54.1241 59.5231 65.748 46.2488C76.8543 33.5659 87.0122 20.0224 94.3227 11.9152C101.142 4.35243 104.34 1.4138 108.625 0.250247C109.103 0.120271 109.599 0.0709396 110.095 0.0691219C113.866 0.0553019 118.371 0.0700964 126.483 0.0672788C141.489 0.0619352 139.28 17.187 139.28 19.2379L139.283 75.6195C139.286 76.6767 140.142 77.5329 141.2 77.5343L144.328 77.5382C161.031 77.5592 186.005 43.207 206.287 18.7513C222.676 -2.14177 220.224 0.0673541 244.779 0.0672788C255.488 0.064273 256.026 10.2811 256.029 15.8891C256.04 35.7684 256.027 55.6506 256.029 75.5343C256.029 76.7543 257.018 77.7433 258.238 77.7433H309C309 97.0452 309 105.228 309 120.567C309 137.356 309.757 160.888 270.519 160.005C267.428 160.005 250.282 159.97 247.191 159.97C247.191 136.342 247.191 117.512 247.191 93.8838C247.792 82.1607 237.729 84.2063 234.077 88.2363C212.063 109.412 190.058 149.978 164.363 158.136C156.625 160.592 138.868 159.97 129.323 159.97C129.214 159.97 129.125 159.879 129.125 159.77C129.125 136.24 129.125 118.236 129.125 94.675C129.763 83.3139 119.43 83.683 115.149 87.3845C114.88 87.617 114.656 87.8896 114.447 88.177C92.4579 118.416 66.8528 158.922 35 159.97C23.3413 160.104 13 160 0 159.97L0 77.7433C8.24556 77.7667 16.6762 77.7433 25.0143 77.7433Z"
)
DOT = (337.0, 142.0, 18.0)


def parse_svg_path(d):
    """Absolute M/L/H/V/C/Z only — all the wordmark uses."""
    toks = re.findall(r'[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?', d)
    segs, i, cmd, cur = [], 0, None, (0.0, 0.0)
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd == 'Z':
                segs.append(('Z',))
            continue
        n = lambda k: float(toks[i + k])
        if cmd == 'M':
            cur = (n(0), n(1)); segs.append(('M', cur)); i += 2; cmd = 'L'
        elif cmd == 'L':
            cur = (n(0), n(1)); segs.append(('L', cur)); i += 2
        elif cmd == 'H':
            cur = (n(0), cur[1]); segs.append(('L', cur)); i += 1
        elif cmd == 'V':
            cur = (cur[0], n(0)); segs.append(('L', cur)); i += 1
        elif cmd == 'C':
            p = [(n(0), n(1)), (n(2), n(3)), (n(4), n(5))]
            cur = p[2]; segs.append(('C', p)); i += 6
    return segs


SEGS = parse_svg_path(MARK_PATH)
K = 0.5522847498


def mark_ops(x0, y0, width, body_paint, dot_paint=None):
    """PDF operators drawing the wordmark with its top-left at (x0, y0) in
    top-left page coordinates, `width` wide. Paint strings are complete
    colour + paint-operator fragments, e.g. '1 g' + 'f'."""
    s = width / MARK_W
    P = lambda x, y: f"{x0 + x * s:.3f} {H - (y0 + y * s):.3f}"
    out = [body_paint[0]]
    for seg in SEGS:
        if seg[0] == 'M':
            out.append(f"{P(*seg[1])} m")
        elif seg[0] == 'L':
            out.append(f"{P(*seg[1])} l")
        elif seg[0] == 'C':
            out.append(" ".join(P(*p) for p in seg[1]) + " c")
        else:
            out.append("h")
    out.append(body_paint[1])
    dp = dot_paint or body_paint
    cx, cy, r = DOT
    k = r * K
    out += [dp[0], f"{P(cx + r, cy)} m",
            f"{P(cx + r, cy + k)} {P(cx + k, cy + r)} {P(cx, cy + r)} c",
            f"{P(cx - k, cy + r)} {P(cx - r, cy + k)} {P(cx - r, cy)} c",
            f"{P(cx - r, cy - k)} {P(cx - k, cy - r)} {P(cx, cy - r)} c",
            f"{P(cx + k, cy - r)} {P(cx + r, cy - k)} {P(cx + r, cy)} c", "h", dp[1]]
    return "\n".join(out)


def rgb(c):
    return " ".join(f"{v:.4f}" for v in c)


def rounded_rect(x0, y0, x1, y1, r):
    k = r * K
    yb, yt = H - y1, H - y0  # pdf bottom/top
    return "\n".join([
        f"{x0 + r} {yb} m", f"{x1 - r} {yb} l",
        f"{x1 - r + k} {yb} {x1} {yb + r - k} {x1} {yb + r} c",
        f"{x1} {yt - r} l",
        f"{x1} {yt - r + k} {x1 - r + k} {yt} {x1 - r} {yt} c",
        f"{x0 + r} {yt} l",
        f"{x0 + r - k} {yt} {x0} {yt - r + k} {x0} {yt - r} c",
        f"{x0} {yb + r} l",
        f"{x0} {yb + r - k} {x0 + r - k} {yb} {x0 + r} {yb} c", "h"])


# ── What to remove ───────────────────────────────────────────────────────
# Bboxes (top-left page coords) of Diversify's painted paths, identical on
# every page that carries them.
PATHS = {
    'foot_l': (19, 1046.2, 632.8, 1058.1), 'foot_r': (1343, 1046.2, 1900, 1058.1),
    'lock_word': (168, 95.7, 408.1, 154.3), 'lock_mark': (72, 73, 133, 168),
    'h_sq': (3, 3, 67, 56), 'h_mark': (20, 12, 42.3, 47), 'h_name': (91, 24.7, 147.6, 38.4),
    'h_dash': (172, 30.3, 180.6, 34.5), 'h_tag': (206, 25.7, 409, 37.6),
    'pill': (1753, 15.5, 1907, 43.5), 'pill_txt': (1777, 25.7, 1881.4, 37.4),
    'orb': (1359.8, 514.8, 1419.4, 608.7),
}
# Origins of the matching invisible (searchable) text runs.
TEXTS = {(19, 1055), (1343, 1055), (168, 142), (91, 35), (172, 34.5), (206, 34.5), (1777, 34.5)}

# The outlined watermark mark (pages 1, 2, 7, 12): replaced in place by the
# wordmark outline, stroked at the original line's grey. (x0, y0, width)
OUTLINES = {0: (-80, 260, 1000), 1: (-240, 170, 1500), 6: (680, 330, 1180), 11: (180, -60, 1560)}
OUTLINE_STROKE = 1.4


def near(b, t, tol=1.5):
    return all(abs(x - y) <= tol for x, y in zip(b, t))


def inv(m):
    a, b, c, d, e, f = m
    det = a * d - b * c
    return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]


pdf = pikepdf.open(SRC)
edits = {}      # owner key -> {op index: ('blank'|'n'|ops-to-insert-after)}
streams = {}    # owner key -> (pikepdf object, parsed ops)
seen = {}       # page -> set of matched element names
for pn, page in enumerate(pdf.pages):
    items, cache = pdfwalk.scan(page)
    streams.update(cache)
    hit = seen.setdefault(pn, set())
    for it in items:
        e = edits.setdefault(it.owner, {})
        if it.kind == 'text':
            if any(abs(it.bbox[0] - x) < 1 and abs(it.bbox[1] - y) < 1 for x, y in TEXTS):
                e[it.idx] = ('blank',)
            continue
        name = next((k for k, t in PATHS.items() if near(it.bbox, t)), None)
        if name:
            hit.add(name)
            insert = None
            if name == 'orb':
                # The mark inside the cover mockup's glass orb, kept at the
                # same depth so the orb's highlights still sit over it.
                cx, cy, w = 1389.6, 561.7, 96
                insert = mark_ops(cx - w / 2, cy - w * MARK_H / MARK_W / 2, w, ('1 g', 'f'))
            e[it.idx] = ('n', insert, it.ctm)
        elif (pn in OUTLINES and 150 <= it.nseg <= 320 and isinstance(it.fill, tuple)
              and len(it.fill) == 1 and it.fill[0] < 0.45 and it.bbox[2] - it.bbox[0] > 400):
            hit.add('outline')
            x0, y0, w = OUTLINES[pn]
            g = it.fill[0]
            paint = (f"{g} G {OUTLINE_STROKE} w 1 j", 'S')
            # The outline lives in its own form XObject whose BBox clips to
            # the old mark's bounds, so the new (wider) mark is drawn in the
            # parent stream straight after that form is painted — same depth,
            # without the clip.
            e[it.idx] = ('n', None, None)
            pkey, pidx, pctm = pdfwalk.scan.calls[it.owner]
            pe = edits.setdefault(pkey, {})
            pe[pidx] = ('after', mark_ops(x0, y0, w, paint), pctm)

for key, e in edits.items():
    if not e:
        continue
    owner, ops = streams[key]
    new = []
    for i, ins in enumerate(ops):
        ed = e.get(i)
        if ed is None:
            new.append(ins)
        elif ed[0] == 'after':
            new.append(ins)
            m = inv(ed[2])
            body = f"q {' '.join(f'{v:.6f}' for v in m)} cm\n{ed[1]}\nQ"
            new.extend(pikepdf.parse_content_stream(pikepdf.Stream(pdf, body.encode())))
        elif ed[0] == 'blank':
            new.append(pikepdf.ContentStreamInstruction([pikepdf.Array([])], pikepdf.Operator('TJ')))
        else:
            new.append(pikepdf.ContentStreamInstruction([], pikepdf.Operator('n')))
            if ed[1]:
                m = inv(ed[2])
                body = f"q {' '.join(f'{v:.6f}' for v in m)} cm\n{ed[1]}\nQ"
                new.extend(pikepdf.parse_content_stream(pikepdf.Stream(pdf, body.encode())))
    data = pikepdf.unparse_content_stream(new)
    if isinstance(owner, pikepdf.Page) or owner.get('/Type') == '/Page':
        pikepdf.Page(owner).contents_coalesce()
        owner.Contents.write(data)
    else:
        owner.write(data)

# ── New brand graphics, drawn on top ─────────────────────────────────────
for pn, page in enumerate(pdf.pages):
    hit = seen[pn]
    g = []
    if 'lock_mark' in hit:
        g.append(mark_ops(72, 88, 141, ('1 g', 'f'), (f'{rgb(ORANGE)} rg', 'f')))
    if 'h_sq' in hit:
        g.append(f"{rgb(ORANGE)} rg 3 {H - 56} 64 53 re f")
        g.append(mark_ops(35 - 22, 29.5 - 44 * MARK_H / MARK_W / 2, 44, (f'{rgb(ACCENT_INK)} rg', 'f')))
    if g:
        page.contents_add(pikepdf.Stream(pdf, ("q\n" + "\n".join(g) + "\nQ").encode()), prepend=False)

pdf.docinfo['/Title'] = f'{NAME} — Portfolio 2026'
pdf.docinfo['/Author'] = NAME
for k in ('/Creator', '/Producer', '/Subject', '/Keywords'):
    if k in pdf.docinfo and 'iversify' in str(pdf.docinfo[k]):
        del pdf.docinfo[k]
TMP = OUT + '.stage1.pdf'
pdf.save(TMP)

# ── Text (needs real fonts, so PyMuPDF) ──────────────────────────────────
doc = fitz.open(TMP)
F = {
    'reg': f'{FONTS}/geist-sans/Geist-Regular.ttf',
    'light': f'{FONTS}/geist-sans/Geist-Light.ttf',
    'med': f'{FONTS}/geist-sans/Geist-Medium.ttf',
    'mono': f'{FONTS}/geist-mono/GeistMono-Medium.ttf',
}
FONT = {k: fitz.Font(fontfile=v) for k, v in F.items()}


def text(page, x, y, s, key, size, color):
    page.insert_text((x, y), s, fontname=key, fontfile=F[key], fontsize=size, color=color)
    return x + FONT[key].text_length(s, fontsize=size)


for pn, page in enumerate(doc):
    hit = seen[pn]
    if 'foot_l' in hit:
        text(page, 19, 1055, FOOT_LEFT, 'reg', 12, (0.78,) * 3)
    if 'foot_r' in hit:
        w = FONT['reg'].text_length(FOOT_RIGHT, fontsize=12)
        text(page, 1900 - w, 1055, FOOT_RIGHT, 'reg', 12, (0.78,) * 3)
    if 'lock_word' in hit:
        text(page, 72 + 141 + 30, 140, NAME, 'light', 54, (1, 1, 1))
    if 'h_name' in hit:
        x = text(page, 91, 35, NAME, 'med', 14, INK)
        x = text(page, x + 16, 34.5, '—', 'reg', 12, INK_SOFT)
        text(page, x + 16, 34.5, ROLE, 'reg', 12, INK_SOFT)
    if 'pill' in hit:
        tw = FONT['mono'].text_length(CONTACT, fontsize=11.5)
        x1, x0 = 1907, 1907 - tw - 48
        sh = page.new_shape()
        sh.draw_rect(fitz.Rect(x0, 15.5, x1, 43.5), radius=(14 / (x1 - x0), 0.5))
        sh.finish(fill=ORANGE, color=None)
        sh.commit()
        text(page, x0 + 24, 33.8, CONTACT, 'mono', 11.5, ACCENT_INK)
        page.insert_link({'kind': fitz.LINK_URI, 'from': fitz.Rect(x0, 15.5, x1, 43.5),
                          'uri': f'mailto:{CONTACT}'})

doc.save(OUT, garbage=3, deflate=True)
import os
os.remove(TMP)
for pn in sorted(seen):
    print(pn + 1, sorted(seen[pn]))
