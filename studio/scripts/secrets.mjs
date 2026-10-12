#!/usr/bin/env node
// Read-only scan of recent history for pasted secrets. Exit 0 always.
//   node scripts/secrets.mjs [--since <date>] [--counts]
//
//   --since  a date such as 2026-10-01, default 14 days back
//   --counts print only the counts by kind and tool
//
// Reads Claude Code transcripts under ~/.claude/projects/**/*.jsonl and Codex sessions under
// ~/.codex/sessions/**. User turns only, never tool output or assistant text. Files older than
// the cutoff are skipped by modified time, and every file is streamed line by line. It prints
// the kind, a masked form (public prefix and the last 4 characters at most), the tool, the session
// id and the time. A value is never printed, never stored and never written to a file. Each
// distinct secret is listed once, with the number of times it was seen.

import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detect, fingerprint } from '../hooks/secrets.mjs';

const MAX_LINE = 16 * 1024 * 1024;

function walk(dir, test, out = []) {
  let names = [];
  try { names = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of names) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(e.name)) out.push(p);
  }
  return out;
}

// Text of the blocks Filip typed. Injected reminders are removed.
function cleanText(t) {
  return String(t || '').replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ' ');
}

function claudeUserText(o) {
  if (o.type !== 'user' || o.isMeta || o.isSidechain) return '';
  const c = o.message && o.message.content;
  if (typeof c === 'string') return cleanText(c);
  if (Array.isArray(c)) return c.filter((b) => b && b.type === 'text').map((b) => cleanText(b.text)).join('\n');
  return '';
}

const CODEX_INJECTED = /^\s*(?:# AGENTS\.md instructions|<environment_context>|<user_instructions>|<permissions|<INSTRUCTIONS>)/;
function codexUserText(o) {
  const p = o.payload;
  if (o.type !== 'response_item' || !p || p.type !== 'message' || p.role !== 'user' || !Array.isArray(p.content)) return '';
  const t = p.content.filter((b) => b && typeof b.text === 'string').map((b) => b.text).join('\n');
  return CODEX_INJECTED.test(t) ? '' : cleanText(t);
}

async function scanFile(file, tool, since, found) {
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  let session = basename(file).replace(/\.jsonl$/, '');
  if (tool === 'codex') session = (session.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{20,}$/i) || [session])[0];
  for await (const line of rl) {
    if (!line || line.length > MAX_LINE) continue;
    // Cheap pre-filter so only user turns are parsed.
    if (!(tool === 'claude' ? line.includes('"type":"user"') : line.includes('"role":"user"'))) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : NaN;
    if (Number.isFinite(ts) && ts < since) continue;
    const text = tool === 'claude' ? claudeUserText(o) : codexUserText(o);
    if (!text) continue;
    if (tool === 'claude' && o.sessionId) session = o.sessionId;
    for (const h of detect(text)) {
      const key = `${h.kind}|${fingerprint(h.value)}`;
      const cur = found.get(key);
      if (cur) { cur.count++; continue; }
      found.set(key, { kind: h.kind, masked: h.masked, tool, session, time: Number.isFinite(ts) ? new Date(ts).toISOString() : 'unknown', count: 1 });
    }
  }
}

export async function scan({ since, home = homedir() } = {}) {
  const found = new Map();
  const roots = [
    ['claude', join(home, '.claude', 'projects'), (n) => n.endsWith('.jsonl')],
    ['codex', join(home, '.codex', 'sessions'), (n) => n.endsWith('.jsonl')],
  ];
  let files = 0;
  for (const [tool, dir, test] of roots) {
    if (!existsSync(dir)) continue;
    for (const f of walk(dir, test)) {
      // Subagent transcripts hold prompts written by an agent, not by Filip.
      if (tool === 'claude' && /[\\/]subagents[\\/]/.test(f)) continue;
      try { if (statSync(f).mtimeMs < since) continue; } catch { continue; }
      files++;
      try { await scanFile(f, tool, since, found); } catch { /* an unreadable file is skipped */ }
    }
  }
  return { files, hits: [...found.values()].sort((a, b) => a.time.localeCompare(b.time)) };
}

function parseArgs(argv) {
  const o = { since: Date.now() - 14 * 86400000, counts: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--since') {
      const t = Date.parse(argv[++i] || '');
      if (Number.isFinite(t)) o.since = t;
    } else if (argv[i] === '--counts') o.counts = true;
  }
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const { files, hits } = await scan({ since: o.since });
  const day = new Date(o.since).toISOString().slice(0, 10);
  if (!o.counts) for (const h of hits) console.log(`${h.kind}  ${h.masked}  ${h.tool}  session ${h.session}  ${h.time}${h.count > 1 ? `  seen ${h.count} times` : ''}`);
  const by = new Map();
  for (const h of hits) { const k = `${h.kind} in ${h.tool}`; by.set(k, (by.get(k) || 0) + 1); }
  console.log(`secrets scan since ${day}, ${files} files, ${hits.length} distinct hits`);
  for (const [k, n] of [...by].sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${k}`);
}

const self = process.argv[1] ? resolve(process.argv[1]).toLowerCase() : '';
if (self === resolve(fileURLToPath(import.meta.url)).toLowerCase()) {
  try { await main(); } catch (e) { console.log(`secrets scan stopped, ${e.message}`); }
  process.exitCode = 0;
}
