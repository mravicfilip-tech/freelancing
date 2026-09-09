// Screenshots the dashboard in both themes and both rail states.
import { startPreview, launch, BASE } from './browser.mjs';

const OUT = process.env.OUT || 'screenshots';
const preview = await startPreview();
const browser = await launch();

const shots = [
  ['dash-dark-extended', 'theme=dark&rail=extended', 1440, 1400],
  ['dash-light-extended', 'theme=light&rail=extended', 1440, 1400],
  ['dash-dark-collapsed', 'theme=dark&rail=collapsed', 1440, 1400],
  ['dash-light-collapsed', 'theme=light&rail=collapsed', 1440, 1400],
  ['dash-dark-mobile', 'theme=dark&rail=extended', 390, 1500],
];

for (const [name, query, width, height] of shots) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${BASE}/dashboard?${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.close();
  console.log('wrote', `${OUT}/${name}.png`);
}

await browser.close();
preview.kill();
