// node scripts/golive-check.mjs [--strict]. Reads dist after `npm run build:public` and checks the public
// build. Daylight and Underground are not in it, the launch files are there, and no legal value is still
// marked [TO CONFIRM]. A pending value warns, and fails with --strict, which a production deploy runs.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const dist = new URL('../dist/', import.meta.url).pathname;
const fails = [];
const warns = [];

const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name)) : [join(dir, d.name)]));
const code = files(join(dist, 'assets'))
  .filter((f) => /\.(js|css)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

for (const f of ['index.html', '404.html', '_redirects', '_headers', 'robots.txt', 'sitemap.xml']) if (!existsSync(join(dist, f))) fails.push(`dist/${f} missing`);
if (!existsSync(new URL('../functions/api/contact.js', import.meta.url))) fails.push('functions/api/contact.js missing');
// class prefixes only Daylight and Underground use
for (const mark of ['p2-hero', 'p3-work']) if (code.includes(mark)) fails.push(`${mark} found, a frozen pathway is in the public build`);
if (code.includes('[TO CONFIRM]')) (strict ? fails : warns).push('a legal value is still [TO CONFIRM], see src/legal/copy.ts');

for (const w of warns) console.log(`warn  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(fails.length ? 'golive-check failed' : 'golive-check passed');
process.exit(fails.length ? 1 : 0);
