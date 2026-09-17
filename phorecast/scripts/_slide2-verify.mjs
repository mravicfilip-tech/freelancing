import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = '/tmp/claude-0/-home-user-freelancing/1898ca7c-6b2c-584e-a7b7-679558d8c8b1/scratchpad';
const CSS = fs.readFileSync('src/components/hero/slides/SlideAccount.css', 'utf8');
const WIDTHS = [1920, 1600, 1280, 2560];

/** Runs inside the page: clip-aware bounds of everything painted inside .sl2. */
const MEASURE = () => {
  const slide = document.querySelector('.hero__slide.is-active');
  const sl2 = document.querySelector('.sl2');
  const box = document.querySelector('.sl2__box');
  const sr = slide.getBoundingClientRect();
  const clipOf = (el) => {
    let r = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        r = { l: Math.max(r.l, pr.left), t: Math.max(r.t, pr.top), r: Math.min(r.r, pr.right), b: Math.min(r.b, pr.bottom) };
      }
    }
    return r;
  };
  let maxRight = -1e9, minLeft = 1e9, minTop = 1e9, maxBottom = -1e9, who = null;
  for (const el of document.querySelectorAll('.sl2 *')) {
    const b = el.getBoundingClientRect();
    if (!b.width && !b.height) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    const c = clipOf(el);
    const l = Math.max(b.left, c.l), rr = Math.min(b.right, c.r);
    const t = Math.max(b.top, c.t), bb = Math.min(b.bottom, c.b);
    if (rr <= l || bb <= t) continue;            // fully clipped away
    if (rr > maxRight) { maxRight = rr; who = el.className || el.tagName; }
    minLeft = Math.min(minLeft, l); minTop = Math.min(minTop, t); maxBottom = Math.max(maxBottom, bb);
  }
  // --u as a descendant resolves it
  const u = parseFloat(getComputedStyle(document.querySelector('.sl2__group')).gap);
  const f = (n) => +n.toFixed(2);
  return {
    columnWidth: f(sr.width), columnLeft: f(sr.left), columnRight: f(sr.right),
    sl2Width: f(sl2.getBoundingClientRect().width),
    u: +(u / 14).toFixed(4), uExpected: +(sr.width / 1800).toFixed(4),
    boxRight: f(box.getBoundingClientRect().right),
    paintedLeft: f(minLeft), paintedRight: f(maxRight), paintedTop: f(minTop), paintedBottom: f(maxBottom),
    slackToColumn: f(sr.right - maxRight),
    slackToViewport: f(window.innerWidth - maxRight),
    rightmost: String(who),
    present: {
      pred: document.querySelectorAll('.sl2-pred').length,
      market: document.querySelectorAll('.sl2-mc').length,
      minis: document.querySelectorAll('.sl2-mini').length,
      toast: document.querySelectorAll('.sl2-toast').length,
      tiles: document.querySelectorAll('.sl2__tile').length,
      pill: document.querySelectorAll('.sl2__pill').length,
      conns: document.querySelectorAll('.sl2__conn').length,
      imgs: document.querySelectorAll('.sl2 img').length,
    },
    brokenImgs: [...document.querySelectorAll('.sl2 img')]
      .filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
    docScrollW: document.documentElement.scrollWidth,
  };
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl'],
});

// Lift the rendered markup out of the scratch harness once.
const p0 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await p0.goto('http://localhost:5201/slide2.html', { waitUntil: 'networkidle' });
const markup = await p0.evaluate(() => document.querySelector('.sl2').outerHTML);
if (!markup) throw new Error('no .sl2 rendered in the harness');
await p0.close();

const rows = [];
for (const width of WIDTHS) {
  // A) the scratch harness, which reproduces .hero > .container--wide > .hero__stage > .hero__slide
  const ph = await browser.newPage({ viewport: { width, height: 1080 } });
  await ph.goto('http://localhost:5201/slide2.html', { waitUntil: 'networkidle' });
  await ph.waitForTimeout(400);
  const harness = await ph.evaluate(MEASURE);
  await ph.close();

  // B) the REAL app on slide 2, component injected with no source edits
  const page = await browser.newPage({ viewport: { width, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('http://localhost:5201/?slide=2', { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero__slide.is-active');
  await page.waitForTimeout(2500);
  await page.evaluate(({ markup, CSS }) => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    document.querySelector('.hero__slide.is-active .hero__visual').innerHTML = markup;
    document.querySelector('.hero')?.removeAttribute('data-motion');
  }, { markup, CSS });
  await page.waitForTimeout(700);
  const real = await page.evaluate(MEASURE);
  await page.screenshot({ path: `${OUT}/slide2-real-${width}.png`, clip: { x: 0, y: 0, width, height: 1000 } });
  await page.close();

  rows.push({ width, real, harness, agree: +(real.paintedRight - harness.paintedRight).toFixed(2), pageErrors: errs });
}
console.log(JSON.stringify(rows, null, 2));
await browser.close();
