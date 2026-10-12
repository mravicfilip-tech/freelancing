// Run with  node scripts/test/pack.test.mjs
// Covers shoot.mjs contact.png and report.compact.txt, the compact form, the taste filter and pack.mjs.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compactReport } from '../lib/compact-report.mjs';
import { filterTaste } from '../pack.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = resolve(HERE, '..');
const FIX = join(HERE, 'fixtures');
const root = mkdtempSync(join(tmpdir(), 'pack-'));
const sh = (script, list, env = {}) => spawnSync('node', [join(SCRIPTS, script), ...list], { encoding: 'utf8', env: { ...process.env, ...env } });
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

// ---- shots, a dense page plus five small ones (six routes, so the sheet has two columns), interact on
const shots = join(root, 'shots', 'after');
const routes = 'dense=/dense.html,bad=/hier-bad.html,clean=/clean.html,hierok=/hier-good.html,bad2=/bad.html,clean2=/clean.html';
const r = sh('shoot.mjs', ['--url', FIX, '--routes', routes, '--out', shots, '--interact']);
assert.equal(r.status, 0, r.stderr || r.stdout);
const rawText = readFileSync(join(shots, 'report.json'), 'utf8');
const report = JSON.parse(rawText);
const compact = readFileSync(join(shots, 'report.compact.txt'), 'utf8');

test('contact sheet exists, is one png, 1920 wide, and holds every route', () => {
  const png = readFileSync(join(shots, 'contact.png'));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1920);
  assert.ok(png.readUInt32BE(20) > 600);
  assert.deepEqual(readdirSync(shots).filter((f) => /^contact/.test(f)), ['contact.png']);
});

test('report.json keeps its shape, interact and hierarchy still there', () => {
  assert.equal(report.routes.length, 6);
  assert.ok(report.routes.every((x) => x.interact && x.hierarchy));
  assert.ok(Array.isArray(report.routes[0].contrast) && Array.isArray(report.routes[0].type));
});

test('compact report is under 15 percent of the raw size on the dense fixture', () => {
  const dense = { ...report, routes: report.routes.filter((x) => x.route === 'dense') };
  const raw = JSON.stringify(dense, null, 2).length;
  const c = compactReport(dense).length;
  console.log(`    dense route raw ${raw} chars, compact ${c} chars, ${(c / raw * 100).toFixed(1)}%`);
  assert.ok(c < raw * 0.15, `${c} of ${raw}`);
  assert.ok(compact.length < rawText.length * 0.15, `${compact.length} of ${rawText.length}`);
});

