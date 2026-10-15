// Renders the hero 7 stills from the same scene the page draws, headless Chromium on SwiftShader, at 2x,
// saved as WebP in public/render/. The phone's flipbook is 28 tall frames, hero7-tall-f00.webp to f27, at the
// p of FRAME_P in src/p1/variants/hero/hero7/acts.ts, which this script reads from there. Each is a strip of
// the phone's whole screen at the reference size of FLIP in the same file, 390 by 844, in the lens the live
// scene uses (phoneLens in world.ts, the middle of the clear band at FLIP.cy). The strip kept is FLIP.rows
// tall from FLIP.top, 780 pixels wide at 2x, with black baked into its top and bottom edges over FADE px, so
// the page's scrims take it over with no edge. The set is held to about 1.5MB, so each frame to FRAME_BYTES.
// The last of them, the restored route, is also the phone's poster for reduced motion. The wide still,
// hero7-wide.webp, is the last frame at the desktop framing, the poster for reduced motion and browsers
// without WebGL on a desktop and a tablet.
//
//   npx vite preview --port 5197 --strictPort &
//   node scripts/render-hero7.mjs [--url http://localhost:5197] [--only f00,f05,wide] [--wait 12000] [--out dir]
//
// The scene is reached through ?v=1&hero=7&still=tall|wide&p=, which draws only the scene at the still's
// nominal size (STILL_SIZE in src/p1/variants/hero/Hero7.tsx). Software WebGL needs 9 to 15 seconds per
// frame, so the script waits for the scene's ready flag and then --wait more. Each still is held to its byte
// budget by stepping the WebP quality down until it fits, encoding with Pillow (python3). The stills are
// opaque, an alpha edge came out noisy and banded, and the page behind them is black.
//
// Paths for the two tools can be set with PUPPETEER_CORE and CHROME_PATH.

import { mkdirSync, readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5197');
const wait = Number(arg('wait', '12000'));
const out = arg('out', join(here, '..', 'public', 'render'));
const acts = readFileSync(join(here, '..', 'src', 'p1', 'variants', 'hero', 'hero7', 'acts.ts'), 'utf8');
const FRAME_P = JSON.parse(acts.match(/export const FRAME_P = (\[[^\]]*\])/)[1]);
const FLIP = JSON.parse(acts.match(/export const FLIP = (\{[^}]*\})/)[1].replace(/(\w+):/g, '"$1":'));
// the soft black edge baked into the strip, in CSS px, and the budget of one frame, for 28 frames about 1.5MB
const FADE = 56;
const FRAME_BYTES = Number(arg('bytes', '52000'));
const JOBS = { wide: { view: 'wide', p: 1, size: [1376, 760], max: 200000 } };
FRAME_P.forEach((p, i) => {
  JOBS[`f${String(i).padStart(2, '0')}`] = { view: 'tall', p, size: [FLIP.w, FLIP.h], clip: { x: 0, y: FLIP.top, width: FLIP.w, height: FLIP.rows }, max: FRAME_BYTES };
});
const only = arg('only', Object.keys(JOBS).join(',')).split(',');
const QUALITY = [90, 86, 82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42, 38, 34].map((q) => [q, 0]);
// argv 1 quality, 2 the edge to fade to black in pixels, 0 for none
const PY = [
  'import sys, io',
  'import numpy as np',
  'from PIL import Image',
  'im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGB")',
  'e = int(sys.argv[2])',
  'if e > 0:',
  '    a = np.asarray(im).astype(np.float32)',
  '    h = a.shape[0]',
  '    y = np.arange(h, dtype=np.float32)',
  '    r = np.minimum(np.clip(y / e, 0, 1), np.clip((h - 1 - y) / e, 0, 1))',
  '    r = r * r * (3 - 2 * r)',
  '    im = Image.fromarray((a * r[:, None, None]).round().astype(np.uint8))',
  'b = io.BytesIO()',
  'im.save(b, "WEBP", quality=int(sys.argv[1]), method=6)',
  'sys.stdout.buffer.write(b.getvalue())',
].join('\n');
const encode = (png, q, edge) => execFileSync('python3', ['-I', '-c', PY, String(q), String(edge)], { input: png, maxBuffer: 1 << 26 });

const core = process.env.PUPPETEER_CORE || '/home/user/freelancing/studio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const chrome =
  process.env.CHROME_PATH ||
  (() => {
    const root = '/opt/pw-browsers';
    const dir = existsSync(root) ? readdirSync(root).find((d) => /^chromium-\d+$/.test(d)) : null;
    return dir ? join(root, dir, 'chrome-linux', 'chrome') : undefined;
  })();

const { default: puppeteer } = await import(pathToFileURL(core).href);
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

try {
  for (const name of only) {
    const j = JOBS[name];
    if (!j) continue;
    const [w, h] = j.size;
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`[${name}] page error`, e.message.slice(0, 200)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(`${base}/?v=1&hero=7&still=${j.view}&p=${j.p}&motion=on${process.env.CAM ? `&cam=${process.env.CAM}` : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({
      content: 'html, body, .p1 { background: #000 !important } body * { visibility: hidden !important } .h7-still, .h7-still * { visibility: visible !important }',
    });
    await page.waitForFunction(() => document.documentElement.dataset.h7 === 'ready', { timeout: 300000, polling: 2000 });
    await new Promise((r) => setTimeout(r, wait));
    const file = join(out, `hero7-${j.view === 'wide' ? 'wide' : `tall-${name}`}.webp`);
    const png = await page.screenshot({ type: 'png', clip: j.clip ?? { x: 0, y: 0, width: w, height: h } });
    let best;
    const edge = j.clip ? FADE * 2 : 0;
    for (const [q] of QUALITY) {
      best = encode(png, q, edge);
      if (best.length <= j.max) {
        console.log(`${name} p ${j.p} q ${q} ${best.length} bytes ${file}`);
        break;
      }
    }
    if (best.length > j.max) console.log(`${name} over ${j.max} bytes at the lowest quality, ${best.length}`);
    writeFileSync(file, best);
    if (process.env.PNG) writeFileSync(join(process.env.PNG, `${name}.png`), png);
    await page.close();
  }
} finally {
  await browser.close();
}
