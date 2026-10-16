"""Rebrand the Diversify portfolio to Milan Peulic, in first person.

usage  python3 -I rebrand.py <tools dir> <source pdf> <out pdf> <font dir>
"""
import sys, os, re, collections
sys.path.insert(0, sys.argv[1])
import pdfparse as P, glyphs as G, edit as E

SRC, OUT, FONTS = sys.argv[2], sys.argv[3], sys.argv[4]
NAME = "Milan Peulic"
MONO = "MP"
TILE_CENTER = (35.0, 1050.5)      # header tile, 3..67 x 1024..1077
COVER_LEFT = 72.0                 # left edge of the removed cover mark, same as "Portfolio"
HEADER_PAGES = set(range(3, 25)) - {7, 12}

doc = P.load(SRC)
pms = [P.PageModel(doc, i) for i in range(len(doc))]
lib = G.Library()
for pm in pms:
    lib.add_page(pm)
F = G.Faces(lib)

run_face = collections.defaultdict(collections.Counter)
for e in lib.entries:
    run_face[id(e["run"])][F.face_of[e["cl"]]] += 1
space_w = collections.defaultdict(list)
for pm in pms:
    for r in pm.runs:
        if run_face[id(r)]:
            f = run_face[id(r)].most_common(1)[0][0]
            space_w[f] += [g["w"] for g in r.glyphs if g["char"] == " "]


def face_of(run):
    return run_face[id(run)].most_common(1)[0][0]


def doc_face(fid):
    sw = collections.Counter(space_w[fid]).most_common(1)
    return E.DocFace(F, fid, sw[0][0] if sw else 0.25)


def find_run(pm, text, y=None):
    hits = [r for r in pm.runs if text in r.text and (y is None or abs(r.glyphs[0]["y"] - y) < 1)]
    return hits


M500 = E.TTFFace(os.path.join(FONTS, "Manrope_500.ttf"))
ed = E.Editor(doc)

# faces by role, read from the document itself
cover_face = doc_face(face_of(find_run(pms[0], "Diversify", 938)[0]))
header_face_id = face_of(find_run(pms[2], "Diversify", 1045)[0])
footer_face_id = face_of(find_run(pms[2], "Copyright")[0])
print("faces cover", cover_face.fid, "header", header_face_id, "footer", footer_face_id)

# check Manrope 500 is the header and footer face, glyph for glyph
for ch in "Diversfy":
    g = F.glyph(header_face_id, ch)
    t = M500.layout(ch)[0]
    if g is None:
        continue
    ok = G.shapes_close(g["shape"], t["shape"], tol=0.003) or len(g["shape"]) == len(t["shape"])
    bb1, bb2 = E.shape_bbox(g["shape"]), E.shape_bbox(t["shape"])
    err = max(abs(a - b) for a, b in zip(bb1, bb2))
    assert err < 0.003 and abs(g["width"] - t["width"]) < 0.002, (ch, bb1, bb2, g["width"], t["width"])
print("Manrope 500 matches the header face")


def opseq(pm, po):
    ops = pm.streams[po.stream.xref].ops
    return tuple(ops[i].op for i in range(po.i0, po.i1))


def bbox(pm, po):
    ops = pm.streams[po.stream.xref].ops
    xs, ys = [], []
    for i in range(po.i0, po.i1):
        n = ops[i].nums()
        for k in range(0, len(n) - 1, 2):
            x, y = P.apply(po.ctm, n[k], n[k + 1])
            xs.append(x)
            ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


MARK = next(opseq(pms[0], po) for po in pms[0].paths if po.stream.xref == 201 and po.i0 == 5652)


def segments(pm, y, tol=1.0):
    ents = sorted(((g, r.size) for r in pm.runs if r.trm0[1] == 0 for g in r.glyphs if abs(g["y"] - y) < tol),
                  key=lambda t: t[0]["x"])
    segs, cur = [], []
    for g, sz in ents:
        if cur and g["x"] - cur[-1]["x"] > max(60, 2.5 * sz):
            segs.append(cur)
            cur = []
        cur.append(g)
    if cur:
        segs.append(cur)
    return [(s[0]["x"] - 0.5, s[-1]["x"] + 0.5) for s in segs]


