import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--use-gl=swiftshader']});
const p = await b.newPage({viewport:{width:1400,height:1000}});
await p.goto('http://localhost:5173/lab/bento-01-account.html',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1500);
const meas = () => p.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();
  const t=()=>{n++; if(performance.now()-t0<1000) requestAnimationFrame(t); else res(Math.round(n/((performance.now()-t0)/1000)));}; requestAnimationFrame(t);}));
console.log('idle, nothing hovered:', await meas());
// force a repaint-heavy baseline: animate a plain box
await p.evaluate(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;left:0;top:0;width:40px;height:40px;background:#fff;z-index:99';document.body.append(d);
  let x=0; const t=()=>{x=(x+3)%300; d.style.transform=`translateX(${x}px)`; requestAnimationFrame(t);}; t();});
console.log('idle + moving box   :', await meas());
await b.close();
