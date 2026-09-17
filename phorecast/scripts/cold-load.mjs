// Cold-load sampler. No warm-up, samples the headline's offset every frame, and
// reports the biggest single-frame jump — a large jump is the "nothing happens,
// then everything at once" symptom, which a settled-state check cannot see.
//
//   node scripts/cold-load.mjs [url]        WebGL off: measures the motion itself
//   WEBGL=1 node scripts/cold-load.mjs      WebGL on: measures what it costs
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', ...(process.env.WEBGL ? ['--use-gl=swiftshader'] : ['--disable-webgl', '--disable-webgl2'])] });
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1600, height: 900 } });
await page.addInitScript(() => {
  window.__s = [];
  const tick = () => {
    const s = document.querySelector('.hero__slide.is-active');
    const line = s && s.querySelector('.line__in');
    if (line) window.__s.push([Math.round(performance.now()), Math.round(parseFloat(getComputedStyle(line).transform.split(',')[5] || '0'))]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(6000);
const s = await page.evaluate(() => window.__s);
if (!s.length) { console.log('no samples'); await browser.close(); process.exit(0); }
let worst = 0, worstAt = 0;
for (let i = 1; i < s.length; i++) {
  const d = Math.abs(s[i][1] - s[i-1][1]);
  if (d > worst) { worst = d; worstAt = s[i][0]; }
}
const first = s.find((x) => x[1] !== s[0][1]);
console.log('frames sampled          :', s.length);
console.log('headline start offset   :', s[0][1], 'px');
console.log('first movement at       :', first ? first[0] + 'ms' : 'never moved');
console.log('largest single-frame jump:', worst, 'px at', worstAt + 'ms');
console.log('settled at              :', (s.find((x) => x[1] === 0) || [])[0] ?? 'not settled', 'ms');
await browser.close();
