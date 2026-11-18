#!/usr/bin/env python3
# The shop's data sheets as data. For every product of src/shop/catalog.json it takes the English Linde data sheets (DS_*.pdf) of the
# product's Drive folder, downloads them, reads them with pdftotext and writes one JSON per product to briefs/shop/ds/<slug>.json, plus
# briefs/shop/ds/README.md with what each parse found and what failed. Nothing is translated, the text stays as Linde wrote it. The
# mapping of products to Drive folders is the one of shop-catalog.py, imported and not copied.
#
#   python3 scripts/shop-datasheets.py <download dir>
#
# The PDFs are untrusted data. They are only ever handed to pdftotext, never run, and their text is stored as text and never read as
# instructions. The files are cached in <download dir> by Drive id, so a rerun downloads nothing twice.
#
# What it reads from a sheet
#   page 1       the heading, the model range, the capacity line, the tagline and the "→" benefits (their wrapped lines joined)
#   VDI tables   "TECHNICAL DATA", read with pdftotext -layout. The versions are the columns, found from row 1.1. Every page holds a few
#                versions, the pages are merged into one row per VDI number with one value per version. A footnote mark after a value
#                goes to the notes of that value. The vertical section labels are named from the row numbers, the sheet's own wording
#                is used where it differs (Weights, Wheels/Tyres, Performance data, Drive/lifting mechanism).
#   MAST TABLES  raw text per mast type.
#   EQUIPMENT    read with pdftotext -bbox-layout, because the group names are turned text in the middle of their group. A group
#                reaches from the end of the one before to as far below the label as the label's centre is below the start, since the
#                label sits at the middle of its group. The standard and optional marks are drawn shapes and are not in the PDF text,
#                only the "—" (not available) survives, and it is kept per item as "na" with the version columns it sits under.
#   CHARACTERISTICS  the group headings with their "→" bullets.
# Whatever it cannot place stays under "unparsed" as raw text.
import concurrent.futures as cf
import html
import importlib.util
import json
import re
import statistics
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRIEFS = ROOT.parent / 'studio' / 'clients' / 'ekotehnika' / 'briefs'
OUT = BRIEFS / 'shop' / 'ds'
CATALOG = ROOT / 'src' / 'shop' / 'catalog.json'

# shop-catalog.py has a dash in its name, so it is loaded by path. Importing it runs nothing, its main is guarded.
sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location('shop_catalog', ROOT / 'scripts' / 'shop-catalog.py')
sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sc)

OTHER_LANG = re.compile(r'[_ .-](es|fr|it|pt|dt|de)[_ .-]', re.I)

NUM = r'\d{1,2}(?:\.\d{1,3})*(?:\.?[a-z])?'
MARKER = re.compile(r'^(?:\d{1,2}\)\s*)+$')
FOOT = re.compile(r'^(\s*)(\d{1,2})\)\s+(\S.*)$')
H_TABLE = re.compile(r'TECHNICAL DATA', re.I)
H_MAST = re.compile(r'^\s*MAST TABLES\s*$')
H_EQUIP = re.compile(r'^\s*STANDARD AND OPTIONAL EQUIPMENT\s*$')
H_CHAR = re.compile(r'^\s*CHARACTERISTICS\s*$')
H_OTHER = re.compile(r'^\s{0,3}([A-Z][A-Z0-9 /()&,.-]{5,})\s*$')
H_END = re.compile(r'Presented by:|Subject to modification|Linde Material Handling GmbH')


def clean(t):
    # soft hyphens and the bell characters some Linde fonts leave in the text are dropped, odd spaces become spaces
    t = t.replace('\xad', '').replace(' ', ' ').replace(' ', ' ')
    return re.sub(r'[\x00-\x08\x0b\x0e-\x1f]', '', t)


# ----------------------------------------------------------------------------------------------------------- the Drive files

def folder_sheets(files):
    # every English DS file of one folder, one per document, the view file before the print file. Two sub-series in one folder stay two.
    docs = {}
    for fid, name in files:
        if not name.lower().endswith('.pdf') or not re.match(r'DS[_ -]', name, re.I) or OTHER_LANG.search(name):
            continue
        key = re.sub(r'[_ .-]+', '', re.sub(r'[_ .-]*(print|view)', '', name[:-4], flags=re.I)).lower()
        docs.setdefault(key, []).append((fid, name))
    out = []
    for key in sorted(docs):
        views = [d for d in docs[key] if re.search(r'view', d[1], re.I)]
        out.append(sorted(views or docs[key], key=lambda d: d[1])[0])
    return out


def fetch(cache, fid):
    dest = cache / f'{fid}.pdf'
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    url = f'https://drive.google.com/uc?export=download&id={fid}'
    subprocess.run(['curl', '-sSL', '-m', '240', '-o', str(dest), url], check=False)
    ok = dest.exists() and dest.stat().st_size > 1000 and dest.read_bytes()[:5] == b'%PDF-'
    if not ok and dest.exists():
        dest.unlink()
    return dest if ok else None


def pdftotext(path, *args):
    r = subprocess.run(['pdftotext', *args, str(path), '-'], capture_output=True, timeout=180)
    return r.stdout.decode('utf-8', errors='replace')


