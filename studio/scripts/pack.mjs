#!/usr/bin/env node
// Builds the round 1 diff pack for the critic, compact and in one order.
//
//   node scripts/pack.mjs --task <key> --repo <repo> --base <baseline> --client <id> --shots <dir>
//                         --surface "<words>" [--out <dir>] [--budget 60000]
//
// Writes <out>/pack.md and copies contact.png from the shots folder beside it. <out> defaults to
// ~/.claude/studio/.state/packs/<task>. Prints each section's size in characters and estimated tokens (4
// characters a token). Read only, nothing in the repo or the brand folder is written.
//
// Sections, in order
//   ask         task, client, baseline, the surface in the ask's words
//   diff        git diff --stat and git status --short, always
//   hunks       git diff -U1 for the files the surface names, then every stylesheet, token, layout and
//               shared component file, modified files before new ones. Lock files, generated files,
//               images and snapshots are left out. Everything else stays stat only.
//   baselint    the plain output, at most 80 lines then a count of the rest, never cut for budget
//   kit         kit.mjs match, only when clients/<client>/kit/ holds items, never cut for budget
//   golden      golden.mjs compare, only when clients/<client>/golden/ holds screens, never cut
//   walk        a summary of every walk.json under the shots folder, never cut for budget
//   shots       report.compact.txt from the shots folder (built from report.json when missing)
//   taste       clients/<client>/taste.md entries that apply, see below
//
// Budget. Over it, hunks are trimmed first, whole files in priority order, and every file left out is
// listed with its changed line count in the hunks section. Nothing else is cut silently. When the
// other sections alone pass the budget the pack says so on its first line.
//
// Taste filter. An entry is kept when it is marked app wide (APP-WIDE, including REJECTED APP-WIDE,
// since an app wide rejection is a rule), or when it shares a word with the surface, the changed
// file names or the route names. An entry whose status is plain REJECTED, or SUPERSEDED and dated
// over 30 days ago, is dropped unless it shares such a word. The count kept and dropped is printed in
// the section. STUDIO_CLIENTS_DIR points at another clients folder, used by the tests.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compactReport } from './lib/compact-report.mjs';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = join(STUDIO, 'scripts');
const clientsDir = () => process.env.STUDIO_CLIENTS_DIR || join(STUDIO, 'clients');
const tok = (n) => Math.round(n / 4);

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    out[k] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

function run(cmd, list, opts = {}) {
  const r = spawnSync(cmd, list, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  return { status: r.status, out: (r.stdout || '').replace(/\r\n/g, '\n'), err: (r.stderr || '').trim() };
}
const git = (repo, ...a) => run('git', ['-C', repo, ...a]);
const node = (script, list) => run('node', [join(SCRIPTS, script), ...list]);

// ---------- files and hunks ----------
const SKIP = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|composer\.lock|Cargo\.lock|poetry\.lock|node_modules|dist|build|\.next|coverage|__snapshots__)\/|\.(lock|snap|min\.js|min\.css|map|png|jpe?g|gif|webp|avif|ico|svg|pdf|woff2?|ttf|otf|eot|mp4|mov)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
const STYLE_FILE = /\.(css|scss|sass|less|styl)$/i;
const SHARED_FILE = /(^|\/)(tokens?|theme|themes|variables|layout|layouts|shell|globals?|base)[^/]*\.(t|j)sx?$|(^|\/)(components?|shared|ui|common|primitives)\//i;
const TOKEN_FILE = /(^|[/._-])(tokens?|theme|variables|layout|shell|globals?)([/._-]|$)/i;

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'page', 'pages', 'screen', 'view', 'src', 'tsx', 'jsx', 'css', 'scss', 'html', 'index', 'main', 'app', 'component', 'components', 'style', 'styles', 'file', 'files', 'new', 'old', 'add', 'fix', 'use', 'all', 'one', 'two', 'its', 'are', 'not', 'but']);
const words = (text) => String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
const norm = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

function changedFiles(repo, base) {
  const r = git(repo, 'diff', '--name-status', base);
  const files = [];
  for (const line of r.out.split('\n').filter(Boolean)) {
    const [st, ...rest] = line.split('\t');
    const path = rest[rest.length - 1];
    files.push({ path, status: st[0] });
  }
  return files;
}

