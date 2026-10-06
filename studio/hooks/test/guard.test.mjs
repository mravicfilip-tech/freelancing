#!/usr/bin/env node
// Tests for hooks/guard.mjs, hooks/wire.mjs and scripts/registry.mjs.
//   node hooks/test/guard.test.mjs
//
// Every client, repo and project below is invented. The guard reads a fixture clients folder through
// STUDIO_CLIENTS_DIR, so nothing here touches the real kit data or any real settings file.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, isBlindReplace, isDeploy, buildIndex } from '../guard.mjs';
import { addHooks, removeHooks, hasHooks, hookBlocks } from '../wire.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = resolve(HERE, '..', '..').replace(/\\/g, '/');
const GUARD = resolve(HERE, '..', 'guard.mjs');
const WIRE = resolve(HERE, '..', 'wire.mjs');
const REGISTRY = resolve(HERE, '..', '..', 'scripts', 'registry.mjs');

// ---------- fixtures ----------
const fx = mkdtempSync(join(tmpdir(), 'guard-fx-')).replace(/\\/g, '/');
const CLIENTS = `${fx}/clients`;
const WORK = `${fx}/work`;
mkdirSync(WORK, { recursive: true });
for (const id of ['acme', 'northwind']) {
  mkdirSync(`${CLIENTS}/${id}`, { recursive: true });
  writeFileSync(`${CLIENTS}/${id}/README.md`, `# ${id}\n`);
  writeFileSync(`${CLIENTS}/${id}/taste.md`, `# Taste log, ${id}\n`);
}
const FIXTURE_REGISTRY = {
  clients: [
    { id: 'acme', repos: ['acme-web', 'acme-portal', 'shared-kit'], previewProjects: ['acme-web', 'acme-portal-*', 'acme-staging'] },
    { id: 'northwind', repos: ['northwind-app', 'nw-*'], previewProjects: ['northwind-app', 'nw-demo'] },
    { id: 'globex', repos: ['globex-site'], previewProjects: ['globex-site'] },
  ],
};
writeFileSync(`${CLIENTS}/registry.json`, JSON.stringify(FIXTURE_REGISTRY));
process.env.STUDIO_CLIENTS_DIR = CLIENTS;

let tag = 0;
function rp(folder, project, parent = `r${++tag}`) {
  const p = `${fx}/${parent}/${folder}`;
  mkdirSync(`${p}/.git`, { recursive: true });
  if (project !== undefined) {
    mkdirSync(`${p}/.vercel`, { recursive: true });
    writeFileSync(`${p}/.vercel/project.json`, JSON.stringify(project === null ? { projectId: 'prj_x' } : { projectId: 'prj_x', projectName: project }));
  }
  return p;
}
const ACME = rp('acme-web', 'acme-web', 'base');
const NORTH = rp('northwind-app', 'northwind-app', 'base');
const SCRATCH = `${WORK}/scratch-notes`;
mkdirSync(SCRATCH, { recursive: true });

let pass = 0, fail = 0;
const groups = {};
let group = 'misc';
const section = (g) => { group = g; groups[g] = groups[g] || { pass: 0, fail: 0 }; };
const ok = (name, cond, extra = '') => {
  groups[group] = groups[group] || { pass: 0, fail: 0 };
  if (cond) { pass++; groups[group].pass++; } else { fail++; groups[group].fail++; console.log(`FAIL  ${name}${extra ? '  ' + extra : ''}`); }
};

const pre = (command, cwd = ACME, tool_name = 'Bash') => decide({ hook_event_name: 'PreToolUse', tool_name, tool_input: { command }, cwd });
const kind = (o) => o?.hookSpecificOutput?.permissionDecision || 'none';
const reason = (o) => o?.hookSpecificOutput?.permissionDecisionReason || '';
const blocks = (cmd, tool) => kind(pre(cmd, SCRATCH, tool)) === 'deny';
const passes = (cmd, tool) => pre(cmd, SCRATCH, tool) === null;

// ---------- 1. blind replace ----------
section('blind replace');
ok('blind sed multi file', isBlindReplace("sed -i 's/#0033ff/#1a1a1a/g' src/a.css src/b.css"));
ok('blind sed with find', isBlindReplace("find . -name '*.tsx' -exec sed -i 's/a/b/g' {} +"));
ok('blind sed xargs', isBlindReplace("grep -rl foo src | xargs sed -i 's/foo/bar/g'"));
ok('blind sed glob', isBlindReplace("sed -i 's/a/b/' src/*.css"));
ok('blind powershell sweep', isBlindReplace("Get-ChildItem -Recurse *.css | ForEach-Object { (Get-Content $_) -replace 'blue','red' | Set-Content $_ }"));
ok('single file sed allowed', !isBlindReplace("sed -i 's/a/b/' src/one.css"));
ok('read-only sed allowed', !isBlindReplace("sed -n '1,40p' src/a.css src/b.css"));
ok('e2e, blind replace denied outside a client repo, as a deny with a one line reason', (() => {
  const o = pre("grep -rl blue src | xargs sed -i 's/blue/red/g'", SCRATCH);
  return kind(o) === 'deny' && reason(o).length > 20 && !reason(o).includes('\n');
})());
ok('e2e, the same command denied in a client repo', kind(pre("grep -rl a . | xargs sed -i 's/a/b/'", ACME)) === 'deny');
ok('e2e, denied from the PowerShell tool too', kind(pre("Get-ChildItem -Recurse *.css | ForEach-Object { (Get-Content $_) -replace 'blue','red' | Set-Content $_ }", SCRATCH, 'PowerShell')) === 'deny');
ok('read-only recursive search is not a blind replace', !isBlindReplace('Get-ChildItem -Recurse *.tsx | Select-String "badge"'));

