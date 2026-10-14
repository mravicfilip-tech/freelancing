#!/usr/bin/env node
// Fast, deterministic screenshots and mechanical UI checks. visual-qa runs this and reads the
// report instead of driving a browser step by step.
//
//   node shoot.mjs --url <base url or folder> --routes "name=/path,name2=/path2" --out <dir>
//                  [--widths 1440] [--height 900] [--selector ".badge"] [--wait <ms>]
//                  Desktop first. Pass a phone width in --widths only when the client brief names it.
//                  [--compare <before dir>] [--interact] [--record [--fps 30] [--seconds 90]]
//
// Needs puppeteer-core and a Chrome or Edge. Run  npm i puppeteer-core  once in ~/.claude/studio, or set
// PUPPETEER_CORE_PATH to an installed copy. Set CHROME_PATH when the browser is somewhere unusual.
//
// Writes <out>/<name>_<width>.png, <out>/<name>_<width>_component.png when --selector is set,
// and <out>/report.json. Prints a short summary.
// Two more files every run, built from the same data and never changing report.json
//   contact.png          one sheet of every after shot in route order with the route name above each,
//                        1920 wide, one column up to 4 captures and two columns above that. Each cell
//                        shows the top 1400px of its shot. The critic opens this one image in place of
//                        one image a route.
//   report.compact.txt   report.json as text, one line per route and one line per finding, interact
//                        and hierarchy findings merged once, no raw element dumps (lib/compact-report.mjs)
//
// Checks, computed from the browser's own styles, never from pixels
//   contrast   WCAG ratio of text colour against the resolved background colour
//   type       working text under the 14px floor (foundation/principles.md)
//   targets    interactive elements under 24 by 24 (WCAG 2.5.8), controls under 32px tall
//   focus      the first 15 Tab stops, each needs a visible outline or ring
//   overflow   horizontal scroll at each width
//   console    errors and uncaught exceptions
//   diff       with --compare, changed pixels and the changed area against the before shot
//
// Off by default, --interact adds an interaction pass per route and width, written to
// report.json under "interact" (about 20 seconds at most per route). It scrolls, hovers and clicks,
// so it runs after the screenshot and never changes the files a plain run writes.
//   sticky     sticky and fixed elements at scroll 600 and at the bottom, stay in view, opaque
//              background, and whether page content paints over them
//   stacking   every popup trigger is opened, the layer must sit above headers, not be clipped, stay
//              inside the viewport, and Escape must close it and return focus to the trigger
//   hover      up to 40 visible links, buttons and inputs, no change, layout shift, underline on a button
//   zindex     distinct z-index values, flags above 60 or off the 0 10 20 30 40 50 60 scale
// Each finding carries a suggested severity, 1 to 3.
//   hierarchy  also under --interact, a read only block per route at row.hierarchy. Filled primary buttons
//              per view and per section, the heading outline, the largest text element, and controls with
//              no accessible name. Own findings, sev 2 for more than one filled primary in a view or an
//              unnamed control, sev 3 for no h1, a skipped level, or a form with no clear primary.
//              Kept out of interact.findings so that block is unchanged.
//
// Off by default, --record adds a recording per route and width, for anything judged by how it
// moves. It loads the route again in its own page, so a plain run's files never change. Details in
// lib/record.mjs. Written to report.json under "record".
//   <name>_<width>.mp4        the page from the top, held 1.5s, then scrolled by mouse wheel a step at
//                             a time to the bottom. Time is virtual, so easing and order are exact and
//                             jank never shows. --fps sets the frame rate, --seconds caps the length.
//   <name>_<width>_strip.png  16 stills from it, evenly spaced, labelled with time and scroll position.
//                             A reader who cannot watch video opens this one.
//   layout shift              the total while it scrolled, the five largest with their time, and apart
//                             from those the total from load, before the recording started
// Needs ffmpeg for the mp4. Without it the frames land in <name>_<width>_frames/ with the command
// that joins them. A 3D page renders each frame in software, so record it at --fps 15.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compactReport } from './lib/compact-report.mjs';
import { recordRoute } from './lib/record.mjs';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
async function pixelDiff(a, b) {
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

// ---------- --interact pass ----------
// Everything below runs only with --interact. It scrolls, hovers and clicks, so it runs after the
// screenshot and the focus walk and never changes the files a plain run writes.

// Runs inside the page. Installs window.__shoot, the helpers the interaction pass calls.
function installInteractHelpers() {
  const S = (window.__shoot = {});
  S.describe = (el) => {
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
  };
  S.visible = (el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  S.alpha = (str) => {
    if (!str || str === 'transparent') return 0;
    let m = str.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean); if (p.length < 4) return 1; const v = p[3]; return v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); }
    m = str.match(/\/\s*([\d.]+)(%?)\s*\)\s*$/);
    if (m) return m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    return 1;
  };
  S.inside = (root, n) => { for (; n; n = n.parentNode || n.host) if (n === root) return true; return false; };
  S.pinnedChain = (n) => { for (; n && n.nodeType === 1; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  S.isDoc = (sc) => sc === document.scrollingElement || sc === document.documentElement || sc === document.body;
  S.scroller = () => {
    if (S._sc) return S._sc;
    const de = document.scrollingElement || document.documentElement;
    let best = de;
    if (de.scrollHeight <= innerHeight + 1) {
      let area = 0;
      for (const e of document.body.querySelectorAll('*')) {
        if (!/(auto|scroll)/.test(getComputedStyle(e).overflowY) || e.scrollHeight <= e.clientHeight + 1) continue;
        const r = e.getBoundingClientRect(); const a = r.width * r.height;
        if (a > area && a > innerWidth * innerHeight * 0.4) { best = e; area = a; }
      }
    }
    return (S._sc = best);
  };
  S.max = () => { const sc = S.scroller(); return Math.max(0, sc.scrollHeight - sc.clientHeight); };
  S.base = () => { const sc = S.scroller(); return S.isDoc(sc) ? 0 : sc.getBoundingClientRect().top + sc.clientTop; };
  S.scrollTo = (y) => {
    const sc = S.scroller();
    if (S.isDoc(sc)) { window.scrollTo({ top: y, behavior: 'instant' }); return window.scrollY; }
    sc.scrollTo({ top: y, behavior: 'instant' }); return sc.scrollTop;
  };
  S.scrollY = () => { const sc = S.scroller(); return S.isDoc(sc) ? window.scrollY : sc.scrollTop; };

  // ----- sticky and fixed elements
  S.pinned = [];
  S.pinnedInit = () => {
    S.pinned = [];
    const out = [], seen = new Set();
    for (const e of document.body.querySelectorAll('*')) {
      if (out.length >= 12) break;
      const s = getComputedStyle(e);
      if (s.position !== 'sticky' && s.position !== 'fixed') continue;
      if (!S.visible(e) || s.pointerEvents === 'none') continue;
      const r = e.getBoundingClientRect();
      if (r.width * r.height < 400) continue;
      if (S.pinned.some((p) => p.contains(e))) continue;
      if (s.position === 'fixed' && (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth)) continue;
      const key = S.describe(e);
      if (seen.has(key)) continue;
      seen.add(key);
      let alpha = S.alpha(s.backgroundColor), via = null;
      const image = s.backgroundImage && s.backgroundImage !== 'none';
      if (alpha < 1 && !image) {
        for (const d of [...e.querySelectorAll('*')].slice(0, 60)) {
          const dr = d.getBoundingClientRect();
          if (dr.width * dr.height >= 0.95 * r.width * r.height && S.alpha(getComputedStyle(d).backgroundColor) >= 1) { alpha = 1; via = S.describe(d); break; }
        }
      }
      const opacity = Number(s.opacity);
      S.pinned.push(e);
      out.push({
        el: key, position: s.position, zIndex: s.zIndex,
        topPx: s.top === 'auto' ? null : parseFloat(s.top), bottomPx: s.bottom === 'auto' ? null : parseFloat(s.bottom),
        rect0: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
        bg: s.backgroundColor, alpha, image: !!image, via, opacity,
        backdrop: s.backdropFilter && s.backdropFilter !== 'none' ? s.backdropFilter : null,
        opaque: (alpha >= 1 || image) && opacity >= 1,
        wide: r.width >= innerWidth * 0.5 || r.height >= innerHeight * 0.5,
      });
    }
    return out;
  };
  S.pinnedCheck = () => S.pinned.map((e) => {
    const r = e.getBoundingClientRect();
    const rec = { top: r.top, bottom: r.bottom, inView: r.bottom > 1 && r.top < innerHeight - 1 && S.visible(e), hits: [] };
    const x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, innerHeight);
    if (rec.inView && x1 - x0 >= 4 && y1 - y0 >= 4 && e.getRootNode() === document) {
      const seen = new Set();
      for (const fy of [0.1, 0.5, 0.9]) for (const fx of [0.1, 0.5, 0.9]) {
        const hit = document.elementFromPoint(x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy);
        if (!hit || S.inside(e, hit)) continue;
        const by = S.describe(hit);
        if (seen.has(by)) continue;
        seen.add(by);
        rec.hits.push({ by, pinned: S.pinnedChain(hit), z: getComputedStyle(hit).zIndex });
      }
    }
    return rec;
  });

  // ----- hover
  S.hov = [];
  S.hoverTargets = () => {
    const sel = 'a[href],button,[role=button],input:not([type=hidden])';
    const keyOf = (e) => `${e.tagName}|${(typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).slice(0, 3).join('.')}|${e.getAttribute('role') || ''}|${e.getAttribute('type') || ''}`;
    const all = [...document.querySelectorAll(sel)].filter((e) => {
      if (!S.visible(e) || e.disabled || e.getAttribute('aria-disabled') === 'true') return false;
      return getComputedStyle(e).pointerEvents !== 'none';
    });
    const firsts = [], rest = [], seen = new Set();
    for (const e of all) { const k = keyOf(e); if (seen.has(k)) rest.push(e); else { seen.add(k); firsts.push(e); } }
    S.hov = firsts.concat(rest).slice(0, 40);
    return { found: all.length, picked: S.hov.map(S.describe) };
  };
  S.hoverPrep = (i) => {
    const el = S.hov[i];
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  };
  S.hoverRest = (i) => {
    const el = S.hov[i];
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
    const hit = document.elementFromPoint(x, y);
    return { x, y, covered: !hit || !(S.inside(el, hit) || S.inside(hit, el)), hovered: el.matches(':hover') };
  };
  S.hoverSnap = (i) => {
    const el = S.hov[i];
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    const grab = (e) => {
      const s = getComputedStyle(e);
      return {
        color: s.color, background: s.backgroundColor, backgroundImage: s.backgroundImage,
        border: sides.map((k) => s['border' + k + 'Width'] + ' ' + s['border' + k + 'Style'] + ' ' + s['border' + k + 'Color']).join(' / '),
        boxShadow: s.boxShadow, textDecoration: s.textDecorationLine, transform: s.transform, opacity: s.opacity, filter: s.filter,
        outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
      };
    };
    const lay = (e) => (e ? { w: e.offsetWidth || 0, h: e.offsetHeight || 0, l: e.offsetLeft || 0, t: e.offsetTop || 0 } : null);
    return {
      self: grab(el), kids: [...el.querySelectorAll('*')].slice(0, 10).map(grab),
      lay: lay(el), parent: lay(el.parentElement), next: lay(el.nextElementSibling), prev: lay(el.previousElementSibling),
      isLink: el.tagName === 'A' || el.getAttribute('role') === 'link',
    };
  };

  // ----- z-index
  S.zindex = () => {
    const map = new Map();
    for (const e of document.body.querySelectorAll('*')) {
      const s = getComputedStyle(e);
      if (s.zIndex === 'auto') continue;
      const flexItem = e.parentElement && /flex|grid/.test(getComputedStyle(e.parentElement).display);
      if (s.position === 'static' && !flexItem) continue;
      const v = Number(s.zIndex);
      if (!Number.isFinite(v)) continue;
      const row = map.get(v) || { value: v, count: 0, examples: [] };
      row.count++;
      if (row.examples.length < 3) row.examples.push(S.describe(e));
      map.set(v, row);
    }
    return [...map.values()].sort((a, b) => a.value - b.value);
  };

  // ----- menus and popups
  S.trig = [];
  S.triggers = () => {
    const sel = '[aria-haspopup]:not([aria-haspopup="false"]),[aria-expanded="false"],[role="combobox"],[role="menubutton"]';
    const keyOf = (e) => `${e.tagName}|${(typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).slice(0, 3).join('.')}|${e.getAttribute('role') || ''}`;
    const all = [...document.querySelectorAll(sel)].filter((e) => {
      if (!S.visible(e) || e.disabled || e.getAttribute('aria-disabled') === 'true') return false;
      if (e.tagName === 'A') { const h = e.getAttribute('href'); if (h && !h.startsWith('#')) return false; }
      return true;
    });
    const firsts = [], rest = [], seen = new Set();
    for (const e of all) { const k = keyOf(e); if (seen.has(k)) rest.push(e); else { seen.add(k); firsts.push(e); } }
    S.trig = firsts.concat(rest).slice(0, 10);
    return { found: all.length, picked: S.trig.map(S.describe) };
  };
  // Scrolls the trigger to sit just under the pinned headers, the worst place for a menu.
  S.stackPrep = (i) => {
    const t = S.trig[i];
    if (!S.pinned.length) S.pinnedInit();
    const inPinned = S.pinned.some((p) => p.contains(t));
    const max = S.max();
    S.scrollTo(Math.min(600, max));
    if (inPinned) return;
    let hb = 0;
    for (const p of S.pinned) { const r = p.getBoundingClientRect(); if (r.top <= 5 && r.bottom > 0 && r.bottom < innerHeight / 2) hb = Math.max(hb, r.bottom); }
    if (hb > 0) {
      const r = t.getBoundingClientRect();
      S.scrollTo(Math.max(0, Math.min(max, S.scrollY() + r.top - (hb + 12))));
    } else t.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  };
  S.stackReady = (i) => {
    const t = S.trig[i];
    S.preVis = new Set();
    for (const e of document.body.querySelectorAll('*')) if (S.visible(e)) S.preVis.add(e);
    const r = t.getBoundingClientRect();
    return { x: Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y: Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1) };
  };
  S.containingBlock = (el) => {
    const html = document.documentElement;
    const moves = (s) => s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none' || /transform|filter/.test(s.willChange) || /paint|layout|strict|content/.test(s.contain);
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed') { for (let n = el.parentElement; n && n !== html; n = n.parentElement) if (moves(getComputedStyle(n))) return n; return null; }
    if (pos === 'absolute') { for (let n = el.parentElement; n && n !== html; n = n.parentElement) { const s = getComputedStyle(n); if (s.position !== 'static' || moves(s)) return n; } return null; }
    return el.parentElement;
  };
  S.stackCheck = (i) => {
    const t = S.trig[i];
    const expanded = t.getAttribute('aria-expanded');
    const fresh = [...document.body.querySelectorAll('*')].filter((e) => S.visible(e) && !S.preVis.has(e) && !e.contains(t));
    const floating = fresh.filter((e) => { const p = getComputedStyle(e).position; return p === 'absolute' || p === 'fixed'; });
    const top = floating.filter((e) => !floating.some((o) => o !== e && o.contains(e)));
    let layer = null;
    const cid = t.getAttribute('aria-controls');
    const byId = cid && document.getElementById(cid);
    if (byId && top.includes(byId)) layer = byId;
    else if (top.length) layer = top.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; })[0];
    S.layer = layer;
    if (!layer) return { expanded, opened: fresh.length > 0, inline: fresh.length > 0, layer: null, issues: [] };
    const r = layer.getBoundingClientRect();
    const issues = [];
    // Viewport
    const off = { left: Math.round(-r.left), top: Math.round(-r.top), right: Math.round(r.right - innerWidth), bottom: Math.round(r.bottom - innerHeight) };
    if (Math.max(off.left, off.top, off.right, off.bottom) > 4) {
      if (r.height > innerHeight + 4) issues.push({ kind: 'taller', height: Math.round(r.height), viewport: innerHeight });
      else issues.push({ kind: 'offscreen', off });
    }
    // Overflow clip, walking the containing block chain
    let topLayer = false;
    try { topLayer = layer.matches(':popover-open') || layer.matches('dialog:modal'); } catch (e) { /* older engines */ }
    if (!topLayer) {
      for (let n = S.containingBlock(layer); n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        const cx = s.overflowX !== 'visible', cy = s.overflowY !== 'visible';
        if (!cx && !cy) continue;
        const b = n.getBoundingClientRect();
        const l = b.left + n.clientLeft, tp = b.top + n.clientTop, rr = l + n.clientWidth, bb = tp + n.clientHeight;
        const px = Math.round(Math.max(cx ? l - r.left : 0, cx ? r.right - rr : 0, cy ? tp - r.top : 0, cy ? r.bottom - bb : 0));
        if (px > 1) { issues.push({ kind: 'clipped', by: S.describe(n), px }); break; }
      }
    }
    // What paints over the layer. Grid of points, plus the middle of every overlap with a pinned element.
    const pts = [];
    const x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, innerHeight);
    if (x1 - x0 >= 4 && y1 - y0 >= 4) for (const fy of [0.1, 0.5, 0.9]) for (const fx of [0.1, 0.5, 0.9]) pts.push([x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy]);
    for (const p of S.pinned) {
      const pr = p.getBoundingClientRect();
      const ax = Math.max(x0, pr.left), ay = Math.max(y0, pr.top), bx = Math.min(x1, pr.right), by = Math.min(y1, pr.bottom);
      if (bx - ax >= 4 && by - ay >= 4) pts.push([(ax + bx) / 2, (ay + by) / 2]);
    }
    const seen = new Set();
    for (const [x, y] of pts) {
      const hit = document.elementFromPoint(x, y);
      if (!hit || S.inside(layer, hit) || S.inside(hit, layer)) continue;
      const by = S.describe(hit);
      if (seen.has(by)) continue;
      seen.add(by);
      issues.push({ kind: 'under', by, pinned: S.pinnedChain(hit), z: getComputedStyle(hit).zIndex });
    }
    return { expanded, opened: true, inline: false, layer: S.describe(layer), issues };
  };
  S.stackAfter = (i) => {
    const t = S.trig[i];
    const a = document.activeElement;
    return {
      closed: !S.layer || !S.layer.isConnected || !S.visible(S.layer),
      focusable: t.tabIndex >= 0,
      focusBack: a === t || t.contains(a),
      active: a && a !== document.body ? S.describe(a) : 'nothing (document body)',
    };
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(`${label} timed out after ${ms}ms`)), ms))]);
const ALLOWED_Z = [0, 10, 20, 30, 40, 50, 60];