# --------------------------------------------------------------------------------------------------------------- small tools

def tokens(line):
    # the pieces of a line that are two or more spaces apart, with the column each starts at
    return [(m.start(), m.group(0)) for m in re.finditer(r'\S+(?: \S+)*', line)]


def split_notes(cell, valid=None):
    # "6.0/9.0 1)" and the glued "36913)" are the value and its footnote mark, "14510)11)" the value and two. A closing bracket with no
    # opening one is a mark. A glued mark is one digit, or two when the sheet has no footnote with that last digit but has one with both.
    s = cell.strip()
    if re.fullmatch(r'(?:\d{1,2}\)\s*)+', s):
        return '', re.findall(r'(\d{1,2})\)', s)
    if s.count(')') <= s.count('('):
        return s, []
    m = re.search(r'(\d+)\)((?:\s*\d{1,2}\))*)$', s)
    if not m:
        return s, []
    g1, rest = m.group(1), m.group(2)
    notes = []
    head = s[:m.start()]
    # a mark is one or two digits, so a run of three or more has the value's last digits in it
    glued = len(g1) >= 3 or (len(g1) == 2 and bool(head) and head[-1] in './-,')
    if not glued:
        notes.append(g1)
    else:
        one, two = g1[-1], g1[-2:]
        mark = two if (valid and one not in valid and two in valid and len(g1) > 2) else one
        notes.append(mark)
        head += g1[:-len(mark)]
    return head.rstrip(), notes + re.findall(r'(\d{1,2})\)', rest)


def join_label(parts):
    out = ''
    for p in parts:
        out = p if not out else (out + p if out.endswith(('/', '-')) else out + ' ' + p)
    return out.strip()


def dedent(lines):
    lines = [l.rstrip() for l in lines]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    ind = [len(l) - len(l.lstrip()) for l in lines if l.strip()]
    cut = min(ind) if ind else 0
    return '\n'.join(l[cut:] for l in lines)


# ------------------------------------------------------------------------------------------------------------ page 1 and the rest

def parse_head(lines, used):
    out = {'heading': None, 'range': None, 'capacity': None, 'tagline': None, 'benefits': []}
    idx = [i for i, l in enumerate(lines) if l.strip()]
    stop = next((i for i, l in enumerate(lines) if H_TABLE.search(l) or re.search(r'^\s*(1\.1)\s{2,}', l)), len(lines))
    idx = [i for i in idx if i < stop]
    if not idx:
        return out
    cap = next((i for i in idx if re.search(r'series', lines[i], re.I) and re.search(r'\|', lines[i])), None)
    if cap is None:
        # the older sheets lay page 1 out as a collage, the title block stands in the right half of the page
        cap = next((i for i in idx if re.match(r'^\s{40,}(?:Load )?capacity\b', lines[i], re.I)), None)
        if cap is None:
            return out
        before = [i for i in idx if i < cap and len(lines[i]) - len(lines[i].lstrip()) >= 40]
        after = [i for i in idx if i > cap and len(lines[i]) - len(lines[i].lstrip()) >= 40]
        if before:
            out['heading'] = lines[before[-1]].strip()
            used.add(before[-1])
        if after:
            out['range'] = re.sub(r'\s*Seri(es)?\b.*$', '', lines[after[0]].strip()).strip() or None
            used.add(after[0])
        out['capacity'] = lines[cap].strip()
        used.add(cap)
        return out
    out['heading'] = lines[idx[0]].strip()
    used.add(idx[0])
    between = [i for i in idx if idx[0] < i < cap]
    if between:
        out['range'] = lines[between[0]].strip()
        used.add(between[0])
    out['capacity'] = lines[cap].strip()
    used.add(cap)
    after = [i for i in idx if i > cap]
    tag = next((i for i in after if not lines[i].lstrip().startswith('→')), None)
    first_arrow = next((i for i in after if lines[i].lstrip().startswith('→')), None)
    if tag is not None and first_arrow is not None and tag < first_arrow:
        out['tagline'] = lines[tag].strip()
        used.add(tag)
    cur = None
    for i in range(cap + 1, stop):
        l = lines[i]
        if l.lstrip().startswith('→'):
            cur = [l.lstrip()[1:].strip()]
            out['benefits'].append(cur)
            used.add(i)
        elif cur is not None and l.strip() and (len(l) - len(l.lstrip())) > 0:
            cur.append(l.strip())
            used.add(i)
        elif cur is not None and not l.strip():
            nxt = next((lines[j] for j in range(i + 1, stop) if lines[j].strip()), '')
            if not nxt.lstrip().startswith('→'):
                cur = None
    out['benefits'] = [' '.join(b) for b in out['benefits']]
    return out


def parse_masts(lines):
    # raw text per mast type, the mast types are the upper case lines such as STANDARD MAST (mm)
    out, cur, name = {}, [], None
    heading = re.compile(r'^[A-Z0-9][A-Z0-9 /+&.,\-–]{3,}(?:\((?:in )?mm\))?$')
    for l in lines:
        s = l.strip()
        if s and heading.match(s) and 'MAST' in s:
            if name is not None:
                out[name] = dedent(cur)
            n, name = 2, s
            while name in out:
                name = f'{s} ({n})'
                n += 1
            cur = []
        elif name is not None:
            cur.append(l)
    if name is not None:
        out[name] = dedent(cur)
    return out


