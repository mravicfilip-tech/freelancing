import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
const overflow = await page.evaluate(() => {
  const w = document.documentElement.clientWidth;
  return [...document.querySelectorAll('body *')]
    .filter(e => e.getBoundingClientRect().right > w + 1)
    .slice(0, 8)
    .map(e => `${e.className || e.tagName} -> ${Math.round(e.getBoundingClientRect().right)}`);
});
console.log('scrollW', await page.evaluate(() => document.documentElement.scrollWidth), 'overflowing:', overflow);
for (const [sel, name] of [['.hero', 'hero'], ['.bento', 'bento'], ['.steps', 'steps']]) {
  await page.locator(sel).screenshot({ path: `/tmp/m-${name}.png` });
}
await browser.close();
