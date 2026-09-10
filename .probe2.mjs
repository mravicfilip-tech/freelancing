import { launch, BASE } from '/home/user/freelancing/scripts/browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport:{width:1280,height:800} });
await p.route('**', r => { const u=r.request().url(); return u.startsWith(BASE)?r.continue():r.abort(); });
await p.goto(`${BASE}/?chest=1`, { waitUntil:'domcontentloaded', timeout:20000 }).catch(e=>console.log('err',e.message));
await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelectorAll('.fh__segments [role="tab"]')[2]?.click());
await p.waitForTimeout(3500);
console.log(JSON.stringify(await p.evaluate(()=>{
  const q = document.getElementById('?') || document.querySelector('[id="?"]');
  const cl = document.getElementById('crate-lines');
  return {
    nCrateLinesSvgs: document.querySelectorAll('#crate-lines').length,
    child: document.querySelectorAll('#crate-lines > path').length,
    desc: document.querySelectorAll('#crate-lines path').length,
    allPathsInChestSvg: cl ? cl.ownerSVGElement.querySelectorAll('path').length : -1,
    qParent: q ? q.parentElement.id || q.parentElement.getAttribute('class') : 'none',
    qDash: q ? [q.style.strokeDasharray, q.style.opacity] : null,
    lidPaths: document.querySelectorAll('.chest__lid path').length,
    lidPolys: document.querySelectorAll('.chest__lid polygon').length,
  };
}),null,1));
await b.close(); process.exit(0);
