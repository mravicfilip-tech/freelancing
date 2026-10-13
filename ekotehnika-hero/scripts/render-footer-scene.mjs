// Renders the footer still, public/footer/site.webp, from the street set (scripts/footer-scene). 1824 by 300 css px at 2x,
// on the footer's pale grey. Start the dev server first, `npm run dev` on http://localhost:5173, then run this from a
// scratch folder that has playwright-core (npm i playwright-core there), passing the app folder.
// node render-footer-scene.mjs <path to ekotehnika-hero> [base url]
// It prints the image size and where the ground line (the near kerb's foot) sits, in image px from the bottom.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const app = process.argv[2] || '.';
const base = process.argv[3] || 'http://localhost:5173';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1824, height: 300 }, deviceScaleFactor: 2 });
await p.goto(`${base}/scripts/footer-scene/index.html?at=render`);
await p.waitForFunction(() => window.glCanvas && window.footFromBottom !== undefined, null, { timeout: 120000 });
// the HDRI, the fonts and the X50 arrive on their own time, so let it draw for a while before reading the canvas
await p.waitForTimeout(15000);
const out = await p.evaluate(() => {
  const c = window.glCanvas;
  return { url: c.toDataURL('image/webp', 0.86), w: c.width, h: c.height, foot: window.footFromBottom };
});
const file = join(app, 'public/footer/site.webp');
const buf = Buffer.from(out.url.split(',')[1], 'base64');
writeFileSync(file, buf);
console.log(JSON.stringify({ file, width: out.w, height: out.h, kB: Math.round(buf.length / 1024), groundFromBottomPx: Math.round(out.foot * 2), groundFromBottomCss: +out.foot.toFixed(1) }));
await b.close();
