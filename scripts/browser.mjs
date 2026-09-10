// Shared Playwright helpers: launches the pre-installed Chromium and serves ./dist.
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PORT = 4173;
export const BASE = `http://127.0.0.1:${PORT}`;

/** Newest mtime under a directory, so a stale dist/ can be detected. */
function newest(dir) {
  let t = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(p) : statSync(p).mtimeMs);
  }
  return t;
}

export async function startPreview() {
  // vite preview serves the build, not the sources. Screenshotting a stale
  // dist/ silently shows the previous version of every change, so rebuild
  // whenever src/ has moved on.
  if (!existsSync('dist') || newest('src') > newest('dist')) {
    console.log('dist/ is behind src/ — rebuilding');
    const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('build failed');
  }
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE); if (r.ok) return proc; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  proc.kill();
  throw new Error('vite preview did not start');
}

export async function launch(extra = {}) {
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  return chromium.launch({
    headless: true,
    executablePath,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    ...extra,
  });
}
