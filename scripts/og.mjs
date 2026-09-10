// Regenerates public/og.png — the 1200x630 card link previews show. Run `npm run og` after a
// redesign of the hero, then commit the result; index.html points at it by absolute URL.
import { startPreview, launch, BASE } from './browser.mjs';

const proc = await startPreview();
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await ctx.addInitScript(`try { localStorage.setItem('remittix.theme', 'dark'); } catch {}`);
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
// Let the hero's entrance settle so the headline and globe are both at rest in the frame.
await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
await page.screenshot({ path: 'public/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
proc.kill();
console.log('wrote public/og.png');
