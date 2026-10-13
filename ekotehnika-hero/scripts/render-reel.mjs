// Renders the showcase reel (video/reel.html) frame by frame and encodes it, ported from filip-portfolio
// scripts/render-reel.mjs. Each frame is drawn on purpose with window.seek(t), so nothing drops however slow the machine.
//   node scripts/render-reel.mjs --f 169 --out video/out/reel-169.mp4
//   node scripts/render-reel.mjs --f 916 --stills 1.2,7.6,9.6 --out video/out/stills
// Needs the frames from scripts/reel-capture.mjs, playwright-core, the cloud Chromium and ffmpeg. The video is silent.
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const f = arg('f', '169') === '916' ? '916' : '169';
const W = f === '916' ? 1080 : 1920;
const H = f === '916' ? 1920 : 1080;
const fps = Number(arg('fps', 30));
const from = Number(arg('from', 0));
const to = arg('to');
const stills = arg('stills');
const out = resolve(arg('out', `video/out/reel-${f}.mp4`));
const port = Number(arg('port', 4971));

const req = createRequire(join(process.cwd(), 'package.json'));
let pw;
for (const p of [process.env.PLAYWRIGHT_CORE_PATH, 'playwright-core', '/opt/node-tools/node_modules/playwright-core']) {
  try {
    if (p) { pw = req(p); break; }
  } catch {}
}
if (!pw) throw new Error('playwright-core not found, set PLAYWRIGHT_CORE_PATH');

const frames = stills ? out : join(resolve('video/out'), `frames-${f}`);
if (!stills) rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const srv = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
let n = 0;
try {
  for (let i = 0; i < 160; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  const b = await pw.chromium.launch({
    executablePath: existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto(`${base}/video/reel.html?f=${f}`, { waitUntil: 'networkidle', timeout: 120000 });
  await p.evaluate(() => window.reelReady);
  const missing = await p.evaluate(() => window.reelMissing);
  if (stills) {
    if (missing.length) console.log('missing frames, shown blank', missing.join(' '));
    for (const t of stills.split(',').map(Number)) {
      await p.evaluate((t) => window.seek(t), t);
      await p.screenshot({ path: join(frames, `${f}-${t.toFixed(2)}.png`) });
      console.log('still', f, t);
    }
  } else {
    if (missing.length) throw new Error(`missing frames ${missing.join(' ')}, run scripts/reel-capture.mjs`);
    const dur = to ? Number(to) : await p.evaluate(() => window.DURATION);
    n = Math.round((dur - from) * fps);
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await p.evaluate((t) => window.seek(t), from + i / fps);
      await p.screenshot({ path: join(frames, `${String(i).padStart(5, '0')}.png`) });
      if (i % 30 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  await b.close();
} finally {
  srv.kill();
}
if (!stills) {
  mkdirSync(resolve(out, '..'), { recursive: true });
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', join(frames, '%05d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed');
  console.log('wrote', out, `${n} frames`);
}
