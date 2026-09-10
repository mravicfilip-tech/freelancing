// Generates src/dashboard/tokenArt.tsx from the official cryptocurrency-icons
// artwork (CC0). Inlined as JSX so the offline preview carries it too.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'node_modules/cryptocurrency-icons/svg/color';
const IDS = ['btc', 'eth', 'usdt', 'usdc', 'sol', 'bnb'];

const toJsx = (svg) =>
  svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s(fill|stroke|clip)-(rule|opacity|width|path)=/g, (_, a, b) => ` ${a}${b[0].toUpperCase()}${b.slice(1)}=`)
    .replace(/\s(stop)-(color|opacity)=/g, (_, a, b) => ` ${a}${b[0].toUpperCase()}${b.slice(1)}=`)
    .trim();

const parts = IDS.map((id) => {
  const jsx = toJsx(readFileSync(`${SRC}/${id}.svg`, 'utf8'));
  return `  ${id.toUpperCase()}: (\n    <>\n      ${jsx}\n    </>\n  ),`;
}).join('\n');

writeFileSync(
  'src/dashboard/tokenArt.tsx',
  `/**
 * Official token artwork from the cryptocurrency-icons package (CC0), inlined
 * so the single-file preview carries it. Regenerate with:
 *   node scripts/gen-token-art.mjs
 * Do not hand-edit.
 */
import type { ReactElement } from 'react';

/** Every mark is drawn on a 32 grid, circle included. */
export const TOKEN_ART: Record<string, ReactElement> = {
${parts}
};
`,
);
console.log('wrote src/dashboard/tokenArt.tsx');
