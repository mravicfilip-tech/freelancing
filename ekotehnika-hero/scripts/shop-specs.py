#!/usr/bin/env python3
"""The Serbian spec of each shop model, from Linde's English data sheet on the client's Drive.

Filip 18 November, "the product page needs more work, needs description, bullet points why this works, extract data from google
drive and populize this page as much as we can". Reads the data sheets that scripts/shop-datasheets.py pulled into
studio/clients/ekotehnika/briefs/shop/ds/<slug>.json and the Serbian of their strings in scripts/specs-sr.json, and writes
src/shop/specs/<slug>.json, which the model page loads. Nothing is written that the sheet does not say. A string with no Serbian yet
is left out and listed in briefs/shop/ds/untranslated.txt, so a gap shows instead of English on a Serbian page.

    python3 scripts/shop-specs.py [ds dir] [--only slug,slug]
"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
DS = APP.parent / 'studio/clients/ekotehnika/briefs/shop/ds'
OUT = APP / 'src/shop/specs'

# the rows of the short table of versions, in this order, by VDI number
COMPARE = ['1.3', '1.5', '4.4', '5.1', '5.2', '4.35', '4.34.1', '2.1', '7.2', 'fuel']
FUEL = ['7.5', '7.5a', '7.5b']


def norm(s):
    s = s.replace('’', "'").replace('`', "'").replace('”', '"').replace('“', '"').replace('­', '')
    return re.sub(r'\s+', ' ', s).strip()


def no_dash(s):
    """A model range written the site's way, H16 do H20, never with a dash."""
    return re.sub(r'\s*[–—]\s*', ' do ', s)


def thousands(int_part):
    return f'{int(int_part):,}'.replace(',', '.') if len(int_part) > 3 else int_part


def sr_number(n):
    """1.6 to 1,6, 2194.0 to 2.194,0, 3815 to 3.815."""
    if '.' in n:
        a, b = n.split('.', 1)
        return f'{thousands(a)},{b}'
    return thousands(n)


def sr_value(v, unit):
    v = v.strip()
    if v in ('', '-'):
        return None
    if not unit:
        return v
    if re.fullmatch(r'[\d.]+(\s*/\s*[\d.]+)*', v):
        return ' / '.join(sr_number(x.strip()) for x in v.split('/'))
    return re.sub(r'(\d)\.(\d)', r'\1,\2', v)


def nums(values):
    out = []
    for v in values:
        for x in re.findall(r'\d+(?:\.\d+)?', v or ''):
            out.append(float(x))
    return out


def fmt_num(x):
    return thousands(str(int(round(x)))) if abs(x - round(x)) < 1e-9 else sr_number(f'{x:g}')


def span(xs, prefix_when_many='do '):
    lo, hi = min(xs), max(xs)
    return fmt_num(lo) if lo == hi else f'{fmt_num(lo)} do {fmt_num(hi)}'


