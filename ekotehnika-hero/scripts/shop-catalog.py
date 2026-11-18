#!/usr/bin/env python3
# The shop's catalogue, built from the client's Drive (briefs/drive/index.tsv) and the match of its series to the old site's cards
# (briefs/shop/match.tsv, old-cards.tsv). For every one of the 89 series it picks a cut out render, checks that it is one (a clear ground
# at the corners and a truck big enough in the frame), takes two photos of the truck at work and the English data sheet, and writes
# src/shop/catalog.json and the pictures in public/shop/. The Drive's files download straight from their share links.
#
#   python3 scripts/shop-catalog.py <cache dir>          everything
#   python3 scripts/shop-catalog.py <cache dir> --data   the JSON only, from pictures already in public/shop
#
# A series whose render pick is wrong gets a file name in PICK below, and the run is repeated.
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRIEFS = ROOT.parent / 'studio' / 'clients' / 'ekotehnika' / 'briefs'
OUT_JSON = ROOT / 'src' / 'shop' / 'catalog.json'
OUT_IMG = ROOT / 'public' / 'shop'
TOP = 'VILJUSKARI PO VRSTI I MODELIMA'
GENERIC = {'Automation Software', 'Electric Counterbalance Trucks', 'Reach Trucks', 'Very Narrow Aisle Trucks'}

# The ten categories in the order of the shop, the Drive folder, the Serbian name, the slug and the word for one truck of it.
CATEGORIES = [
    ('E - ELEKTRO ČEONI VILJUŠKARI', 'Električni čeoni viljuškari', 'elektricni-ceoni-viljuskari', 'Električni viljuškar'),
    ('IC - DIZEL I PLINSKI ČEONI VILJUŠKARI', 'Dizel i plinski čeoni viljuškari', 'dizel-i-plinski-ceoni-viljuskari', 'Čeoni viljuškar'),
    ('HEAVY TRUCKS', 'Viljuškari velike nosivosti', 'viljuskari-velike-nosivosti', 'Čeoni viljuškar'),
    ('REACH TRUCKS', 'Regalni viljuškari', 'regalni-viljuskari', 'Regalni viljuškar'),
    ('ORDER PICKER', 'Viljuškari za komisioniranje', 'viljuskari-za-komisioniranje', 'Viljuškar za komisioniranje'),
    ('PALLET STACKER', 'Slagači paleta', 'slagaci-paleta', 'Slagač paleta'),
    ('PALLET TRUCK', 'Niskopodizna vozila', 'niskopodizna-vozila', 'Transporter'),
    ('TOW TRACTORS', 'Tegljači', 'tegljaci', 'Tegljač'),
    ('VNA Very Narrow Aisle Trucks', 'Viljuškari za uske prolaze', 'viljuskari-za-uske-prolaze', 'Uskohodnični viljuškar'),
    ('AUTOMATED TRUCKS', 'Automatizovana vozila', 'automatizovana-vozila', 'Autonomni viljuškar'),
]

# Hand picks of the render, by series, where the rule below takes a wrong file. Filled after the contact sheet is checked.
PICK: dict[str, str] = {
    # the turntables of these two pull a logistic train, the tractor alone is one file
    'P40C - P60 C Series 4595': 'BR4595_P60C_00000.png',
    'P60 - P80 Series 1191': 'tow_truck_p60_p80_4144_b_cad_b_alpha.png',
}

# Series with no cut out render, a photo picked by hand stands in, studio on white shown whole, scene cropped to a square.
HERO_PHOTO = {
    'E10 - Series 8917': ('4557_3958_CX.jpg', 'studio'),
    'E16 - E20 Series 1275': ('LMH_E_Trucks_BR1275_E1', 'scene'),
    'H50 - H80 Series 396-04': ('4666_2844_CX.jpg', 'scene'),
    'D12 RW Series 1164': ('4482_3063_CX2.jpg', 'studio'),
    'L14 - L16 RW Series 1174': ('4483_3504_CX_Li.jpg', 'studio'),
    'T20 - T25 RW Series 1154': ('4484_3322_2_CX2_Li.jpg', 'studio'),
}

