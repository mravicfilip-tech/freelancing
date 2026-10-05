#!/usr/bin/env node
// Fast, deterministic screenshots and mechanical UI checks. visual-qa runs this and reads the
// report instead of driving a browser step by step.
//
//   node shoot.mjs --url <base url or folder> --routes "name=/path,name2=/path2" --out <dir>
//                  [--widths 1440] [--height 900] [--selector ".badge"] [--wait <ms>]
//                  Desktop first. Pass a phone width in --widths only when the client brief names it.
//                  [--compare <before dir>]
//
// Needs puppeteer-core or playwright-core, and a Chrome, Chromium or Edge. In a cloud session the
// client's own playwright-core and the browser at /opt/pw-browsers/chromium are found by
// themselves. Elsewhere run  npm i puppeteer-core  once in studio/, or set PUPPETEER_CORE_PATH to an
// installed copy. Set CHROME_PATH when the browser is somewhere unusual.
//
// Writes <out>/<name>_<width>.png, <out>/<name>_<width>_component.png when --selector is set,
// and <out>/report.json. Prints a short summary.
//
// Checks, computed from the browser's own styles, never from pixels
//   contrast   WCAG ratio of text colour against the resolved background colour
//   type       working text under the 14px floor (foundation/principles.md)
//   targets    interactive elements under 24 by 24 (WCAG 2.5.8), controls under 32px tall
//   focus      the first 15 Tab stops, each needs a visible outline or ring
//   overflow   horizontal scroll at each width
//   console    errors and uncaught exceptions
//   diff       with --compare, changed pixels and the changed area against the before shot

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// puppeteer-core, from PUPPETEER_CORE_PATH, then the kit's own node_modules, then the folder the
// command runs in. Then playwright-core from the same places, which client repos often carry for
// their own scripts. Returns an object with a puppeteer style launch, or null.
function loadPuppeteer() {
  const from = (name) => [
    () => createRequire(join(STUDIO, 'package.json'))(name),
    () => createRequire(join(process.cwd(), 'package.json'))(name),
  ];
  const tries = [];
  if (process.env.PUPPETEER_CORE_PATH) tries.push(() => createRequire(import.meta.url)(resolve(process.env.PUPPETEER_CORE_PATH)));
  tries.push(...from('puppeteer-core'));
  for (const t of tries) { try { return t(); } catch { /* try the next place */ } }
  for (const t of from('playwright-core')) { try { return playwrightAsPuppeteer(t()); } catch { /* try the next place */ } }
  return null;
}

// The few puppeteer calls this script makes, served by playwright-core.
function playwrightAsPuppeteer(pw) {
  const page = (p) => new Proxy(p, {
    get(t, k) {
      if (k === 'setViewport') return (v) => t.setViewportSize({ width: v.width, height: v.height });
      if (k === 'goto') return (u, o = {}) => t.goto(u, { ...o, waitUntil: o.waitUntil === 'networkidle0' ? 'networkidle' : o.waitUntil });
      const v = t[k];
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
  return {
    async launch(o) {
      const b = await pw.chromium.launch({ executablePath: o.executablePath, headless: true, args: o.args });
      return { newPage: async () => page(await b.newPage()), close: () => b.close() };
    },
  };
}

// A Chrome or Edge, from CHROME_PATH or PUPPETEER_EXECUTABLE_PATH, then the usual install folders.
function findBrowser() {
  const env = process.env;
  const given = env.CHROME_PATH || env.PUPPETEER_EXECUTABLE_PATH;
  if (given) return existsSync(given) ? given : null;
  const win = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean).flatMap((d) => [
    join(d, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(d, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]);
  const others = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    // Cloud sessions keep a Chromium here for Playwright.
    join(env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers', 'chromium'),
  ];
  return [...win, ...others].find((p) => existsSync(p)) || null;
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

// Runs inside the page. Returns every finding for the current width.
function inspect(selector) {
  const lum = ([r, g, b]) => {
    const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const parse = (s) => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
  const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
  const describe = (el) => {
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };

  function background(el) {
    const layers = [];
    let uncertain = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') uncertain = true;
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let bg = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return { bg, uncertain };
  }

  const scope = selector ? [...document.querySelectorAll(selector)] : [document.body];
  const pool = new Set();
  for (const root of scope) { pool.add(root); root.querySelectorAll('*').forEach((e) => pool.add(e)); }

  const contrast = [], type = [], seen = new Set();
  for (const el of pool) {
    const ownText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (!ownText || !visible(el)) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color); if (!fg) continue;
    const { bg, uncertain } = background(el);
    const fgFlat = over(fg, bg);
    const L1 = lum(fgFlat), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(s.fontSize), weight = Number(s.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const key = describe(el);
    if (seen.has(key)) continue;
    seen.add(key);
    if (ratio < need) contrast.push({ el: key, ratio: Math.round(ratio * 100) / 100, need, colour: s.color, background: `rgb(${bg.slice(0, 3).map(Math.round).join(', ')})`, uncertain });
    if (size < 14) type.push({ el: key, px: size });
  }

  const targets = [];
  const interactive = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[onclick],[tabindex]:not([tabindex="-1"])';
  const tscope = selector ? scope.flatMap((r) => [r, ...r.querySelectorAll('*')]).filter((e) => e.matches(interactive)) : [...document.querySelectorAll(interactive)];
  for (const el of tscope) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) targets.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height), rule: 'under 24 by 24' });
    else if (el.matches('button,input,select,textarea,[role=button]') && r.height < 32) targets.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height), rule: 'control under 32px tall' });
  }

  return {
    contrast: contrast.slice(0, 30), type: type.slice(0, 30), targets: targets.slice(0, 30),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollHeight: document.documentElement.scrollHeight,
  };
}

