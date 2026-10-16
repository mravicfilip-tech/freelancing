"""Small PDF content stream interpreter for the Figma export.

Figma draws every visible glyph as a filled outline and lays an invisible
Type 3 text layer on top for search. This module tokenizes content streams,
tracks the CTM through forms, and records
  - text runs from the invisible layer, with each glyph origin in page space
  - filled path objects, split into glyphs at the empty "x y m h" origin markers
"""
import re
import pymupdf

WS = b" \t\r\n\x00\x0c"
DELIM = b"()<>[]{}/%"


class Tok:
    __slots__ = ("kind", "raw", "val")

    def __init__(self, kind, raw, val=None):
        self.kind, self.raw, self.val = kind, raw, val

    def __repr__(self):
        return f"{self.kind}:{self.raw[:30]!r}"


def tokenize(data):
    i, n = 0, len(data)
    out = []
    while i < n:
        ch = data[i:i + 1]
        if ch in (b" ", b"\t", b"\r", b"\n", b"\x00", b"\x0c"):
            i += 1
            continue
        if ch == b"%":
            j = data.find(b"\n", i)
            i = n if j < 0 else j + 1
            continue
        if ch == b"(":
            depth, j = 0, i
            while j < n:
                c = data[j:j + 1]
                if c == b"\\":
                    j += 2
                    continue
                if c == b"(":
                    depth += 1
                elif c == b")":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            raw = data[i:j + 1]
            out.append(Tok("str", raw, unescape(raw[1:-1])))
            i = j + 1
            continue
        if data[i:i + 2] == b"<<" or data[i:i + 2] == b">>":
            out.append(Tok("dictdelim", data[i:i + 2]))
            i += 2
            continue
        if ch == b"<":
            j = data.find(b">", i)
            raw = data[i:j + 1]
            hx = re.sub(rb"\s", b"", raw[1:-1])
            if len(hx) % 2:
                hx += b"0"
            out.append(Tok("str", raw, bytes.fromhex(hx.decode())))
            i = j + 1
            continue
        if ch in (b"[", b"]", b"{", b"}"):
            out.append(Tok("delim", ch))
            i += 1
            continue
        if ch == b"/":
            j = i + 1
            while j < n and data[j:j + 1] not in WS and data[j:j + 1] not in DELIM:
                j += 1
            out.append(Tok("name", data[i:j], data[i + 1:j].decode("latin1")))
            i = j
            continue
        j = i
        while j < n and data[j:j + 1] not in WS and data[j:j + 1] not in DELIM:
            j += 1
        if j == i:
            j = i + 1
        raw = data[i:j]
        try:
            out.append(Tok("num", raw, float(raw)))
        except ValueError:
            out.append(Tok("op", raw, raw.decode("latin1")))
            if raw == b"ID":
                k = data.find(b"EI", j)
                out.append(Tok("inline", data[j:k]))
                j = k
        i = j
    return out


def unescape(b):
    out = bytearray()
    i = 0
    while i < len(b):
        c = b[i]
        if c == 0x5C:
            i += 1
            e = b[i:i + 1]
            m = {b"n": 10, b"r": 13, b"t": 9, b"b": 8, b"f": 12, b"(": 40, b")": 41, b"\\": 92}
            if e in m:
                out.append(m[e])
                i += 1
            elif e.isdigit():
                k = i
                while k < len(b) and k < i + 3 and b[k:k + 1].isdigit():
                    k += 1
                out.append(int(b[i:k], 8) & 255)
                i = k
            elif e in (b"\n", b"\r"):
                i += 1
            else:
                out.append(b[i])
                i += 1
        else:
            out.append(c)
            i += 1
    return bytes(out)


class Op:
    __slots__ = ("args", "op", "idx")

    def __init__(self, args, op, idx):
        self.args, self.op, self.idx = args, op, idx

    def nums(self):
        return [a.val for a in self.args]


