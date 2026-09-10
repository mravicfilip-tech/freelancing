import { launch, BASE } from '/home/user/freelancing/scripts/browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport:{width:1280,height:800} });
await p.route('**', r => { const u=r.request().url(); return u.startsWith(BASE)?r.continue():r.abort(); });
await p.goto(`${BASE}/?chest=1`, { waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelectorAll('.fh__segments [role="tab"]')[2]?.click());
await p.waitForTimeout(3500);
console.log(JSON.stringify(await p.evaluate(()=>{
  const cl=document.getElementById('crate-lines');
  const par=cl.parentElement;
  return { parentId: par.id, parentChildren: Array.from(par.children).map(c=>c.tagName+'#'+c.id),
           crateLast5: Array.from(cl.children).slice(-5).map(c=>c.tagName+'#'+(c.id||c.getAttribute('class'))),
           svgChildren: Array.from(cl.ownerSVGElement.children).map(c=>c.tagName+'#'+c.id) };
}),null,1));
await b.close(); process.exit(0);
