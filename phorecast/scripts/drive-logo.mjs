// Confirms the animated mark actually initialises WebGL in both places it appears.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1600, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error' || m.text().includes('HeroLogo')) console.log('  [console]', m.text().slice(0, 160));
});

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

const read = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.heroLogo')].map((e) => {
      const c = e.querySelector('canvas');
      return {
        where: e.closest('.hero') ? 'hero' : e.closest('.faq') ? 'faq' : '?',
        mode: e.dataset.mode,
        variant: e.dataset.variant,
        px: c ? `${c.width}x${c.height}` : 'no canvas',
      };
    }),
  );

await page
  .waitForFunction(() => document.querySelector('.hero .heroLogo')?.dataset.mode !== 'pending', null, { timeout: 30000 })
  .catch(() => console.log('  hero logo still pending after 30s'));
console.log('hero   :', JSON.stringify(await read()));
await page.locator('.hero').screenshot({ path: '/tmp/logo-hero.png' });

await page.locator('.faq').scrollIntoViewIfNeeded();
await page.waitForTimeout(4000);
console.log('with faq:', JSON.stringify(await read()));
await page.locator('.faq__rail').screenshot({ path: '/tmp/logo-faq.png' });

await browser.close();
