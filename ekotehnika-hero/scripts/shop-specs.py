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
COMPARE = ['1.3', '1.5', '1.7', '4.4', '5.1', '5.2', '4.35', '4.34.1', '2.1', '7.2', '6.1', '6.4', 'fuel']
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
    if v is None:
        return None
    v = v.strip()
    if v in ('', '-', '\u2013', '\u2014'):
        return None
    v = re.sub(r'\s*[\u2013\u2014]\s*', ' do ', v)
    v = re.sub(r':\s*', ' ', v)
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


# the icon of a group of features or equipment, from the words of its English name, ModelSpec.tsx draws them
ICONS = [
    ('shield', ('safety', 'security', 'protect')),
    ('seat', ('ergonom', 'workplace', 'comfort', 'cab', 'operator', 'driver')),
    ('lever', ('operation', 'control', 'handling', 'load handling', 'steer')),
    ('wrench', ('service', 'maintenance')),
    ('battery', ('battery', 'charg', 'energy', 'lithium', 'li-ion')),
    ('bolt', ('drive', 'brake', 'engine', 'motor', 'power', 'transmission')),
    ('tyre', ('axle', 'tyre', 'tire', 'wheel', 'chassis')),
    ('mast', ('mast', 'lift')),
    ('fork', ('attach', 'fork')),
    ('chip', ('digital', 'fleet', 'connect', 'data', 'assist', 'automat')),
    ('gauge', ('perform', 'productiv', 'efficien', 'speed')),
    ('bulb', ('light',)),
]


def icon_of(name):
    low = name.lower()
    return next((icon for icon, words in ICONS if any(w in low for w in words)), 'grid')


def kw(values):
    """A power, a range of the versions, or two motors written 2x 11 kept as 2 × 11."""
    for v in values:
        m = re.search(r'(\d+)\s*[x\u00d7]\s*(\d+(?:\.\d+)?)', v or '')
        if m:
            return f'{m.group(1)} \u00d7 {sr_number(m.group(2))}'
    # an engine's name in the cell, OM934 or QSB 6.7, is not a power
    return span(nums([re.sub(r'\b[A-Z]{2,}\s?\d+(?:\.\d+)?', ' ', v or '') for v in values]))


