// Screenshot the site: the viewport, the whole page, or one element.
//
//   node scripts/screenshot.mjs [url] [out.png] [options]
//
//   url               default http://localhost:5173 (npm run dev)
//   out.png           default shot.png
//   --width=1920      viewport width
//   --height=1080     viewport height
//   --theme=dark      dark or light
//   --full            the whole page rather than the first viewport
//   --el=<selector>   just the first element matching the selector, e.g. --el=.faq
//   --still           prefers-reduced-motion, so the settled design is captured
//                     rather than whichever frame an animation was on
//
// Needs a running server (npm run dev, or npm run build && npm run preview)
// and a Chromium for playwright-core: run `npx playwright-core install
// chromium` once, or point CHROMIUM_PATH at any Chrome or Chromium binary.
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const [url = 'http://localhost:5173', out = 'shot.png'] = args.filter((a) => !a.startsWith('--'));
const theme = flag('theme', 'dark') === 'light' ? 'light' : 'dark';
const el = flag('el', null);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
  colorScheme: theme,
  reducedMotion: flag('still', false) ? 'reduce' : 'no-preference',
  viewport: { width: Number(flag('width', 1920)), height: Number(flag('height', 1080)) },
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
if (el) await page.locator(el).first().screenshot({ path: out });
else await page.screenshot({ path: out, fullPage: flag('full', false) === true });
await browser.close();
console.log('wrote', out);