// Runs the four interaction checks on the page that is currently loaded. Never throws.
async function interactRoute(page, budgetMs = 20000) {
  const t0 = Date.now();
  const left = () => budgetMs - (Date.now() - t0);
  const res = { sticky: [], stacking: [], hover: { checked: 0, skipped: 0, findings: 0 }, zindex: { values: [], flagged: [] }, findings: [], errors: [], budgetHit: false, seconds: 0 };
  const add = (check, severity, el, issue, detail) => res.findings.push({ check, severity, el, issue, ...(detail ? { detail } : {}) });
  const step = async (name, fn) => {
    if (left() < 500) { res.budgetHit = true; res.errors.push(`${name}, skipped, time budget used`); return; }
    try { await withTimeout(fn(), Math.max(1000, left()), name); } catch (e) { res.errors.push(`${name}, ${String(e.message || e).slice(0, 160)}`); }
  };
  const call = (fn, ...a) => page.evaluate(fn, ...a);

  try {
    const ready = await withTimeout(call(installInteractHelpers).then(() => true), 4000, 'helpers').catch((e) => { res.errors.push(`helpers, ${String(e.message || e).slice(0, 160)}`); return false; });
    if (!ready) return res;
    const startUrl = page.url();

    // 1. Sticky and fixed elements
    await step('sticky', async () => {
      const cands = await call(() => window.__shoot.pinnedInit());
      const max = await call(() => window.__shoot.max());
      const entries = cands.map((c) => ({
        el: c.el, position: c.position, top: c.topPx, bottom: c.bottomPx, zIndex: c.zIndex, background: c.bg, alpha: c.alpha,
        opaque: c.opaque, backdropFilter: c.backdrop, stays: {}, coveredBy: [],
      }));
      res.sticky = entries;
      cands.forEach((c, i) => {
        if (c.opaque || !c.wide) return;
        const why = c.opacity < 1 ? `element opacity is ${c.opacity}` : c.alpha === 0 ? 'background is fully transparent' : `background alpha is ${Math.round(c.alpha * 100) / 100}`;
        add('sticky', 2, c.el, `${c.position} element is not opaque, page content shows through it`, `${why}${c.backdrop ? `, backdrop-filter ${c.backdrop}` : ''}`);
        entries[i].finding = 'translucent';
      });
      cands.forEach((c, i) => {
        if (c.position === 'sticky' && c.topPx === null && c.bottomPx === null) {
          add('sticky', 1, c.el, 'sticky element has no top or bottom offset, so it never pins', 'set top or bottom');
          entries[i].finding = 'no offset';
        }
      });
      if (!cands.length) return;
      if (max <= 0) { entries.forEach((e) => { e.stays = 'page does not scroll'; }); return; }
      const positions = [{ label: 'at 600px', y: Math.min(600, max) }];
      if (max > positions[0].y + 20) positions.push({ label: 'at the bottom', y: max });
      const base = await call(() => window.__shoot.base());
      const vh = await call(() => window.innerHeight);
      for (const pos of positions) {
        await call((v) => window.__shoot.scrollTo(v), pos.y);
        await sleep(250);
        const rows = await call(() => window.__shoot.pinnedCheck());
        rows.forEach((row, i) => {
          const c = cands[i], e = entries[i];
          if (c.position === 'sticky' && c.topPx === null && c.bottomPx === null) return;
          let ok = row.inView, why = row.inView ? '' : 'is out of the viewport';
          if (row.inView) {
            if (c.position === 'sticky' && c.topPx !== null) {
              const want = base + c.topPx;
              if (row.top < want - 2) { ok = false; why = `sits ${Math.round(want - row.top)}px above its pin line (top ${Math.round(row.top)}px, expected ${Math.round(want)}px)`; }
            } else if (c.position === 'sticky') {
              const want = base + vh - c.bottomPx;
              if (row.bottom > want + 2) { ok = false; why = `sits ${Math.round(row.bottom - want)}px below its pin line`; }
            } else {
              const topAnchored = c.rect0.top < vh / 2;
              const drift = topAnchored ? row.top - c.rect0.top : row.bottom - c.rect0.bottom;
              if (Math.abs(drift) > 2) { ok = false; why = `moved ${Math.round(drift)}px from its fixed position`; }
            }
          }
          e.stays[pos.label] = ok;
          if (!ok) {
            const sev = pos.label === 'at the bottom' ? 2 : 1;
            add('sticky', sev, c.el, `${c.position} element does not stay in place ${pos.label}`, `${why}${c.position === 'sticky' ? '. A parent that ends too early, or a hide-on-scroll rule, also causes this' : ''}`);
          }
          for (const h of row.hits) {
            const key = `${h.by}|${h.pinned}`;
            if (e.coveredBy.some((k) => k.key === key)) continue;
            e.coveredBy.push({ key, by: h.by, otherPinned: h.pinned, z: h.z, at: pos.label });
            if (h.pinned) add('sticky', 3, c.el, `another pinned layer overlaps it ${pos.label}`, `${h.by}, z-index ${h.z}`);
            else add('sticky', 1, c.el, `page content paints over it ${pos.label}`, `${h.by}, z-index ${h.z} against ${c.zIndex}. Raise the header or lower the content`);
          }
        });
      }
    });

    // 4. z-index, a read only pass, runs before anything that clicks
    await step('z-index', async () => {
      const values = await call(() => window.__shoot.zindex());
      res.zindex.values = values;
      for (const v of values) {
        if (v.value > 60 || !ALLOWED_Z.includes(v.value)) {
          res.zindex.flagged.push(v.value);
          add('zindex', 3, v.examples[0], `z-index ${v.value} is ${v.value > 60 ? 'above 60' : 'off the scale 0 10 20 30 40 50 60'}`, `${v.count} element${v.count > 1 ? 's' : ''}${v.examples.length > 1 ? `, also ${v.examples.slice(1).join(', ')}` : ''}`);
        }
      }
    });

    // 3. Hover
    await step('hover', async () => {
      await page.mouse.move(0, 0);
      const info = await call(() => window.__shoot.hoverTargets());
      res.hover.found = info.found;
      const changed = (a, b) => Object.keys(a).filter((k) => a[k] !== b[k]);
      for (let i = 0; i < info.picked.length; i++) {
        if (left() < 5000) { res.budgetHit = true; res.hover.stoppedAt = i; break; }
        const name = info.picked[i];
        try {
          await call((n) => window.__shoot.hoverPrep(n), i);
          await sleep(40);
          let at = await call((n) => window.__shoot.hoverRest(n), i);
          if (at.hovered) { await page.mouse.move(0, 0); await sleep(80); at = await call((n) => window.__shoot.hoverRest(n), i); }
          if (at.covered) { res.hover.skipped++; continue; }
          const rest = await call((n) => window.__shoot.hoverSnap(n), i);
          await page.mouse.move(at.x, at.y);
          await sleep(140);
          const hov = await call((n) => window.__shoot.hoverSnap(n), i);
          res.hover.checked++;
          const props = changed(rest.self, hov.self);
          const kidProps = new Set();
          rest.kids.forEach((k, j) => { if (hov.kids[j]) changed(k, hov.kids[j]).forEach((p) => kidProps.add(p)); });
          if (rest.kids.length !== hov.kids.length) kidProps.add('content');
          const shift = {};
          const cmp = (label, a, b, keys) => { if (!a || !b) return; for (const k of keys) if (Math.abs(a[k] - b[k]) >= 1) shift[`${label}.${k}`] = b[k] - a[k]; };
          cmp('self', rest.lay, hov.lay, ['w', 'h', 'l', 't']);
          cmp('parent', rest.parent, hov.parent, ['w', 'h']);
          cmp('next', rest.next, hov.next, ['l', 't']);
          cmp('prev', rest.prev, hov.prev, ['l', 't']);
          const all = [...new Set([...props, ...kidProps])];
          const underline = !rest.isLink && [rest.self, ...rest.kids].every((s) => !/underline/.test(s.textDecoration)) && [hov.self, ...hov.kids].some((s) => /underline/.test(s.textDecoration));
          if (!all.length && !Object.keys(shift).length) {
            add('hover', 3, name, 'no hover state, nothing visible changes under the pointer');
            res.hover.findings++;
          }
          if (Object.keys(shift).length) {
            add('hover', 2, name, 'hover shifts layout', Object.entries(shift).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}px`).join(', '));
            res.hover.findings++;
          }
          if (underline) {
            add('hover', 2, name, 'underline appears on hover, on a button and not a link');
            res.hover.findings++;
          }
        } catch (e) {
          res.errors.push(`hover ${name}, ${String(e.message || e).slice(0, 100)}`);
          if (/detached|destroyed|closed|navigat/i.test(String(e.message))) break;
        }
      }
      await page.mouse.move(0, 0);
    });

    // 2. Menus, popups and comboboxes. Last, because it clicks and may leave things open.
    await step('stacking', async () => {
      const info = await call(() => window.__shoot.triggers());
      res.stackingFound = info.found;
      for (let i = 0; i < info.picked.length; i++) {
        if (left() < 900) { res.budgetHit = true; res.stackingStoppedAt = i; break; }
        const name = info.picked[i];
        const row = { trigger: name };
        res.stacking.push(row);
        try {
          await page.keyboard.press('Escape');
          await call((n) => window.__shoot.stackPrep(n), i);
          await sleep(100);
          const at = await call((n) => window.__shoot.stackReady(n), i);
          await page.mouse.click(at.x, at.y);
          await sleep(220);
          if (page.url() !== startUrl) { row.note = 'click navigated away, stopped'; break; }
          const got = await call((n) => window.__shoot.stackCheck(n), i);
          Object.assign(row, got);
          if (got.opened && !got.inline) {
            for (const is of got.issues) {
              if (is.kind === 'under') add('stacking', 1, name, is.pinned ? 'opened layer sits under a pinned header' : 'opened layer is painted over by page content', `${is.by}, z-index ${is.z}. Layer is ${got.layer}`);
              else if (is.kind === 'clipped') add('stacking', 1, name, 'opened layer is clipped by an overflow ancestor', `${is.by} cuts off ${is.px}px. Layer is ${got.layer}`);
              else if (is.kind === 'offscreen') add('stacking', 1, name, 'opened layer runs outside the viewport', `off by ${Object.entries(is.off).filter(([, v]) => v > 4).map(([k, v]) => `${k} ${v}px`).join(', ')}. Layer is ${got.layer}`);
              else if (is.kind === 'taller') add('stacking', 2, name, 'opened layer is taller than the viewport', `${is.height}px against ${is.viewport}px, give it a max height and scroll`);
            }
          }
          if (got.opened) {
            await page.keyboard.press('Escape');
            await sleep(150);
            const after = await call((n) => window.__shoot.stackAfter(n), i);
            row.escape = after;
            if (!got.inline && !after.closed) add('stacking', 2, name, 'opened layer does not close on Escape');
            else if (after.closed && after.focusable && !after.focusBack) add('stacking', 2, name, 'focus does not return to the trigger after Escape', `focus is on ${after.active}`);
          }
        } catch (e) {
          row.error = String(e.message || e).slice(0, 100);
          res.errors.push(`stacking ${name}, ${row.error}`);
          if (/detached|destroyed|closed|navigat/i.test(String(e.message))) break;
        }
      }
    });
  } catch (e) {
    res.errors.push(`interact, ${String(e.message || e).slice(0, 160)}`);
  }
  res.seconds = Math.round((Date.now() - t0) / 100) / 10;
  return res;
}

// ---------- --interact hierarchy block ----------
// Runs inside the page. Read only, never clicks or scrolls. Returns the hierarchy block for the route.
function inspectHierarchy() {
  const parse = (s) => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined || Number.isNaN(p[3]) ? 1 : p[3]]; };
  const describe = (el) => {
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const findings = [];
  const add = (check, severity, el, issue, detail) => findings.push({ check, severity, el, issue, ...(detail ? { detail } : {}) });

  // Resolved colour behind an element, walking up until an opaque layer.
  const containerBg = (el) => {
    const layers = [];
    for (let n = el.parentElement; n && n.nodeType === 1; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let bg = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) bg = [0, 1, 2].map((k) => layers[i][k] * layers[i][3] + bg[k] * (1 - layers[i][3]));
    return bg;
  };

  // ----- a simplified accessible name
  const textOf = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  const nameOf = (el) => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\s+/).map((id) => { const n = document.getElementById(id); return n ? textOf(n) : ''; }).join(' ').trim(); if (t) return t; }
    const al = (el.getAttribute('aria-label') || '').trim();
    if (al) return al;
    if (el.labels && el.labels.length) { const t = [...el.labels].map(textOf).join(' ').trim(); if (t) return t; }
    const tag = el.tagName;
    if (tag === 'INPUT' && /^(submit|button|reset)$/i.test(el.type)) { const v = (el.value || '').trim(); if (v) return v; if (el.type === 'submit') return 'Submit'; if (el.type === 'reset') return 'Reset'; }
    if (tag === 'INPUT' && el.type === 'image') { const a = (el.alt || '').trim(); if (a) return a; }
    const own = textOf(el);
    if (own) return own;
    for (const img of el.querySelectorAll('img[alt],[role=img][aria-label]')) { const a = (img.getAttribute('alt') || img.getAttribute('aria-label') || '').trim(); if (a) return a; }
    for (const t of el.querySelectorAll('svg title')) { const a = textOf(t); if (a) return a; }
    const title = (el.getAttribute('title') || '').trim();
    if (title) return title;
    if (/^(INPUT|TEXTAREA)$/.test(tag)) { const p = (el.getAttribute('placeholder') || '').trim(); if (p) return p; }
    return '';
  };

  // ----- filled primary buttons. Nav links, tabs and toggles are not primaries.
  const clickables = [...document.querySelectorAll('button,a[href],[role=button],input[type=submit],input[type=button]')].filter((e) => {
    if (!visible(e)) return false;
    if (e.closest('nav,[role=tablist],[role=menu],[role=menubar],[role=tab]')) return false;
    if (e.hasAttribute('aria-selected') || e.hasAttribute('aria-pressed') || e.hasAttribute('aria-current')) return false;
    return true;
  });
  const isFilled = (el) => {
    const s = getComputedStyle(el);
    const c = parse(s.backgroundColor);
    if (s.backgroundImage && /gradient/.test(s.backgroundImage)) return { filled: true, bg: 'gradient' };
    if (!c || c[3] < 0.95) return { filled: false };
    const cb = containerBg(el);
    const diff = Math.max(Math.abs(c[0] - cb[0]), Math.abs(c[1] - cb[1]), Math.abs(c[2] - cb[2]));
    return { filled: diff >= 24, bg: `rgb(${c.slice(0, 3).join(', ')})` };
  };
  const filled = [];
  for (const e of clickables) { const f = isFilled(e); if (f.filled) filled.push({ e, bg: f.bg }); }

  const SECTION = 'section,article,aside,form,[role=region],[role=dialog],dialog,main,header,footer';
  const DIALOG = 'dialog,[role=dialog],[role=alertdialog],[aria-modal=true]';
  const nameSection = (s) => {
    const h = s.querySelector('h1,h2,h3,h4,h5,h6,[role=heading]');
    const lbl = s.getAttribute('aria-label') || (h && textOf(h)) || '';
    const cls = s.className && typeof s.className === 'string' ? '.' + s.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${s.tagName.toLowerCase()}${cls}${lbl ? ` "${lbl.slice(0, 40)}"` : ''}`;
  };
  const rep = ({ e, bg }) => ({ el: describe(e), background: bg });

  // Views. The page, plus every open dialog. A button belongs to its innermost dialog.
  const dialogs = [...document.querySelectorAll(DIALOG)].filter(visible);
  const viewOf = (e) => dialogs.filter((d) => d.contains(e)).sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0] || null;
  const views = [{ view: 'page', root: null, primaries: [] }, ...dialogs.map((d) => ({ view: `dialog ${nameSection(d)}`, root: d, primaries: [] }))];
  for (const f of filled) { const d = viewOf(f.e); (views.find((v) => v.root === d) || views[0]).primaries.push(rep(f)); }
  for (const v of views) {
    if (v.primaries.length > 1) add('primary', 2, v.view, `${v.primaries.length} filled primary buttons in one view, they compete`, v.primaries.map((p) => p.el).join(' | '));
  }

  // Sections. Each button belongs to its nearest section like ancestor.
  const secs = new Map();
  for (const f of filled) {
    const s = f.e.closest(SECTION);
    if (!s) continue;
    const row = secs.get(s) || { section: nameSection(s), primaries: [] };
    row.primaries.push(rep(f));
    secs.set(s, row);
  }
  const sections = [...secs.values()].map((s) => ({ section: s.section, primaries: s.primaries.length, items: s.primaries }));
  for (const s of sections) if (s.primaries > 1) add('primary', 2, s.section, `${s.primaries} filled primary buttons in one section`, s.items.map((p) => p.el).join(' | '));

  // Forms. Each visible form with fields should have one clear primary.
  const forms = [];
  for (const f of document.querySelectorAll('form')) {
    if (!visible(f)) continue;
    const fields = [...f.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea')].filter(visible);
    if (!fields.length) continue;
    const n = filled.filter((x) => f.contains(x.e)).length;
    forms.push({ form: nameSection(f), fields: fields.length, primaries: n });
    if (n === 0) add('primary', 3, nameSection(f), 'form view has no clear primary, no filled submit button', `${fields.length} field${fields.length > 1 ? 's' : ''}`);
  }

  // ----- heading outline
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(visible).map((h) => {
    const lv = /^H[1-6]$/.test(h.tagName) ? Number(h.tagName[1]) : Number(h.getAttribute('aria-level')) || 2;
    return { level: lv, text: textOf(h).slice(0, 60) };
  });
  const h1 = hs.filter((h) => h.level === 1).length;
  const skipped = [];
  for (let i = 1; i < hs.length; i++) if (hs[i].level > hs[i - 1].level + 1) skipped.push({ from: hs[i - 1].level, to: hs[i].level, text: hs[i].text });
  if (!h1) add('headings', 3, 'page', 'no h1', hs.length ? `outline starts at h${hs[0].level}` : 'no headings at all');
  for (const k of skipped) add('headings', 3, `h${k.to} "${k.text}"`, `skipped heading level, h${k.from} to h${k.to}`);

  // ----- largest text
  let big = null;
  for (const e of document.body.querySelectorAll('*')) {
    if (![...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    if (!visible(e) || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName)) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (!big || px > big.px) big = { e, px };
  }
  const largestText = big ? { el: describe(big.e), px: big.px, isHeading: !!big.e.closest('h1,h2,h3,h4,h5,h6,[role=heading]') } : null;

  // ----- controls with no accessible name
  const ctl = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=checkbox],[role=switch],[role=tab],[role=menuitem],[role=combobox],[role=textbox]')].filter(visible);
  const unnamed = [];
  for (const e of ctl) if (!nameOf(e)) unnamed.push({ el: describe(e), role: e.getAttribute('role') || e.tagName.toLowerCase() });
  for (const u of unnamed.slice(0, 30)) add('name', 2, u.el, 'control has no accessible name', `${u.role}, add an aria-label or visible text`);

  return { views: views.map((v) => ({ view: v.view, primaries: v.primaries.length, items: v.primaries })), sections, forms, headings: { outline: hs.slice(0, 60), h1, skipped }, largestText, unnamed: unnamed.slice(0, 30), findings };
}

// One image of every after shot, in route order, for the critic. The browser composes it as an html
// page of data URIs and screenshots it. 1920 wide, a name label over each cell, one column up to 4
// captures and two above that, a cell shows at most the top 1400px of its shot (the full shot stays
// on disk). Never upscales a shot past its own width.
const SHEET_W = 1920, SHEET_PAD = 24, SHEET_GAP = 24, CELL_MAX_H = 1400;
async function contactSheet(browser, report, file) {
  const rows = report.routes;
  const cols = rows.length > 4 ? 2 : 1;
  const cellW = Math.floor((SHEET_W - SHEET_PAD * 2 - (cols - 1) * SHEET_GAP) / cols);
  const many = new Set(rows.map((r) => r.width)).size > 1;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cells = rows.map((r) => `<figure><div class="n">${esc(r.route)}${many ? ` @${r.width}` : ''}</div><div class="frame"><img src="data:image/png;base64,${readFileSync(r.png).toString('base64')}"></div></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f4f4f5;font-family:Arial,sans-serif}
    .sheet{width:${SHEET_W}px;padding:${SHEET_PAD}px;display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:${SHEET_GAP}px;align-items:start}
    figure{margin:0}.n{font-size:32px;line-height:1.2;font-weight:700;color:#111;margin:0 0 8px}
    .frame{max-width:${cellW}px;max-height:${CELL_MAX_H}px;overflow:hidden;background:#fff;border:2px solid #111;display:inline-block}
    img{display:block;max-width:${cellW - 4}px;height:auto}
  </style><div class="sheet">${cells}</div>`;
  const sheet = await browser.newPage();
  try {
    await sheet.setViewport({ width: SHEET_W, height: 800, deviceScaleFactor: 1 });
    await sheet.setContent(html, { waitUntil: 'load' });
    await sheet.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null))));
    await sheet.screenshot({ path: file, fullPage: true });
  } finally {
    await sheet.close();
  }
}

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.url || !a.routes || !a.out) throw new Error('usage: shoot.mjs --url <base> --routes "name=/path,..." --out <dir> [--widths 1440] [--selector css] [--wait ms] [--compare dir] [--interact] [--record [--fps 30] [--seconds 90]]');
  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-core was not found. Run  npm i puppeteer-core  in ~/.claude/studio, or set PUPPETEER_CORE_PATH to an installed copy.');
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
  // Wheel steps land at once when recording, so the compositor's real time smooth scroll stays out of virtual time.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', ...(a.record ? ['--disable-smooth-scrolling'] : []), ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
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
        const row = { route: r.name, path: r.path, width: w, png: file, component, ...found, focus, console: [...errors] };
        if (a.interact) {
          row.hierarchy = await page.evaluate(inspectHierarchy).catch((e) => ({ error: String(e.message || e).slice(0, 160), findings: [] }));
          row.interact = await interactRoute(page);
        }
        if (a.record) row.record = await recordRoute(browser, { url, width: w, height, fps: Number(a.fps) || 30, seconds: Number(a.seconds) || 90, wait: Number(a.wait) || 0, out, name: r.name });
        report.routes.push(row);
      }
    }

    if (a.compare) {
      const before = resolve(a.compare);
      const blank = await browser.newPage();
      for (const row of report.routes) {
        const prev = join(before, `${row.route}_${row.width}.png`);
        if (!existsSync(prev)) { row.diff = { missing: prev }; continue; }
        const du = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
        row.diff = await blank.evaluate(pixelDiff, du(prev), du(row.png));
      }
    }
    try { await contactSheet(browser, report, join(out, 'contact.png')); } catch (e) { console.error(`contact sheet failed, ${String(e.message || e).slice(0, 160)}`); }
  } finally {
    await browser.close();
  }

  if (a.interact) report.interact = true;
  if (a.record) report.record = true;
  report.seconds = Math.round((Date.now() - t0) / 100) / 10;
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(out, 'report.compact.txt'), compactReport(report));


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
    if (row.interact) {
      const n = (sev) => row.interact.findings.filter((f) => f.severity === sev).length;
      bits.push(`interact ${n(1)} sev 1, ${n(2)} sev 2, ${n(3)} sev 3 in ${row.interact.seconds}s${row.interact.errors.length ? `, ${row.interact.errors.length} step errors` : ''}`);
    }
    if (row.hierarchy) {
      const hn = (sev) => row.hierarchy.findings.filter((f) => f.severity === sev).length;
      bits.push(`hierarchy ${hn(1)} sev 1, ${hn(2)} sev 2, ${hn(3)} sev 3`);
    }
    if (row.record) {
      const rc = row.record;
      bits.push(rc.error ? `record failed, ${rc.error}` : `record ${rc.seconds}s, ${rc.frames} frames, stopped at ${rc.stopped}, layout shift ${rc.layoutShift.total}, rendered in ${rc.renderSeconds}s`);
    }
    if (row.diff && !row.diff.missing) bits.push(`diff ${row.diff.changedPct}%${row.diff.sizeChanged ? ' size changed' : ''}${row.diff.box ? ` in [${row.diff.box.join(',')}]` : ''}`);
    console.log(`  ${row.route} @${row.width}  ${bits.length ? bits.join(' · ') : 'clean'}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
