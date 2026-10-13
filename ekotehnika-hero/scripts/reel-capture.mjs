// Frames of the shipped site for the showcase reel, studio/clients/ekotehnika/briefs/reel/plan.md.
// Each shot loads ?v=5&at=<beat>&k=<0 to 1> fresh at 1920 by 1080, so the clock is frozen on that keyframe, waits for the
// scene and the reveals to settle, and saves a PNG to video/frames/<beat>-<k>.png. Shots after the story (Proizvodi, the
// closing, the footer) are reached by scrolling to their section, named as sec:<selector>@<offset px>.
// Run against `npx vite preview --port 4173` after `npm run build`.
//   node scripts/reel-capture.mjs H@0.4 P@0.17 P@0.39 sec:.sx@0
// WAIT=7000 sets the settle time per shot in ms, BASE points it at another server.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const req = createRequire(join(process.cwd(), 'package.json'));
let pw;
for (const p of [process.env.PLAYWRIGHT_CORE_PATH, 'playwright-core', '/opt/node-tools/node_modules/playwright-core']) {
  try {
    if (p) { pw = req(p); break; }
  } catch {}
}
if (!pw) throw new Error('playwright-core not found, set PLAYWRIGHT_CORE_PATH');

const base = process.env.BASE || 'http://localhost:4173';
const wait = +(process.env.WAIT || 7000);
const out = join(process.cwd(), 'video', 'frames');
mkdirSync(out, { recursive: true });

const shots = process.argv.slice(2);
const b = await pw.chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
for (const s of shots) {
  const name = s.replace(/[^a-zA-Z0-9.@-]/g, '_').replace('@', '-');
  const file = join(out, `${name}.png`);
  if (existsSync(file) && !process.env.FORCE) {
    console.log('kept', name);
    continue;
  }
  const t0 = Date.now();
  const p = await ctx.newPage();
  try {
  p.on('pageerror', (e) => console.log('PAGEERROR', s, e.message));
  if (s.startsWith('sec:')) {
    const [sel, off] = s.slice(4).split('@');
    await p.goto(`${base}/?v=5`, { waitUntil: 'load' });
    await p.waitForTimeout(4000);
    await p.evaluate(([sel, off]) => {
      const el = document.querySelector(sel);
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY + Number(off || 0));
      window.dispatchEvent(new Event('scroll'));
    }, [sel, off]);
  } else {
    const [beat, k] = s.split('@');
    await p.goto(`${base}/?v=5&at=${beat}&k=${k ?? 1}`, { waitUntil: 'load' });
  }
  // the version switcher is a review control, not part of the site
  await p.addStyleTag({ content: '.dir-switch{display:none!important}' });
  await p.mouse.move(1919, 1079);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: file, timeout: 120000 });
  console.log('shot', name, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log('FAILED', name, e.message.split('\n')[0]);
  }
  await p.close();
}
await b.close();
