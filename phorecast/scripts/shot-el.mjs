// Usage: node scripts/shot-el.mjs <url> <selector> <out.png> [width]
import { chromium } from 'playwright-core';
const [url, sel, out, w = '1920'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: 1080 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.locator(sel).first().screenshot({ path: out });
await browser.close();
console.log('wrote', out);
