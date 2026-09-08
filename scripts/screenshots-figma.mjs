// Screenshots the Figma hero branch at review sizes. Usage: npm run build && node scripts/screenshots-figma.mjs
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';
mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
try {
  for (const { w, h, mobile } of [{ w: 1600, h: 1100 }, { w: 1440, h: 1100 }, { w: 390, h: 844, mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const file = `screenshots/figma-hero-${w}x${h}.png`;
    await page.screenshot({ path: file, fullPage: !!mobile });
    console.log('wrote', file);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
