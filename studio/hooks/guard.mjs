#!/usr/bin/env node
// Studio guard. A small hook that handles exactly two events and nothing else.
//
//   PreToolUse for Bash and PowerShell
//     Rule 1, blind find and replace. Denied only when one command both lists many files and
//     writes replacements into them. A read-only listing and a replace on one named file pass.
//     Rule 2, wrong client deploy. A vercel deploy from a repo whose client differs from the
//     client of the linked Vercel project asks Filip through the permission prompt. Never denies.
//   SessionStart
//     One line naming the client and its brand files, when the cwd maps to a client.
//
// Clients come from clients/registry.json, which maps a client id to repo folder names and preview
// project names. Names match exactly, ignoring case. A trailing * matches a prefix. STUDIO_CLIENTS_DIR
// points the guard at another clients folder, which the tests use.
//
// Every other event or tool prints nothing and exits 0. It never holds a turn. Any internal error
// exits 0 silently. No dependencies.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const fwd = (p) => String(p || '').replace(/\\/g, '/');
const clientsDir = () => process.env.STUDIO_CLIENTS_DIR || join(STUDIO, 'clients');

// ---------- registry and clients ----------

const VALID_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function pattern(name, client) {
  const s = String(name).toLowerCase().trim();
  if (s.endsWith('*')) return s.length > 1 ? { name: s.slice(0, -1), prefix: true, client } : null;
  return s ? { name: s, prefix: false, client } : null;
}

// Turns the registry file into two lists, repo folder names and preview project names.
export function buildIndex(raw) {
  const repos = [];
  const projects = [];
  for (const c of Array.isArray(raw && raw.clients) ? raw.clients : []) {
    if (!c || typeof c.id !== 'string' || !VALID_ID.test(c.id)) continue;
    for (const [list, out] of [[c.repos, repos], [c.previewProjects, projects]]) {
      for (const n of Array.isArray(list) ? list : []) {
        const p = typeof n === 'string' ? pattern(n, c.id) : null;
        if (p) out.push(p);
      }
    }
  }
  return { repos, projects };
}

function loadRegistry() {
  try {
    const file = join(clientsDir(), 'registry.json');
    return buildIndex(JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')));
  } catch {
    return { repos: [], projects: [] };
  }
}

export function find(list, name) {
  const n = String(name || '').toLowerCase();
  if (!n) return null;
  for (const p of list) if (p.prefix ? n.startsWith(p.name) : n === p.name) return p.client;
  return null;
}

// A linked worktree has a .git file pointing into the main repo, at <repo>/.git/worktrees/<name>.
// Returns the main repo folder name, or null.
function mainRepoName(dir) {
  try {
    const f = join(dir, '.git');
    if (!statSync(f).isFile()) return null;
    const m = readFileSync(f, 'utf8').match(/^gitdir:\s*(.+?)\s*$/m);
    if (!m) return null;
    const parts = fwd(m[1]).split('/');
    const i = parts.lastIndexOf('worktrees');
    return i >= 2 && parts[i - 1] === '.git' ? parts[i - 2] : null;
  } catch {
    return null;
  }
}

// The client of a folder. The nearest folder going up whose name is a registered repo wins, and a
// linked worktree counts as its main repo.
export function clientOfDir(reg, dir) {
  let cur = resolve(dir || '.');
  for (let i = 0; i < 40; i++) {
    const hit = find(reg.repos, basename(cur)) || find(reg.repos, mainRepoName(cur));
    if (hit) return hit;
    const up = dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return null;
}

// The directory holding .git, found by walking up. Falls back to the directory itself.
function repoTop(dir) {
  let cur = resolve(dir || '.');
  for (let i = 0; i < 40; i++) {
    if (existsSync(join(cur, '.git'))) return cur;
    const up = dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return resolve(dir || '.');
}

// ---------- command text helpers ----------

// Quoted strings become Q so words inside them are never read as commands. A double quoted string
// that is a lone variable is kept, because it can feed a write. Command substitutions inside double
// quotes are collected apart, because they can list the files a write runs over.
function scrubQuotes(s) {
  let out = '';
  const subst = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'") {
      const j = s.indexOf("'", i + 1);
      if (j < 0) { out += 'Q'; break; }
      out += 'Q';
      i = j + 1;
    } else if (c === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') { if (s[j] === '\\') j++; j++; }
      const body = s.slice(i + 1, j);
      for (const m of body.matchAll(/\$\(([^)]*)\)/g)) subst.push(m[1]);
      out += /^\$\{?\w+\}?$/.test(body) ? ' ' + body + ' ' : 'Q';
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return { text: out, subst: subst.join(' ; ') };
}

const INTERPRETER = /\b(python3?|node|ruby|perl|bash|sh|zsh|pwsh|powershell)(\.exe)?\b/i;
const INLINE_CODE = /\b(pwsh|powershell|bash|sh|zsh|cmd|node|python3?)(\.exe)?\b[^|;&\n]{0,500}\s(-c|-command|-e|-ec|-encodedcommand|\/c)\b/i;

// The command with heredoc bodies and quoted text removed, so a commit message that talks about
// sed or xargs is not read as a command. Code handed to an interpreter is kept, and the quotes
// that wrap it are opened so the commands inside are read.
function scrubFull(cmd) {
  let s = String(cmd || '');
  s = s.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]{0,400})\n([\s\S]*?)(?:\n[ \t]*\2[ \t]*(?=\n|$)|$)/g, (m, q, tag, rest, body, offset) => {
    const lineStart = s.lastIndexOf('\n', offset - 1) + 1;
    const before = s.slice(lineStart, offset);
    return INTERPRETER.test(before) ? m : rest;
  });
  // Open only the quoted text that is the code argument of an interpreter, so other quotes still scrub.
  let opened = '';
  let pos = 0;
  for (const m of s.matchAll(new RegExp(INLINE_CODE.source, 'gi'))) {
    const end = m.index + m[0].length;
    if (end < pos) continue;
    const arg = s.slice(end).match(/^\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/);
    if (!arg) continue;
    opened += s.slice(pos, end) + ' ' + (arg[1] ?? arg[2]) + ' ';
    pos = end + arg[0].length;
  }
  s = opened + s.slice(pos);
  return scrubQuotes(s);
}
const scrub = (cmd) => scrubFull(cmd).text;

