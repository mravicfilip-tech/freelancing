// Screenshots one roadmap direction in isolation, on its own port and build dir, so several
// people can iterate at once. Usage: node scripts/shot-one.mjs <variant> <port> <label>
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [variant = '1', port = '4301', label = 'wip'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}`;
const SIZES = [
  { w: 1440, h: 900 },
  { w: 390, h: 844, mobile: true },
];

execSync(`npx vite build --outDir dist-${label} --emptyOutDir`, { stdio: 'inherit' });
mkdirSync('screenshots', { recursive: true });

// Detached, so the whole group can be killed: killing the npx wrapper alone leaves the vite
// child holding the port, and the next run is served a stale build without saying so.
const server = spawn('npx', ['vite', 'preview', '--outDir', `dist-${label}`, '--port', port, '--strictPort'], {
  stdio: 'ignore',
  detached: true,
});
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(BASE);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const { w, h, mobile } of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?hero=figma&planet=off&road=${variant}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.fh__nav{display:none!important}' });
    const section = await page.waitForSelector('#roadmap');
    await section.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('#roadmap')?.hasAttribute('data-motion'));
    await page.waitForTimeout(2200);
    const file = `screenshots/wip-${label}-${w}x${h}.png`;
    await section.screenshot({ path: file });
    console.log('wrote', file);
    await ctx.close();
  }
} finally {
  await browser.close();
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill();
  }
}
