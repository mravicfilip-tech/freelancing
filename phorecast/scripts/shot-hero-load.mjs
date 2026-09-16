// Frame-by-frame record of the hero load-in, plus the two checks that matter:
// nothing is left invisible, and the settled hero still matches the design.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });

// Warm the dev server first: on a cold start Vite's module transform delays the
// React mount by seconds, which silently shifts every timing mark below.
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForSelector('.hero__slide.is-active');
await page.evaluate(() => document.fonts.ready);

// ?slide=2 pins a slide and pauses autoplay. Screenshotting a WebGL page costs
// seconds per frame under software GL, so without this the carousel advances
// mid-capture and the frames below are of different slides.
await page.goto('http://localhost:5173/?slide=2', { waitUntil: 'commit' });
const hero = page.locator('.hero');
await page.waitForSelector('.hero__glow', { state: 'attached' });
const marks = [500, 1200, 1800, 2100, 2500, 3000, 3600, 4400];
let prev = 0;
for (const t of marks) {
  await page.waitForTimeout(t - prev);
  prev = t;
  await hero.screenshot({ path: `/tmp/hero-${String(t).padStart(4, '0')}.png` }).catch(() => {});
}

// Every text node in the active slide must be fully opaque once it has settled.
const settled = await page.evaluate(() => {
  const s = document.querySelector('.hero__slide.is-active');
  const read = (sel) => [...s.querySelectorAll(sel)].map((e) => getComputedStyle(e).opacity).join(',') || '-';
  return {
    eyebrow: read('.eyebrow'),
    title: read('.hero__title'),
    lede: read('.hero__lede'),
    cta: read('.hero__cta'),
    ticker: [...document.querySelectorAll('.hero__foot > *')].map((e) => getComputedStyle(e).opacity).join(','),
  };
});
console.log('settled opacity:', JSON.stringify(settled));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