def parse_characteristics(lines, unparsed):
    # some sheets set the characteristics in two columns, each is read on its own
    arrows = sorted({len(l) - len(l.lstrip()) for l in lines if l.lstrip().startswith('→')})
    if arrows and arrows[-1] - arrows[0] > 30:
        cut = next(a for a in arrows if a - arrows[0] > 30) - 2
        return chars_stream([l[:cut] for l in lines], unparsed) + chars_stream([' ' * 0 + l[cut:] for l in lines], unparsed)
    return chars_stream(lines, unparsed)


def chars_stream(lines, unparsed):
    arrows = [len(l) - len(l.lstrip()) for l in lines if l.lstrip().startswith('→')]
    if not arrows:
        return []
    bi = Counter(arrows).most_common(1)[0][0]
    groups, cur, bullet, last_arrow = [], None, None, bi
    for l in lines:
        s = l.strip()
        if not s:
            continue
        ind = len(l) - len(l.lstrip())
        if H_END.search(s):
            break
        if s.startswith('→'):
            last_arrow = ind
            bullet = [s[1:].strip()]
            if cur is None:
                cur = {'group': None, 'bullets': []}
                groups.append(cur)
            cur['bullets'].append(bullet)
        elif bullet is not None and ind >= last_arrow + 2:
            bullet.append(s)
        elif abs(ind - bi) <= 1 and len(s) <= 40:
            cur = {'group': s, 'bullets': []}
            groups.append(cur)
            bullet = None
        else:
            unparsed.setdefault('characteristics_captions', []).append(s)
    for g in groups:
        g['bullets'] = [' '.join(b) for b in g['bullets']]
    return [g for g in groups if g['bullets']]


# ------------------------------------------------------------------------------------------------------------------ VDI tables

# the section of a VDI number by its first number, the sheet's own wording where it has one. Each is the label, then the text to look for.
SECTIONS = {
    1: [('Characteristics', 'Characteristics')], 2: [('Weight', 'Weight'), ('Weights', 'Weights')],
    3: [('Tyres/chassis', 'Tyres/chassis'), ('Wheels/Tyres', 'Wheels/Tyres')], 4: [('Dimensions', 'Dimensions')],
    5: [('Performance', 'Performance'), ('Performance data', 'Performancedata')], 6: [('Electric-engine', 'Electric-engine')],
    7: [('Combustion-engine', 'Combustion-engine')], 8: [('Drive', 'Drive'), ('Drive/lifting mechanism', 'Drive/lifting')],
    9: [('Drive', 'Drive')], 10: [('Additional data', 'Additional')], 11: [('Additional data', 'Additional')],
}


def section_of(no, left_text):
    options = SECTIONS.get(int(re.match(r'\d+', no).group(0)))
    if not options:
        return None
    squeezed = re.sub(r'\s+', '', left_text)
    pick = options[0][0]
    for label, key in options:
        if key in squeezed:
            pick = label
    return pick


