#!/usr/bin/env node
// Walks a flow the way a person would and reports where it breaks.
//
//   node walk.mjs --url <base url or folder> --flow <flow.json> [--out <dir>] [--width 1440] [--height 900]
//                 Desktop first. Pass a phone width only when the client brief names it.
//
// A flow is
//   { "job": "...", "start": "/path", "steps": [
//       { "click": "visible text or aria label" },
//       { "fill": { "label": "Email", "value": "x" } },
//       { "select": { "label": "Country", "option": "Canada" } },
//       { "expect": "text that must appear" },
//       { "back": true } ] }
//
// Each step runs, then a full page screenshot is written to <out>/NN_<kind>.png. Step indexes are
// zero based and match the steps array. The first step that cannot find its target is a dead end
// and the walk stops there, because everything after it would be guesswork. A failed expect does
// not stop the walk. Results go to <out>/walk.json and one summary line is printed. Exit 0.
//
// Suggested severities, a dead end or a failed expect sev 1, a console error or a failed request sev 2.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs inside the page. Finds the element a step names and marks it data-walk-target.
// kind is click, field or option. Returns { found, name, tried } and never throws.
function locate(kind, wanted) {
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const w = norm(wanted);
  document.querySelectorAll('[data-walk-target]').forEach((e) => e.removeAttribute('data-walk-target'));
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const text = (el) => norm(el.innerText || el.textContent);
  const labelsOf = (el) => {
    const out = [];
    const lb = el.getAttribute('aria-labelledby');
    if (lb) out.push(lb.split(/\s+/).map((id) => { const n = document.getElementById(id); return n ? text(n) : ''; }).join(' '));
    out.push(el.getAttribute('aria-label'));
    if (el.labels) for (const l of el.labels) out.push(text(l));
    const wrap = el.closest('label');
    if (wrap && wrap !== el) out.push(text(wrap));
    out.push(el.getAttribute('placeholder'), el.getAttribute('name'), el.getAttribute('title'), el.id);
    return out.map(norm).filter(Boolean);
  };
  let pool, names;
  if (kind === 'click') {
    pool = [...document.querySelectorAll('a[href],button,summary,label,[role=button],[role=link],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=radio],[role=switch],input[type=submit],input[type=button],input[type=checkbox],input[type=radio],[onclick],[tabindex]:not([tabindex="-1"])')];
    names = (el) => [text(el), norm(el.getAttribute('aria-label')), norm(el.getAttribute('title')), norm(el.value && el.tagName === 'INPUT' ? el.value : ''), ...[...el.querySelectorAll('img[alt]')].map((i) => norm(i.alt))].filter(Boolean);
  } else if (kind === 'field') {
    pool = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),textarea,select,[role=combobox],[role=textbox],[contenteditable=true]')];
    names = labelsOf;
  } else {
    pool = [...document.querySelectorAll('[role=option],option,li,[role=menuitem],button,a')];
    names = (el) => [text(el), norm(el.value)].filter(Boolean);
  }
  pool = pool.filter((e) => kind === 'option' && e.tagName === 'OPTION' ? true : visible(e));
  const score = (el) => {
    let best = 0;
    for (const n of names(el)) {
      if (n === w) best = Math.max(best, 3);
      else if (n.startsWith(w)) best = Math.max(best, 2);
      else if (n.includes(w)) best = Math.max(best, 1);
    }
    return best;
  };
  const scored = pool.map((el) => ({ el, s: score(el) })).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s || text(a.el).length - text(b.el).length);
  const tried = pool.slice(0, 12).map((e) => (names(e)[0] || e.tagName.toLowerCase()).slice(0, 30));
  if (!scored.length) return { found: false, tried };
  const el = scored[0].el;
  el.setAttribute('data-walk-target', '1');
  return { found: true, name: (names(el)[0] || el.tagName.toLowerCase()).slice(0, 60), tag: el.tagName.toLowerCase(), optionValue: el.tagName === 'OPTION' ? el.value : null };
}

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.url || !a.flow) throw new Error('usage: walk.mjs --url <base> --flow <flow.json> [--out <dir>] [--width 1440] [--height 900]');
  const flow = JSON.parse(readFileSync(resolve(a.flow), 'utf8'));
  if (!Array.isArray(flow.steps)) throw new Error('flow needs a steps array');
  const out = resolve(a.out || 'walk');
  mkdirSync(out, { recursive: true });
  const base = /^https?:|^file:/.test(a.url) ? a.url.replace(/\/$/, '') : pathToFileURL(resolve(a.url)).href.replace(/\/$/, '');
  const start = flow.start || '/';
  const startUrl = base + (start.startsWith('/') ? start : '/' + start);

  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-core was not found. Run  npm i puppeteer-core  in ~/.claude/studio, or set PUPPETEER_CORE_PATH to an installed copy.');
  const CHROME = findBrowser();
  if (!CHROME) throw new Error('No Chrome or Edge was found. Install one, or set CHROME_PATH to its executable.');
  const t0 = Date.now();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
  const result = { job: flow.job || '', base, start, steps: [], clicks: 0, deadEnds: [], expectFailures: [], consoleErrors: [], failedRequests: [], findings: [], completed: false, stoppedAt: null, seconds: 0, at: new Date().toISOString() };
  let cur = -1; // step index the page events belong to, -1 is the first load
  const add = (severity, check, step, issue, detail) => result.findings.push({ check, severity, step, issue, ...(detail ? { detail } : {}) });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Number(a.width || 1440), height: Number(a.height || 900), deviceScaleFactor: 1 });
    page.on('console', (m) => { if (m.type() === 'error') { const t = m.text().slice(0, 200); if (!/Failed to load resource/.test(t)) result.consoleErrors.push({ step: cur, text: t }); } });
    page.on('pageerror', (e) => result.consoleErrors.push({ step: cur, text: String(e.message || e).slice(0, 200) }));
    page.on('requestfailed', (r) => { const u = r.url(); if (/favicon\.ico$/.test(u) || /^data:/.test(u)) return; const why = r.failure() ? r.failure().errorText : 'failed'; if (why === 'net::ERR_ABORTED') return; result.failedRequests.push({ step: cur, url: u.slice(0, 160), error: why }); });
    page.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) result.failedRequests.push({ step: cur, url: r.url().slice(0, 160), status: r.status() }); });

    const settle = async () => { await page.waitForNetworkIdle({ idleTime: 250, timeout: 4000 }).catch(() => {}); await sleep(150); };
    const shot = async (i, kind) => { const f = join(out, `${String(i + 1).padStart(2, '0')}_${kind}.png`); await page.screenshot({ path: f, fullPage: true }).catch(() => {}); return f; };
    const click = async () => { const h = await page.$('[data-walk-target]'); await h.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })); await h.click(); };

    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    result.startShot = await shot(-1, 'start');

    for (let i = 0; i < flow.steps.length; i++) {
      const s = flow.steps[i];
      cur = i;
      const kind = ['click', 'fill', 'select', 'expect', 'back'].find((k) => k in s) || 'unknown';
      const rec = { index: i, kind, target: null, ok: false };
      result.steps.push(rec);
      const st = Date.now();
      let dead = null;
      try {
        if (kind === 'click') {
          rec.target = String(s.click);
          const f = await page.evaluate(locate, 'click', rec.target);
          if (!f.found) dead = { reason: `no clickable element matches "${rec.target}"`, tried: f.tried };
          else { await click(); result.clicks++; rec.ok = true; rec.matched = f.name; await settle(); }
        } else if (kind === 'fill') {
          rec.target = s.fill && s.fill.label;
          const f = await page.evaluate(locate, 'field', rec.target || '');
          if (!f.found) dead = { reason: `no field matches label "${rec.target}"`, tried: f.tried };
          else {
            const h = await page.$('[data-walk-target]');
            await h.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
            await h.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await h.type(String(s.fill.value ?? ''));
            rec.ok = true; rec.matched = f.name; await settle();
          }
        } else if (kind === 'select') {
          rec.target = s.select && s.select.label;
          const wanted = s.select && s.select.option;
          const f = await page.evaluate(locate, 'field', rec.target || '');
          if (!f.found) dead = { reason: `no select matches label "${rec.target}"`, tried: f.tried };
          else if (f.tag === 'select') {
            const val = await page.evaluate((opt) => {
              const sel = document.querySelector('[data-walk-target]');
              const n = (x) => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim();
              const o = [...sel.options].find((x) => n(x.textContent) === n(opt) || n(x.value) === n(opt)) || [...sel.options].find((x) => n(x.textContent).includes(n(opt)));
              return o ? o.value : null;
            }, wanted);
            if (val === null) dead = { reason: `select "${rec.target}" has no option "${wanted}"` };
            else { await page.select('[data-walk-target]', val); rec.ok = true; rec.matched = f.name; await settle(); }
          } else {
            // A custom dropdown, open it and click the option by its text.
            await click();
            await sleep(200);
            const o = await page.evaluate(locate, 'option', wanted);
            if (!o.found) dead = { reason: `dropdown "${rec.target}" shows no option "${wanted}"`, tried: o.tried };
            else { await click(); result.clicks += 2; rec.ok = true; rec.matched = o.name; await settle(); }
          }
        } else if (kind === 'expect') {
          rec.target = String(s.expect);
          const want = rec.target.toLowerCase().replace(/\s+/g, ' ').trim();
          const hit = await page.waitForFunction((w) => (document.body.innerText || '').toLowerCase().replace(/\s+/g, ' ').includes(w), { timeout: 2500 }, want).then(() => true).catch(() => false);
          rec.ok = hit;
          if (!hit) {
            result.expectFailures.push({ index: i, expected: rec.target, url: page.url() });
            add(1, 'expect', i, `expected text did not appear, "${rec.target}"`, `page is ${page.url()}`);
          }
        } else if (kind === 'back') {
          await page.goBack({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
          rec.ok = true; await settle();
        } else {
          dead = { reason: `step has no known action, keys are ${Object.keys(s).join(', ') || 'none'}` };
        }
      } catch (e) {
        dead = { reason: `step failed, ${String(e.message || e).slice(0, 140)}` };
      }
      rec.ms = Date.now() - st;
      rec.url = page.url();
      rec.shot = await shot(i, kind);
      if (dead) {
        rec.ok = false; rec.note = dead.reason;
        result.deadEnds.push({ index: i, step: s, ...dead });
        add(1, 'dead end', i, dead.reason, dead.tried && dead.tried.length ? `on the page, ${dead.tried.join(' | ')}` : undefined);
        result.stoppedAt = i;
        break;
      }
    }
    result.completed = result.stoppedAt === null;
    result.finalUrl = page.url();
  } finally {
    await browser.close();
  }

  for (const c of result.consoleErrors) add(2, 'console', c.step, 'console error', c.text);
  for (const r of result.failedRequests) add(2, 'request', r.step, `failed request${r.status ? ` ${r.status}` : ''}`, `${r.url}${r.error ? `, ${r.error}` : ''}`);
  result.seconds = Math.round((Date.now() - t0) / 100) / 10;
  writeFileSync(join(out, 'walk.json'), JSON.stringify(result, null, 2));

  const n = (sev) => result.findings.filter((f) => f.severity === sev).length;
  console.log(`walk "${result.job}" ${result.steps.length}/${flow.steps.length} steps run, ${result.clicks} clicks, ${result.deadEnds.length} dead ends${result.stoppedAt !== null ? ` at step ${result.stoppedAt}` : ''}, ${result.expectFailures.length} failed expects, ${result.consoleErrors.length} console errors, ${result.failedRequests.length} failed requests, ${n(1)} sev 1, ${n(2)} sev 2, in ${result.seconds}s -> ${join(out, 'walk.json')}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