// Runs inside a blank page. Compares two PNGs given as data URLs.
async function pixelDiff([a, b]) {
  const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
  const grab = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
  const da = grab(ia), db = grab(ib);
  let changed = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (Math.abs(da[i] - db[i]) > 16 || Math.abs(da[i + 1] - db[i + 1]) > 16 || Math.abs(da[i + 2] - db[i + 2]) > 16) {
      changed++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
  }
  return { sizeChanged: ia.width !== ib.width || ia.height !== ib.height, before: [ia.width, ia.height], after: [ib.width, ib.height], changedPct: Math.round((changed / (w * h)) * 10000) / 100, box: changed ? [x0, y0, x1, y1] : null };
}

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.url || !a.routes || !a.out) throw new Error('usage: shoot.mjs --url <base> --routes "name=/path,..." --out <dir> [--widths 1440] [--selector css] [--wait ms] [--compare dir]');
  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('Neither puppeteer-core nor playwright-core was found. Run  npm i puppeteer-core  in studio/, or set PUPPETEER_CORE_PATH to an installed copy.');
  const CHROME = findBrowser();
  if (!CHROME) throw new Error('No Chrome or Edge was found. Install one, or set CHROME_PATH to its executable.');
  const out = resolve(a.out);
  mkdirSync(out, { recursive: true });
  const widths = String(a.widths || '1440').split(',').map(Number);
  const height = Number(a.height || 900);
  const base = /^https?:|^file:/.test(a.url) ? a.url.replace(/\/$/, '') : pathToFileURL(resolve(a.url)).href.replace(/\/$/, '');
  // Split at the first "=" only, so a query string like ?tab=funds&as=admin survives.
  const routes = String(a.routes).split(',').map((r) => { const i = r.indexOf('='); const name = i < 0 ? r : r.slice(0, i); const path = i < 0 ? '' : r.slice(i + 1); return { name: name.trim(), path: (path || '/').trim() }; });

  const t0 = Date.now();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const report = { url: base, selector: a.selector || null, widths, routes: [], at: new Date().toISOString() };
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));

    for (const r of routes) {
      for (const w of widths) {
        errors.length = 0;
        await page.setViewport({ width: w, height, deviceScaleFactor: 1 });
        const url = base + (r.path.startsWith('/') ? r.path : '/' + r.path);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.evaluate(() => document.fonts && document.fonts.ready);
        // --wait <ms> lets skeletons and loaders finish before the capture.
        if (Number(a.wait) > 0) await new Promise((res) => setTimeout(res, Number(a.wait)));
        const found = await page.evaluate(inspect, a.selector || null);

        // Focus, first 15 Tab stops.
        const focus = [];
        await page.evaluate(() => document.activeElement && document.activeElement.blur());
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          const f = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const s = getComputedStyle(el);
            const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
            const t = (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40);
            return ring ? null : `${el.tagName.toLowerCase()} "${t}"`;
          });
          if (f && !focus.includes(f)) focus.push(f);
        }

        const file = join(out, `${r.name}_${w}.png`);
        await page.screenshot({ path: file, fullPage: true });
        let component = null;
        if (a.selector) {
          const el = await page.$(a.selector);
          if (el) { component = join(out, `${r.name}_${w}_component.png`); await el.screenshot({ path: component }).catch(() => { component = null; }); }
        }
        report.routes.push({ route: r.name, path: r.path, width: w, png: file, component, ...found, focus, console: [...errors] });
      }
    }

    if (a.compare) {
      const before = resolve(a.compare);
      const blank = await browser.newPage();
      for (const row of report.routes) {
        const prev = join(before, `${row.route}_${row.width}.png`);
        if (!existsSync(prev)) { row.diff = { missing: prev }; continue; }
        const du = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
        row.diff = await blank.evaluate(pixelDiff, [du(prev), du(row.png)]);
      }
    }
  } finally {
    await browser.close();
  }

  report.seconds = Math.round((Date.now() - t0) / 100) / 10;
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));

  // Short summary for the helper to read.
  console.log(`shoot ${report.routes.length} captures in ${report.seconds}s -> ${out}`);
  for (const row of report.routes) {
    const bits = [];
    if (row.contrast.length) bits.push(`${row.contrast.length} contrast (worst ${Math.min(...row.contrast.map((c) => c.ratio))}:1)`);
    if (row.type.length) bits.push(`${row.type.length} under 14px`);
    if (row.targets.length) bits.push(`${row.targets.length} small targets`);
    if (row.focus.length) bits.push(`${row.focus.length} no visible focus`);
    if (row.overflow) bits.push('horizontal overflow');
    if (row.console.length) bits.push(`${row.console.length} console errors`);
    if (row.diff && !row.diff.missing) bits.push(`diff ${row.diff.changedPct}%${row.diff.sizeChanged ? ' size changed' : ''}${row.diff.box ? ` in [${row.diff.box.join(',')}]` : ''}`);
    console.log(`  ${row.route} @${row.width}  ${bits.length ? bits.join(' · ') : 'clean'}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
