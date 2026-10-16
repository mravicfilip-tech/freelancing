"""Rebrand a Diversify portfolio deck to Milan Peulic, in first person.

usage  python3 -I rebrand.py <tools dir> <source pdf> <out pdf> <font dir> <deck> [glyph pdf ...]
deck   general or igaming, it picks the few edits that only one deck needs
glyph pdf  other decks in the same typefaces, read only for letters this deck never draws
"""
import sys, os, re, io, collections
sys.path.insert(0, sys.argv[1])
import pdfparse as P, glyphs as G, edit as E
import numpy as np, cv2, pymupdf
from PIL import Image

SRC, OUT, FONTS, DECK = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
GLYPH_SOURCES = sys.argv[6:]
NAME = "Milan Peulic"
MONO = "MP"
TILE_CENTER = (35.0, 1050.5)      # header tile, 3..67 x 1024..1077
COVER_LEFT = 72.0                 # left edge of the removed cover mark, same as "Portfolio"
STUDIO_OLD = "A design and engineering studio helping companies turn digital products into growth engines."
STUDIO_NEW = "I help companies turn digital products into growth engines through design and engineering."

DECKS = {
    # page, baselines of a paragraph that is also baked into the photo under it, image name,
    # form xref, Do op index
    "general": dict(baked=[(19, (201.0, 179.0, 157.0), "X89", 341, 11)], contact_page=None),
    "igaming": dict(baked=[], contact_page=17),
}
CFG = DECKS[DECK]

doc = P.load(SRC)
pms = [P.PageModel(doc, i) for i in range(len(doc))]
lib = G.Library()
for pm in pms:
    lib.add_page(pm)
extra_pms = []
for extra in GLYPH_SOURCES:
    xdoc = P.load(extra)
    for i in range(len(xdoc)):
        extra_pms.append(P.PageModel(xdoc, i))
        lib.add_page(extra_pms[-1])
F = G.Faces(lib)
REC = G.Recognizer(F)

run_face = collections.defaultdict(collections.Counter)
for e in lib.entries:
    run_face[id(e["run"])][F.face_of[e["cl"]]] += 1
space_w = collections.defaultdict(list)
for pm in pms + extra_pms:          # a face may only ever type a space in another deck
    for r in pm.runs:
        if run_face[id(r)]:
            f = run_face[id(r)].most_common(1)[0][0]
            space_w[f] += [g["w"] for g in r.glyphs if g["char"] == " "]


def face_of(run):
    return run_face[id(run)].most_common(1)[0][0]


def doc_face(fid):
    sw = collections.Counter(space_w[fid]).most_common(1)
    assert sw, f"face {fid} has no space anywhere, its width would be a guess"
    return E.DocFace(F, fid, sw[0][0])


def find_run(pm, text, y=None):
    return [r for r in pm.runs if text in r.text and (y is None or abs(r.glyphs[0]["y"] - y) < 1)]


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
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def near(a, b, tol=1.0):
    return abs(a - b) < tol


M500 = E.TTFFace(os.path.join(FONTS, "Manrope_500.ttf"))
ed = E.Editor(doc)

header_pm = next(pm for pm in pms if find_run(pm, "Diversify", 1045))
cover_face = doc_face(face_of(find_run(pms[0], "Diversify", 938)[0]))
header_face_id = face_of(find_run(header_pm, "Diversify", 1045)[0])
print("faces cover", cover_face.fid, "header", header_face_id)

# Manrope 500 must be the header face, glyph for glyph
for ch in "Diversfy":
    g = F.glyph(header_face_id, ch)
    if g is None:
        continue
    t = M500.layout(ch)[0]
    bb1, bb2 = E.shape_bbox(g["shape"]), E.shape_bbox(t["shape"])
    err = max(abs(a - b) for a, b in zip(bb1, bb2))
    assert err < 0.003 and abs(g["width"] - t["width"]) < 0.002, (ch, bb1, bb2, g["width"], t["width"])
print("Manrope 500 matches the header face")

# the mark, read from the cover lockup
MARK = None
for po in pms[0].paths:
    bb = None if po.glyphs or po.paint != "f" else bbox(pms[0], po)
    if bb and near(bb[0], 72) and near(bb[1], 912) and near(bb[2], 133) and near(bb[3], 1007):
        MARK = opseq(pms[0], po)
        break
