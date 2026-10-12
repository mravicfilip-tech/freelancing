// Run with  node scripts/test/kit-golden.test.mjs
// Drives kit.mjs and golden.mjs against local fixture pages over file URLs, with a temp clients folder
// set through STUDIO_CLIENTS_DIR. Needs the same Chrome and puppeteer-core that shoot.mjs uses.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { diffFingerprints, driftFindings, sameValue, severityForProps, similarSize, unionGolden } from '../lib/style-fingerprint.mjs';
import { matchControls } from '../kit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = resolve(HERE, '..');
const FIX = pathToFileURL(join(HERE, 'fixtures', 'golden')).href;
const brands = mkdtempSync(join(tmpdir(), 'kit-golden-'));
const env = { ...process.env, STUDIO_CLIENTS_DIR: brands };

const run = (script, ...a) => spawnSync('node', [join(SCRIPTS, script), ...a], { encoding: 'utf8', env });
const ok = (script, ...a) => { const r = run(script, ...a); assert.equal(r.status, 0, r.stderr || r.stdout); return r.stdout; };

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

// ---------- pure helpers ----------
test('sameValue allows half a pixel and nothing more', () => {
  assert.ok(sameValue('16px', '16.4px'));
  assert.ok(!sameValue('16px', '17px'));
  assert.ok(sameValue('8px 24px', '8px 24.2px'));
  assert.ok(!sameValue('#1d4ed8', '#e11d48'));
});

test('diffFingerprints names the properties that differ', () => {
  const d = diffFingerprints({ color: '#fff', radius: '6px', height: '40px' }, { color: '#fff', radius: '12px', height: '40.3px' }, ['color', 'radius', 'height']);
  assert.deepEqual(d.map((x) => x.prop), ['radius']);
  assert.equal(severityForProps(d), 3);
  assert.equal(severityForProps([{ prop: 'background' }]), 2);
});

test('similarSize rejects a small icon button against a wide one', () => {
  assert.ok(similarSize({ width: '120px', height: '40px' }, { width: '130px', height: '42px' }));
  assert.ok(!similarSize({ width: '120px', height: '40px' }, { width: '24px', height: '24px' }));
});

test('driftFindings ignores values a golden screen uses and ranks colour above size', () => {
  const g = { name: 'g', fingerprint: { maps: { colors: { '#111111': 4 }, fontSizes: { '16px': 3 }, radii: {}, shadows: {}, fontFamilies: { arial: 3 }, spacing: {}, controlHeights: {} } } };
  const page = { maps: { colors: { '#111111': 1, '#ff0000': 2 }, fontSizes: { '16px': 1, '13px': 5 }, radii: {}, shadows: {}, fontFamilies: { arial: 1 }, spacing: { '7px': 2, '9px': 3 }, controlHeights: {} }, examples: { colors: { '#ff0000': 'a.red' }, fontSizes: { '13px': 'p.tiny' }, spacing: { '9px': 'div.x' } } };
  const f = driftFindings(page, unionGolden([g]), 'home');
  assert.deepEqual(f.map((x) => `${x.severity}:${x.kind}:${x.value}`), ['2:colour:#ff0000', '3:font size:13px', '3:spacing:9px']);
  assert.equal(f[0].example, 'a.red');
});

test('matchControls keeps the closest kit item and drops exact matches', () => {
  const fp = { fontFamily: 'arial', fontSize: '16px', fontWeight: '500', lineHeight: '24px', letterSpacing: '0px', textTransform: 'none', color: '#fff', background: '#111', border: 'none', radius: '6px', padding: '8px 24px', height: '40px', shadow: 'none', width: '120px' };
  const kit = [{ name: 'btn', role: 'button', fingerprint: fp }];
  const controls = [
    { selector: 'button.a', role: 'button', text: 'A', fp: { ...fp } },
    { selector: 'button.b', role: 'button', text: 'B', fp: { ...fp, radius: '2px' } },
    { selector: 'input.c', role: 'textbox', text: '', fp: { ...fp, radius: '2px' } },
  ];
  const m = matchControls(kit, controls, 'home');
  assert.equal(m.exact.length, 1);
  assert.deepEqual(m.differing.map((d) => d.selector), ['button.b']);
});

// ---------- golden, end to end ----------
const goldenOut = ok('golden.mjs', 'add', '--client', 'testco', '--name', 'home', '--url', `${FIX}/golden.html`);

test('golden add writes the screenshot and the fingerprint', () => {
  assert.match(goldenOut, /added testco\/home/);
  assert.ok(existsSync(join(brands, 'testco', 'golden', 'home.png')));
  const j = JSON.parse(readFileSync(join(brands, 'testco', 'golden', 'home.json'), 'utf8'));
  assert.equal(j.width, 1440);
  const m = j.fingerprint.maps;
  assert.ok(m.fontSizes['24px'] && m.fontSizes['16px'] && m.fontSizes['14px']);
  assert.ok(!m.fontSizes['13px']);
  assert.ok(m.fontFamilies.arial);
  assert.ok(m.colors['#1d4ed8'] && m.colors['#f4f6fa']);
  assert.deepEqual(Object.keys(m.radii).sort(), ['6px', '8px']);
  assert.ok(m.controlHeights['40px']);
  assert.equal(Object.keys(m.shadows).length, 1);
  assert.ok(m.spacing['16px'] > 0);
});

