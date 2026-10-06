#!/usr/bin/env node
// Token report. Reads Claude Code transcripts and sums usage per session, main thread and
// helpers (subagents) apart. Read only. Never prints prompt text.
//
//   node scripts/tokens.mjs [--since <date>] [--since-time <iso>] [--until-time <iso>]
//                           [--session <id>] [--cwd <text>] [--key <task key>]
//
//   --since <date>    only assistant turns on or after this date, for example 2026-09-28
//   --since-time <iso>  only assistant turns at or after this moment, to slice one long session.
//                       Needs a zone, Z or an offset, for example 2026-10-02T14:30:00Z
//   --until-time <iso>  only assistant turns before this moment, same format
//   --session <id>    a session id, or the start of one. Only that session's files are read, so it is fast
//   --cwd <text>      sessions whose working folder or project folder contains this text
//   --key <task key>  sessions whose user prompts or tool calls mention this key, for example acme-3
//
// Transcripts live in ~/.claude/projects/<project>/<session>.jsonl, with helpers in
// <session>/subagents/**/agent-*.jsonl. A message is written to the file more than once while it
// streams, so each message id is counted once, at its largest. A resumed session copies earlier
// history into a new file, and the copied lines keep the sessionId of the session that wrote them.
// A line whose sessionId names another session that has a transcript is skipped, it is counted in
// that session. A line with no sessionId, or one naming a session with no transcript, is counted
// once, in the oldest file that holds it. A line marked isSidechain, and everything under a
// subagents folder, counts as helper work.
//
// Fields summed from message.usage: input_tokens, output_tokens, cache_read_input_tokens,
// cache_creation_input_tokens.

import { closeSync, openSync, readSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, sep } from 'node:path';

const ROOT = process.env.CLAUDE_PROJECTS_DIR || join(homedir(), '.claude', 'projects');
const FIELDS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];

// ---------- args ----------

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--help' || a === '-h') opt.help = true;
  else if (/^--(since|since-time|until-time|session|cwd|key)$/.test(a)) {
    if (args[i + 1] === undefined || args[i + 1].startsWith('--')) { console.error(`tokens.mjs, ${a} needs a value`); process.exit(2); }
    opt[a.slice(2)] = args[++i];
  } else if (a.startsWith('--')) { console.error(`tokens.mjs, unknown flag ${a}`); process.exit(2); }
}
if (opt.help) {
  console.log('node scripts/tokens.mjs [--since <date>] [--since-time <iso>] [--until-time <iso>] [--session <id>] [--cwd <text>] [--key <task key>]');
  process.exit(0);
}
let sinceMs = null;
let untilMs = null;
if (opt.since) {
  sinceMs = Date.parse(opt.since);
  if (Number.isNaN(sinceMs)) { console.error(`tokens.mjs, cannot read the date "${opt.since}"`); process.exit(2); }
}
// A full timestamp with a zone. A bare local time would be read in whatever zone this machine is in.
const ISO_ZONED = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;
function isoMs(flag, v) {
  const ms = ISO_ZONED.test(v) ? Date.parse(v) : NaN;
  if (Number.isNaN(ms)) { console.error(`tokens.mjs, ${flag} needs a full timestamp with a zone, for example 2026-10-02T14:30:00Z or 2026-10-02T14:30:00-04:00, not "${v}"`); process.exit(2); }
  return ms;
}
if (opt['since-time']) {
  if (opt.since) { console.error('tokens.mjs, use --since or --since-time, not both'); process.exit(2); }
  sinceMs = isoMs('--since-time', opt['since-time']);
}
if (opt['until-time']) untilMs = isoMs('--until-time', opt['until-time']);
if (sinceMs !== null && untilMs !== null && untilMs <= sinceMs) { console.error('tokens.mjs, --until-time must be after the start of the slice'); process.exit(2); }
const keyRe = opt.key ? new RegExp(opt.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

// ---------- file walk ----------

function walk(dir, out) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.jsonl')) out.push(p);
  }
}

// Where a transcript belongs. project/<sid>.jsonl is the main thread of <sid>.
// project/<sid>/subagents/.../agent-x.jsonl is a helper of <sid>.
function place(file) {
  const parts = relative(ROOT, file).split(sep);
  if (parts.length === 2) return { project: parts[0], sid: parts[1].replace(/\.jsonl$/, ''), part: 'main' };
  if (parts.length >= 4 && parts[2] === 'subagents') return { project: parts[0], sid: parts[1], part: 'helper', agent: parts[parts.length - 1].replace(/\.jsonl$/, '') };
  return null;
}

