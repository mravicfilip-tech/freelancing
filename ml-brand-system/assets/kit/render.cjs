// Renders SVG sources to PNG (transparent where the SVG has no background) and PDF.
// Usage (from this folder): node render.cjs jobs.json [more.json ...]   Each job: {src, out, w, h, type: "png" | "pdf"}
// Needs Playwright; in this repo's cloud sessions Chromium lives at /opt/pw-browsers/chromium.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const jobs = process.argv.slice(2).flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const j of jobs) {
    const svg = fs.readFileSync(j.src, 'utf8');
    const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${j.w}px;height:${j.h}px}</style></head><body>${svg}</body></html>`;
    const page = await browser.newPage({ viewport: { width: Math.ceil(j.w), height: Math.ceil(j.h) } });
    await page.setContent(html);
    if (j.type === 'pdf') await page.pdf({ path: j.out, width: `${j.w}px`, height: `${j.h}px`, printBackground: true, pageRanges: '1' });
    else await page.screenshot({ path: j.out, omitBackground: true, clip: { x: 0, y: 0, width: j.w, height: j.h } });
    await page.close();
  }
  await browser.close();
  console.log(`rendered ${jobs.length}`);
})();
