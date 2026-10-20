// node scripts/og/render.mjs. Renders scripts/og/og.html to public/og.jpg at 1200 by 630, the link preview
// image index.html names. Needs puppeteer-core and a Chrome, as the studio shoot script does.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = new URL('.', import.meta.url);
const require = createRequire(new URL('../../../studio/x.js', import.meta.url));
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(new URL('og.html', here).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const out = fileURLToPath(new URL('../../public/og.jpg', here));
await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
await browser.close();
console.log(out);
