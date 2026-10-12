// Run with  node scripts/test/shoot-interact.test.mjs
// Drives shoot.mjs --interact against two fixtures over file URLs. Needs the same Chrome and
// puppeteer-core that shoot.mjs uses.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOOT = resolve(HERE, '..', 'shoot.mjs');
const FIXTURES = join(HERE, 'fixtures');
const root = mkdtempSync(join(tmpdir(), 'shoot-interact-'));

const shoot = (out, ...extra) => {
  const r = spawnSync('node', [SHOOT, '--url', FIXTURES, '--routes', 'bad=/bad.html,clean=/clean.html', '--out', out, ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return { report: JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')), stdout: r.stdout };
};

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

const on = shoot(join(root, 'on'), '--interact');
const row = (n) => on.report.routes.find((r) => r.route === n).interact;
const bad = row('bad'), clean = row('clean');
const has = (list, check, severity, re) => list.some((f) => f.check === check && f.severity === severity && re.test(`${f.issue} ${f.detail || ''} ${f.el}`));

test('report carries interact data on every route, no step errors', () => {
  assert.ok(bad && clean);
  assert.deepEqual(bad.errors, []);
  assert.deepEqual(clean.errors, []);
  assert.equal(on.report.interact, true);
});

test('bad page, translucent sticky header is sev 2', () => {
  assert.ok(has(bad.findings, 'sticky', 2, /not opaque.*alpha is 0\.6/s), JSON.stringify(bad.findings));
  assert.equal(bad.sticky[0].opaque, false);
});

test('bad page, z-index 999 content paints over the header, sev 1', () => {
  assert.ok(has(bad.findings, 'sticky', 1, /paints over it.*z-index 999/s), JSON.stringify(bad.findings));
});

test('bad page, menu opens under the header, sev 1', () => {
  assert.ok(has(bad.findings, 'stacking', 1, /under a pinned header/), JSON.stringify(bad.findings));
});

test('bad page, menu inside an overflow hidden box is clipped, sev 1', () => {
  assert.ok(has(bad.findings, 'stacking', 1, /clipped by an overflow ancestor/), JSON.stringify(bad.findings));
});

test('bad page, focus does not return to the trigger, sev 2', () => {
  assert.ok(has(bad.findings, 'stacking', 2, /focus does not return/), JSON.stringify(bad.findings));
});

test('bad page, button with no hover is sev 3', () => {
  assert.ok(has(bad.findings, 'hover', 3, /no hover state.*No hover/s), JSON.stringify(bad.findings));
});

test('bad page, hover that changes padding shifts layout, sev 2', () => {
  assert.ok(has(bad.findings, 'hover', 2, /shifts layout.*Grows|Grows/s) && bad.findings.some((f) => f.check === 'hover' && f.issue === 'hover shifts layout' && /Grows/.test(f.el)), JSON.stringify(bad.findings));
});

test('bad page, z-index 999 is flagged, sev 3', () => {
  assert.ok(has(bad.findings, 'zindex', 3, /999 is above 60/), JSON.stringify(bad.zindex));
  assert.ok(bad.zindex.flagged.includes(999));
});

test('bad page, hover findings do not hit controls that do change', () => {
  assert.ok(!bad.findings.some((f) => f.check === 'hover' && /Home|Docs/.test(f.el)), JSON.stringify(bad.findings));
});

test('clean page, no findings at all', () => {
  assert.deepEqual(clean.findings, [], JSON.stringify(clean.findings));
  assert.equal(clean.sticky[0].opaque, true);
  assert.equal(clean.sticky[0].stays['at 600px'], true);
  assert.ok(clean.hover.checked >= 4, `hover checked ${clean.hover.checked}`);
  assert.equal(clean.stacking.length, 1);
  assert.equal(clean.stacking[0].opened, true);
  assert.equal(clean.stacking[0].escape.focusBack, true);
  assert.deepEqual(clean.zindex.flagged, []);
});

test('time per route stays inside the budget', () => {
  assert.ok(bad.seconds < 20 && clean.seconds < 20, `bad ${bad.seconds}s, clean ${clean.seconds}s`);
  assert.equal(bad.budgetHit, false);
});

test('summary line prints the interact counts', () => {
  assert.match(on.stdout, /bad @1440 .*interact \d+ sev 1, \d+ sev 2, \d+ sev 3/);
  assert.match(on.stdout, /clean @1440 .*interact 0 sev 1, 0 sev 2, 0 sev 3/);
});

test('without --interact nothing changes, no interact key', () => {
  const off = shoot(join(root, 'off'));
  assert.ok(off.report.routes.every((r) => !('interact' in r)));
  assert.ok(!('interact' in off.report));
  assert.ok(!/ sev 1, /.test(off.stdout));
});

console.log(`${passed} passed`);
console.log(`bad ${bad.seconds}s, clean ${clean.seconds}s`);
rmSync(root, { recursive: true, force: true });