test('compact report has one line per route and no raw element dumps', () => {
  for (const x of report.routes) assert.ok(compact.split('\n').some((l) => l.startsWith(`${x.route} @${x.width} `)), x.route);
  assert.ok(!/"el":|rgb\(/.test(compact));
});

test('no finding appears twice, not in a line and not across interact and hierarchy', () => {
  const lines = compact.split('\n').filter((l) => /^ {2}s\d /.test(l));
  assert.ok(lines.length > 5);
  let seen = new Set();
  for (const l of compact.split('\n')) {
    if (!l.startsWith('  ')) { seen = new Set(); continue; }
    assert.ok(!seen.has(l), `duplicate line ${l}`);
    seen.add(l);
  }
  const f = { check: 'name', severity: 2, el: 'button.x', issue: 'control has no accessible name' };
  const synthetic = { url: 'u', widths: [1440], interact: true, routes: [{ route: 'r', path: '/r', width: 1440, contrast: [], type: [], targets: [], focus: [], console: [], overflow: false, interact: { findings: [f], errors: [] }, hierarchy: { views: [], headings: { h1: 1 }, unnamed: [1], findings: [{ ...f }] } }] };
  const out = compactReport(synthetic);
  assert.equal(out.split('\n').filter((l) => l.includes('control has no accessible name')).length, 1);
  assert.match(out, /s1 0 s2 1 s3 0/);
});

// ---- taste filter
const TASTE = [
  '# T',
  '- **2026-10-10 10:00, Dashboard empty state, variant 2 picked.** ACCEPTED APP-WIDE. Said: "go with 2". Carry forward: empty states are 16px.',
  '- **2026-10-09 10:00, Funds table row height.** ACCEPTED. Said: "tighter rows". Carry forward: 40px rows.',
  '- **2026-10-08 10:00, Wiki nav link bar.** REJECTED. Said: "no bar". Carry forward: no inset bar.',
  '- **2026-10-07 10:00, Sidebar badge colour.** ACCEPTED. Said: "keep it". Carry forward: badges are grey.',
  '- **2026-08-01 10:00, Old header look.** ACCEPTED, SUPERSEDED 2026-09-01 by a later call. Carry forward: none.',
  '- **2026-10-06 10:00, Modal scrim.** REJECTED APP-WIDE. Said: "never blue". Carry forward: scrim is neutral.',
  '- **2026-07-01 10:00, Funds export button.** REJECTED. Said: "garbage". Carry forward: no export button on funds.',
].join('\n');

test('taste filter keeps app wide and surface entries, drops unrelated ones', () => {
  const t = filterTaste(TASTE, new Set(['funds', 'table']), new Date('2026-10-12T00:00:00'));
  const titles = t.keep.map((e) => e.title);
  assert.ok(titles.some((x) => /empty state/.test(x)), 'app wide accepted');
  assert.ok(titles.some((x) => /Modal scrim/.test(x)), 'app wide rejected is a rule');
  assert.ok(titles.some((x) => /Funds table row/.test(x)), 'surface match');
  assert.ok(titles.some((x) => /Funds export/.test(x)), 'old rejected but on the surface');
  assert.ok(!titles.some((x) => /Wiki nav/.test(x)), 'unrelated rejected');
  assert.ok(!titles.some((x) => /Sidebar badge/.test(x)), 'unrelated accepted');
  assert.ok(!titles.some((x) => /Old header/.test(x)), 'superseded over 30 days');
  assert.equal(t.total, 7);
});

// ---- pack.mjs on a seeded repo
const repo = join(root, 'repo');
const g = (...a) => { const x = spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8' }); assert.equal(x.status, 0, x.stderr); return x.stdout.trim(); };
mkdirSync(join(repo, 'src', 'pages'), { recursive: true });
mkdirSync(join(repo, 'src', 'styles'), { recursive: true });
mkdirSync(join(repo, 'src', 'lib'), { recursive: true });
const css = (n, pad) => Array.from({ length: n }, (_, i) => `.r${i} { padding: ${pad}px; margin: 4px; }`).join('\n') + '\n';
const put = (p, t) => writeFileSync(join(repo, p), t);
g('init', '-q'); g('config', 'user.email', 't@t'); g('config', 'user.name', 't');
put('src/pages/Funds.css', css(40, 8)); put('src/styles/tokens.css', ':root {\n  --a: 1px;\n}\n'); put('src/pages/Home.css', css(300, 8)); put('src/lib/util.ts', 'export const x = 1;\n'); put('package-lock.json', '{}\n');
g('add', '-A'); g('commit', '-q', '-m', 'base');
const base = g('rev-parse', 'HEAD');
put('src/pages/Funds.css', css(40, 7)); put('src/styles/tokens.css', ':root {\n  --a: 2px;\n  --b: 3px;\n}\n'); put('src/pages/Home.css', css(300, 9)); put('src/lib/util.ts', 'export const x = 2;\n'); put('package-lock.json', '{"a":1}\n');
const clients = join(root, 'clients');
mkdirSync(join(clients, 'tc'), { recursive: true });
writeFileSync(join(clients, 'tc', 'taste.md'), TASTE);
const env = { STUDIO_CLIENTS_DIR: clients };
const packArgs = (out, extra = []) => ['--task', 'T-1', '--repo', repo, '--base', base, '--client', 'tc', '--shots', join(root, 'shots'), '--surface', 'Funds table spacing', '--out', out, ...extra];

test('pack writes pack.md in order, copies contact.png, prints sizes', () => {
  const out = join(root, 'out1');
  const p = sh('pack.mjs', packArgs(out), env);
  assert.equal(p.status, 0, p.stderr || p.stdout);
  const md = readFileSync(join(out, 'pack.md'), 'utf8');
  const order = ['# Diff pack', '## Diff stat and status', '## Hunks', '## Base layout block', '## Shots', '## Taste entries that apply'].map((h) => md.indexOf(h));
  assert.ok(order.every((n) => n >= 0), JSON.stringify(order));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(existsSync(join(out, 'contact.png')));
  assert.match(p.stdout, /hunks\s+\d+ chars\s+~\s*\d+ tokens/);
  assert.match(p.stdout, /total\s+\d+ chars/);
  assert.ok(md.includes('### src/pages/Funds.css') && md.includes('### src/styles/tokens.css'));
  assert.ok(!md.includes('### package-lock.json'), 'lock file has no hunk');
  assert.ok(/Stat only[\s\S]*src\/lib\/util\.ts/.test(md), 'plain file is stat only');
  assert.ok(md.includes('dense @1440'), 'compact shot report is in');
  assert.ok(md.includes('Modal scrim') && !md.includes('Wiki nav link bar'), 'taste filtered');
});

test('over budget, hunks are trimmed first and the left out files are listed', () => {
  const out = join(root, 'out2');
  const full = readFileSync(join(root, 'out1', 'pack.md'), 'utf8').length;
  const p = sh('pack.mjs', packArgs(out, ['--budget', String(full - 4000)]), env);
  assert.equal(p.status, 0, p.stderr || p.stdout);
  const md = readFileSync(join(out, 'pack.md'), 'utf8');
  assert.match(md, /Left out for the \d+ character budget/);
  assert.match(md, /- src\/pages\/Home\.css, \d+ changed lines/);
  assert.ok(md.includes('### src/pages/Funds.css'), 'the named file stays');
  assert.ok(md.includes('## Base layout block') && md.includes('## Taste entries that apply') && md.includes('## Shots'), 'other sections stay');
  assert.match(p.stdout, /hunks left out 1, src\/pages\/Home\.css/);
});

console.log(`\n${passed} passed`);