def parse_table_page(lines, start, stop_at):
    """One page of VDI rows. Returns (rows, notes, left_text, leftovers, end) or None when the page has no row 1.1."""
    first = next((i for i in range(start, stop_at) if re.match(r'^\s+1\.1\s{2,}\S', lines[i])), None)
    if first is None:
        return None
    numcol = len(lines[first]) - len(lines[first].lstrip())
    N_END = re.compile(r'^(\s*)(' + NUM + r')\s{2,}(\S.*)$')

    def row_split(l):
        # a row may carry a turned section word to the left of its number, so the number is looked for at the table's number column
        base = max(0, numcol - 2)
        m = N_END.match(l[base:])
        if m and len(m.group(1)) <= 4:
            col = base + m.end(2)
            return l[:base].strip(), m.group(2), ' ' * col + l[col:]
        return None

    items, left_text, leftovers, end = [], [], [], stop_at
    in_notes, notes, last_cols = False, {}, []
    for i in range(first, stop_at):
        l = lines[i]
        if not l.strip():
            if in_notes:
                in_notes = 'gap'
            continue
        if re.search(r'MAST TABLES|STANDARD AND OPTIONAL|^\s*CHARACTERISTICS\s*$', l):
            end = i
            break
        ind = len(l) - len(l.lstrip())
        fn = FOOT.match(l) if ind < numcol - 3 else None
        if fn:
            in_notes, last_cols = True, []
            for m in re.finditer(r'(?<!\S)(\d{1,2})\)\s+(.*?)(?=\s{2,}\d{1,2}\)\s|\s*$)', l):
                notes[m.group(1)] = m.group(2).strip()
                last_cols.append((m.start(1), m.group(1)))
            continue
        if in_notes is True and ind < numcol and last_cols:
            # a wrapped footnote goes to the note of the column it sits in
            n = ([c for c in last_cols if c[0] <= ind + 2] or last_cols)[-1][1]
            notes[n] = (notes[n] + ' ' + l.strip()).strip()
            continue
        if in_notes:
            leftovers.append(l.strip())
            continue
        rs = row_split(l)
        if rs:
            head, no, rest = rs
            if head:
                left_text.append(head)
            items.append(('row', no, tokens(rest), i))
            continue
        toks = tokens(l)
        left = [t for t in toks if t[0] < numcol - 3]
        left_text += [t[1] for t in left]
        toks = [t for t in toks if t[0] >= numcol - 3]
        if toks:
            items.append(('orph', toks, i))
    # columns from row 1.1 and the orphans straight after it
    ones = [it for it in items if it[0] == 'row' and it[1] == '1.1']
    if not ones:
        return None
    cols = [((s + s + len(t)) / 2) for s, t in ones[0][2][1:] if not MARKER.match(t)]
    N = len(cols)
    if N == 0:
        return None
    # the unit column starts where the third token of the rows that have a unit and a value in every column starts
    starts = Counter(it[2][1][0] for it in items if it[0] == 'row' and len(it[2]) == N + 2)
    xu = starts.most_common(1)[0][0] if starts else None

    def kind(tok):
        s, t = tok
        if xu is None:
            return 'value'
        if abs(s - xu) <= 1:
            return 'unit'
        if s < xu - 1:
            return 'label'
        return 'value'

    gap = statistics.median(b - a for a, b in zip(cols, cols[1:])) if N > 1 else 40

    def col_of(tok):
        # the column of a value, or None for text that stands too far from any column, a side table or a footnote beside the table
        s, t = tok
        c = (s + s + len(t)) / 2
        if MARKER.match(t):
            left = [j for j in range(N) if cols[j] <= s + 1]
            if left and s - cols[left[-1]] < gap:
                return left[-1]
        j = min(range(N), key=lambda j: abs(cols[j] - c))
        return j if abs(cols[j] - c) <= 0.75 * gap else None

    rows = []
    prefix = {'label': [], 'unit': []}
    hold = []
    for it in items:
        if it[0] == 'row':
            r = {'no': it[1], 'label': list(prefix['label']), 'unit': list(prefix['unit']), 'cells': [[] for _ in range(N)], 'line': it[3]}
            prefix = {'label': [], 'unit': []}
            # a value that stands above its row, so the one before has it in that column already, belongs to this row. The version
            # names do it on both sides of row 1.2, so what stands between 1.1 and 1.2 is the start of the names.
            for tok in hold:
                r['cells'][col_of(tok)].append(tok[1])
            hold = []
            for k, tok in enumerate(it[2]):
                # with no unit column known the first piece is the label. A row whose label stands on the lines around it has none.
                kd = ('label' if k == 0 else 'value') if xu is None else kind(tok)
                if kd == 'unit':
                    r['unit'].append(tok[1])
                elif kd == 'label':
                    r['label'].append(tok[1])
                elif col_of(tok) is None:
                    leftovers.append(tok[1])
                else:
                    r['cells'][col_of(tok)].append(tok[1])
            rows.append(r)
        else:
            for tok in it[1]:
                kd = kind(tok)
                if kd == 'value' and col_of(tok) is None:
                    leftovers.append(tok[1])
                elif kd == 'value':
                    prev = rows[-1] if rows else None
                    if prev and (prev['no'] == '1.1' or (prev['no'] != '1.2' and prev['cells'][col_of(tok)] and not MARKER.match(tok[1]))):
                        hold.append(tok)
                    elif rows:
                        rows[-1]['cells'][col_of(tok)].append(tok[1])
                    else:
                        leftovers.append(tok[1])
                else:
                    t = tok[1]
                    to_next = bool(re.match(r'[A-Z(]', t))
                    if to_next or not rows:
                        prefix['label' if kd == 'label' else 'unit'].append(t)
                    else:
                        rows[-1]['label' if kd == 'label' else 'unit'].append(t)
    for tok in hold:
        rows[-1]['cells'][col_of(tok)].append(tok[1])
    return rows, notes, ' '.join(left_text), leftovers, end


def build_vdi(pages, left_text, valid=None):
    versions, table, order = [], {}, []
    for rows in pages:
        n_cols = len(rows[0]['cells']) if rows else 0
        names = next((r['cells'] for r in rows if r['no'] == '1.2'), None)
        offset = len(versions)
        for j in range(n_cols):
            nm = split_notes(' '.join(names[j]))[0] if names else ''
            versions.append(nm or f'column {offset + j + 1}')
        for r in rows:
            e = table.get(r['no'])
            if e is None:
                e = table[r['no']] = {'no': r['no'], 'section': section_of(r['no'], left_text), 'label': join_label(r['label']),
                                      'unit': ' '.join(r['unit']).strip(), 'values': [], 'notes': []}
                order.append(r['no'])
            while len(e['values']) < offset:
                e['values'].append(None)
                e['notes'].append([])
            for j in range(n_cols):
                v, nt = split_notes(' '.join(r['cells'][j]), valid)
                e['values'].append(v if v else None)
                e['notes'].append(nt)
    total = len(versions)
    out = []
    for no in order:
        e = table[no]
        while len(e['values']) < total:
            e['values'].append(None)
            e['notes'].append([])
        out.append(e)
    return versions, out


