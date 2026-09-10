// Post-build: point the browser at the body face before it has parsed the stylesheet.
//
// The page is set in Onest, which reaches the browser through @fontsource — so it is a URL inside
// the bundled CSS, and nothing knows about it until that stylesheet has downloaded and parsed. That
// is one round trip later than it needs to be, and it is the round trip the first paint waits on.
//
// The filename is content-hashed at build time, so the preload cannot be written by hand in
// index.html; it is stitched in here instead, once the hash is known. Latin only: the other subsets
// carry the language picker's endonyms and are wanted lazily, exactly as the browser already has it.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = 'dist/assets';
const HTML = 'dist/index.html';

const font = readdirSync(ASSETS).find((f) => /^onest-latin-wght-normal-.*\.woff2$/.test(f));
if (!font) {
  console.warn('[preload-font] no Onest latin woff2 in dist/assets — skipping');
  process.exit(0);
}

const tag = `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`;
let html = readFileSync(HTML, 'utf8');
if (html.includes(tag)) process.exit(0);
html = html.replace('</head>', `    ${tag}\n  </head>`);
writeFileSync(HTML, html);
console.log(`[preload-font] preloading /assets/${font} (${(readFileSync(join(ASSETS, font)).length / 1024).toFixed(0)}KB)`);
