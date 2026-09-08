// Captures the whole site at the design's 393 phone frame and writes a single review page:
// every band in order, at 1x, inside a phone shell. Usage: npm run build && node scripts/mobile-showcase.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { startPreview, launch, BASE } from './browser.mjs';

const W = 393;
const OUT = process.env.SHOWCASE_OUT || 'screenshots/mobile-showcase.html';
const BANDS = [
  ['section.fh', 'Hero', 'Nav, headline, the corridors globe, presale figures and the live countdown.'],
  ['section.fs', 'Crypto-to-fiat', 'The orbit stood upright, hub centred, pay-outs and the currency groups around it.'],
  ['section.ff', 'Feature band', 'Five cards, each on the portrait composition the file draws for it.'],
  ['section.ec', 'Ecosystem', 'Payments, staking, storage and trading.'],
  ['section.rv', 'Reviews', 'The slide carousel.'],
  ['section.sn', 'As seen in', 'The logo lattice.'],
  ['section.tk', 'Tokenomics', 'The band stood up: six allocations around a 210 dial, chain marks on two wire trees.'],
  ['section.fq', 'FAQ', ''],
  ['footer.ft', 'Footer', 'The closing corridors field.'],
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

  for (const [sel, name, note] of BANDS) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) continue;
    await loc.scrollIntoViewIfNeeded();
    // Past the entrances (~3.5s) and before the loops open, so bands are shot settled.
    await page.waitForTimeout(4300);
    const buf = await loc.screenshot({ type: 'jpeg', quality: 74 });
    const box = await loc.boundingBox();
    shots.push({ name, note, h: Math.round(box.height), uri: `data:image/jpeg;base64,${buf.toString('base64')}` });
    console.log(`captured ${name} (${Math.round(box.height)}px, ${Math.round(buf.length / 1024)}KB)`);
  }

  // The menu open, since it is the one thing a static page of the site cannot show.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.locator('.fh__burger').click();
  await page.waitForTimeout(500);
  const menu = await page.locator('.fh__nav').screenshot({ type: 'jpeg', quality: 80 });
  shots.unshift({
    name: 'Menu',
    note: 'The panel the bar drops on a phone: the primary links, language and Login. Join Presale stays in the bar.',
    h: 460,
    uri: `data:image/jpeg;base64,${menu.toString('base64')}`,
  });
} finally {
  await browser.close();
  server.kill();
}

const cards = shots
  .map(
    (s) => `<figure class="band">
      <figcaption><h2>${s.name}</h2>${s.note ? `<p>${s.note}</p>` : ''}<span class="h">${s.h}px tall at ${W}</span></figcaption>
      <div class="phone"><img src="${s.uri}" alt="${s.name} at ${W}px" width="${W}"></div>
    </figure>`,
  )
  .join('\n');

writeFileSync(
  OUT,
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Remittix — mobile at ${W}</title>
<style>
:root{color-scheme:light;--ink:#122433;--muted:#6b7683;--line:#dfe3e8;--bg:#f4f6f8}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 'Onest Variable',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
header.top{padding:56px 24px 8px;max-width:1200px;margin:0 auto}
h1{margin:0 0 8px;font-size:34px;letter-spacing:-.8px}
header.top p{margin:0;max-width:64ch;color:var(--muted)}
main{display:flex;flex-wrap:wrap;gap:48px 40px;align-items:flex-start;padding:40px 24px 96px;max-width:1200px;margin:0 auto}
.band{margin:0;display:flex;flex-direction:column;gap:12px;width:${W}px}
figcaption h2{margin:0;font-size:17px;letter-spacing:-.2px}
figcaption p{margin:2px 0 0;color:var(--muted);font-size:13.5px}
.h{display:inline-block;margin-top:6px;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
.phone{border:1px solid var(--line);border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 12px 32px -18px rgba(18,36,51,.4)}
.phone img{display:block;width:100%;height:auto}
@media (prefers-color-scheme:dark){:root{--ink:#e9edf1;--muted:#98a3b0;--line:#2a323b;--bg:#14181c}.phone{background:#1b2026}}
</style>
<header class="top">
  <h1>Remittix on a phone — ${W} frame</h1>
  <p>Every band captured at the design's own 393 width, shot after its entrance has finished. Motion is live on the site itself; these are the settled states, in order.</p>
</header>
<main>${cards}</main>
`,
);
console.log('wrote', OUT);