# ------------------------------------------------------------------------------------------------------------------- equipment

def bbox_lines(xml):
    out = []
    for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', xml, re.S):
        words = [html.unescape(w) for w in re.findall(r'>([^<]*)</word>', m.group(5))]
        x0, y0, x1, y1 = (float(v) for v in m.groups()[:4])
        out.append((x0, y0, x1, y1, clean(' '.join(words))))
    return out


def bbox_words(xml):
    out = []
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', xml):
        x0, y0, x1, y1 = (float(v) for v in m.groups()[:4])
        out.append((x0, y0, x1, y1, clean(html.unescape(m.group(5)))))
    return out


def parse_equipment_page(xml, cont=False):
    lines = bbox_lines(xml)
    title = next((l for l in lines if 'STANDARD AND OPTIONAL EQUIPMENT' in l[4]), None)
    if not title and not cont:
        return None
    # a page can go on below the equipment with the VDI table
    cut = next((l[1] for l in lines if 'TECHNICAL DATA' in l[4]), None)
    if cut is not None:
        lines = [l for l in lines if l[1] < cut]
    hdr = next((l for l in lines if 'type designation' in l[4] and (title is None or l[1] >= title[3])), None)
    if title is None and hdr is None:
        return None
    columns = []
    top = title[3] if title else 0
    if hdr:
        columns = sorted([l for l in lines if abs(l[1] - hdr[1]) <= 3 and l[0] > hdr[2] + 4], key=lambda l: l[0])
        top = hdr[3] + 2
    body = [l for l in lines if l[1] >= top and not re.match(r'^(Standard|Optional) equipment|Not available', l[4])
            and not re.match(r'^[—–-]\s+Not available', l[4])]
    marks = [l for l in body if l[4].strip() in ('—', '–')]
    rest = [l for l in body if l not in marks]
    xs = Counter(round(l[0]) for l in rest if l[0] >= 50)
    if not xs:
        return None
    item_x = xs.most_common(1)[0][0]
    items_raw = sorted([l for l in rest if l[0] >= item_x - 2], key=lambda l: (l[1], l[0]))
    # one item is one or more lines, a line that goes on in lower case a little below the last is its wrap
    items = []
    for l in items_raw:
        t = l[4]
        if items:
            prev = items[-1]
            gap = l[1] - prev['last_y']
            lower = bool(re.match(r'[a-z(),;.]', t)) and not re.match(r'[a-z]{2}:', t)
            if (lower and gap < 12.5) or gap <= 9.3:
                prev['text'] += ' ' + t
                prev['last_y'] = l[1]
                prev['y1'] = l[3]
                continue
        items.append({'text': t, 'y0': l[1], 'y1': l[3], 'last_y': l[1]})
    # The turned group labels. pdftotext joins turned words that sit one after the other into a line, even two labels, so the words are
    # read. Words with the same left edge that touch are one turned line, and the lines of one label are centred on the same height.
    legend = [(l[1] - 1, l[3] + 1) for l in lines if re.match(r'^(Standard|Optional) equipment|Not available', l[4])]
    words = [w for w in bbox_words(xml) if w[2] <= item_x - 4 and w[1] >= top and not any(a <= (w[1] + w[3]) / 2 <= b for a, b in legend)]
    xlines = []
    for w in sorted(words, key=lambda w: w[1]):
        cur = next((ln for ln in xlines if abs(ln['x0'] - w[0]) <= 1.5 and max(w[1] - ln['y1'], ln['y0'] - w[3]) <= 4), None)
        if cur:
            cur['words'].append(w)
            cur['y0'], cur['y1'] = min(cur['y0'], w[1]), max(cur['y1'], w[3])
        else:
            xlines.append({'x0': w[0], 'y0': w[1], 'y1': w[3], 'words': [w]})
    for ln in xlines:
        # the text of a turned line reads from the bottom up
        ln['words'].sort(key=lambda w: -w[1])
    clusters = []
    for ln in sorted(xlines, key=lambda ln: (ln['y0'] + ln['y1']) / 2):
        c = (ln['y0'] + ln['y1']) / 2
        if clusters and abs(c - clusters[-1]['c']) <= 3:
            clusters[-1]['lines'].append(ln)
        else:
            clusters.append({'c': c, 'lines': [ln]})
    names = []
    for cl in clusters:
        t = ' '.join(w[4] for ln in sorted(cl['lines'], key=lambda ln: ln['x0']) for w in ln['words'])
        t = re.sub(r'(\w)[-\u2011] (\w)', r'\1\2', t)
        t = re.sub(r'\s*/\s*', '/', t)
        t = {'Environ ment': 'Environment', 'Digital isation': 'Digitalisation'}.get(t, t)
        names.append((t, cl['c']))
    groups = []
    if names and items:
        s = top
        for t, c in names:
            e = 2 * c - s
            groups.append({'group': t, 'items': [], 'end': e})
            s = e
        for it in items:
            ym = (it['y0'] + it['y1']) / 2
            g = next((g for g in groups if ym < g['end']), groups[-1])
            g['items'].append(it)
    else:
        groups = [{'group': None, 'items': items, 'end': 0}]
    cols = [{'name': c[4], 'x': (c[0] + c[2]) / 2} for c in columns]
    for it in (it for g in groups for it in g['items']):
        na = []
        for mk in marks:
            if it['y0'] - 2 <= (mk[1] + mk[3]) / 2 <= it['y1'] + 2:
                if cols:
                    na.append(min(cols, key=lambda c: abs(c['x'] - (mk[0] + mk[2]) / 2))['name'])
                else:
                    na.append('—')
        it['na'] = sorted(set(na), key=na.index)
    out = []
    for g in groups:
        if not g['items']:
            continue
        e = {'group': g['group'], 'columns': [c['name'] for c in cols], 'items': []}
        for it in g['items']:
            x = {'text': it['text']}
            if it['na']:
                x['na'] = it['na']
            e['items'].append(x)
        out.append(e)
    return out


