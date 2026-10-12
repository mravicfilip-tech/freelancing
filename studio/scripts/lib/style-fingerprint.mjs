// Shared by scripts/kit.mjs and scripts/golden.mjs. Browser launch, the in-page style reader,
// and the pure comparison helpers. Desktop first, 1440 wide. No phone widths unless the client brief names them.
//
// The in-page reader is one self-contained function, because page.evaluate serialises it. It has
// three modes, element (one selector), controls (every control on the page) and page (the whole
// page). Everything after it runs in node and is pure, so the tests can call it directly.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Same puppeteer and Chrome as scripts/shoot.mjs.
// puppeteer-core, from PUPPETEER_CORE_PATH, then the kit's own node_modules, then the folder the
// command runs in. Returns the module or null.
function loadPuppeteer() {
  const tries = [];
  if (process.env.PUPPETEER_CORE_PATH) tries.push(() => createRequire(import.meta.url)(resolve(process.env.PUPPETEER_CORE_PATH)));
  tries.push(() => createRequire(join(STUDIO, 'package.json'))('puppeteer-core'));
  tries.push(() => createRequire(join(process.cwd(), 'package.json'))('puppeteer-core'));
  for (const t of tries) { try { return t(); } catch { /* try the next place */ } }
  return null;
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
export const WIDTH = 1440;
export const HEIGHT = 900;

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) { out._.push(argv[i]); continue; }
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

export function brandsDir() {
  return process.env.STUDIO_CLIENTS_DIR ? resolve(process.env.STUDIO_CLIENTS_DIR) : join(STUDIO, 'clients');
}

// A client folder must exist under the real clients folder. A temp folder set by the env var is
// free to hold any client, so tests do not need real brands.
export function clientDir(client, sub, { create = false } = {}) {
  if (!client || client === true) throw new Error('--client <id> is required');
  if (!/^[a-z0-9-]+$/.test(client)) throw new Error(`bad client id "${client}"`);
  const root = brandsDir();
  const base = join(root, client);
  if (!process.env.STUDIO_CLIENTS_DIR && !existsSync(base)) throw new Error(`no client folder for "${client}", make one with registry.mjs add`);
  const dir = join(base, sub);
  if (create) mkdirSync(dir, { recursive: true });
  return dir;
}

export function safeName(name) {
  if (!name || name === true || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) throw new Error('--name must be letters, digits, dash or underscore');
  return name;
}

export function toUrl(u) {
  return /^https?:|^file:/.test(u) ? u : pathToFileURL(resolve(u)).href;
}

// "a=/x,b=/y" into [{ name, path }]. Split at the first = only, so query strings survive.
export function parseRoutes(s) {
  return String(s).split(',').map((r) => {
    const i = r.indexOf('=');
    const name = i < 0 ? r : r.slice(0, i);
    const path = i < 0 ? '' : r.slice(i + 1);
    return { name: name.trim() || 'page', path: (path || '/').trim() };
  });
}

export function routeUrl(base, path) {
  const b = toUrl(base).replace(/\/$/, '');
  if (/^https?:|^file:/.test(path)) return path;
  return b + (path.startsWith('/') ? path : '/' + path);
}

export async function launch() {
  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-core was not found. Run  npm i puppeteer-core  in ~/.claude/studio, or set PUPPETEER_CORE_PATH to an installed copy.');
  const CHROME = findBrowser();
  if (!CHROME) throw new Error('No Chrome or Edge was found. Install one, or set CHROME_PATH to its executable.');
  return puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
}

export async function openPage(browser, url, wait = 0) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (Number(wait) > 0) await new Promise((r) => setTimeout(r, Number(wait)));
  return page;
}

export const read = (page, mode, arg = null) => page.evaluate(readStyles, mode, arg);

