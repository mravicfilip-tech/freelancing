// Scrolls a section into view and shoots its entrance, then its settled state.
//
//   node scripts/drive-entrance.mjs <selector> <tag> [width]
//
// The settled shot is the one that matters: it must be identical to the same
// capture taken before the motion was added, or the animation has moved the
// design rather than just timing it.
import { chromium } from 'playwright-core';

const [sel, tag, w = '1600'] = process.argv.slice(2);
if (!sel || !tag) {
  console.error('usage: drive-entrance.mjs <selector> <tag> [width]');
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: Number(w), height: 900 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message.slice(0, 160)}`));

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const sec = page.locator(sel);
// Scroll so the section is just below the fold, then bring it in, so the
// IntersectionObserver fires while we are watching rather than before.
await page.evaluate((s) => {
  const e = document.querySelector(s);
  window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.98);
}, sel);
await page.waitForTimeout(600);

await sec.scrollIntoViewIfNeeded();
for (const ms of [120, 260, 420, 700]) {
  await page.waitForTimeout(ms === 120 ? 120 : 140);
  await sec.screenshot({ path: `/tmp/${tag}-t${ms}.png` }).catch(() => {});
}

await page.waitForTimeout(2500);
await sec.screenshot({ path: `/tmp/${tag}-settled.png` });

console.log(`${tag}: wrote /tmp/${tag}-t{120,260,420,700}.png and /tmp/${tag}-settled.png`);
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