def parse_equipment_arrows(lines):
    # the plain form of the equipment page, "Standard Equipment" and "Optional Equipment" with a list of "→" lines under each. Here the
    # sheet itself says which is which.
    out, cur, item = [], None, None
    for l in lines:
        t = l.strip()
        if not t or H_END.search(t):
            continue
        if t.startswith('→'):
            if cur is None:
                cur = {'group': None, 'columns': [], 'items': []}
                out.append(cur)
            item = {'text': t[1:].strip()}
            cur['items'].append(item)
        elif re.match(r'^(Standard|Optional) equipment$', t, re.I):
            cur, item = {'group': t, 'columns': [], 'items': []}, None
            out.append(cur)
        elif item is not None and (len(l) - len(l.lstrip())) > 0:
            item['text'] += ' ' + t
        else:
            item = None
    return [g for g in out if g['items']]


# ------------------------------------------------------------------------------------------------------------------ one sheet

def parse_sheet(path, name, fid):
    raw = clean(pdftotext(path, '-layout'))
    res = {'datasheet': {'name': name, 'id': fid}, 'heading': None, 'range': None, 'capacity': None, 'tagline': None, 'benefits': [],
           'versions': [], 'vdi': [], 'footnotes': [], 'masts': {}, 'equipment': [], 'characteristics': [], 'unparsed': {}}
    unparsed = res['unparsed']
    if len(raw.strip()) < 200:
        unparsed['reason'] = 'the PDF holds no text, it is an image or empty'
        return res
    pages = [p.split('\n') for p in raw.split('\f')]
    if pages and not ''.join(pages[-1]).strip():
        pages.pop()
    blank = [n + 1 for n, p in enumerate(pages) if len(''.join(p).strip()) < 20]
    if blank:
        unparsed['image_pages'] = blank
    used1 = set()
    res.update(parse_head(pages[0], used1))
    rest = []

    table_pages, left_text, notes, leftovers = [], [], {}, []
    mast_lines, char_lines, equip_pages, misc = [], [], [], []
    sections, equip_lines, section = {}, {}, None
    mode = None
    for pno, lines in enumerate(pages):
        i = 0
        # a page may hold the end of the mast tables or the characteristics and then the start of the next section
        while i < len(lines):
            l = lines[i]
            if H_MAST.match(l):
                mode = 'mast'
                i += 1
                continue
            if H_EQUIP.match(l):
                mode = 'equip'
                equip_pages.append(pno)
                i += 1
                continue
            if H_CHAR.match(l):
                mode = 'char'
                i += 1
                continue
            if re.match(r'^\s+1\.1\s{2,}\S', l):
                stop = next((j for j in range(i + 1, len(lines)) if re.search(r'MAST TABLES|STANDARD AND OPTIONAL|^\s*CHARACTERISTICS\s*$', lines[j])), len(lines))
                got = parse_table_page(lines, i, stop)
                if got:
                    rows, nt, lt, lo, end = got
                    table_pages.append(rows)
                    left_text.append(lt)
                    for k, v in nt.items():
                        if k in notes and notes[k] != v and v not in notes[k]:
                            notes[k] += ' / ' + v
                        else:
                            notes.setdefault(k, v)
                    leftovers += lo
                    mode = 'table'
                    i = end
                    continue
            other = H_OTHER.match(l)
            if other and pno > 0 and mode not in ('mast', 'char') and not H_TABLE.search(l) and 'VDI' not in l:
                mode, section = 'section', other.group(1).strip()
                sections.setdefault(section, [])
                i += 1
                continue
            if mode == 'mast':
                mast_lines.append(l)
            elif mode == 'char':
                char_lines.append(l)
            elif mode == 'section':
                sections[section].append(l)
            elif pno == 0 and mode is None:
                if i not in used1 and l.strip():
                    rest.append(l)
            elif mode == 'equip':
                equip_lines.setdefault(pno, []).append(l.rstrip())
            elif l.strip() and not H_TABLE.search(l):
                misc.append(l.rstrip())
            i += 1
    if table_pages:
        res['versions'], res['vdi'] = build_vdi(table_pages, ' '.join(left_text), set(notes))
    res['footnotes'] = [{'n': k, 'text': v} for k, v in sorted(notes.items(), key=lambda kv: int(kv[0]))]
    res['masts'] = parse_masts(mast_lines) if mast_lines else {}
    eq = []
    for p in sorted(set(equip_pages) | set(equip_lines)):
        xml = pdftotext(path, '-f', str(p + 1), '-l', str(p + 1), '-bbox-layout')
        got = parse_equipment_page(xml, p not in equip_pages) or parse_equipment_arrows(equip_lines.get(p, []))
        if got:
            eq += got
        elif p in equip_pages:
            unparsed.setdefault('equipment_pages', []).append(dedent(equip_lines.get(p, [])))
        else:
            misc += [l for l in equip_lines.get(p, []) if l.strip()]
    res['equipment'] = eq
    res['characteristics'] = parse_characteristics(char_lines, unparsed)
    if rest:
        unparsed['page1'] = dedent(rest)
    if leftovers:
        unparsed['table'] = leftovers
    if misc and not table_pages:
        unparsed['text'] = dedent(misc)
    elif misc:
        unparsed['other'] = dedent(misc)
    if any(v for v in sections.values()):
        unparsed['sections'] = {k: dedent(v) for k, v in sections.items() if any(x.strip() for x in v)}
    if mast_lines and not res['masts']:
        unparsed['masts'] = dedent(mast_lines)
    return res


