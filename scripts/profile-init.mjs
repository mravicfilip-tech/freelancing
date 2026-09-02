// Prints the duration of each scene-init phase (performance.measure entries) over N page loads.
import { startPreview, launch, BASE } from './browser.mjs';
const N = Number(process.argv[2] || 5);
const server = await startPreview();
const browser = await launch();
try {
  const rows = [];
  for (let i = 0; i < N; i++) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/?devtools`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__heroPlanet, null, { timeout: 20000 });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('measure').filter((e) => e.name.startsWith('planet:')).map((e) => [e.name.slice(7), Math.round(e.duration)])));
    rows.push(m);
    await page.close();
  }
  console.table(rows);
} finally {
  await browser.close();
  server.kill();
}
