#!/usr/bin/env node
// Captures every screen of a project at 1920 wide and builds one board to look at, the way Filip
// asked on 12 Oct 2026 for any project with more than 5 screens.
//
//   node board.mjs --url <base url or folder> --routes "Name=/path,Name2=/path2" --out <dir>
//                  [--title <project>] [--width 1920] [--height 1080] [--wait <ms>]
//                  Desktop first. Pass a phone width only when the client brief names it.
//                  A width under 1280 is refused.
//
// Writes into <out>
//   01-name.png ...   each screen, full page, in route order
//   board.html        self contained page, a labelled grid of thumbnails, the screen name and path
//                     under each, a click opens the full size view, arrow keys step to the next and
//                     previous screen, Escape closes, and the capture date sits in the header
//   board.png         the grid as one image, for chat
//
// With no --routes the start page is read for same site links. A folder base starts at its
// index.html, a web base starts at "/". The start page is screen one, then each link in page order,
// and the routes found are printed so they can be checked. At most 30 are taken.
//
// A screen that fails to load stays on the board as a red tile and the exit code is 1. Prints the
// out paths and the screen count. Exit 0 when every screen was captured, 1 when one failed, 2 on a
// usage error.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const MAX_DISCOVERED = 30;
const MAX_HEIGHT = 16000;

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'screen';

// Split at the first "=" only, so a query string like ?tab=funds survives. Same rule as shoot.mjs.
function parseRoutes(text) {
  return String(text).split(',').map((r) => {
    const i = r.indexOf('=');
    const name = i < 0 ? r : r.slice(0, i);
    const path = i < 0 ? '' : r.slice(i + 1);
    return { name: name.trim(), path: (path || '/').trim() };
  }).filter((r) => r.name);
}

const isFile = (u) => /^file:/i.test(u);
const joinUrl = (base, path) => base + (path.startsWith('/') ? path : '/' + path);