const words = (stmt) => stmt.trim().split(/\s+/).filter(Boolean);
// A bracket pair is not counted. Dynamic route folders such as [slug] are common paths, not globs.
const isGlob = (t) => /[*?]|\{[^}\s]*,[^}\s]*\}/.test(t);
const isVar = (t) => /^\$[{\w@*(]/.test(t);

// ---------- rule 1, blind find and replace ----------

const ENUM_UNIX = new RegExp([
  '(?:^|[\\s;&|(`$])(?:find|fd|fdfind|xargs|locate|tree)(?:\\s|$)',
  '\\bgit\\s+(?:-C\\s+\\S+\\s+)?ls-files\\b',
  '\\bgit\\s+grep\\b[^|;&]{0,500}\\s-[a-zA-Z]*l',
  '\\b(?:rg|ag|ack)\\b[^|;&]{0,500}\\s(?:-[a-zA-Z]*l[a-zA-Z]*|--files(?:-with-matches)?)(?:\\s|$)',
  '\\bgrep\\b[^|;&]{0,500}\\s-[a-zA-Z]*(?:r[a-zA-Z]*l|l[a-zA-Z]*r|R)',
  '\\bgrep\\b[^|;&]{0,500}--(?:recursive|files-with-matches)',
  '\\bls\\b[^|;&]{0,500}\\s-[a-zA-Z]*R',
  '\\*\\*',
].join('|'), 'i');

// Walk a command's words for an in-place writer and return its file operands.
const WRITER_NAMES = new Set(['sed', 'gsed', 'perl', 'ruby', 'awk', 'gawk', 'sd', 'rpl']);

function writerOperands(toks) {
  // Index of the last in-place flag, found once, so a very long command stays linear.
  let lastInPlace = -1;
  for (let j = toks.length - 1; j >= 0; j--) {
    if (/^-[a-zA-Z0-9]*i/.test(toks[j]) || /^--in-place/.test(toks[j])) { lastInPlace = j; break; }
  }
  let lastAwkInPlace = -1;
  for (let j = toks.length - 2; j >= 0; j--) {
    if (toks[j] === '-i' && toks[j + 1] === 'inplace') { lastAwkInPlace = j; break; }
  }
  // nonFlagAfter[i] counts the words after word i that do not start with a dash.
  const nonFlagAfter = new Array(toks.length + 1).fill(0);
  for (let j = toks.length - 1; j >= 0; j--) nonFlagAfter[j] = nonFlagAfter[j + 1] + (j + 1 < toks.length && !toks[j + 1].startsWith('-') ? 1 : 0);
  for (let i = 0; i < toks.length; i++) {
    const name = toks[i].replace(/^.*[\\/]/, '').replace(/\.exe$/i, '').toLowerCase();
    if (!WRITER_NAMES.has(name)) continue;
    if (['sed', 'gsed', 'perl', 'ruby'].includes(name) && lastInPlace > i) return operandsAfterScript(toks.slice(i + 1));
    if ((name === 'awk' || name === 'gawk') && lastAwkInPlace > i) {
      const rest = toks.slice(i + 1);
      const k = rest.findIndex((x, n) => x === '-i' && rest[n + 1] === 'inplace');
      if (k >= 0) return rest.slice(k + 2).filter((x) => !x.startsWith('-')).slice(1);
    }
    if ((name === 'sd' || name === 'rpl') && nonFlagAfter[i] > 2) {
      const ops = toks.slice(i + 1).filter((x) => !x.startsWith('-'));
      if (ops.length > 2) return ops.slice(2);
    }
  }
  return null;
}

function operandsAfterScript(rest) {
  const ops = [];
  let script = false;
  for (let i = 0; i < rest.length; i++) {
    const x = rest[i];
    if (x === '-f' || /^--(expression|file)$/.test(x) || /^-[a-zA-Z0-9]*e$/.test(x)) { script = true; i++; continue; } // -e, or perl -pie, takes the script as the next word
    if (x.startsWith('-')) continue;
    ops.push(x);
  }
  return script ? ops : ops.slice(1);
}

// A for loop over a glob or a command substitution. Checked per statement so it stays linear.
function forOverGlob(s) {
  for (const part of s.split(/[;\n]/)) {
    const m = /\bfor\s+\w+\s+in\b/.exec(part);
    if (m && /\*|\$\(/.test(part.slice(m.index + m[0].length))) return true;
  }
  return false;
}

function unixBlind(s, subst) {
  const stmts = s.split(/;|&&|\|\||\n/);
  const anyEnum = ENUM_UNIX.test(s) || ENUM_UNIX.test(subst) || forOverGlob(s);
  for (const stmt of stmts) {
    // Each piped command on its own, so flags of a later command are not read as the writer's.
    let ops = null;
    for (const seg of stmt.split('|')) {
      ops = writerOperands(words(seg));
      if (ops) break;
    }
    if (!ops) continue;
    if (ENUM_UNIX.test(stmt) || ENUM_UNIX.test(subst)) return true;
    if (ops.length >= 2 || ops.some(isGlob)) return true;
    if (ops.some(isVar) && anyEnum) return true;
  }
  return false;
}

const PS_VALUE_PARAMS = new Set(['value', 'encoding', 'stream', 'width', 'inputobject', 'filter', 'include', 'exclude', 'delimiter', 'credential', 'nonewline']);
const PS_PATH_PARAMS = new Set(['path', 'literalpath', 'filepath', 'lp', 'pspath']);

function tokensQuoted(text) {
  const out = [];
  const re = /"[^"]*"|'[^']*'|[^\s]+/g;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

// Targets of Set-Content, Add-Content, Out-File and the .NET WriteAll calls.
function psWriteTargets(text) {
  const out = [];
  for (const m of text.matchAll(/\bWriteAll(?:Text|Lines|Bytes)\s*\(\s*("[^"]*"|'[^']*'|[^,)]+)/gi)) out.push(m[1].trim());
  for (const m of text.matchAll(/(?:\b(?:set-content|add-content|out-file)\b|(?<=[\s|;{(])sc(?=\s))([^|;)}\n]*)/gi)) {
    const toks = tokensQuoted(m[1]);
    let path = null;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.startsWith('-')) {
        const p = t.slice(1).toLowerCase();
        if (PS_PATH_PARAMS.has(p)) { path = toks[i + 1] ?? null; i++; }
        else if (PS_VALUE_PARAMS.has(p)) i++;
      } else if (path === null) path = t;
    }
    out.push(path === null ? '$_' : path);
  }
  return out;
}

function psBlind(orig, s) {
  if (!/-[ci]?replace\b|\.replace\(|\[regex\]::replace/i.test(s)) return false;
  const targets = psWriteTargets(orig);
  if (!targets.length) return false;
  const loopVars = [...orig.matchAll(/foreach\s*\(\s*\$(\w+)\s+in\b/gi)].map((m) => m[1]);
  const loopRef = new RegExp(`\\$(?:_|PSItem${loopVars.length ? '|' + loopVars.join('|') : ''})\\b`);
  const loopBound = (t) => {
    if (loopRef.test(t)) return true;
    const v = t.match(/^\$(\w+)$/);
    if (!v) return false;
    return new RegExp(`\\$${v[1]}\\s*=\\s*[^;\\n]*${loopRef.source}`, 'i').test(orig);
  };
  const globTarget = (t) => !/\$/.test(t) && isGlob(t.replace(/^["']|["']$/g, ''));
  if (targets.some(globTarget)) return true;
  if (!targets.some(loopBound)) return false;
  const gciWord = /\b(?:get-childitem|gci|dir|ls)\b/i.test(s);
  const gciEnum = gciWord && (
    /\s-(?:r(?:ec(?:u(?:r(?:se?)?)?)?)?|depth)\b/i.test(s) ||
    /\s[^\s|;]*\*[^\s|;]*/.test(s) ||
    /\|\s*(?:foreach-object|foreach|%)\b/i.test(s) ||
    /foreach\s*\([^)]*\bin\b[^)]*(?:get-childitem|gci|\bdir\b|\bls\b)/i.test(s)
  );
  return gciEnum || ENUM_UNIX.test(s);
}

function scriptBlind(s) {
  return /(readdirsync|readdir\(|os\.walk|\.walk\(|\bglob\(|globsync|rglob|walksync|fast-glob)/i.test(s) &&
    /(writefilesync|writefile\(|\.write\(|write_text)/i.test(s) &&
    /(\.replace|replaceall|\breplace\(|\bsub\()/i.test(s);
}

export function isBlindReplace(cmd) {
  if (!cmd) return false;
  const orig = capped(cmd);
  const { text: s, subst } = scrubFull(orig);
  return unixBlind(s, subst) || psBlind(orig, s) || scriptBlind(s);
}

// ---------- rule 2, wrong client deploy ----------

const WRAPPERS = new Set(['npx', 'pnpm', 'dlx', 'bunx', 'yarn', 'exec', 'npm', '--yes', '-y', 'sudo', 'time', 'call', '&', 'cmd', '/c', '--']);
const VALUE_FLAGS = new Set(['--token', '-t', '--scope', '-S', '--cwd', '-A', '--local-config', '-Q', '--global-config', '--target', '--env', '-e', '--build-env', '-b', '--meta', '-m', '--regions', '--name', '-n', '--project']);

// Returns the vercel word list when this segment is a deploy, else null.
function deployWords(seg) {
  const toks = words(seg);
  let i = 0;
  while (i < toks.length && (WRAPPERS.has(toks[i]) || /^[A-Za-z_]\w*=/.test(toks[i]))) i++;
  const first = (toks[i] || '').replace(/^.*[\\/]/, '');
  if (!/^(vercel|vc)(@[\w.-]+)?(\.cmd|\.exe|\.ps1)?$/i.test(first)) return null;
  const args = toks.slice(i + 1);
  if (args.some((a) => /^(--version|-v|--help|-h)$/.test(a))) return null;
  let sub = null;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (a.startsWith('-')) { if (VALUE_FLAGS.has(a)) k++; continue; }
    sub = a;
    break;
  }
  // A quoted first word is scrubbed to Q, and could be a folder to deploy, so it counts.
  if (sub === null || sub === 'deploy' || sub === 'Q' || /[\\/]|^\./.test(sub)) return args;
  return null;
}

// Longest command text the rules read. A longer command is read up to here, so a pasted wall of
// text can never keep the hook busy past its timeout.
const MAX_CMD = 100000;
const capped = (cmd) => String(cmd || '').slice(0, MAX_CMD);

export function isDeploy(cmd) {
  return scrub(capped(cmd)).split(/;|&&|\|\||\||\n/).some((seg) => deployWords(seg) !== null);
}

// The folder a deploy names as its first word, as in vercel ../other-repo --prod, or null.
function deployFolder(cmd) {
  for (const seg of scrub(capped(cmd)).split(/;|&&|\|\||\||\n/)) {
    const args = deployWords(seg);
    if (!args) continue;
    for (let k = 0; k < args.length; k++) {
      const a = args[k];
      if (a.startsWith('-')) { if (VALUE_FLAGS.has(a)) k++; continue; }
      return a !== 'deploy' && a !== 'Q' && /[\\/]|^\./.test(a) ? a : null;
    }
  }
  return null;
}

function commandDirs(cmd) {
  const out = [];
  const re = /(?:^|[\s;&|(])(?:cd|pushd|set-location|sl|chdir)\s+(?:-path\s+|-literalpath\s+)?("[^"]+"|'[^']+'|[^\s;&|)]+)|--cwd[=\s]("[^"]+"|'[^']+'|[^\s;&|)]+)/gi;
  for (const m of String(cmd || '').matchAll(re)) {
    const raw = (m[1] || m[2]).replace(/^["']|["']$/g, '');
    const drive = raw.match(/^\/([A-Za-z])\/(.*)$/);
    out.push(drive ? `${drive[1]}:/${drive[2]}` : raw);
  }
  return out;
}

function linkedProject(dir, top) {
  let cur = resolve(dir);
  const stop = resolve(top);
  for (let i = 0; i < 40; i++) {
    const f = join(cur, '.vercel', 'project.json');
    if (existsSync(f)) {
      try { return JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, '')).projectName || null; } catch { return null; }
    }
    if (cur.toLowerCase() === stop.toLowerCase()) break;
    const up = dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return null;
}

function wrongClient(cmd, cwd, reg) {
  if (!isDeploy(cmd)) return null;
  let dir = cwd || process.cwd();
  for (const x of commandDirs(cmd)) dir = isAbsolute(x) ? x : join(dir, x);
  const folder = deployFolder(cmd);
  if (folder) {
    const drive = folder.match(/^\/([A-Za-z])\/(.*)$/);
    const f = drive ? `${drive[1]}:/${drive[2]}` : folder;
    dir = isAbsolute(f) ? f : join(dir, f);
  }
  const top = repoTop(dir);
  const project = linkedProject(dir, top);
  if (!project) return null;
  // Nearest registered folder first, since every client lives in one repo. Walking up from dir
  // reaches the repo root too, so a client registered by the repo name still matches.
  const repoClient = clientOfDir(reg, dir);
  const projClient = find(reg.projects, project);
  if (!repoClient || !projClient || repoClient === projClient) return null;
  return `This repo is client ${repoClient} but the linked preview project "${project}" is client ${projClient}. Confirm this deploy goes where you mean.`;
}

// ---------- SessionStart ----------

function sessionLine(cwd, reg) {
  const client = clientOfDir(reg, cwd || '.');
  if (!client) return null;
  const readme = `${fwd(clientsDir())}/${client}/README.md`;
  const taste = `${fwd(clientsDir())}/${client}/taste.md`;
  if (!existsSync(readme) || !existsSync(taste)) return null;
  return `Client ${client}. Brand rules in ${readme}, taste in ${taste}. Read both before UI work.`;
}

// ---------- entry ----------

export function decide(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.hook_event_name === 'SessionStart') {
    // Once per session. A resume or a compact already carries the line, so only a fresh start
    // (startup, or clear, which begins a new session) prints it. An absent source counts as startup.
    if (d.source && d.source !== 'startup' && d.source !== 'clear') return null;
    const line = sessionLine(d.cwd, loadRegistry());
    return line ? { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: line } } : null;
  }
  if (d.hook_event_name === 'PreToolUse' && (d.tool_name === 'Bash' || d.tool_name === 'PowerShell')) {
    const cmd = d.tool_input && d.tool_input.command;
    if (typeof cmd !== 'string' || !cmd) return null;
    if (isBlindReplace(cmd)) {
      return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Blind find and replace across files is blocked. List the matches with Grep, read each one, and change them one by one with Edit.' } };
    }
    const why = wrongClient(cmd, d.cwd, loadRegistry());
    if (why) return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: why } };
  }
  return null;
}

async function main() {
  const watchdog = setTimeout(() => process.exit(0), 3000);
  try {
    let raw = '';
    process.stdin.setEncoding('utf8');
    for await (const c of process.stdin) raw += c;
    const out = decide(JSON.parse(raw.replace(/^﻿/, '').trim() || '{}'));
    if (out) process.stdout.write(JSON.stringify(out));
  } catch {
    // Never block work because the guard failed.
  }
  clearTimeout(watchdog);
  process.exit(0);
}

const self = process.argv[1] ? resolve(process.argv[1]).toLowerCase() : '';
if (self === resolve(fileURLToPath(import.meta.url)).toLowerCase()) main();
