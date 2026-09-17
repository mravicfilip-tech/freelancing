// Answers the only question that matters on a first load: did the entrance
// actually play, or did the content just appear?
//
// Samples the headline's mask offset every frame from a cold load and reports
// how many distinct intermediate positions it passed through. One or two means
// it snapped; a healthy reveal shows dozens.
//
//   node scripts/verify-load-in.mjs [url]
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-webgl', '--disable-webgl2'],
});
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1600, height: 900 } });

await page.addInitScript(() => {
  window.__f = [];
  const tick = () => {
    const line = document.querySelector('.hero__slide.is-active .line__in');
    const cta = document.querySelector('.hero__slide.is-active .hero__cta');
    if (line) {
      window.__f.push([
        Math.round(performance.now()),
        Math.round(parseFloat(getComputedStyle(line).transform.split(',')[5] || '0')),
        Number(cta ? getComputedStyle(cta).opacity : 1).toFixed(2),
      ]);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(6000);

const f = await page.evaluate(() => window.__f);
if (!f.length) {
  console.log('never saw the headline');
} else {
  const offsets = [...new Set(f.map((x) => x[1]))];
  const ctas = [...new Set(f.map((x) => x[2]))];
  const moving = f.filter((x) => x[1] !== 0);
  console.log('frames sampled            :', f.length);
  console.log('distinct headline offsets :', offsets.length, offsets.length < 4 ? '<- SNAPPED, no reveal' : '<- reveal played');
  console.log('distinct CTA opacities    :', ctas.length, ctas.length < 4 ? '<- SNAPPED' : '<- faded in');
  console.log('headline travelled from   :', moving.length ? moving[0][1] : 0, 'px over', moving.length, 'frames');
  console.log('first frame seen at       :', f[0][0], 'ms  offset', f[0][1]);
  console.log('\ntrajectory (ms, offset, cta):');
  const t0 = f[0][0];
  f.filter((x, i) => i < 2 || x[1] !== f[i - 1][1] || x[2] !== f[i - 1][2]).slice(0, 22)
    .forEach((x) => console.log(`  +${String(x[0] - t0).padStart(4)}ms  y=${String(x[1]).padStart(3)}  cta=${x[2]}`));
}
await browser.close();
