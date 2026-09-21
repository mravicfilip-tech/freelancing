// Millisecond timing of the entrances, at phone width.
//
//   node mA/timing.mjs <url> [label]
//
// Two questions, both in ms from the moment the section is in front of the
// reader:
//   (a) first content painted  -- the first of the section's own copy/tiles to
//                                 be both visible and above opacity 0.01. The
//                                 pending state is `visibility: hidden`, so
//                                 both have to be asked.
//   (b) entrance complete      -- data-motion-done, which useSectionMotion sets
//                                 from the timeline's onComplete.
//
// The hero's clock starts at navigation; it is above the fold, so arriving at
// it is loading the page. The control's clock starts on the frame its top
// crosses the viewport bottom, with the page descending at a steady ~420px/s.
//
// The WebGL mark is instrumented rather than screenshotted: getContext is
// wrapped before any app code runs, so the first real draw call is timestamped
// for a few microseconds instead of the seconds a software-GL screenshot costs.
import { chromium } from 'playwright-core';

// `nogl` blocks WebGL outright, so the mark takes its static fallback and never
// builds a scene. That isolates the entrance's own wall-clock cost from the
// main-thread block the scene build imposes on it -- under software GL that
// block is enormous and swamps every other number.
const [, , URL, LABEL = 'run', MODE = 'gl', WIDTH = '390', HEIGHT = '844'] = process.argv;
if (!URL) { console.error('usage: node mA/timing.mjs <url> [label]'); process.exit(2); }

const CONTROL = '.fan';
const VIEWPORT = { width: Number(WIDTH), height: Number(HEIGHT) };

