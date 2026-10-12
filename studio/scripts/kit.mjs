#!/usr/bin/env node
// The approved component kit, one folder per client at clients/<client>/kit/.
// Each item is <name>.png (the element at 1440) and <name>.json (source, url, date, note, style fingerprint).
//
//   node scripts/kit.mjs add   --client <id> --name <name> --url <url> --selector <css>
//                              [--repo <path> --file <src path>] [--note <text>] [--wait <ms>]
//   node scripts/kit.mjs list  --client <id>
//   node scripts/kit.mjs show  --client <id> --name <name>
//   node scripts/kit.mjs match --client <id> --url <url> [--routes "a=/x,b=/y"] [--json]
//
// match finds controls on a page that look like a kit item (same role, similar size) but whose
// style fingerprint differs, so the review can report them. Exit 0 always for match, 1 on a usage
// error. STUDIO_CLIENTS_DIR points the kit at another clients folder, used by the tests.
// Desktop first, 1440 wide. No phone widths unless the client brief names them.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clientDir, diffFingerprints, launch, openPage, parseArgs, parseRoutes, read, routeUrl, safeName,
  sameRole, severityForProps, similarSize, toUrl, today, WIDTH,
} from './lib/style-fingerprint.mjs';

const USAGE = `usage
  kit.mjs add   --client <id> --name <name> --url <url> --selector <css> [--repo <path> --file <src path>] [--note <text>]
  kit.mjs list  --client <id>
  kit.mjs show  --client <id> --name <name>
  kit.mjs match --client <id> --url <url> [--routes "a=/x,b=/y"] [--json]`;

const HOVER_PROPS = ['color', 'background', 'border', 'radius', 'shadow', 'textTransform'];

