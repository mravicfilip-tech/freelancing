// Drives the REAL bento section with the shipped motion modules attached the
// way Bento.tsx will attach them, and proves the cards are alive at rest.
import { chromium } from 'playwright-core';

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--use-gl=swiftshader']});
const p = await b.newPage({viewport:{width:1600,height:1000}});
const errs=[];
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,200));});
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,200)));
p.on('response',r=>{if(r.status()>=400)errs.push(`HTTP ${r.status()} ${r.url().slice(0,100)}`);});

const shot = async (sel, path) => {
  const box = await p.evaluate((s) => {
    const e = document.querySelector(s); const r = e.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  }, sel);
  if (box.y < -box.height || box.y > 1000) return null;
  await p.screenshot({ path, clip: box });
  return box;
};

await p.goto('http://localhost:5173/', {waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1500);

// bring the bento into view and let whatever else the page does settle
await p.evaluate(()=>document.querySelector('.bcard--onboard').scrollIntoView({block:'center'}));
await p.waitForTimeout(2500);
await shot('.bcard--onboard', '/tmp/live-onboard-before.png');
await shot('.bcard--bonus', '/tmp/live-bonus-before.png');

const attached = await p.evaluate(async () => {
  const a = await import('/src/components/bento/motion/onboard.ts');
  const c = await import('/src/components/bento/motion/bonus.ts');
  window.__down = [a.onboard(document.querySelector('.bcard--onboard')),
                   c.bonus(document.querySelector('.bcard--bonus'))];
  return { onboard: typeof a.onboard, bonus: typeof c.bonus, down: window.__down.map(f=>typeof f) };
});
console.log('modules   :', JSON.stringify(attached));

// LOAD-IN: catch the assembly mid-flight
await p.waitForTimeout(260);
await shot('.bcard--onboard', '/tmp/live-onboard-loadin.png');
await shot('.bcard--bonus', '/tmp/live-bonus-loadin.png');
await p.waitForTimeout(450);
await shot('.bcard--onboard', '/tmp/live-onboard-loadin2.png');
await shot('.bcard--bonus', '/tmp/live-bonus-loadin2.png');

console.log('canvases  :', await p.evaluate(()=>document.querySelectorAll('.bcard--onboard canvas, .bcard--bonus canvas').length));

// LOOP: two captures 10s apart, pointer parked far away, no interaction at all
await p.mouse.move(10, 10);
await p.waitForTimeout(6000);
await shot('.bcard--onboard', '/tmp/live-onboard-t10.png');
await shot('.bcard--bonus', '/tmp/live-bonus-t10.png');
const a10 = await p.evaluate(()=>({sec:document.querySelector('.onboard__seconds').textContent,
  amt:document.querySelector('.bonus__amt strong').textContent,
  chip:document.querySelector('.onboard__chip').style.transform,
  node:document.querySelector('.bonus__marker').style.transform}));
await p.waitForTimeout(10000);
await shot('.bcard--onboard', '/tmp/live-onboard-t20.png');
await shot('.bcard--bonus', '/tmp/live-bonus-t20.png');
const a20 = await p.evaluate(()=>({sec:document.querySelector('.onboard__seconds').textContent,
  amt:document.querySelector('.bonus__amt strong').textContent,
  chip:document.querySelector('.onboard__chip').style.transform,
  node:document.querySelector('.bonus__marker').style.transform}));
console.log('@10s      :', JSON.stringify(a10));
console.log('@20s      :', JSON.stringify(a20));
console.log('differs   :', JSON.stringify(a10) !== JSON.stringify(a20));

// hover each card
for (const [sel, tag] of [['.bcard--onboard','onboard'],['.bcard--bonus','bonus']]) {
  const box = await p.evaluate((s)=>{const r=document.querySelector(s).getBoundingClientRect();
    return {x:r.left,y:r.top,w:r.width,h:r.height};}, sel);
  await p.mouse.move(box.x+20, box.y+box.h/2);
  await p.mouse.move(box.x+box.w*0.45, box.y+box.h*0.42, {steps:10});
  await p.waitForTimeout(380);
  await shot(sel, `/tmp/live-${tag}-hover.png`);
  await p.waitForTimeout(700);
  await shot(sel, `/tmp/live-${tag}-hover2.png`);
  await p.mouse.move(10,10); await p.waitForTimeout(1000);
}

// teardown must restore the shipped DOM exactly
await p.evaluate(()=>window.__down.forEach(f=>f()));
await p.waitForTimeout(700);
await shot('.bcard--onboard', '/tmp/live-onboard-after.png');
await shot('.bcard--bonus', '/tmp/live-bonus-after.png');
console.log('after down:', JSON.stringify(await p.evaluate(()=>({
  canvases: document.querySelectorAll('.bcard--onboard canvas, .bcard--bonus canvas').length,
  svgs: document.querySelectorAll('.bcard--onboard svg, .bcard--bonus svg').length,
  seconds: document.querySelector('.onboard__seconds').textContent,
  amounts: [...document.querySelectorAll('.bonus__amt strong')].map(e=>e.textContent),
  inline: [...document.querySelectorAll('.bcard--onboard .onboard__chip, .bcard--bonus .bonus__tile')].map(e=>e.getAttribute('style')),
}))));
console.log('errors    :', errs.length?errs:'none');
await b.close();
