// node scripts/polovni-oglas.mjs <ad link> [--photos <folder>] [--max <n>]
//
// Reads a used machine's ad and prints what it found as JSON, the first step of adding a machine to the Polovni shop
// (.claude/skills/polovni-oglas/SKILL.md, src/shop/polovni.json). mojauto.rs ads are read field by field, the title, the price, the
// spec list, the equipment, the history, the description and every photo of the gallery. Any other page gives what its preview tags
// hold. A page that refuses the reading (polovniautomobili.com answers 403) prints { "blocked": true } and the skill asks the client to
// paste the ad's text and upload its photos instead. With --photos the gallery's photos are saved into that folder as 1.jpg, 2.jpg and on,
// the largest size the page offers, at most --max of them (12 by default). Nothing here guesses, a field the page does not give stays null.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!url) {
  console.error('usage: node scripts/polovni-oglas.mjs <ad link> [--photos <folder>] [--max <n>]');
  process.exit(1);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;|&mdash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim();
const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'));
  return m ? decode(m[1]) : null;
};
// the pairs of a list of <li><span>label</span> <strong>value</strong></li>
const pairs = (block) => [...block.matchAll(/<li>\s*<span>([\s\S]*?)<\/span>\s*<strong>([\s\S]*?)<\/strong>\s*<\/li>/g)].map((m) => [decode(m[1]), decode(m[2])]);
// a box of the ad's page by its header, mojauto writes each one as <h1 class="singleBoxHeader">Name</h1> then its list or text
const box = (html, name) => {
  const i = html.indexOf(`singleBoxHeader">${name}</h1>`);
  if (i < 0) return '';
  const end = html.indexOf('singleBoxHeader">', i + 20);
  return html.slice(i, end < 0 ? i + 20000 : end);
};
const num = (s) => {
  if (!s) return null;
  const m = s.replace(/\./g, '').match(/\d+/);
  return m ? Number(m[0]) : null;
};

function readMojauto(html, link) {
  const title = (meta(html, 'og:title') ?? '').replace(/^Polovni\s+/i, '').replace(/\s+-\s+MojAuto.*$/i, '').trim() || null;
  const price = decode(html.match(/class="priceReal">([\s\S]*?)<\/span>/)?.[1] ?? '') || null;
  const spec = pairs(box(html, 'Tehnički podaci')).filter(([k]) => k && !/^Proveri/i.test(k));
  const history = pairs(box(html, 'Poreklo i istorija vozila'));
  const equipment = [...box(html, 'Oprema').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1])).filter(Boolean);
  const descHtml = box(html, 'Opis').match(/<div class="descWrapp">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const description = decode(descHtml)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const photos = [...html.matchAll(/id="advertThumb_\d+"[^>]*href="([^"]+)"/g)].map((m) => new URL(m[1], link).href);
  const basic = decode(html.match(/<ul class="basicSingleData">([\s\S]*?)<\/ul>/)?.[1] ?? '');
  const brand = decode(html.match(/<li class="basicTitle"><strong>([\s\S]*?)<\/strong>/)?.[1] ?? '') || null;
  // the breadcrumb, Mojauto, then the kind of machine, then the brand
  const crumbs = [...html.matchAll(/<span property="name">([^<]+)<\/span>/g)].map((m) => decode(m[1]));
  const kind = crumbs.length >= 3 ? crumbs[1] : null;
  const year = num(basic.match(/(\d{4})\.\s*godište/)?.[1]);
  const posted = html.match(/Postavljen:\s*([\d.]+)/)?.[1] ?? null;
  const id = html.match(/ID oglasa:\s*(\d+)/)?.[1] ?? null;
  // working hours are not a field on mojauto, sellers write them in the description, "RADNI SATI 2942"
  const hoursLine = description.find((l) => /radni(h)?\s+sat/i.test(l));
  return {
    site: 'mojauto.rs',
    link,
    id,
    posted,
    title,
    brand,
    kind,
    year,
    hours: hoursLine ? num(hoursLine) : null,
    price: price && /\d/.test(price) ? num(price) : null,
    priceText: price,
    spec,
    history,
    equipment,
    description,
    photos,
  };
}

function readGeneric(html, link) {
  return {
    site: new URL(link).hostname.replace(/^www\./, ''),
    link,
    id: null,
    posted: null,
    title: meta(html, 'og:title'),
    brand: null,
    kind: null,
    year: null,
    hours: null,
    price: null,
    priceText: null,
    spec: [],
    history: [],
    equipment: [],
    description: (meta(html, 'og:description') ?? '').split(/\n/).filter(Boolean),
    photos: [meta(html, 'og:image')].filter(Boolean),
  };
}

const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } }).catch((e) => ({ ok: false, status: 0, error: String(e) }));
if (!res.ok) {
  console.log(JSON.stringify({ blocked: true, status: res.status, link: url, note: 'The page refused the reading. Ask the client to paste the ad text and upload the photos.' }, null, 2));
  process.exit(0);
}
const html = await res.text();
const ad = /mojauto\.rs/.test(url) ? readMojauto(html, url) : readGeneric(html, url);

const folder = flag('--photos');
if (folder && ad.photos.length) {
  await mkdir(folder, { recursive: true });
  const max = Number(flag('--max') ?? 12);
  const saved = [];
  for (const [i, src] of ad.photos.slice(0, max).entries()) {
    const r = await fetch(src, { headers: { 'user-agent': UA, referer: url } });
    if (!r.ok) continue;
    const file = join(folder, `${i + 1}.jpg`);
    await writeFile(file, Buffer.from(await r.arrayBuffer()));
    saved.push(file);
  }
  ad.saved = saved;
}
console.log(JSON.stringify(ad, null, 2));
