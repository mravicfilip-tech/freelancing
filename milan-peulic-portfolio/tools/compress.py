"""Make a rebranded deck smaller without a visible change.

usage  python3 -I compress.py <tools dir> <in pdf> <out pdf> [max move in pt] [--keep-markers]

1. Outline coordinates are rounded so no point moves more than 0.005pt on the page. Each path
   is rounded against its own placement scale, so art drawn inside a scaled form keeps the
   precision it needs. Transforms, text positions and everything else keep every digit.
2. Soft masks whose every pixel is 253 to 255 are dropped. They change opacity by at most 1%.
3. JPEG photos get optimal Huffman tables, a lossless rewrite. The decoded pixels are checked
   to be identical before a photo is replaced.
4. The empty origin marker in front of every outline glyph is dropped. It paints nothing, and
   the source decks keep theirs, so rebrand.py can still find glyphs on a rebuild.
5. Rewritten streams use zlib level 9, and small objects are packed into object streams.

Run it last, on the output of rebrand.py.
"""
import sys, math, zlib, io, collections
sys.path.insert(0, sys.argv[1])
import pdfparse as P
import pymupdf
import numpy as np
from PIL import Image
import mozjpeg_lossless_optimization as mjo

SRC, OUT = sys.argv[2], sys.argv[3]
MAX_ERR = float(sys.argv[4]) if len(sys.argv) > 4 else 0.005   # largest move of any outline point, in page points
COORD_OPS = {"m": 2, "l": 2, "c": 6, "v": 4, "y": 4, "re": 4}
DROP_MARKERS = "--keep-markers" not in sys.argv

doc = P.load(SRC)
pymupdf.TOOLS.mupdf_display_errors(False)
stats = collections.Counter()

# 1. outline precision, per stream and op, the finest any placement needs
need = collections.defaultdict(dict)     # xref -> {op index: decimals}
streams = {}
worst_scale = {}
drop_ops = {}
page_err = [0.0]
for pno in range(len(doc)):
    pm = P.PageModel(doc, pno)
    for po in pm.paths:
        a, b, c, d = po.ctm[:4]
        scale = max(math.hypot(a, b), math.hypot(c, d))
        dec = max(0, math.ceil(math.log10(scale / (2 * MAX_ERR)) - 1e-9))
        streams[po.stream.xref] = po.stream
        worst_scale[po.stream.xref] = max(worst_scale.get(po.stream.xref, 0), scale)
        # the empty "x y m h" origin marker in front of every glyph draws nothing, a fill of a
        # zero area subpath paints no pixel, so it goes, as long as real outline is left
        ops_ = po.stream.ops
        marks = [i for i in range(po.i0, po.i1 - 1) if ops_[i].op == "m" and ops_[i + 1].op == "h"]
        if marks and len(marks) * 2 < po.i1 - po.i0 and po.paint in ("f", "f*"):
            drop = drop_ops.setdefault(po.stream.xref, set())
            for i in marks:
                drop.update((i, i + 1))
            stats["empty glyph markers dropped"] += len(marks)
        nd = need[po.stream.xref]
        for i in range(po.i0, po.i1):
            if po.stream.ops[i].op in COORD_OPS:
                nd[i] = max(nd.get(i, 0), dec)

for xref, st in streams.items():
    nd = need[xref]
    for i, dec in nd.items():
        o = st.ops[i]
        new_args = []
        for t in o.args:
            if t.kind == "num":
                txt = P.fmt_dec(t.val, dec)
                page_err[0] = max(page_err[0], abs(float(txt) - t.val) * worst_scale[xref])
                new_args.append(P.Tok("num", txt.encode(), float(txt)))
            else:
                new_args.append(t)
        o.args = new_args
    drop = drop_ops.get(xref, set()) if DROP_MARKERS else set()
    data = P.serialize([o for i, o in enumerate(st.ops) if i not in drop])
    before = len(doc.xref_stream_raw(xref))
    raw = zlib.compress(data, 9)
    doc.update_stream(xref, raw, compress=False)
    doc.xref_set_key(xref, "Filter", "/FlateDecode")
    doc.xref_set_key(xref, "DecodeParms", "null")
    stats["outline streams"] += 1
    stats["outline bytes saved"] += before - len(raw)

# 2 and 3. images
for xr in range(1, doc.xref_length()):
    try:
        if not doc.xref_is_stream(xr) or doc.xref_get_key(xr, "Subtype")[1] != "/Image":
            continue
    except Exception:
        continue
    sm = doc.xref_get_key(xr, "SMask")
    if sm[0] == "xref":
        mx = int(sm[1].split()[0])
        pix = pymupdf.Pixmap(doc, mx)
        a = np.frombuffer(pix.samples, dtype=np.uint8)
        if a.min() >= 253:
            stats["near opaque masks dropped"] += 1
            stats["mask bytes saved"] += len(doc.xref_stream_raw(mx))
            doc.xref_set_key(xr, "SMask", "null")
    fl = doc.xref_get_key(xr, "Filter")[1]
    if "DCT" not in fl:
        continue
    raw = doc.xref_stream_raw(xr)
    flate_wrapped = "Flate" in fl
    jpeg = zlib.decompress(raw) if flate_wrapped else raw
    try:
        opt = mjo.optimize(jpeg)
    except Exception:
        continue
    wrapped = zlib.compress(opt, 9)
    best = min(len(opt), len(wrapped))
    if best >= len(raw):
        continue
    a1 = np.asarray(Image.open(io.BytesIO(jpeg)).convert("RGB"))
    a2 = np.asarray(Image.open(io.BytesIO(opt)).convert("RGB"))
    if a1.shape != a2.shape or not np.array_equal(a1, a2):
        stats["photos left as they were"] += 1
        continue
    dp = doc.xref_get_key(xr, "DecodeParms")
    dct_parms = "null"
    if dp[0] == "array":
        inner = dp[1].strip("[] ").split(None, 1)
        dct_parms = inner[1] if len(inner) > 1 else "null"
    elif dp[0] != "null":
        dct_parms = dp[1]
    if len(wrapped) < len(opt):
        # some of these photos still shrink under Flate, so keep the wrapper
        doc.update_stream(xr, wrapped, compress=False)
        doc.xref_set_key(xr, "Filter", "[/FlateDecode /DCTDecode]")
        doc.xref_set_key(xr, "DecodeParms", f"[null {dct_parms}]" if dct_parms != "null" else "null")
    else:
        doc.update_stream(xr, opt, compress=False)
        doc.xref_set_key(xr, "Filter", "/DCTDecode")
        doc.xref_set_key(xr, "DecodeParms", dct_parms)
    stats["photos optimized"] += 1
    stats["photo bytes saved"] += len(raw) - best

doc.save(OUT, garbage=4, deflate=True, use_objstms=1)
import os
print(dict(stats))
print(f"largest move of any outline point {page_err[0]:.5f}pt")
print(f"{os.path.getsize(SRC) / 1e6:.2f} MB -> {os.path.getsize(OUT) / 1e6:.2f} MB")
