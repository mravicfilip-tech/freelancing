#!/usr/bin/env node
// scripts/registry.mjs
//
// Reads and edits clients/registry.json, which maps a client id to its repo folder names and its
// preview hosting project names. The guard reads the same file.
//
//   node scripts/registry.mjs <client id | repo folder | path inside a repo>
//       One line, never a scan. Prints  client | repo folders | preview projects | brand file
//   node scripts/registry.mjs --list
//       One line per client, same four fields.
//   node scripts/registry.mjs add <client id> [--repo a,b] [--project x,y]
//       Adds the client, or extends it, and creates clients/<id>/ from clients/_template when the
//       folder is missing. A repo or project name already held by another client is refused.
//
// Names match exactly, ignoring case. A trailing * matches a prefix, for example acme-preview-*.
// STUDIO_CLIENTS_DIR points the script at another clients folder.

import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, clientOfDir, find } from '../hooks/guard.mjs';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENTS = resolve(process.env.STUDIO_CLIENTS_DIR || join(STUDIO, 'clients'));
const FILE = join(CLIENTS, 'registry.json');
const fwd = (p) => String(p || '').replace(/\\/g, '/');

class Refusal extends Error {}
const refuse = (m) => { throw new Refusal(m); };

function readRegistry() {
  if (!existsSync(FILE)) return { clients: [] };
  let raw;
  try { raw = JSON.parse(readFileSync(FILE, 'utf8').replace(/^﻿/, '')); } catch {
    refuse(`registry.mjs ${fwd(FILE)} is not valid JSON. Fix it by hand, nothing was changed`);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) refuse(`registry.mjs ${fwd(FILE)} must hold an object`);
  if (!Array.isArray(raw.clients)) raw.clients = [];
  return raw;
}

const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []);
const brandFile = (id) => {
  const f = join(CLIENTS, id, 'README.md');
  return existsSync(f) ? fwd(f) : '-';
};
const line = (c) => `${c.id} | ${list(c.repos).join(', ') || '-'} | ${list(c.previewProjects).join(', ') || '-'} | ${brandFile(c.id)}`;

function lookup(query) {
  const reg = readRegistry();
  const q = String(query).trim();
  const byId = reg.clients.find((c) => c && typeof c.id === 'string' && c.id.toLowerCase() === q.toLowerCase());
  if (byId) return line(byId);
  const idx = buildIndex(reg);
  // A path inside a repo, or a bare folder name, or a preview project name.
  const isPath = /[\\/]/.test(q);
  const id = (isPath && clientOfDir(idx, q)) || find(idx.repos, q.split(/[\\/]/).filter(Boolean).pop()) || find(idx.projects, q);
  const hit = id && reg.clients.find((c) => c.id === id);
  if (!hit) refuse(`registry.mjs no client or repo matches "${query}"`);
  return line(hit);
}

function flagList(a, name) {
  const v = a[name];
  if (v === undefined) return [];
  if (v === true) refuse(`--${name} needs a value, for example --${name} one,two`);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

function add(id, a) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id || '')) refuse('registry.mjs the client id must be lowercase letters, digits and dashes, for example acme');
  const repos = flagList(a, 'repo');
  const projects = flagList(a, 'project');
  const reg = readRegistry();
  const owner = (kind, name) => {
    const n = name.toLowerCase();
    return reg.clients.find((c) => c.id !== id && list(c[kind]).some((x) => x.toLowerCase() === n));
  };
  for (const r of repos) { const o = owner('repos', r); if (o) refuse(`registry.mjs repo "${r}" already belongs to ${o.id}`); }
  for (const p of projects) { const o = owner('previewProjects', p); if (o) refuse(`registry.mjs preview project "${p}" already belongs to ${o.id}`); }
  let c = reg.clients.find((x) => x && x.id === id);
  if (!c) { c = { id, repos: [], previewProjects: [] }; reg.clients.push(c); }
  const merge = (cur, more) => [...list(cur), ...more.filter((m) => !list(cur).some((x) => x.toLowerCase() === m.toLowerCase()))];
  c.repos = merge(c.repos, repos);
  c.previewProjects = merge(c.previewProjects, projects);
  mkdirSync(CLIENTS, { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(reg, null, 2) + '\n');
  JSON.parse(readFileSync(tmp, 'utf8'));
  renameSync(tmp, FILE);
  // The client folder, from the template. Existing files are never overwritten.
  const tpl = join(CLIENTS, '_template');
  const dest = join(CLIENTS, id);
  mkdirSync(dest, { recursive: true });
  const made = [];
  for (const f of ['README.md', 'taste.md', 'tasks.md']) {
    if (existsSync(join(dest, f)) || !existsSync(join(tpl, f))) continue;
    writeFileSync(join(dest, f), readFileSync(join(tpl, f), 'utf8').replace(/<client>/g, id));
    made.push(f);
  }
  return `${line(c)}${made.length ? `\ncreated ${fwd(dest)}/ with ${made.join(', ')}` : ''}`;
}

function parse(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

function main() {
  const a = parse(process.argv.slice(2));
  if (a.list) {
    const reg = readRegistry();
    if (!reg.clients.length) { console.log('no clients yet, add one with  node scripts/registry.mjs add <id> --repo <folder> --project <name>'); return; }
    console.log(reg.clients.map(line).join('\n'));
    return;
  }
  if (a._[0] === 'add') { console.log(add(a._[1], a)); return; }
  if (!a._.length) refuse('usage registry.mjs <client id | repo folder | path>, or --list, or add <id> [--repo a,b] [--project x,y]');
  console.log(lookup(a._.join(' ')));
}

try { main(); } catch (e) {
  if (e instanceof Refusal) { console.error(e.message); process.exit(1); }
  console.error(`registry.mjs failed ${e && e.message ? e.message : e}`);
  process.exit(2);
}
