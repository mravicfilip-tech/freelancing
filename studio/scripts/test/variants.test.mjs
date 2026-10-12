// Run with  node scripts/test/variants.test.mjs
// Composes numbered variants from three file fixtures and checks the sheet size.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VARIANTS = resolve(HERE, '..', 'variants.mjs');
const fx = (n) => pathToFileURL(join(HERE, 'fixtures', `variant-${n}.html`)).href;
const root = mkdtempSync(join(tmpdir(), 'variants-'));
const png = (f) => { const b = readFileSync(f); assert.equal(b.toString('latin1', 1, 4), 'PNG'); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const run = (...a) => spawnSync('node', [VARIANTS, ...a], { encoding: 'utf8' });

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };
const t0 = Date.now();

const rowOut = join(root, 'row.png');
const row = run('--urls', `1=${fx(1)},2=${fx(2)},3=${fx(3)}`, '--out', rowOut);
const el = join(root, 'el.png');
const elem = run('--urls', `1=${fx(1)},2=${fx(2)},3=${fx(3)}`, '--out', el, '--selector', '#card');
const gridOut = join(root, 'grid.png');
const grid = run('--urls', `1=${fx(1)},2=${fx(2)},3=${fx(3)},4=${fx(1)}`, '--out', gridOut);

test('prints the output path and writes a png', () => {
  assert.equal(row.status, 0, row.stderr);
  assert.equal(row.stdout.trim(), rowOut);
  assert.ok(existsSync(rowOut));
});

test('three variants sit in one row, width is three cells plus gaps and padding', () => {
  const { w, h } = png(rowOut);
  assert.equal(w, 48 * 2 + 3 * 900 + 2 * 48);
  // tallest capture is 1500px at 1440 wide, scaled to 900 is 938px, plus the 160px label and padding
  assert.ok(h > 1000 && h < 1500, `height ${h}`);
});

test('a selector captures the element and not the page, so the sheet is shorter', () => {
  assert.equal(elem.status, 0, elem.stderr);
  const a = png(el), b = png(rowOut);
  assert.ok(a.h < b.h, `element sheet ${a.h} against page sheet ${b.h}`);
});

test('four variants wrap into a grid of three columns', () => {
  assert.equal(grid.status, 0, grid.stderr);
  const g = png(gridOut), r = png(rowOut);
  assert.equal(g.w, 48 * 2 + 3 * 900 + 2 * 48);
  assert.ok(g.h > r.h, `grid ${g.h} against row ${r.h}`);
});

test('a bad urls entry exits non zero with a message', () => {
  const bad = run('--urls', 'nonsense', '--out', join(root, 'x.png'));
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /bad --urls entry/);
});

console.log(`${passed} passed in ${Math.round((Date.now() - t0) / 100) / 10}s`);
rmSync(root, { recursive: true, force: true });