// ---------- 2. deploy detection ----------
section('deploy detection');
ok('deploy vercel --prod', isDeploy('npx vercel --prod --yes'));
ok('deploy vercel bare', isDeploy('vercel'));
ok('vercel ls is not a deploy', !isDeploy('vercel ls acme-web'));
ok('vercel env pull is not a deploy', !isDeploy('vercel env pull .env.local'));
ok('deploy after cd is a deploy', isDeploy(`cd "${ACME}" && npx vercel --prod`));
ok('vc alias is a deploy', isDeploy('vc --prod'));
ok('deploy after Set-Location is a deploy', isDeploy(`Set-Location "${ACME}"; vercel --prod`));
ok('vercel deploy --prebuilt is a deploy', isDeploy('vercel deploy --prebuilt'));
ok('vercel deploy', isDeploy('vercel deploy'));
ok('npx vercel@latest --prod', isDeploy('npx vercel@latest --prod'));
ok('vercel with a token flag before the flag it deploys with', isDeploy('vercel --token abc123 --prod'));
for (const c of ['vercel logs acme-web', 'vercel inspect x', 'vercel whoami', 'vercel link', 'vercel --version', 'vercel pull', 'vercel project ls', 'vercel domains ls', 'echo vercel', 'git commit -m "run vercel --prod later"', 'vercel --token abc ls']) {
  ok(`not a deploy, ${c}`, !isDeploy(c));
}
ok('a deploy followed by git ls-files is still a deploy', isDeploy('vercel --prod && git ls-files | head'));
ok('a quoted folder argument is still a deploy', isDeploy('vercel "../my other repo" --prod'));