const INIT = (noGL) => {
  const W = window;
  W.__mA = { marks: {} };
  const mark = (k) => { if (W.__mA.marks[k] === undefined) W.__mA.marks[k] = Math.round(performance.now()); };

  const wrap = (proto) => {
    if (!proto) return;
    for (const m of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const orig = proto[m];
      if (!orig) continue;
      proto[m] = function (...a) { mark('glFirstDraw'); return orig.apply(this, a); };
    }
  };
  wrap(W.WebGLRenderingContext && W.WebGLRenderingContext.prototype);
  wrap(W.WebGL2RenderingContext && W.WebGL2RenderingContext.prototype);
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (noGL && /webgl/.test(String(type))) return null;
    const ctx = getContext.call(this, type, ...rest);
    if (ctx && /webgl/.test(String(type)) && this.closest && this.closest('.heroLogo')) mark('glContext');
    return ctx;
  };

  // The hero raises this partway through its own timeline (entrance.ts), so it
  // is a fixed point: how long it takes in wall time says how much the timeline
  // is being stretched by whatever else is holding the main thread.
  addEventListener('DOMContentLoaded', () => {
    document.addEventListener('motion:ready', () => mark('heroReady'), { once: true });
    document.addEventListener('motion:done', () => mark('heroDone'), { once: true });
  });

  W.__mAParts = {
    // `.hero__lede` itself is not content: it is a box whose masked `.line__in`
    // children are the words, and it is un-hidden the instant the section is
    // revealed. Asking it rather than its lines reported the hero readable
    // 330ms before a single letter was on screen. Same for `.heroLogo`, whose
    // wrapper fades in over an empty canvas; the mark's real arrival is the
    // first GL draw, which is timestamped separately.
    '.hero': '.nav .logo, .eyebrow, .hero__slide.is-active .hero__title .line__in, .hero__slide.is-active .hero__lede .line__in, .hero__slide.is-active .hero__cta',
    '.fan': '.fan__title, .fan__sub, .fan__tile',
  };

  // html carries `scroll-behavior: smooth`, which turns a scripted scrollBy
  // into an animation that the next scrollBy retargets: the page crawls and the
  // measurement never reaches the section. The reader's own scroll is not
  // smoothed by this property, so turning it off here measures the real thing.
  W.__mAStraightScroll = () => { document.documentElement.style.scrollBehavior = 'auto'; };

  W.__mAEach = {
    '.hero': {
      nav: '.nav .logo',
      eyebrow: '.eyebrow',
      title: '.hero__slide.is-active .hero__title .line__in',
      lede: '.hero__slide.is-active .hero__lede .line__in',
      cta: '.hero__slide.is-active .hero__cta',
      card: '.hero__foot > *',
    },
    '.fan': { title: '.fan__title', sub: '.fan__sub', tile: '.fan__tile' },
  };

  W.__mAWatch = (selector, t0, budget) => new Promise((resolve) => {
    const out = { first: null, done: null, revealed: null, mounted: null, each: {} };
    const sel = W.__mAParts[selector];
    const vis = (e) => {
      const s = getComputedStyle(e);
      return s.visibility !== 'hidden' && Number(s.opacity) > 0.01 && e.getClientRects().length > 0;
    };
    const tick = () => {
      const t = Math.round(performance.now() - t0);
      const el = document.querySelector(selector);
      if (el) {
        if (out.mounted === null) out.mounted = t;
        if (out.revealed === null && el.dataset.motion === undefined) out.revealed = t;
        for (const [name, q] of Object.entries(W.__mAEach[selector] || {})) {
          if (out.each[name] === undefined) {
            const e = el.querySelector(q);
            if (e && vis(e)) out.each[name] = t;
          }
        }
        if (out.first === null) {
          const p = [...el.querySelectorAll(sel)];
          if (p.length && p.some(vis)) out.first = t;
        }
        if (out.done === null && el.dataset.motionDone === '1') out.done = t;
        if (out.first !== null && out.done !== null) { resolve(out); return; }
      }
      if (performance.now() - t0 > budget) { resolve(out); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({
  colorScheme: 'dark', viewport: VIEWPORT, deviceScaleFactor: 1,
  isMobile: VIEWPORT.width <= 720, hasTouch: VIEWPORT.width <= 720,
});
await page.addInitScript(INIT, MODE === 'nogl');

// ---- Hero: the clock starts at navigation.
await page.goto(URL, { waitUntil: 'commit' });
const hero = await page.evaluate(() => window.__mAWatch('.hero', 0, 12000));
await page.waitForFunction(
  () => window.__mA.marks.glFirstDraw !== undefined || window.__mA.marks.heroDone !== undefined,
  null, { timeout: 25000 },
).catch(() => {});
const heroExtra = await page.evaluate(() => {
  const paint = Object.fromEntries(performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)]));
  const res = performance.getEntriesByType('resource')
    .filter((r) => /LogoScene|three\.module|treatments-/.test(r.name))
    .map((r) => ({ n: r.name.split('/').pop().replace(/-[^-.]+\.js$/, '.js'), start: Math.round(r.startTime), end: Math.round(r.responseEnd) }));
  const logo = document.querySelector('.hero .heroLogo');
  return { paint, chunks: res, marks: window.__mA.marks, mode: logo && logo.dataset.mode,
    load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd) };
});

// ---- Control: the clock starts when its top crosses the viewport bottom.
const control = await page.evaluate(async ({ sel }) => {
  const el = document.querySelector(sel);
  if (!el) return { error: 'no ' + sel };
  window.__mAStraightScroll();
  const step = () => new Promise((r) => requestAnimationFrame(() => r()));
  // Jump to a screen and a half above it, then descend at a reader's rate.
  window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 1.5));
  await new Promise((r) => setTimeout(r, 400));
  while (el.getBoundingClientRect().top > innerHeight) {
    window.scrollBy(0, 7); await step();
    if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 1) break;
  }
  const t0 = performance.now();
  const watching = window.__mAWatch(sel, t0, 12000);
  let travelled = 0;
  while (travelled < innerHeight * 0.66) { window.scrollBy(0, 7); travelled += 7; await step(); }
  return watching;
}, { sel: CONTROL });

console.log(JSON.stringify({ label: LABEL, mode: MODE, viewport: VIEWPORT, url: URL, hero, heroExtra, control: { selector: CONTROL, ...control } }, null, 2));
await browser.close();
