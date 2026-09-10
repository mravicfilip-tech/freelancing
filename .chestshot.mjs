import { launch, BASE } from '/home/user/freelancing/scripts/browser.mjs';
const OUT='/home/user/freelancing/.chestout/';
const variant = process.argv[2];
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
 await page.route('**', r => { const u=r.request().url(); return u.startsWith(BASE)?r.continue():r.abort(); });
await page.goto(`${BASE}/?chest=${variant}`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.querySelectorAll('.fh__segments [role="tab"]')[2]?.click());
await page.waitForTimeout(4000);
await page.evaluate(async () => {
  const url = performance.getEntriesByType('resource').map(e=>e.name).find(n=>/gsap-.*\.js$/.test(n));
  const mod = await import(url); const gsap = mod.gsap || Object.values(mod).find(v=>v&&v.getTweensOf);
  const t = document.querySelector('.chest__half') || document.querySelector('.chest__lid');
  window.__tl = gsap.getTweensOf(t)[0].parent; window.__tl.pause();
});
const el = await page.$('.chest');
const bb = await el.boundingBox();
const clip = { x: Math.round(bb.x), y: Math.max(0,Math.round(bb.y-40)), width: Math.round(bb.width), height: Math.round(bb.height+40) };
for (const t of process.argv.slice(3).map(Number)) {
  await page.evaluate((t)=>window.__tl.time(t,false), t);
  await page.waitForTimeout(80);
  await page.screenshot({ path: OUT+`vv${variant}-t${String(t).replace('.','_')}.png`, clip });
  console.error('shot', t);
}
await browser.close(); process.exit(0);
