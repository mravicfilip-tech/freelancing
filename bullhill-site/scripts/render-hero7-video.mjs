// Renders the phone hero video, public/render/hero7-phone.mp4, from the same scene the page draws, headless
// Chromium on SwiftShader at 2x. One page loads the tall still once and steps p frame by frame through
// window.__h7still, so the shaders compile once. Frame i is at i / fps seconds on the pace of
// src/p1/variants/hero/hero7/video-pace.json, through the page's own curve (window.__h7at), so the label the
// page writes from the video's time is the step the frame shows. Each frame is the strip of FLIP from acts.ts,
// the same framing and the same soft black top and bottom edge as the flipbook it replaces. H.264, no sound,
// fast start, so a phone starts playing on the first bytes, and a VP9 WebM for browsers without H.264. The
// first frame is also written as a WebP poster and the last as the still for reduced motion.
//
//   npx vite build --outDir /tmp/h7 && npx vite preview --outDir /tmp/h7 --port 5197 --strictPort &
//   node scripts/render-hero7-video.mjs [--url http://localhost:5197] [--from 0] [--to 300] [--frames dir]
//
// A run can stop and go on, frames already in --frames are kept, and --encode only encodes them.

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5197');
const frames = arg('frames', '/tmp/h7-frames');
const pace = JSON.parse(readFileSync(join(here, '..', 'src', 'p1', 'variants', 'hero', 'hero7', 'video-pace.json'), 'utf8'));
const N = Math.round(pace.keys[pace.keys.length - 1][0] * pace.fps) + 1;
const from = Number(arg('from', '0'));
const to = Math.min(N, Number(arg('to', String(N))));
const acts = readFileSync(join(here, '..', 'src', 'p1', 'variants', 'hero', 'hero7', 'acts.ts'), 'utf8');
const FLIP = JSON.parse(acts.match(/export const FLIP = (\{[^}]*\})/)[1].replace(/(\w+):/g, '"$1":'));
const FADE = 56;
const out = join(here, '..', 'public', 'render');
mkdirSync(frames, { recursive: true });

if (!process.argv.includes('--encode')) {
  const core = process.env.PUPPETEER_CORE || '/home/user/freelancing/studio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
  const chrome = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const { default: puppeteer } = await import(pathToFileURL(core).href);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    protocolTimeout: 600000,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log('page error', e.message.slice(0, 200)));
    await page.setViewport({ width: FLIP.w, height: FLIP.h, deviceScaleFactor: 2 });
    await page.goto(`${base}/?v=1&hero=7&still=tall&p=0&motion=on`, { waitUntil: 'load' });
    await page.addStyleTag({ content: 'html, body, .p1 { background: #000 !important } body * { visibility: hidden !important } .h7-still, .h7-still * { visibility: visible !important }' });
    await page.waitForFunction(() => document.documentElement.dataset.h7 === 'ready', { timeout: 300000, polling: 2000 });
    await new Promise((r) => setTimeout(r, 4000));
    const t0 = Date.now();
    for (let i = from; i < to; i++) {
      const file = join(frames, `${String(i).padStart(4, '0')}.png`);
      if (existsSync(file)) continue;
      const p = await page.evaluate((ms) => window.__h7at(ms), (i * 1000) / pace.fps);
      await page.evaluate((p) => window.__h7still(p), p);
      await page.waitForFunction((p) => document.documentElement.dataset.h7p === String(p), { timeout: 120000, polling: 50 }, p);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: FLIP.top, width: FLIP.w, height: FLIP.rows } });
      writeFileSync(file, png);
      if (i % 10 === 0) console.log(`frame ${i} of ${N}, p ${p.toFixed(3)}, ${Math.round((Date.now() - t0) / 1000)}s`);
    }
  } finally {
    await browser.close();
  }
}

const have = readdirSync(frames).filter((f) => f.endsWith('.png')).length;
if (have < N) {
  console.log(`${have} of ${N} frames, not encoding yet`);
  process.exit(0);
}
// the soft black edge at the top and the bottom of every frame, as the flipbook had, then H.264
const PY = [
  'import sys, glob, numpy as np',
  'from PIL import Image',
  'e = int(sys.argv[2])',
  'for f in sorted(glob.glob(sys.argv[1] + "/*.png")):',
  '    im = Image.open(f).convert("RGB")',
  '    a = np.asarray(im).astype(np.float32)',
  '    h = a.shape[0]',
  '    y = np.arange(h, dtype=np.float32)',
  '    r = np.minimum(np.clip(y / e, 0, 1), np.clip((h - 1 - y) / e, 0, 1))',
  '    r = r * r * (3 - 2 * r)',
  '    Image.fromarray((a * r[:, None, None]).round().astype(np.uint8)).save(f.replace(".png", ".edge.png"))',
].join('\n');
const edged = join(frames, 'edged');
mkdirSync(edged, { recursive: true });
execFileSync('python3', ['-I', '-c', PY.replace('.replace(".png", ".edge.png")', '.replace(sys.argv[1], sys.argv[3])'), frames, String(FADE * 2), edged], { stdio: 'inherit' });
const mp4 = join(out, 'hero7-phone.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(pace.fps), '-i', join(edged, '%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' });
// VP9 for the browsers without H.264, Chromium builds and some Linux Firefox, listed second in the page
const webm = join(out, 'hero7-phone.webm');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(pace.fps), '-i', join(edged, '%04d.png'), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', process.env.VP9_CRF || '38', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', webm], { stdio: 'inherit' });
execFileSync('python3', ['-I', '-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=82, method=6)', join(edged, '0000.png'), join(out, 'hero7-phone-poster.webp')]);
execFileSync('python3', ['-I', '-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=82, method=6)', join(edged, `${String(N - 1).padStart(4, '0')}.png`), join(out, 'hero7-phone-end.webp')]);
console.log(mp4, readFileSync(mp4).length, 'bytes,', webm, readFileSync(webm).length, 'bytes');
