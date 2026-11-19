// The doubled line check, Filip 19 November, "you have duplicate lines do pass on whole website and remove those, make sure you never do
// those again". Finds two parallel lines drawn 0.5 to 8px apart where one line belongs, on every route given. A line is a visible element
// 3px thin or less, or a 1px border. Two lines pair up when they run the same way, sit 0.5 to 8px apart, overlap by 24px or more and
// neither holds the other. Lines on the very same pixels are one line. The body of a closed details panel is never drawn, so it is skipped.
// Every changed route at 1440, 390 and 360 must print clean before a push (taste 2026-11-19 13:20).
//   npx vite --port 4890, then from a folder where playwright resolves
//   NODE_PATH=/opt/node22/lib/node_modules node scripts/doubles.cjs http://localhost:4890 1440 900 najam=/najam servis=/servis
const { chromium } = require('playwright');

const [base, w, h, ...routes] = process.argv.slice(2);

const collect = () => {
  const out = [];
  const seen = (el) => {
    // the body of a closed details panel is laid out but never drawn
    const shut = el.closest('details:not([open])');
    if (shut && !el.closest('summary')) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
      if (e.hidden) return false;
    }
    return true;
  };
  const inked = (s) => s.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor);
  const sy = window.scrollY;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const s = getComputedStyle(el);
    const tag = (el.className && typeof el.className === 'string' ? el.className : el.tagName).slice(0, 60);
    // a thin element drawn as a line
    if (r.height <= 3 && r.width >= 24 && inked(s)) out.push({ dir: 'h', a: r.left, b: r.right, at: r.top + sy, tag, el });
    else if (r.width <= 3 && r.height >= 24 && inked(s)) out.push({ dir: 'v', a: r.top + sy, b: r.bottom + sy, at: r.left, tag, el });
    // borders
    const bw = (k) => parseFloat(s[k]) || 0;
    const solid = (k) => s[k] !== 'none' && s[k] !== 'hidden';
    if (r.width >= 24) {
      if (bw('borderTopWidth') >= 1 && solid('borderTopStyle')) out.push({ dir: 'h', a: r.left, b: r.right, at: r.top + sy, tag: tag + ' [border-top]', el });
      if (bw('borderBottomWidth') >= 1 && solid('borderBottomStyle')) out.push({ dir: 'h', a: r.left, b: r.right, at: r.bottom + sy - 1, tag: tag + ' [border-bottom]', el });
    }
    if (r.height >= 24) {
      if (bw('borderLeftWidth') >= 1 && solid('borderLeftStyle')) out.push({ dir: 'v', a: r.top + sy, b: r.bottom + sy, at: r.left, tag: tag + ' [border-left]', el });
      if (bw('borderRightWidth') >= 1 && solid('borderRightStyle')) out.push({ dir: 'v', a: r.top + sy, b: r.bottom + sy, at: r.right - 1, tag: tag + ' [border-right]', el });
    }
  }
  const lines = out.filter((l) => seen(l.el));
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const p = lines[i];
      const q = lines[j];
      if (p.dir !== q.dir) continue;
      const d = Math.abs(p.at - q.at);
      if (d < 0.5 || d > 8) continue;
      const overlap = Math.min(p.b, q.b) - Math.max(p.a, q.a);
      if (overlap < 24) continue;
      // a button's or a field's own box is not a page rule
      if (p.el.contains(q.el) || q.el.contains(p.el)) continue;
      pairs.push(`${p.dir} at ${Math.round(p.at)} and ${Math.round(q.at)}, ${Math.round(overlap)}px, ${p.tag} | ${q.tag}`);
    }
  }
  return pairs;
};

(async () => {
  const browser = await chromium.launch({ args: ['--disable-3d-apis', '--disable-webgl'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  for (const r of routes) {
    const [name, path] = r.split('=');
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 });
    await page.mouse.move(2, +h - 2);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(+h * 0.7)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const pairs = await page.evaluate(collect);
    // one line per distinct pair of classes, with how many times it happens
    const counts = new Map();
    for (const p of pairs) {
      const key = p.replace(/^(h|v) at \d+ and \d+, \d+px, /, '$1 ');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    console.log(`${name} @${w} ${pairs.length ? `${pairs.length} doubled` : 'clean'}`);
    for (const [k, n] of counts) console.log(`  ${n}x ${k}`);
  }
  await browser.close();
})();