# The title of a series whose folder holds several of the old site's models, or two folders that share one card.
TITLE = {
    'C-Matic (HP) Series 8925_8928': 'C-MATIC i C-MATIC HP',
    'N16 - N25 Series 1115': 'N16 do N25',
    'T20 - T25 R_SR Series 1154': 'T20 do T25 R/SR',
    'L-Matic HD Series 1173': 'L-MATIC HD',
    'L-Matic HD k Series 1173': 'L-MATIC HD k',
}

# a word that names a model, X20, Xi16, EG25, MV01, R-MATIC, a lone K or A, V modular
MODEL = re.compile(r'^([A-Z][A-Za-z]{0,2}\d|[A-Z]-?MATIC|[A-Z]$|V$)')

# words in a file name that mark a part, an option, another brand or a scene, never the truck
NOT_TRUCK = re.compile(r'fenwick|option|adaptor|adapter|pallet|charging|station|detail|mast_|_mast|wheel|blowup|safety|display|seat|kopie|cam-oben|vogel|ohnebg_|logo|icon|_bs\b', re.I)


def tsv(path):
    rows = [line.rstrip('\n').split('\t') for line in open(path, encoding='utf-8')]
    head = rows[0]
    return [dict(zip(head, r + [''] * (len(head) - len(r)))) for r in rows[1:]]


def slug(text):
    t = text.lower()
    for a, b in [('č', 'c'), ('ć', 'c'), ('š', 's'), ('ž', 'z'), ('đ', 'dj'), ('+', ' plus')]:
        t = t.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def code_of(series):
    # the model range of a series folder, "X20 - X35 Series 1252" is "X20 do X35"
    c = re.split(r'\s+Series\b', series)[0].strip()
    c = c.replace('_', ' / ') if 'AS_' in c else c.replace('_', ' ')
    c = re.sub(r'\s*-\s*(?=[A-Z]{1,3}\d|\d)', ' do ', c)
    c = re.sub(r'\s+', ' ', c).strip()
    return re.sub(r'Matic', 'MATIC', c)


def code_of_card(name):
    # "Linde električni viljuškar X20 – X35" is "X20 do X35", "Linde Tegljači P120 – P350" is "P120 do P350"
    words = re.sub(r'\s*\(.*?\)', '', name).split(' ')
    i = next((k for k, w in enumerate(words) if MODEL.match(w)), None)
    if i is None:
        return name
    c = ' '.join(words[i:])
    c = re.sub(r'\s*[–-]\s*(?=[A-Z]|\d)', ' do ', c) if '–' in c else c
    return c.replace('–', 'do')


def kind_of_card(name):
    note = re.search(r'\((.*?)\)', name)
    words = re.sub(r'\s*\(.*?\)', '', name).split(' ')
    i = next((k for k, w in enumerate(words) if MODEL.match(w)), len(words))
    k = ' '.join(words[1:i]).strip()
    if note and note.group(1).startswith('viljuškar '):
        k += note.group(1)[len('viljuškar'):]
    return k[:1].upper() + k[1:] if k else ''


def series_files(index):
    out = {}
    for r in index:
        parts = r['path'].split('/')
        if TOP not in parts:
            continue
        i = parts.index(TOP)
        if len(parts) <= i + 3 or parts[i + 2] in GENERIC:
            continue
        out.setdefault((parts[i + 1], parts[i + 2]), []).append((r['id'], parts[-1]))
    return out


def render_candidates(files):
    pngs = [(i, n) for i, n in files if n.lower().endswith('.png')]
    good = [(i, n) for i, n in pngs if not NOT_TRUCK.search(n)]
    zero = [(i, n) for i, n in good if re.search(r'_0{3,4}0(_LINDE)?\.png$', n, re.I)]
    fap = [(i, n) for i, n in good if re.search(r'FAP_0{2,3}1\.png$', n, re.I)]
    rest = sorted(good, key=lambda x: x[1])
    seen, out = set(), []
    for c in zero + fap + rest:
        if c[0] not in seen:
            seen.add(c[0])
            out.append(c)
    return out


