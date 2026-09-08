// Screenshots each roadmap direction at desktop and mobile. Usage: npm run build && npm run roadmap:shots
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

const SIZES = [
  { w: 1440, h: 900 },
  { w: 390, h: 844, mobile: true },
];
const VARIANTS = ['1', '2', '3', '4', '5'];

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
    for (const v of VARIANTS) {
      await page.goto(`${BASE}/?planet=off&roadmap=${v}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: '.nav,.switcher{display:none!important}' });
      const section = await page.waitForSelector('#roadmap');
      await page.waitForTimeout(300);
      const file = `screenshots/roadmap-${v}-${w}x${h}.png`;
      await section.screenshot({ path: file });
      console.log('wrote', file);
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
