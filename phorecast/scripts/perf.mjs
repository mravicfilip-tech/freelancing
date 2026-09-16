// What the page actually costs to load: every response by size, the totals per
// type, and the timing milestones.
//
//   node scripts/perf.mjs [url]     (default: the production preview on 4173)
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://localhost:4173';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const hits = [];
page.on('response', async (r) => {
  try {
    const body = await r.body().catch(() => null);
    hits.push({
      url: r.url().replace(URL, '').split('?')[0],
      type: (r.headers()['content-type'] || '').split(';')[0],
      bytes: body ? body.length : 0,
    });
  } catch { /* redirects and aborted requests have no body */ }
});

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(4000);

const total = hits.reduce((n, h) => n + h.bytes, 0);
const byType = {};
for (const h of hits) {
  const group = h.type.startsWith('font') ? 'font'
    : h.type.startsWith('image') ? 'image'
    : h.type.includes('javascript') ? 'js'
    : h.type.includes('css') ? 'css' : 'other';
  byType[group] = (byType[group] ?? 0) + h.bytes;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log('requests :', hits.length);
console.log('total    :', kb(total));
console.log('by type  :', Object.entries(byType).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `${k} ${kb(v)}`).join('  '));

console.log('\nlargest responses:');
hits.sort((a, b) => b.bytes - a.bytes).slice(0, 12)
  .forEach((h) => console.log(`  ${kb(h.bytes).padStart(8)}  ${h.url.slice(0, 74)}`));

const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0];
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));
  return {
    domContentLoaded: Math.round(n.domContentLoadedEventEnd),
    load: Math.round(n.loadEventEnd),
    fcp: paints['first-contentful-paint'] ?? 0,
  };
});
console.log('\nfirst contentful paint :', nav.fcp, 'ms');
console.log('DOMContentLoaded       :', nav.domContentLoaded, 'ms');
console.log('load event             :', nav.load, 'ms');
await browser.close();
