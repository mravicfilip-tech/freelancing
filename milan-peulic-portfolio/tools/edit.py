"""Edit engine for the Figma outline PDF.

Visible text is outline paths, one glyph per "x y m h" marker. The invisible
Type 3 layer carries the searchable text. Every edit moves both together.
"""
import re
import pdfparse as P
from pdfparse import Op, Tok, num
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
import uharfbuzz as hb

COORD_OPS = {"m", "l", "c", "v", "y"}
NF_NAME = "FMP"   # resource name of the invisible font used by rewritten runs
NF_W = 0.5        # every glyph of it is 0.5 em wide, positions come from TJ


class _Pen(BasePen):
    def __init__(self, gs, upm):
        super().__init__(gs)
        self.ops, self.upm = [], upm

    def _n(self, p):
        return (p[0] / self.upm, p[1] / self.upm)

    def _moveTo(self, p):
        self.ops.append(("m", [self._n(p)]))

    def _lineTo(self, p):
        self.ops.append(("l", [self._n(p)]))

    def _curveToOne(self, p1, p2, p3):
        self.ops.append(("c", [self._n(p1), self._n(p2), self._n(p3)]))

    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        c1 = (p0[0] + 2 / 3 * (p1[0] - p0[0]), p0[1] + 2 / 3 * (p1[1] - p0[1]))
        c2 = (p2[0] + 2 / 3 * (p1[0] - p2[0]), p2[1] + 2 / 3 * (p1[1] - p2[1]))
        self.ops.append(("c", [self._n(c1), self._n(c2), self._n(p2)]))

    def _closePath(self):
        self.ops.append(("h", []))

    def _endPath(self):
        pass


class TTFFace:
    """A real font file, shaped with HarfBuzz so kerning matches Figma."""

    def __init__(self, path):
        self.path = path
        self.tt = TTFont(path)
        self.upm = self.tt["head"].unitsPerEm
        self.gs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.hbfont = hb.Font(hb.Face(hb.Blob.from_file_path(path)))

    def outline(self, gname):
        pen = _Pen(self.gs, self.upm)
        self.gs[gname].draw(pen)
        return pen.ops

    def layout(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, {"kern": True, "liga": False, "calt": False})
        out = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            gname = self.order[info.codepoint]
            ch = text[info.cluster]
            shape = None if ch == " " else self.outline(gname)
            out.append(dict(char=ch, shape=shape, adv=pos.x_advance / self.upm,
                            width=self.tt["hmtx"][gname][0] / self.upm))
        assert "".join(g["char"] for g in out) == text, "shaping changed the character count"
        return out

    def bbox(self, ch):
        g = self.tt.getBestCmap()[ord(ch)]
        from fontTools.pens.boundsPen import BoundsPen
        bp = BoundsPen(self.gs)
        self.gs[g].draw(bp)
        return [v / self.upm for v in bp.bounds]


class DocFace:
    """A face rebuilt from the outlines already in the document. No kerning data."""

    def __init__(self, faces, fid, space_w):
        self.faces, self.fid, self.space_w = faces, fid, space_w

    def layout(self, text):
        out = []
        for ch in text:
            if ch == " ":
                out.append(dict(char=ch, shape=None, adv=self.space_w, width=self.space_w))
                continue
            g = self.faces.glyph(self.fid, ch)
            if g is None:
                raise KeyError(f"face {self.fid} has no glyph for {ch!r}")
            out.append(dict(char=ch, shape=g["shape"], adv=g["width"], width=g["width"]))
        return out


def shape_bbox(shape):
    pts = [p for _, ps in shape for p in ps]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


