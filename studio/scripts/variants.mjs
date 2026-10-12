#!/usr/bin/env node
// Captures numbered variants and composes one image so Filip can answer with a number.
//
//   node variants.mjs --urls "1=<url>,2=<url>,3=<url>" --out <png> [--selector <css>] [--width 1440]
//                     [--height 900] [--wait <ms>] [--cell 900]
//                     Desktop first. Pass a phone width only when the client brief names it.
//
// Each variant is captured as the full page, or as the one element that --selector matches. The
// browser composes the sheet itself, an html page holding the captures as data URIs, and
// screenshots it. No image library. One to three variants sit in a row, four or more in a grid of
// three columns. Every variant gets a large number label above it. A capture taller than 3000px
// is cropped to its top 3000px in the sheet only, the capture itself is not changed.
// Prints the output path.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
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
const MAX_CELL_HEIGHT = 3000;

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

// "1=url,2=url". A label is the text before the first "=", and a new entry starts at a comma that
// is followed by a label and "=". A comma inside a url survives.
function parseUrls(text) {
  const parts = String(text).split(/,(?=[^,=/?#:]+=)/);
  return parts.map((p) => {
    const i = p.indexOf('=');
    if (i < 1) throw new Error(`bad --urls entry "${p}", expected label=url`);
    return { label: p.slice(0, i).trim(), url: p.slice(i + 1).trim() };
  });
}

const toUrl = (u) => (/^(https?|file):/i.test(u) ? u : pathToFileURL(resolve(u)).href);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.urls || !a.out) throw new Error('usage: variants.mjs --urls "1=<url>,2=<url>" --out <png> [--selector css] [--width 1440] [--height 900] [--wait ms] [--cell 900]');
  const variants = parseUrls(a.urls);
  if (!variants.length) throw new Error('no variants in --urls');
  const width = Number(a.width || 1440), height = Number(a.height || 900), cell = Number(a.cell || 900);
  const out = resolve(a.out);
  mkdirSync(dirname(out), { recursive: true });

  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-core was not found. Run  npm i puppeteer-core  in ~/.claude/studio, or set PUPPETEER_CORE_PATH to an installed copy.');
  const CHROME = findBrowser();
  if (!CHROME) throw new Error('No Chrome or Edge was found. Install one, or set CHROME_PATH to its executable.');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
  const missed = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const shots = [];
    for (const v of variants) {
      await page.goto(toUrl(v.url), { waitUntil: 'networkidle0', timeout: 30000 });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      if (Number(a.wait) > 0) await new Promise((r) => setTimeout(r, Number(a.wait)));
      let buf;
      if (a.selector) {
        const el = await page.$(a.selector);
        if (!el) { missed.push(v.label); shots.push({ ...v, missing: true }); continue; }
        buf = await el.screenshot({ type: 'png' });
      } else {
        buf = await page.screenshot({ type: 'png', fullPage: true });
      }
      shots.push({ ...v, data: 'data:image/png;base64,' + Buffer.from(buf).toString('base64') });
    }

    const cols = shots.length <= 3 ? shots.length : 3;
    const gap = 48, pad = 48;
    const sheetW = pad * 2 + cols * cell + (cols - 1) * gap;
    const cells = shots.map((s) => `<figure><div class="n">${esc(s.label)}</div>${s.missing
      ? `<div class="miss">no match for ${esc(a.selector)}</div>`
      : `<div class="frame"><img src="${s.data}"></div>`}</figure>`).join('');
    const html = `<!doctype html><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;background:#f4f4f5;font-family:Arial,sans-serif}
      .sheet{width:${sheetW}px;padding:${pad}px;display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:${gap}px;align-items:start}
      figure{margin:0}.n{font-size:140px;line-height:1;font-weight:700;color:#111;margin:0 0 20px}
      .frame{width:${cell}px;max-height:${MAX_CELL_HEIGHT}px;overflow:hidden;background:#fff;border:2px solid #111}
      img{display:block;width:100%;height:auto}.miss{padding:24px;border:2px dashed #b00;color:#b00;font-size:24px}
    </style><div class="sheet">${cells}</div>`;
    const sheet = await browser.newPage();
    await sheet.setViewport({ width: sheetW, height: 800, deviceScaleFactor: 1 });
    await sheet.setContent(html, { waitUntil: 'load' });
    await sheet.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null))));
    await sheet.screenshot({ path: out, fullPage: true });
  } finally {
    await browser.close();
  }
  if (missed.length) console.error(`no element matched ${a.selector} for variant ${missed.join(', ')}`);
  console.log(out);
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
