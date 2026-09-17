// A fingerprint of how the page actually renders, so a theme change can be
// proved not to have disturbed the one that already worked.
//
// Screenshots alone cannot do this: they are lossy to compare, they differ on
// antialiasing between runs, and on a loaded box a section may be caught
// mid-beat. This records, per section, every element's geometry relative to
// its own section box plus the computed properties a theme can touch. Two
// runs of the same theme must produce identical JSON; a light-mode build must
// leave the dark-mode fingerprint untouched.
//
//   node scripts/theme-snapshot.mjs <url> <outfile.json> [theme]
//
// Animation is deliberately excluded from the comparison. Every section is
// given `prefers-reduced-motion`, which the motion layer treats as a no-op, so
// what is recorded is the settled design rather than whichever frame a beat
// happened to be on. Motion is checked separately by amplitude.mjs.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:5173';
const OUT = process.argv[3] || 'theme-snapshot.json';
const THEME = process.argv[4] || 'dark';
const SECTIONS = ['.hero', '.bento', '.fam', '.pillars', '.fan', '.steps', '.built', '.faq', 'footer'];
const WIDTHS = [1600, 1100, 720];

// Only properties a theme legitimately changes. Transform and filter are left
// out on purpose: they belong to motion, not colour.
const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderBottomColor',
  'borderLeftColor', 'borderRightColor', 'borderTopWidth', 'boxShadow', 'opacity', 'fontSize',
  'fontWeight', 'fontFamily', 'visibility', 'display', 'mixBlendMode'];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});

const snap = { theme: THEME, url: URL, widths: {} };

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate((t) => {
    if (t === 'light') document.documentElement.dataset.theme = 'light';
  }, THEME);
  // Reveal every band: reduced motion already settles them, this only forces
  // the observer-gated ones that have not been scrolled past.
  await page.evaluate(() => document.querySelectorAll('[data-motion]').forEach((s) => delete s.dataset.motion));
  await page.waitForTimeout(2500);

  const forWidth = {};
  for (const sel of SECTIONS) {
    forWidth[sel] = await page.evaluate(([s, props]) => {
      const root = document.querySelector(s);
      if (!root) return null;
      const base = root.getBoundingClientRect();
      const out = [];
      for (const el of [...root.querySelectorAll('*')].slice(0, 600)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const row = {
          k: (el.className?.toString?.() || el.tagName).slice(0, 44),
          x: +(r.left - base.left).toFixed(1), y: +(r.top - base.top).toFixed(1),
          w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        };
        for (const p of props) row[p] = cs[p];
        out.push(row);
      }
      return { w: +base.width.toFixed(1), h: +base.height.toFixed(1), n: out.length, els: out };
    }, [sel, PROPS]);
  }
  snap.widths[width] = forWidth;
  await page.close();
}

writeFileSync(OUT, JSON.stringify(snap, null, 0));
const total = Object.values(snap.widths).reduce((a, w) =>
  a + Object.values(w).reduce((b, s) => b + (s?.n ?? 0), 0), 0);
console.log(`wrote ${OUT} — ${WIDTHS.length} widths, ${SECTIONS.length} sections, ${total} elements`);
await browser.close();
