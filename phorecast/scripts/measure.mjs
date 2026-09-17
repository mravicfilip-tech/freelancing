import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
const r = await page.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)].map(e => { const b = e.getBoundingClientRect(); return [s, Math.round(b.top), Math.round(b.bottom), Math.round(b.left), Math.round(b.width)]; });
  return [...q('.hero__stage'), ...q('.hero__slide'), ...q('.hero__copy'), ...q('.hero__lede'), ...q('.hero__position'), ...q('.hero__foot'), ...q('.mark3d')];
});
console.log(r.map(x => x.join('\t')).join('\n'));
await browser.close();
