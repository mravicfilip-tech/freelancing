// Hand-verification aids: reduced-motion, no-WebGL, tablet and mobile-planet screenshots,
// plus a click-through check on the Join Presale button. Usage: npm run build && node scripts/verify.mjs
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
const results = [];
try {
  // 1. Reduced motion: static frame, no loop.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?devtools`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__heroPlanet);
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => window.__heroPlanet.isRunning);
    const calls = await page.evaluate(() => window.__heroPlanet.info().calls);
    await page.screenshot({ path: 'screenshots/verify-reduced-motion.png' });
    results.push({ check: 'reduced-motion: loop stopped', pass: running === false, detail: `isRunning=${running}, drawCalls=${calls}` });
    await ctx.close();
  }
  // 2. No WebGL: static PNG fallback in place.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).startsWith('webgl')) return null;
        return orig.call(this, type, ...rest);
      };
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.heroPlanet[data-mode="fallback"] img');
    const loaded = await page.evaluate(() => { const i = document.querySelector('.heroPlanet img'); return i.complete && i.naturalWidth > 0; });
    await page.screenshot({ path: 'screenshots/verify-no-webgl.png' });
    results.push({ check: 'no-webgl: fallback image shown', pass: loaded, detail: `img loaded=${loaded}` });
    await ctx.close();
  }
  // 3. Tablet + click-through + no layout shift (hero box before/after scene init).
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?devtools`, { waitUntil: 'domcontentloaded' });
    const before = await page.evaluate(() => JSON.stringify(document.querySelector('.hero').getBoundingClientRect()));
    await page.waitForFunction(() => !!window.__heroPlanet);
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => JSON.stringify(document.querySelector('.hero').getBoundingClientRect()));
    await page.screenshot({ path: 'screenshots/verify-tablet-1024x768.png' });
    results.push({ check: 'tablet: no layout shift from canvas', pass: before === after, detail: before === after ? 'hero box unchanged' : `${before} → ${after}` });
    const hit = await page.evaluate(() => {
      const b = document.querySelector('#join-presale').getBoundingClientRect();
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return el && el.closest('#join-presale') ? 'button' : el?.tagName;
    });
    results.push({ check: 'Join Presale receives the click', pass: hit === 'button', detail: `elementFromPoint → ${hit}` });
    await ctx.close();
  }
  // 4. Mobile: planet below the copy, scrolled into view.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?devtools`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__heroPlanet);
    await page.evaluate(() => document.querySelector('.heroPlanet').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2500);
    const pts = await page.evaluate(() => window.__heroPlanet.info().points);
    await page.screenshot({ path: 'screenshots/verify-mobile-planet.png' });
    results.push({ check: 'mobile: reduced point count', pass: pts <= 6000, detail: `points drawn=${pts}` });
    await ctx.close();
  }
  // 5. Scroll drift/fade: canvas opacity reaches 0 once the hero has scrolled out.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero').getBoundingClientRect().height + 200));
    await page.waitForTimeout(400);
    const opacity = await page.evaluate(() => document.querySelector('.heroPlanet canvas').style.opacity);
    results.push({ check: 'scroll: canvas faded out', pass: Number(opacity) === 0, detail: `opacity=${opacity}` });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.table(results);
if (results.some((r) => !r.pass)) process.exitCode = 1;
