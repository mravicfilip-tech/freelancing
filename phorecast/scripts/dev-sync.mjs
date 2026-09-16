// A live server that also keeps itself up to date.
//
// Runs Vite, and every POLL_SECONDS checks the remote branch for new commits.
// When it finds some it fast-forwards, reinstalls if the dependencies moved,
// and lets Vite's watcher hot-reload the page. Nothing to type after start-up.
//
//   npm run dev:sync
//
// Ctrl+C stops both the server and the polling.

import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(appDir, '..');
const POLL_SECONDS = Number(process.env.SYNC_SECONDS ?? 15);

const stamp = () => new Date().toLocaleTimeString();
const say = (msg) => console.log(`\x1b[38;5;209m[sync ${stamp()}]\x1b[0m ${msg}`);

const git = async (...args) => (await run('git', args, { cwd: repoDir })).stdout.trim();

/** The branch this checkout tracks, e.g. origin/claude/sweet-volta-5i0ubl. */
async function upstream() {
  try {
    return await git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
  } catch {
    return null;
  }
}

async function pullOnce(tracking) {
  await git('fetch', '--quiet');
  const [local, remote] = await Promise.all([git('rev-parse', 'HEAD'), git('rev-parse', tracking)]);
  if (local === remote) return false;

  // Refuse to clobber work in progress; a dirty tree means the person is editing.
  const dirty = await git('status', '--porcelain');
  if (dirty) {
    say('new commits upstream, but this checkout has uncommitted changes — skipping the pull');
    return false;
  }

  const lockBefore = await git('rev-parse', `HEAD:phorecast/package-lock.json`).catch(() => '');
  await git('merge', '--ff-only', tracking);
  const lockAfter = await git('rev-parse', `HEAD:phorecast/package-lock.json`).catch(() => '');

  const subject = await git('log', '-1', '--pretty=%s');
  say(`pulled ${remote.slice(0, 7)} — ${subject}`);

  if (lockBefore !== lockAfter) {
    say('dependencies changed, running npm install…');
    await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: appDir, shell: process.platform === 'win32' });
    say('npm install done — restart the server if the page misbehaves');
  }
  return true;
}

const tracking = await upstream();
if (!tracking) {
  say('this branch tracks no remote, so there is nothing to sync; starting Vite only');
} else {
  say(`watching ${tracking} every ${POLL_SECONDS}s — edits here and commits there both reload the page`);
}

const vite = spawn('npx', ['vite'], { cwd: appDir, stdio: 'inherit', shell: process.platform === 'win32' });

let timer = null;
if (tracking) {
  let busy = false;
  timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await pullOnce(tracking);
    } catch (err) {
      say(`could not sync: ${err.message.split('\n')[0]}`);
    } finally {
      busy = false;
    }
  }, POLL_SECONDS * 1000);
}

const stop = () => {
  if (timer) clearInterval(timer);
  vite.kill('SIGINT');
};
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
vite.on('exit', (code) => { if (timer) clearInterval(timer); process.exit(code ?? 0); });
