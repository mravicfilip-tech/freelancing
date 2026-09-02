// Mounts and unmounts the hero 5× (emulating a route change) and reports renderer.info,
// GSAP bookkeeping and JS heap after each cycle. Usage: npm run build && npm run verify:leak
import { startPreview, launch, BASE } from './browser.mjs';

const server = await startPreview();
const browser = await launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/?devtools`, { waitUntil: 'networkidle' });
  const waitLive = () => page.waitForFunction(() => !!window.__heroPlanet, null, { timeout: 15000 });
  const heap = async () => {
    await page.evaluate(() => window.gc && window.gc());
    return page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1024));
  };
  const rows = [];
  await waitLive();
  await page.waitForTimeout(2500);
  const live = await page.evaluate(() => window.__heroPlanet.info());
  console.log('live scene:', live);
  for (let i = 1; i <= 5; i++) {
    await page.click('#dev-toggle-hero'); // unmount
    await page.waitForFunction(() => !window.__heroPlanet);
    const disposed = await page.evaluate(() => window.__heroPlanetDisposed);
    const heapUnmounted = await heap();
    await page.click('#dev-toggle-hero'); // mount
    await waitLive();
    await page.waitForTimeout(2200);
    const info = await page.evaluate(() => window.__heroPlanet.info());
    rows.push({ cycle: i, afterDispose_geometries: disposed.geometries, afterDispose_textures: disposed.textures, afterDispose_scrollTriggers: disposed.scrollTriggers, afterDispose_tweens: disposed.activeTweens, remounted_geometries: info.geometries, remounted_scrollTriggers: info.scrollTriggers, heapKB_unmounted: heapUnmounted });
  }
  console.table(rows);
  const bad = rows.filter((r) => r.afterDispose_geometries !== 0 || r.afterDispose_textures !== 0 || r.afterDispose_scrollTriggers !== 0 || r.afterDispose_tweens !== 0);
  if (bad.length) { console.error('LEAK: resources survived dispose'); process.exitCode = 1; }
  else console.log('OK: every dispose released all geometries, textures, ScrollTriggers and tweens');
} finally {
  await browser.close();
  server.kill();
}