// Lines as latin1 text. Fast, and every field read here is plain ASCII.
function forEachLine(file, fn) {
  const fd = openSync(file, 'r');
  const buf = Buffer.allocUnsafe(8 * 1024 * 1024);
  let tail = '';
  try {
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      const chunk = tail + buf.latin1Slice(0, n);
      let from = 0;
      for (let nl = chunk.indexOf('\n', from); nl >= 0; nl = chunk.indexOf('\n', from)) {
        if (nl > from) fn(chunk.slice(from, nl));
        from = nl + 1;
      }
      tail = chunk.slice(from);
    }
    if (tail) fn(tail);
  } finally {
    closeSync(fd);
  }
}

// ---------- scan ----------

const files = [];
walk(ROOT, files);
const stats = new Map(files.map((f) => { try { return [f, statSync(f)]; } catch { return [f, null]; } }));
// Oldest first, so the original of a resumed session is the one that is counted.
files.sort((a, b) => (stats.get(a)?.mtimeMs || 0) - (stats.get(b)?.mtimeMs || 0));

const sessions = new Map(); // key -> { sid, project, cwd, first, keyHit, main, helper, helpers:Set }
const counted = new Map(); // message id -> { sk, part, usage, ts }
const zero = () => ({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, turns: 0 });

function sessionOf(pl) {
  const key = `${pl.project}/${pl.sid}`;
  let s = sessions.get(key);
  if (!s) {
    s = { key, sid: pl.sid, project: pl.project, cwd: null, first: null, keyHit: false, main: zero(), helper: zero(), helpers: new Set() };
    sessions.set(key, s);
  }
  return s;
}

const textOf = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('\n') : '');

// Sessions that have a main transcript. A copied line naming one of these belongs to it.
const mainSids = new Set();
for (const f of files) { const p = place(f); if (p && p.part === 'main') mainSids.add(p.sid); }

for (const file of files) {
  const pl = place(file);
  if (!pl) continue;
  if (opt.session && !pl.sid.startsWith(opt.session)) continue;
  if (sinceMs !== null && (stats.get(file)?.mtimeMs || 0) < sinceMs) continue;
  const s = sessionOf(pl);
  if (pl.part === 'helper') s.helpers.add(pl.agent);
  forEachLine(file, (line) => {
    const hasUsage = line.includes('"usage"');
    const keyCandidate = keyRe && !s.keyHit && keyRe.test(line);
    if (!hasUsage && !keyCandidate) return;
    let r;
    try { r = JSON.parse(line); } catch { return; }
    // History copied into this file from another session that has its own transcript is counted there.
    if (r.sessionId && r.sessionId !== pl.sid && mainSids.has(r.sessionId)) return;
    if (!s.cwd && r.cwd) s.cwd = r.cwd;
    if (keyCandidate) {
      // A mention counts only in what Filip typed, or in a tool call. Not in attachments or tool results.
      if (r.type === 'user' && r.message && !r.isMeta && keyRe.test(textOf(r.message.content))) s.keyHit = true;
      else if (r.type === 'queue-operation' && typeof r.content === 'string' && keyRe.test(r.content)) s.keyHit = true;
      else if (r.type === 'assistant' && Array.isArray(r.message?.content) && r.message.content.some((b) => b && b.type === 'tool_use' && keyRe.test(JSON.stringify(b.input || {})))) s.keyHit = true;
    }
    const u = r.message?.usage;
    if (!hasUsage || !u || r.type !== 'assistant') return;
    const id = r.message.id || r.uuid;
    if (!id) return;
    const parsed = r.timestamp ? Date.parse(r.timestamp) : NaN;
    const ts = Number.isNaN(parsed) ? null : parsed;
    const prev = counted.get(id);
    if (prev && prev.sk !== s.key) return; // already counted in another session file
    // Subagent files, and any line marked isSidechain, are helper work.
    const part = pl.part === 'helper' || r.isSidechain === true ? 'helper' : 'main';
    if (part === 'helper' && pl.part === 'main') s.helpers.add(r.agentId || 'inline');
    const rec = prev || { sk: s.key, part, usage: zero(), ts };
    for (const f of FIELDS) rec.usage[f] = Math.max(rec.usage[f], Number(u[f]) || 0);
    if (ts !== null && (rec.ts === null || ts < rec.ts)) rec.ts = ts;
    counted.set(id, rec);
  });
}