def group_ops(tokens):
    """Group tokens into operations. Arrays become one Python list arg."""
    ops, stack = [], []
    arr_stack = []
    for t in tokens:
        if t.kind == "delim" and t.raw == b"[":
            arr_stack.append([])
            continue
        if t.kind == "delim" and t.raw == b"]":
            a = arr_stack.pop()
            item = Tok("arr", b"", a)
            (arr_stack[-1] if arr_stack else stack).append(item)
            continue
        if arr_stack:
            arr_stack[-1].append(t)
            continue
        if t.kind == "op":
            ops.append(Op(stack, t.val, len(ops)))
            stack = []
        else:
            stack.append(t)
    return ops


def fmt(v):
    if abs(v - round(v)) < 1e-9:
        return str(int(round(v)))
    s = f"{v:.5f}".rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def tok_bytes(t):
    if t.kind == "arr":
        return b"[" + b" ".join(tok_bytes(x) for x in t.val) + b"]"
    if t.kind == "num" and t.raw == b"":
        return fmt(t.val).encode()
    return t.raw


def serialize(ops):
    lines = []
    for o in ops:
        if o.op is None:
            continue
        parts = [tok_bytes(a) for a in o.args]
        if o.op == "__raw__":
            lines.append(b" ".join(parts))
            continue
        parts.append(o.op.encode("latin1"))
        lines.append(b" ".join(parts))
        if o.op == "ID":
            pass
    return b"\n".join(lines) + b"\n"


def num(v):
    return Tok("num", b"", float(v))


# ---------- matrices ----------

def mmul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + b1 * c2, a1 * b2 + b1 * d2,
            c1 * a2 + d1 * c2, c1 * b2 + d1 * d2,
            e1 * a2 + f1 * c2 + e2, e1 * b2 + f1 * d2 + f2)


def apply(m, x, y):
    a, b, c, d, e, f = m
    return a * x + c * y + e, b * x + d * y + f


def inv(m):
    a, b, c, d, e, f = m
    det = a * d - b * c
    ia, ib, ic, id_ = d / det, -b / det, -c / det, a / det
    ie = -(e * ia + f * ic)
    if_ = -(e * ib + f * id_)
    return (ia, ib, ic, id_, ie, if_)


IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


# ---------- fonts ----------

def parse_tounicode(doc, xref):
    s = doc.xref_stream(xref).decode("latin1")
    m = {}
    for blk in re.findall(r"beginbfchar(.*?)endbfchar", s, re.S):
        for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            m[int(a, 16)] = bytes.fromhex(b).decode("utf-16-be")
    for blk in re.findall(r"beginbfrange(.*?)endbfrange", s, re.S):
        for a, b, c in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            lo, hi, st = int(a, 16), int(b, 16), int(c, 16)
            for k in range(lo, hi + 1):
                m[k] = chr(st + k - lo)
    return m


class Font:
    def __init__(self, doc, xref):
        self.xref = xref
        obj = doc.xref_object(xref)
        self.first = int(doc.xref_get_key(xref, "FirstChar")[1])
        wkey = doc.xref_get_key(xref, "Widths")
        wtxt = doc.xref_object(int(wkey[1].split()[0])) if wkey[0] == "xref" else wkey[1]
        self.widths = [float(x) for x in re.findall(r"-?[\d.]+", wtxt)]
        tu = doc.xref_get_key(xref, "ToUnicode")
        self.uni = parse_tounicode(doc, int(tu[1].split()[0])) if tu[0] == "xref" else {}
        fm = doc.xref_get_key(xref, "FontMatrix")[1]
        self.fm = tuple(float(x) for x in re.findall(r"-?[\d.]+", fm))

    def width(self, code):
        k = code - self.first
        return self.widths[k] if 0 <= k < len(self.widths) else 0.0


# ---------- interpreter ----------

class Stream:
    """One content stream (page contents or a form XObject)."""

    def __init__(self, xref, ops, owner):
        self.xref, self.ops, self.owner = xref, ops, owner


class TextRun:
    def __init__(self, stream, op, size_page, glyphs, trm0, font=None, trm_end=None, tstate=None):
        self.stream, self.op = stream, op
        self.font, self.trm_end, self.tstate = font, trm_end, tstate
        self.size = size_page
        self.glyphs = glyphs  # list of dict(code, char, x, y, adv)
        self.trm0 = trm0

    @property
    def text(self):
        return "".join(g["char"] for g in self.glyphs)


