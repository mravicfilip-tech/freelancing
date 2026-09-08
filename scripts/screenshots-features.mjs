// Screenshots the feature band (section.ff) at review sizes. Usage: npm run build && node scripts/screenshots-features.mjs
import { mkdirSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';
mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
try {
  for (const { w, h, mobile } of [{ w: 1600, h: 1900 }, { w: 390, h: 3600, mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    const page = await context.newPage();
    const broken = [];
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const section = page.locator('section.ff');
    await section.scrollIntoViewIfNeeded();
    // Every card builds on its own ScrollTrigger. The viewports above are tall enough to hold the
    // whole band, so one scroll fires all of them and the capture needs no stitching — on a short
    // phone viewport the last cards would still be waiting when the shot is taken.
    // The cards' build timelines run to about 3.5s (the receipt's toast lands last) and their
    // loops open a beat or so after that, so shoot in the window between: any earlier catches a
    // half-built scene, any later catches a wallet mid-connect.
    await page.waitForTimeout(4300);
    const imgs = await section.locator('img').evaluateAll((els) => els.map((e) => ({ src: e.getAttribute('src'), ok: e.complete && e.naturalWidth > 0, w: e.clientWidth, h: e.clientHeight })));
    for (const i of imgs) if (!i.ok) broken.push(i.src);
    console.log(w, JSON.stringify(imgs));
    if (broken.length) console.log(w, 'BROKEN IMAGES:', broken.join(', '));
    const file = `screenshots/figma-features-${w}.png`;
    await section.screenshot({ path: file });
    console.log('wrote', file);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
