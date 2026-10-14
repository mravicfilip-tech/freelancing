// Renders the hero 6 stills from the same scene the page draws, headless Chromium on SwiftShader,
// at 2x, saved as WebP with a transparent ground in public/render/. The wide still is the desktop
// poster and the fallback for reduced motion and browsers without WebGL, the mid one does the same
// for tablets and the tall still is the phone crop.
//
//   npx vite --port 5196 --strictPort &
//   node scripts/render-hero6.mjs [--url http://localhost:5196] [--views wide,mid,tall] [--wait 12000]
//   node scripts/render-hero6.mjs --seams [--views tall,mid]
//   node scripts/render-hero6.mjs --steps [--only 1,2,3,4,5]
//
// --seams renders, for each view (tall and mid unless --views says otherwise), the pair for beat 4
// on phones and tablets, hero6-<view>-schematic.webp at seam 1 and hero6-<view>-render.webp at
// seam 0. Same camera and size as the half and half still, so the pair registers to the pixel and
// StillSeam can clip one over the other. The three plain stills are not touched by this option.
//
// --steps renders the five phone stills of the tall view, hero6-tall-s1.webp to s5, one per step of the
// scroll (hero6/acts.ts), from the same scene with ?p= on the still route. Each is the half and half
// frame, schematic left and render right at the phone's seam 0.6, with the ground's points left out
// (dust=0), the phone page plays those in 2D. Each is held to 90KB, the script steps the WebP quality
// down until it fits, encoding with Pillow (python3) so the alpha channel has its own quality. STEP_P is the p of each still, the end of its step, 0.2, 0.35, 0.55 and 1. Step 4
// is shot at 0.64, with the pulse of light in the ducts and out of their ends, since at its end 0.7 the
// light has gone and the frame would repeat step 3.
//
// The scene is reached through ?v=1&hero=6&still=wide|mid|tall, which draws only the scene at the
// view's nominal size (VIEWS in src/p1/variants/hero/hero6/geometry.ts). Software WebGL needs 9 to
// 13 seconds per frame, so the script waits for the scene's ready flag and then --wait more.
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
const base = arg('url', 'http://localhost:5196');
const seams = process.argv.includes('--seams');
const steps = process.argv.includes('--steps');
const views = steps ? ['tall'] : arg('views', seams ? 'tall,mid' : 'wide,mid,tall').split(',');
// webp quality per view for the pair, the phone pair is held to about 100 to 150KB together
const Q = { tall: Number(arg('quality', '80')), mid: Number(arg('quality', '78')), wide: Number(arg('quality', '78')) };
const wait = Number(arg('wait', '12000'));
const STEP_P = [0.2, 0.35, 0.55, 0.64, 1];
const STEP_SEAM = 0.6; // the phone's seam, the middle of the block in the right of its box, SEAM0_TALL
const STEP_MAX = 90000;
const QUALITY = [[84, 90], [82, 80], [80, 70], [78, 60], [74, 50], [70, 40], [64, 30]];
const PY = 'import sys, io\nfrom PIL import Image\nim = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert(\"RGBA\")\nb = io.BytesIO()\nim.save(b, \"WEBP\", quality=int(sys.argv[1]), alpha_quality=int(sys.argv[2]), method=6)\nsys.stdout.buffer.write(b.getvalue())';
const encode = (png, q, aq) => execFileSync('python3', ['-I', '-c', PY, String(q), String(aq)], { input: png, maxBuffer: 1 << 26 });
const only = arg('only', '1,2,3,4,5').split(',').map(Number);
const out = join(here, '..', 'public', 'render');

const core = process.env.PUPPETEER_CORE || '/home/user/freelancing/studio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const chrome =
  process.env.CHROME_PATH ||
  (() => {
    const root = '/opt/pw-browsers';
    const dir = existsSync(root) ? readdirSync(root).find((d) => /^chromium-\d+$/.test(d)) : null;
    return dir ? join(root, dir, 'chrome-linux', 'chrome') : undefined;
  })();
const NOMINAL = { wide: [1376, 625], mid: [720, 480], tall: [600, 600] };

const { default: puppeteer } = await import(pathToFileURL(core).href);
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

try {
  const jobs = steps
    ? STEP_P.map((p, i) => ['tall', `s${i + 1}`, STEP_SEAM, p]).filter((j) => only.includes(Number(j[1].slice(1))))
    : views.flatMap((view) => (seams ? [[view, 'schematic', 1], [view, 'render', 0]] : [[view, '', 0.5]]));
  for (const [view, kind, seam, p] of jobs) {
    const tag = kind ? `${view}-${kind}` : view;
    const [w, h] = NOMINAL[view];
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`[${tag}] page error`, e.message.slice(0, 200)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(`${base}/?v=1&hero=6&still=${view}${kind ? `&seam=${seam}` : ''}${steps ? `&p=${p}&dust=0` : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({
      content: 'html, body, .p1 { background: transparent !important } body * { visibility: hidden !important } .h6-still, .h6-still * { visibility: visible !important }',
    });
    // the canvas keeps its drawing buffer, so a blank one has a short data URL. A pair half can be
    // sparse (hairlines only), so there the scene's own ready flag decides.
    if (kind) await page.waitForFunction(() => document.documentElement.dataset.h6 === 'ready', { timeout: 300000, polling: 2000 });
    else await page.waitForFunction(() => { const c = document.querySelector('.h6-still canvas'); return !!c && c.toDataURL().length > 30000; }, { timeout: 300000, polling: 2000 });
    await new Promise((r) => setTimeout(r, wait));
    const file = join(out, `hero6-${tag}.webp`);
    const clip = { x: 0, y: 0, width: w, height: h };
    if (steps) {
      // the schematic's dots live in the alpha channel, so the alpha quality comes down with the colour
      // quality, and Pillow does the encoding since the browser's screenshot has no alpha quality. The
      // first pair that fits wins.
      const png = await page.screenshot({ type: 'png', omitBackground: true, clip });
      let best;
      for (const [q, aq] of QUALITY) {
        best = encode(png, q, aq);
        if (best.length <= STEP_MAX) {
          console.log(`${tag} p ${p} q ${q} alpha ${aq} ${best.length} bytes ${file}`);
          break;
        }
      }
      if (best.length > STEP_MAX) console.log(`${tag} over ${STEP_MAX} bytes at the lowest quality, ${best.length}`);
      writeFileSync(file, best);
    } else {
      await page.screenshot({ path: file, type: 'webp', quality: kind ? Q[view] : 86, omitBackground: true, clip });
      console.log(`${tag} ${w * 2}x${h * 2} ${file}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
