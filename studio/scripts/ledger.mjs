#!/usr/bin/env node
// Findings ledger for /uireview. One file per task at .state/ledger/<task>.json.
//
//   node ledger.mjs open   <task> --repo <path> [--client <id>] [--auto]
//   node ledger.mjs report                 every run, automatic against asked
//   node ledger.mjs add    <task> --sev <1|2|3> --where <s> --what <s>     prints the new id
//   node ledger.mjs mark   <task> <id> <open|fixed|partly|accepted>        accepted needs --said "<Filip's words>"
//   node ledger.mjs round  <task>                                          records a round, or prints the card
//   node ledger.mjs card   <task>
//   node ledger.mjs choose <task> "<ship|fix|drop line pasted by Filip>"
//   node ledger.mjs status <task>
//
// Rules.
//   Severity 1 blocks a client showing, 2 is a visible defect, 3 is polish.
//   Score is 10 minus 3 per open sev 1, 1 per open sev 2, 0.25 per open sev 3, floor 1, one decimal.
//   A finding counts as open while its status is open or partly.
//   Allowance is round 1 plus one re-check. Each fix choice on a card grants one more re-check.
//   From the second round on, add records only severity 1.
//   Same tree as the last round records nothing and prints the last score.
//
// Hardening, from the v2 adversarial pass.
//   Writers take a lock and write atomically, so parallel adds get distinct ids and a reader never
//   sees half a file. A corrupt or wrongly shaped file is refused, never replaced. A key on a repo
//   whose other ledger for the same client has used its allowance is refused, so a new key is not a
//   way round the card. A ledger with no client counts as every client.
//   Every refusal that could invite a retry ends with a line telling the model to stop and show
//   Filip the card. A git failure or timeout refuses the round instead of recording a wrong tree.
//   Proof of Filip's words. choose and mark accepted do not trust the text they are given. They look
//   for it in the Claude Code transcripts (STUDIO_TRANSCRIPTS_DIR overrides the folder, files touched in
//   the last 2 hours, newest first, read from the end). A proof is a genuine user message, with the
//   not-Filip blocks cut out, typed after the latest card print (cardAt), holding the line. One message
//   uuid authorises one choice, kept as proof in the ledger. There is no bypass flag.
//
// State lives in studio/.state, or ~/.claude/studio-state outside the kit repo (override with
// STUDIO_STATE_DIR). Nothing is written in the repo outside studio/.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, rmSync, readdirSync, statSync, closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// In the kit repo, state sits in studio/.state. Packed into an account skill, the kit folder has no
// DOCTRINE.md and may be read only, so state goes to the home folder instead.
const STATE = process.env.STUDIO_STATE_DIR || (existsSync(join(STUDIO, 'DOCTRINE.md')) ? join(STUDIO, '.state') : join(homedir(), '.claude', 'studio-state'));
const DIR = join(STATE, 'ledger');
const STATUSES = ['open', 'fixed', 'partly', 'accepted'];
const WEIGHT = { 1: 3, 2: 1, 3: 0.25 };
const GIT_MS = 120000;
const TRANSCRIPTS = process.env.STUDIO_TRANSCRIPTS_DIR || join(homedir(), '.claude', 'projects');
const PROOF_WINDOW_MS = 2 * 60 * 60 * 1000;
const SCAN_BYTES = 64 * 1024 * 1024;
const MAX_LINE = 8 * 1024 * 1024;
const SLACK_MS = 10 * 60 * 1000;

class Refusal extends Error {}
const refuse = (msg) => { throw new Refusal(msg); };

// What a model must do when a refusal could otherwise read as "try again".
const STOP_CARD = 'Stop. Show Filip this card and wait for the line he pastes back. Do not run another round and do not open another key.';

