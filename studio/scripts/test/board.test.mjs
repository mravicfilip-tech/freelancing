// Run with  node scripts/test/board.test.mjs
// Captures six fixture pages at 1920 wide and checks the board page and the overview image.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOARD = resolve(HERE, '..', 'board.mjs');
const FIXTURES = join(HERE, 'fixtures', 'board');
const root = mkdtempSync(join(tmpdir(), 'board-'));
const NAMES = ['Dashboard', 'Orders', 'Customers', 'Reports', 'Settings', 'Help'];
const ROUTES = 'Dashboard=/index.html,Orders=/orders.html,Customers=/customers.html,Reports=/reports.html,Settings=/settings.html,Help=/help.html';
const width = (f) => { const b = readFileSync(f); assert.equal(b.toString('latin1', 1, 4), 'PNG'); return b.readUInt32BE(16); };
const run = (...a) => spawnSync('node', [BOARD, ...a], { encoding: 'utf8' });
const tiles = (html) => [...html.matchAll(/<figure class="tile" data-i="(\d+)">[\s\S]*?<b>(\d+) ([^<]+)<\/b><span>([^<]+)<\/span>/g)].map((m) => ({ i: Number(m[1]), n: m[2], name: m[3], path: m[4] }));

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };
const t0 = Date.now();

const out = join(root, 'given');
const given = run('--url', FIXTURES, '--routes', ROUTES, '--out', out, '--title', 'Fixture project');
const found = join(root, 'found');
const auto = run('--url', FIXTURES, '--out', found);
const bad = join(root, 'bad');
const broken = run('--url', FIXTURES, '--routes', 'Dashboard=/index.html,Gone=/missing.html', '--out', bad);
const phone = run('--url', FIXTURES, '--routes', ROUTES, '--out', join(root, 'phone'), '--width', '390');

test('prints the out paths and the count, exit 0', () => {
  assert.equal(given.status, 0, given.stderr);
  assert.match(given.stdout, /board\.html .*board\.html/);
  assert.match(given.stdout, /board\.png .*board\.png/);
  assert.match(given.stdout, /6 screens at 1920px/);
});

test('six captures, each 1920 wide, saved beside the page', () => {
  NAMES.forEach((n, i) => {
    const f = join(out, `${String(i + 1).padStart(2, '0')}-${n.toLowerCase()}.png`);
    assert.ok(existsSync(f), `${f} missing`);
    assert.equal(width(f), 1920, n);
  });
});

test('the html lists six screens in route order with name and path', () => {
  const html = readFileSync(join(out, 'board.html'), 'utf8');
  const t = tiles(html);
  assert.equal(t.length, 6);
  assert.deepEqual(t.map((x) => x.name), NAMES);
  assert.deepEqual(t.map((x) => x.i), [0, 1, 2, 3, 4, 5]);
  assert.equal(t[3].path, '/reports.html');
  assert.match(html, /6 screens/);
  assert.match(html, /1920px wide/);
  assert.match(html, /captured \d{1,2} [A-Z][a-z]{2} \d{4}/);
  assert.match(html, /<title>Fixture project board<\/title>/);
});

test('images are referenced relatively and the page needs nothing else', () => {
  const html = readFileSync(join(out, 'board.html'), 'utf8');
  assert.ok(/<img src="01-dashboard\.png"/.test(html));
  assert.ok(!/(src|href)="(https?:|file:|[A-Za-z]:)/.test(html), 'no absolute references');
  assert.ok(/ArrowRight/.test(html) && /ArrowLeft/.test(html) && /Escape/.test(html), 'viewer keys');
});

test('board.png exists and is 1920 wide', () => {
  const f = join(out, 'board.png');
  assert.ok(existsSync(f));
  assert.equal(width(f), 1920);
});

test('without --routes it reads the start page links and says which it found', () => {
  assert.equal(auto.status, 0, auto.stderr);
  assert.match(auto.stdout, /routes found from .*index\.html, 6/);
  assert.match(auto.stdout, /Orders=\/orders\.html/);
  const t = tiles(readFileSync(join(found, 'board.html'), 'utf8'));
  assert.deepEqual(t.map((x) => x.name), NAMES);
});

test('a screen that fails stays on the board and the exit code is 1', () => {
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /failed Gone/);
  const html = readFileSync(join(bad, 'board.html'), 'utf8');
  assert.equal(tiles(html).length, 2);
  assert.ok(/Capture failed/.test(html));
  assert.ok(existsSync(join(bad, 'board.png')));
});

test('a phone width is refused', () => {
  assert.equal(phone.status, 2);
  assert.match(phone.stderr, /desktop only/);
});

console.log(`${passed} passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
