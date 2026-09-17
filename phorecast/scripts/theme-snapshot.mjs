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
//
// `fill`, `stroke` and `stopColor` were the biggest hole in this list. Inline
// SVG children ARE walked -- the fan alone contributes about 120 of them --
// but until now the only properties read off them were HTML ones, so every
// recolour of an inlined illustration was invisible here. That is most of the
// hard work in the light-mode job.
//
// `maskImage` is recorded because the single-colour glyphs convert from <img>
// to a CSS mask, and `src` because swapping an asset for a light variant in
// the wrong branch would otherwise pass silently. `src` is an attribute, not a
// computed property, so it is collected separately below.
const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderBottomColor',
  'borderLeftColor', 'borderRightColor', 'borderTopWidth', 'boxShadow', 'opacity', 'fontSize',
  'fontWeight', 'fontFamily', 'visibility', 'display', 'mixBlendMode',
  'fill', 'stroke', 'stopColor', 'maskImage'];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});

const snap = { theme: THEME, url: URL, widths: {} };

for (const width of WIDTHS) {
  // `colorScheme` matters from the first byte now: index.html resolves the
  // theme in a blocking inline script, and Chromium's default preference is
  // light, so without this a run asked for dark would load light and then be
  // forced back -- measuring a page that had already painted the other
  // palette. The explicit write afterwards covers the localStorage case.
  const page = await browser.newPage({
    viewport: { width, height: 950 },
    reducedMotion: 'reduce',
    colorScheme: THEME === 'light' ? 'light' : 'dark',
  });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, THEME);
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
      // Raised from 600. It was never binding -- the hero, the largest
      // section, was at 447 -- but the theme switcher renders inside .hero and
      // masked-icon wrappers add nodes too, and a cap that starts truncating
      // does it silently: the tail of a section would simply stop being
      // checked.
      for (const el of [...root.querySelectorAll('*')].slice(0, 1200)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const row = {
          k: (el.className?.toString?.() || el.tagName).slice(0, 44),
          x: +(r.left - base.left).toFixed(1), y: +(r.top - base.top).toFixed(1),
          w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        };
        for (const p of props) row[p] = cs[p];
        row.src = el.getAttribute('src') ?? '';
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