def judge(res):
    # what a parse found, and what is missing from a full one
    got = {
        'head': bool(res['heading'] and res['capacity']),
        'benefits': len(res['benefits']),
        'versions': len(res['versions']),
        'vdi': len(res['vdi']),
        'masts': len(res['masts']),
        'equipment_groups': len(res['equipment']),
        'equipment_items': sum(len(g['items']) for g in res['equipment']),
        'characteristics': len(res['characteristics']),
    }
    miss = []
    if not got['head']:
        miss.append('page 1 head')
    if not got['benefits']:
        miss.append('benefits')
    if not got['versions'] or not got['vdi']:
        miss.append('VDI table')
    if not got['equipment_items']:
        miss.append('equipment')
    if not got['characteristics']:
        miss.append('characteristics')
    # a column that no row filled is a column read wrong
    if res['vdi']:
        empty = [i for i in range(len(res['versions'])) if all(r['values'][i] is None for r in res['vdi'])]
        if empty:
            miss.append('empty VDI columns')
    return got, miss


# ------------------------------------------------------------------------------------------------------------------------- main

def main():
    cache = Path(sys.argv[1])
    cache.mkdir(parents=True, exist_ok=True)
    index = sc.tsv(BRIEFS / 'drive' / 'index.tsv')
    files = sc.series_files(index)
    folder = {s: f for f, _, s, _ in sc.CATEGORIES}
    products = json.load(open(CATALOG, encoding='utf-8'))['products']

    plan = {}
    for p in products:
        sheets = folder_sheets(files[(folder[p['category']], p['drive'])])
        pick = (p.get('datasheet') or {}).get('name')
        sheets.sort(key=lambda d: d[1] != pick)
        plan[p['slug']] = sheets
    ids = sorted({i for s in plan.values() for i, _ in s})
    with cf.ThreadPoolExecutor(8) as ex:
        got = dict(zip(ids, ex.map(lambda i: fetch(cache, i), ids)))

    # one parse per Drive file, products that share a file share the parse
    parsed = {}

    def work(fid_name):
        fid, name = fid_name
        path = got.get(fid)
        if not path:
            return fid, None
        return fid, parse_sheet(path, name, fid)

    todo = sorted({(i, n) for s in plan.values() for i, n in s})
    with cf.ThreadPoolExecutor(6) as ex:
        for fid, res in ex.map(work, todo):
            parsed[fid] = res

    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for p in products:
        sheets = plan[p['slug']]
        results = []
        for fid, name in sheets:
            res = parsed.get(fid)
            if res is None:
                res = {'datasheet': {'name': name, 'id': fid}, 'unparsed': {'reason': 'the download failed'}}
            results.append(res)
        # the sheet the catalogue links comes first, unless it holds no VDI table and another one does
        results.sort(key=lambda r: not r.get('vdi'))
        if not results:
            doc = {'slug': p['slug'], 'datasheet': None}
        else:
            doc = {'slug': p['slug'], **results[0]}
            if len(results) > 1:
                doc['more_datasheets'] = results[1:]
        (OUT / f'{p["slug"]}.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        rows.append((p, results))

    full, with_sheet, none = write_readme(rows)
    print('products', len(rows), 'with a data sheet', with_sheet, 'without', none, 'fully parsed', full)


def note_of(res, miss):
    # one plain line on why a parse is not full
    un = res.get('unparsed', {})
    if 'reason' in un:
        return un['reason']
    bits = []
    if {'benefits', 'equipment', 'characteristics'} <= set(miss):
        bits.append('older collage layout, the page 1 text is kept raw under unparsed')
    else:
        if 'page 1 head' in miss:
            bits.append('no title block found')
        if 'benefits' in miss:
            bits.append('benefits are running text, kept raw under unparsed')
        if 'equipment' in miss:
            bits.append('no equipment table found')
        if 'characteristics' in miss:
            bits.append('the characteristics page has no text, it is an image' if un.get('image_pages') else 'no characteristics found')
    if 'VDI table' in miss:
        bits.append('no VDI table')
    if 'empty VDI columns' in miss:
        bits.append('a VDI column came out empty')
    return ', '.join(bits)


def write_readme(rows):
    out = ['# Data sheets as data', '',
           'One JSON per shop product, read from the English Linde data sheets (DS_*.pdf) in the client Drive by '
           '`ekotehnika-hero/scripts/shop-datasheets.py`. Nothing is translated. To redo it, run '
           '`python3 scripts/shop-datasheets.py <download dir>` from `ekotehnika-hero`.', '']
    out += ['## Files', '',
            '- `<slug>.json` holds the first data sheet of the product at the top level. That is the one the catalogue links, unless it has no '
            'VDI table and another one in the folder has. When the folder holds more than one English data sheet, for example two '
            'sub-series, the others follow as `more_datasheets`, with the same fields each.',
            '- A product with no data sheet is the slug and `"datasheet": null` and nothing else.',
            '- `datasheet` is the file name and the Drive id. `heading`, `range`, `capacity`, `tagline` and `benefits[]` come from page 1.',
            '- `versions[]` are the model names of row 1.2. `vdi[]` has one entry per VDI number with `no`, `section`, `label`, `unit`, '
            '`values[]` and `notes[]`, both in the order of `versions[]`. `notes[]` holds the footnote marks taken off each value, and a '
            'null value is a cell that was empty or that the parse could not place. `footnotes[]` are the footnote texts.',
            '- `masts` is raw text per mast type. `equipment[]` is `group`, `columns[]` and `items[]`, `characteristics[]` is `group` and '
            '`bullets[]`.',
            '- `unparsed` is whatever the parse could not place, as raw text. Its `image_pages` are the PDF pages that hold no text at all, '
            'so there is nothing to read from them. `characteristics_captions` are the picture captions beside the characteristics.', '']
    out += ['## The equipment marks', '',
            'The standard and optional marks of the equipment table are drawn shapes, not text, so they are lost in the PDF text. '
            'What survives is the long dash that means not available. Each item that has one carries `na`, the version columns '
            'it sits under. An item with no `na` is standard or optional for the columns of its table, and this data does not say which. '
            'The marks can be read from the page images later if the product pages need them.', '']
    out += ['## Known blemishes', '',
            '- A few equipment group names are cut or joined where two turned labels sit close together, for example `forks` and `tyres` '
            'on R14 to R25, `Standard` and `Lift Series` on two pages that are not equipment. The items under them are right.',
            '- Group names are as each sheet spells them, so Environment, Enviroment and Digitalization all occur.',
            '- On the older sheets a few cells of a row beside a side table can carry a line of its text.',
            '- Footnote marks that touch a value with no space are split by rule, so a value that really ends in a digit followed by a '
            'footnote can lose that digit. The footnote numbers of the sheet are used to choose, and every glued mark was checked '
            'against them.', '']

    lines, nfull, nwith = [], 0, 0
    failed, none = [], []
    for p, rs in rows:
        if not rs:
            none.append(p['slug'])
            lines.append(f'| {p["slug"]} | none in the Drive folder | | | | | | | no data sheet | |')
            continue
        nwith += 1
        got, miss = judge(rs[0]) if 'versions' in rs[0] else (None, ['download'])
        if got is None:
            lines.append(f'| {p["slug"]} | {len(rs)} | | | | | | | failed | the download failed |')
            failed.append((p['slug'], 'the download failed'))
            continue
        extra = []
        for r in rs[1:]:
            g2, m2 = judge(r)
            if m2 and not g2['vdi']:
                extra.append(f'{r["datasheet"]["name"]} has no VDI table')
        status = 'full' if not miss else 'partial'
        if not miss:
            nfull += 1
        note = note_of(rs[0], miss) if miss else ''
        if extra:
            note = (note + ', ' if note else '') + '; '.join(extra)
        if miss:
            failed.append((p['slug'], note))
        lines.append('| {} | {} | {} | {} | {} | {} groups, {} items | {} groups | {} | {} | {} |'.format(
            p['slug'], len(rs), got['versions'], got['vdi'], got['benefits'], got['equipment_groups'], got['equipment_items'],
            got['characteristics'], got['masts'], status, note))
    out += ['## Coverage', '',
            f'{len(rows)} products, {nwith} with a data sheet and {len(none)} without. {nfull} products are fully parsed. Full means '
            'the title block, benefits, VDI table, equipment and characteristics were all found in the first data sheet. Masts are not '
            'part of it, a warehouse truck has none. The counts are for that first data sheet.', '',
            '| slug | data sheets | versions | VDI rows | benefits | equipment | characteristics | mast types | status | notes |',
            '|---|---|---|---|---|---|---|---|---|---|'] + lines + ['']
    out += ['## What failed', '',
            '- No data sheet in the Drive folder for ' + ', '.join(none) + '. They get `"datasheet": null`.']
    for slug, why in failed:
        out.append(f'- {slug}, {why}.')
    out.append('')
    (OUT / 'README.md').write_text('\n'.join(out), encoding='utf-8')
    return nfull, nwith, len(none)


if __name__ == '__main__':
    main()