// ---------- runs inside the page, must stay self-contained ----------
export function readStyles(mode, arg) {
  const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
  const toHex = (c) => {
    const m = String(c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return String(c || '');
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const a = p[3] === undefined ? 1 : p[3];
    if (a === 0) return 'transparent';
    return '#' + hex2(p[0]) + hex2(p[1]) + hex2(p[2]) + (a < 1 ? hex2(a * 255) : '');
  };
  const colors = (s) => String(s || '').replace(/rgba?\([^)]*\)/g, (m) => toHex(m));
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  const family = (s) => String(s.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  const radius = (s) => {
    const c = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
    const norm = (v) => (v.endsWith('%') ? v : px(v) >= 999 ? 'pill' : px(v) + 'px');
    const n = c.map(norm);
    if (n.every((v) => v === n[0])) return n[0] === '0px' ? '0px' : n[0];
    return n.join(' ');
  };
  const short = (el) => {
    const one = (e) => {
      if (e.id) return e.tagName.toLowerCase() + '#' + e.id;
      const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      return e.tagName.toLowerCase() + (cls ? '.' + cls : '');
    };
    let sel = one(el);
    try { if (document.querySelectorAll(sel).length > 1 && el.parentElement) sel = one(el.parentElement) + ' > ' + sel; } catch (e) { /* keep sel */ }
    return sel;
  };
  const roleOf = (el) => {
    const r = el.getAttribute('role');
    if (r) return r;
    const t = el.tagName.toLowerCase();
    if (t === 'a') return 'link';
    if (t === 'input') return { checkbox: 'checkbox', radio: 'radio', submit: 'button', button: 'button', reset: 'button' }[el.type] || 'textbox';
    if (t === 'textarea') return 'textbox';
    if (t === 'select') return 'select';
    return t;
  };
  const shadowOf = (s) => (s.boxShadow && s.boxShadow !== 'none' ? colors(s.boxShadow) : 'none');
  const fpOf = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const bw = px(s.borderTopWidth);
    return {
      fontFamily: family(s),
      fontSize: px(s.fontSize) + 'px',
      fontWeight: String(s.fontWeight),
      lineHeight: s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight) + 'px',
      letterSpacing: s.letterSpacing === 'normal' ? '0px' : px(s.letterSpacing) + 'px',
      textTransform: s.textTransform,
      color: toHex(s.color),
      background: toHex(s.backgroundColor) + (s.backgroundImage && s.backgroundImage !== 'none' ? ' +image' : ''),
      border: bw > 0 && s.borderTopStyle !== 'none' ? `${bw}px ${s.borderTopStyle} ${toHex(s.borderTopColor)}` : 'none',
      radius: radius(s),
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map((v) => px(v) + 'px').join(' '),
      height: Math.round(r.height * 100) / 100 + 'px',
      shadow: shadowOf(s),
      width: Math.round(r.width * 100) / 100 + 'px',
    };
  };
  const text = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);

  if (mode === 'element') {
    const el = [...document.querySelectorAll(arg)].find(visible) || document.querySelector(arg);
    if (!el) return null;
    return { selector: arg, tag: el.tagName.toLowerCase(), role: roleOf(el), text: text(el), fp: fpOf(el) };
  }

  const CONTROL = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=link],[role=menuitem]';
  if (mode === 'controls') {
    const out = [];
    for (const el of document.querySelectorAll(CONTROL)) {
      if (!visible(el)) continue;
      out.push({ selector: short(el), tag: el.tagName.toLowerCase(), role: roleOf(el), text: text(el), fp: fpOf(el) });
      if (out.length >= 400) break;
    }
    return out;
  }

  // mode page. One pass over every visible element.
  const maps = { fontSizes: {}, fontFamilies: {}, colors: {}, radii: {}, spacing: {}, controlHeights: {}, shadows: {} };
  const examples = { fontSizes: {}, fontFamilies: {}, colors: {}, radii: {}, spacing: {}, controlHeights: {}, shadows: {} };
  const add = (cat, val, el) => {
    maps[cat][val] = (maps[cat][val] || 0) + 1;
    if (!examples[cat][val]) examples[cat][val] = short(el);
  };
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD', 'META', 'LINK', 'TITLE', 'BR']);
  let seen = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (SKIP.has(el.tagName) || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (!visible(el)) continue;
    if (++seen > 8000) break;
    const s = getComputedStyle(el);
    const ownText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (ownText) {
      add('fontSizes', px(s.fontSize) + 'px', el);
      add('fontFamilies', family(s), el);
      const c = toHex(s.color);
      if (c !== 'transparent') add('colors', c, el);
    }
    const bg = toHex(s.backgroundColor);
    if (bg !== 'transparent') add('colors', bg, el);
    if (px(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') {
      const bc = toHex(s.borderTopColor);
      if (bc !== 'transparent') add('colors', bc, el);
    }
    const rad = radius(s);
    if (rad !== '0px') add('radii', rad, el);
    for (const p of [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft, s.rowGap, s.columnGap, s.marginTop, s.marginRight, s.marginBottom, s.marginLeft]) {
      const v = px(p);
      if (v > 0 && v < 400) add('spacing', v + 'px', el);
    }
    const sh = shadowOf(s);
    if (sh !== 'none') add('shadows', sh, el);
    if (el.matches('button,select,textarea,[role=button],input:not([type=hidden]):not([type=checkbox]):not([type=radio])')) {
      add('controlHeights', Math.round(el.getBoundingClientRect().height) + 'px', el);
    }
  }
  return { elements: seen, maps, examples, scrollHeight: document.documentElement.scrollHeight };
}