// ---------- git tree fingerprint ----------
// Returns the trimmed output, or null when git failed or timed out. Empty output is a real answer.
function git(repo, args, env) {
  try {
    return execFileSync('git', ['-C', repo, ...args], {
      encoding: 'utf8', timeout: GIT_MS, stdio: ['ignore', 'pipe', 'ignore'], env: env || process.env, maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
}

export function treeOf(top) {
  mkdirSync(STATE, { recursive: true });
  const idx = join(STATE, `tmp-index-${process.pid}-${Date.now()}`);
  const env = { ...process.env, GIT_INDEX_FILE: idx };
  try {
    const root = git(top, ['rev-parse', '--show-toplevel']);
    if (!root) refuse(`cannot read the git repo at ${top}. Nothing recorded. Stop and tell Filip`);
    const hasHead = git(top, ['rev-parse', '--verify', '-q', 'HEAD']);
    if (hasHead && git(top, ['read-tree', 'HEAD'], env) === null) refuse(`git could not read the tree of ${top}. Nothing recorded. Stop and tell Filip`);
    // Keep the ledger's own files out of the fingerprint when the state folder sits inside the repo.
    const rel = relative(root, STATE).replace(/\\/g, '/');
    const inside = rel && !rel.startsWith('..') && !isAbsolute(rel);
    const add = ['add', '-A'].concat(inside ? ['--', '.', `:(exclude)${rel}`] : []);
    if (git(top, add, env) === null) refuse(`git could not scan ${top} within ${GIT_MS / 1000} seconds. Nothing recorded. Stop and tell Filip`);
    const tree = git(top, ['write-tree'], env);
    if (tree) return tree;
    if (tree === null) refuse(`git could not write the tree of ${top}. Nothing recorded. Stop and tell Filip`);
  } finally {
    rmSync(idx, { force: true });
  }
  const head = git(top, ['rev-parse', 'HEAD']) || '';
  return 'h' + createHash('sha1').update(head + (git(top, ['diff', 'HEAD']) || '')).digest('hex').slice(0, 39);
}

// ---------- storage ----------
function fileFor(task) {
  if (!/^[A-Za-z0-9._-]+$/.test(task || '')) refuse(`task key "${task}" must use letters, digits, dot, dash or underscore`);
  return join(DIR, `${task}.json`);
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Windows can refuse a read or rename for a moment while another process swaps the file.
function retry(fn) {
  for (let i = 0; ; i++) {
    try { return fn(); } catch (e) {
      if (i >= 8 || !['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) throw e;
      sleep(15 + i * 15);
    }
  }
}

const shapeOk = (l) => l && typeof l === 'object' && !Array.isArray(l) && typeof l.task === 'string' && typeof l.repo === 'string' &&
  Array.isArray(l.rounds) && Array.isArray(l.findings) && Array.isArray(l.cards) &&
  l.findings.every((f) => f && typeof f === 'object' && [1, 2, 3].includes(f.sev) && typeof f.id === 'string') &&
  l.rounds.every((r) => r && typeof r === 'object' && typeof r.score === 'number' && typeof r.tree === 'string');

function readLedger(f) {
  let l;
  try { l = JSON.parse(retry(() => readFileSync(f, 'utf8')).replace(/^﻿/, '')); } catch (e) {
    if (e.code === 'ENOENT') throw e;
    l = undefined;
  }
  if (!shapeOk(l)) refuse(`the ledger file ${f} is unreadable or damaged. Stop and tell Filip. Do not delete it, do not run open again, do not retry`);
  return l;
}

function load(task) {
  const f = fileFor(task);
  if (!existsSync(f)) refuse(`no ledger for ${task}. Run open once with --repo, and if it was open before, tell Filip it vanished`);
  return readLedger(f);
}

function save(ledger) {
  mkdirSync(DIR, { recursive: true });
  const f = fileFor(ledger.task);
  const tmp = `${f}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(ledger, null, 2));
  retry(() => renameSync(tmp, f));
}

// One writer at a time. A lock folder is created atomically. A lock older than 30 seconds belongs
// to a dead process and is taken over.
function locked(fn) {
  mkdirSync(DIR, { recursive: true });
  const lock = join(DIR, '.lock');
  const start = Date.now();
  for (;;) {
    try { mkdirSync(lock); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - statSync(lock).mtimeMs > 30000) { rmSync(lock, { recursive: true, force: true }); continue; } } catch { /* gone already */ }
      if (Date.now() - start > 20000) refuse('the ledger is busy with another command. Wait a few seconds and run this one command once more. If it is still busy, stop and tell Filip');
      sleep(20 + Math.floor(Math.random() * 60));
    }
  }
  try { return fn(); } finally { rmSync(lock, { recursive: true, force: true }); }
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

// One line, so a finding can never break the card or hide a line Filip pastes.
const oneLine = (s, max) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 3) + '...' : t;
};

// ---------- proof that Filip typed it ----------

// Text the harness folds into a prompt that Filip did not type, such as helper reports, task notices
// and system reminders. Cut out, including a block left open at the end.
const NOT_FILIP = /<(agent-message|cross-session-message|task-notification|system-reminder)\b[\s\S]*?(<\/\1>|$)/gi;
const ownWords = (prompt) => (prompt || '').replace(NOT_FILIP, ' ');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const NOT_PROVEN = 'Not recorded. Filip has not typed this line since the card. Show the card and wait.';

// Every .jsonl under the transcripts folder touched in the last 2 hours, newest first.
function recentTranscripts() {
  const out = [];
  const floor = Date.now() - PROOF_WINDOW_MS;
  const walk = (d, depth) => {
    let names = [];
    try { names = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of names) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (depth < 4) walk(p, depth + 1); continue; }
      if (!e.name.endsWith('.jsonl')) continue;
      try { const st = statSync(p); if (st.mtimeMs >= floor) out.push({ p, m: st.mtimeMs }); } catch { /* gone */ }
    }
  };
  walk(TRANSCRIPTS, 0);
  return out.sort((a, b) => b.m - a.m).map((x) => x.p);
}

// Lines from the end of a file, newest first. At most SCAN_BYTES are read and a file is never held whole.
function* linesBackward(path) {
  let fd;
  try { fd = openSync(path, 'r'); } catch { return; }
  try {
    let pos = fstatSync(fd).size;
    const stop = Math.max(0, pos - SCAN_BYTES);
    let carry = Buffer.alloc(0);
    while (pos > stop) {
      const n = Math.min(1024 * 1024, pos - stop);
      pos -= n;
      const buf = Buffer.alloc(n);
      readSync(fd, buf, 0, n, pos);
      const data = Buffer.concat([buf, carry]);
      let end = data.length;
      let i;
      while (end > 0 && (i = data.lastIndexOf(10, end - 1)) >= 0) {
        const len = end - i - 1;
        if (len > 0 && len <= MAX_LINE) yield data.subarray(i + 1, end).toString('utf8');
        end = i;
      }
      carry = Buffer.from(data.subarray(0, end));
      if (carry.length > MAX_LINE) carry = Buffer.alloc(0);
    }
    if (pos === 0 && carry.length) yield carry.toString('utf8');
  } finally { closeSync(fd); }
}

// The words Filip typed in a transcript line, or null when the line is not a genuine user message.
function typedText(o) {
  if (!o || o.type !== 'user' || o.isMeta || o.isSidechain || o.toolUseResult) return null;
  if (o.origin !== undefined && o.origin !== 'human') return null;
  const c = o.message && o.message.content;
  let text;
  if (typeof c === 'string') text = c;
  else if (Array.isArray(c)) {
    if (c.some((b) => b && b.type === 'tool_result')) return null;
    text = c.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n');
  } else return null;
  return ownWords(text);
}

// Whole-word containment, so "fix T-1 F1" is not proven by "fix T-1 F10".
function holds(hay, needle) {
  const word = /\w/;
  const first = word.test(needle[0]);
  const last = word.test(needle[needle.length - 1]);
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    const before = i > 0 ? hay[i - 1] : ' ';
    const after = i + needle.length < hay.length ? hay[i + needle.length] : ' ';
    if (!(first && word.test(before)) && !(last && word.test(after))) return true;
  }
  return false;
}

// A card choice must open a line of the message, so "don't drop T" never proves "drop T".
function startsALine(text, needle) {
  return String(text).split(/\r?\n/).some((ln) => {
    const h = norm(ln);
    return h.startsWith(needle) && (h.length === needle.length || !/\w/.test(h[needle.length]));
  });
}

// Proof uuids already spent, in every ledger including closed ones.
function usedProofs() {
  const used = new Set();
  let names = [];
  try { names = readdirSync(DIR); } catch { return used; }
  for (const n of names) {
    if (!n.endsWith('.json')) continue;
    try {
      const l = JSON.parse(readFileSync(join(DIR, n), 'utf8').replace(/^﻿/, ''));
      for (const x of [...(l.cards || []), ...(l.findings || [])]) if (x && x.proof) used.add(x.proof);
    } catch { /* an unreadable file spends nothing */ }
  }
  return used;
}

// Returns the uuid of an unspent message of Filip's, typed after the latest card, that holds these words.
function proofFor(l, words, atLineStart = false) {
  const needle = norm(words);
  if (!l.cardAt) refuse('Not recorded. No card has been shown for this task yet. Show the card and wait.');
  const since = Date.parse(l.cardAt);
  if (!needle || !Number.isFinite(since)) refuse(NOT_PROVEN);
  const used = usedProofs();
  let spent = false;
  for (const file of recentTranscripts()) {
    for (const line of linesBackward(file)) {
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      const ts = Date.parse(o && o.timestamp);
      if (Number.isFinite(ts) && ts < since - SLACK_MS) break;
      if (!Number.isFinite(ts) || ts <= since) continue;
      const text = typedText(o);
      if (text === null) continue;
      if (atLineStart ? !startsALine(text, needle) : !holds(norm(text), needle)) continue;
      if (typeof o.uuid !== 'string' || !o.uuid) continue;
      if (used.has(o.uuid)) { spent = true; continue; }
      return o.uuid;
    }
  }
  if (spent) refuse('Not recorded. The message with those words already authorised an earlier choice. Show the card and wait.');
  refuse(NOT_PROVEN);
}

// ---------- the rules ----------
const isOpen = (f) => f.status === 'open' || f.status === 'partly';
const openOf = (l) => l.findings.filter(isOpen);
const openSev1 = (l) => openOf(l).filter((f) => f.sev === 1);

export function scoreOf(findings) {
  let s = 10;
  for (const f of findings) if (isOpen(f)) s -= WEIGHT[f.sev] || 0;
  return Math.max(1, Math.round(s * 10) / 10);
}

const fixChoices = (l) => l.cards.filter((c) => c.kind === 'fix').length;
// Round 1, one re-check, and one more re-check for each fix choice.
export const allowance = (l) => 2 + fixChoices(l);
const exhausted = (l) => !l.closed && l.rounds.length >= allowance(l);

function requireOpenTask(l) {
  if (l.closed) refuse(`${l.task} is closed (${l.closed}). Stop. Do not open it again unless Filip asks for a new review`);
}

const sameRepo = (a, b) => String(a).replace(/\\/g, '/').toLowerCase() === String(b).replace(/\\/g, '/').toLowerCase();

// Two ledgers share a client unless both name a client and the names differ. Every client lives in
// one repo, so the client, not the repo, is what one card holds back. A ledger with no client
// shares with everyone, so leaving --client off is not a way round the card.
const sameClient = (a, b) => !a || !b || String(a).toLowerCase() === String(b).toLowerCase();

// Other ledgers, still open, on the same repo and the same client.
function siblings(task, repo, client) {
  const out = [];
  let names = [];
  try { names = readdirSync(DIR); } catch { return out; }
  for (const n of names) {
    if (!n.endsWith('.json') || n.includes('.closed-') || n === `${task}.json`) continue;
    try {
      const l = readLedger(join(DIR, n));
      if (!l.closed && sameRepo(l.repo, repo) && sameClient(l.client, client)) out.push(l);
    } catch { /* an unreadable sibling does not block this task */ }
  }
  return out;
}

// ---------- commands ----------
function cmdOpen(task, a) {
  if (!a.repo || a.repo === true) refuse('--repo <path> is required');
  const top = git(resolve(a.repo), ['rev-parse', '--show-toplevel']);
  const f = fileFor(task);
  return locked(() => {
    if (existsSync(f)) {
      const old = readLedger(f);
      if (!old.closed) {
        if (top && !sameRepo(old.repo, top)) refuse(`${task} is already open for ${old.repo}, not ${top}. Stop and ask Filip which repo is meant`);
        return `${task} is already open, ${old.rounds.length} round(s) recorded`;
      }
    }
    if (!top) refuse(`not a git repo ${a.repo}`);
    const other = siblings(task, top, a.client && a.client !== true ? a.client : null).find(exhausted);
    if (other) {
      other.cardAt = new Date().toISOString();
      save(other);
      refuse(`${other.task} is on this repo and has used its allowance, so ${task} cannot start. ${STOP_CARD}\n${cardText(other)}`);
    }
    if (existsSync(f)) renameSync(f, join(DIR, `${task}.closed-${Date.now()}.json`));
    const ledger = { task, repo: top.replace(/\\/g, '/'), client: a.client && a.client !== true ? a.client : null, trigger: a.auto ? 'auto' : 'asked', openedAt: new Date().toISOString(), rounds: [], findings: [], cards: [] };
    save(ledger);
    return `opened ${task} for ${ledger.repo}, ${ledger.trigger}`;
  });
}

function cmdAdd(task, a) {
  const sev = Number(a.sev);
  if (![1, 2, 3].includes(sev)) refuse('--sev must be 1, 2 or 3');
  if (!a.where || a.where === true || !a.what || a.what === true) refuse('--where and --what are required');
  return locked(() => {
    const l = load(task);
    requireOpenTask(l);
    const round = l.rounds.length + 1;
    if (round > 1 && sev !== 1) refuse(`a re-check records severity 1 only, this is sev ${sev}. Not recorded`);
    const id = `F${l.findings.reduce((m, f) => Math.max(m, Number(f.id.slice(1)) || 0), 0) + 1}`;
    l.findings.push({ id, sev, where: oneLine(a.where, 200), what: oneLine(a.what, 300), status: 'open', round });
    save(l);
    return id;
  });
}

function cmdMark(task, id, status, a) {
  if (!STATUSES.includes(status)) refuse(`status must be one of ${STATUSES.join(', ')}`);
  if (status === 'accepted' && (!a.said || a.said === true)) refuse('accepted is set only by Filip\'s words, pass them with --said');
  return locked(() => {
    const l = load(task);
    requireOpenTask(l);
    const f = l.findings.find((x) => x.id === id);
    if (!f) refuse(`${task} has no finding ${id}`);
    const proof = status === 'accepted' ? proofFor(l, a.said) : null;
    f.status = status;
    if (status === 'accepted') { f.said = String(a.said); f.proof = proof; }
    save(l);
    return `${id} is ${status}`;
  });
}

function counts(l) {
  const o = openOf(l);
  return [1, 2, 3].map((s) => o.filter((f) => f.sev === s).length);
}

export function cardText(l) {
  const n = l.rounds.length;
  const [c1] = counts(l);
  const out = [`${l.task} after round ${n}, score ${scoreOf(l.findings).toFixed(1)}, ${c1} open sev 1`];
  const open = openOf(l).sort((x, y) => x.sev - y.sev || Number(x.id.slice(1)) - Number(y.id.slice(1)));
  for (const f of open) out.push(`Open  ${f.id} sev ${f.sev} ${f.what}, ${f.where}${f.status === 'partly' ? ' (partly fixed)' : ''}`);
  out.push('Paste one');
  const sev1 = openSev1(l).map((f) => f.id);
  if (!sev1.length) out.push(`  ship ${l.task}`);
  else out.push(`  ship ${l.task} waiving ${sev1.join(' ')}       (your waiver, in your words)`);
  if (open.length) out.push(`  fix ${l.task} ${open.map((f) => f.id).join(' ')}`);
  out.push(`  drop ${l.task}`);
  return out.join('\n');
}

function cmdRound(task) {
  const l0 = load(task);
  requireOpenTask(l0);
  // The scan can take a while on a large repo, so it runs before the lock is taken.
  const tree = treeOf(l0.repo);
  return locked(() => {
    const l = load(task);
    requireOpenTask(l);
    const last = l.rounds[l.rounds.length - 1];
    if (last && last.tree === tree) {
      const same = `same tree as round ${last.n}, score ${last.score.toFixed(1)}, nothing recorded`;
      if (!exhausted(l)) return `${same}. Change the code before a re-check, or show Filip the card`;
      process.exitCode = 1;
      l.cardAt = new Date().toISOString();
      save(l);
      return `${same}. No round is left for ${task}, the card decides. ${STOP_CARD}\n${cardText(l)}`;
    }
    if (l.rounds.length >= allowance(l)) {
      process.exitCode = 1;
      l.cardAt = new Date().toISOString();
      save(l);
      return `no round left for ${task}, the card decides. ${STOP_CARD}\n${cardText(l)}`;
    }
    const score = scoreOf(l.findings);
    const n = l.rounds.length + 1;
    l.rounds.push({ n, tree, at: new Date().toISOString(), score });
    save(l);
    const [c1, c2, c3] = counts(l);
    return `round ${n} recorded, score ${score.toFixed(1)}, open ${c1} sev 1, ${c2} sev 2, ${c3} sev 3`;
  });
}

// Every print of the card stamps cardAt. Proof of a choice must be typed after the latest stamp.
function cmdCard(task) {
  return locked(() => {
    const l = load(task);
    l.cardAt = new Date().toISOString();
    save(l);
    return cardText(l);
  });
}

function cmdChoose(task, line) {
  return locked(() => {
    const l = load(task);
    requireOpenTask(l);
    if (!l.rounds.length) refuse('no round recorded yet, there is no card to answer');
    const m = String(line || '').trim().replace(/\s*\([^)]*\)\s*$/, '').match(/^(ship|fix|drop)\s+(\S+)\s*(.*)$/i);
    if (!m) refuse('the line must read ship, fix or drop, then the task key');
    const verb = m[1].toLowerCase();
    if (m[2].toLowerCase() !== task.toLowerCase()) refuse(`the line names ${m[2]} but this ledger is ${task}`);
    const rest = m[3].trim();
    const after = l.rounds.length;
    const at = new Date().toISOString();
    const known = new Set(l.findings.map((f) => f.id));
    const said = String(line).trim().replace(/\s*\([^)]*\)\s*$/, '');

    if (verb === 'ship') {
      const w = rest.match(/^waiving\s+(.*)$/i);
      const ids = w ? (w[1].match(/\bF\d+\b/gi) || []).map((x) => x.toUpperCase()) : [];
      if (w && !ids.length) refuse('waiving needs the finding ids');
      const bad = ids.filter((id) => !known.has(id));
      if (bad.length) refuse(`unknown finding ${bad.join(' ')}`);
      const unwaived = openSev1(l).map((f) => f.id).filter((id) => !ids.includes(id));
      if (unwaived.length) refuse(`ship refused, open sev 1 ${unwaived.join(' ')}. Stop. Show Filip the card, he can paste ship ${task} waiving ${unwaived.join(' ')} or fix ${task} ${unwaived.join(' ')}. Do not run another round\n${cardText(l)}`);
      const proof = proofFor(l, said, true);
      for (const id of ids) {
        const f = l.findings.find((x) => x.id === id);
        if (isOpen(f)) { f.status = 'accepted'; f.said = String(line).trim(); f.proof = proof; }
      }
      l.cards.push({ after, kind: 'ship', choice: String(line).trim(), at, proof, ...(ids.length ? { waived: ids } : {}) });
      l.closed = 'shipped';
      save(l);
      return ids.length ? `shipped ${task}, waiver recorded for ${ids.join(' ')}` : `shipped ${task}`;
    }

    if (verb === 'drop') {
      l.cards.push({ after, kind: 'drop', choice: String(line).trim(), at, proof: proofFor(l, said, true) });
      l.closed = 'dropped';
      save(l);
      return `dropped ${task}`;
    }

    // fix
    const ids = (rest.match(/\bF\d+\b/gi) || []).map((x) => x.toUpperCase());
    if (!ids.length) refuse('fix needs the finding ids');
    const bad = ids.filter((id) => !known.has(id));
    if (bad.length) refuse(`unknown finding ${bad.join(' ')}`);
    if (!ids.some((id) => isOpen(l.findings.find((x) => x.id === id)))) refuse(`none of ${ids.join(' ')} is open, so there is nothing to fix and no re-check is granted. Stop and show Filip the card`);
    if (l.rounds.length < allowance(l)) refuse('a re-check is already waiting. Run that one re-check, then show Filip the card. A second fix choice is not needed');
    l.cards.push({ after, kind: 'fix', choice: String(line).trim(), at, proof: proofFor(l, said, true), ids });
    save(l);
    return `fix recorded for ${ids.join(' ')}, one re-check granted. Fix them, then run the re-check`;
  });
}

function cmdStatus(task) {
  const l = load(task);
  const [c1, c2, c3] = counts(l);
  const left = allowance(l) - l.rounds.length;
  const state = l.closed ? `closed ${l.closed}` : left > 0 ? `${left} round(s) left` : 'card decides';
  return `${task} round ${l.rounds.length}, score ${scoreOf(l.findings).toFixed(1)}, open ${c1} sev 1, ${c2} sev 2, ${c3} sev 3, ${state}`;
}

// Every review run, open, closed and archived, for the week one count of automatic runs.
function cmdReport() {
  let names = [];
  try { names = readdirSync(DIR).filter((n) => n.endsWith('.json')); } catch { /* no ledgers yet */ }
  const rows = [];
  const tot = { auto: { runs: 0, sev1: 0, shipped: 0 }, asked: { runs: 0, sev1: 0, shipped: 0 } };
  for (const n of names) {
    let l;
    try { l = JSON.parse(readFileSync(join(DIR, n), 'utf8').replace(/^﻿/, '')); } catch { continue; }
    if (!l || !Array.isArray(l.findings)) continue;
    const trig = l.trigger === 'auto' ? 'auto' : 'asked';
    const s1 = l.findings.filter((x) => x.sev === 1).length;
    tot[trig].runs++;
    tot[trig].sev1 += s1;
    if (l.closed === 'shipped') tot[trig].shipped++;
    rows.push(`${l.task}  ${trig}  ${(l.openedAt || '').slice(0, 10) || 'undated'}  rounds ${(l.rounds || []).length}  sev 1 found ${s1}  ${l.closed || 'open'}`);
  }
  for (const k of ['auto', 'asked']) rows.push(`${k} runs ${tot[k].runs}, sev 1 found ${tot[k].sev1}, shipped ${tot[k].shipped}`);
  rows.push('Tokens per run come from node scripts/tokens.mjs --since-time <openedAt>');
  return rows.join('\n');
}

function main() {
  const a = args(process.argv.slice(2));
  const [cmd, task, p3, p4] = a._;
  if (cmd === 'report') { console.log(cmdReport()); return; }
  if (!cmd || !task) refuse('usage ledger.mjs open|add|mark|round|card|choose|status <task> ..., or report');
  const run = {
    open: () => cmdOpen(task, a),
    add: () => cmdAdd(task, a),
    mark: () => cmdMark(task, p3, p4, a),
    round: () => cmdRound(task),
    card: () => cmdCard(task),
    choose: () => cmdChoose(task, p3),
    status: () => cmdStatus(task),
  }[cmd];
  if (!run) refuse(`unknown command ${cmd}`);
  console.log(run());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) {
    if (e instanceof Refusal) { console.error(e.message); process.exit(1); }
    console.error(`ledger error ${e.code || ''} ${e.message}. Stop and tell Filip. Do not retry`);
    process.exit(2);
  }
}
