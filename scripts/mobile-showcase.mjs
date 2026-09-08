// Captures the whole site at the design's 393 phone frame and writes a single review page:
// every band in order, at 1x, inside a phone shell. Usage: npm run build && node scripts/mobile-showcase.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

const W = 393;
const OUT = process.env.SHOWCASE_OUT || 'screenshots/mobile-showcase.html';
const BANDS = [
  ['section.fh', 'Hero', 'Nav, headline, the corridors globe, presale figures and the live countdown.', '', 'loops'],
  ['section.fs', 'Crypto-to-fiat', 'The orbit stood upright, hub centred, pay-outs and the currency groups around it.', '2603:1541', 'loops'],
  ['section.ff', 'Feature band', 'Five cards, each on the portrait composition the file draws for it.', '2597:469 · 705 · 844 · 1042 · 1126', 'loops'],
  ['section.ec', 'Ecosystem', 'Payments, staking, storage and trading.', '', 'loops'],
  ['section.rv', 'Reviews', 'The slide carousel.', '', 'entrance'],
  ['section.sn', 'As seen in', 'The logo lattice.', '', 'entrance'],
  ['section.tk', 'Tokenomics', 'Six allocations around a 210 dial, chain marks on two wire trees.', '2639:1627', 'loops'],
  ['section.fq', 'FAQ', '', '', 'entrance'],
  ['footer.ft', 'Footer', 'The closing corridors field.', '', 'entrance'],
];

mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
const browser = await launch();
const shots = [];
try {
  // Tall viewport: every band's ScrollTrigger fires, and the captures need no stitching.
  const ctx = await browser.newContext({ viewport: { width: W, height: 3200 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 1600) {
    await page.evaluate((t) => scrollTo(0, t), y);
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1200);

  for (const [sel, name, note, node, motion] of BANDS) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) continue;
    await loc.scrollIntoViewIfNeeded();
    // Past the entrances (~3.5s) and before the loops open, so bands are shot settled.
    await page.waitForTimeout(4300);
    const buf = await loc.screenshot({ type: 'jpeg', quality: 74 });
    const box = await loc.boundingBox();
    shots.push({ name, note, node, motion, h: Math.round(box.height), uri: `data:image/jpeg;base64,${buf.toString('base64')}` });
    console.log(`captured ${name} (${Math.round(box.height)}px, ${Math.round(buf.length / 1024)}KB)`);
  }

  // The menu open, since it is the one thing a static page of the site cannot show.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.locator('.fh__burger').click();
  await page.waitForTimeout(500);
  // The panel is absolutely positioned out of the bar, so an element shot of the bar clips it away.
  // Clip the page to the union of the two instead — at scroll 0 the viewport is the page.
  const box = await page.evaluate(() => {
    const a = document.querySelector('.fh__nav').getBoundingClientRect();
    const b = document.querySelector('.fh__menu').getBoundingClientRect();
    const x = Math.min(a.left, b.left) - 8;
    const y = Math.min(a.top, b.top) - 8;
    return { x, y, width: Math.max(a.right, b.right) - x + 8, height: Math.max(a.bottom, b.bottom) - y + 8 };
  });
  const menu = await page.screenshot({ type: 'jpeg', quality: 80, clip: box });
  shots.unshift({
    name: 'Menu',
    note: 'What the bar drops on a phone: the primary links, language and Login. Join Presale stays in the bar, so the action is never behind a tap.',
    node: '',
    motion: 'new',
    h: Math.round(box.height),
    uri: `data:image/jpeg;base64,${menu.toString('base64')}`,
  });
} finally {
  await browser.close();
  server.kill();
}

const total = shots.reduce((n, s) => n + s.h, 0);
const badge = { loops: 'Loops', entrance: 'Entrance only', new: 'New' };

const cards = shots
  .map(
    (s) => `<figure class="band">
      <figcaption>
        <div class="band__top"><h2>${s.name}</h2><span class="tag tag--${s.motion}">${badge[s.motion]}</span></div>
        ${s.note ? `<p>${s.note}</p>` : ''}
        <dl class="meta">
          <div><dt>Height</dt><dd class="num">${s.h}</dd></div>
          ${s.node ? `<div><dt>Figma</dt><dd class="num">${s.node}</dd></div>` : ''}
        </dl>
      </figcaption>
      <div class="phone"><img src="${s.uri}" alt="${s.name} at ${W}px" width="${W}" loading="lazy"></div>
    </figure>`,
  )
  .join('\n');

