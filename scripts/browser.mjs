// Shared Playwright helpers: launches the pre-installed Chromium and serves ./dist.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

export const PORT = 4173;
export const BASE = `http://127.0.0.1:${PORT}`;

export async function startPreview() {
  if (!existsSync('dist')) throw new Error('No dist/ — run `npm run build` first.');
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
