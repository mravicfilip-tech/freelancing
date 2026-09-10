import { launch } from '/home/user/freelancing/scripts/browser.mjs';
import { readFileSync } from 'node:fs';
const raw = readFileSync('/home/user/freelancing/src/components/FigmaHero/chest.svg','utf8');
const svg = raw.replace('preserveAspectRatio="none"','preserveAspectRatio="xMidYMid meet"');
const b = await launch();
const p = await b.newPage();
await p.setContent('<html><body><div id="h"></div></body></html>');
const r = await p.evaluate((m)=>{
  const h=document.getElementById('h'); h.innerHTML=m;
  const cl=document.getElementById('crate-lines');
  return { childPaths: document.querySelectorAll('#crate-lines > path').length,
           qParent: document.querySelector('[id="?"]').parentElement.id,
           last: Array.from(cl.children).slice(-3).map(c=>c.id) };
}, svg);
console.log(JSON.stringify(r));
await b.close(); process.exit(0);
