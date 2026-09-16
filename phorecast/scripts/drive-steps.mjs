// Drives the steps slider the way a visitor meets it: load, scroll to it,
// watch autoplay advance, then interrupt it with a click and a key press.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const log = [];

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.locator('.steps').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const state = async () => page.evaluate(() => {
  const i = [...document.querySelectorAll('.steps__list .step')].findIndex(e => e.classList.contains('is-active'));
  const playing = document.querySelector('.step.is-playing') !== null;
  const panel = document.querySelector('.panel');
  return { active: i, playing, panel: panel ? panel.className.replace('panel ', '') : 'MISSING' };
});

log.push(['on load', await state()]);
await page.locator('.steps').screenshot({ path: '/tmp/run-steps-a.png' });

// autoplay: dwell is 6s, so wait past two boundaries without touching the page
await page.waitForTimeout(6400);
log.push(['after 6.4s', await state()]);
await page.locator('.steps').screenshot({ path: '/tmp/run-steps-b.png' });

await page.waitForTimeout(6400);
log.push(['after 12.8s', await state()]);
await page.locator('.steps').screenshot({ path: '/tmp/run-steps-c.png' });

// clicking step 1 must jump there and stop autoplay for good
await page.locator('.steps__list .step').nth(0).click();
await page.waitForTimeout(700);
log.push(['click step 1', await state()]);
await page.waitForTimeout(6500);
log.push(['+6.5s (must not advance)', await state()]);

// arrow key moves to the next step
await page.locator('.steps__list .step').nth(0).focus();
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(600);
log.push(['ArrowDown', await state()]);

for (const [when, s] of log) console.log(when.padEnd(26), `active=${s.active + 1}  playing=${s.playing}  ${s.panel}`);
await browser.close();
