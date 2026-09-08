// Screenshots each roadmap direction at desktop and mobile. Usage: npm run build && npm run roadmap:shots
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

const SIZES = [
  { w: 1440, h: 900 },
  { w: 390, h: 844, mobile: true },
];
const VARIANTS = (process.argv[2] || '1,2,3,4,5').split(',');

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
      await page.goto(`${BASE}/?hero=figma&planet=off&road=${v}`, { waitUntil: 'networkidle' });
      // The site's nav is fixed, so it would sit over a section shot.
      await page.addStyleTag({ content: '.fh__nav{display:none!important}' });
      const section = await page.waitForSelector('#roadmap');
      await section.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !document.querySelector('#roadmap')?.hasAttribute('data-motion'));
      await page.waitForTimeout(2200); // let the entrance finish
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
