// Renders the hero 7 stills from the same scene the page draws, headless Chromium on SwiftShader, at 2x,
// saved as WebP in public/render/, the ground fading to the page's black at its edges. The tall stills are the phone's, one at the end
// of each of the five steps, hero7-tall-s1.webp to s5, crossfaded by scroll. The last of them, the restored
// route, is also the phone's poster for reduced motion and browsers without WebGL. The wide still,
// hero7-wide.webp, is the same last frame at the desktop framing, the poster for reduced motion and browsers
// without WebGL on a desktop and a tablet.
//
//   npx vite --port 5197 --strictPort &
//   node scripts/render-hero7.mjs [--url http://localhost:5197] [--only s1,s2,s3,s4,s5,wide] [--wait 12000] [--out dir]
//
// The scene is reached through ?v=1&hero=7&still=tall|wide&p=, which draws only the scene at the still's
// nominal size (STILL_SIZE in src/p1/variants/hero/Hero7.tsx) with the ground melting into the page at its
// edges. Software WebGL needs 9 to 15 seconds per frame, so the script waits for the scene's ready flag and
// then --wait more. Each still is held to 90KB for the phone's and 200KB for the wide one, the script steps
// the WebP quality down until it fits, encoding with Pillow (python3). The stills are opaque, an alpha edge
// came out noisy and banded, and the page behind them is black. STEP_P is the p of each still, the end of its step.
//
// Paths for the two tools can be set with PUPPETEER_CORE and CHROME_PATH.

import { mkdirSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5197');
const only = arg('only', 's1,s2,s3,s4,s5,wide').split(',');
const wait = Number(arg('wait', '12000'));
const out = arg('out', join(here, '..', 'public', 'render'));
// the end of each step, 0.15, 0.45, 0.6, 0.75 and 1, and the final frame again for the wide poster
const JOBS = {
  s1: { view: 'tall', p: 0.15, size: [600, 600], max: 90000 },
  s2: { view: 'tall', p: 0.45, size: [600, 600], max: 90000 },
  s3: { view: 'tall', p: 0.6, size: [600, 600], max: 90000 },
  s4: { view: 'tall', p: 0.75, size: [600, 600], max: 90000 },
  s5: { view: 'tall', p: 1, size: [600, 600], max: 90000 },
  wide: { view: 'wide', p: 1, size: [1376, 760], max: 200000 },
};
const QUALITY = [88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44].map((q) => [q, 0]);
const PY = 'import sys, io\nfrom PIL import Image\nim = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGB")\nb = io.BytesIO()\nim.save(b, "WEBP", quality=int(sys.argv[1]), method=6)\nsys.stdout.buffer.write(b.getvalue())';
const encode = (png, q, aq) => execFileSync('python3', ['-I', '-c', PY, String(q), String(aq)], { input: png, maxBuffer: 1 << 26 });

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
    await page.goto(`${base}/?v=1&hero=7&still=${j.view}&p=${j.p}${process.env.CAM ? `&cam=${process.env.CAM}` : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({
      content: 'html, body, .p1 { background: #000 !important } body * { visibility: hidden !important } .h7-still, .h7-still * { visibility: visible !important }',
    });
    await page.waitForFunction(() => document.documentElement.dataset.h7 === 'ready', { timeout: 300000, polling: 2000 });
    await new Promise((r) => setTimeout(r, wait));
    const file = join(out, `hero7-${j.view === 'wide' ? 'wide' : `tall-${name}`}.webp`);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
    let best;
    for (const [q, aq] of QUALITY) {
      best = encode(png, q, aq);
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