// ---------- 3. wrong client ----------
section('wrong client');
const same = [
  ['acme-web', 'acme-web'], ['acme-portal', 'acme-portal-144816'], ['shared-kit', 'acme-staging'],
  ['NORTHWIND-APP', 'northwind-app'], ['nw-labs', 'nw-demo'], ['globex-site', 'globex-site'],
];
for (const [folder, project] of same) ok(`${folder} linked to ${project} is silent`, pre('vercel --prod', rp(folder, project)) === null);
let o = pre('vercel --prod', rp('acme-web', 'northwind-app'));
ok('acme repo linked to a northwind project asks and names both clients and the project', kind(o) === 'ask' && /client acme/.test(reason(o)) && /client northwind/.test(reason(o)) && /northwind-app/.test(reason(o)), JSON.stringify(o));
ok('the ask is one line', !reason(o).includes('\n'));
ok('it never denies on a wrong client', kind(o) !== 'deny');
for (const [folder, project] of [['northwind-app', 'acme-web'], ['nw-labs', 'acme-staging'], ['globex-site', 'acme-web'], ['acme-portal', 'globex-site'], ['shared-kit', 'nw-demo']]) {
  ok(`${folder} linked to ${project} asks`, kind(pre('npx vercel', rp(folder, project))) === 'ask');
}
{
  // One repo for every client. The repo root is registered to acme, a client folder inside it to
  // northwind. The nearest registered folder decides.
  const mono = rp('acme-web');
  const nwIn = `${mono}/nw-site`;
  mkdirSync(`${nwIn}/.vercel`, { recursive: true });
  writeFileSync(`${nwIn}/.vercel/project.json`, JSON.stringify({ projectId: 'prj_x', projectName: 'nw-demo' }));
  ok('a client folder inside another client\'s repo, linked to its own project, is silent', pre('vercel --prod', nwIn) === null);
  writeFileSync(`${nwIn}/.vercel/project.json`, JSON.stringify({ projectId: 'prj_x', projectName: 'acme-web' }));
  ok('a client folder inside another client\'s repo, linked to the repo client\'s project, asks', kind(pre('vercel --prod', nwIn)) === 'ask');
}
ok('vercel deploy asks too', kind(pre('vercel deploy', rp('acme-web', 'globex-site'))) === 'ask');
ok('unknown project name does nothing', pre('vercel --prod', rp('acme-web', 'zzz-unknown')) === null);
ok('unknown repo folder does nothing', pre('vercel --prod', rp('zzz-unknown', 'acme-web')) === null);
ok('a lookalike of a registered folder is not that client', pre('vercel --prod', rp('shared-kit-fork', 'northwind-app')) === null);
ok('no linked project does nothing', pre('vercel --prod', rp('acme-web')) === null);
ok('linked file without a project name does nothing', pre('vercel --prod', rp('acme-web', null)) === null);
const wrong = rp('acme-web', 'northwind-app');
ok('a wrong client repo with no deploy command does nothing', pre('vercel ls', wrong) === null);
ok('git status in a wrong client repo does nothing', pre('git status', wrong) === null);
ok('ask survives a cd into the repo', kind(pre(`cd "${wrong}" && vercel --prod`, WORK)) === 'ask');
ok('ask survives Set-Location in PowerShell', kind(pre(`Set-Location "${wrong}"; vercel --prod`, WORK, 'PowerShell')) === 'ask');
ok('ask on the vc alias', kind(pre('vc --prod', wrong)) === 'ask');
ok('a folder named on the command line decides, not the cwd', kind(pre(`vercel ${wrong} --prod`, ACME)) === 'ask');
ok('a folder argument that matches is silent', pre(`vercel ${rp('acme-web', 'acme-web')} --prod`, wrong) === null);
{
  // A linked worktree keeps its .git as a file pointing into the main repo.
  const wt = `${fx}/wt/wt-one`;
  mkdirSync(`${wt}/.vercel`, { recursive: true });
  writeFileSync(`${wt}/.git`, `gitdir: ${ACME}/.git/worktrees/wt-one\n`);
  writeFileSync(`${wt}/.vercel/project.json`, JSON.stringify({ projectName: 'northwind-app' }));
  ok('a worktree elsewhere counts as its main repo and asks', kind(pre('vercel --prod', wt)) === 'ask');
  writeFileSync(`${wt}/.vercel/project.json`, JSON.stringify({ projectName: 'acme-staging' }));
  ok('a worktree elsewhere linked to its own client is silent', pre('vercel --prod', wt) === null);
  const nested = `${wrong}/.claude/worktrees/x`;
  mkdirSync(`${nested}/.git`, { recursive: true });
  mkdirSync(`${nested}/.vercel`, { recursive: true });
  writeFileSync(`${nested}/.vercel/project.json`, JSON.stringify({ projectName: 'northwind-app' }));
  ok('a worktree nested in the repo counts as that repo and asks', kind(pre('vercel --prod', nested)) === 'ask');
}
{
  const idx = buildIndex({ clients: [null, 7, { id: '../evil', repos: ['x'] }, { id: 'ok', repos: [3, '', '*', 'real-*', null], previewProjects: 'nope' }, { id: 'dup', repos: ['real-*'] }] });
  ok('buildIndex skips bad entries and an id that is a path', idx.repos.length === 2 && idx.repos.every((r) => r.name === 'real-') && idx.projects.length === 0);
}
{
  const empty = mkdtempSync(join(tmpdir(), 'guard-empty-')).replace(/\\/g, '/');
  writeFileSync(`${empty}/registry.json`, JSON.stringify({ clients: [] }));
  process.env.STUDIO_CLIENTS_DIR = empty;
  ok('an empty client list never asks', pre('vercel --prod', rp('acme-web', 'northwind-app')) === null);
  writeFileSync(`${empty}/registry.json`, '{ not json');
  ok('a broken registry never asks and never throws', pre('vercel --prod', rp('acme-web', 'northwind-app')) === null);
  process.env.STUDIO_CLIENTS_DIR = CLIENTS;
  rmSync(empty, { recursive: true, force: true });
}

// ---------- 4. false positives and allowed commands ----------
section('allowed');
ok('listing plus .Replace and WriteAllText on one named file',
  passes("Get-ChildItem -Recurse src | Select-Object Name; $t = [IO.File]::ReadAllText('src/a.css'); [IO.File]::WriteAllText('src/a.css', $t.Replace('blue','red'))", 'PowerShell'));
