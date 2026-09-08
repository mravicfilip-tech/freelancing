// Screenshots the tokenomics band (section.tk) at review sizes.
// Usage: npm run build && node scripts/screenshots-tokenomics.mjs
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';
mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
try {
  // Tall enough to hold the whole band so its ScrollTrigger fires and the shot needs no stitching.
  for (const { w, h, mobile } of [{ w: 1600, h: 1400 }, { w: 390, h: 1900, mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const section = page.locator('section.tk');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    const broken = await section.locator('img').evaluateAll((els) => els.filter((e) => !(e.complete && e.naturalWidth > 0)).map((e) => e.getAttribute('src')));
    if (broken.length) console.log(w, 'BROKEN IMAGES:', broken.join(', '));
    const file = `screenshots/figma-tokenomics-${w}.png`;
    await section.screenshot({ path: file });
    console.log('wrote', file);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
