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
//   node scripts/amplitude.mjs [url] [seconds]
//
// One trap this deliberately avoids: scrolling a section into view shifts every
// bounding box by the scroll amount, which reads as movement. Everything below
// is measured RELATIVE TO THE SECTION'S OWN BOX, so the page settling cancels
// out. Measuring absolute rects once reported 139px of "motion" that was
// entirely the scroll.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://localhost:5173';
const SECONDS = Number(process.argv[3] || 9);
const SECTIONS = ['.hero', '.bento', '.fam', '.pillars', '.fan', '.steps', '.built', '.faq', 'footer'];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 110)));

await page.goto(URL, { waitUntil: 'load' });

for (const sel of SECTIONS) {
  const found = await page.evaluate((s) => !!document.querySelector(s), sel);
  if (!found) { console.log(`${sel.padEnd(9)} not found`); continue; }

  // Scroll it in, then hold still so the settle is not counted as motion.
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'center' }), sel);
  await page.waitForTimeout(2500);

  const r = await page.evaluate(([s, secs]) => new Promise((res) => {
    const root = document.querySelector(s);
    const nodes = [...root.querySelectorAll('*')].slice(0, 400);
    const seen = new Map();
    const t0 = performance.now();
    const tick = () => {
      const base = root.getBoundingClientRect();
      for (const e of nodes) {
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
  }), [sel, SECONDS]);

  const peak = Math.max(r.mx, r.my);
  const verdict = peak >= 8 ? 'visible' : peak >= 2 ? 'faint' : r.mo >= 0.2 ? 'fades only' : 'STATIC';
  console.log(`${sel.padEnd(9)} travel x ${r.mx.toFixed(1).padStart(6)}  y ${r.my.toFixed(1).padStart(6)}  opacity ${r.mo.toFixed(2)}  ${verdict.padEnd(10)} ${r.worst ?? ''}`);
}

console.log('\nerrors:', errs.length ? [...new Set(errs)].slice(0, 4) : 'none');
await browser.close();
