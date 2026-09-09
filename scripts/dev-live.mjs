/**
 * Dev server that stays in sync with the remote branch.
 *
 * Vite only watches local files, so commits pushed from elsewhere never reach
 * the browser on their own. This runs the dev server and, alongside it, a
 * fast-forward pull on an interval — when a new commit lands, the files change
 * on disk and Vite hot-reloads them like any other edit.
 *
 *   npm run dev:live            poll every 8s
 *   npm run dev:live -- 30      poll every 30s
 */
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const seconds = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 8;
const shell = process.platform === 'win32';

const stamp = () => new Date().toLocaleTimeString();
const log = (msg) => console.log(`[sync ${stamp()}] ${msg}`);

const branch = (await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim();
log(`watching origin/${branch}, checking every ${seconds}s`);

const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell });

let busy = false;
let warned = false;

async function sync() {
  if (busy) return;
  busy = true;
  try {
    const before = (await run('git', ['rev-parse', 'HEAD'])).stdout.trim();
    const { stdout } = await run('git', ['pull', '--ff-only', 'origin', branch]);
    if (!/Already up to date/i.test(stdout)) {
      const { stdout: last } = await run('git', ['log', '--oneline', '-1']);
      log(`pulled — ${last.trim()}`);

      // A pull that changes the manifest leaves node_modules stale, and Vite
      // then fails to resolve the new import and serves a blank page.
      const { stdout: changed } = await run('git', ['diff', '--name-only', before, 'HEAD']);
      if (/^package(-lock)?\.json$/m.test(changed)) {
        log('dependencies changed — running npm install, this takes a moment');
        try {
          await run('npm', ['install'], { shell, maxBuffer: 1024 * 1024 * 32 });
          log('npm install done');
        } catch (e) {
          log(`npm install failed: ${String(e.stderr || e.message).trim().split('\n')[0]}`);
          log('run npm install yourself, then this carries on');
        }
      }
      log('the browser reloads on its own');
    }
    warned = false;
  } catch (err) {
    // A dirty tree or a diverged branch blocks a fast-forward. Say it once
    // rather than every interval.
    if (!warned) {
      warned = true;
      log(`cannot fast-forward: ${String(err.stderr || err.message).trim().split('\n')[0]}`);
      log('commit or discard your local edits, then this resumes on its own');
    }
  } finally {
    busy = false;
  }
}

const timer = setInterval(sync, seconds * 1000);
sync();

const stop = () => {
  clearInterval(timer);
  vite.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
vite.on('exit', stop);
