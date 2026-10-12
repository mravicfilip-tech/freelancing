// Run with  node scripts/test/baselint.test.mjs
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';


const HERE = dirname(fileURLToPath(import.meta.url));
const LINT = resolve(HERE, '..', 'baselint.mjs');
const BRANDS = resolve(HERE, '..', '..', 'clients');
const root = mkdtempSync(join(tmpdir(), 'baselint-test-'));

// Fixture client overrides, so these tests never read a real clients folder.
const FIXTURE_CLIENTS = join(root, 'clients');
const fixture = (id, o) => {
  mkdirSync(join(FIXTURE_CLIENTS, id), { recursive: true });
  writeFileSync(join(FIXTURE_CLIENTS, id, 'base-override.json'), JSON.stringify({ source: 'test fixture override', ...o }));
};
fixture('gamma', { fontFloor: 15, fontSizes: [12, 15, 16, 18, 20, 24, 28, 32, 40, 48] });
fixture('beta', { radius: [0, 3] });
fixture('delta', { radius: [0, 5] });
fixture('epsilon', { radius: [0, 2, 3, 4, 5], spacing: [0, 2, 4, 8, 12, 16, 24, 25, 32, 48, 64, 96] });
fixture('zeta', { controlHeights: [44] });
fixture('eta', { shadowColor: 'any' });
fixture('theta', { fontSizes: [12, 14, 16, 21, 27, 35, 46], lineHeights: [16, 20, 24, 28, 36, 44, 56] });
process.env.STUDIO_CLIENTS_DIR = FIXTURE_CLIENTS;
// baselint reads that folder when it loads, so it is imported after the variable is set.
const { DEFAULTS, loadScale } = await import('../baselint.mjs');
const repo = join(root, 'repo');
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });

execFileSync('git', ['init', '-q', repo]);
git('config', 'user.email', 't@t.t');
git('config', 'user.name', 't');
mkdirSync(join(repo, 'src'));
// The base commit holds old off-scale code. It must never be reported, only added lines count.
writeFileSync(join(repo, 'src', 'old.css'), '.legacy {\n  font-size: 13px;\n  padding: 5px;\n  z-index: 999;\n}\n');
writeFileSync(join(repo, 'README.md'), '# repo\n');
git('add', '-A');
git('commit', '-q', '-m', 'base');

