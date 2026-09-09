// Builds remittix-dashboard.html: the dashboard in one self-contained file that
// opens straight from disk — no server, no deploy.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';

execSync('npx vite build --config vite.preview.config.ts', { stdio: 'inherit' });
let html = readFileSync('dist-preview/preview.html', 'utf8');

// Keep the Latin subsets as data URIs and drop the rest, or the file triples.
const inlineFonts = (css) =>
  css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const m = block.match(/url\((?:\.\/)?([^)"']+\.woff2)\)/);
    if (!m) return block;
    const file = m[1];
    if (!/-latin-/.test(file) || /latin-ext/.test(file)) return '';
    const b64 = readFileSync('dist-preview/assets/' + file).toString('base64');
    return block.replace(/url\((?:\.\/)?[^)"']+\.woff2\)/, `url(data:font/woff2;base64,${b64})`);
  });

// Faces served from public/fonts/ are referenced by absolute URL, which a
// file:// page cannot resolve, so they are embedded as well.
const inlineLocalFonts = (css) =>
  css.replace(/url\((['"]?)(?:\.\.?\/)*fonts\/([^)'"]+\.woff2)\1\)/g, (whole, _q, file) => {
    const path = 'public/fonts/' + file;
    if (!existsSync(path)) return whole;
    return `url(data:font/woff2;base64,${readFileSync(path).toString('base64')})`;
  });

html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g,
  // Local faces are embedded first: inlineFonts drops any @font-face without
  // '-latin-' in its filename, which would otherwise delete them outright.
  (_, p) => `<style>${inlineFonts(inlineLocalFonts(readFileSync('dist-preview/' + p, 'utf8')))}</style>`,
);
html = html.replace(
  /<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g,
  (_, p) =>
    `<script type="module">${readFileSync('dist-preview/' + p, 'utf8').replace(/<\/script>/g, '<\\/script>')}</script>`,
);

writeFileSync('remittix-dashboard.html', html);
rmSync('dist-preview', { recursive: true, force: true });
console.log('wrote remittix-dashboard.html', Math.round(html.length / 1024), 'KB');