ok('non recursive listing', passes("Get-ChildItem src; [System.IO.File]::WriteAllText(\"src\\a.css\", (Get-Content src\\a.css -Raw).Replace('blue','red'))", 'PowerShell'));
ok('listing then a path variable', passes('gci . | Format-Table; $f = "src/a.css"; $t = [IO.File]::ReadAllText($f); [IO.File]::WriteAllText($f, $t.Replace("a","b"))', 'PowerShell'));
ok('single named file -replace to Set-Content', passes("(Get-Content src/a.css) -replace 'blue','red' | Set-Content src/a.css", 'PowerShell'));
ok('single named file with a listing in the same line', passes("Get-ChildItem -Recurse | Select-Object -First 3; (Get-Content a.css) -replace 'x','y' | Set-Content -Path a.css", 'PowerShell'));
for (const [name, c] of [
  ['read-only recursive Select-String', 'Get-ChildItem -Recurse -Filter *.css | Select-String blue'],
  ['read-only find with grep', "find . -name '*.tsx' | xargs grep -l foo"],
  ['git ls-files into wc', 'git ls-files | xargs wc -l'],
  ['rg -l', 'rg -l blue src'],
  ['grep -rl', 'grep -rl blue src'],
  ['ls -R', 'ls -R src'],
  ['sed -n over two files', "sed -n '1,40p' a.css b.css"],
  ['sed -i one file with a dot star in the script', "sed -i 's/.*foo/bar/' src/one.css"],
  ['sed -i one file with a glob only in the script', "sed -i 's/a*/b/' src/one.css"],
  ['perl -pi on one file', "perl -pi -e 's/a/b/' src/one.css"],
  ['sed -i one file after a find listing', "find . -name '*.css' | head; sed -i 's/a/b/' one.css"],
  ['sed -i one file after git ls-files', "git ls-files > /dev/null && sed -i 's/a/b/' package.json"],
  ['quoted text mentioning sed and xargs', 'git commit -m "document the xargs sed -i sweep we refused"'],
  ['commit message heredoc mentioning a sweep', "git commit -m \"$(cat <<'EOF'\nstop xargs sed -i sweeps\nfind . | xargs sed -i s/a/b/\nEOF\n)\""],
  ['echo with find and sed words', 'echo "find . -name x | xargs sed -i s/a/b/"'],
  ['git status', 'git status'],
  ['git diff', 'git diff --stat'],
  ['git add and commit', 'git add -A && git commit -m "fix header spacing"'],
  ['git push', 'git push origin concept/x'],
  ['git log', 'git log --oneline -5'],
  ['npm install', 'npm install'],
  ['npm run build', 'npm run build'],
  ['npm test', 'npm test'],
  ['npx tsc', 'npx tsc --noEmit'],
  ['prettier write', 'npx prettier --write src/App.tsx'],
  ['node script', 'node scripts/registry.mjs acme'],
  ['registry add', 'node scripts/registry.mjs add acme --repo acme-web'],
  ['lint', 'npm run lint'],
  ['mkdir and cd', 'mkdir -p out && cd out'],
  ['cat with a pipe', 'cat package.json | head -20'],
  ['powershell Remove-Item one file', 'Remove-Item out.txt'],
  ['powershell Get-Content to Set-Content', 'Get-Content a.txt | Set-Content b.txt'],
]) {
  ok(`allowed, ${name}`, passes(c) && !isBlindReplace(c), c);
}

// ---------- 5. more blind replace shapes that must be denied ----------
section('blind replace, more shapes');
for (const [name, c, tool] of [
  ['find exec perl', "find . -name '*.css' -exec perl -pi -e 's/a/b/g' {} +"],
  ['git ls-files into xargs sed', "git ls-files '*.css' | xargs sed -i 's/a/b/'"],
  ['rg -l into xargs perl', "rg -l foo src | xargs perl -pi -e 's/foo/bar/g'"],
  ['sed in place with a backup suffix on a glob', "sed -i.bak 's/a/b/' src/*.css"],
  ['sed command substitution list', "sed -i 's/a/b/' $(git ls-files '*.css')"],
  ['for loop over find', `for f in $(find . -name '*.css'); do sed -i 's/a/b/' "$f"; done`],
  ['two named files', "perl -pi -e 's/a/b/' a.css b.css"],
  ['recursive glob', "sed -i 's/a/b/' src/**/*.css"],
  ['powershell .NET writer in a loop', "Get-ChildItem -Recurse -Filter *.css | ForEach-Object { [IO.File]::WriteAllText($_.FullName, [IO.File]::ReadAllText($_.FullName).Replace('a','b')) }", 'PowerShell'],
  ['powershell foreach loop', "foreach ($f in Get-ChildItem -Recurse src) { (Get-Content $f.FullName) -replace 'a','b' | Set-Content $f.FullName }", 'PowerShell'],
  ['powershell glob target', "(Get-Content src\\*.css) -replace 'a','b' | Set-Content src\\*.css", 'PowerShell'],
  ['powershell loop var set from the pipeline', "Get-ChildItem -Recurse | ForEach-Object { $p = $_.FullName; (Get-Content $p) -replace 'a','b' | Set-Content $p }", 'PowerShell'],
  ['powershell aliases gci, %, sc', "Get-ChildItem *.css | % { (gc $_) -replace 'a','b' | sc $_ }", 'PowerShell'],
  ['node walker', "node -e \"for (const f of fs.readdirSync('src')) fs.writeFileSync('src/'+f, fs.readFileSync('src/'+f,'utf8').replace(/a/g,'b'))\""],
  ['python walker', "python -c \"import os\nfor r,d,fs in os.walk('src'):\n  for f in fs: open(f,'w').write(open(f).read().replace('a','b'))\""],
  ['bash -c wrapping a sweep', `bash -c "find . -name '*.css' | xargs sed -i 's/a/b/'"`],
]) {
  ok(`denied, ${name}`, blocks(c, tool), c);
}

// ---------- 6. the real script, over the real protocol ----------
section('protocol');
const times = [];
function runGuard(payload, raw, env) {
  const t = Date.now();
  const r = spawnSync('node', [GUARD], { input: raw ?? JSON.stringify(payload), encoding: 'utf8', timeout: 20000, env: env || process.env });
  times.push(Date.now() - t);
  let out = null;
  try { out = r.stdout ? JSON.parse(r.stdout) : null; } catch { out = { raw: r.stdout }; }
  return { code: r.status, out, stdout: r.stdout, stderr: r.stderr };
}