removed = collections.Counter()
for pm in pms:
    page = pm.pno + 1
    # 1. the outline watermark of the mark, on the dark pages
    for po in pm.paths:
        if po.glyphs or po.paint != "f" or (po.i1 - po.i0) < 260:
            continue
        x0, y0, x1, y1 = bbox(pm, po)
        if (x1 - x0) * (y1 - y0) > 300000 and len(po.fill or ()) == 1 and 0.2 < po.fill[0] < 0.4:
            ed.delete_path(po)
            removed["watermark"] += 1
    # 2. the mark itself
    for po in pm.paths:
        if po.glyphs or opseq(pm, po) != MARK:
            continue
        x0, y0, x1, y1 = bbox(pm, po)
        if page in (1, 2) and abs(x0 - 72) < 1 and abs(y0 - 912) < 1:
            ed.delete_path(po)                      # cover lockup, the name takes its place
            removed["cover mark"] += 1
        elif page == 1:
            ed.path_to_text(po, M500, MONO, 56.0, (x0 + x1) / 2, (y0 + y1) / 2)
            removed["orb mark"] += 1
        elif page in HEADER_PAGES and abs(x0 - 20) < 1:
            ed.path_to_text(po, M500, MONO, 21.0, *TILE_CENTER)
            removed["header mark"] += 1
        else:
            raise RuntimeError(f"unexpected mark on page {page} at {x0:.0f},{y0:.0f}")
    # 3. the cover wordmark
    if page in (1, 2):
        ed.replace_text(pm, 938, 0, 900, "Diversify", NAME, cover_face, start_x=COVER_LEFT)
    # 4. the header wordmark, the dash and tagline move right with it
    if page in HEADER_PAGES:
        ed.replace_text(pm, 1045, 80, 1500, "Diversify", NAME, M500)
        # the letsdiversify.com pill and its text
        for po in pm.paths:
            if po.paint == "n":
                continue
            x0, y0, x1, y1 = bbox(pm, po)
            if x0 > 1745 and x1 < 1915 and y0 > 1030 and y1 < 1070:
                ed.delete_path(po)
                removed["pill parts"] += 1
        for r in find_run(pm, "letsdiversify.com"):
            ed.clear_run(r, pm.pno)
            removed["pill text"] += 1
    # 5. the copyright line, right aligned
    ed.replace_text(pm, 25, 1300, 1920, "Diversify", NAME, M500, anchor="right")

# 6. first person
p2 = pms[1]
ed.replace_text(p2, 248, 100, 1000, "A design and engineering studio helping companies turn digital products into",
                "I help companies turn digital products into growth engines", doc_face(
                    face_of(find_run(p2, "A design and engineering")[0])))
ed.replace_text(p2, 222, 100, 1000, "growth engines.", "through design and engineering.",
                doc_face(face_of(find_run(p2, "growth engines.")[0])))

we = re.compile(r"\b[Ww]e\b")
for pm in pms:
    ys = sorted({round(g["y"], 1) for r in pm.runs if r.trm0[1] == 0 for g in r.glyphs})
    for y in ys:
        for x0, x1 in segments(pm, y):
            vis, inv = ed.line(pm, y, x0, x1, tol=0.3)
            text = "".join(e["char"] for _, e in inv)
            hits = list(we.finditer(text))
            for m in reversed(hits):
                # the run holding the W decides the face
                gi = 0
                count = 0
                for i, (_, e) in enumerate(inv):
                    if count >= m.start():
                        gi = i
                        break
                    count += len(e["char"])
                fid = face_of(inv[gi][0])
                occ = [h.start() for h in re.finditer(re.escape(m.group()), text)].index(m.start())
                ed.replace_text(pm, y, x0, x1, m.group(), "I", doc_face(fid), occurrence=occ)

# 7. text baked into a background photo under an edited line. The photo keeps its pixels,
# a small inpainted patch of it is laid over the old words, under the outline text.
import io
import numpy as np, cv2, pymupdf
from PIL import Image

