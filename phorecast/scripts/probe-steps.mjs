import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(600);
const r = await p.evaluate(() => {
  const panel = document.querySelector('.panel');
  const pr = panel.getBoundingClientRect();
  const kids = [...panel.querySelectorAll(':scope > *, .s1 > *')].slice(0, 12).map(e => {
    const b = e.getBoundingClientRect();
    return `${e.className}  ${Math.round(b.left-pr.left)},${Math.round(b.top-pr.top)} ${Math.round(b.width)}x${Math.round(b.height)} vis=${getComputedStyle(e).visibility} op=${getComputedStyle(e).opacity}`;
  });
  return { panel: `${Math.round(pr.width)}x${Math.round(pr.height)} cls=${panel.className}`, p: getComputedStyle(panel).getPropertyValue('--p'), kids };
});
console.log(r.panel, '\n--p =', r.p, '\n' + r.kids.join('\n'));
await b.close();
