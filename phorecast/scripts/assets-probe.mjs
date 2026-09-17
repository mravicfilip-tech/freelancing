import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ colorScheme: 'dark', viewport: { width: 1920, height: 1080 } });
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const r = await p.evaluate(() => {
  const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null;
    const r = e.getBoundingClientRect();
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), nw: e.naturalWidth, nh: e.naturalHeight }; };
  return {
    'fam mkt icon (32)': pick('.fam__mkt--ecb .fam__mkt-icon'),
    'fam nvda icon (28x22.4)': pick('.fam__mkt-icon--nvda'),
    'fam pred avatar (24)': pick('.fam__pred-head img'),
    'fam chip logo (22x26)': pick('.fam__brand img'),
    'pillars card mark (31.1x36.3)': pick('.pcard__mark'),
    'pillars row chevron (17.9x9.75)': pick('.prow__chevron'),
    'pillars icon (20)': pick('.pcard__body .pillars__icon'),
    'fan tile logo (37x40)': pick('.fan__glass img'),
    'fan pill icon (16)': pick('.fan__pill img'),
    stretched: [...document.querySelectorAll('img')].filter(e => {
      const r = e.getBoundingClientRect();
      if (!e.naturalWidth || r.width < 4 || r.height < 4) return false;
      const ar = r.width / r.height, nar = e.naturalWidth / e.naturalHeight;
      return Math.abs(ar - nar) / nar > 0.12 && !e.closest('.fam__ghost,.fam__horizon,.hero__bg,.fan__lines,.steps__mark,.mk__orbit,.bonus__line,.s3__chart,.fam__event-avatar,.mini__avatar,.pred__avatar,.hv4__tile-bg,.fan__tile-bg');
    }).map(e => `${e.className || e.src.split('/').pop()}`).slice(0, 10),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
