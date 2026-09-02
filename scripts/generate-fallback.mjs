// Exports public/hero-planet-fallback.png — the static image used when WebGL is unavailable.
// Usage: npm run build && npm run fallback
import { startPreview, launch, BASE } from './browser.mjs';

const server = await startPreview();
const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1.5 });
  const page = await context.newPage();
  await page.goto(`${BASE}/?capture=planet`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.heroPlanet[data-mode="webgl"]');
  await page.waitForTimeout(600);
  const stage = await page.$('#capture-stage');
  await stage.screenshot({ path: 'public/hero-planet-fallback.png', omitBackground: true });
  console.log('wrote public/hero-planet-fallback.png');
} finally {
  await browser.close();
  server.kill();
}
