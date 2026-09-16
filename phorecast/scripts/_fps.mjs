import { chromium } from 'playwright-core';
const [pg, ...vs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--use-gl=swiftshader']});
const p = await b.newPage({viewport:{width:1400,height:1000}});
await p.goto(`http://localhost:5173/lab/bento-${pg}.html`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1200);
for (const v of vs) {
  const sec = p.locator(`[data-v="${v}"]`);
  await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  const box = await sec.locator('.bcard').boundingBox();
  await p.mouse.move(box.x-40, box.y+box.height/2); await p.waitForTimeout(150);
  await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.5);
  await p.waitForTimeout(1400);   // let the entry tweens finish: steady state
  const fps = await p.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();
    const t=()=>{n++; if(performance.now()-t0<1000) requestAnimationFrame(t); else res(Math.round(n/((performance.now()-t0)/1000)));}; requestAnimationFrame(t);}));
  console.log(`v${v} hovered fps: ${fps}`);
  await p.mouse.move(box.x-60, box.y-60); await p.waitForTimeout(700);
}
await b.close();