// ---------- pure helpers, run in node ----------

export const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'background', 'border', 'radius', 'padding', 'height', 'shadow'];

// Token by token, px values within half a pixel are the same.
export function sameValue(a, b) {
  if (a === b) return true;
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ta = a.split(/\s+/), tb = b.split(/\s+/);
  if (ta.length !== tb.length) return false;
  return ta.every((t, i) => {
    if (t === tb[i]) return true;
    if (/^-?[\d.]+px$/.test(t) && /^-?[\d.]+px$/.test(tb[i])) return Math.abs(parseFloat(t) - parseFloat(tb[i])) <= 0.5;
    return false;
  });
}

// Differences between a kit fingerprint and a found one. Width is not compared, it varies with text.
export function diffFingerprints(kit, found, props = PROPS) {
  const out = [];
  for (const p of props) if (!sameValue(kit[p], found[p])) out.push({ prop: p, kit: kit[p], found: found[p] });
  return out;
}

// Style differences that change what a person sees as a different component, not just spacing.
export function severityForProps(diffs) {
  return diffs.some((d) => ['fontFamily', 'color', 'background', 'border'].includes(d.prop)) ? 2 : 3;
}

const ACTION = new Set(['button', 'link', 'tab', 'menuitem']);
export function sameRole(a, b) {
  return a === b || (ACTION.has(a) && ACTION.has(b));
}

// Similar size, so a small icon button does not match a wide primary button.
export function similarSize(kitBox, found) {
  const kw = parseFloat(kitBox.width), kh = parseFloat(kitBox.height);
  const fw = parseFloat(found.width), fh = parseFloat(found.height);
  if (!(kw > 0 && kh > 0 && fw > 0 && fh > 0)) return false;
  return Math.abs(fh - kh) <= Math.max(8, kh * 0.25) && fw / kw >= 0.5 && fw / kw <= 2;
}

export const CATEGORIES = {
  fontFamilies: { label: 'font family', severity: 2 },
  colors: { label: 'colour', severity: 2 },
  fontSizes: { label: 'font size', severity: 3 },
  radii: { label: 'radius', severity: 3 },
  shadows: { label: 'shadow', severity: 3 },
  controlHeights: { label: 'control height', severity: 3 },
  spacing: { label: 'spacing', severity: 3 },
};
// Spacing is noisy, one stray 7px is not drift. It needs this many uses to be reported.
export const SPACING_MIN_COUNT = 3;

// Union of several golden page fingerprints. Each value keeps the screens that use it.
export function unionGolden(goldens) {
  const u = {};
  for (const cat of Object.keys(CATEGORIES)) u[cat] = {};
  for (const g of goldens) {
    for (const cat of Object.keys(CATEGORIES)) {
      for (const [val, n] of Object.entries((g.fingerprint.maps || {})[cat] || {})) {
        const e = (u[cat][val] = u[cat][val] || { count: 0, screens: [] });
        e.count += n;
        e.screens.push(g.name);
      }
    }
  }
  return u;
}

// Values a new page uses that no golden screen uses.
export function driftFindings(pageFp, union, route = null) {
  const out = [];
  for (const [cat, meta] of Object.entries(CATEGORIES)) {
    for (const [val, count] of Object.entries(pageFp.maps[cat] || {})) {
      if (union[cat][val]) continue;
      if (cat === 'spacing' && count < SPACING_MIN_COUNT) continue;
      out.push({ route, category: cat, kind: meta.label, value: val, count, example: (pageFp.examples[cat] || {})[val] || null, severity: meta.severity });
    }
  }
  return out.sort((a, b) => a.severity - b.severity || b.count - a.count || a.kind.localeCompare(b.kind));
}

export const today = () => new Date().toISOString().slice(0, 10);
