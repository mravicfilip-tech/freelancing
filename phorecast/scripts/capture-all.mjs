import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const shot = async (path, sel) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  if (sel) await page.locator(sel).first().screenshot({ path });
  else await page.screenshot({ path });
};
for (const n of [1, 2, 3, 4]) {
  await page.goto(`http://localhost:5173/?slide=${n}`, { waitUntil: 'networkidle' });
  await shot(`/tmp/mine-hero${n}.png`);
}
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await shot('/tmp/mine-bento.png', '.bento');
await shot('/tmp/mine-fan.png', '.fan');
await shot('/tmp/mine-built.png', '.built');
await shot('/tmp/mine-faq.png', '.faq');
await shot('/tmp/mine-footer.png', '.footer');
for (const [i, name] of [[0, 'steps1'], [1, 'steps2'], [2, 'steps3']]) {
  await page.locator('.steps__list .step').nth(i).click();
  await page.waitForTimeout(700);
  await page.locator('.steps').screenshot({ path: `/tmp/mine-${name}.png` });
}
await browser.close();
console.log('captured');