assert MARK, "no cover mark on page 1"


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
        if po.glyphs or po.paint != "f" or (po.i1 - po.i0) < 260 or not po.fill:
            continue
        x0, y0, x1, y1 = bbox(pm, po)
        lum = sum(po.fill) / len(po.fill)
        if (x1 - x0) * (y1 - y0) > 300000 and 0.15 < lum < 0.45:
            ed.delete_path(po)
            removed["watermark"] += 1
    # 2. the mark itself
    header = False
    lockup = False
    for po in pm.paths:
        if po.glyphs or opseq(pm, po) != MARK:
            continue
        x0, y0, x1, y1 = bbox(pm, po)
        if near(x0, 72) and near(y0, 912):
            ed.delete_path(po)                      # cover lockup, the name takes its place
            removed["lockup mark"] += 1
            lockup = True
        elif near(x0, 20) and near(y0, 1033):
            ed.path_to_text(po, M500, MONO, 21.0, *TILE_CENTER)
            removed["header mark"] += 1
            header = True
        elif page == 1 and DECK == "general":
            ed.path_to_text(po, M500, MONO, 56.0, (x0 + x1) / 2, (y0 + y1) / 2)
            removed["orb mark"] += 1
        else:
            raise RuntimeError(f"unexpected mark on page {page} at {x0:.0f},{y0:.0f}")
    # 3. the lockup name, every copy of it (the iGaming cover draws it twice)
    if lockup:
        runs = find_run(pm, "Diversify", 938)
        pos = [po for po in pm.paths if any(near(vg["py"], 938, 0.5) and near(vg["px"], 168, 0.5) for vg in po.glyphs)]
        assert len(runs) == len(pos) and runs, (page, len(runs), len(pos))
        for r, po in zip(runs, pos):
            ed.replace_text(pm, 938, 0, 900, "Diversify", NAME, cover_face, start_x=COVER_LEFT,
                            only_pos={po}, only_runs={r})
    # 4. the header name, the dash and tagline move right with it, and the URL pill goes
    if header:
        ed.replace_text(pm, 1045, 80, 1500, "Diversify", NAME, M500)
        for po in pm.paths:
            if po.paint == "n":
                continue
            bb = bbox(pm, po)
            if bb and bb[0] > 1745 and bb[2] < 1915 and bb[1] > 1030 and bb[3] < 1070:
                ed.delete_path(po)
                removed["pill parts"] += 1
        # by position, Acrobat split this text into several runs on some pages
        for r in pm.runs:
            if r.glyphs and all(1745 < g["x"] < 1915 and 1030 < g["y"] < 1070 for g in r.glyphs):
                ed.clear_run(r, pm.pno)
                removed["pill text runs"] += 1
    # 5. the copyright line, right aligned
    ed.replace_text(pm, 25, 1300, 1920, "Diversify", NAME, M500, anchor="right")

# 6. the closing contact page, whose email, LinkedIn and site are Diversify's
if CFG["contact_page"]:
    pm = pms[CFG["contact_page"] - 1]
    for po in pm.paths:
        bb = bbox(pm, po) if po.glyphs else None
        if bb and bb[0] > 1170 and 100 < bb[1] < 1000:
            ed.delete_path(po)
            removed["contact text"] += 1
    for r in pm.runs:
        if r.glyphs[0]["x"] > 1170 and 100 < r.glyphs[0]["y"] < 1000:
            ed.clear_run(r, pm.pno)
            removed["contact text layer"] += 1
    page = doc[pm.pno]
    for lnk in page.get_links():
        if re.search(r"diversify|dvrsfy", lnk.get("uri", ""), re.I):
            page.delete_link(lnk)
            removed["contact links"] += 1

# 7. first person
p2 = pms[1]
if find_run(p2, "A design and engineering studio"):
    a, b = STUDIO_OLD.split(" growth engines.")[0], "growth engines."
    ed.replace_text(p2, 248, 100, 1000, a, "I help companies turn digital products into growth engines",
                    doc_face(face_of(find_run(p2, "A design and engineering")[0])))
    ed.replace_text(p2, 222, 100, 1000, b, "through design and engineering.",
                    doc_face(face_of(find_run(p2, "growth engines.")[0])))