// Runs in the page. Same site anchors in page order, as absolute urls with their text.
function readLinks() {
  return [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ') }));
}

async function discover(page, base) {
  const start = isFile(base) ? base + '/index.html' : base + '/';
  await page.goto(start, { waitUntil: 'networkidle0', timeout: 30000 });
  const title = await page.title();
  const links = await page.evaluate(readLinks);
  const baseUrl = new URL(base + '/');
  const basePath = baseUrl.pathname;
  const seen = new Map();
  const add = (url, name) => {
    const rel = '/' + url.pathname.slice(basePath.length) + url.search;
    if (!seen.has(rel)) seen.set(rel, { name, path: rel });
  };
  add(new URL(start), title.trim().slice(0, 40) || 'Start');
  for (const l of links) {
    let u;
    try { u = new URL(l.href); } catch { continue; }
    const inside = u.origin === baseUrl.origin && u.pathname.startsWith(basePath);
    if (!inside || /\.(pdf|png|jpe?g|gif|svg|webp|zip|css|js|json|ico|woff2?|mp4)$/i.test(u.pathname)) continue;
    add(u, l.text.slice(0, 40) || slug(u.pathname.split('/').pop() || 'screen'));
  }
  const routes = [...seen.values()];
  const names = new Map();
  for (const r of routes) {
    const n = (names.get(r.name) || 0) + 1;
    names.set(r.name, n);
    if (n > 1) r.name = `${r.name} ${n}`;
  }
  return { start, routes: routes.slice(0, MAX_DISCOVERED), truncated: routes.length > MAX_DISCOVERED };
}

function boardHtml({ title, width, date, shots }) {
  const tiles = shots.map((s, i) => `<figure class="tile" data-i="${i}">
<button class="thumb" type="button" aria-label="Open ${esc(s.name)} full size">${s.error
    ? `<span class="fail">Capture failed. ${esc(s.error)}</span>`
    : `<img src="${esc(s.file)}" alt="${esc(s.name)}">`}</button>
<figcaption><b>${String(i + 1).padStart(2, '0')} ${esc(s.name)}</b><span>${esc(s.path)}</span></figcaption>
</figure>`).join('\n');
  const data = JSON.stringify(shots.map((s) => ({ name: s.name, path: s.path, file: s.error ? null : s.file }))).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} board</title>
<style>
:root{--bg:#f4f6f8;--surface:#fff;--text:#0b1a2a;--sub:#4a5a6a;--border:#cfd6de;--accent:#274291;--bad:#b00020}
@media (prefers-color-scheme:dark){:root{--bg:#06121f;--surface:#0e1d2e;--text:#eef2f6;--sub:#b6c2cf;--border:#2a3d54;--accent:#9fb4ff;--bad:#ff8a9b}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1840px;margin:0 auto;padding:40px 40px 64px}
h1{font-size:32px;line-height:1.2;margin:0 0 4px}.meta{color:var(--sub);margin:0 0 28px;font-size:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:28px;align-items:start}
.tile{margin:0}
.thumb{display:flex;align-items:flex-start;width:100%;aspect-ratio:16/10;padding:0;overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:8px;cursor:zoom-in}
.thumb:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.thumb img{display:block;flex:none;width:100%;height:auto}
.fail{display:block;padding:24px;color:var(--bad);font-size:16px;text-align:left}
figcaption{margin-top:10px;display:flex;flex-direction:column;gap:2px}figcaption b{font-size:18px}figcaption span{color:var(--sub);font-size:15px;word-break:break-all}
.viewer{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;background:rgba(0,0,0,.88)}
.viewer[hidden]{display:none}
.bar{display:flex;align-items:center;gap:16px;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.bar .cap{flex:1;font-size:16px}.bar .cap span{color:var(--sub);margin-left:10px}
.bar button{font:inherit;font-size:16px;min-height:36px;padding:4px 16px;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:6px;cursor:pointer}
.bar button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.scroll{flex:1;overflow:auto}.scroll img{display:block;width:100%;height:auto;cursor:zoom-out}.scroll img.actual{width:auto;max-width:none;cursor:zoom-in}
.hint{color:var(--sub);font-size:15px;margin:0 0 20px}
</style></head><body><main>
<h1>${esc(title)}</h1>
<p class="meta">${shots.length} screens · ${width}px wide · captured ${esc(date)}</p>
<p class="hint">Click a screen to open it full size. Use the left and right arrow keys to move between screens and Escape to close.</p>
<div class="grid">
${tiles}
</div></main>
<div class="viewer" id="viewer" hidden role="dialog" aria-modal="true" aria-label="Screen view">
<div class="bar"><div class="cap" id="cap"></div><button type="button" id="prev">Previous</button><button type="button" id="next">Next</button><button type="button" id="close">Close</button></div>
<div class="scroll"><img id="full" alt=""></div></div>
<script>
const S=${data};let at=0;
const v=document.getElementById('viewer'),img=document.getElementById('full'),cap=document.getElementById('cap');
function show(i){at=(i+S.length)%S.length;const s=S[at];img.className='';img.alt=s.name;if(s.file){img.hidden=false;img.src=s.file;}else{img.hidden=true;}
cap.innerHTML='';const b=document.createElement('b');b.textContent=(at+1)+' of '+S.length+'  '+s.name;const p=document.createElement('span');p.textContent=s.path;cap.append(b,p);v.querySelector('.scroll').scrollTop=0;}
function openAt(i){v.hidden=false;show(i);document.getElementById('close').focus();}
function close(){const t=document.querySelector('.tile[data-i="'+at+'"] .thumb');v.hidden=true;if(t)t.focus();}
document.querySelectorAll('.tile').forEach(t=>t.querySelector('.thumb').addEventListener('click',()=>openAt(Number(t.dataset.i))));
document.getElementById('prev').addEventListener('click',()=>show(at-1));
document.getElementById('next').addEventListener('click',()=>show(at+1));
document.getElementById('close').addEventListener('click',close);
img.addEventListener('click',()=>img.classList.toggle('actual'));
document.addEventListener('keydown',e=>{if(v.hidden)return;if(e.key==='ArrowRight'){e.preventDefault();show(at+1);}else if(e.key==='ArrowLeft'){e.preventDefault();show(at-1);}else if(e.key==='Escape'){close();}});
</script>
</body></html>`;
}

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.url || !a.out) throw new Error('usage: board.mjs --url <base url or folder> [--routes "Name=/path,..."] --out <dir> [--title <project>] [--width 1920] [--height 1080] [--wait ms]');
  const width = Number(a.width || 1920), height = Number(a.height || 1080);
  if (!(width >= 1280)) throw new Error(`width ${a.width} refused, the board is desktop only, 1280 or wider`);
  const out = resolve(a.out);
  mkdirSync(dirname(resolve(out, 'board.html')), { recursive: true });
  const base = /^https?:|^file:/i.test(a.url) ? a.url.replace(/\/$/, '') : pathToFileURL(resolve(a.url)).href.replace(/\/$/, '');
  if (!/^(https?|file):/i.test(base)) throw new Error(`bad --url ${a.url}`);
  const title = typeof a.title === 'string' ? a.title : 'Screen board';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-core was not found. Run  npm i puppeteer-core  in ~/.claude/studio, or set PUPPETEER_CORE_PATH to an installed copy.');
  const CHROME = findBrowser();
  if (!CHROME) throw new Error('No Chrome or Edge was found. Install one, or set CHROME_PATH to its executable.');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
  const shots = [];
  let failed = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    let routes;
    if (typeof a.routes === 'string' && a.routes.trim()) {
      routes = parseRoutes(a.routes);
    } else {
      const found = await discover(page, base);
      routes = found.routes;
      console.log(`routes found from ${found.start}, ${routes.length}${found.truncated ? ` (first ${MAX_DISCOVERED} kept)` : ''}`);
      for (const r of routes) console.log(`  ${r.name}=${r.path}`);
    }
    if (!routes.length) throw new Error('no routes to capture');

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const file = `${String(i + 1).padStart(2, '0')}-${slug(r.name)}.png`;
      const row = { name: r.name, path: r.path, file };
      try {
        const res = await page.goto(joinUrl(base, r.path), { waitUntil: 'networkidle0', timeout: 30000 });
        if (res && res.status() >= 400) throw new Error(`HTTP ${res.status()}`);
        await page.evaluate(() => document.fonts && document.fonts.ready);
        if (Number(a.wait) > 0) await new Promise((x) => setTimeout(x, Number(a.wait)));
        const full = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
        const opts = { path: resolve(out, file), type: 'png' };
        if (full > MAX_HEIGHT) Object.assign(opts, { clip: { x: 0, y: 0, width, height: MAX_HEIGHT }, captureBeyondViewport: true });
        else opts.fullPage = true;
        await page.screenshot(opts);
        row.height = Math.min(full, MAX_HEIGHT);
      } catch (e) {
        row.error = String(e.message || e).split('\n')[0].slice(0, 120);
        failed++;
      }
      shots.push(row);
    }

    const htmlFile = resolve(out, 'board.html');
    writeFileSync(htmlFile, boardHtml({ title, width, date, shots }));

    // The overview image is the board page itself, so the picture and the page never disagree.
    const sheet = await browser.newPage();
    await sheet.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
    await sheet.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await sheet.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load', timeout: 30000 });
    await sheet.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null))));
    await sheet.screenshot({ path: resolve(out, 'board.png'), fullPage: true });
  } finally {
    await browser.close();
  }

  console.log(`board.html ${resolve(out, 'board.html')}`);
  console.log(`board.png ${resolve(out, 'board.png')}`);
  console.log(`${shots.length} screens at ${width}px${failed ? `, ${failed} failed` : ''}`);
  if (failed) { for (const s of shots) if (s.error) console.error(`failed ${s.name} ${s.path}, ${s.error}`); process.exit(1); }
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