let r = runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: "grep -rl blue src | xargs sed -i 's/blue/red/g'" }, cwd: SCRATCH });
ok('script denies a blind replace over stdin and exits 0', r.code === 0 && r.out?.hookSpecificOutput?.permissionDecision === 'deny' && r.out.hookSpecificOutput.hookEventName === 'PreToolUse', JSON.stringify(r.out));
r = runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'vercel --prod' }, cwd: ACME });
ok('script is silent on a matching deploy and exits 0', r.code === 0 && !r.stdout, JSON.stringify(r.out));
r = runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'vercel --prod' }, cwd: wrong });
ok('script asks on a wrong client deploy and exits 0', r.code === 0 && r.out?.hookSpecificOutput?.permissionDecision === 'ask', JSON.stringify(r.out));
r = runGuard({ hook_event_name: 'SessionStart', session_id: 's', cwd: ACME, source: 'startup' });
const line = r.out?.hookSpecificOutput?.additionalContext || '';
ok('SessionStart in a client repo emits one line', r.code === 0 && r.out.hookSpecificOutput.hookEventName === 'SessionStart' && !line.includes('\n'), JSON.stringify(r.out));
ok('SessionStart line names the client and both brand files', line === `Client acme. Brand rules in ${CLIENTS}/acme/README.md, taste in ${CLIENTS}/acme/taste.md. Read both before UI work.`, line);
ok('SessionStart in a worktree under the repo names the client', /^Client acme\./.test(runGuard({ hook_event_name: 'SessionStart', cwd: `${ACME}/.claude/worktrees/kind-x` }).out?.hookSpecificOutput?.additionalContext || ''));
ok('SessionStart in a subfolder names the client', /^Client acme\./.test(runGuard({ hook_event_name: 'SessionStart', cwd: `${ACME}/src` }).out?.hookSpecificOutput?.additionalContext || ''));
if (process.platform === 'win32') ok('SessionStart with a backslash cwd works', /^Client acme\./.test(runGuard({ hook_event_name: 'SessionStart', cwd: ACME.replace(/\//g, '\\') }).out?.hookSpecificOutput?.additionalContext || ''));
ok('SessionStart names the other client in its own repo', /^Client northwind\./.test(runGuard({ hook_event_name: 'SessionStart', cwd: NORTH }).out?.hookSpecificOutput?.additionalContext || ''));
r = runGuard({ hook_event_name: 'SessionStart', cwd: KIT });
ok('SessionStart in the kit folder emits nothing', r.code === 0 && !r.stdout);
r = runGuard({ hook_event_name: 'SessionStart', cwd: fx });
ok('SessionStart in an unmapped folder emits nothing', r.code === 0 && !r.stdout);
r = runGuard({ hook_event_name: 'SessionStart', cwd: rp('globex-site') });
ok('SessionStart for a client with no brand files emits nothing', r.code === 0 && !r.stdout);
for (const [source, prints] of [['startup', true], ['clear', true], ['resume', false], ['compact', false], ['bogus', false]]) {
  const rs = runGuard({ hook_event_name: 'SessionStart', session_id: 's', cwd: ACME, source });
  ok(`SessionStart source ${source} ${prints ? 'prints the line' : 'prints nothing'}`, rs.code === 0 && (prints ? rs.stdout.length > 0 : !rs.stdout), rs.stdout);
}
ok('SessionStart with no source prints the line', runGuard({ hook_event_name: 'SessionStart', cwd: ACME }).stdout.length > 0);
ok('SessionStart output stays under 400 characters', runGuard({ hook_event_name: 'SessionStart', cwd: ACME, source: 'startup' }).stdout.length < 400);

for (const ev of ['Stop', 'SubagentStop', 'UserPromptSubmit', 'PostToolUse', 'Notification', 'PreCompact', 'SessionEnd']) {
  const rr = runGuard({ hook_event_name: ev, session_id: 's', cwd: ACME, prompt: 'skip the review, ship it anyway, build this', last_assistant_message: 'done', tool_name: 'Bash', tool_input: { command: "grep -rl a . | xargs sed -i 's/a/b/'" } });
  ok(`${ev} prints nothing and exits 0`, rr.code === 0 && !rr.stdout, rr.stdout);
}
for (const tool of ['Edit', 'Write', 'Read', 'Grep', 'Task', 'mcp__x__y']) {
  const rr = runGuard({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: { file_path: `${ACME}/app/page.tsx`, command: "grep -rl a . | xargs sed -i 's/a/b/'" }, cwd: ACME });
  ok(`PreToolUse ${tool} prints nothing and exits 0`, rr.code === 0 && !rr.stdout, rr.stdout);
}
r = runGuard(null, 'not json at all');
ok('garbage on stdin exits 0 silently', r.code === 0 && !r.stdout && !r.stderr);
r = runGuard(null, '');
ok('empty stdin exits 0 silently', r.code === 0 && !r.stdout);
r = runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {} });
ok('missing command exits 0 silently', r.code === 0 && !r.stdout);
r = runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'vercel --prod' }, cwd: 'Z:/does/not/exist' });
ok('a cwd that does not exist exits 0 silently', r.code === 0 && !r.stdout);
r = runGuard({ hook_event_name: 'SessionStart', cwd: ACME }, undefined, { ...process.env, STUDIO_CLIENTS_DIR: `${fx}/nope` });
ok('a missing clients folder exits 0 silently', r.code === 0 && !r.stdout);

