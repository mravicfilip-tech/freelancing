// Screenshots the hero at the three review sizes. Usage: npm run build && npm run screenshots
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

const SIZES = [
  { w: 1920, h: 1080 },
  { w: 1440, h: 900 },
  { w: 390, h: 844, mobile: true },
];
const EXTRA = (process.argv[2] || '').replace(/^\?/, '');

mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
try {
  for (const { w, h, mobile } of SIZES) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: !!mobile,
      hasTouch: !!mobile,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/${EXTRA ? '?' + EXTRA : ''}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.heroPlanet[data-mode]');
    await page.waitForTimeout(2600); // let the entrance finish
    const file = `screenshots/hero-${w}x${h}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log('wrote', file);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
