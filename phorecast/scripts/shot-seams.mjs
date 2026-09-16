// Captures the band either side of every section seam, so a hard glow edge is obvious.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);

const seams = await page.evaluate(() =>
  ['.bento', '.fam', '.pillars', '.fan', '.steps', '.built', '.faq', 'footer'].map((sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { sel, top: Math.round(r.top + window.scrollY) };
  }).filter(Boolean),
);

let i = 0;
for (const s of seams) {
  const y = Math.max(0, s.top - 170);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/seam-${String(++i).padStart(2, '0')}-${s.sel.replace(/\W/g, '')}.png`, clip: { x: 0, y: 0, width: 1600, height: 360 } });
}
console.log('seams captured:', seams.map((s) => s.sel).join(' '));
await browser.close();