class PathObj:
    def __init__(self, stream, i0, i1, ctm, fill, gs):
        self.stream, self.i0, self.i1 = stream, i0, i1  # op index range [i0, i1] (i1 = paint op)
        self.ctm, self.fill, self.gs = ctm, fill, gs
        self.glyphs = []  # list of dict(ox, oy, page_xy, ops=[op indices])


def resources_of(doc, xref, is_page):
    """Return dict kind -> {name: xref} for Font and XObject."""
    res = {"Font": {}, "XObject": {}}
    if is_page:
        r = doc.xref_get_key(xref, "Resources")
    else:
        r = doc.xref_get_key(xref, "Resources")
    if r[0] == "null":
        return res
    if r[0] == "xref":
        rx = int(r[1].split()[0])
        get = lambda k: doc.xref_get_key(rx, k)
    else:
        get = lambda k: doc.xref_get_key(xref, "Resources/" + k)
    for kind in ("Font", "XObject"):
        v = get(kind)
        if v[0] == "dict":
            for name, ref in re.findall(r"/([^\s/<>\[\]]+)\s+(\d+)\s+0\s+R", v[1]):
                res[kind][name] = int(ref)
        elif v[0] == "xref":
            dx = int(v[1].split()[0])
            for name, ref in re.findall(r"/([^\s/<>\[\]]+)\s+(\d+)\s+0\s+R", doc.xref_object(dx)):
                res[kind][name] = int(ref)
    return res


