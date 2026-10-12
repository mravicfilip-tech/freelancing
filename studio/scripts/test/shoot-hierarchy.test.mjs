// Run with  node scripts/test/shoot-hierarchy.test.mjs
// Drives shoot.mjs --interact over two fixtures and checks the hierarchy block.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOOT = resolve(HERE, '..', 'shoot.mjs');
const FIXTURES = join(HERE, 'fixtures');
const root = mkdtempSync(join(tmpdir(), 'shoot-hier-'));

const t0 = Date.now();
const r = spawnSync('node', [SHOOT, '--url', FIXTURES, '--routes', 'bad=/hier-bad.html,good=/hier-good.html', '--out', root, '--interact'], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stderr || r.stdout);
const report = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8'));
const secs = Math.round((Date.now() - t0) / 100) / 10;
const rowOf = (n) => report.routes.find((x) => x.route === n);
const bad = rowOf('bad').hierarchy, good = rowOf('good').hierarchy;
const has = (list, check, severity, re) => list.some((f) => f.check === check && f.severity === severity && re.test(`${f.issue} ${f.detail || ''} ${f.el}`));

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

test('hierarchy block sits on each route, interact block still there', () => {
  assert.ok(bad && good);
  assert.ok(rowOf('bad').interact && rowOf('good').interact);
  assert.ok(Array.isArray(bad.findings) && Array.isArray(rowOf('bad').interact.findings));
});

test('bad page, two filled primaries in one view is sev 2', () => {
  assert.equal(bad.views[0].view, 'page');
  assert.equal(bad.views[0].primaries, 2, JSON.stringify(bad.views));
  assert.ok(has(bad.findings, 'primary', 2, /2 filled primary buttons in one view/), JSON.stringify(bad.findings));
});

test('bad page, the hero section holds both primaries', () => {
  const hero = bad.sections.find((s) => /hero/.test(s.section));
  assert.ok(hero && hero.primaries === 2, JSON.stringify(bad.sections));
  assert.ok(has(bad.findings, 'primary', 2, /in one section/));
});

test('bad page, heading outline reports h1 count and the skip, sev 3', () => {
  assert.equal(bad.headings.h1, 1);
  assert.deepEqual(bad.headings.outline.map((h) => h.level), [1, 3, 2]);
  assert.equal(bad.headings.skipped.length, 1);
  assert.deepEqual([bad.headings.skipped[0].from, bad.headings.skipped[0].to], [1, 3]);
  assert.ok(has(bad.findings, 'headings', 3, /skipped heading level, h1 to h3/));
});

test('bad page, largest text is the banner div and not a heading', () => {
  assert.equal(bad.largestText.isHeading, false);
  assert.equal(bad.largestText.px, 48);
  assert.match(bad.largestText.el, /banner/);
});

test('bad page, form with only an outline submit has no clear primary, sev 3', () => {
  assert.ok(has(bad.findings, 'primary', 3, /no clear primary/), JSON.stringify(bad.findings));
  assert.equal(bad.forms[0].primaries, 0);
});

test('bad page, the icon button with no name is sev 2', () => {
  assert.equal(bad.unnamed.length, 1, JSON.stringify(bad.unnamed));
  assert.ok(has(bad.findings, 'name', 2, /no accessible name/));
});

test('good page, no findings at all', () => {
  assert.deepEqual(good.findings, [], JSON.stringify(good.findings));
  assert.equal(good.headings.h1, 1);
  assert.deepEqual(good.headings.skipped, []);
  assert.equal(good.largestText.isHeading, true);
  assert.equal(good.views[0].primaries, 1);
  assert.deepEqual(good.unnamed, []);
  assert.equal(good.forms[0].primaries, 1);
});

test('summary line prints the hierarchy counts', () => {
  assert.match(r.stdout, /bad @1440 .*hierarchy \d+ sev 1, [1-9]\d* sev 2, [1-9]\d* sev 3/);
  assert.match(r.stdout, /good @1440 .*hierarchy 0 sev 1, 0 sev 2, 0 sev 3/);
});

test('plain run has no hierarchy key', () => {
  const o = join(root, 'plain');
  const p = spawnSync('node', [SHOOT, '--url', FIXTURES, '--routes', 'bad=/hier-bad.html', '--out', o], { encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  const rep = JSON.parse(readFileSync(join(o, 'report.json'), 'utf8'));
  assert.ok(!('hierarchy' in rep.routes[0]));
});

console.log(`${passed} passed in ${secs}s`);
rmSync(root, { recursive: true, force: true });
