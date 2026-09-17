// Inspects the split-flap glyph boxes on direction 2 while a link is hovered.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:5173/motion-lab.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const link = page.locator('[data-v="2"] .lnk--nav').first();
await link.scrollIntoViewIfNeeded();

const dump = (label) => page.evaluate((l) => {
  const a = document.querySelector('[data-v="2"] .lnk--nav');
  const ch = a.querySelector('.ch');
  const box = (e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}`; };
  const cs = (e) => { const s = getComputedStyle(e); return `${s.transform} op=${s.opacity} col=${s.color} disp=${s.display}`; };
  return `${l}
  .ch      ${box(ch)}  overflow=${getComputedStyle(ch).overflow}
  .ch__a   ${box(ch.firstChild)}  ${cs(ch.firstChild)}
  .ch__b   ${box(ch.lastChild)}  ${cs(ch.lastChild)}`;
}, label);

console.log(await dump('rest:'));
await link.hover();
await page.waitForTimeout(700);
console.log(await dump('hover:'));
await browser.close();
