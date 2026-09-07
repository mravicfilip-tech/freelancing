import { startPreview, launch, BASE } from './scripts/browser.mjs';
const proc = await startPreview();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(BASE + '/?figma=1', { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('.sn').scrollIntoView({ block: 'center' }));
await page.mouse.move(2, 2);
await page.waitForTimeout(4000);
const chain = await page.evaluate(() => {
  const m = document.querySelectorAll('.sn__mark')[1];
  const out = [];
  let e = m;
  while (e && e !== document.body) { const cs = getComputedStyle(e); out.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} op=${cs.opacity} filter=${cs.filter} inline=${e.getAttribute('style') || '-'}`); e = e.parentElement; }
  const img = m.querySelector('img'); const ics = getComputedStyle(img);
  out.push(`img op=${ics.opacity} filter=${ics.filter} mix=${ics.mixBlendMode} inline=${img.getAttribute('style') || '-'}`);
  return out;
});
console.log(chain.join('\n'));
// pixel: darkest pixel inside the privy mark vs expectation (32% black over #e6e9ed = 156,158,161)
const box = await page.evaluate(() => { const r = document.querySelectorAll('.sn__mark')[1].getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
const buf = await page.screenshot({ clip: box });
const { PNG } = await import('pngjs').catch(() => ({ PNG: null }));
if (PNG) {
  const png = PNG.sync.read(buf); let min = 999, px = null;
  for (let i = 0; i < png.data.length; i += 4) { const s = png.data[i] + png.data[i+1] + png.data[i+2]; if (s < min) { min = s; px = [png.data[i], png.data[i+1], png.data[i+2]]; } }
  console.log('darkest pixel in the privy mark at rest:', px, '(expected ~156,158,161)');
}
// hover
const c = await page.$('.sn__cell:nth-child(2)'); await c.hover(); await page.waitForTimeout(600);
console.log('hover opacity:', await page.evaluate(() => getComputedStyle(document.querySelectorAll('.sn__mark')[1]).opacity));
await browser.close(); proc.kill();
