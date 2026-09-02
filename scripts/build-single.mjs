// Builds remittix-hero.html: the whole page (JS, CSS, fallback PNG) inlined into one file.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';

execSync('npx vite build --config vite.single.config.ts', { stdio: 'inherit' });
let html = readFileSync('dist-single/index.html', 'utf8');
const png = readFileSync('public/hero-planet-fallback.png').toString('base64');

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (_, p) => `<style>${readFileSync('dist-single/' + p, 'utf8')}</style>`);
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, p) => {
  let js = readFileSync('dist-single/' + p, 'utf8');
  js = js.split('/hero-planet-fallback.png').join(`data:image/png;base64,${png}`);
  return `<script type="module">${js.replace(/<\/script>/g, '<\\/script>')}</script>`;
});
writeFileSync('remittix-hero.html', html);
rmSync('dist-single', { recursive: true, force: true });
console.log('wrote remittix-hero.html', Math.round(html.length / 1024), 'KB');
