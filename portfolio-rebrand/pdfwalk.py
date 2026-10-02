"""Walk a page's content (including nested form XObjects), tracking the CTM, and
report every painted path and text-showing operator with its bbox in top-left
(PyMuPDF-style) page coordinates. Used to locate and neutralise brand marks
without touching anything else on the page."""
import pikepdf

PAINT = {'f', 'F', 'f*', 'S', 's', 'B', 'B*', 'b', 'b*'}
CONSTRUCT = {'m', 'l', 'c', 'v', 'y', 'h', 're'}
TEXT_SHOW = {'TJ', 'Tj', "'", '"'}


def mul(a, b):
    return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3],
            a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
            a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]]


def apply(m, x, y):
    return m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]


class Item:
    def __init__(self, kind, owner, idx, bbox, nseg, op, fill=None, ctm=None):
        self.kind, self.owner, self.idx, self.bbox = kind, owner, idx, bbox
        self.ctm = ctm
        self.nseg, self.op, self.fill = nseg, op, fill

    def __repr__(self):
        return f"{self.kind} {self.op} seg={self.nseg} bbox={[round(v,1) for v in self.bbox]} fill={self.fill}"


def walk(page_h, owner, ops_cache, resources, ctm, out, depth=0, calls=None):
    """owner: pikepdf object whose content is parsed (page or form xobject)."""
    key = owner.objgen if owner.objgen != (0, 0) else id(owner)
    if key not in ops_cache:
        ops_cache[key] = (owner, list(pikepdf.parse_content_stream(owner)))
    ops = ops_cache[key][1]
    stack = []
    cur = list(ctm)
    pts, nseg = [], 0
    fill = None
    tm = None
    for i, ins in enumerate(ops):
        op = str(ins.operator)
        a = ins.operands
        if op == 'q':
            stack.append((list(cur), fill))
        elif op == 'Q':
            cur, fill = stack.pop()
        elif op == 'cm':
            cur = mul([float(v) for v in a], cur)
        elif op in ('rg', 'g', 'sc', 'scn', 'k'):
            try:
                fill = tuple(round(float(v), 3) for v in a)
            except Exception:
                fill = str(a)
        elif op in CONSTRUCT:
            nums = [float(v) for v in a]
            if op == 're':
                x, y, w, h = nums
                cand = [(x, y), (x+w, y+h)]
            else:
                cand = list(zip(nums[0::2], nums[1::2]))
            for x, y in cand:
                pts.append(apply(cur, x, y))
            nseg += 1
        elif op in PAINT or op == 'n':
            if op in PAINT and pts:
                xs = [p[0] for p in pts]; ys = [page_h - p[1] for p in pts]
                out.append(Item('path', key, i, (min(xs), min(ys), max(xs), max(ys)), nseg, op, fill, list(cur)))
            pts, nseg = [], 0
        elif op == 'BT':
            tm = [1, 0, 0, 1, 0, 0]
        elif op == 'Tm':
            tm = [float(v) for v in a]
        elif op in TEXT_SHOW:
            m = mul(tm, cur)
            x, y = apply(m, 0, 0)
            out.append(Item('text', key, i, (x, page_h - y, x, page_h - y), 0, op, round(m[3], 2)))
        elif op == 'Do':
            xo = resources.get('/XObject', {}).get(str(a[0]))
            if xo is not None and xo.get('/Subtype') == '/Form':
                mtx = [float(v) for v in xo.get('/Matrix', [1, 0, 0, 1, 0, 0])]
                res = xo.get('/Resources', resources)
                if calls is not None:
                    # Where each form is painted from: lets a caller draw at the
                    # form's depth while escaping the form's own BBox clip.
                    calls[xo.objgen] = (key, i, list(cur))
                walk(page_h, xo, ops_cache, res, mul(mtx, cur), out, depth+1, calls)
    return out


def scan(page):
    h = float(page.mediabox[3]) - float(page.mediabox[1])
    cache = {}
    calls = {}
    items = walk(h, page.obj, cache, page.obj.get('/Resources', {}), [1, 0, 0, 1, 0, 0], [], calls=calls)
    scan.calls = calls
    return items, cache
