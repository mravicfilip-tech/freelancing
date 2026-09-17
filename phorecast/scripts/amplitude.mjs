// How far does anything on a section actually move?
//
// The check that keeps catching the same failure: a loop that runs, throws no
// errors, passes a "distinct intermediate values" test, and moves its elements
// by under two pixels -- so nobody sees it and the animation is reported
// missing. Forty distinct values spread over half a pixel is a pass on every
// other metric and a failure in a browser.
//
// Reports, per section, the largest travel of any descendant and the largest
// opacity swing, so a beat can be judged on what a person would see.
//
//   node scripts/amplitude.mjs [url] [seconds] [--entrance]
//
// Two modes, because a loop and an entrance want opposite sampling windows.
// The default holds still for 2.5s after scrolling a section in, so the page
// settling is over before anything is read -- right for an ambient loop, which
// is still going. It is exactly wrong for a one-shot entrance: a 3s timeline is
// all but finished by the time the first frame is taken, and the section scores
// as STATIC because it was measured after it arrived. `--entrance` starts the
// sampler on the same frame as the scroll instead, and leans on the relative
// maths below to cancel the settle rather than on waiting it out.
//
// One trap this deliberately avoids: scrolling a section into view shifts every
// bounding box by the scroll amount, which reads as movement. Everything below
// is measured RELATIVE TO THE SECTION'S OWN BOX, so the page settling cancels
// out. Measuring absolute rects once reported 139px of "motion" that was
// entirely the scroll.
import { chromium } from 'playwright-core';

const ENTRANCE = process.argv.includes('--entrance');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const URL = args[0] || 'http://localhost:5173';
const SECONDS = Number(args[1] || (ENTRANCE ? 6 : 9));
const SECTIONS = ['.hero', '.bento', '.fam', '.pillars', '.fan', '.steps', '.built', '.faq', 'footer'];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1600, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 110)));

await page.goto(URL, { waitUntil: 'load' });

for (const sel of SECTIONS) {
  // An entrance plays once. Scrolling to section three necessarily passes
  // section four's trigger, so by its turn it would already have opened and
  // would read as STATIC. A reload per section gives each one an untouched
  // page; the cost is a few seconds and the alternative is a false negative.
  if (ENTRANCE && sel !== SECTIONS[0]) await page.goto(URL, { waitUntil: 'load' });

  const found = await page.evaluate((s) => !!document.querySelector(s), sel);
  if (!found) { console.log(`${sel.padEnd(9)} not found`); continue; }

  // In loop mode, scroll it in and hold still so the settle is not counted as
  // motion. In entrance mode the scroll happens inside the sampler below, on
  // the frame sampling starts, because the thing being measured begins the
  // moment the section is scrolled to.
  if (!ENTRANCE) {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'center' }), sel);
    await page.waitForTimeout(2500);
  }

  const r = await page.evaluate(([s, secs, entrance]) => new Promise((res) => {
    const root = document.querySelector(s);
    if (entrance) root.scrollIntoView({ behavior: 'instant', block: 'center' });
    // Re-queried as we go, not captured once. Elements that only exist while a
    // sequence runs -- the line spans `intoLines` creates at build time, a
    // travelling head a loop spawns for one beat -- were never in a list taken
    // before sampling started, so the very things carrying the motion were the
    // ones this script could not see.
    let nodes = [...root.querySelectorAll('*')].slice(0, 400);
    let rescan = 0;
    const seen = new Map();
    const t0 = performance.now();
    const tick = () => {
      const base = root.getBoundingClientRect();
      if (++rescan % 15 === 0) nodes = [...root.querySelectorAll('*')].slice(0, 400);
      for (const e of nodes) {
        // A parked element is not a still element. While a section is held at
        // `visibility: hidden` it sits at its RESTING position, so counting
        // those frames reports the whole entrance offset as travel for
        // everything on the section at once.
        if (getComputedStyle(e).visibility === 'hidden') continue;
        const q = e.getBoundingClientRect();
        const x = q.left - base.left;       // relative: cancels the page scroll
        const y = q.top - base.top;
        const o = Number(getComputedStyle(e).opacity);
        const p = seen.get(e);
        if (!p) seen.set(e, { x: [x, x], y: [y, y], o: [o, o] });
        else {
          p.x[0] = Math.min(p.x[0], x); p.x[1] = Math.max(p.x[1], x);
          p.y[0] = Math.min(p.y[0], y); p.y[1] = Math.max(p.y[1], y);
          p.o[0] = Math.min(p.o[0], o); p.o[1] = Math.max(p.o[1], o);
        }
      }
      if (performance.now() - t0 < secs * 1000) requestAnimationFrame(tick);
      else {
        let mx = 0, my = 0, mo = 0, worst = null;
        for (const [el, v] of seen) {
          const dx = v.x[1] - v.x[0], dy = v.y[1] - v.y[0];
          if (Math.max(dx, dy) > Math.max(mx, my)) worst = el.className?.toString?.().slice(0, 30) || el.tagName;
          mx = Math.max(mx, dx); my = Math.max(my, dy); mo = Math.max(mo, v.o[1] - v.o[0]);
        }
        res({ mx, my, mo, worst });
      }
    };
    requestAnimationFrame(tick);
  }), [sel, SECONDS, ENTRANCE]);

  const peak = Math.max(r.mx, r.my);
  const verdict = peak >= 8 ? 'visible' : peak >= 2 ? 'faint' : r.mo >= 0.2 ? 'fades only' : 'STATIC';
  console.log(`${sel.padEnd(9)} travel x ${r.mx.toFixed(1).padStart(6)}  y ${r.my.toFixed(1).padStart(6)}  opacity ${r.mo.toFixed(2)}  ${verdict.padEnd(10)} ${r.worst ?? ''}`);
}

console.log('\nerrors:', errs.length ? [...new Set(errs)].slice(0, 4) : 'none');
await browser.close();
