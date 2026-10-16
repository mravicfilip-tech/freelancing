"""Join outline glyphs to the invisible text layer and build a glyph library."""
import pdfparse as P

PATH_OPS = {"m": 2, "l": 2, "c": 6, "v": 4, "y": 4, "re": 4, "h": 0}


def glyph_shape(po, g, gm):
    """Glyph outline ops in normalized text space (em units, origin 0,0)."""
    ops = po.stream.ops
    to_page = po.ctm
    to_text = P.inv(gm)
    shape = []
    for i in g["ops"][2:]:
        o = ops[i]
        if o.op not in PATH_OPS:
            raise ValueError(f"unexpected op {o.op} inside glyph")
        n = o.nums()
        if o.op == "re":
            raise ValueError("re inside glyph")
        pts = []
        for k in range(0, len(n), 2):
            px, py = P.apply(to_page, n[k], n[k + 1])
            tx, ty = P.apply(to_text, px, py)
            pts.append((tx, ty))
        shape.append((o.op, pts))
    return shape


def match_page(pm, tol=0.75):
    """Pair each visible glyph with an invisible one. Returns list of joined records."""
    inv = []
    for r in pm.runs:
        for gi, g in enumerate(r.glyphs):
            if g["char"].isspace():
                continue
            inv.append((r, gi, g))
    # spatial hash
    grid = {}
    for item in inv:
        g = item[2]
        grid.setdefault((round(g["x"]), round(g["y"])), []).append(item)
    used = set()
    joined, unmatched = [], []
    for po in pm.paths:
        for vg in po.glyphs:
            best, bd = None, tol
            kx, ky = round(vg["px"]), round(vg["py"])
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for item in grid.get((kx + dx, ky + dy), []):
                        g = item[2]
                        d = max(abs(g["x"] - vg["px"]), abs(g["y"] - vg["py"]))
                        if d < bd and id(g) not in used:
                            best, bd = item, d
            if best is None:
                unmatched.append((po, vg))
                continue
            used.add(id(best[2]))
            r, gi, g = best
            vg["run"], vg["gi"], vg["char"] = r, gi, g["char"]
            joined.append((po, vg, r, gi))
    return joined, unmatched


def glyph_matrix(run, g):
    a, b, c, d, _, _ = run.trm0
    return (a, b, c, d, g["x"], g["y"])


def sig(shape, q=400):
    """Rounded signature of a normalized shape, for face comparison."""
    return tuple((op, tuple((round(x * q), round(y * q)) for x, y in pts)) for op, pts in shape)


class Library:
    def __init__(self):
        self.entries = []  # dict(char, shape, sig, page, run, width, size, color)

    def add_page(self, pm):
        joined, unmatched = match_page(pm)
        for po, vg, r, gi in joined:
            g = r.glyphs[gi]
            a, b, c, d, _, _ = r.trm0
            gm = (a, b, c, d, vg["px"], vg["py"])
            try:
                shape = glyph_shape(po, vg, gm)
            except ValueError:
                continue
            self.entries.append(dict(char=g["char"], shape=shape, sig=sig(shape), page=pm.pno,
                                     run=r, width=g["w"], size=r.size, po=po, vg=vg))
        return joined, unmatched


def shapes_close(s1, s2, tol=0.004):
    if len(s1) != len(s2):
        return False
    for (o1, p1), (o2, p2) in zip(s1, s2):
        if o1 != o2 or len(p1) != len(p2):
            return False
        for (x1, y1), (x2, y2) in zip(p1, p2):
            if abs(x1 - x2) > tol or abs(y1 - y2) > tol:
                return False
    return True


class Faces:
    """Cluster glyph shapes, then join clusters that share a run into faces."""

    def __init__(self, lib):
        self.lib = lib
        self.clusters = []  # dict(char, shape, members=[entries])
        by_key = {}
        for e in lib.entries:
            key = (e["char"], tuple(op for op, _ in e["shape"]))
            for cl in by_key.setdefault(key, []):
                if shapes_close(cl["shape"], e["shape"]):
                    cl["members"].append(e)
                    e["cl"] = cl["id"]
                    break
            else:
                cl = dict(id=len(self.clusters), char=e["char"], shape=e["shape"], members=[e])
                self.clusters.append(cl)
                by_key[key].append(cl)
                e["cl"] = cl["id"]
        parent = list(range(len(self.clusters)))

        def find(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a

        self._find = find
        runs = {}
        for e in lib.entries:
            runs.setdefault(id(e["run"]), []).append(e["cl"])
        for cls in runs.values():
            for c in cls[1:]:
                ra, rb = find(cls[0]), find(c)
                if ra != rb:
                    parent[ra] = rb
        self.face_of = [find(i) for i in range(len(self.clusters))]
        self.faces = {}
        for cl in self.clusters:
            self.faces.setdefault(self.face_of[cl["id"]], {}).setdefault(cl["char"], []).append(cl)

    def face_for_run(self, run):
        ids = {self.face_of[e["cl"]] for e in self.lib.entries if e["run"] is run}
        return ids

    def glyph(self, face, ch):
        cls = self.faces[face].get(ch)
        if not cls:
            return None
        # pick the most used cluster for this char
        cl = max(cls, key=lambda c: len(c["members"]))
        e = cl["members"][0]
        return dict(shape=cl["shape"], width=e["width"], n=len(cl["members"]))


class Recognizer:
    """Name outline glyphs that have no text layer, by matching shapes against the library."""

    def __init__(self, faces):
        self.faces = faces
        self.by_ops = {}
        for cl in faces.clusters:
            key = tuple(op for op, _ in cl["shape"])
            self.by_ops.setdefault(key, []).append(cl)

    @staticmethod
    def _bbox(shape):
        pts = [p for _, ps in shape for p in ps]
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        return min(xs), min(ys), max(xs), max(ys)

    def raw_shape(self, po, vg):
        ops = po.stream.ops
        out = []
        for i in vg["ops"][2:]:
            o = ops[i]
            if o.op not in PATH_OPS or o.op == "re":
                return None
            n = o.nums()
            pts = []
            for k in range(0, len(n), 2):
                px, py = P.apply(po.ctm, n[k], n[k + 1])
                pts.append((px - vg["px"], py - vg["py"]))
            out.append((o.op, pts))
        return out

    def recognize(self, po, vg, tol=0.006):
        raw = self.raw_shape(po, vg)
        if not raw:
            return None
        key = tuple(op for op, _ in raw)
        rb = self._bbox(raw)
        best = None
        for cl in self.by_ops.get(key, []):
            cb = self._bbox(cl["shape"])
            h = cb[3] - cb[1]
            w = cb[2] - cb[0]
            s = (rb[3] - rb[1]) / h if h > 1e-3 else (rb[2] - rb[0]) / w if w > 1e-3 else None
            if not s:
                continue
            norm = [(op, [(x / s, y / s) for x, y in pts]) for op, pts in raw]
            if shapes_close(norm, cl["shape"], tol):
                e = cl["members"][0]
                cand = dict(char=cl["char"], face=self.faces.face_of[cl["id"]], size=s, width=e["width"])
                if best is None or len(cl["members"]) > best[0]:
                    best = (len(cl["members"]), cand)
        return best[1] if best else None
