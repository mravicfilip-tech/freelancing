// Run with  node studio/scripts/test/install.test.mjs
// Installs into a temp home, runs it twice, checks what it wrote, then uninstalls. Also packs the
// account skill zips and reads them back.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pack } from '../pack.mjs';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INSTALL = join(STUDIO, 'install.mjs');
const home = mkdtempSync(join(tmpdir(), 'install-test-'));
const C = join(home, '.claude');
mkdirSync(C, { recursive: true });
writeFileSync(join(C, 'CLAUDE.md'), '# my own notes\nkeep me\n');
writeFileSync(join(C, 'settings.json'), JSON.stringify({ theme: 'dark' }));
const run = (args, cwd = home) => spawnSync('node', [INSTALL, '--home', home, ...args], { cwd, encoding: 'utf8' });
const read = (p) => readFileSync(join(C, p), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

test('install twice gives one block, one set of hooks, and keeps what was there', () => {
  assert.equal(run(['--skills']).status, 0);
  assert.equal(run(['--skills']).status, 0);
  const md = read('CLAUDE.md');
  assert.equal(md.split('studio kit start').length, 2);
  assert.match(md, /@~\/\.claude\/studio\/AGREEMENT\.md/);
  assert.match(md, /keep me/);
  const s = JSON.parse(read('settings.json'));
  assert.equal(s.theme, 'dark');
  assert.equal(s.hooks.PreToolUse.length, 1);
  assert.equal(s.hooks.SessionStart.length, 1);
});

test('installed rules point at the home kit and load the doctrine', () => {
  const a = read('studio/AGREEMENT.md');
  assert.match(a, /^@DOCTRINE\.md$/m);
  assert.ok(!/`studio\//.test(a), 'a repo path is left in AGREEMENT.md');
  assert.ok(existsSync(join(C, 'studio', 'DOCTRINE.md')));
  assert.ok(existsSync(join(C, 'studio', 'clients', 'registry.json')));
  assert.deepEqual(JSON.parse(read('studio/clients/registry.json')).clients, []);
  assert.match(read('agents/build.md'), /~\/\.claude\/studio\/foundation\/writing\.md/);
});

test('installed skills carry the scripts they run, and the installed guard denies a sweep', () => {
  for (const f of ['SKILL.md', 'rubric.md', 'scripts/ledger.mjs', 'scripts/shoot.mjs', 'foundation/writing.md', '.studio-kit']) assert.ok(existsSync(join(C, 'skills', 'uireview', f)), f);
  const r = spawnSync('node', [join(C, 'studio', 'hooks', 'guard.mjs')], { input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: "grep -rl a . | xargs sed -i 's/a/b/'" } }), encoding: 'utf8' });
  assert.match(r.stdout, /"deny"/);
});

test('a skill or agent of the same name that is not the kit\'s is kept', () => {
  const h2 = mkdtempSync(join(tmpdir(), 'install-own-'));
  mkdirSync(join(h2, '.claude', 'agents'), { recursive: true });
  mkdirSync(join(h2, '.claude', 'skills', 'harden'), { recursive: true });
  writeFileSync(join(h2, '.claude', 'agents', 'quick.md'), 'mine');
  writeFileSync(join(h2, '.claude', 'skills', 'harden', 'SKILL.md'), 'mine');
  assert.equal(spawnSync('node', [INSTALL, '--home', h2, '--skills'], { encoding: 'utf8' }).status, 0);
  assert.equal(readFileSync(join(h2, '.claude', 'agents', 'quick.md'), 'utf8'), 'mine');
  assert.equal(readFileSync(join(h2, '.claude', 'skills', 'harden', 'SKILL.md'), 'utf8'), 'mine');
});

test('--cloud does nothing inside the kit repo and installs elsewhere', () => {
  const h3 = mkdtempSync(join(tmpdir(), 'install-cloud-'));
  const inRepo = spawnSync('node', [INSTALL, '--home', h3, '--cloud'], { cwd: resolve(STUDIO, '..'), encoding: 'utf8' });
  assert.match(inRepo.stdout, /Nothing installed/);
  assert.ok(!existsSync(join(h3, '.claude', 'studio')));
  const other = join(h3, 'other');
  mkdirSync(other);
  execFileSync('git', ['init', '-q', other]);
  assert.equal(spawnSync('node', [INSTALL, '--home', h3, '--cloud'], { cwd: other, encoding: 'utf8' }).status, 0);
  assert.ok(existsSync(join(h3, '.claude', 'studio', 'AGREEMENT.md')));
});

test('uninstall takes it all out, keeps client data and the user\'s own text', () => {
  writeFileSync(join(C, 'studio', 'clients', 'note.md'), 'data');
  assert.equal(run(['--uninstall']).status, 0);
  assert.equal(read('CLAUDE.md'), '# my own notes\nkeep me\n');
  assert.deepEqual(JSON.parse(read('settings.json')), { theme: 'dark' });
  assert.ok(!existsSync(join(C, 'agents', 'build.md')));
  assert.ok(!existsSync(join(C, 'skills', 'uireview')));
  assert.ok(existsSync(join(C, 'studio', 'clients', 'note.md')));
});

test('pack writes four zips that hold SKILL.md at the top of a folder named for the skill', () => {
  const out = mkdtempSync(join(tmpdir(), 'pack-'));
  assert.equal(pack(out).length, 4);
  for (const name of ['uireview', 'harden', 'taste', 'mode']) {
    const buf = readFileSync(join(out, `${name}.zip`));
    assert.equal(buf.readUInt32LE(0), 0x04034b50);
    assert.ok(buf.includes(Buffer.from(`${name}/SKILL.md`)), `${name}/SKILL.md`);
    assert.ok(buf.includes(Buffer.from(`${name}/foundation/writing.md`)));
  }
  assert.ok(readFileSync(join(out, 'uireview.zip')).includes(Buffer.from('uireview/scripts/ledger.mjs')));
});

console.log(`\n${passed} tests passed`);