function items(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

async function add(a) {
  const name = safeName(a.name);
  if (!a.url || a.url === true) throw new Error('--url is required');
  if (!a.selector || a.selector === true) throw new Error('--selector is required');
  const dir = clientDir(a.client, 'kit', { create: true });
  const browser = await launch();
  try {
    const page = await openPage(browser, toUrl(a.url), a.wait);
    const base = await read(page, 'element', a.selector);
    if (!base) throw new Error(`selector "${a.selector}" matches nothing at ${a.url}`);
    // The first visible match, the same one the reader picked.
    let target = null;
    for (const h of await page.$$(a.selector)) { const b = await h.boundingBox(); if (b && b.width > 0 && b.height > 0) { target = h; break; } }
    if (!target) throw new Error(`selector "${a.selector}" has no visible match`);
    await target.screenshot({ path: join(dir, `${name}.png`) });

    // Hover style, only the properties that change. Transitions need a moment to settle.
    let hover = null;
    try {
      await target.hover();
      await new Promise((r) => setTimeout(r, 400));
      const hovered = await read(page, 'element', a.selector);
      const changed = diffFingerprints(base.fp, hovered.fp, HOVER_PROPS);
      if (changed.length) hover = Object.fromEntries(changed.map((d) => [d.prop, d.found]));
      await page.mouse.move(0, 0);
    } catch { /* an element that cannot be hovered has no hover style */ }

    const src = a.repo || a.file ? { repo: a.repo || null, file: a.file || null } : null;
    let warning = null;
    if (src && src.repo && src.file && !existsSync(resolve(String(src.repo), String(src.file)))) warning = `source file not found at ${resolve(String(src.repo), String(src.file))}`;
    const item = {
      name, client: a.client, url: a.url, selector: a.selector, date: today(), width: WIDTH,
      source: src, note: a.note && a.note !== true ? a.note : null,
      role: base.role, tag: base.tag, text: base.text, fingerprint: base.fp, hover,
    };
    writeFileSync(join(dir, `${name}.json`), JSON.stringify(item, null, 2));
    console.log(`added ${a.client}/${name}  ${base.role} ${base.fp.width} by ${base.fp.height}  ${base.fp.fontSize}/${base.fp.fontWeight}  bg ${base.fp.background}  radius ${base.fp.radius}${hover ? '  hover ' + Object.keys(hover).join(',') : ''}`);
    console.log(`  ${join(dir, name + '.png')}`);
    if (warning) console.log(`  warning ${warning}`);
  } finally {
    await browser.close();
  }
}

function list(a) {
  const dir = clientDir(a.client, 'kit');
  const all = items(dir);
  if (!all.length) { console.log(`${a.client} kit is empty`); return; }
  for (const k of all) {
    const f = k.fingerprint;
    console.log(`${k.name} | ${k.role} | ${f.width} by ${f.height} | ${f.fontSize}/${f.fontWeight} | bg ${f.background} | radius ${f.radius} | ${k.date}${k.source && k.source.file ? ' | ' + k.source.file : ''}`);
  }
}

function show(a) {
  const dir = clientDir(a.client, 'kit');
  const file = join(dir, `${safeName(a.name)}.json`);
  if (!existsSync(file)) throw new Error(`no kit item "${a.name}" for ${a.client}`);
  console.log(readFileSync(file, 'utf8').trimEnd());
}

// Pure so it can be tested without a browser. controls is the list read from the page.
export function matchControls(kit, controls, route = null) {
  const differing = [];
  const exact = [];
  for (const k of kit) {
    for (const c of controls) {
      if (!sameRole(k.role, c.role) || !similarSize(k.fingerprint, c.fp)) continue;
      const diffs = diffFingerprints(k.fingerprint, c.fp);
      const row = { route, kit: k.name, selector: c.selector, text: c.text, role: c.role, size: `${c.fp.width} by ${c.fp.height}`, diffs, severity: diffs.length ? severityForProps(diffs) : null };
      (diffs.length ? differing : exact).push(row);
    }
  }
  // One control can resemble several kit items. Keep the closest one, the fewest differences.
  const best = new Map();
  for (const r of differing) {
    const key = `${r.route}|${r.selector}|${r.text}`;
    const cur = best.get(key);
    if (!cur || r.diffs.length < cur.diffs.length) best.set(key, r);
  }
  const exactKeys = new Set(exact.map((r) => `${r.route}|${r.selector}|${r.text}`));
  const kept = [...best.values()].filter((r) => !exactKeys.has(`${r.route}|${r.selector}|${r.text}`));
  return { differing: kept, exact };
}

async function match(a) {
  const dir = clientDir(a.client, 'kit');
  const kit = items(dir);
  if (!kit.length) throw new Error(`${a.client} kit is empty, add items first`);
  if (!a.url || a.url === true) throw new Error('--url is required');
  const routes = a.routes && a.routes !== true ? parseRoutes(a.routes) : [{ name: 'page', path: null }];
  const browser = await launch();
  const result = { client: a.client, url: a.url, kitItems: kit.length, routes: [] };
  try {
    for (const r of routes) {
      const url = r.path === null ? toUrl(a.url) : routeUrl(a.url, r.path);
      const page = await openPage(browser, url, a.wait);
      const controls = await read(page, 'controls');
      const m = matchControls(kit, controls, r.name);
      result.routes.push({ route: r.name, url, controls: controls.length, matchedExactly: m.exact.length, differing: m.differing });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  result.differing = result.routes.flatMap((r) => r.differing);
  if (a.json) { console.log(JSON.stringify(result, null, 2)); return; }
  console.log(`kit match ${a.client}, ${kit.length} kit items, ${result.routes.length} page${result.routes.length === 1 ? '' : 's'}`);
  for (const r of result.routes) {
    console.log(`${r.route} | ${r.controls} controls | ${r.matchedExactly} match a kit item | ${r.differing.length} differ`);
    for (const d of r.differing) {
      console.log(`  sev ${d.severity} | ${d.selector}${d.text ? ` "${d.text}"` : ''} looks like kit "${d.kit}" (${d.size})`);
      for (const x of d.diffs) console.log(`    ${x.prop} kit ${x.kit} found ${x.found}`);
    }
  }
  if (!result.differing.length) console.log('no control differs from a kit item it resembles');
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  try {
    if (cmd === 'add') await add(a);
    else if (cmd === 'list') list(a);
    else if (cmd === 'show') show(a);
    else if (cmd === 'match') await match(a);
    else { console.error(USAGE); process.exitCode = 1; }
  } catch (e) {
    console.error(`kit.mjs ${e.message}`);
    process.exitCode = 1;
  }
}

// Run only when called as a script, so the tests can import matchControls.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
