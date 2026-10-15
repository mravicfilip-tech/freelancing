#!/usr/bin/env node
// scripts/deploy.mjs
//
// Deploys a Vercel project from a copy with no git history, then checks the deployment and its
// aliases through the Vercel API. On the Hobby plan Vercel refuses a git deploy of a commit an agent
// authored, and every git preview counts against the 100 deploys a day, so this is the deploy path.
//
//   node scripts/deploy.mjs [--dir <project dir>] [--prod] [--alias <host>] [--dry]
//
//   --dir    the project folder, default the current folder. It must hold .vercel/project.json,
//            written by one  vercel link  run.
//   --prod   a production deploy. Only after Filip's ship line, per the build recipe.
//   --alias  a host that must point at the new deployment once it is ready. Checked, never set.
//   --dry    print the plan and the copy size, deploy nothing.
//
// Needs VERCEL_TOKEN in the environment and the vercel CLI through npx. The token is never printed.
// Exit 0 when the deployment is READY and any --alias points at it, 1 otherwise, 2 on a usage error.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const SKIP = new Set(['.git', 'node_modules']);

function parse(argv) {
  const o = { dir: process.cwd(), prod: false, alias: null, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') o.dir = resolve(argv[++i] || '');
    else if (a === '--prod') o.prod = true;
    else if (a === '--alias') o.alias = (argv[++i] || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    else if (a === '--dry') o.dry = true;
    else { console.error(`unknown argument ${a}`); process.exit(2); }
  }
  return o;
}

function size(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    n += e.isDirectory() ? size(p) : statSync(p).size;
  }
  return n;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, token, teamId) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Vercel API ${res.status} on ${url.pathname}`);
  return res.json();
}

async function main() {
  const o = parse(process.argv.slice(2));
  const linkFile = join(o.dir, '.vercel', 'project.json');
  if (!existsSync(linkFile)) {
    console.error(`no .vercel/project.json in ${o.dir}. Run  vercel link  there once.`);
    process.exit(2);
  }
  const { orgId, projectId } = JSON.parse(readFileSync(linkFile, 'utf8'));
  const teamId = orgId && orgId.startsWith('team_') ? orgId : null;
  const token = process.env.VERCEL_TOKEN;
  if (!token && !o.dry) { console.error('VERCEL_TOKEN is not set.'); process.exit(2); }

  const mb = (size(o.dir) / 1048576).toFixed(1);
  console.log(`deploy ${basename(o.dir)}, ${o.prod ? 'production' : 'preview'}, ${mb} MB without .git and node_modules`);
  if (o.dry) return 0;

  const copy = mkdtempSync(join(tmpdir(), 'deploy-'));
  try {
    cpSync(o.dir, copy, { recursive: true, filter: (src) => !SKIP.has(basename(src)) });
    // A preview names its target. Without it the first deploy of a new project goes to production.
    const args = ['--yes', 'vercel', 'deploy', '--yes', ...(o.prod ? ['--prod'] : ['--target', 'preview']), '--token', token];
    const t0 = Date.now();
    const run = spawnSync('npx', args, {
      cwd: copy,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'inherit'],
      env: { ...process.env, VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId },
    });
    // The CLI labels its lines ("Production  https://...", "Aliased  https://..."), so take the first URL, and
    // when stdout holds none, the project's newest deployment made since this run started.
    let url = (run.stdout || '').split(/\r?\n/).map((l) => (l.match(/https:\/\/\S+/) || [])[0]).filter(Boolean)[0];
    if (run.status === 0 && !url) {
      const list = await api(`/v6/deployments?projectId=${projectId}&limit=1&since=${t0}`, token, teamId);
      if (list.deployments && list.deployments[0]) url = `https://${list.deployments[0].url}`;
    }
    if (run.status !== 0 || !url) { console.error('vercel deploy failed, see the output above.'); return 1; }
    const host = url.replace(/^https:\/\//, '').replace(/\/.*$/, '');
    console.log(`deployment ${url}`);

    let d;
    for (let i = 0; i < 120; i++) {
      d = await api(`/v13/deployments/${host}`, token, teamId);
      if (['READY', 'ERROR', 'CANCELED'].includes(d.readyState)) break;
      await sleep(5000);
    }
    console.log(`state ${d.readyState}`);
    if (d.readyState !== 'READY') return 1;

    if (o.alias) {
      for (let i = 0; i < 12; i++) {
        d = await api(`/v13/deployments/${host}`, token, teamId);
        if ((d.alias || []).includes(o.alias)) break;
        await sleep(5000);
      }
      const ok = (d.alias || []).includes(o.alias);
      console.log(`alias ${o.alias} ${ok ? 'points at this deployment' : 'does NOT point at this deployment'}`);
      if (!ok) return 1;
    } else if ((d.alias || []).length) {
      console.log(`aliases ${d.alias.join(', ')}`);
    }
    return 0;
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

main().then((code) => process.exit(code || 0), (err) => { console.error(err.message); process.exit(1); });