const run = (extra = []) => {
  const r = spawnSync('node', [LINT, '--repo', repo, '--json', ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'baselint must always exit 0');
  return JSON.parse(r.stdout);
};
const runText = (extra = []) => {
  const r = spawnSync('node', [LINT, '--repo', repo, ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'baselint must always exit 0');
  return r.stdout;
};
// Replaces the working change with one set of files, so each test starts from the base commit.
const setWork = (files) => {
  git('checkout', '-q', '--', '.');
  git('clean', '-fdq');
  for (const [name, text] of Object.entries(files)) {
    const f = join(repo, name);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, text);
  }
};
const found = (res, property, value) => res.findings.filter((f) => f.property === property && f.value === value);
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

// ---------- negative control ----------
// A clean result means nothing until the same lint flags a seeded bad diff.
test('negative control, a seeded diff flags 13px, 12.5px, 0.85rem, p-[5px], a 5px gap and z-index 999', () => {
  setWork({
    'src/seed.css': '.a {\n  font-size: 13px;\n}\n.b {\n  font-size: 12.5px;\n}\n.c {\n  font-size: 0.85rem;\n}\n.row {\n  gap: 5px;\n}\n.top {\n  z-index: 999;\n}\n',
    'src/Seed.tsx': 'export const A = () => <div className="p-[5px] text-sm">x</div>;\n',
  });
  const res = run(['--client', 'acme']);
  assert.equal(found(res, 'font-size', '13px').length, 1, '13px');
  assert.equal(found(res, 'font-size', '12.5px').length, 1, '12.5px');
  assert.equal(found(res, 'font-size', '0.85rem').length, 1, '0.85rem');
  assert.equal(found(res, 'spacing', 'p-[5px]').length, 1, 'p-[5px]');
  assert.equal(found(res, 'gap', '5px').length, 1, 'gap 5px');
  assert.equal(found(res, 'z-index', '999').length, 1, 'z-index 999');
  assert.equal(res.findings.length, 6);
  const z = found(res, 'z-index', '999')[0];
  assert.equal(z.file, 'src/seed.css');
  assert.equal(z.line, 14);
  assert.ok(z.allowed.includes(60) && z.token.includes('--bl-z-60'));
  const f13 = found(res, 'font-size', '13px')[0];
  assert.ok(f13.token.includes('--bl-fs-14'), 'a 13px tie goes up to 14');
  assert.equal(f13.sev, 2);
});

test('rem is converted at 16px, so 0.875rem is 14px and passes, 0.85rem is 13.6px and fails', () => {
  setWork({ 'src/r.css': '.a {\n  font-size: 0.875rem;\n}\n.b {\n  font-size: 0.85rem;\n}\n' });
  const res = run(['--client', 'acme']);
  assert.equal(res.findings.length, 1);
  assert.equal(res.findings[0].value, '0.85rem');
});

test('text output prints file, line, property, value, allowed set and the token', () => {
  setWork({ 'src/t.css': '.a {\n  font-size: 13px;\n}\n' });
  const out = runText(['--client', 'acme']);
  assert.match(out, /src\/t\.css:2\s+font-size 13px\s+allowed 12 14 16 18 20 24 28 32 40 48\s+use var\(--bl-fs-14\)/);
});

// ---------- clean control ----------
test('a clean diff reports nothing', () => {
  setWork({
    'src/clean.css': [
      '.card {',
      '  padding: 24px 16px;',
      '  margin: 0 auto;',
      '  gap: 8px;',
      '  border-radius: 8px;',
      '  font-size: 14px;',
      '  line-height: 20px;',
      '  z-index: 20;',
      '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);',
      '}',
      '.btn {',
      '  height: 36px;',
      '  min-height: 32px;',
      '  border-radius: 9999px;',
      '}',
      '.icon {',
      '  width: 20px;',
      '  height: 20px;',
      '}',
      '.panel {',
      '  height: 400px;',
      '  padding: var(--bl-sp-16);',
      '  font-size: var(--bl-fs-14);',
      '  width: 37%;',
      '  box-shadow: 0 0 0 2px #005fcc;',
      '}',
      '@media (min-height: 700px) {',
      '  .x { gap: 12px; }',
      '}',
      '',
    ].join('\n'),
    'src/Clean.tsx': 'export const A = () => <button className="h-[36px] p-[12px] text-[14px] rounded-[8px] z-[30]"><Search size={20} strokeWidth={1.5} /></button>;\n',
  });
  const res = run(['--client', 'acme']);
  assert.deepEqual(res.findings, []);
  assert.ok(runText(['--client', 'acme']).includes('found nothing off the scale'));
});

test('only added lines count, old off-scale code and untouched lines are never reported', () => {
  setWork({ 'src/old.css': '.legacy {\n  font-size: 13px;\n  padding: 5px;\n  z-index: 999;\n  margin: 8px;\n}\n' });
  const res = run(['--client', 'acme']);
  assert.deepEqual(res.findings, [], 'the 13px, 5px and 999 were already in the base commit');
});

test('files outside css, scss, tsx, jsx, ts, js, html and vue are ignored', () => {
  setWork({ 'notes.md': 'font-size: 13px; gap: 5px;\n', 'data.json': '{"fontSize": 13}\n' });
  const res = run(['--client', 'acme']);
  assert.equal(res.checkedFiles, 0);
  assert.deepEqual(res.findings, []);
});

// ---------- brand override ----------
test('15px is allowed for Gamma only, flagged for Acme and Beta', () => {
  setWork({ 'src/v.css': '.a {\n  font-size: 15px;\n}\n' });
  assert.deepEqual(run(['--client', 'gamma']).findings, []);
  assert.equal(run(['--client', 'acme']).findings.length, 1);
  assert.equal(run(['--client', 'beta']).findings.length, 1);
});

test('Gamma flags 14px as below its floor of 15', () => {
  setWork({ 'src/v.css': '.a {\n  font-size: 14px;\n}\n' });
  const res = run(['--client', 'gamma']);
  assert.equal(res.findings.length, 1);
  assert.match(res.findings[0].note, /floor 15/);
  assert.deepEqual(run(['--client', 'acme']).findings, []);
});

test('radius follows the brand, Beta 3, Delta 5, Epsilon 2 to 5, Acme 4 and 8', () => {
  setWork({ 'src/r.css': '.a {\n  border-radius: 3px;\n}\n' });
  assert.deepEqual(run(['--client', 'beta']).findings, []);
  assert.equal(run(['--client', 'acme']).findings.length, 1);
  setWork({ 'src/r.css': '.a {\n  border-radius: 5px;\n}\n' });
  assert.deepEqual(run(['--client', 'delta']).findings, []);
  assert.deepEqual(run(['--client', 'epsilon']).findings, []);
  assert.equal(run(['--client', 'beta']).findings.length, 1);
  setWork({ 'src/r.css': '.a {\n  border-radius: 8px;\n}\n' });
  assert.equal(run(['--client', 'beta']).findings.length, 1);
  assert.deepEqual(run(['--client', 'acme']).findings, []);
});

test('Epsilon gutter of 25 passes for Epsilon and fails for Acme, Zeta wants 44 controls', () => {
  setWork({ 'src/d.css': '.wrap {\n  padding: 0 25px;\n}\n.btn {\n  height: 44px;\n}\n.btn-alt {\n  height: 36px;\n}\n' });
  const epsilon = run(['--client', 'epsilon']);
  assert.equal(epsilon.findings.filter((f) => f.value === '25px').length, 0);
  assert.equal(run(['--client', 'acme']).findings.filter((f) => f.value === '25px').length, 1);
  const zeta = run(['--client', 'zeta']);
  assert.equal(zeta.findings.filter((f) => f.value === '36px').length, 1);
  assert.equal(zeta.findings.filter((f) => f.value === '44px').length, 0);
});

test('Eta may use a coloured soft shadow, Acme may not', () => {
  setWork({ 'src/s.css': '.a {\n  box-shadow: 0 2px 6px rgba(13, 26, 64, 0.15);\n}\n' });
  assert.deepEqual(run(['--client', 'eta']).findings, []);
  assert.equal(run(['--client', 'acme']).findings.length, 1);
});

test('Theta type scale replaces the base scale', () => {
  setWork({ 'src/m.css': '.a {\n  font-size: 21px;\n}\n.b {\n  font-size: 18px;\n}\n' });
  const res = run(['--client', 'theta']);
  assert.equal(res.findings.length, 1);
  assert.equal(res.findings[0].value, '18px');
});

test('an unknown client falls back to the base scale and a missing override file is not an error', () => {
  setWork({ 'src/u.css': '.a {\n  font-size: 13px;\n}\n' });
  assert.equal(run(['--client', 'nobody']).findings.length, 1);
  assert.equal(run(['--client', 'iota']).findings.length, 1);
});

// ---------- more checks ----------
test('controls and icons, height and size need the right context', () => {
  setWork({
    'src/c.css': '.search-input {\n  height: 30px;\n}\n.panel {\n  height: 30px;\n}\n.icon {\n  width: 18px;\n  height: 18px;\n  stroke-width: 2;\n}\n',
    'src/C.tsx': 'export const A = () => <Search size={18} strokeWidth={2} />;\nexport const B = () => <Avatar size={40} />;\n',
  });
  const res = run(['--client', 'acme']);
  assert.equal(found(res, 'height', '30px').length, 1, 'the input is flagged, the panel is not');
  assert.equal(found(res, 'height', '30px')[0].line, 2);
  assert.equal(found(res, 'width', '18px').length, 1);
  assert.equal(found(res, 'stroke-width', '2').length, 2);
  assert.equal(found(res, 'size', '18').length, 1);
  assert.equal(found(res, 'size', '40').length, 0, 'Avatar is not an icon');
});

test('line height and shadow levels', () => {
  setWork({ 'src/l.css': '.a {\n  line-height: 22px;\n}\n.b {\n  line-height: 1.5;\n}\n.c {\n  box-shadow: 0 4px 12px rgba(0,0,0,.2);\n}\n.d {\n  box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 0 0 2px #fff;\n}\n' });
  const res = run(['--client', 'acme']);
  assert.equal(found(res, 'line-height', '22px').length, 1);
  assert.equal(found(res, 'line-height', '1.5').length, 0, 'unitless ratios are not read');
  assert.equal(found(res, 'box-shadow', '0 4px 12px rgba(0,0,0,.2)').length, 1);
  assert.equal(res.findings.length, 2);
});

test('JS style objects and Tailwind arbitrary values with rem and negatives', () => {
  setWork({
    'src/o.tsx': 'const s = { fontSize: 13, padding: "5px 12px", gap: 6, zIndex: 100, borderRadius: 6 };\nexport const T = () => <div className="md:-mt-[5px] text-[0.8rem] leading-[22px] rounded-[6px] z-[100] gap-[10px]" />;\n',
  });
  const res = run(['--client', 'acme']);
  const props = res.findings.map((f) => `${f.line}:${f.property}:${f.value}`);
  for (const want of ['1:font-size:13px', '1:padding:5px', '1:gap:6px', '1:z-index:100', '1:border-radius:6px', '2:spacing:-mt-[5px]', '2:font-size:text-[0.8rem]', '2:line-height:leading-[22px]', '2:border-radius:rounded-[6px]', '2:z-index:z-[100]', '2:spacing:gap-[10px]']) {
    assert.ok(props.includes(want), `missing ${want} in ${props.join(' | ')}`);
  }
});

test('new untracked files are checked line by line', () => {
  setWork({ 'src/new.vue': '<template><div /></template>\n<style>\n.a {\n  font-size: 11px;\n}\n</style>\n' });
  const res = run(['--client', 'acme']);
  assert.equal(res.findings.length, 1);
  assert.equal(res.findings[0].line, 4);
  assert.equal(res.findings[0].sev, 1, 'under 12 carries sev 1 for working text');
});

test('--base compares against a ref', () => {
  setWork({ 'src/b.css': '.a {\n  gap: 5px;\n}\n' });
  git('add', '-A');
  git('commit', '-q', '-m', 'second');
  assert.deepEqual(run(['--client', 'acme']).findings, [], 'nothing is left in the working tree');
  assert.equal(run(['--client', 'acme', '--base', 'HEAD~1']).findings.length, 1);
});

test('exit code is 0 when the repo is not a git repo or the ref is bad, and the text says why', () => {
  const r = spawnSync('node', [LINT, '--repo', root, '--client', 'acme'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /baselint/);
  const bad = spawnSync('node', [LINT, '--repo', repo, '--base', 'no-such-ref', '--client', 'acme'], { encoding: 'utf8' });
  assert.equal(bad.status, 0);
  assert.match(bad.stdout, /could not read the diff/);
});

// ---------- icon stroke and icon set ----------
test('stroke-width off 1.5 is flagged on svg shapes and tailwind classes in an icon, 1.5 is clean', () => {
  setWork({
    'src/Shapes.tsx': [
      'export const A = () => (',
      '  <svg viewBox="0 0 24 24" stroke-width="1.5">',
      '    <path d="M1 1" stroke-width="2" />',
      '  </svg>',
      ');',
      'export const B = () => <svg className="icon stroke-[2.5]" viewBox="0 0 24 24"></svg>;',
      'export const C = () => <svg className="icon stroke-1" viewBox="0 0 24 24"></svg>;',
      'export const D = () => <svg className="icon stroke-current" viewBox="0 0 24 24"></svg>;',
      'export const E = () => <circle r="4" strokeWidth={3} />;',
      '',
    ].join('\n'),
  });
  const res = run(['--client', 'acme']);
  assert.equal(found(res, 'stroke-width', '2').length, 1, 'path in an icon');
  assert.equal(found(res, 'stroke-width', 'stroke-[2.5]').length, 1, 'tailwind arbitrary');
  assert.equal(found(res, 'stroke-width', 'stroke-1').length, 1, 'tailwind step');
  assert.equal(found(res, 'stroke-width', '1.5').length, 0, '1.5 is clean');
  assert.equal(found(res, 'stroke-width', 'stroke-current').length, 0, 'a colour class is not a width');
  assert.equal(res.findings.every((f) => f.sev === 3), true, 'a warning, never a block');
});

test('icon set mix, two libraries in one diff warn once for the minority library', () => {
  setWork({
    'src/A.tsx': "import { Search, Plus } from 'lucide-react';\nimport { BellIcon } from '@heroicons/react/24/outline';\nexport const A = () => null;\n",
    'src/B.tsx': "import { X } from 'lucide-react';\nexport const B = () => null;\n",
  });
  const res = run(['--client', 'acme']);
  const mix = res.findings.filter((f) => f.property === 'icon-set');
  assert.equal(mix.length, 1);
  assert.equal(mix[0].value, 'heroicons');
  assert.deepEqual(mix[0].allowed, ['lucide']);
  assert.equal(mix[0].file, 'src/A.tsx');
  assert.equal(mix[0].line, 2);
  assert.ok(/lucide and heroicons/.test(mix[0].note));
  assert.ok(runText(['--client', 'acme']).includes('icon-set heroicons'));
});

test('icon set mix, one library, or a library only in untouched code, stays quiet', () => {
  setWork({ 'src/A.tsx': "import { Search } from 'lucide-react';\nimport { X } from 'lucide-react';\nexport const A = () => null;\n" });
  assert.equal(run(['--client', 'acme']).findings.filter((f) => f.property === 'icon-set').length, 0);
  setWork({ 'src/B.tsx': "import { Search } from 'lucide-react';\nimport { useState } from 'react';\nimport x from 'tabler-helpers';\n" });
  assert.equal(run(['--client', 'acme']).findings.filter((f) => f.property === 'icon-set').length, 0);
});

test('icon set mix covers the other libraries', () => {
  const libs = { lucide: "'lucide-react'", heroicons: "'@heroicons/react/20/solid'", phosphor: "'@phosphor-icons/react'", tabler: "'@tabler/icons-react'", material: "'@mui/icons-material'", fontawesome: "'@fortawesome/react-fontawesome'", radix: "'@radix-ui/react-icons'" };
  const names = Object.keys(libs);
  for (let i = 0; i < names.length - 1; i++) {
    setWork({ 'src/M.tsx': `import { A } from ${libs[names[i]]};\nimport { B } from ${libs[names[i + 1]]};\nimport { C } from ${libs[names[i + 1]]};\n` });
    const mix = run(['--client', 'acme']).findings.filter((f) => f.property === 'icon-set');
    assert.equal(mix.length, 1, `${names[i]} with ${names[i + 1]}`);
    assert.equal(mix[0].value, names[i]);
  }
});

// ---------- the real override files ----------
test('every client folder with a base-override.json holds only known keys, and the template holds {}', () => {
  const known = new Set(['source', 'fontFloor', 'fontSizes', 'lineHeights', 'spacing', 'radius', 'controlHeights', 'iconSizes', 'iconStroke', 'zIndex', 'shadowColor', 'container', 'shell']);
  const tpl = join(BRANDS, '_template', 'base-override.json');
  assert.ok(existsSync(tpl), 'clients/_template/base-override.json is missing');
  assert.deepEqual(JSON.parse(readFileSync(tpl, 'utf8')), {}, 'the template override must be {}');
  const clients = existsSync(BRANDS) ? readdirSync(BRANDS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  for (const b of clients) {
    const f = join(BRANDS, b, 'base-override.json');
    if (!existsSync(f)) continue;
    const o = JSON.parse(readFileSync(f, 'utf8'));
    for (const k of Object.keys(o)) assert.ok(known.has(k), `${b} has unknown key ${k}`);
    if (Object.keys(o).length) assert.ok(typeof o.source === 'string' && o.source.length > 10, `${b} needs a source`);
    assert.ok(!/[\u2013\u2014]/.test(readFileSync(f, 'utf8')), `${b} has a long dash`);
  }
});

test('the base css holds the accepted set', () => {
  const css = readFileSync(resolve(HERE, '..', '..', 'foundation', 'base-layout.css'), 'utf8');
  for (const v of ['--bl-fs-14: 14px', '--bl-lh-14: 20px', '--bl-h-44: 44px', '--bl-z-60: 60', '--bl-sidebar-open: 240px', '--bl-sidebar-collapsed: 72px', '--bl-topbar: 64px', '--bl-page-pad: 24px', '--bl-shadow-2: 0 2px 6px rgba(0, 0, 0, 0.15)', '--bl-canvas-max: 1600px']) {
    assert.ok(css.includes(v), `missing ${v}`);
  }
  assert.ok(/min-width: 1440px[\s\S]*--bl-page-pad: 32px/.test(css));
  assert.ok(!/[\u2013\u2014]/.test(css), 'long dash');
});

// ---------- fix, dry run and apply ----------
const fixArgs = (extra) => [LINT, '--repo', repo, '--client', 'acme', '--fix', ...extra];
const fixJson = (extra = []) => {
  const r = spawnSync('node', fixArgs(['--json', ...extra]), { encoding: 'utf8' });
  assert.equal(r.status, 0);
  return JSON.parse(r.stdout);
};
const fixText = (extra = []) => {
  const r = spawnSync('node', fixArgs(extra), { encoding: 'utf8' });
  assert.equal(r.status, 0, 'fix must always exit 0');
  return r.stdout;
};
const applyText = (extra = []) => fixText(['--apply', ...extra]);
const read = (name) => readFileSync(join(repo, name), 'utf8');
const itemAt = (plan, file, line, old) => plan.items.find((i) => i.file === file && i.line === line && i.old === old);

const FIX_CSS = [
  '.a {',                    // 1
  '  font-size: 13px;',      // 2 tie between 12 and 14
  '  padding: 5px 12px;',    // 3 5px to 4px
  '  border-radius: 6px;',   // 4 tie between 4 and 8
  '  z-index: 999;',         // 5 a layering call
  '  gap: 0.3rem;',          // 6 rem stays rem
  '  line-height: 21px;',    // 7 to 20px
  '  font-size: 0.85rem;',   // 8 to 0.875rem
  '  margin: -5px 5px;',     // 9 two edits on one line, the sign stays
  '  box-shadow: 0 4px 12px rgba(0,0,0,.2);', // 10 a shadow call
  '}',
  '.btn-x {',
  '  height: 35px;',         // 13 to 36px, one px from a tier
  '}',
  '.btn-y {',
  '  height: 30px;',         // 16 would change tier, a call
  '}',
  '',
].join('\n');

test('fix dry run lists each change with file, line, old, new and the token, and writes nothing', () => {
  setWork({ 'src/f.css': FIX_CSS });
  const before = read('src/f.css');
  const plan = fixJson();
  assert.equal(read('src/f.css'), before, 'a dry run never writes');
  const want = [
    [3, '5px', '4px', 'var(--bl-sp-4)'],
    [6, '0.3rem', '0.25rem', 'var(--bl-sp-4)'],
    [7, '21px', '20px', 'var(--bl-lh-14)'],
    [8, '0.85rem', '0.875rem', 'var(--bl-fs-14)'],
    [13, '35px', '36px', 'var(--bl-h-36)'],
  ];
  for (const [line, old, next, token] of want) {
    const it = itemAt(plan, 'src/f.css', line, old);
    assert.ok(it, `missing ${old} on line ${line}`);
    assert.equal(it.status, 'auto');
    assert.equal(it.new, next);
    assert.equal(it.token, token);
  }
  const margins = plan.items.filter((i) => i.line === 9);
  assert.deepEqual(margins.map((m) => `${m.old}>${m.new}`).sort(), ['-5px>-4px', '5px>4px']);
  assert.equal(plan.items.filter((i) => i.status === 'auto').length, 7);
  // These need a call and carry no proposal.
  for (const [line, old] of [[2, '13px'], [4, '6px'], [5, '999'], [10, '0 4px 12px rgba(0,0,0,.2)'], [16, '30px']]) {
    const it = itemAt(plan, 'src/f.css', line, old);
    assert.ok(it, `missing ${old} on line ${line}`);
    assert.equal(it.status, 'call', `${old} must need a call`);
    assert.equal(it.new, undefined, `${old} proposes nothing`);
    assert.ok(it.reason.length > 5);
  }
  assert.match(itemAt(plan, 'src/f.css', 2, '13px').reason, /between 12 and 14/);
  assert.match(itemAt(plan, 'src/f.css', 16, '30px').reason, /tier/);
  assert.equal(plan.items.length, 12);
});

test('fix dry run text is one line per change and one per call, with no write', () => {
  setWork({ 'src/f.css': FIX_CSS });
  const out = fixText();
  assert.match(out, /dry run, 7 changes and 5 that need a call/);
  assert.match(out, /src\/f\.css:3 {2}padding {2}5px {2}to {2}4px {2}use var\(--bl-sp-4\)/);
  assert.match(out, /src\/f\.css:2 {2}font-size {2}13px {2}needs a call, 13 sits between 12 and 14/);
  assert.match(out, /Nothing was written/);
  assert.equal(read('src/f.css'), FIX_CSS);
});

test('fix apply writes the unambiguous edits only and leaves ambiguous values, and untouched old lines, alone', () => {
  const OLD = '.legacy {\n  font-size: 13px;\n  padding: 5px;\n  z-index: 999;\n}\n';
  setWork({ 'src/f.css': FIX_CSS, 'src/old.css': OLD });
  const out = applyText();
  assert.match(out, /made 7 changes, refused 0, left 5/);
  for (const w of ['src/f.css:3  padding  5px  to  4px', 'src/f.css:13  height  35px  to  36px']) assert.ok(out.includes(w), `missing ${w}`);
  const after = read('src/f.css').split('\n');
  assert.equal(after[1], '  font-size: 13px;', 'a tie is not applied');
  assert.equal(after[2], '  padding: 4px 12px;');
  assert.equal(after[3], '  border-radius: 6px;', 'a tie is not applied');
  assert.equal(after[4], '  z-index: 999;', 'a z-index is never applied');
  assert.equal(after[5], '  gap: 0.25rem;', 'rem stays rem');
  assert.equal(after[6], '  line-height: 20px;');
  assert.equal(after[7], '  font-size: 0.875rem;');
  assert.equal(after[8], '  margin: -4px 4px;', 'two edits on one line, the sign stays');
  assert.equal(after[9], '  box-shadow: 0 4px 12px rgba(0,0,0,.2);', 'a shadow is never applied');
  assert.equal(after[12], '  height: 36px;');
  assert.equal(after[15], '  height: 30px;', 'a tier change is not applied');
  assert.equal(read('src/old.css'), OLD, 'a file whose lines the diff did not add is untouched');
  const orig = FIX_CSS.split('\n');
  const changedLines = after.map((l, i) => (l !== orig[i] ? i + 1 : null)).filter(Boolean);
  assert.deepEqual(changedLines, [3, 6, 7, 8, 9, 13], 'only the lines that had a change differ');
  // A second run finds nothing left to change.
  assert.match(fixText(), /dry run, 0 changes and 5 that need a call/);
});

test('fix apply never touches an old off-scale line in a file that also has added lines', () => {
  // old.css was committed with 13px, 5px and 999. One added line joins it.
  setWork({ 'src/old.css': '.legacy {\n  font-size: 13px;\n  padding: 5px;\n  z-index: 999;\n  margin: 8px;\n  gap: 5px;\n}\n' });
  const out = applyText();
  assert.match(out, /made 1 changes/);
  assert.equal(read('src/old.css'), '.legacy {\n  font-size: 13px;\n  padding: 5px;\n  z-index: 999;\n  margin: 8px;\n  gap: 4px;\n}\n');
});

test('fix apply refuses a line whose text changed since the dry run, and applies the rest', () => {
  setWork({ 'src/f.css': FIX_CSS });
  const planFile = join(root, 'plan.json');
  const plan = fixJson(['--plan-out', planFile]);
  assert.ok(plan.items.length);
  // Someone edits line 3 after the dry run.
  writeFileSync(join(repo, 'src/f.css'), read('src/f.css').replace('  padding: 5px 12px;', '  padding: 5px 12px; /* hand edit */'));
  const out = applyText(['--plan', planFile]);
  assert.match(out, /refused {2}src\/f\.css:3 {2}padding {2}5px {2}the line changed since the dry run/);
  const after = read('src/f.css').split('\n');
  assert.equal(after[2], '  padding: 5px 12px; /* hand edit */', 'the changed line is untouched');
  assert.equal(after[6], '  line-height: 20px;', 'the unchanged lines are applied');
  assert.equal(after[12], '  height: 36px;');
});

test('fix apply from a saved plan refuses a line the diff no longer adds', () => {
  setWork({ 'src/f.css': FIX_CSS });
  const planFile = join(root, 'plan2.json');
  fixJson(['--plan-out', planFile]);
  git('add', '-A');
  git('commit', '-q', '-m', 'the work is committed after the dry run');
  const out = applyText(['--plan', planFile]);
  assert.match(out, /made 0 changes, refused 7/);
  assert.match(out, /the diff did not add this line/);
  assert.equal(read('src/f.css'), FIX_CSS, 'nothing was written');
  git('reset', '-q', '--hard', 'HEAD~1');
});

test('apply alone writes nothing, it needs --fix', () => {
  setWork({ 'src/f.css': FIX_CSS });
  const r = spawnSync('node', [LINT, '--repo', repo, '--client', 'acme', '--apply'], { encoding: 'utf8' });
  assert.match(r.stdout, /only works with --fix/);
  assert.equal(read('src/f.css'), FIX_CSS);
});

test('fix keeps CRLF line endings and follows the brand scale, Beta 4px goes to its 3px radius', () => {
  setWork({ 'src/crlf.css': '.a {\r\n  padding: 5px;\r\n  border-radius: 4px;\r\n}\r\n' });
  const r = spawnSync('node', [LINT, '--repo', repo, '--client', 'beta', '--fix', '--apply'], { encoding: 'utf8' });
  assert.match(r.stdout, /made 2 changes/);
  assert.equal(read('src/crlf.css'), '.a {\r\n  padding: 4px;\r\n  border-radius: 3px;\r\n}\r\n');
});

test('rem, em and a leading dot round trip in the unit the line used, and JS numbers stay numbers', () => {
  setWork({
    'src/rt.css': '.a {\n  padding: .3rem;\n  font-size: 0.85em;\n}\n',
    'src/rt.tsx': 'const s = { fontSize: 11, padding: "5px 12px", gap: 5, width: 100 };\n',
  });
  applyText();
  assert.equal(read('src/rt.css'), '.a {\n  padding: .25rem;\n  font-size: 0.875em;\n}\n', 'a leading dot stays, em stays em');
  assert.equal(read('src/rt.tsx'), 'const s = { fontSize: 12, padding: "4px 12px", gap: 4, width: 100 };\n');
});

test('Tailwind arbitrary values stay arbitrary without the preset, negatives and variants kept', () => {
  const src = 'export const T = () => <div className="md:p-[5px] -mt-[5px] text-[0.85rem] rounded-[3px] leading-[21px] z-[100] shadow-[0_4px_12px_rgba(0,0,0,.2)] p-[5px_7px]" />;\n';
  setWork({ 'src/tw.tsx': src });
  const plan = fixJson();
  const byOld = Object.fromEntries(plan.items.map((i) => [i.old, i]));
  assert.equal(byOld['p-[5px]'].new, 'p-[4px]');
  assert.equal(byOld['-mt-[5px]'].new, '-mt-[4px]');
  assert.equal(byOld['text-[0.85rem]'].new, 'text-[0.875rem]');
  assert.equal(byOld['rounded-[3px]'].new, 'rounded-[4px]');
  assert.equal(byOld['leading-[21px]'].new, 'leading-[20px]');
  assert.equal(byOld['z-[100]'].status, 'call');
  assert.equal(byOld['shadow-[0_4px_12px_rgba(0,0,0,.2)]'].status, 'call');
  assert.equal(byOld['p-[5px_7px]'].status, 'call', 'two values in one bracket need a call');
  applyText();
  assert.equal(read('src/tw.tsx'), 'export const T = () => <div className="md:p-[4px] -mt-[4px] text-[0.875rem] rounded-[4px] leading-[20px] z-[100] shadow-[0_4px_12px_rgba(0,0,0,.2)] p-[5px_7px]" />;\n');
});

test('Tailwind arbitrary values map to the preset class when --preset is given, and stay arbitrary where the preset has none', () => {
  setWork({ 'src/tw.tsx': 'export const T = () => <button className="md:p-[5px] -mt-[5px] text-[0.85rem] rounded-[3px] rounded-t-[5px] leading-[21px] h-[35px]" />;\n' });
  const plan = fixJson(['--preset']);
  const byOld = Object.fromEntries(plan.items.map((i) => [i.old, i]));
  assert.equal(byOld['p-[5px]'].new, 'p-1');
  assert.equal(byOld['-mt-[5px]'].new, '-mt-1');
  assert.equal(byOld['text-[0.85rem]'].new, 'text-14');
  assert.equal(byOld['rounded-[3px]'].new, 'rounded', '4px is the DEFAULT radius key');
  assert.equal(byOld['rounded-t-[5px]'].new, 'rounded-t');
  assert.equal(byOld['h-[35px]'].new, 'h-9');
  assert.equal(byOld['leading-[21px]'].new, 'leading-[20px]', 'the preset has no leading class');
  applyText(['--preset']);
  assert.equal(read('src/tw.tsx'), 'export const T = () => <button className="md:p-1 -mt-1 text-14 rounded rounded-t leading-[20px] h-9" />;\n');
});

test('the preset is detected from the repo tailwind config', () => {
  const tsx = 'export const T = () => <div className="p-[5px]" />;\n';
  setWork({
    'tailwind.config.js': "const { presetFor } = require('x/foundation/tailwind-preset.cjs');\nmodule.exports = { presets: [presetFor('acme')] };\n",
    'src/tw.tsx': tsx,
  });
  assert.equal(fixJson().items[0].new, 'p-1');
  setWork({ 'src/tw.tsx': tsx });
  assert.equal(fixJson().items[0].new, 'p-[4px]');
});

test('JSX icon attributes, stroke 2 goes to 1.5 and 18 and 22 sizes are ties that need a call', () => {
  const src = 'export const A = () => <Search size={18} strokeWidth={2} />;\nexport const B = () => <svg className="icon stroke-2" viewBox="0 0 24 24"></svg>;\nexport const C = () => <Plus size="22" />;\n';
  setWork({ 'src/I.tsx': src });
  const plan = fixJson();
  assert.equal(itemAt(plan, 'src/I.tsx', 1, '18').status, 'call');
  assert.equal(itemAt(plan, 'src/I.tsx', 1, '2').new, '1.5');
  assert.equal(itemAt(plan, 'src/I.tsx', 2, 'stroke-2').new, 'stroke-[1.5]');
  assert.equal(itemAt(plan, 'src/I.tsx', 3, '22').status, 'call');
  applyText();
  assert.equal(read('src/I.tsx'), src.replace('strokeWidth={2}', 'strokeWidth={1.5}').replace('stroke-2', 'stroke-[1.5]'));
});

test('an icon set mix is a call and is never applied', () => {
  const src = "import { Search } from 'lucide-react';\nimport { BellIcon } from '@heroicons/react/24/outline';\n";
  setWork({ 'src/A.tsx': src });
  const plan = fixJson();
  const mix = plan.items.filter((i) => i.property === 'icon-set');
  assert.equal(mix.length, 1);
  assert.equal(mix[0].status, 'call');
  assert.ok(!('new' in mix[0]));
  applyText();
  assert.equal(read('src/A.tsx'), src);
});

test('the fix follows the brand, Gamma 14px goes to 15, Zeta needs a call for a control far off its tier', () => {
  setWork({ 'src/v.css': '.a {\n  font-size: 14px;\n}\n.btn {\n  height: 36px;\n}\n' });
  const run2 = (c) => JSON.parse(spawnSync('node', [LINT, '--repo', repo, '--client', c, '--fix', '--json'], { encoding: 'utf8' }).stdout);
  assert.equal(itemAt(run2('gamma'), 'src/v.css', 2, '14px').new, '15px');
  assert.equal(itemAt(run2('zeta'), 'src/v.css', 5, '36px').status, 'call');
});

// ---------- the tailwind preset ----------
const requireCjs = createRequire(import.meta.url);
const PRESET = resolve(HERE, '..', '..', 'foundation', 'tailwind-preset.cjs');
const pxOf = (v) => parseFloat(String(Array.isArray(v) ? v[0] : v));
const asc = (a, b) => a - b;

test('the preset loads and exposes only the base layout values', () => {
  const preset = requireCjs(PRESET);
  assert.deepEqual(Object.keys(preset), ['theme'], 'presetFor stays off the config keys');
  assert.equal(typeof preset.presetFor, 'function');
  const th = preset.theme;
  assert.deepEqual(Object.keys(th).sort(), ['borderRadius', 'boxShadow', 'fontSize', 'height', 'minHeight', 'screens', 'spacing', 'zIndex']);
  assert.deepEqual(Object.keys(th.fontSize).map(Number), DEFAULTS.fontSizes);
  assert.deepEqual(Object.values(th.fontSize).map(pxOf), DEFAULTS.fontSizes);
  assert.deepEqual(Object.values(th.fontSize).map((v) => pxOf(v[1].lineHeight)), [16, 20, 24, 28, 28, 32, 36, 40, 48, 56]);
  for (const v of Object.values(th.fontSize)) assert.ok(DEFAULTS.lineHeights.includes(pxOf(v[1].lineHeight)), 'every paired line height is on the scale');
  assert.deepEqual(Object.values(th.spacing).map(pxOf).sort(asc), DEFAULTS.spacing);
  assert.deepEqual(Object.values(th.borderRadius).map(pxOf).filter((n) => n < 9999).sort(asc), DEFAULTS.radius);
  assert.equal(th.borderRadius.full, '9999px');
  const heights = Object.values(th.height).filter((v) => /px$/.test(v)).map(pxOf).sort(asc);
  assert.deepEqual(heights, [...new Set([...DEFAULTS.controlHeights, ...DEFAULTS.iconSizes])].sort(asc));
  assert.deepEqual(Object.keys(th.zIndex).filter((k) => k !== 'auto').map(Number), DEFAULTS.zIndex);
  assert.deepEqual(Object.keys(th.boxShadow).sort(), ['1', '2', '3', 'none']);
  assert.deepEqual(th.screens, { w1280: '1280px', w1440: '1440px', w1600: '1600px', w1920: '1920px' });
});

test('off-scale classes do not exist in the preset', () => {
  const th = requireCjs(PRESET).theme;
  for (const k of ['11', '13', '15', '17', '19']) assert.ok(!(k in th.fontSize), `text-${k}`);
  for (const k of ['5', '7', '9', '10', '14', '20']) assert.ok(!(k in th.spacing), `p-${k}`);
  for (const k of ['sm', 'md']) assert.ok(!(k in th.borderRadius), `rounded-${k} is 2px or 6px`);
  for (const k of ['5', '70', '100', '999']) assert.ok(!(k in th.zIndex), `z-${k}`);
  assert.ok(!('12' in th.height), 'h-12 is 48px, not a control tier');
  for (const k of ['sm', 'md', 'lg', 'xl', '2xl']) assert.ok(!(k in th.screens), `no ${k} breakpoint, desktop only`);
});

test('presetFor reads clients/<client>/base-override.json and an unknown client gets the base scale', () => {
  const { presetFor } = requireCjs(PRESET);
  const base = requireCjs(PRESET);
  assert.deepEqual(presetFor('nobody').theme, base.theme);
  assert.deepEqual(presetFor('acme').theme, base.theme, 'an empty override is the base scale');
  assert.ok('15' in presetFor('gamma').theme.fontSize && !('15' in base.theme.fontSize));
  assert.ok('3' in presetFor('beta').theme.borderRadius && !('DEFAULT' in presetFor('beta').theme.borderRadius));
  assert.ok('6.25' in presetFor('epsilon').theme.spacing, 'a 25px gutter is spacing key 6.25');
  assert.deepEqual(Object.keys(presetFor('theta').theme.fontSize).map(Number), [12, 14, 16, 21, 27, 35, 46]);
  assert.deepEqual(Object.values(presetFor('theta').theme.fontSize).map((v) => pxOf(v[1].lineHeight)), [16, 20, 24, 28, 36, 44, 56], 'brand sizes pair with a brand line height');
  assert.ok(!Object.values(presetFor('zeta').theme.height).includes('36px'), 'Zeta has no 36 control');
  // Every brand's preset lists equal what baselint reads for that brand.
  for (const c of ['acme', 'gamma', 'beta', 'delta', 'epsilon', 'zeta', 'theta', 'eta', 'iota']) {
    const sc = loadScale(c);
    const th = presetFor(c).theme;
    assert.deepEqual(Object.keys(th.fontSize).map(Number), sc.fontSizes, `${c} font sizes`);
    assert.deepEqual(Object.values(th.spacing).map(pxOf).sort(asc), sc.spacing, `${c} spacing`);
    assert.deepEqual(Object.values(th.borderRadius).map(pxOf).filter((n) => n < 9999).sort(asc), sc.radius, `${c} radius`);
    assert.deepEqual(Object.values(th.height).filter((v) => /px$/.test(v)).map(pxOf).sort(asc), [...new Set([...sc.controlHeights, ...sc.iconSizes])].sort(asc), `${c} heights`);
    for (const v of Object.values(th.fontSize)) assert.ok(sc.lineHeights.includes(pxOf(v[1].lineHeight)), `${c} line height on its scale`);
  }
});

test('the preset file has no long dash and explains how a repo adds it', () => {
  const src = readFileSync(PRESET, 'utf8');
  assert.ok(!/[\u2013\u2014]/.test(src));
  assert.ok(/presets: \[presetFor\(/.test(src) && /extend/.test(src) && /colors/.test(src));
});

rmSync(root, { recursive: true, force: true });
console.log(`\n${passed} passed`);