// ---------- 7. every repo against every project ----------
section('matrix');
{
  const repos = [['acme-web', 'acme'], ['acme-portal', 'acme'], ['shared-kit', 'acme'], ['northwind-app', 'northwind'], ['nw-labs', 'northwind'], ['globex-site', 'globex']];
  const projects = [['acme-web', 'acme'], ['acme-portal-1', 'acme'], ['acme-staging', 'acme'], ['northwind-app', 'northwind'], ['nw-demo', 'northwind'], ['globex-site', 'globex']];
  const diffs = [];
  let asks = 0;
  for (const [folder, rc] of repos) {
    for (const [project, pc] of projects) {
      const asked = kind(pre('vercel --prod', rp(folder, project))) === 'ask';
      if (asked) asks++;
      if (asked !== (rc !== pc)) diffs.push(`${folder} (${rc}) to ${project} (${pc}) guard ${asked ? 'ask' : 'silent'}`);
    }
  }
  ok(`matrix, ${repos.length * projects.length} pairs, no same client ask and every mismatch asks`, diffs.length === 0, diffs.slice(0, 5).join(' | '));
  ok('matrix, a real share of the pairs are mismatches that ask', asks > 15, `${asks}`);
}

// ---------- 8. hostile input, linear time and silence ----------
section('hostile input');
{
  const timesBefore = times.length;
  const big = (cmd) => runGuard({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: cmd }, cwd: fx });
  const BS = String.fromCharCode(92);
  for (const [name, cmd] of [
    ['1MB of one word', 'echo ' + 'a'.repeat(1e6)],
    ['1MB unclosed quote', 'echo "' + 'x'.repeat(1e6)],
    ['repeated for in', 'for x in '.repeat(100000)],
    ['repeated -replace', ' -replace x '.repeat(100000)],
    ['repeated node words', 'node a '.repeat(100000)],
    ['repeated grep words', 'grep a '.repeat(100000)],
    ['repeated heredoc openers', '<<A '.repeat(100000)],
    ['repeated Set-Content', 'Set-Content -Path '.repeat(60000) + ' -replace'],
    ['repeated sed words', 'sed x '.repeat(100000)],
    ['repeated awk words', 'awk x '.repeat(100000)],
    ['backslashes', BS.repeat(1e6)],
    ['unicode', 'echo \u65E5\u672C\u8A9E \uD83D\uDE00 '.repeat(20000)],
  ]) {
    const t = Date.now();
    const rr = big(cmd);
    ok(`hostile, ${name}, exit 0 under 3 seconds`, rr.code === 0 && Date.now() - t < 3000, `${rr.code} ${Date.now() - t}ms`);
  }
  const rr = big("sed -i 's/a/b/' " + 'f '.repeat(5e5));
  ok('hostile, 1MB sed -i over many files is still denied', rr.out?.hookSpecificOutput?.permissionDecision === 'deny');
  times.length = timesBefore; // these runs are slow on purpose, keep them out of the p95
}

