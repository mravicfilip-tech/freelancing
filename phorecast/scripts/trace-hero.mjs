// Samples the hero's opening sequence without screenshotting it.
//
// Capturing frames of a WebGL page under software GL costs seconds each, which
// pushes every timing mark past the animation. Reading computed opacity is
// cheap, so the sequence can be measured honestly instead.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await page.goto('http://localhost:5173', { waitUntil: 'load' }); // warm the module graph
await page.waitForSelector('.hero__title');

await page.goto('http://localhost:5173/?slide=2', { waitUntil: 'commit' });
await page.waitForSelector('.hero__glow', { state: 'attached' });

const samples = await page.evaluate(() => new Promise((resolve) => {
  const out = [];
  const t0 = performance.now();
  const read = () => {
    const s = document.querySelector('.hero__slide.is-active');
    const op = (sel, root = s) => {
      const e = root && root.querySelector(sel);
      return e ? Number(getComputedStyle(e).opacity) : -1;
    };
    out.push({
      t: Math.round(performance.now() - t0),
      glow: op('.hero__glow', document),
      mark: op('.hero__logo', document),
      eyebrow: op('.eyebrow'),
      title: op('.hero__title'),
      lede: op('.hero__lede'),
      cta: op('.hero__cta'),
      visual: (() => {
        const v = s && s.querySelector('.hero__visual');
        if (!v) return -1;
        const kids = v.children.length > 1 ? [...v.children] : [...(v.firstElementChild?.children ?? [])];
        const list = kids.length > 1 ? kids : [v];
        return list.reduce((m, e) => Math.min(m, Number(getComputedStyle(e).opacity)), 1);
      })(),
    });
    if (performance.now() - t0 < 5200) setTimeout(read, 200);
    else resolve(out);
  };
  read();
}));

const bar = (v) => (v < 0 ? '  -  ' : '█'.repeat(Math.round(v * 5)).padEnd(5, '·'));
console.log('  time | glow  visual eyebrow title  lede   cta');
for (const s of samples) {
  if (s.t % 200 > 120) continue; // every ~400ms keeps the table readable
  console.log(
    `${String(s.t).padStart(5)} | ${bar(s.glow)} ${bar(s.visual)} ${bar(s.eyebrow)} ${bar(s.title)} ${bar(s.lede)} ${bar(s.cta)}`,
  );
}
const last = samples[samples.length - 1];
console.log('\nsettled:', JSON.stringify(last));
await browser.close();
