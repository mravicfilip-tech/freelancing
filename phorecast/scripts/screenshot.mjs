// Usage: node scripts/screenshot.mjs <url> <out.png> [width] [height] [fullPage]
import { chromium } from 'playwright-core';

const [url = 'http://localhost:5173', out = 'shot.png', w = '1920', h = '1080', full = 'false'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: Number(w), height: Number(h) } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: full === 'true' });
await browser.close();
console.log('wrote', out);
