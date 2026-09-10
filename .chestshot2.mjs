import { launch, BASE } from '/home/user/freelancing/scripts/browser.mjs';
const OUT='/home/user/freelancing/.chestout/';
const variant = process.argv[2];
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.route('**', r => { const u=r.request().url(); return u.startsWith(BASE)?r.continue():r.abort(); });
page.setDefaultTimeout(15000);
console.error('goto');
await page.goto(`${BASE}/?chest=${variant}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e=>console.error('goto err',e.message));
console.error('loaded');
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelectorAll('.fh__segments [role="tab"]')[2]?.click());
await page.waitForTimeout(4000);
console.error('clicked, chest?', await page.evaluate(()=>!!document.querySelector('.chest__lid')));
const info = await page.evaluate(() => {
  const lid = document.querySelector('.chest__lid');
  if (!lid) return {err:'no lid'};
  return { lidChildren: Array.from(lid.children).map(c=>c.tagName+'.'+(c.getAttribute('class')||c.id)),
           nLidPaths: lid.querySelectorAll('path').length,
           nGroupPaths: document.querySelectorAll('#crate-lines path').length,
           nHalf: document.querySelectorAll('.chest__half').length };
});
console.error(JSON.stringify(info,null,1));
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
  await page.screenshot({ path: OUT+`v${variant}-t${String(t).replace('.','_')}.png`, clip });
  console.error('shot', t);
}
await browser.close(); process.exit(0);