class PageModel:
    def __init__(self, doc, pno):
        self.doc, self.pno = doc, pno
        self.page = doc[pno]
        self.streams = {}
        self.runs, self.paths = [], []
        self.fonts = {}
        self._walk_page()

    def _font(self, xref):
        if xref not in self.fonts:
            self.fonts[xref] = Font(self.doc, xref)
        return self.fonts[xref]

    def _walk_page(self):
        doc, page = self.doc, self.page
        cont = page.get_contents()
        data = b"".join(doc.xref_stream(x) for x in cont)
        if len(cont) != 1:
            raise RuntimeError(f"page {self.pno + 1} has {len(cont)} content streams")
        res = resources_of(doc, page.xref, True)
        self._interp(cont[0], data, res, IDENT, owner=("page", page.xref))

    def _interp(self, xref, data, res, base_ctm, owner):
        ops = group_ops(tokenize(data))
        st = Stream(xref, ops, owner)
        self.streams[xref] = st
        ctm = base_ctm
        stack = []
        fill = None
        gs = None
        # text state
        font, tfs, tc, tw, th, tl, trise = None, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0
        fname = None
        tm = tlm = IDENT
        path_start = None
        for k, o in enumerate(ops):
            op = o.op
            if op == "q":
                stack.append((ctm, fill, gs))
            elif op == "Q":
                ctm, fill, gs = stack.pop()
            elif op == "cm":
                ctm = mmul(tuple(o.nums()), ctm)
            elif op in ("g", "rg", "k", "sc", "scn"):
                fill = tuple(a.val for a in o.args if a.kind == "num")
            elif op == "gs":
                gs = o.args[0].val
            elif op == "Do":
                name = o.args[0].val
                xr = res["XObject"].get(name)
                if xr is None:
                    continue
                st_ = self.doc.xref_get_key(xr, "Subtype")[1]
                if st_ == "/Form":
                    mat = self.doc.xref_get_key(xr, "Matrix")
                    fm = IDENT
                    if mat[0] == "array":
                        fm = tuple(float(x) for x in re.findall(r"-?[\d.]+(?:e-?\d+)?", mat[1]))
                    sub = resources_of(self.doc, xr, False)
                    if xr in self.streams:
                        # same form drawn twice; record a second placement
                        self._interp(xr, self.doc.xref_stream(xr), sub, mmul(fm, ctm), owner=("form", xr, "again"))
                    else:
                        self._interp(xr, self.doc.xref_stream(xr), sub, mmul(fm, ctm), owner=("form", xr))
            elif op == "BT":
                tm = tlm = IDENT
            elif op == "Tf":
                fname = o.args[0].val
                font = self._font(res["Font"][fname])
                tfs = o.args[1].val
            elif op == "Tc":
                tc = o.args[0].val
            elif op == "Tw":
                tw = o.args[0].val
            elif op == "Tz":
                th = o.args[0].val / 100
            elif op == "TL":
                tl = o.args[0].val
            elif op == "Ts":
                trise = o.args[0].val
            elif op == "Tm":
                tm = tlm = tuple(o.nums())
            elif op in ("Td", "TD"):
                tx, ty = o.nums()
                if op == "TD":
                    tl = -ty
                tlm = tm = mmul((1, 0, 0, 1, tx, ty), tlm)
            elif op == "T*":
                tlm = tm = mmul((1, 0, 0, 1, 0, -tl), tlm)
            elif op in ("TJ", "Tj"):
                items = o.args[0].val if op == "TJ" else [o.args[0]]
                glyphs = []
                trm0 = mmul(mmul((tfs * th, 0, 0, tfs, 0, trise), tm), ctm)
                for it in items:
                    if it.kind == "num":
                        tm = mmul((1, 0, 0, 1, -it.val / 1000 * tfs * th, 0), tm)
                        continue
                    for code in it.val:
                        trm = mmul(mmul((tfs * th, 0, 0, tfs, 0, trise), tm), ctm)
                        w = font.width(code) * font.fm[0]
                        adv = (w * tfs + tc + (tw if code == 32 else 0)) * th
                        x, y = trm[4], trm[5]
                        glyphs.append(dict(code=code, char=font.uni.get(code, "�"), x=x, y=y, w=w))
                        tm = mmul((1, 0, 0, 1, adv, 0), tm)
                size = (trm0[0] ** 2 + trm0[1] ** 2) ** 0.5
                trm_end = mmul(mmul((tfs * th, 0, 0, tfs, 0, trise), tm), ctm)
                tr = TextRun(st, k, size, glyphs, trm0, font, trm_end, (tfs, tc, tw, th, trise))
                tr.fname = fname
                self.runs.append(tr)
            elif op in ("m", "re") and path_start is None:
                path_start = k
            elif op in ("f", "F", "f*", "B", "B*", "b", "b*", "S", "s", "n"):
                if path_start is not None:
                    po = PathObj(st, path_start, k, ctm, fill, gs)
                    po.paint = op
                    self._segment(po)
                    self.paths.append(po)
                path_start = None
        return st

    def _segment(self, po):
        ops = po.stream.ops
        cur = None
        i = po.i0
        while i < po.i1:
            o = ops[i]
            if o.op == "m" and i + 1 < po.i1 and ops[i + 1].op == "h":
                x, y = o.nums()
                px, py = apply(po.ctm, x, y)
                cur = dict(ox=x, oy=y, px=px, py=py, ops=[i, i + 1])
                po.glyphs.append(cur)
                i += 2
                continue
            if cur is not None:
                cur["ops"].append(i)
            i += 1




def merge_contents(doc):
    """Join pages whose /Contents is an array into one stream, so op indices are stable."""
    merged = 0
    for page in doc:
        cont = page.get_contents()
        if len(cont) > 1:
            data = b"\n".join(doc.xref_stream(x) for x in cont)
            doc.update_stream(cont[0], data)
            doc.xref_set_key(page.xref, "Contents", f"{cont[0]} 0 R")
            merged += 1
    return merged


def load(path, merge=True):
    doc = pymupdf.open(path)
    if merge:
        merge_contents(doc)
    return doc


def fmt_dec(v, dec):
    """A number rounded to dec decimals, written as short as it goes."""
    r = round(v, dec)
    if dec == 0 or abs(r - round(r)) < 10 ** -(dec + 2):
        s = str(int(round(r)))
    else:
        s = f"{r:.{dec}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s
