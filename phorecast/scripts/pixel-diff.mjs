// Visual regression check: compare how two builds of the page LOOK, section
// by section, and say whether anything a person could see has changed.
//
//   node scripts/pixel-diff.mjs <url-a> <url-b> [theme] [width]
//
//   url-a, url-b   two running copies of the site, e.g. a baseline build and
//                  yours, each served with `npx vite preview --port <n>`
//   theme          dark (default) or light
//   width          viewport width, default 1600
//
// Typical use, to prove a refactor changed nothing on screen:
//
//   git worktree add ../base <commit> && (cd ../base && npm ci && npm run build)
//   (cd ../base && npx vite preview --port 4900) &
//   npm run build && npx vite preview --port 4901 &
//   node scripts/pixel-diff.mjs http://localhost:4900 http://localhost:4901
//   node scripts/pixel-diff.mjs http://localhost:4900/about http://localhost:4901/about light
//
// Exits 0 and prints PIXEL-IDENTICAL when every section matches, 1 otherwise.
// Needs a Chromium for playwright-core: run `npx playwright-core install
// chromium` once, or point CHROMIUM_PATH at any Chrome or Chromium binary.
//
// Same URL against itself is byte-identical in every section, max delta 0, so
// headless Chromium here is deterministic and any non-zero result below is a
// real rendering difference rather than antialiasing jitter. Three things buy
// that determinism and all three are load-bearing:
//
//   reducedMotion: 'reduce'   -- the motion layer treats it as a no-op, so
//                                what is captured is the settled design and
//                                not whichever frame a beat happened to be on.
//   deviceScaleFactor: 1      -- fractional dpr resamples, and resampling is
//                                where antialiasing becomes unstable.
//   a fixed scroll sequence   -- every section is scrolled through in the same
//                                order at the same step, so lazy work and
//                                entrance triggers fire identically.
//
// WebGL is off, so the hero mark renders its static fallback. The live 3D mark
// cannot be judged by pixels anyway, and leaving it on would make the whole
// check non-deterministic.
//
// `any` counts pixels differing at all; `>24` counts those differing by more
// than 24/255 on some channel, which is roughly where a difference stops being
// an edge artefact and starts being something a person can see. A change that
// is genuinely representation-only reads as a few dozen `>24` pixels
// page-wide, all on glyph edges. Anything with an area is a regression.
import { chromium } from 'playwright-core';

// The landing page's sections, then the About page's. Whichever page is loaded,
// the other page's sections are simply absent from both captures and skipped.
const SECTIONS = ['.hero', '.bento', '.fam', '.pillars', '.fan', '.steps', '.built',
  '.ab-hero', '.ab-choose', '.ab-brand', '.ab-conv', '.ab-cmp', '.ab-why', '.faq', 'footer'];
const [, , URL_A, URL_B, THEME = 'dark', WIDTH = '1600'] = process.argv;
if (!URL_A || !URL_B) {
  console.error('usage: node scripts/pixel-diff.mjs <url-a> <url-b> [theme] [width]');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-webgl'],
});

async function capture(url) {
  const page = await browser.newPage({
    viewport: { width: Number(WIDTH), height: 950 },
    colorScheme: THEME === 'light' ? 'light' : 'dark',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), THEME);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);

  const shots = {};
  for (const sel of SECTIONS) {
    const el = await page.$(sel);
    if (!el) { shots[sel] = null; continue; }
    try { shots[sel] = (await el.screenshot({ timeout: 15000 })).toString('base64'); }
    catch { shots[sel] = null; }
  }
  await page.close();
  return shots;
}

const a = await capture(URL_A);
const b = await capture(URL_B);

// The comparison runs inside a page because there is no image decoder in this
// project's dependencies and adding one for a diagnostic is not worth it.
const cmp = await browser.newPage();
await cmp.goto('about:blank');

let worst = 0;
for (const sel of SECTIONS) {
  if (!a[sel] && !b[sel]) continue; // not on this page
  // On one side only is a difference, not a skip: a section that failed to
  // render, or was removed, must fail the check.
  if (!a[sel] || !b[sel]) { console.log(sel.padEnd(10), `MISSING from ${a[sel] ? 'b' : 'a'}`); worst = Infinity; continue; }
  const r = await cmp.evaluate(async ([da, db]) => {
    const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + d; });
    const ia = await load(da), ib = await load(db);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
    const c = new OffscreenCanvas(ia.width, ia.height);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(ia, 0, 0); const pa = x.getImageData(0, 0, ia.width, ia.height).data;
    x.clearRect(0, 0, ia.width, ia.height);
    x.drawImage(ib, 0, 0); const pb = x.getImageData(0, 0, ia.width, ia.height).data;
    let n = 0, big = 0, maxd = 0; const rows = {};
    for (let i = 0; i < pa.length; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      if (d > 0) n++;
      if (d > 24) { big++; const y = Math.floor((i / 4) / ia.width); rows[y] = (rows[y] || 0) + 1; }
      if (d > maxd) maxd = d;
    }
    return { w: ia.width, h: ia.height, n, big, maxd, tot: ia.width * ia.height,
      top: Object.entries(rows).sort((p, q) => q[1] - p[1]).slice(0, 3) };
  }, [a[sel], b[sel]]);

  if (r.size) { console.log(sel.padEnd(10), `SIZE MOVED ${r.size[0]}x${r.size[1]} -> ${r.size[2]}x${r.size[3]}`); worst = Infinity; continue; }
  worst = Math.max(worst, r.big);
  const hot = r.top.length ? `  hot rows ${r.top.map(([y, c]) => `y${y}:${c}`).join(' ')}` : '';
  console.log(sel.padEnd(10), `${r.w}x${r.h}`,
    `any ${(100 * r.n / r.tot).toFixed(3)}%`,
    `>24 ${(100 * r.big / r.tot).toFixed(3)}% (${r.big}px)`,
    `max ${r.maxd}${hot}`);
}
console.log(worst === 0 ? '\nPIXEL-IDENTICAL'
  : worst === Infinity ? '\nA section moved size or is missing on one side'
  : `\n${worst}px is the largest visible-threshold cluster in any one section`);
await browser.close();
process.exit(worst === 0 ? 0 : 1);
