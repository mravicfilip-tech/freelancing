// Run with  node scripts/test/walk.test.mjs
// Walks three flows over file fixtures, one that completes, one with a dead end, one with a failed
// expect and a console error.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WALK = resolve(HERE, '..', 'walk.mjs');
const FIXTURES = join(HERE, 'fixtures');
const root = mkdtempSync(join(tmpdir(), 'walk-'));
const walk = (name) => {
  const out = join(root, name);
  const t = Date.now();
  const r = spawnSync('node', [WALK, '--url', FIXTURES, '--flow', join(FIXTURES, `walk-${name}.json`), '--out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return { out, stdout: r.stdout, json: JSON.parse(readFileSync(join(out, 'walk.json'), 'utf8')), s: Math.round((Date.now() - t) / 100) / 10 };
};

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };
const ok = walk('ok'), dead = walk('dead'), fail = walk('fail');

test('two page flow completes, nine steps, no findings', () => {
  assert.equal(ok.json.completed, true);
  assert.equal(ok.json.steps.length, 9);
  assert.ok(ok.json.steps.every((s) => s.ok), JSON.stringify(ok.json.steps.filter((s) => !s.ok)));
  assert.equal(ok.json.clicks, 2);
  assert.deepEqual(ok.json.deadEnds, []);
  assert.deepEqual(ok.json.expectFailures, []);
  assert.deepEqual(ok.json.findings, [], JSON.stringify(ok.json.findings));
  assert.match(ok.json.finalUrl, /walk-b\.html/);
});

test('every step leaves a screenshot, plus the start', () => {
  assert.ok(existsSync(ok.json.startShot));
  assert.ok(ok.json.steps.every((s) => existsSync(s.shot)));
});

test('the fill and the select reach the next page', () => {
  const done = ok.json.steps[5];
  assert.equal(done.kind, 'expect');
  assert.ok(ok.json.steps[6].ok, 'expect country ca');
});

test('dead end names the step index and stops the walk, sev 1', () => {
  assert.equal(dead.json.completed, false);
  assert.equal(dead.json.stoppedAt, 1);
  assert.equal(dead.json.deadEnds.length, 1);
  assert.equal(dead.json.deadEnds[0].index, 1);
  assert.match(dead.json.deadEnds[0].reason, /Add to cart/);
  assert.equal(dead.json.steps.length, 2);
  assert.ok(dead.json.findings.some((f) => f.check === 'dead end' && f.severity === 1 && f.step === 1));
  assert.equal(dead.json.clicks, 1);
});

test('failed expect is sev 1 and the walk goes on', () => {
  assert.equal(fail.json.expectFailures.length, 1);
  assert.equal(fail.json.expectFailures[0].index, 0);
  assert.ok(fail.json.findings.some((f) => f.check === 'expect' && f.severity === 1 && f.step === 0));
  assert.equal(fail.json.steps.length, 3);
  assert.equal(fail.json.completed, true);
});

test('console error is sev 2 and tied to its step', () => {
  const c = fail.json.findings.filter((f) => f.check === 'console');
  assert.equal(c.length, 1);
  assert.equal(c[0].severity, 2);
  assert.equal(c[0].step, 1);
  assert.match(c[0].detail, /fixture boom/);
});

test('summary line carries counts and time, results sit in walk.json', () => {
  assert.match(ok.stdout, /walk "Order a part" 9\/9 steps run, 2 clicks, 0 dead ends, 0 failed expects, 0 console errors, 0 failed requests/);
  assert.match(dead.stdout, /1 dead ends at step 1/);
  assert.match(ok.stdout, /in \d+(\.\d+)?s/);
  assert.equal(typeof ok.json.seconds, 'number');
  assert.ok(ok.json.steps.every((s) => typeof s.ms === 'number'));
});

console.log(`${passed} passed, ok ${ok.s}s, dead ${dead.s}s, fail ${fail.s}s`);
rmSync(root, { recursive: true, force: true });
