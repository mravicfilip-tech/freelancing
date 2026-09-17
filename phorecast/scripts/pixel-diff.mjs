// Compare how two builds of the page actually LOOK, section by section.
//
//   node scripts/pixel-diff.mjs <url-a> <url-b> [theme] [width]
//
// This exists because theme-snapshot.mjs answers a different question than the
// one that usually matters. The snapshot records PROPERTIES, so it reports a
// difference whenever the mechanism changes -- an <img src> becoming a CSS
// mask rewrites `src`, `maskImage` and `backgroundColor` on every converted
// glyph, and drags `color` and the four `border*Color`s along behind
// `currentColor` even on borders of zero width. The light-mode conversion did
// that ~270 times, which showed up as 1491 "differences" in a dark theme whose
// appearance had not moved at all. A gate that loud is a gate nobody reads.
//
// The run-to-run noise floor was measured before trusting this: the same URL
// against itself is byte-identical in all nine sections, max delta 0. So
// headless Chromium here is deterministic, and any non-zero result below is a
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
// `any` counts pixels differing at all; `>24` counts those differing by more
// than 24/255 on some channel, which is roughly where a difference stops being
// an edge artefact and starts being something a person can see. A conversion
// that is genuinely representation-only reads as a few dozen `>24` pixels
// page-wide, all on glyph edges. Anything with an area is a regression.
import { chromium } from 'playwright-core';

const SECTIONS = ['.hero', '.bento', '.fam', '.pillars', '.fan', '.steps', '.built', '.faq', 'footer'];
const [, , URL_A, URL_B, THEME = 'dark', WIDTH = '1600'] = process.argv;
if (!URL_A || !URL_B) {
  console.error('usage: node scripts/pixel-diff.mjs <url-a> <url-b> [theme] [width]');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});

// WebGL is off, so the hero mark renders its static fallback. That is
// deliberate: the 3D mark is checked with scripts/drive-logo.mjs under
// swiftshader, and leaving it live here would make this gate non-deterministic
// for the one element it cannot judge anyway.
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
  if (!a[sel] || !b[sel]) { console.log(sel.padEnd(9), 'skipped — not present'); continue; }
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

  if (r.size) { console.log(sel.padEnd(9), `SIZE MOVED ${r.size[0]}x${r.size[1]} -> ${r.size[2]}x${r.size[3]}`); worst = Infinity; continue; }
  worst = Math.max(worst, r.big);
  const hot = r.top.length ? `  hot rows ${r.top.map(([y, c]) => `y${y}:${c}`).join(' ')}` : '';
  console.log(sel.padEnd(9), `${r.w}x${r.h}`,
    `any ${(100 * r.n / r.tot).toFixed(3)}%`,
    `>24 ${(100 * r.big / r.tot).toFixed(3)}% (${r.big}px)`,
    `max ${r.maxd}${hot}`);
}
console.log(worst === 0 ? '\nPIXEL-IDENTICAL' : `\n${worst}px is the largest visible-threshold cluster in any one section`);
await browser.close();