we = re.compile(r"\b[Ww]e\b")
for pm in pms:
    ys = sorted({round(g["y"], 1) for r in pm.runs if r.trm0[1] == 0 for g in r.glyphs})
    for y in ys:
        for x0, x1 in segments(pm, y):
            vis, inv = ed.line(pm, y, x0, x1, tol=0.3)
            text = "".join(e["char"] for _, e in inv)
            for m in reversed(list(we.finditer(text))):
                gi, count = 0, 0
                for i, (_, e) in enumerate(inv):
                    if count >= m.start():
                        gi = i
                        break
                    count += len(e["char"])
                fid = face_of(inv[gi][0])
                occ = [h.start() for h in re.finditer(re.escape(m.group()), text)].index(m.start())
                ed.replace_text(pm, y, x0, x1, m.group(), "I", doc_face(fid), occurrence=occ)

# lines drawn as outlines with no text layer at all, named by shape
for pm in pms:
    _, unmatched = G.match_page(pm)
    lines = collections.defaultdict(list)
    for po, vg in unmatched:
        if vg.get("deleted"):
            continue
        g = REC.recognize(po, vg)
        if g:
            lines[(id(po), round(vg["py"], 1))].append(dict(po=po, vg=vg, **g))
    for key, line in lines.items():
        line.sort(key=lambda g: g["vg"]["px"])
        text, idx = "", []
        for k, g in enumerate(line):
            if k and g["vg"]["px"] - line[k - 1]["vg"]["px"] - line[k - 1]["width"] * g["size"] > 0.15 * g["size"]:
                text += " "
                idx.append(None)
            text += g["char"]
            idx += [k] * len(g["char"])
        for m in reversed(list(we.finditer(text))):
            a = idx[m.start()]
            b = idx[m.end() - 1] + 1
            ed.replace_visible(pm, line, a, b, "I", doc_face(line[a]["face"]))
        if len(text) > 3:
            ed.log.append(f"   p{pm.pno + 1} y={key[1]:.0f} outlines without text read as {text[:60]!r}")


# 8. text baked into a background photo under an edited line. The photo keeps its pixels,
# a small patch of it with the words removed is laid over them, under the outline text.
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
    # original positions from the text layer, the outline glyphs have already moved
    gl = [(g, r.size) for r in pm.runs for g in r.glyphs
          if any(abs(g["y"] - y) < 0.5 for y in ys) and not g["char"].isspace()]
    assert len({round(g["y"]) for g, _ in gl}) == len(ys), "a baseline has no text"
    x0 = min(g["x"] for g, _ in gl) - 6
    x1 = max(g["x"] + g["w"] * sz for g, sz in gl) + 8
    y0, y1 = min(ys) - 8, max(ys) + 16
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
    ed.log.append(f"p{pno} y={ys[0]:.0f}: photo patched under the paragraph, {cx1 - cx0}x{cy1 - cy0}px")


for b in CFG["baked"]:
    patch_baked_line(*b)

ed.apply()


# 9. tagged PDFs keep a copy of the words as ActualText, which copy and search read first
def lit_escape(bs):
    out = bytearray()
    for c in bs:
        if c in (0x28, 0x29, 0x5C):
            out += b"\\" + bytes([c])
        elif c == 10:
            out += b"\\n"
        elif c == 13:
            out += b"\\r"
        elif 32 <= c < 127:
            out.append(c)
        else:
            out += b"\\%03o" % c
    return out.decode("latin1")


def raw_actualtext(xr):
    raw = doc.xref_object(xr, compressed=True)
    m = re.search(r"/ActualText\s*\(", raw)
    if not m:
        return None
    toks = P.tokenize(raw[m.end() - 1:].encode("latin1"))
    return toks[0].val if toks and toks[0].kind == "str" else None


