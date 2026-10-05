#!/usr/bin/env node
// Adds or removes the guard hooks in a Claude Code settings.json, for using the guard outside this
// repo. The repo itself runs the guard from .claude/settings.json. Usage
//
//   node hooks/wire.mjs add    <settings.json> <studio folder>
//   node hooks/wire.mjs remove <settings.json>
//   node hooks/wire.mjs check  <settings.json>        exit 0 when the guard hooks are present
//
// The hooks are exactly two, SessionStart with matcher startup|clear and PreToolUse with matcher
// Bash|PowerShell, both in exec form (node plus args). An entry is ours when its args name
// hooks/guard.mjs inside a folder called studio. Running add twice gives one copy. The file is
// parsed before and after the edit, written next to itself and renamed, and a file that does not
// parse is never touched. No dependencies.

import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const fwd = (p) => String(p || '').replace(/\\/g, '/');
const OURS = /studio\/hooks\/guard\.mjs$/i;

const isOurs = (h) => h && typeof h === 'object' && (Array.isArray(h.args) ? h.args : []).some((a) => typeof a === 'string' && OURS.test(fwd(a)));

export function hookBlocks(studioDir) {
  const guard = () => ({ type: 'command', command: 'node', args: [`${fwd(studioDir).replace(/\/+$/, '')}/hooks/guard.mjs`], timeout: 10 });
  return {
    SessionStart: [{ matcher: 'startup|clear', hooks: [guard()] }],
    PreToolUse: [{ matcher: 'Bash|PowerShell', hooks: [guard()] }],
  };
}

// Removes every guard hook. A group, an event or the hooks key that this leaves empty is removed
// too, and one the user left empty on their own is kept.
export function removeHooks(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  if (!s.hooks || typeof s.hooks !== 'object') return s;
  for (const ev of Object.keys(s.hooks)) {
    const groups = s.hooks[ev];
    if (!Array.isArray(groups)) continue;
    let touched = false;
    const kept = [];
    for (const g of groups) {
      if (!g || !Array.isArray(g.hooks)) { kept.push(g); continue; }
      const rest = g.hooks.filter((h) => !isOurs(h));
      if (rest.length === g.hooks.length) { kept.push(g); continue; }
      touched = true;
      if (rest.length) kept.push({ ...g, hooks: rest });
    }
    if (!touched) continue;
    if (kept.length) s.hooks[ev] = kept; else delete s.hooks[ev];
  }
  if (!Object.keys(s.hooks).length) delete s.hooks;
  return s;
}

export function addHooks(settings, studioDir) {
  const s = removeHooks(settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {});
  if (!s.hooks || typeof s.hooks !== 'object' || Array.isArray(s.hooks)) s.hooks = {};
  for (const [ev, groups] of Object.entries(hookBlocks(studioDir))) {
    s.hooks[ev] = (Array.isArray(s.hooks[ev]) ? s.hooks[ev] : []).concat(groups);
  }
  return s;
}

export function hasHooks(settings) {
  const h = settings && settings.hooks;
  if (!h || typeof h !== 'object') return false;
  return ['SessionStart', 'PreToolUse'].every((ev) => (Array.isArray(h[ev]) ? h[ev] : []).some((g) => g && Array.isArray(g.hooks) && g.hooks.some(isOurs)));
}

function readSettings(file) {
  if (!existsSync(file)) return {};
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '').trim();
  if (!text) return {};
  let v;
  try { v = JSON.parse(text); } catch (e) { throw new Error(`${file} is not valid JSON, so it was left alone. Fix it by hand and run this again`); }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${file} must hold a JSON object, so it was left alone`);
  return v;
}

function save(file, obj, expectPresent) {
  const tmp = `${file}.tmp-${process.pid}`;
  const text = JSON.stringify(obj, null, 2) + '\n';
  writeFileSync(tmp, text);
  let back;
  try { back = JSON.parse(readFileSync(tmp, 'utf8')); } catch { rmSync(tmp, { force: true }); throw new Error('the edited settings did not parse, so nothing was saved'); }
  if (hasHooks(back) !== expectPresent) { rmSync(tmp, { force: true }); throw new Error('the edited settings did not hold the expected hooks, so nothing was saved'); }
  renameSync(tmp, file);
}

function main() {
  const [cmd, file, studio] = process.argv.slice(2);
  if (!['add', 'remove', 'check'].includes(cmd) || !file || (cmd === 'add' && !studio)) {
    console.error('usage wire.mjs add <settings.json> <studio folder>, or remove <settings.json>, or check <settings.json>');
    process.exit(2);
  }
  try {
    const cur = readSettings(file);
    if (cmd === 'check') { process.exit(hasHooks(cur) ? 0 : 1); }
    if (cmd === 'add') { save(file, addHooks(cur, studio), true); console.log(`guard hooks are in ${file}`); }
    else if (hasHooks(cur) || JSON.stringify(cur).includes('guard.mjs')) { save(file, removeHooks(cur), false); console.log(`guard hooks removed from ${file}`); }
    else console.log(`no guard hooks in ${file}`);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === resolve(fileURLToPath(import.meta.url)).toLowerCase()) main();