def build(d, sr, kind, missing, category=''):
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
    pull = rows.get('1.7')
    if category == 'tegljaci':
        # a tow tractor's 1.5 mixes the trailer's load and the platform's, so its figure is the pull
        if pull and nums(pull['values']):
            figures.append({'label': 'Vučna sila', 'value': span(nums(pull['values'])), 'unit': 'N'})
    elif cap:
        # a stacker's pair, 1.2 / 2.0, is the mast's rating then the initial lift's with two pallets, the first is the rating
        xs = [n[0] for n in (nums([v.split('/')[0]]) for v in cap['values'] if v) if n]
        if xs:
            if '(t)' in cap.get('unit', '') or max(xs) < 100:
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
    # the top lift is the highest h3 of every mast table and of row 4.4, whether or not a table parsed whole
    lifts = [int(x) for raw in (d.get('masts') or {}).values() for x in re.findall(r'h3:\s*(\d+)', raw)]
    lifts += [x for v in (rows.get('4.4') or {}).get('values', []) for x in nums([v.split('(')[0]])]
    # a footnote mark glued to a lift in the PDF text reads as 40751, no Linde truck lifts past 20 m
    lifts = [x for x in lifts if x <= 20000]
    if lifts:
        figures.append({'label': 'Visina podizanja', 'value': ('do ' if len(set(lifts)) > 1 else '') + fmt_num(max(lifts)), 'unit': 'mm'})
    speed = rows.get('5.1')
    if speed:
        # the sheet's own unit, an automated truck gives m/s, and a footnote glued to a speed, 146, is dropped
        u = speed.get('unit', '').replace(' ', '')
        unit = 'm/s' if 'm/s' in u and 'km' not in u else 'km/h'
        xs = [x for x in nums(speed['values']) if x <= 40]
        if xs:
            figures.append({'label': 'Brzina vožnje', 'value': ('do ' if len(set(xs)) > 1 else '') + fmt_num(max(xs)), 'unit': unit})
    power = rows.get('7.2')
    motor = rows.get('6.1')
    battery = rows.get('6.4')
    if power and nums(power['values']):
        figures.append({'label': 'Snaga motora', 'value': kw(power['values']), 'unit': 'kW'})
    elif motor and nums(motor['values']):
        figures.append({'label': 'Snaga pogonskog motora', 'value': kw(motor['values']), 'unit': 'kW'})
    elif battery:
        volts = [nums([v.split('/')[0]])[0] for v in battery['values'] if v and nums([v.split('/')[0]])]
        if volts:
            figures.append({'label': 'Napon baterije', 'value': span(volts), 'unit': 'V'})
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
            out['characteristics'].append({'group': name, 'icon': icon_of(g['group']), 'bullets': bullets})

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
            word = None
            if v and not re.search(r'\d', v):
                word = sr.get('values_no', {}).get(norm(f"{r['no']}|{v}")) or sr.get('values', {}).get(norm(v))
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
        if no == '1.5' and category == 'tegljaci':
            unit = re.sub(r'^[A-Za-z0-9/]+\s*\((.*)\)$', r'\1', row['unit'])
            compare.append({'label': row['label'], 'unit': unit, 'values': row['values']})
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
        if not (name and items):
            continue
        # a sheet that repeats its equipment table per model block gives each group once, each line once
        same = next((e for e in equipment if e['group'] == name), None)
        if same:
            seen = {i['t'] for i in same['items']}
            same['items'] += [i for i in items if i['t'] not in seen]
        else:
            equipment.append({'group': name, 'icon': icon_of(g['group']), 'items': items})
    out['equipment'] = equipment
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
        args = [a for a in args if a != sys.argv[sys.argv.index('--only') + 1]]
    ds = Path(args[0]) if args else DS
    # the Serbian, the first file and every part a helper translated in scripts/sr, a later file never overrides an earlier one
    sr = {}
    for f in [APP / 'scripts/specs-sr.json', *sorted((APP / 'scripts/sr').glob('*.json'))]:
        for k, v in json.loads(f.read_text()).items():
            if isinstance(v, dict):
                for a, b in v.items():
                    if isinstance(b, str) and b.strip():
                        sr.setdefault(k, {}).setdefault(norm(a), b.strip())
    catalog = json.loads((APP / 'src/shop/catalog.json').read_text())
    kinds = {p['slug']: p['kind'] for p in catalog['products']}
    cats = {p['slug']: p['category'] for p in catalog['products']}
    facts = {}
    OUT.mkdir(parents=True, exist_ok=True)
    missing = set()
    written = 0
    for f in sorted(ds.glob('*.json')):
        d = json.loads(f.read_text())
        slug = d.get('slug')
        if not slug or slug not in kinds or not d.get('datasheet') or (only and slug not in only):
            continue
        spec = build(d, sr, kinds[slug], missing, cats[slug])
        (OUT / f'{slug}.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n')
        written += 1
        # the card's two facts from the sheet, Filip's yes of 18 November, the top capacity and the top lift like the old site's cards
        f = {}
        for fig in spec['figures']:
            top = max(float(x.replace('.', '').replace(',', '.')) for x in re.findall(r'\d[\d.]*(?:,\d+)?', fig['value']))
            if fig['label'] == 'Nosivost':
                f['kg'] = round(top)
            if fig['label'] == 'Visina podizanja' and top > 500:
                f['mm'] = round(top)
        if f:
            facts[slug] = f
    if not only:
        (APP / 'src/shop/facts.json').write_text(json.dumps(dict(sorted(facts.items())), indent=1) + '\n')
    (ds / 'untranslated.txt').write_text(''.join(sorted(f'{m}\n' for m in missing)))
    print(f'{written} specs written to {OUT.relative_to(APP)}, {len(missing)} strings with no Serbian yet, see {ds / "untranslated.txt"}')


if __name__ == '__main__':
    main()