pg = {p.xref: i + 1 for i, p in enumerate(doc)}
contact_xref = doc[CFG["contact_page"] - 1].xref if CFG["contact_page"] else None
tags = collections.Counter()
for xr in range(1, doc.xref_length()):
    try:
        t = doc.xref_get_key(xr, "ActualText")
    except Exception:
        continue
    if t[0] not in ("string", "hexstring"):
        continue
    val = raw_actualtext(xr)
    if val is None:
        continue
    pk = doc.xref_get_key(xr, "Pg")
    on_contact = pk[0] == "xref" and int(pk[1].split()[0]) == contact_xref
    s_type = doc.xref_get_key(xr, "S")[1]
    if val.strip() == b"letsdiversify.com" or (on_contact and (s_type == "/Link" or
                                               val.strip().lower() in (b"website", b"company page", b"email address"))):
        doc.xref_set_key(xr, "ActualText", "null")
        if s_type == "/Link":
            k = doc.xref_get_key(xr, "K")
            mcid = re.match(r"\[\s*(\d+)", k[1])
            doc.xref_set_key(xr, "K", mcid.group(1) if mcid else "null")
            doc.xref_set_key(xr, "S", "/Span")
        tags["removed"] += 1
        continue
    new = val
    new = new.replace(STUDIO_OLD.encode(), STUDIO_NEW.encode())
    new = re.sub(rb"\bDiversify\b", NAME.encode(), new)
    new = re.sub(rb"\b[Ww]e\b", b"I", new)
    if new != val:
        doc.xref_set_key(xr, "ActualText", "(" + lit_escape(new) + ")")
        tags["rewritten"] += 1



# 10. pages cut from the deck can survive as hidden objects when a bookmark still points at
# them (the general deck kept its old Diversify contact page that way). Unlink those bookmarks
# so the save drops the page.
def key_ref(xr, key):
    v = doc.xref_get_key(xr, key)
    return int(v[1].split()[0]) if v[0] == "xref" else None


pymupdf.TOOLS.mupdf_display_errors(False)   # free slots left by deleted links are expected here
live = {p.xref for p in doc}
orphans = set()
for xr in range(1, doc.xref_length()):
    try:
        if doc.xref_get_key(xr, "Type") == ("name", "/Page") and xr not in live:
            orphans.add(xr)
    except Exception:
        pass
for xr in range(1, doc.xref_length()):
    try:
        o = doc.xref_object(xr, compressed=True)
    except Exception:
        continue
    if "/Title" not in o or "/Parent" not in o:
        continue
    act = key_ref(xr, "A")
    target = doc.xref_object(act, compressed=True) if act else o
    if not any(re.search(rf"\b{op} 0 R", target) for op in orphans):
        continue
    prev, nxt, parent = key_ref(xr, "Prev"), key_ref(xr, "Next"), key_ref(xr, "Parent")
    if prev:
        doc.xref_set_key(prev, "Next", f"{nxt} 0 R" if nxt else "null")
    else:
        doc.xref_set_key(parent, "First", f"{nxt} 0 R" if nxt else "null")
    if nxt:
        doc.xref_set_key(nxt, "Prev", f"{prev} 0 R" if prev else "null")
    else:
        doc.xref_set_key(parent, "Last", f"{prev} 0 R" if prev else "null")
    cnt = doc.xref_get_key(parent, "Count")
    if cnt[0] == "int" and int(cnt[1]) > 0:
        doc.xref_set_key(parent, "Count", str(int(cnt[1]) - 1))
    removed["bookmarks to hidden pages"] += 1
pymupdf.TOOLS.mupdf_display_errors(True)

print("\n".join(ed.log))
print(dict(removed), dict(tags))
doc.save(OUT, garbage=3, deflate=True)
print("saved", OUT, os.path.getsize(OUT))

# 11. the saved file must not name Diversify anywhere, visible or not, and hold no hidden pages
out = pymupdf.open(OUT)
pymupdf.TOOLS.mupdf_display_errors(False)
live = {p.xref for p in out}
bad = []
for xr in range(1, out.xref_length()):
    try:
        o = out.xref_object(xr, compressed=True)
    except Exception:
        continue
    if re.search(r"iversify|dvrsfy", o, re.I):
        bad.append((xr, o[:100]))
    if out.xref_get_key(xr, "Type") == ("name", "/Page") and xr not in live:
        bad.append((xr, "hidden page"))
    if out.xref_is_stream(xr):
        st = out.xref_stream(xr)
        if st and re.search(rb"iversify|dvrsfy", st, re.I):
            bad.append((xr, "stream"))
text = "".join(p.get_text() for p in out)
if re.search(r"iversify|dvrsfy", text, re.I):
    bad.append(("text", "extracted text"))
pymupdf.TOOLS.mupdf_display_errors(True)
assert not bad, f"Diversify still in the saved file {bad[:6]}"
print("saved file scanned, no Diversify in any object, stream or text, no hidden pages")
