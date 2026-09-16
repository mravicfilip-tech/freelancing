// Loads the motion lab, reports console/network errors, hovers one control in
// every direction, and captures each panel mid-animation.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message.slice(0, 160)}`));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url().slice(0, 90)}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 90)}`); });

await page.goto('http://localhost:5173/motion-lab.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

console.log('modules ok:', await page.evaluate(() => !!document.querySelector('.lab')));
console.log('sections   :', await page.evaluate(() => document.querySelectorAll('.lab').length));
console.log('controls   :', await page.evaluate(() => document.querySelectorAll('.btn, .lnk, .soc').length));

for (const n of ['1', '2', '3', '4', '5']) {
  const sec = page.locator(`[data-v="${n}"]`);
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await sec.locator('.btn--primary').first().hover();
  await page.waitForTimeout(350);
  await sec.locator('.lnk--nav').first().hover();
  await page.waitForTimeout(250);
  // Directions animate different nodes (the button, its fill, an inner flipper),
  // so fingerprint the whole subtree rather than one element.
  const fp = (el) => el.evaluate((root) =>
    [root, ...root.querySelectorAll('*')].map((e) => {
      const s = getComputedStyle(e);
      return `${s.transform}|${s.opacity}|${s.backgroundColor}`;
    }).join(';'));
  const soc = sec.locator('.soc').first();
  const rest = await fp(soc);
  await soc.hover();
  await page.waitForTimeout(450);
  console.log(`  v${n} social: ${rest !== (await fp(soc)) ? 'ANIMATES' : 'NO CHANGE'}`);
  const b = sec.locator('.btn--secondary').first();
  const bRest = await fp(b);
  await b.hover();
  await page.waitForTimeout(400);
  console.log(`  v${n} button: ${bRest !== (await fp(b)) ? 'ANIMATES' : 'NO CHANGE'}`);
  const l = sec.locator('.lnk--nav').first();
  const lRest = await fp(l);
  await l.hover();
  await page.waitForTimeout(400);
  console.log(`  v${n} link  : ${lRest !== (await fp(l)) ? 'ANIMATES' : 'NO CHANGE'}`);
  await sec.screenshot({ path: `/tmp/lab-${n}.png` });
}

console.log('webgl canvas:', await page.evaluate(() => {
  const c = document.getElementById('field');
  return c && c.width > 0 ? `${c.width}x${c.height}` : 'not initialised';
}));
console.log('errors      :', errors.length ? errors : 'none');
await browser.close();
