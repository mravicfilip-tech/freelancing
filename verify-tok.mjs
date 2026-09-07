import { launch } from './scripts/browser.mjs';
import { readFileSync } from 'node:fs';
const FILE = '/tmp/claude-0/-home-user-freelancing/c3d35d9c-8650-5a5c-a646-d21ad22a7bbd/scratchpad/review/tokenomics.html';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1100 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.route('**/cdnjs.cloudflare.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: readFileSync('node_modules/gsap/dist/gsap.min.js') }));
await page.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await page.goto('file://' + FILE, { waitUntil: 'load' });
await page.waitForTimeout(600);
for (let v = 0; v < 5; v++) {
  await page.click(`[data-v="${v}"]`);
  await page.waitForTimeout(4200);
  const panel = await page.$('.panel');
  await panel.screenshot({ path: `screenshots/review-tok-${v}.png` });
  const info = await page.evaluate(() => {
    const st = document.querySelector('.stage'); const r = st.getBoundingClientRect();
    const over = [...st.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 2 || b.bottom > r.bottom + 2 || b.left < r.left - 2); }).map((e) => e.className && String(e.className).slice(0, 24)).slice(0, 5);
    return { overflow: over };
  });
  console.log('variant', v, JSON.stringify(info));
}
await browser.close();