# page, baselines of the whole paragraph (so its lines keep one weight), image name, form xref, Do op
BAKED = [(19, (201.0, 179.0, 157.0), "X89", 341, 11)]


def patch_baked_line(pno, ys, img_name, form_xref, do_idx):
    pm = pms[pno - 1]
    st = pm.streams[form_xref]
    do = st.ops[do_idx]
    assert do.op == "Do" and do.args[0].val == img_name
    res = P.resources_of(doc, form_xref, False)
    img = res["XObject"][img_name]
    pix = pymupdf.Pixmap(doc, img)
    assert pix.n == 3 and not pix.alpha
    W, H = pix.width, pix.height
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(H, W, 3).copy()
    # extent of the original outline line, plus a margin
    # original positions from the text layer, the outline glyphs have already moved
    gl = [(g, r.size) for r in pm.runs for g in r.glyphs
          if any(abs(g["y"] - y) < 0.5 for y in ys) and not g["char"].isspace()]
    assert len({round(g["y"]) for g, _ in gl}) == len(ys), "a baseline has no text"
    x0 = min(g["x"] for g, _ in gl) - 6
    x1 = max(g["x"] + g["w"] * sz for g, sz in gl) + 8
    y0, y1 = min(ys) - 8, max(ys) + 16
    y = ys[0]
    cx0, cx1 = int(x0 * W / 1920), int(np.ceil(x1 * W / 1920))
    cy0, cy1 = int((1080 - y1) * H / 1080), int(np.ceil((1080 - y0) * H / 1080))
    crop = np.ascontiguousarray(arr[cy0:cy1, cx0:cx1])
    # the text is thin against a smooth dark photo, so a wide median is the photo without it
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    bg = cv2.medianBlur(gray, 41)
    mask = (np.abs(gray.astype(int) - bg.astype(int)) > 9).astype(np.uint8) * 255
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=2)
    bg_rgb = cv2.medianBlur(crop, 41)
    soft = cv2.GaussianBlur(mask, (5, 5), 0).astype(float)[..., None] / 255
    clean = (crop * (1 - soft) + bg_rgb * soft).round().clip(0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(clean).save(buf, "JPEG", quality=95, subsampling=0)
    Image.fromarray(clean).save(os.path.join(os.path.dirname(OUT), f"patch_p{pno}.png"))
    cs = doc.xref_get_key(img, "ColorSpace")[1]
    px = doc.get_new_xref()
    doc.update_object(px, f"<< /Type /XObject /Subtype /Image /Width {cx1 - cx0} /Height {cy1 - cy0} "
                          f"/ColorSpace {cs} /BitsPerComponent 8 /Filter /DCTDecode >>")
    doc.update_stream(px, buf.getvalue(), compress=False)
    doc.xref_set_key(px, "Filter", "/DCTDecode")
    name = f"XP{pno}"
    rk = doc.xref_get_key(form_xref, "Resources")
    rx = int(rk[1].split()[0])
    xk = doc.xref_get_key(rx, "XObject")
    if xk[0] == "xref":
        doc.xref_set_key(int(xk[1].split()[0]), name, f"{px} 0 R")
    else:
        doc.xref_set_key(rx, f"XObject/{name}", f"{px} 0 R")
    a, d = (cx1 - cx0) / W, (cy1 - cy0) / H
    e, f = cx0 / W, 1 - cy1 / H
    ed.insert_before(st, do_idx + 1, [
        P.Op([], "q", -1),
        P.Op([P.num(a), P.num(0), P.num(0), P.num(d), P.num(e), P.num(f)], "cm", -1),
        P.Op([P.Tok("name", ("/" + name).encode(), name)], "Do", -1),
        P.Op([], "Q", -1)])
    ed.log.append(f"p{pno} y={y:.0f}: photo patched under the line, {cx1 - cx0}x{cy1 - cy0}px, {int(mask.astype(bool).sum())} text px")


for b in BAKED:
    patch_baked_line(*b)

ed.apply()
print("\n".join(ed.log))
print(dict(removed))
doc.save(OUT, garbage=3, deflate=True)
print("saved", OUT, os.path.getsize(OUT))
