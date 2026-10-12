// Load budget for ?v=5 at 1920x1080. Bytes on first load (no scroll), bytes after a full scroll, and ms until the
// canvas first shows non blank pixels. Software GL, so the ms are relative, compare only on the same container.
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
let first = -1;
for (let i = 0; i < 600 && first < 0; i++) {
  const ok = await p.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return false; const t = document.createElement('canvas'); t.width = 64; t.height = 36; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 36); const d = x.getImageData(0, 0, 64, 36).data; let n = 0; for (let j = 0; j < d.length; j += 4) if (d[j] < 200 || d[j + 1] < 200) n++; return n > 40; });
  if (ok) first = Date.now() - t0; else await p.waitForTimeout(100);
}
await p.waitForTimeout(3000);
const loadBytes = bytes;
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(60); }
await p.waitForTimeout(3000);
console.log(JSON.stringify({ firstFrameMs: first, loadMB: +(loadBytes / 1e6).toFixed(2), fullScrollMB: +(bytes / 1e6).toFixed(2), big: big.sort((a, b) => b[1] - a[1]).slice(0, 14).map(([u, n]) => `${u} ${(n / 1e6).toFixed(2)}MB`) }, null, 1));
await b.close();
