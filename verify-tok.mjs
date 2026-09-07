import { launch } from './scripts/browser.mjs';
import { readFileSync } from 'node:fs';
const FILE = '/tmp/claude-0/-home-user-freelancing/c3d35d9c-8650-5a5c-a646-d21ad22a7bbd/scratchpad/review/tokenomics.html';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1100 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.route('**/cdnjs.cloudflare.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: readFileSync('node_modules/gsap/dist/gsap.min.js') }));
await page.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await page.goto('file://' + FILE, { waitUntil: 'load' });
await page.waitForTimeout(900);
{
  await page.click('[data-v="0"]'); await page.waitForTimeout(4200);
  const t = await page.evaluate(() => [...document.querySelectorAll('[data-tok]')].map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}px op=${cs.opacity} tf=${cs.transform.slice(0, 22)}`; }));
  console.log('tokens:', t.join(' / '));
  const l = await page.evaluate(() => [...document.querySelectorAll('[data-lab]')].map((e) => { const r = e.getBoundingClientRect(); return `${e.textContent.trim().slice(0, 4)}@${Math.round(r.left)},${Math.round(r.top)}`; }));
  console.log('labels:', l.join(' '));
  const echo = await page.evaluate(() => { const r = document.querySelector('[data-echo]').getBoundingClientRect(); return `${Math.round(r.left + r.width / 2)},${Math.round(r.top + r.height / 2)}`; });
  console.log('echo centre (stage centre is 780,560 * k):', echo);
}
for (let v = 0; v < 3; v++) {
  await page.click(`[data-v="${v}"]`);
  await page.waitForTimeout(4200);
  const p = await page.$('.panel'); await p.screenshot({ path: `screenshots/review-tok-${v}.png` });
}
// the scroll demo: dark once the section fills the viewport, light again past it
const flow = await page.$('[data-flow]');
const bg = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-flow]')).backgroundColor + ' ' + document.querySelector('[data-flow]').classList.contains('is-dark'));
console.log('flow at top:', await bg());
await page.evaluate(() => { document.querySelector('[data-flow]').scrollTop = 560; }); await page.waitForTimeout(1200);
console.log('flow on section:', await bg());
await flow.screenshot({ path: 'screenshots/review-tok-flow.png' });
await page.evaluate(() => { const f = document.querySelector('[data-flow]'); f.scrollTop = f.scrollHeight; }); await page.waitForTimeout(1200);
console.log('flow at bottom:', await bg());
await browser.close();