class Editor:
    def __init__(self, doc):
        self.doc = doc
        self.del_ops, self.rep_ops, self.ins_ops = {}, {}, {}
        self.streams = {}
        self.runs = {}       # id(run) -> [run, entries]
        self.new_codes = {}  # font xref -> list of (code, char, width)
        self.log = []

    # ---------- low level op edits ----------

    def _st(self, stream):
        self.streams[stream.xref] = stream
        return stream.xref

    def cur(self, stream, i):
        return self.rep_ops.get(stream.xref, {}).get(i, stream.ops[i])

    def delete_op(self, stream, i):
        self.del_ops.setdefault(self._st(stream), set()).add(i)

    def replace_op(self, stream, i, op):
        self.rep_ops.setdefault(self._st(stream), {})[i] = op

    def insert_before(self, stream, i, ops):
        self.ins_ops.setdefault(self._st(stream), {}).setdefault(i, []).extend(ops)

    # ---------- visible glyphs ----------

    def _local_delta(self, ctm, dx, dy):
        a, b, c, d, _, _ = P.inv(ctm)
        return a * dx + c * dy, b * dx + d * dy

    def shift_glyph(self, po, vg, dx):
        lx, ly = self._local_delta(po.ctm, dx, 0)
        for i in vg["ops"]:
            o = self.cur(po.stream, i)
            if o.op not in COORD_OPS:
                continue
            n = o.nums()
            nn = [n[k] + (lx if k % 2 == 0 else ly) for k in range(len(n))]
            self.replace_op(po.stream, i, Op([num(v) for v in nn], o.op, i))
        vg["px"] += dx

    def delete_glyph(self, po, vg):
        for i in vg["ops"]:
            self.delete_op(po.stream, i)
        vg["deleted"] = True

    def delete_path(self, po):
        for i in range(po.i0, po.i1 + 1):
            self.delete_op(po.stream, i)
        for vg in po.glyphs:
            vg["deleted"] = True

    def glyph_ops(self, po, shape, size, ox, oy):
        """Ops for one new glyph, page origin (ox, oy), in the path object's local space."""
        to_local = P.inv(po.ctm)
        lx, ly = P.apply(to_local, ox, oy)
        ops = [Op([num(lx), num(ly)], "m", -1), Op([], "h", -1)]
        for op, pts in shape:
            args = []
            for x, y in pts:
                px, py = ox + x * size, oy + y * size
                qx, qy = P.apply(to_local, px, py)
                args += [num(qx), num(qy)]
            ops.append(Op(args, op, -1))
        return ops

    def add_glyphs(self, po, layout, size, x0, y0, tracking=0.0):
        """Draw a laid out string into a path object. Returns the page x of each char."""
        xs, x = [], x0
        new = []
        for g in layout:
            xs.append(x)
            if g["shape"]:
                new += self.glyph_ops(po, g["shape"], size, x, y0)
            x += g["adv"] * size + tracking
        self.insert_before(po.stream, po.i1, new)
        return xs, x

    # ---------- invisible layer ----------

    def entries(self, run):
        k = id(run)
        if k not in self.runs:
            ents = [dict(char=g["char"], code=g["code"], x=g["x"], y=g["y"], w=g["w"], gid=(k, gi))
                    for gi, g in enumerate(run.glyphs)]
            self.runs[k] = [run, ents]
        return self.runs[k][1]

    def code_for(self, font, ch, width):
        for code, u in font.uni.items():
            if u == ch:
                return code, font.width(code)
        used = set(font.uni) | set(range(font.first, font.first + len(font.widths)))
        code = max(used) + 1
        if code > 255:
            raise RuntimeError(f"font {font.xref} is full")
        while len(font.widths) < code - font.first:
            font.widths.append(0.0)
        font.widths.append(width)
        font.uni[code] = ch
        self.new_codes.setdefault(font.xref, []).append((code, ch, width))
        return code, width

    # ---------- line level ----------

    def line(self, pm, y, x0, x1, tol=1.0):
        vis = [(po, vg) for po in pm.paths for vg in po.glyphs
               if not vg.get("deleted") and abs(vg["py"] - y) < tol and x0 <= vg["px"] <= x1]
        inv = []
        if not hasattr(self, "run_page"):
            self.run_page = {}
        for r in pm.runs:
            self.run_page[id(r)] = pm.pno
            if r.trm0[1] != 0 or r.trm0[0] <= 0:
                continue
            ents = self.entries(r)
            for e in ents:
                if abs(e["y"] - y) < tol and x0 <= e["x"] <= x1:
                    inv.append((r, e))
        inv.sort(key=lambda t: t[1]["x"])
        vis.sort(key=lambda t: t[1]["px"])
        return vis, inv

    def tracking(self, inv, only=None):
        """Median gap between consecutive glyphs of one run beyond the nominal width."""
        res = []
        for (r1, e1), (r2, e2) in zip(inv, inv[1:]):
            if r1 is r2 and (only is None or r1 is only):
                res.append(e2["x"] - e1["x"] - e1["w"] * r1.size)
        if not res:
            return 0.0
        res.sort()
        return res[len(res) // 2]

    def replace_text(self, pm, y, x0, x1, old, new, face, anchor="left", start_x=None,
                     occurrence=0, tracking=None, size=None):
        vis, inv = self.line(pm, y, x0, x1)
        text = "".join(e["char"] for _, e in inv)
        # map string index -> glyph index (ligatures carry two chars)
        idx_of = []
        for gi, (_, e) in enumerate(inv):
            idx_of += [gi] * len(e["char"])
        hits = [m.start() for m in re.finditer(re.escape(old), text)]
        if len(hits) <= occurrence:
            raise ValueError(f"page {pm.pno + 1} y={y}: {old!r} not in {text!r}")
        s = hits[occurrence]
        a, b = idx_of[s], idx_of[s + len(old) - 1] + 1
        run_a = inv[a][0]
        size = size or run_a.size
        if tracking is None:
            trk = self.tracking(inv, only=run_a)
            if sum(1 for r, _ in inv if r is run_a) < 3:
                trk = self.tracking(inv)
        else:
            trk = tracking
        lay = face.layout(new)
        T_new = sum(g["adv"] * size + trk for g in lay)
        old_start = inv[a][1]["x"]
        r_last, e_last = inv[b - 1]
        old_end = e_last["x"] + e_last["w"] * r_last.size + trk   # end of the span itself, gaps after it stay
        after_x = e_last["x"] + 0.01
        span = {id(e) for _, e in inv[a:b]}
        # visible glyphs inside the span, by their joined invisible glyph
        # each outline glyph is placed by the invisible glyph it was joined to, so a small
        # offset between the two layers can never leave a glyph on the wrong side of the span
        ex = {e["gid"]: e["x"] for _, e in inv if "gid" in e}
        span_gids = {e["gid"] for _, e in inv[a:b] if "gid" in e}

        def lx(vg):
            key = (id(vg["run"]), vg["gi"]) if "run" in vg else None
            return ex.get(key, vg["px"]), key

        span_vis = [(po, vg) for po, vg in vis if lx(vg)[1] in span_gids]
        if not span_vis:
            raise ValueError(f"page {pm.pno + 1} y={y}: no outline glyphs for {old!r}")
        po_target = span_vis[0][0]
        if anchor == "left":
            new_start = old_start if start_x is None else start_x
            delta_after = new_start + T_new - old_end
            delta_before = new_start - old_start
        else:
            new_start = old_end - T_new
            delta_after = 0.0
            delta_before = new_start - old_start
        # visible: delete span, shift neighbours, draw the new word
        for po, vg in span_vis:
            self.delete_glyph(po, vg)
        for po, vg in vis:
            if vg.get("deleted"):
                continue
            x = lx(vg)[0]
            if x >= after_x and delta_after:
                self.shift_glyph(po, vg, delta_after)
            elif x < old_start - 0.01 and delta_before and anchor == "right":
                self.shift_glyph(po, vg, delta_before)
        base_y = span_vis[0][1]["py"]
        vis_off = span_vis[0][1]["px"] - lx(span_vis[0][1])[0]
        if abs(vis_off) > 0.05:
            self.log.append(f"   outline sits {vis_off:+.2f}pt off the text layer, kept")
        xs, _ = self.add_glyphs(po_target, lay, size, new_start + vis_off, base_y, trk)
        xs = [x - vis_off for x in xs]
        # invisible: same moves
        for r, e in inv:
            if id(e) in span:
                continue
            if e["x"] >= after_x and delta_after:
                e["x"] += delta_after
            elif e["x"] < old_start - 0.01 and delta_before and anchor == "right":
                e["x"] += delta_before
        ents_a = self.entries(run_a)
        pos = None
        for r, e in inv[a:b]:
            ents = self.entries(r)
            if pos is None and r is run_a:
                pos = ents.index(e)
            ents.remove(e)
        if pos is None:
            pos = 0
        for k, g in enumerate(lay):
            ents_a.insert(pos + k, dict(char=g["char"], code=None, x=xs[k], y=inv[a][1]["y"], w=g["width"]))
        self.log.append(f"p{pm.pno + 1} y={y:.0f}: {old!r} -> {new!r} (shift {delta_after:+.2f}/{delta_before:+.2f})")
        return dict(new_start=new_start, xs=xs, size=size, po=po_target, base_y=base_y)

    def path_to_text(self, po, face, text, size, cx, cy, ref_ch="M"):
        """Swap a path object's outline for a short string, centred on (cx, cy)."""
        for i in range(po.i0, po.i1):
            self.delete_op(po.stream, i)
        lay = face.layout(text)
        x, boxes = 0.0, []
        for g in lay:
            if g["shape"]:
                bx = shape_bbox(g["shape"])
                boxes.append((x + bx[0] * size, bx[1] * size, x + bx[2] * size, bx[3] * size))
            x += g["adv"] * size
        left = min(b[0] for b in boxes)
        right = max(b[2] for b in boxes)
        cap = shape_bbox(face.layout(ref_ch)[0]["shape"])
        ox = cx - (left + right) / 2
        oy = cy - (cap[1] + cap[3]) / 2 * size
        self.add_glyphs(po, lay, size, ox, oy)
        self.log.append(f"p? path {po.stream.xref}:{po.i0} -> {text!r} at {size:.1f}pt")

    def clear_run(self, run, pno):
        if not hasattr(self, "run_page"):
            self.run_page = {}
        self.run_page[id(run)] = pno
        self.entries(run)
        self.runs[id(run)][1] = []

    # ---------- apply ----------

    def _build_tj(self, run, ents, pno):
        tfs, tc, tw, th, trise = run.tstate
        if abs(tc) > 1e-9 or abs(tw) > 1e-9:
            raise RuntimeError("Tc or Tw in an edited run")
        size = run.size
        pos = run.trm0[4]
        items = []
        chunk = bytearray()

        def flush():
            if chunk:
                items.append(Tok("str", b"<" + bytes(chunk).hex().upper().encode() + b">", bytes(chunk)))
                chunk.clear()

        for e in sorted(ents, key=lambda e: e["x"]):
            gap = e["x"] - pos
            if abs(gap) > 0.002:
                flush()
                items.append(num(-gap / size * 1000))
            code, w = self.nf_code(pno, e["char"], e["w"])
            chunk.append(code)
            pos = e["x"] + w * size
        flush()
        gap = run.trm_end[4] - pos
        if abs(gap) > 0.002:
            items.append(num(-gap / size * 1000))
        return Op([Tok("arr", b"", items)], "TJ", run.op)

    def nf_code(self, pno, ch, w):
        if not hasattr(self, "_nf"):
            self._nf = {}
        table = self._nf.setdefault(pno, {})
        key = (ch, round(w, 4))
        if key not in table:
            if len(table) >= 255:
                raise RuntimeError(f"page {pno + 1} needs more than 255 invisible codes")
            table[key] = len(table) + 1
        return table[key], key[1]

    def _make_font(self, pno):
        doc = self.doc
        table = getattr(self, "_nf", {}).get(pno)
        if not table:
            return None
        by_code = {c: (ch, w) for (ch, w), c in table.items()}
        first, last = 1, max(by_code)
        procs, widths = [], []
        for c in range(first, last + 1):
            ch, w = by_code[c]
            gx = doc.get_new_xref()
            doc.update_object(gx, "<<>>")
            doc.update_stream(gx, f"{w:.4f} 0 0 0 0 0 d1\n".encode())
            procs.append(f"/g{c} {gx} 0 R")
            widths.append(P.fmt(w))
        diffs = " ".join(f"{c} /g{c}" for c in range(first, last + 1))
        cmap = ["/CIDInit /ProcSet findresource begin", "12 dict begin", "begincmap",
                "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
                "/CMapName /Adobe-Identity-UCS def", "/CMapType 2 def",
                "1 begincodespacerange", "<00> <FF>", "endcodespacerange",
                f"{len(by_code)} beginbfchar"]
        for c in range(first, last + 1):
            cmap.append(f"<{c:02X}> <{by_code[c][0].encode('utf-16-be').hex().upper()}>")
        cmap += ["endbfchar", "endcmap", "CMapName currentdict /CMap defineresource pop", "end", "end"]
        tu = doc.get_new_xref()
        doc.update_object(tu, "<<>>")
        doc.update_stream(tu, ("\n".join(cmap) + "\n").encode())
        fx = doc.get_new_xref()
        doc.update_object(fx, f"<< /Type /Font /Subtype /Type3 /FontMatrix [1 0 0 1 0 0] /FontBBox [0 0 0 0] "
                              f"/Resources << >> /CharProcs << {' '.join(procs)} >> "
                              f"/Encoding << /Type /Encoding /Differences [ {diffs} ] >> "
                              f"/FirstChar {first} /LastChar {last} /Widths [ {' '.join(widths)} ] "
                              f"/ToUnicode {tu} 0 R >>")
        return fx

    def _register_font(self, owner, fx):
        doc = self.doc
        holder = owner[1]
        r = doc.xref_get_key(holder, "Resources")
        if r[0] == "xref":
            rx = int(r[1].split()[0])
            f = doc.xref_get_key(rx, "Font")
            if f[0] == "xref":
                doc.xref_set_key(int(f[1].split()[0]), NF_NAME, f"{fx} 0 R")
            else:
                doc.xref_set_key(rx, f"Font/{NF_NAME}", f"{fx} 0 R")
        else:
            f = doc.xref_get_key(holder, "Resources/Font")
            if f[0] == "xref":
                doc.xref_set_key(int(f[1].split()[0]), NF_NAME, f"{fx} 0 R")
            else:
                doc.xref_set_key(holder, f"Resources/Font/{NF_NAME}", f"{fx} 0 R")

    def _apply_fonts(self):
        doc = self.doc
        for fx, adds in self.new_codes.items():
            cp = doc.xref_get_key(fx, "CharProcs")
            cpx = int(cp[1].split()[0])
            enc = int(doc.xref_get_key(fx, "Encoding")[1].split()[0])
            diffs = doc.xref_get_key(enc, "Differences")[1].rstrip()
            assert diffs.endswith("]")
            wk = doc.xref_get_key(fx, "Widths")
            wx = int(wk[1].split()[0])
            widths = [float(v) for v in re.findall(r"-?[\d.]+", doc.xref_object(wx))]
            first = int(doc.xref_get_key(fx, "FirstChar")[1])
            tu = int(doc.xref_get_key(fx, "ToUnicode")[1].split()[0])
            cmap = doc.xref_stream(tu).decode("latin1")
            extra = []
            for code, ch, w in adds:
                gx = doc.get_new_xref()
                doc.update_object(gx, "<<>>")
                doc.update_stream(gx, f"{w:.6f} 0 0 0 0 0 d1\n".encode())
                doc.xref_set_key(cpx, f"N{code}", f"{gx} 0 R")
                diffs = diffs[:-1].rstrip() + f" {code} /N{code} ]"
                while len(widths) < code - first:
                    widths.append(0.0)
                widths.append(w)
                hexu = ch.encode("utf-16-be").hex().upper()
                extra.append(f"1 beginbfchar\n<{code:02X}> <{hexu}>\nendbfchar\n")
            doc.xref_set_key(enc, "Differences", diffs)
            doc.update_object(wx, "[ " + " ".join(P.fmt(v) for v in widths) + " ]")
            doc.xref_set_key(fx, "LastChar", str(first + len(widths) - 1))
            cmap = cmap.replace("endcmap", "".join(extra) + "endcmap", 1)
            doc.update_stream(tu, cmap.encode("latin1"))

    def apply(self):
        owners = {}
        for run, ents in self.runs.values():
            orig = [(g["code"], round(g["x"], 3)) for g in run.glyphs]
            now = [(e["code"], round(e["x"], 3)) for e in sorted(ents, key=lambda e: e["x"])]
            if orig != now:
                tfs = run.tstate[0]
                pno = self.run_page[id(run)]
                self.replace_op(run.stream, run.op, self._build_tj(run, ents, pno))
                self.insert_before(run.stream, run.op, [Op([Tok("name", b"/" + NF_NAME.encode(), NF_NAME), num(tfs)], "Tf", -1)])
                self.insert_before(run.stream, run.op + 1, [Op([Tok("name", b"/" + run.fname.encode(), run.fname), num(tfs)], "Tf", -1)])
                owners.setdefault(pno, set()).add(run.stream.owner[:2])
        for pno, own in owners.items():
            fx = self._make_font(pno)
            for owner in own:
                self._register_font(owner, fx)
        for xref, st in self.streams.items():
            if any(o.op == "ID" for o in st.ops):
                raise RuntimeError(f"inline image in stream {xref}")
            dels = self.del_ops.get(xref, set())
            reps = self.rep_ops.get(xref, {})
            ins = self.ins_ops.get(xref, {})
            out = []
            for i, o in enumerate(st.ops):
                out += ins.get(i, [])
                if i in dels:
                    continue
                out.append(reps.get(i, o))
            self.doc.update_stream(xref, P.serialize(out))
