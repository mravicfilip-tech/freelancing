// Inspect mid-animation states by slowing GSAP's global timeline down.
import { chromium } from 'playwright-core';
const [page$, tag, v, scale, ...times] = process.argv.slice(2);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--use-gl=swiftshader']});
const p = await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,160)));
p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});
await p.goto(`http://localhost:5173/lab/bento-${page$}.html`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1200);
// gsap is module-scoped; reach it through a tween we know exists is hard, so
// re-import the same module instance from vite's cache.
await p.evaluate(async (s) => {
  const url = performance.getEntriesByType('resource').map(r => r.name).find(n => /deps\/gsap\.js/.test(n));
  if (!url) { window.__slow = 'gsap module not found'; return; }
  const m = await import(url);
  (m.gsap || m.default).globalTimeline.timeScale(Number(s));
  window.__slow = 'ok ' + s;
}, scale);
console.log('slow:', await p.evaluate(() => window.__slow));
const sec = p.locator(`[data-v="${v}"]`);
await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
const box = await sec.locator('.bcard').boundingBox();
await p.mouse.move(box.x-40, box.y+box.height/2); await p.waitForTimeout(200);
const t0 = Date.now();
await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.55);
for (const t of times.map(Number)) {
  const w = t - (Date.now()-t0); if (w>0) await p.waitForTimeout(w);
  await sec.locator('.bcard').screenshot({path:`/tmp/slow-${tag}-v${v}-${t}.png`});
}
console.log('errors:', errs.length?errs:'none');
await b.close();
