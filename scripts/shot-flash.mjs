import { startPreview, launch, BASE } from './browser.mjs';
const preview = await startPreview();
const browser = await launch();
for (const n of ['1', '2', '3', '4', '5']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(`${BASE}/dashboard?theme=dark&flash=${n}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('.side').screenshot({ path: `screenshots/flash-${n}.png` });
  await page.close();
}
await browser.close();
preview.kill();
console.log('wrote 5 flash shots');
