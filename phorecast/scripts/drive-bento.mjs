// Drives a bento lab page: hovers each of the five cards, screenshots
// mid-animation, and reports console / network problems.
import { chromium } from 'playwright-core';

const page$ = process.argv[2] || '01-account';
const tag = process.argv[3] || page$;
const W = Number(process.argv[4] || 1400);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: W, height: 1000 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message.slice(0, 200)}`));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));

await page.goto(`http://localhost:5173/lab/bento-${page$}.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

console.log('gsap     :', await page.evaluate(() => typeof window.gsap));
console.log('sections :', await page.evaluate(() => document.querySelectorAll('.lab').length));

for (const n of ['1', '2', '3', '4', '5']) {
  const sec = page.locator(`[data-v="${n}"]`);
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const card = sec.locator('.bcard');
  const box = await card.boundingBox();
  // enter from the left, then move across so pointermove-driven variants engage
  await page.mouse.move(box.x + 10, box.y + box.height * 0.5);
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.42, { steps: 8 });
  await page.waitForTimeout(260);
  await sec.screenshot({ path: `/tmp/bento-${tag}-${n}-mid.png` });
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.6, { steps: 8 });
  await page.waitForTimeout(140);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(220);
  await sec.screenshot({ path: `/tmp/bento-${tag}-${n}-click.png` });
  await page.mouse.move(box.x - 60, box.y - 60, { steps: 4 });
  await page.waitForTimeout(600);
}

console.log('webgl    :', await page.evaluate(() => {
  const c = document.querySelector('[data-v="5"] canvas');
  if (!c) return 'canvas removed (css fallback)';
  return c.width > 0 ? `${c.width}x${c.height}` : 'not initialised';
}));
console.log('errors   :', errors.length ? errors : 'none');
await browser.close();
