// A dev server that keeps itself up to date with the remote branch.
//
//   npm run dev:sync                  (SYNC_SECONDS=30 npm run dev:sync to poll less)
//
// Runs Vite, and every SYNC_SECONDS (default 15) fetches the branch this
// checkout tracks. When there are new commits it fast-forwards, reinstalls if
// package-lock.json moved, and lets Vite's watcher hot-reload the page. Useful
// for keeping a review screen current while someone else pushes. Ctrl+C stops
// both the server and the polling.
//
// Needs git and a branch with an upstream; without one it just runs Vite. It
// never touches work in progress: a dirty checkout, or history that cannot be
// fast-forwarded, is left alone and reported. Works whether this app is the
// repository root or a folder inside a larger one. For plain development,
// `npm run dev` is all you need.

import { spawn, execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POLL_SECONDS = Number(process.env.SYNC_SECONDS ?? 15);

const stamp = () => new Date().toLocaleTimeString();
const say = (msg) => console.log(`\x1b[38;5;209m[sync ${stamp()}]\x1b[0m ${msg}`);

// Run from the app folder: git finds the repository above it, wherever that is.
const git = async (...args) => (await run('git', args, { cwd: appDir })).stdout.trim();

/** The branch this checkout tracks, e.g. origin/main. */
async function upstream() {
  try {
    return await git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
  } catch {
    return null;
  }
}

/**
 * node_modules can lag behind package.json — after a pull that added a dependency,
 * or when the last `npm install` ran before the pull. Vite fails to resolve the
 * import and shows an overlay, so install before starting rather than after.
 */
async function ensureDeps() {
  const pkg = JSON.parse(await readFile(resolve(appDir, 'package.json'), 'utf8'));
  const wanted = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const missing = wanted.filter((name) => !existsSync(resolve(appDir, 'node_modules', name)));
  if (!missing.length) return;

  say(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not installed — running npm install…`);
  await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: appDir, shell: process.platform === 'win32' });
  say('npm install done');
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

  // The lock file's path from the repository root: `phorecast/` when the app
  // is a folder inside a larger repository, nothing when it is the root.
  const lock = `HEAD:${await git('rev-parse', '--show-prefix')}package-lock.json`;
  const lockBefore = await git('rev-parse', lock).catch(() => '');
  await git('merge', '--ff-only', tracking);
  const lockAfter = await git('rev-parse', lock).catch(() => '');

  const subject = await git('log', '-1', '--pretty=%s');
  say(`pulled ${remote.slice(0, 7)} — ${subject}`);

  if (lockBefore !== lockAfter) {
    say('dependencies changed, running npm install…');
    await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: appDir, shell: process.platform === 'win32' });
    say('npm install done');
  } else {
    await ensureDeps();
  }
  return true;
}

const tracking = await upstream();
if (!tracking) {
  say('this branch tracks no remote, so there is nothing to sync; starting Vite only');
} else {
  say(`watching ${tracking} every ${POLL_SECONDS}s — edits here and commits there both reload the page`);
}

await ensureDeps();

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
