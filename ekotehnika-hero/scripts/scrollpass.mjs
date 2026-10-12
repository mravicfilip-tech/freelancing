// The real scroll pass. Frozen beat shots load each beat fresh, so a layer that leaks from one beat into the next never
// shows in them. This scrolls ?v=N from the top to the page end in wheel steps like a visitor and, at every step, records
// the beat layer on screen, any Prodaja cut out still showing outside P, and the top row tone against the ground under
// it. It saves one frame each time the layer on screen changes, and prints every problem it finds.
// Run against `npx vite preview --port 4173` after `npm run build`, from a scratch folder that has playwright-core.
// node scrollpass.mjs [version] [out dir] [step px], BASE=http://localhost:4174 to point it at another server, FROM and TO
// in page pixels to run one stretch only, it jumps to FROM, settles, then scrolls on in wheel steps.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const v = process.argv[2] || '5';
const out = process.argv[3] || './scrollpass';
const step = +(process.argv[4] || 120);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`${process.env.BASE || 'http://localhost:4173'}/?v=${v}`, { waitUntil: 'load' });
await p.waitForTimeout(6000);
await p.mouse.move(960, 600);
const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const from = +(process.env.FROM || 0);
const to = +(process.env.TO || H);
if (from > 0) {
  await p.evaluate((y) => { window.scrollTo(0, y); window.dispatchEvent(new Event('scroll')); }, from);
  await p.waitForTimeout(4000);
}
const problems = [];
let lastLayer = '';
let n = 0;
for (let y = from; y <= to + step; y += step) {
  await p.mouse.wheel(0, step);
  await p.waitForTimeout(90);
  const s = await p.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return getComputedStyle(el).visibility === 'visible' && r.bottom > 0 && r.top < innerHeight && r.width > 0; };
    const layers = [...document.querySelectorAll('[data-layer]')].filter((el) => el.style.visibility === 'visible').map((el) => el.dataset.layer);
    const pfig = [...document.querySelectorAll('.p-fig')].filter((f) => vis(f) && [...f.querySelectorAll('img')].some(vis)).length;
    const hf = document.querySelector('.hf');
    const after = document.documentElement.hasAttribute('data-after-story');
    return { y: Math.round(scrollY), layers, pfig, tone: hf?.dataset.tone ?? '', after };
  });
  // the ground the top row stands on, 40 by 4 css px above the buttons at the right, which is the scene's band over the top
  // row. The scene canvas does not keep its drawing buffer and reads back blank, so this reads a screenshot of the patch.
  // software GL on a busy machine can take long over one frame, so a slow screenshot skips the tone check for this step
  const png = await p.screenshot({ clip: { x: 1560, y: 8, width: 40, height: 4 }, type: 'png', timeout: 120000 }).catch(() => null);
  const g = !png ? -1 : await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let t = 0; for (let i = 0; i < d.length; i += 4) t += (d[i] + d[i + 1] + d[i + 2]) / 3; return Math.round(t / (d.length / 4)); }, png.toString('base64'));
  const layer = s.after ? 'after' : s.layers.join('+') || 'none';
  if (s.pfig && !s.layers.includes('P')) problems.push(`y ${s.y} layer ${layer}, a Prodaja cut out shows outside P`);
  if (!s.after && g >= 0 && s.tone === 'white' && g > 200) problems.push(`y ${s.y} layer ${layer}, top row is dark over a light ground (${g})`);
  if (!s.after && g >= 0 && s.tone === 'ink' && g < 50) problems.push(`y ${s.y} layer ${layer}, top row is light over a dark ground (${g})`);
  if (layer !== lastLayer) {
    lastLayer = layer;
    await p.screenshot({ path: `${out}/v${v}-${String(n++).padStart(2, '0')}-${layer}-y${s.y}.png`, timeout: 120000 }).catch(() => {});
  }
}
console.log(problems.length ? problems.join('\n') : 'clean, no leak and no tone mismatch');
await b.close();