def build(d, sr, kind, missing):
    def tr(table, s, where):
        key = norm(s)
        hit = sr.get(table, {}).get(key)
        if hit is None:
            missing.add(f'{table}\t{key}\t{where}')
        return hit

    slug = d['slug']
    out = {'slug': slug}
    sheet = d.get('datasheet') or {}
    out['source'] = {'name': sheet.get('name'), 'href': f"https://drive.google.com/uc?export=download&id={sheet.get('id')}"}
    versions = [no_dash(v) for v in d.get('versions', [])]
    out['versions'] = versions
    rows = {r['no']: r for r in d.get('vdi', [])}

    tag = d.get('tagline')
    out['tagline'] = tr('tagline', tag, slug) if tag else None
    out['benefits'] = [x for x in (tr('text', b, slug) for b in d.get('benefits', [])) if x]

    # the four figures over the buttons, each from its own row
    figures = []
    cap = rows.get('1.5')
    if cap:
        xs = nums(cap['values'])
        if xs:
            if '(t)' in cap.get('unit', ''):
                xs = [x * 1000 for x in xs]
            figures.append({'label': 'Nosivost', 'value': span(xs), 'unit': 'kg'})
    masts = []
    for name, raw in (d.get('masts') or {}).items():
        h = {k: [int(x) for x in re.findall(rf'{k}:\s*(\d+)', raw)] for k in ('h1', 'h2', 'h3', 'h4')}
        if h['h3'] and all(len(h[k]) == len(h['h3']) for k in h):
            title = tr('masts', name, slug)
            if title:
                masts.append({'name': title, 'rows': [{k: h[k][i] for k in h} for i in range(len(h['h3']))]})
    out['masts'] = masts
    lifts = [r['h3'] for m in masts for r in m['rows']] or nums((rows.get('4.4') or {}).get('values', []))
    if lifts:
        figures.append({'label': 'Visina podizanja', 'value': ('do ' if len(set(lifts)) > 1 else '') + fmt_num(max(lifts)), 'unit': 'mm'})
    speed = rows.get('5.1')
    if speed and nums(speed['values']):
        xs = nums(speed['values'])
        figures.append({'label': 'Brzina vožnje', 'value': ('do ' if len(set(xs)) > 1 else '') + fmt_num(max(xs)), 'unit': 'km/h'})
    power = rows.get('7.2')
    if power and nums(power['values']):
        figures.append({'label': 'Snaga motora', 'value': span(nums(power['values'])), 'unit': 'kW'})
    out['figures'] = figures

    # one sentence from the facts, the kind, the fuels, the capacity and how many versions
    drives = []
    for v in (rows.get('1.3') or {}).get('values', []):
        word = sr.get('kind_drive', {}).get(norm(v))
        if word and word not in drives:
            drives.append(word)
    parts = [kind]
    if drives and drives != ['struju']:
        parts[0] += ' na ' + (drives[0] if len(drives) == 1 else ', '.join(drives[:-1]) + ' ili ' + drives[-1])
    if figures and figures[0]['label'] == 'Nosivost':
        parts.append(f"nosivosti {figures[0]['value']} kg")
    n = len(versions)
    if n > 1:
        parts.append(f"u {n} {'verzije' if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14) else 'verzija'}")
    out['lede'] = ', '.join(parts) + '.'

    out['characteristics'] = []
    for g in d.get('characteristics', []):
        name = tr('groups', g['group'], slug)
        bullets = [x for x in (tr('text', b, slug) for b in g.get('bullets', [])) if x]
        if name and bullets:
            out['characteristics'].append({'group': name, 'bullets': bullets})

    # the full table by its sections, and the short one of the rows a buyer compares
    table = []
    for r in d.get('vdi', []):
        label = tr('labels', r['label'], f"{slug} {r['no']}")
        section = tr('sections', r['section'], slug)
        if not label or not section:
            continue
        unit = r.get('unit', '').replace(' ³', '³').replace('m3', 'm³')
        vals = []
        for v in r['values']:
            word = sr.get('values', {}).get(norm(v)) if v and not re.search(r'\d', v) else None
            vals.append(word if word else sr_value(v, unit))
        notes = [' '.join(n) if isinstance(n, list) else (n or '') for n in r.get('notes', [[]] * len(vals))]
        if not table or table[-1]['section'] != section:
            table.append({'section': section, 'rows': []})
        table[-1]['rows'].append({'no': r['no'], 'label': label, 'unit': unit, 'values': vals, 'notes': notes})
    out['table'] = table
    flat = {row['no']: row for s in table for row in s['rows']}

    compare = []
    for no in COMPARE:
        if no == 'fuel':
            got = [flat.get(x) for x in FUEL if flat.get(x)]
            if got:
                vals = []
                for i in range(len(versions)):
                    cell = next((f"{g['values'][i]} {g['unit']}" for g in got if i < len(g['values']) and g['values'][i]), None)
                    vals.append(cell)
                compare.append({'label': 'Potrošnja goriva', 'unit': '', 'values': vals})
            continue
        row = flat.get(no)
        if not row:
            continue
        if no == '1.5' and '(t)' in row['unit']:
            vals = [fmt_num(float(v.replace(',', '.')) * 1000) if v and re.fullmatch(r'[\d,]+', v) else v for v in row['values']]
            compare.append({'label': 'Nosivost', 'unit': 'kg', 'values': vals})
            continue
        unit = re.sub(r'^[A-Za-z0-9/]+\s*\((.*)\)$', r'\1', row['unit'])
        compare.append({'label': row['label'], 'unit': unit, 'values': row['values']})
    out['compare'] = compare

    out['footnotes'] = [x for x in ({'n': f['n'], 'text': tr('footnotes', f['text'], slug)} for f in d.get('footnotes', [])) if x['text']]

    equipment = []
    for g in d.get('equipment', []):
        name = tr('groups', g['group'], slug)
        cols = [no_dash(c) for c in g.get('columns', [])]
        items = []
        for it in g.get('items', []):
            t = tr('text', it['text'], slug)
            if not t:
                continue
            na = [no_dash(x) for x in it.get('na', [])]
            # a line some versions lack names the versions that have it
            only = [c for c in cols if c not in na] if na else []
            items.append({'t': t, 'only': only} if only else {'t': t})
        if name and items:
            equipment.append({'group': name, 'items': items})
    out['equipment'] = equipment
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
        args = [a for a in args if a != sys.argv[sys.argv.index('--only') + 1]]
    ds = Path(args[0]) if args else DS
    sr = json.loads((APP / 'scripts/specs-sr.json').read_text())
    sr = {k: ({norm(a): b for a, b in v.items()} if isinstance(v, dict) else v) for k, v in sr.items()}
    catalog = json.loads((APP / 'src/shop/catalog.json').read_text())
    kinds = {p['slug']: p['kind'] for p in catalog['products']}
    OUT.mkdir(parents=True, exist_ok=True)
    missing = set()
    written = 0
    for f in sorted(ds.glob('*.json')):
        d = json.loads(f.read_text())
        slug = d.get('slug')
        if not slug or slug not in kinds or not d.get('datasheet') or (only and slug not in only):
            continue
        spec = build(d, sr, kinds[slug], missing)
        (OUT / f'{slug}.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n')
        written += 1
    (ds / 'untranslated.txt').write_text(''.join(sorted(f'{m}\n' for m in missing)))
    print(f'{written} specs written to {OUT.relative_to(APP)}, {len(missing)} strings with no Serbian yet, see {ds / "untranslated.txt"}')


if __name__ == '__main__':
    main()