// ---------- 9. wiring, wire.mjs ----------
section('wiring');
{
  const STUDIO_DIR = 'C:/some/place/.claude/studio';
  const blocks2 = hookBlocks(STUDIO_DIR);
  const events = Object.keys(blocks2);
  ok('hooks wire only SessionStart and PreToolUse', events.length === 2 && events.includes('SessionStart') && events.includes('PreToolUse'));
  const cmds = events.flatMap((e) => blocks2[e].flatMap((g) => g.hooks));
  ok('hooks use exec form, node plus one arg, timeout 10', cmds.every((c) => c.type === 'command' && c.command === 'node' && c.args.length === 1 && c.args[0] === `${STUDIO_DIR}/hooks/guard.mjs` && c.timeout === 10));
  ok('PreToolUse matcher is Bash|PowerShell', blocks2.PreToolUse[0].matcher === 'Bash|PowerShell');
  ok('SessionStart matcher limits it to startup and clear', blocks2.SessionStart[0].matcher === 'startup|clear');

  const mine = { theme: 'dark', hooks: { PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'node', args: ['other.mjs'] }] }], Stop: [{ hooks: [{ type: 'command', command: 'echo' }] }] }, permissions: { allow: ['Bash(ls)'] } };
  const before = JSON.stringify(mine);
  const once = addHooks(JSON.parse(before), STUDIO_DIR);
  ok('add keeps every other key and hook', once.theme === 'dark' && once.permissions.allow[0] === 'Bash(ls)' && once.hooks.Stop.length === 1 && once.hooks.PreToolUse.length === 2 && once.hooks.PreToolUse[0].matcher === 'Write');
  ok('add puts the guard in', hasHooks(once));
  const twice = addHooks(JSON.parse(JSON.stringify(once)), STUDIO_DIR);
  ok('add twice gives one copy', JSON.stringify(twice) === JSON.stringify(once));
  const moved = addHooks(JSON.parse(JSON.stringify(once)), 'D:/elsewhere/.claude/studio');
  ok('add from another folder replaces the old entry', moved.hooks.PreToolUse.length === 2 && moved.hooks.SessionStart.length === 1 && moved.hooks.SessionStart[0].hooks[0].args[0].startsWith('D:/elsewhere'));
  ok('remove gives back the original', JSON.stringify(removeHooks(JSON.parse(JSON.stringify(once)))) === before);
  ok('remove on a file without the guard changes nothing', JSON.stringify(removeHooks(JSON.parse(before))) === before);
  ok('add to an empty object, then remove, gives an empty object', JSON.stringify(removeHooks(addHooks({}, STUDIO_DIR))) === '{}');
  ok('a user group that shares our event survives a remove', (() => {
    const mixed = addHooks({ hooks: { SessionStart: [{ matcher: 'resume', hooks: [{ type: 'command', command: 'echo' }] }] } }, STUDIO_DIR);
    const back = removeHooks(mixed);
    return back.hooks.SessionStart.length === 1 && back.hooks.SessionStart[0].matcher === 'resume';
  })());

  const sf = `${fx}/settings.json`;
  const wire = (...a) => spawnSync('node', [WIRE, ...a], { encoding: 'utf8' });
  writeFileSync(sf, '\uFEFF' + JSON.stringify(mine, null, 2));
  let w = wire('add', sf, STUDIO_DIR);
  ok('wire add on a file with a BOM exits 0 and the file parses', w.status === 0 && hasHooks(JSON.parse(readFileSync(sf, 'utf8'))), w.stderr);
  ok('wire check exits 0 when the guard is present', wire('check', sf).status === 0);
  const snap = readFileSync(sf, 'utf8');
  w = wire('add', sf, STUDIO_DIR);
  ok('wire add twice leaves the file byte for byte the same', readFileSync(sf, 'utf8') === snap);
  w = wire('remove', sf);
  ok('wire remove exits 0 and gives back the original object', w.status === 0 && JSON.stringify(JSON.parse(readFileSync(sf, 'utf8'))) === before);
  ok('wire check exits 1 when the guard is absent', wire('check', sf).status === 1);
  writeFileSync(sf, '{ "hooks": ');
  w = wire('add', sf, STUDIO_DIR);
  ok('wire add refuses a file that is not JSON and leaves it untouched', w.status === 1 && readFileSync(sf, 'utf8') === '{ "hooks": ' && /not valid JSON/.test(w.stderr));
  rmSync(sf, { force: true });
  w = wire('add', sf, STUDIO_DIR);
  ok('wire add creates a missing settings file', w.status === 0 && hasHooks(JSON.parse(readFileSync(sf, 'utf8'))));
  ok('wire with no arguments exits 2', wire().status === 2);
}

