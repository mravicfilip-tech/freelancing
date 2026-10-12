#!/usr/bin/env node
// Golden screens, one folder per client at clients/<client>/golden/.
// Each is <name>.png (full page at 1440) and <name>.json (url, date, page style fingerprint).
//
//   node scripts/golden.mjs add     --client <id> --name <name> --url <url> [--wait <ms>]
//   node scripts/golden.mjs list    --client <id>
//   node scripts/golden.mjs compare --client <id> --url <url> [--routes "a=/x,b=/y"] [--json] [--wait <ms>]
//
// The page fingerprint holds font sizes and families with counts, the colour palette with counts,
// the radius set, a spacing histogram, control heights and the shadow set. compare fingerprints the
// new pages and reports every value used that no golden screen uses, with its count and an example
// selector. Suggested severity, a new colour or font family is 2, a new size, radius, shadow, control
// height or spacing value is 3. Spacing needs 3 uses to count. Exit 0 always, 1 on a usage error.
// STUDIO_CLIENTS_DIR points at another clients folder, used by the tests. Desktop first, 1440 wide.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clientDir, driftFindings, launch, openPage, parseArgs, parseRoutes, read, routeUrl,
  safeName, toUrl, today, unionGolden, WIDTH,
} from './lib/style-fingerprint.mjs';

const USAGE = `usage
  golden.mjs add     --client <id> --name <name> --url <url>
  golden.mjs list    --client <id>
  golden.mjs compare --client <id> --url <url> [--routes "a=/x,b=/y"] [--json]`;

function goldens(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

// The examples are only useful for the page being checked, so a saved fingerprint keeps counts only.
const slim = (fp) => ({ elements: fp.elements, scrollHeight: fp.scrollHeight, maps: fp.maps });

async function add(a) {
  const name = safeName(a.name);
  if (!a.url || a.url === true) throw new Error('--url is required');
  const dir = clientDir(a.client, 'golden', { create: true });
  const browser = await launch();
  try {
    const page = await openPage(browser, toUrl(a.url), a.wait);
    const fp = await read(page, 'page');
    await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
    const item = { name, client: a.client, url: a.url, date: today(), width: WIDTH, fingerprint: slim(fp) };
    writeFileSync(join(dir, `${name}.json`), JSON.stringify(item, null, 2));
    const m = fp.maps;
    console.log(`added ${a.client}/${name}  ${fp.elements} elements, ${Object.keys(m.fontSizes).length} sizes, ${Object.keys(m.fontFamilies).length} families, ${Object.keys(m.colors).length} colours, ${Object.keys(m.radii).length} radii, ${Object.keys(m.shadows).length} shadows`);
    console.log(`  ${join(dir, name + '.png')}`);
  } finally {
    await browser.close();
  }
}

function list(a) {
  const all = goldens(clientDir(a.client, 'golden'));
  if (!all.length) { console.log(`${a.client} has no golden screens`); return; }
  for (const g of all) {
    const m = g.fingerprint.maps;
    console.log(`${g.name} | ${g.url} | ${g.date} | ${Object.keys(m.fontSizes).length} sizes, ${Object.keys(m.colors).length} colours, ${Object.keys(m.radii).length} radii`);
  }
}

async function compare(a) {
  const all = goldens(clientDir(a.client, 'golden'));
  if (!a.url || a.url === true) throw new Error('--url is required');
  const routes = a.routes && a.routes !== true ? parseRoutes(a.routes) : [{ name: 'page', path: null }];
  const result = { client: a.client, url: a.url, golden: all.map((g) => g.name), routes: [], findings: [] };
  if (!all.length) {
    result.note = 'no golden screens, add some first';
    if (a.json) console.log(JSON.stringify(result, null, 2)); else console.log(`${a.client} has no golden screens, add some first with golden.mjs add`);
    return;
  }
  const union = unionGolden(all);
  const browser = await launch();
  try {
    for (const r of routes) {
      const url = r.path === null ? toUrl(a.url) : routeUrl(a.url, r.path);
      const page = await openPage(browser, url, a.wait);
      const fp = await read(page, 'page');
      const findings = driftFindings(fp, union, r.name);
      result.routes.push({ route: r.name, url, elements: fp.elements, findings: findings.length });
      result.findings.push(...findings);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  result.counts = { sev2: result.findings.filter((f) => f.severity === 2).length, sev3: result.findings.filter((f) => f.severity === 3).length };
  if (a.json) { console.log(JSON.stringify(result, null, 2)); return; }
  console.log(`golden compare ${a.client}, ${all.length} golden screen${all.length === 1 ? '' : 's'} (${result.golden.join(', ')}), ${routes.length} page${routes.length === 1 ? '' : 's'}`);
  for (const r of result.routes) console.log(`${r.route} | ${r.elements} elements | ${r.findings} values no golden screen uses`);
  if (!result.findings.length) { console.log('no drift, every value is used by a golden screen'); return; }
  for (const f of result.findings) console.log(`sev ${f.severity} | ${f.route} | new ${f.kind} ${f.value} | ${f.count} use${f.count === 1 ? '' : 's'} | ${f.example || '-'}`);
  console.log(`${result.counts.sev2} suggested sev 2, ${result.counts.sev3} suggested sev 3`);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  try {
    if (cmd === 'add') await add(a);
    else if (cmd === 'list') list(a);
    else if (cmd === 'compare') await compare(a);
    else { console.error(USAGE); process.exitCode = 1; }
  } catch (e) {
    console.error(`golden.mjs ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
