// Whole-page health check: section heights, anything left invisible, and every
// console error, page error and failed request.
//
//   node scripts/diagnose.mjs [url]     (default http://localhost:5173)
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--use-gl=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 180)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 180)); });
page.on('requestfailed', (r) => errs.push('FAILED ' + r.url().slice(0, 100)));
page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().slice(0, 100)); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(6000);

const r = await page.evaluate(() => {
  const secs = ['.hero','.bento','.fam','.pillars','.fan','.steps','.built','.faq','footer'];
  const heights = secs.map((s) => { const e = document.querySelector(s); return `${s.replace('.','')}=${e ? Math.round(e.getBoundingClientRect().height) : 'MISSING'}`; }).join(' ');
  // anything with text that is still invisible
  const hidden = [];
  for (const e of document.querySelectorAll('h1,h2,h3,p,a,span,li')) {
    const t = (e.textContent || '').trim();
    if (!t || e.children.length) continue;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (Number(cs.opacity) < 0.5) hidden.push(`${e.className || e.tagName}: "${t.slice(0, 28)}" op=${cs.opacity}`);
  }
  return { heights, hidden: hidden.slice(0, 8), scrollH: document.documentElement.scrollHeight };
});
console.log('page height :', r.scrollH);
console.log('sections    :', r.heights);
console.log('invisible   :', r.hidden.length ? r.hidden : 'none');
console.log('errors      :', errs.length ? [...new Set(errs)].slice(0, 6) : 'none');
await browser.close();
