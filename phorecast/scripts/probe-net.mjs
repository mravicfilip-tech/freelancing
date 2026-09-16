// Lists failed requests and React warnings, then proves the hero mark fades with the carousel.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const failures = [];
page.on('response', (r) => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', (r) => failures.push(`FAILED ${r.url()} ${r.failure()?.errorText ?? ''}`));
const warnings = new Set();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') warnings.add(m.text().slice(0, 120)); });

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3000);

const logoState = () => page.evaluate(() => {
  const e = document.querySelector('.hero .heroLogo');
  const slide = [...document.querySelectorAll('.hero__slide')].findIndex((s) => s.classList.contains('is-active'));
  return { slide: slide + 1, mode: e?.dataset.mode, opacity: e ? getComputedStyle(e).opacity : 'n/a' };
});

console.log('slide 1 :', JSON.stringify(await logoState()));
// Nudge the carousel forward and confirm the mark fades rather than unmounting.
await page.evaluate(() => document.querySelectorAll('.position__seg')[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await page.waitForTimeout(900);
console.log('slide 2 :', JSON.stringify(await logoState()));
await page.evaluate(() => document.querySelectorAll('.position__seg')[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await page.waitForTimeout(900);
console.log('back to 1:', JSON.stringify(await logoState()));

console.log('\nfailed requests:', failures.length ? failures : 'none');
console.log('console warnings:', warnings.size ? [...warnings] : 'none');
await browser.close();
