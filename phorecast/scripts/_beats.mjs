import { chromium } from 'playwright-core';
const [page$, tag, v, ...times] = process.argv.slice(2);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--use-gl=swiftshader']});
const p = await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,160)));
p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});
await p.goto(`http://localhost:5173/lab/bento-${page$}.html`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1200);
const sec = p.locator(`[data-v="${v}"]`);
await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
const box = await sec.locator('.bcard').boundingBox();
await p.mouse.move(box.x-40, box.y+box.height/2);
await p.waitForTimeout(200);
const t0 = Date.now();
await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.55);
let prev = 0;
for (const t of times.map(Number)) {
  const wait = t - (Date.now()-t0);
  if (wait > 0) await p.waitForTimeout(wait);
  await sec.locator('.bcard').screenshot({path:`/tmp/beat-${tag}-v${v}-${t}.png`});
}
console.log('errors:', errs.length?errs:'none');
await b.close();
