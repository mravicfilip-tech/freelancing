import { launch, BASE } from '/home/user/freelancing/scripts/browser.mjs';
import { readFileSync } from 'node:fs';
const svg = readFileSync('/home/user/freelancing/src/components/FigmaHero/chest.svg','utf8');
const b = await launch();
const p = await b.newPage();
await p.setContent(`<html><body><div id="h"></div><script>document.getElementById('h').innerHTML=${JSON.stringify(svg)}<\/script></body></html>`);
console.log(await p.evaluate(()=>({
  descendant: document.querySelectorAll('#crate-lines path').length,
  child: document.querySelectorAll('#crate-lines > path').length,
  all: document.querySelectorAll('path').length,
  qParent: document.querySelector('svg')?.querySelectorAll('path')[224]?.parentElement?.id,
  qIds: Array.from(document.querySelectorAll('path')).slice(-2).map(e=>e.id+'@'+e.parentElement.id),
})));
await b.close(); process.exit(0);
