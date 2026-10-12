// Load budget for ?v=5 at 1920x1080. Bytes on first load (no scroll), bytes after a full scroll, and ms until the
// scene first draws the hero road. Software GL, so the ms are relative, compare only on the same container.
// Run against `npx vite preview --port 4173` after `npm run build`. playwright-core is not an app dependency, so copy this
// file into a scratch folder that has it (npm i playwright-core there) and run it from that folder.
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4173/?v=5';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
let bytes = 0; const big = [];
p.on('response', async (r) => { try { const buf = await r.body(); bytes += buf.length; if (buf.length > 150000) big.push([r.url().replace(/^https?:\/\/[^/]+/, ''), buf.length]); } catch {} });
const t0 = Date.now();
await p.goto(url, { waitUntil: 'domcontentloaded' });
// The scene canvas does not keep its drawing buffer, so it reads back blank. Poll a screenshot of a patch of the hero
// road instead, white page until the scene draws, grey road after.
let first = -1;
for (let i = 0; i < 300 && first < 0; i++) {
  const png = await p.screenshot({ clip: { x: 200, y: 560, width: 200, height: 40 }, type: 'png' }).catch(() => null);
  const ok = png && (await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let j = 0; j < d.length; j += 4) if (d[j] < 200 && d[j + 1] < 200 && d[j + 2] < 200) n++; return n > 400; }, png.toString('base64')));
  if (ok) first = Date.now() - t0; else await p.waitForTimeout(50);
}
await p.waitForTimeout(3000);
const loadBytes = bytes;
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(60); }
await p.waitForTimeout(3000);
console.log(JSON.stringify({ firstFrameMs: first, loadMB: +(loadBytes / 1e6).toFixed(2), fullScrollMB: +(bytes / 1e6).toFixed(2), big: big.sort((a, b) => b[1] - a[1]).slice(0, 14).map(([u, n]) => `${u} ${(n / 1e6).toFixed(2)}MB`) }, null, 1));
await b.close();
