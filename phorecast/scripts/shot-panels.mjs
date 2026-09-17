import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const i of [0, 1, 2]) {
  await page.locator('.steps__list .step').nth(i).click();
  await page.waitForTimeout(800);
  await page.locator('.panel').screenshot({ path: `/tmp/mine-panel${i + 1}.png` });
}
await browser.close();
console.log('panels');
