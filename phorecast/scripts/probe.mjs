import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
const r = await page.evaluate(() => {
  const sec = document.querySelector('.fam');
  const s = sec.getBoundingClientRect();
  const out = {};
  for (const sel of ['.fam', '.fam__stage', '.fam__band', '.fam__horizon', '.fam__chips', '.fam__phone']) {
    const e = document.querySelector(sel); const b = e.getBoundingClientRect();
    out[sel] = { top: Math.round(b.top - s.top), left: Math.round(b.left - s.left), w: Math.round(b.width), h: Math.round(b.height) };
  }
  out.bandU = getComputedStyle(document.querySelector('.fam__band')).getPropertyValue('--u');
  out.horizonBlur = getComputedStyle(document.querySelector('.fam__horizon')).filter;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