function buildHunks(repo, base, files, surfaceWords, budget) {
  const named = (p) => words(p.replace(/\.[a-z]+$/i, '')).some((w) => surfaceWords.has(norm(w)));
  const cand = files.filter((f) => !SKIP.test(f.path) && f.status !== 'D');
  for (const f of cand) {
    f.named = named(f.path);
    f.shared = STYLE_FILE.test(f.path) || SHARED_FILE.test(f.path) || TOKEN_FILE.test(f.path);
    // 0 modified and named, 1 modified style or shared, 2 new and named, 3 new style or shared.
    const wanted = f.named || f.shared;
    f.rank = f.status === 'A' || f.status === 'R' ? (wanted ? (f.named ? 2 : 3) : 9) : (wanted ? (f.named ? 0 : 1) : 9);
  }
  const wanted = cand.filter((f) => f.rank < 9).sort((a, b) => a.rank - b.rank || a.path.localeCompare(b.path));
  const stat = cand.filter((f) => f.rank === 9).map((f) => f.path);
  const kept = [], left = [];
  let used = 0;
  for (const f of wanted) {
    const d = git(repo, 'diff', '-U1', base, '--', f.path).out;
    const changed = d.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).length;
    if (!d.trim()) continue;
    if (used + d.length <= budget) { kept.push({ ...f, text: d }); used += d.length; }
    else left.push({ ...f, changed, chars: d.length });
  }
  return { kept, left, stat, used };
}

// ---------- taste ----------
function tasteEntries(text) {
  const entries = [];
  for (const line of String(text).split('\n')) {
    if (/^- \*\*/.test(line)) entries.push(line);
    else if (entries.length && line.trim() && !/^#/.test(line)) entries[entries.length - 1] += '\n' + line;
  }
  return entries.map((raw) => {
    const m = raw.match(/^- \*\*(\d{4}-\d{2}-\d{2})[^,]*,\s*([^*]*)\*\*\s*([\s\S]*)$/);
    const date = m ? m[1] : null;
    const title = m ? m[2] : '';
    const rest = m ? m[3] : raw;
    const status = rest.slice(0, 160);
    return { raw, date, title, rest, status };
  });
}

export function filterTaste(text, matchWords, today = new Date()) {
  const entries = tasteEntries(text);
  const keep = [];
  const drop = { rejected: 0, superseded: 0, unrelated: 0 };
  const ageDays = (d) => (d ? (today - new Date(d + 'T00:00:00')) / 86400000 : 0);
  for (const e of entries) {
    const toks = new Set(words(e.raw).map(norm));
    const hit = [...matchWords].some((w) => toks.has(norm(w)));
    const appWide = /APP[- ]WIDE/i.test(e.status);
    const rejected = /^REJECTED\b/.test(e.rest) && !/APP[- ]WIDE/i.test(e.status) && !/then ACCEPTED/i.test(e.status);
    const superseded = /SUPERSEDED/i.test(e.status) && ageDays(e.date) > 30;
    if (hit) { keep.push(e); continue; }
    if (rejected) { drop.rejected++; continue; }
    if (superseded) { drop.superseded++; continue; }
    if (appWide) { keep.push(e); continue; }
    drop.unrelated++;
  }
  return { keep, drop, total: entries.length };
}

// ---------- walk ----------
function findFiles(dir, name, depth = 4, out = []) {
  if (depth < 0 || !existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git') continue;
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) findFiles(p, name, depth - 1, out);
    else if (f === name) out.push(p);
  }
  return out;
}

function walkSummary(file) {
  const w = JSON.parse(readFileSync(file, 'utf8'));
  const n = (s) => (w.findings || []).filter((f) => f.severity === s).length;
  const lines = [`walk "${w.job}" ${(w.steps || []).length} steps run, ${w.clicks} clicks, ${(w.deadEnds || []).length} dead ends${w.stoppedAt !== null && w.stoppedAt !== undefined ? ` at step ${w.stoppedAt}` : ''}, ${(w.expectFailures || []).length} failed expects, ${(w.consoleErrors || []).length} console errors, ${(w.failedRequests || []).length} failed requests, ${n(1)} sev 1, ${n(2)} sev 2`];
  for (const f of w.findings || []) lines.push(`  s${f.severity} ${f.check} step ${f.step} | ${String(f.issue).slice(0, 140)}${f.detail ? ` | ${String(f.detail).slice(0, 120)}` : ''}`);
  return lines.join('\n');
}