def photo_candidates(files):
    jpgs = [(i, n) for i, n in files if re.search(r'\.jpe?g$', n, re.I) and not re.search(r'fenwick|freisteller|\(1\)|titel|backgr|_lkw|plane', n, re.I)]
    cx = [c for c in jpgs if re.search(r'_CX\d?\.jpg$|^\d{4}_', c[1])]
    pool = cx or jpgs
    pool = sorted(pool, key=lambda x: x[1])
    if len(pool) <= 2:
        return pool
    # spread over the folder, so the two are not two frames of one shoot
    return [pool[len(pool) // 5], pool[len(pool) * 3 // 5]] + [p for p in pool if p not in (pool[len(pool) // 5], pool[len(pool) * 3 // 5])][:: max(1, len(pool) // 8)][:8]


def datasheet(files):
    pdfs = [(i, n) for i, n in files if n.lower().endswith('.pdf')]
    for rule in (r'^DS_.*_en_.*_view\.pdf$', r'_en_.*_view\.pdf$', r'_en_.*\.pdf$', r'english.*\.pdf$'):
        hit = sorted([p for p in pdfs if re.search(rule, p[1], re.I)], key=lambda p: p[1], reverse=True)
        if hit:
            return hit[0]
    return None


def fetch(cache, fid):
    dest = cache / fid
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    url = f'https://drive.google.com/uc?export=download&id={fid}'
    subprocess.run(['curl', '-sS', '-L', '-m', '180', '-o', str(dest), url], check=False)
    return dest if dest.exists() and dest.stat().st_size > 1000 else None


def is_cutout(path):
    try:
        im = Image.open(path)
    except Exception:
        return None
    if im.mode not in ('RGBA', 'LA', 'P'):
        return None
    im = im.convert('RGBA')
    a = im.split()[-1]
    w, h = im.size
    corners = [a.getpixel((x, y)) for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]]
    box = a.point(lambda v: 255 if v > 24 else 0).getbbox()
    if max(corners) > 10 or not box:
        return None
    area = (box[2] - box[0]) * (box[3] - box[1]) / (w * h)
    return im if area > 0.08 else None


def save_render(im, base):
    # the box of the truck itself, past the soft shadow some renders carry on the ground and the stray pixel some files carry in a
    # corner, so a row or a column counts once more than 3 of its pixels are solid
    import numpy as np
    m = np.asarray(im.split()[-1]) > 96
    rows, cols = np.where(m.sum(1) > 3)[0], np.where(m.sum(0) > 3)[0]
    box = (int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1)
    im = im.crop(box)
    for size, suffix in ((1200, ''), (560, '-s')):
        s = (size * 0.9) / max(im.size)
        t = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        canvas.paste(t, ((size - t.size[0]) // 2, (size - t.size[1]) // 2), t)
        canvas.save(OUT_IMG / f'{base}{suffix}.webp', 'WEBP', quality=84, method=6)


def save_hero_photo(path, base, mode):
    im = Image.open(path).convert('RGB')
    if mode == 'scene':
        side = min(im.size)
        x, y = (im.size[0] - side) // 2, (im.size[1] - side) // 2
        im = im.crop((x, y, x + side, y + side))
    else:
        side = max(im.size)
        canvas = Image.new('RGB', (side, side), (255, 255, 255))
        canvas.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
        im = canvas
    for size, suffix in ((1200, ''), (560, '-s')):
        im.resize((size, size), Image.LANCZOS).save(OUT_IMG / f'{base}{suffix}.webp', 'WEBP', quality=82, method=6)


def colourful(im):
    # a grey CAD drawing has next to no colour, a photo of a red truck at work has plenty
    small = im.convert('RGB').resize((64, 64)).convert('HSV')
    sat = [px[1] for px in small.getdata()]
    return sum(sat) / len(sat) / 255 > 0.12


def save_photo(path, base):
    try:
        im = Image.open(path).convert('RGB')
    except Exception:
        return False
    if min(im.size) < 600 or not colourful(im) or not 0.5 < im.size[0] / im.size[1] < 2.5:
        return False
    s = 1400 / max(im.size)
    if s < 1:
        im = im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS)
    im.save(OUT_IMG / f'{base}.webp', 'WEBP', quality=72, method=6)
    return True


def main():
    cache = Path(sys.argv[1])
    data_only = '--data' in sys.argv
    cache.mkdir(parents=True, exist_ok=True)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    index = tsv(BRIEFS / 'drive' / 'index.tsv')
    match = {(m['category'], m['series']): m for m in tsv(BRIEFS / 'shop' / 'match.tsv')}
    cards = {c['n']: c for c in tsv(BRIEFS / 'shop' / 'old-cards.tsv')}
    files = series_files(index)

    products = []
    used = set()
    for folder, name, cslug, kind in CATEGORIES:
        for (cat, series), fs in sorted(files.items(), key=lambda x: x[0][1]):
            if cat != folder or len(fs) < 2:
                continue
            m = match.get((cat, series), {'cards': '', 'kind': 'none', 'note': ''})
            first = m['cards'].split(',')[0] if m['cards'] else ''
            card = cards.get(first)
            code = TITLE.get(series) or (code_of_card(card['name']) if card and m['kind'] in ('exact', 'guess') else code_of(series))
            num = re.search(r'Series\s+([\d_-]+)', series)
            num = num.group(1).split('_')[0] if num else ''
            base = slug(code)
            if base in used or len(base) <= 2:
                base = f'{base}-{num}'
            used.add(base)
            show = m['kind'] == 'exact' and card
            products.append({
                'slug': base,
                'category': cslug,
                'code': code,
                'kind': (kind_of_card(card['name']) if card and m['kind'] in ('exact', 'guess') else '') or kind,
                'series': num,
                'drive': series,
                'match': m['kind'],
                'kg': int(card['kg']) if show and card['kg'] else None,
                'mm': int(card['mm']) if show and card['mm'] else None,
                '_renders': render_candidates(fs),
                '_photos': photo_candidates(fs),
                '_ds': datasheet(fs),
                '_all': fs,
                '_hero_kind': 'render',
            })

    def work(p):
        log = []
        hero = None
        if not data_only:
            cands = p['_renders']
            if p['drive'] in PICK:
                cands = [c for c in cands if c[1] == PICK[p['drive']]] + cands
            for fid, fname in cands[:6]:
                path = fetch(cache, fid)
                im = is_cutout(path) if path else None
                if im is not None:
                    save_render(im, p['slug'])
                    hero = fname
                    break
            photos = []
            for fid, fname in p['_photos']:
                if p['drive'] in HERO_PHOTO and fname.startswith(HERO_PHOTO[p['drive']][0]):
                    continue
                if len(photos) == 2:
                    break
                path = fetch(cache, fid)
                if path and save_photo(path, f'{p["slug"]}-f{len(photos) + 1}'):
                    photos.append(fname)
            if hero is None and p['drive'] in HERO_PHOTO:
                name, mode = HERO_PHOTO[p['drive']]
                pick = next(((i, n) for i, n in p['_all'] if n.startswith(name)), None)
                path = fetch(cache, pick[0]) if pick else None
                if path:
                    save_hero_photo(path, p['slug'], mode)
                    hero = f'{name} ({mode})'
                    p['_hero_kind'] = mode
            p['_hero'] = hero
            p['_photo_names'] = photos
        return p, log

    with cf.ThreadPoolExecutor(8) as ex:
        for p, log in ex.map(work, products):
            print(p['slug'], p.get('_hero'), *log, flush=True)

    out = []
    for p in products:
        render = (OUT_IMG / f'{p["slug"]}.webp').exists()
        photos = [f'/shop/{p["slug"]}-f{i}.webp' for i in (1, 2) if (OUT_IMG / f'{p["slug"]}-f{i}.webp').exists()]
        ds = p['_ds']
        out.append({
            **{k: v for k, v in p.items() if not k.startswith('_')},
            'render': f'/shop/{p["slug"]}.webp' if render else None,
            'look': p.get('_hero_kind', 'render') if render else None,
            'thumb': f'/shop/{p["slug"]}-s.webp' if render else None,
            'photos': photos,
            'datasheet': {'name': ds[1], 'href': f'https://drive.google.com/uc?export=download&id={ds[0]}'} if ds else None,
        })
    cats = [{'slug': s, 'name': n, 'kind': k, 'drive': f, 'count': sum(1 for p in out if p['category'] == s)} for f, n, s, k in CATEGORIES]
    OUT_JSON.write_text(json.dumps({'categories': cats, 'products': out}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('products', len(out), 'with a render', sum(1 for p in out if p['render']), 'with photos', sum(1 for p in out if p['photos']))


if __name__ == '__main__':
    main()