test('golden list prints one line per screen', () => {
  const out = ok('golden.mjs', 'list', '--client', 'testco').trim().split('\n');
  assert.equal(out.length, 1);
  assert.match(out[0], /^home \| .*golden\.html \| \d{4}-\d{2}-\d{2} \|/);
});

const drift = JSON.parse(ok('golden.mjs', 'compare', '--client', 'testco', '--url', FIX, '--routes', 'same=/golden.html,drift=/drifted.html', '--json'));
const find = (route, kind, value) => drift.findings.find((f) => f.route === route && f.kind === kind && f.value === value);

test('compare finds nothing on the golden page itself', () => {
  assert.equal(drift.findings.filter((f) => f.route === 'same').length, 0, JSON.stringify(drift.findings));
});

test('compare reports the new colour at sev 2 with a count and a selector', () => {
  const f = find('drift', 'colour', '#e11d48');
  assert.ok(f, JSON.stringify(drift.findings));
  assert.equal(f.severity, 2);
  assert.equal(f.count, 1);
  assert.match(f.example, /button/);
});

test('compare reports the 13px size at sev 3', () => {
  const f = find('drift', 'font size', '13px');
  assert.ok(f);
  assert.equal(f.severity, 3);
  assert.match(f.example, /p\.note/);
});

test('compare reports the 12px radius at sev 3 and not the old 8px', () => {
  const f = find('drift', 'radius', '12px');
  assert.ok(f);
  assert.equal(f.severity, 3);
  assert.ok(!find('drift', 'radius', '8px'));
});

test('compare finds exactly the three planted drifts', () => {
  assert.equal(drift.findings.length, 3, JSON.stringify(drift.findings));
  assert.deepEqual(drift.counts, { sev2: 1, sev3: 2 });
});

test('compare plain text carries the same findings and exits 0', () => {
  const r = run('golden.mjs', 'compare', '--client', 'testco', '--url', `${FIX}/drifted.html`);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /sev 2 \| page \| new colour #e11d48 \| 1 use \| /);
  assert.match(r.stdout, /sev 3 \| page \| new font size 13px/);
  assert.match(r.stdout, /1 suggested sev 2, 2 suggested sev 3/);
});

test('compare on a client with no golden screens says so and exits 0', () => {
  const r = run('golden.mjs', 'compare', '--client', 'emptyco', '--url', `${FIX}/golden.html`);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /no golden screens/);
});

// ---------- kit, end to end ----------
const kitOut = ok('kit.mjs', 'add', '--client', 'testco', '--name', 'primary-button', '--url', `${FIX}/golden.html`, '--selector', '#primary', '--repo', HERE, '--file', 'nope.tsx', '--note', 'approved 12 Oct');

test('kit add writes the png and the json with hover and source', () => {
  assert.match(kitOut, /added testco\/primary-button\s+button/);
  assert.match(kitOut, /warning source file not found/);
  assert.ok(existsSync(join(brands, 'testco', 'kit', 'primary-button.png')));
  const j = JSON.parse(readFileSync(join(brands, 'testco', 'kit', 'primary-button.json'), 'utf8'));
  assert.equal(j.note, 'approved 12 Oct');
  assert.equal(j.source.file, 'nope.tsx');
  assert.equal(j.role, 'button');
  assert.match(j.date, /^\d{4}-\d{2}-\d{2}$/);
  const f = j.fingerprint;
  assert.equal(f.fontFamily, 'arial');
  assert.equal(f.fontSize, '16px');
  assert.equal(f.fontWeight, '500');
  assert.equal(f.lineHeight, '24px');
  assert.equal(f.color, '#ffffff');
  assert.equal(f.background, '#1d4ed8');
  assert.equal(f.radius, '6px');
  assert.equal(f.padding, '8px 24px 8px 24px');
  assert.equal(f.height, '40px');
  assert.deepEqual(j.hover, { background: '#1e3a8a' });
});

test('kit list and show', () => {
  const l = ok('kit.mjs', 'list', '--client', 'testco').trim().split('\n');
  assert.equal(l.length, 1);
  assert.match(l[0], /^primary-button \| button \| .* \| 16px\/500 \| bg #1d4ed8 \| radius 6px \| \d{4}/);
  assert.equal(JSON.parse(ok('kit.mjs', 'show', '--client', 'testco', '--name', 'primary-button')).name, 'primary-button');
});

test('kit match finds the drifted button and passes the golden one', () => {
  const same = JSON.parse(ok('kit.mjs', 'match', '--client', 'testco', '--url', `${FIX}/golden.html`, '--json'));
  assert.equal(same.differing.length, 0, JSON.stringify(same.differing));
  assert.equal(same.routes[0].matchedExactly, 1);
  const d = JSON.parse(ok('kit.mjs', 'match', '--client', 'testco', '--url', FIX, '--routes', 'drift=/drifted.html', '--json'));
  assert.equal(d.differing.length, 1, JSON.stringify(d.differing));
  assert.equal(d.differing[0].kit, 'primary-button');
  assert.deepEqual(d.differing[0].diffs.map((x) => x.prop), ['background']);
  assert.equal(d.differing[0].severity, 2);
});

test('kit usage errors exit 1 with a message', () => {
  const r = run('kit.mjs', 'add', '--client', 'testco', '--name', 'x', '--url', `${FIX}/golden.html`, '--selector', '.missing');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /matches nothing/);
  assert.equal(run('kit.mjs', 'show', '--client', 'testco', '--name', 'nope').status, 1);
});

rmSync(brands, { recursive: true, force: true });
console.log(`${passed} passed`);