// ---------- main ----------
function main() {
  const a = args(process.argv.slice(2));
  const need = ['task', 'repo', 'base', 'client', 'shots', 'surface'];
  const miss = need.filter((k) => !a[k] || a[k] === true);
  if (miss.length) { console.error(`usage: pack.mjs --task <key> --repo <repo> --base <baseline> --client <id> --shots <dir> --surface "<words>" [--out <dir>] [--budget 60000]\nmissing ${miss.map((m) => '--' + m).join(', ')}`); process.exit(1); }
  const repo = resolve(a.repo);
  if (!git(repo, 'rev-parse', '--git-dir').out.trim()) { console.error(`${repo} is not a git repo`); process.exit(1); }
  const shots = resolve(a.shots);
  const out = resolve(a.out && a.out !== true ? a.out : join(STUDIO, '.state', 'packs', a.task));
  const budget = Number(a.budget || 60000);
  mkdirSync(out, { recursive: true });

  const sections = []; // { name, text, fixed }
  const add = (name, text, fixed = true) => sections.push({ name, text: text.replace(/\s+$/, '') + '\n', fixed });

  // ask
  add('ask', `# Diff pack ${a.task}\n\nclient ${a.client} | repo ${repo} | baseline ${a.base}\nsurface ${a.surface}\n`);

  // diff
  const stat = git(repo, 'diff', '--stat', a.base).out;
  const status = git(repo, 'status', '--short').out;
  add('diff', `## Diff stat and status\n\n\`\`\`\n${stat.trim() || '(no tracked changes)'}\n\`\`\`\n\n\`\`\`\n${status.trim() || '(clean)'}\n\`\`\`\n(new files show as ?? in the status and are not in the stat)\n`);

  // shots report, also gives route names and the url for kit and golden
  let report = null, reportDir = null;
  for (const d of [shots, join(shots, 'after')]) if (!report && existsSync(join(d, 'report.json'))) { reportDir = d; report = JSON.parse(readFileSync(join(d, 'report.json'), 'utf8')); }
  const routeNames = report ? [...new Set(report.routes.map((r) => r.route))] : [];

  // hunks, built last because they take what the budget has left
  const files = changedFiles(repo, a.base);
  const surfaceWords = new Set([...words(a.surface), ...routeNames.flatMap(words)].map(norm));

  // baselint
  const bl = node('baselint.mjs', ['--repo', repo, '--base', a.base, '--client', a.client]);
  const blLines = bl.out.split('\n').filter((l) => l.trim());
  const blText = blLines.length ? blLines.slice(0, 80).join('\n') + (blLines.length > 80 ? `\n+${blLines.length - 80} more lines not shown` : '') : (bl.err ? `baselint did not run, ${bl.err.slice(0, 200)}` : 'no warnings');
  add('baselint', `## Base layout block (baselint)\n\n\`\`\`\n${blText}\n\`\`\`\n`);

  // kit and golden, read only, need a url and only run when the client has them
  const hasItems = (dir) => existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.json'));
  const kitDir = join(clientsDir(), a.client, 'kit'), goldDir = join(clientsDir(), a.client, 'golden');
  const routeArg = report ? report.routes.filter((r, i, all) => all.findIndex((x) => x.route === r.route) === i).map((r) => `${r.route}=${r.path}`).join(',') : null;
  const viaUrl = (script, sub, dir, title) => {
    if (!hasItems(dir)) return;
    if (!report) { add(sub, `## ${title}\n\nnot run, no report.json in the shots folder to take the url from\n`); return; }
    const r = node(script, [sub === 'kit' ? 'match' : 'compare', '--client', a.client, '--url', report.url, ...(routeArg ? ['--routes', routeArg] : [])]);
    add(sub, `## ${title}\n\n\`\`\`\n${r.out.trim() || r.err.slice(0, 300) || '(no output)'}\n\`\`\`\n`);
  };
  viaUrl('kit.mjs', 'kit', kitDir, 'Kit match');
  viaUrl('golden.mjs', 'golden', goldDir, 'Golden compare');

  // walk
  const walks = findFiles(shots, 'walk.json');
  if (walks.length) add('walk', `## Task walkthroughs\n\n\`\`\`\n${walks.map(walkSummary).join('\n')}\n\`\`\`\n`);

  // shots
  if (report) {
    const compactFile = join(reportDir, 'report.compact.txt');
    const compact = existsSync(compactFile) ? readFileSync(compactFile, 'utf8') : compactReport(report);
    const contact = join(reportDir, 'contact.png');
    const note = existsSync(contact) ? 'contact.png beside this file holds every after shot, open that one image. ' : 'no contact sheet found, open an image only for a route with a diff or a failed check. ';
    add('shots', `## Shots\n\n${note}Full report is ${join(reportDir, 'report.json')}, read it only for a route the lines below name.\n\n\`\`\`\n${compact.trim()}\n\`\`\`\n`);
    if (existsSync(contact)) copyFileSync(contact, join(out, 'contact.png'));
  } else {
    add('shots', '## Shots\n\nno report.json in the shots folder, the review is diff only\n');
  }

  // taste
  const tastePath = join(clientsDir(), a.client, 'taste.md');
  if (existsSync(tastePath)) {
    const changedWords = files.flatMap((f) => words(f.path.replace(/\.[a-z]+$/i, '')));
    const matchWords = new Set([...surfaceWords, ...changedWords.map(norm)]);
    const t = filterTaste(readFileSync(tastePath, 'utf8'), matchWords);
    const d = t.drop;
    add('taste', `## Taste entries that apply\n\nkept ${t.keep.length} of ${t.total}, dropped ${t.total - t.keep.length} (${d.unrelated} unrelated, ${d.rejected} rejected, ${d.superseded} superseded over 30 days old). Full log is ${tastePath}.\n\n${t.keep.map((e) => e.raw).join('\n')}\n`);
  } else {
    add('taste', `## Taste entries that apply\n\nno taste log for ${a.client}, skip the brand and taste checks\n`);
  }

  // hunks get what is left
  const fixedChars = sections.reduce((n, s) => n + s.text.length, 0);
  const room = Math.max(0, budget - fixedChars - 700);
  const h = buildHunks(repo, a.base, files, surfaceWords, room);
  let ht = '## Hunks\n\n';
  ht += h.kept.length ? h.kept.map((f) => `### ${f.path}${f.status === 'A' ? ' (new)' : ''}\n\`\`\`diff\n${f.text.trim()}\n\`\`\``).join('\n\n') + '\n' : '(no hunks sent)\n';
  if (h.left.length) ht += `\nLeft out for the ${budget} character budget, read from disk when needed\n${h.left.map((f) => `- ${f.path}${f.status === 'A' ? ' (new)' : ''}, ${f.changed} changed lines`).join('\n')}\n`;
  if (h.stat.length) ht += `\nStat only, not hunked\n${h.stat.map((p) => `- ${p}`).join('\n')}\n`;
  const at = sections.findIndex((s) => s.name === 'diff') + 1;
  sections.splice(at, 0, { name: 'hunks', text: ht.replace(/\s+$/, '') + '\n', fixed: false });

  let body = sections.map((s) => s.text).join('\n');
  const over = body.length - budget;
  if (over > 0) body = `> Over budget by ${over} characters. Hunks are already trimmed as far as they go, the other sections are never cut.\n\n` + body;
  writeFileSync(join(out, 'pack.md'), body);

  console.log(`pack ${a.task} -> ${join(out, 'pack.md')}`);
  for (const s of sections) console.log(`  ${s.name.padEnd(9)} ${String(s.text.length).padStart(6)} chars  ~${String(tok(s.text.length)).padStart(5)} tokens`);
  console.log(`  ${'total'.padEnd(9)} ${String(body.length).padStart(6)} chars  ~${String(tok(body.length)).padStart(5)} tokens, budget ${budget}${over > 0 ? `, OVER by ${over}` : ''}`);
  if (h.left.length) console.log(`  hunks left out ${h.left.length}, ${h.left.map((f) => f.path).join(', ')}`);
  if (existsSync(join(out, 'contact.png'))) console.log(`  contact.png ${statSync(join(out, 'contact.png')).size} bytes beside pack.md`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
