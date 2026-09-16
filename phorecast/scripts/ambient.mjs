// Proves a section is alive at rest: scrolls it into view, lets the load-in
// finish, then compares two captures taken seconds apart WITHOUT touching the
// page. Identical frames mean the loop is missing.
//
//   node scripts/ambient.mjs <selector> <tag> [gapSeconds] [width]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const [sel, tag, gap = '6', w = '1600'] = process.argv.slice(2);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const sec = page.locator(sel);
await sec.scrollIntoViewIfNeeded();
await page.waitForTimeout(4000); // let the load-in settle

await sec.screenshot({ path: `/tmp/${tag}-rest-a.png` });
await page.waitForTimeout(Number(gap) * 1000);
await sec.screenshot({ path: `/tmp/${tag}-rest-b.png` });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

// Per-card verdict, so one live card cannot mask three dead ones.
execFileSync('python3', ['-c', `
from PIL import Image, ImageChops
a = Image.open('/tmp/${tag}-rest-a.png').convert('RGB')
b = Image.open('/tmp/${tag}-rest-b.png').convert('RGB')
if a.size != b.size:
    print('size changed between captures'); raise SystemExit
d = ImageChops.difference(a, b)
bbox = d.getbbox()
if not bbox:
    print('DEAD: the two captures are identical - nothing is looping')
else:
    px = d.getdata()
    n = sum(1 for p in px if max(p) > 6)
    print(f'ALIVE: {n} px changed ({100*n/(a.size[0]*a.size[1]):.2f}%), moving region {bbox}')
`], { stdio: 'inherit' });
