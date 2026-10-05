#!/usr/bin/env node
// Installs the studio kit for the user, so it is active in every Claude Code session on this
// machine or in this cloud environment, in any repo. The freelancing repo carries its own copy in
// CLAUDE.md, .claude/ and studio/, so it needs none of this.
//
//   node studio/install.mjs              rules, guard hooks and helper agents, for the user
//   node studio/install.mjs --skills     also the four skills, for a machine where account skills
//                                        do not reach Claude Code
//   node studio/install.mjs --cloud      for a cloud environment setup script. Does nothing when
//                                        the current folder is the freelancing repo
//   node studio/install.mjs --uninstall  takes it all out again. Client data in ~/.claude/studio
//                                        is kept
//   --home <dir>                         install under <dir>/.claude instead of the home folder
//
// What it writes
//   ~/.claude/studio/            the kit, the rules and the scripts. clients/ and .state/ are kept
//   ~/.claude/CLAUDE.md          one marked block that loads the rules. Text outside it is kept
//   ~/.claude/settings.json      the two guard hooks, through hooks/wire.mjs
//   ~/.claude/agents/            quick, read, build and deep. A file that is not the kit's is kept
//   ~/.claude/skills/            with --skills only, each folder marked with .studio-kit
// Running it twice is safe. No dependencies.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { addHooks, removeHooks } from './hooks/wire.mjs';

const STUDIO = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(STUDIO, '..');
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const hi = argv.indexOf('--home');
const CLAUDE = join(hi >= 0 && argv[hi + 1] ? resolve(argv[hi + 1]) : homedir(), '.claude');
const KIT = join(CLAUDE, 'studio');
const START = '<!-- studio kit start, written by studio/install.mjs -->';
const END = '<!-- studio kit end -->';
const MARK = '.studio-kit';
const KIT_FILES = ['DOCTRINE.md', 'README.md', 'package.json', 'install.mjs', 'foundation', 'scripts', 'hooks', 'clients/_template'];
const AGENTS = ['quick', 'read', 'build', 'deep'];
const say = (m) => console.log(m);

// The rules in the kit repo say studio/ for the kit root. Installed for the user, that is ~/.claude/studio.
const homePaths = (text) => text.replace(/`studio\//g, '`~/.claude/studio/');

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '').trim();
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { throw new Error(`${file} is not valid JSON, so nothing was changed. Fix it by hand and run this again`); }
}
const writeJson = (file, v) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(v, null, 2) + '\n'); };

function setBlock(file, block) {
  const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const i = old.indexOf(START);
  const j = old.indexOf(END);
  const rest = i >= 0 && j > i ? old.slice(0, i) + old.slice(j + END.length) : old;
  const kept = rest.replace(/^\s+|\s+$/g, '');
  const text = block ? `${block}\n${kept ? `\n${kept}\n` : ''}` : (kept ? `${kept}\n` : '');
  if (!text && !existsSync(file)) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function inKitRepo() {
  let top = process.cwd();
  try { top = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* not a repo */ }
  return existsSync(join(top, 'studio', 'DOCTRINE.md')) && existsSync(join(top, '.claude', 'skills', 'uireview'));
}

function install() {
  // The kit files. Client data and review state from an earlier install stay.
  mkdirSync(KIT, { recursive: true });
  for (const f of KIT_FILES) cpSync(join(STUDIO, f), join(KIT, f), { recursive: true, force: true });
  const reg = join(KIT, 'clients', 'registry.json');
  if (!existsSync(reg)) {
    const shipped = readJson(join(STUDIO, 'clients', 'registry.json'), {});
    writeJson(reg, { _comment: shipped._comment, _example: shipped._example, clients: [] });
  }
  // The operating agreement, loaded from the user CLAUDE.md through one marked block.
  const agreement = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/^@studio\/DOCTRINE\.md$/m, '@DOCTRINE.md');
  writeFileSync(join(KIT, 'AGREEMENT.md'), homePaths(agreement));
  setBlock(join(CLAUDE, 'CLAUDE.md'), [
    START,
    'The studio kit. Outside the freelancing repo the kit root is `~/.claude/studio`. In the freelancing',
    'repo its own `studio/` folder wins, with the client data.',
    '',
    '@~/.claude/studio/AGREEMENT.md',
    END,
  ].join('\n'));
  say(`rules in ${KIT}, loaded from ${join(CLAUDE, 'CLAUDE.md')}`);

  // Guard hooks.
  const settings = join(CLAUDE, 'settings.json');
  writeJson(settings, addHooks(readJson(settings, {}), KIT.replace(/\\/g, '/')));
  say(`guard hooks in ${settings}`);

  // Helper agents. A file with the same name that is not the kit's is left alone.
  const agents = join(CLAUDE, 'agents');
  mkdirSync(agents, { recursive: true });
  for (const a of AGENTS) {
    const dest = join(agents, `${a}.md`);
    const text = homePaths(readFileSync(join(ROOT, '.claude', 'agents', `${a}.md`), 'utf8'));
    if (existsSync(dest) && !readFileSync(dest, 'utf8').includes('studio/foundation/writing.md')) { say(`kept your own ${dest}, the kit's ${a} agent was not installed`); continue; }
    writeFileSync(dest, text);
  }
  say(`helper agents in ${agents}`);

  // Skills, laid out as the account skill zips are, so K is each skill's own folder.
  if (flag('--skills')) {
    const skills = join(CLAUDE, 'skills');
    for (const name of ['uireview', 'harden', 'taste', 'mode']) {
      const dest = join(skills, name);
      if (existsSync(dest) && !existsSync(join(dest, MARK))) { say(`kept your own ${dest}, the kit's ${name} skill was not installed`); continue; }
      rmSync(dest, { recursive: true, force: true });
      cpSync(join(ROOT, '.claude', 'skills', name), dest, { recursive: true });
      for (const f of ['foundation', 'scripts', 'hooks']) cpSync(join(STUDIO, f), join(dest, f), { recursive: true });
      writeFileSync(join(dest, MARK), 'Installed by studio/install.mjs. Removed by --uninstall.\n');
    }
    say(`skills in ${skills}`);
  }
}

function uninstall() {
  setBlock(join(CLAUDE, 'CLAUDE.md'), '');
  const settings = join(CLAUDE, 'settings.json');
  if (existsSync(settings)) writeJson(settings, removeHooks(readJson(settings, {})));
  for (const a of AGENTS) {
    const f = join(CLAUDE, 'agents', `${a}.md`);
    if (existsSync(f) && readFileSync(f, 'utf8').includes('~/.claude/studio/foundation/writing.md')) rmSync(f);
  }
  const skills = join(CLAUDE, 'skills');
  if (existsSync(skills)) for (const n of readdirSync(skills)) if (existsSync(join(skills, n, MARK))) rmSync(join(skills, n), { recursive: true, force: true });
  for (const f of [...KIT_FILES, 'AGREEMENT.md']) rmSync(join(KIT, f), { recursive: true, force: true });
  say(`kit removed. Client data and review state in ${KIT} were kept`);
}

try {
  if (flag('--uninstall')) uninstall();
  else if (flag('--cloud') && inKitRepo()) say('this is the freelancing repo, which carries its own kit. Nothing installed');
  else install();
} catch (e) {
  console.error(`install.mjs failed ${e.message || e}`);
  process.exit(1);
}
