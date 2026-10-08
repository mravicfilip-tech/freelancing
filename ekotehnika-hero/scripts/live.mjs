// npm run live. Runs the Vite dev server and pulls this branch from GitHub every 8 seconds, so the
// open page picks up every pushed change through hot reload without a full refresh. When a pull
// changes the lockfile, it runs npm install and restarts Vite. Works on Windows, macOS and Linux.
//
// Uncommitted local edits make git refuse the pull. The script then says so and keeps serving.

import { spawn, execSync } from 'node:child_process';

const EVERY_MS = 8000;
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const time = () => new Date().toLocaleTimeString();

let vite = null;
function startVite() {
  vite = spawn('npx', ['vite', '--port', '5173'], { stdio: 'inherit', shell: true });
}

let branch = '';
try {
  branch = sh('git rev-parse --abbrev-ref HEAD');
} catch {
  console.error('live, this folder is not inside a git checkout, run it from ekotehnika-hero');
  process.exit(1);
}

console.log(`live, serving http://localhost:5173/?v=1 and pulling ${branch} every ${EVERY_MS / 1000}s`);
startVite();

let busy = false;
setInterval(() => {
  if (busy) return;
  busy = true;
  try {
    const before = sh('git rev-parse HEAD');
    sh(`git fetch --quiet origin ${branch}`);
    const remote = sh(`git rev-parse origin/${branch}`);
    if (remote !== before) {
      sh(`git merge --ff-only --quiet origin/${branch}`);
      const changed = sh(`git diff --name-only ${before} HEAD`).split('\n');
      const subject = sh('git log -1 --format=%s');
      console.log(`\n[${time()}] live, pulled ${remote.slice(0, 7)} ${subject}`);
      if (changed.some((f) => f.endsWith('package-lock.json') || f.endsWith('package.json'))) {
        console.log(`[${time()}] live, packages changed, running npm install and restarting Vite`);
        vite?.kill();
        execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
        startVite();
      }
    }
  } catch (e) {
    const msg = String(e.stderr || e.message || e).split('\n')[0];
    console.log(`[${time()}] live, pull skipped, ${msg}`);
  } finally {
    busy = false;
  }
}, EVERY_MS);

const stop = () => {
  vite?.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
