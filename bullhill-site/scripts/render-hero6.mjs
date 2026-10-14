// Renders the hero 6 stills from the same scene the page draws, headless Chromium on SwiftShader,
// at 2x, saved as WebP with a transparent ground in public/render/. The wide still is the desktop
// poster and the fallback for reduced motion and browsers without WebGL, the mid one does the same
// for tablets and the tall still is the phone crop.
//
//   npx vite --port 5196 --strictPort &
//   node scripts/render-hero6.mjs [--url http://localhost:5196] [--views wide,mid,tall] [--wait 12000]
//   node scripts/render-hero6.mjs --seams [--views tall,mid]
//
// --seams renders, for each view (tall and mid unless --views says otherwise), the pair for beat 4
// on phones and tablets, hero6-<view>-schematic.webp at seam 1 and hero6-<view>-render.webp at
// seam 0. Same camera and size as the half and half still, so the pair registers to the pixel and
// StillSeam can clip one over the other. The three plain stills are not touched by this option.
//
// The scene is reached through ?v=1&hero=6&still=wide|mid|tall, which draws only the scene at the
// view's nominal size (VIEWS in src/p1/variants/hero/hero6/geometry.ts). Software WebGL needs 9 to
// 13 seconds per frame, so the script waits for the scene's ready flag and then --wait more.
//
// Paths for the two tools can be set with PUPPETEER_CORE and CHROME_PATH.

import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5196');
const seams = process.argv.includes('--seams');
const views = arg('views', seams ? 'tall,mid' : 'wide,mid,tall').split(',');
// webp quality per view for the pair, the phone pair is held to about 100 to 150KB together
const Q = { tall: Number(arg('quality', '80')), mid: Number(arg('quality', '78')), wide: Number(arg('quality', '78')) };
const wait = Number(arg('wait', '12000'));
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
  const jobs = views.flatMap((view) => (seams ? [[view, 'schematic', 1], [view, 'render', 0]] : [[view, '', 0.5]]));
  for (const [view, kind, seam] of jobs) {
    const tag = kind ? `${view}-${kind}` : view;
    const [w, h] = NOMINAL[view];
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`[${tag}] page error`, e.message.slice(0, 200)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(`${base}/?v=1&hero=6&still=${view}${kind ? `&seam=${seam}` : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({
      content: 'html, body, .p1 { background: transparent !important } body * { visibility: hidden !important } .h6-still, .h6-still * { visibility: visible !important }',
    });
    // the canvas keeps its drawing buffer, so a blank one has a short data URL. A pair half can be
    // sparse (hairlines only), so there the scene's own ready flag decides.
    if (kind) await page.waitForFunction(() => document.documentElement.dataset.h6 === 'ready', { timeout: 300000, polling: 2000 });
    else await page.waitForFunction(() => { const c = document.querySelector('.h6-still canvas'); return !!c && c.toDataURL().length > 30000; }, { timeout: 300000, polling: 2000 });
    await new Promise((r) => setTimeout(r, wait));
    const file = join(out, `hero6-${tag}.webp`);
    await page.screenshot({ path: file, type: 'webp', quality: kind ? Q[view] : 86, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(`${tag} ${w * 2}x${h * 2} ${file}`);
    await page.close();
  }
} finally {
  await browser.close();
}