// ---------- 10. registry.mjs and the client files ----------
section('registry and clients');
{
  const look = (...a) => spawnSync('node', [REGISTRY, ...a], { encoding: 'utf8' });
  let l = look('acme');
  ok('lookup by client prints one line with four fields', l.status === 0 && l.stdout.trim().split(/\r?\n/).length === 1 && l.stdout.trim().split(' | ').length === 4, l.stdout);
  ok('lookup by client names its repos, projects and brand file', l.stdout.startsWith('acme | acme-web, acme-portal, shared-kit | acme-web, acme-portal-*, acme-staging | ') && l.stdout.trim().endsWith(`${CLIENTS}/acme/README.md`), l.stdout);
  ok('lookup by folder name finds the client', look('northwind-app').stdout.startsWith('northwind | '));
  ok('lookup by a prefix folder finds the client', look('nw-labs').stdout.startsWith('northwind | '));
  ok('lookup by a path inside a repo finds the client', look(`${ACME}/src`).stdout.startsWith('acme | '));
  ok('lookup by a preview project finds the client', look('nw-demo').stdout.startsWith('northwind | '));
  ok('lookup of a client with no brand folder shows a dash', look('globex').stdout.trim().endsWith(' | -'));
  ok('lookup of nonsense exits 1', look('zzz-nonsense').status === 1);
  ok('--list prints one line per client', look('--list').stdout.trim().split(/\r?\n/).length === 3);

  // add, in a scratch clients folder that holds a copy of the real template
  const sc = `${fx}/scratch-clients`;
  mkdirSync(sc, { recursive: true });
  cpSync(`${KIT}/clients/_template`, `${sc}/_template`, { recursive: true });
  const add = (...a) => spawnSync('node', [REGISTRY, ...a], { encoding: 'utf8', env: { ...process.env, STUDIO_CLIENTS_DIR: sc } });
  let a = add('--list');
  ok('--list on a new folder says there are no clients', a.status === 0 && /no clients yet/.test(a.stdout));
  a = add('add', 'zeta', '--repo', 'zeta-app,zeta-docs', '--project', 'zeta-app');
  ok('add creates the client and its folder from the template', a.status === 0 && existsSync(`${sc}/zeta/README.md`) && existsSync(`${sc}/zeta/taste.md`) && existsSync(`${sc}/zeta/tasks.md`), a.stdout + a.stderr);
  ok('add fills the client id into the template', /^# Tasks, zeta/.test(readFileSync(`${sc}/zeta/tasks.md`, 'utf8')) && /^# Taste log, zeta/.test(readFileSync(`${sc}/zeta/taste.md`, 'utf8')));
  const reg1 = JSON.parse(readFileSync(`${sc}/registry.json`, 'utf8'));
  ok('add writes the registry', reg1.clients.length === 1 && reg1.clients[0].id === 'zeta' && reg1.clients[0].repos.length === 2 && reg1.clients[0].previewProjects[0] === 'zeta-app');
  writeFileSync(`${sc}/zeta/README.md`, 'edited by hand\n');
  a = add('add', 'zeta', '--repo', 'ZETA-APP,zeta-extra');
  const reg2 = JSON.parse(readFileSync(`${sc}/registry.json`, 'utf8'));
  ok('add again extends without a duplicate and keeps hand edits', a.status === 0 && reg2.clients[0].repos.join() === 'zeta-app,zeta-docs,zeta-extra' && readFileSync(`${sc}/zeta/README.md`, 'utf8') === 'edited by hand\n');
  a = add('add', 'yota', '--repo', 'zeta-docs');
  ok('add refuses a repo that belongs to another client', a.status === 1 && /already belongs to zeta/.test(a.stderr));
  ok('add refuses a bad id', add('add', 'Bad_Id').status === 1 && add('add').status === 1);
  ok('the guard sees a client added by the script', (() => {
    process.env.STUDIO_CLIENTS_DIR = sc;
    const res = kind(pre('vercel --prod', rp('zeta-app', 'acme-web'))) === 'none';
    const res2 = pre('vercel --prod', rp('zeta-app', 'zeta-app')) === null;
    process.env.STUDIO_CLIENTS_DIR = CLIENTS;
    return res && res2;
  })());

  // the real kit data
  const real = JSON.parse(readFileSync(`${KIT}/clients/registry.json`, 'utf8'));
  ok('the registry holds a client list of valid ids and an example', Array.isArray(real.clients) && real.clients.every((c) => c && /^[a-z0-9][a-z0-9-]*$/.test(c.id)) && real._example && real._example.id === 'acme');
  const readme = readFileSync(`${KIT}/clients/_template/README.md`, 'utf8');
  ok('the README template has the sections the critic reads', ['## Brand', '## Rules that never bend', '## Accessibility', '## Widths', '## Reference', '## Run'].every((h) => readme.includes(h)));
  const tasks = readFileSync(`${KIT}/clients/_template/tasks.md`, 'utf8');
  ok('the tasks template has the four columns in order', ['## Backlog', '## In progress', '## Review', '## Done'].map((h) => tasks.indexOf(h)).every((v, i, arr) => v > 0 && (i === 0 || v > arr[i - 1])));
  ok('the taste template exists', existsSync(`${KIT}/clients/_template/taste.md`));
}

// ---------- 11. source and timing ----------
section('source and timing');
for (const f of ['hooks/guard.mjs', 'hooks/wire.mjs']) {
  const src = readFileSync(`${KIT}/${f}`, 'utf8');
  ok(`${f} contains no "decision:" key`, !/\bdecision\s*:/.test(src));
  ok(`${f} contains no "continue: false"`, !/continue\s*:\s*false/.test(src));
  ok(`${f} has no em or en dash`, !/[\u2013\u2014]/.test(src));
  ok(`${f} imports only node built-ins`, [...src.matchAll(/^import .* from '([^']+)'/gm)].every((m) => m[1].startsWith('node:')));
}
const testSrc = readFileSync(fileURLToPath(import.meta.url), 'utf8');
ok('test source has no em or en dash', !/[\u2013\u2014]/.test(testSrc));
times.sort((a, b) => a - b);
const med = times[Math.floor(times.length / 2)];
const p95 = times[Math.floor(times.length * 0.95)];
console.log(`timing over ${times.length} runs, median ${med}ms, p95 ${p95}ms, max ${times[times.length - 1]}ms`);
ok(`median run under 300ms (${med}ms)`, med < 300);
ok(`p95 run under 1000ms (${p95}ms), the hook timeout is 10 seconds`, p95 < 1000);

rmSync(fx, { recursive: true, force: true });

console.log('');
for (const [g, c] of Object.entries(groups)) console.log(`${String(c.pass).padStart(3)} pass ${String(c.fail).padStart(2)} fail  ${g}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