writeFileSync(
  OUT,
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Remittix at ${W}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Doto:wght@600;700&display=swap">
<style>
/* The site's own palette, so the review reads in the language of the thing reviewed. */
:root{
  --ground:#edeff1; --panel:#fff; --ink:#122433; --body:#5b636b; --muted:#7c858d;
  --line:#dadee2; --indigo:#4042d1; --indigo-soft:#ececfb;
  --sans:'Onest',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --digits:'Doto','Courier New',ui-monospace,monospace;
  color-scheme:light;
}
:root:not([data-theme="light"]){@media (prefers-color-scheme:dark){
  --ground:#14181c; --panel:#1b2026; --ink:#eef2f6; --body:#aab4bf; --muted:#8d97a2;
  --line:#2b333c; --indigo:#9294f4; --indigo-soft:#232544; color-scheme:dark;
}}
:root[data-theme="dark"]{
  --ground:#14181c; --panel:#1b2026; --ink:#eef2f6; --body:#aab4bf; --muted:#8d97a2;
  --line:#2b333c; --indigo:#9294f4; --indigo-soft:#232544; color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
header.top{padding:64px 0 0}
h1{margin:0;font-size:clamp(30px,4.6vw,46px);font-weight:600;letter-spacing:-1.2px;text-wrap:balance}
.lede{margin:10px 0 0;max-width:62ch;color:var(--body)}
.facts{display:flex;flex-wrap:wrap;gap:0 40px;margin:28px 0 0;padding:18px 0 0;border-top:1px solid var(--line);list-style:none}
.facts li{display:flex;flex-direction:column;gap:2px}
.facts b{font-family:var(--digits);font-weight:700;font-size:22px;letter-spacing:.5px;font-variant-numeric:tabular-nums;color:var(--ink)}
.facts span{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(${W}px,1fr));gap:56px 40px;padding:44px 0 110px;align-items:start}
.band{margin:0;display:flex;flex-direction:column;gap:14px;min-width:0}
.band__top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
figcaption h2{margin:0;font-size:19px;font-weight:600;letter-spacing:-.3px}
figcaption p{margin:6px 0 0;color:var(--body);font-size:14px;max-width:52ch}
.tag{font-size:11px;letter-spacing:.07em;text-transform:uppercase;font-weight:700;color:var(--muted)}
.tag--loops{color:var(--indigo)}
.tag--new{color:var(--indigo);background:var(--indigo-soft);padding:2px 8px;border-radius:400px}
.meta{display:flex;gap:22px;margin:12px 0 0}
.meta div{display:flex;align-items:baseline;gap:7px}
.meta dt{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.meta dd{margin:0}
.num{font-family:var(--digits);font-weight:600;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;color:var(--ink)}
/* Only the captures get the lifted-object treatment — everything else stays flat. */
.phone{border:1px solid var(--line);border-radius:20px;overflow:hidden;background:var(--panel);box-shadow:0 18px 40px -26px rgba(18,36,51,.55)}
.phone img{display:block;width:100%;height:auto}
</style>
<div class="wrap">
  <header class="top">
    <h1>Remittix at ${W}</h1>
    <p class="lede">Every band at the design's own phone width, shot once its entrance has settled. Portrait layouts take over at 720; the site itself is where the motion lives, so these are the resting states, in the order you meet them.</p>
    <ul class="facts">
      <li><b>${W}</b><span>Frame</span></li>
      <li><b>${shots.length}</b><span>Bands</span></li>
      <li><b>720</b><span>Breakpoint</span></li>
      <li><b>64</b><span>Band padding</span></li>
      <li><b>${total.toLocaleString('en-US')}</b><span>Total px tall</span></li>
    </ul>
  </header>
  <main>${cards}</main>
</div>
`,
);
console.log('wrote', OUT);
