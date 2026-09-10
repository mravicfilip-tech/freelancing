// Comparison sheets: the five rail treatments and the five header treatments.
import { startPreview, launch, BASE } from './browser.mjs';

const preview = await startPreview();
const browser = await launch();
const theme = process.env.THEME || 'dark';

for (const n of ['1', '2', '3', '4', '5']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${BASE}/dashboard?theme=${theme}&nav=${n}&head=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('.rail').screenshot({ path: `screenshots/var-nav-${n}.png` });
  await page.close();
}

for (const n of ['1', '2', '3', '4', '5']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${BASE}/dashboard?theme=${theme}&nav=1&head=${n}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/var-head-${n}.png`, clip: { x: 250, y: 0, width: 1190, height: 300 } });
  await page.close();
}

await browser.close();
preview.kill();
console.log('wrote 10 variant shots');