// ---------- fold messages into sessions ----------

for (const rec of counted.values()) {
  // With a time bound, a turn with no timestamp cannot be placed in the slice, so it is left out.
  if (sinceMs !== null || untilMs !== null) {
    if (rec.ts === null) continue;
    if (sinceMs !== null && rec.ts < sinceMs) continue;
    if (untilMs !== null && rec.ts >= untilMs) continue;
  }
  const s = sessions.get(rec.sk);
  const bucket = rec.part === 'main' ? s.main : s.helper;
  for (const f of FIELDS) bucket[f] += rec.usage[f];
  bucket.turns++;
  if (rec.ts !== null && (s.first === null || rec.ts < s.first)) s.first = rec.ts;
}

// ---------- filters ----------

const slash = (p) => String(p || '').replace(/\\/g, '/').toLowerCase();
let rows = [...sessions.values()].filter((s) => s.main.turns + s.helper.turns > 0);
if (opt.session) rows = rows.filter((s) => s.sid.startsWith(opt.session));
if (opt.cwd) {
  const q = slash(opt.cwd);
  rows = rows.filter((s) => slash(s.cwd).includes(q) || s.project.toLowerCase().includes(q.replace(/[^a-z0-9]+/g, '-')));
}
if (keyRe) rows = rows.filter((s) => s.keyHit);
rows.sort((a, b) => (a.first || 0) - (b.first || 0));

// ---------- print ----------

const n = (v) => v.toLocaleString('en-US');
const sum = (b) => FIELDS.reduce((t, f) => t + b[f], 0);
const addTo = (acc, b) => { for (const f of FIELDS) acc[f] += b[f]; acc.turns += b.turns; };
const short = (p) => { const t = slash(p).split('/').filter(Boolean); return (t[t.length - 1] || '-').slice(0, 24); };

const head = ['session', 'date', 'folder', 'part', 'turns', 'input', 'output', 'cache read', 'cache write', 'total'];
const table = [head];
const totals = { main: zero(), helper: zero() };
for (const s of rows) {
  const date = s.first ? new Date(s.first).toISOString().slice(0, 10) : '-';
  const line = (part, b, label) => [s.sid.slice(0, 8), date, short(s.cwd), label, n(b.turns), n(b.input_tokens), n(b.output_tokens), n(b.cache_read_input_tokens), n(b.cache_creation_input_tokens), n(sum(b))];
  if (s.main.turns) table.push(line('main', s.main, 'main'));
  if (s.helper.turns) table.push(line('helper', s.helper, `helpers ${s.helpers.size}`));
  addTo(totals.main, s.main);
  addTo(totals.helper, s.helper);
}
const all = zero();
addTo(all, totals.main);
addTo(all, totals.helper);
const trow = (label, b) => ['', '', '', label, n(b.turns), n(b.input_tokens), n(b.output_tokens), n(b.cache_read_input_tokens), n(b.cache_creation_input_tokens), n(sum(b))];

if (!rows.length) {
  console.log('No sessions matched.');
  process.exit(0);
}
const body = [...table, [], trow('main total', totals.main), trow('helper total', totals.helper), trow('all', all)];
const width = head.map((_, i) => Math.max(...body.map((r) => (r[i] || '').length)));
const right = new Set([4, 5, 6, 7, 8, 9]);
const fmt = (r) => r.length ? r.map((c, i) => (right.has(i) ? c.padStart(width[i]) : c.padEnd(width[i]))).join('  ').trimEnd() : '';
const out = body.map(fmt);
out.splice(1, 0, width.map((w) => '-'.repeat(w)).join('  '));
out.splice(out.length - 3, 0, width.map((w) => '-'.repeat(w)).join('  '));
console.log(out.join('\n'));
console.log(`\n${rows.length} sessions${opt.key ? ` mentioning ${opt.key}` : ''}, ${n(sum(all))} tokens, of which ${n(sum(totals.helper))} in helpers.`);
if (sinceMs !== null || untilMs !== null) {
  console.log(`Slice ${sinceMs !== null ? 'from ' + new Date(sinceMs).toISOString() : 'from the start'} ${untilMs !== null ? 'to ' + new Date(untilMs).toISOString() : 'to the end'}.`);
}
