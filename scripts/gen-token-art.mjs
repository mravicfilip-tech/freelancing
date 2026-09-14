// Generates src/dashboard/tokenArt.tsx from the official cryptocurrency-icons
// artwork (CC0). Inlined as JSX so the offline preview carries it too.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'node_modules/cryptocurrency-icons/svg/color';
const IDS = ['btc', 'eth', 'usdt', 'usdc', 'sol', 'bnb'];

/**
 * Marks the package has not kept current. cryptocurrency-icons still ships
 * Solana's retired flat-green disc; the brand has been the three bars in a
 * violet-to-mint gradient on a near-black ground for years, which is what it
 * wears everywhere a holder would recognise it. The bar geometry in the
 * package is still right, so only the two fills change.
 *
 * The gradient id is fixed rather than generated: every SOL mark on the page
 * is this same artwork, so the duplicate definitions all resolve to identical
 * paint.
 */
const OVERRIDES = {
  SOL: `<g fill="none"><circle cx="16" cy="16" r="16" fill="#131313"/><linearGradient id="sol-g" x1="8.5" y1="23.6" x2="23.5" y2="8.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/></linearGradient><path d="M9.925 19.687a.59.59 0 01.415-.17h14.366a.29.29 0 01.207.497l-2.838 2.815a.59.59 0 01-.415.171H7.294a.291.291 0 01-.207-.498l2.838-2.815zm0-10.517A.59.59 0 0110.34 9h14.366c.261 0 .392.314.207.498l-2.838 2.815a.59.59 0 01-.415.17H7.294a.291.291 0 01-.207-.497L9.925 9.17zm12.15 5.225a.59.59 0 00-.415-.17H7.294a.291.291 0 00-.207.498l2.838 2.815c.11.109.26.17.415.17h14.366a.291.291 0 00.207-.498l-2.838-2.815z" fill="url(#sol-g)"/></g>`,
};

const toJsx = (svg) =>
  svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s(fill|stroke|clip)-(rule|opacity|width|path)=/g, (_, a, b) => ` ${a}${b[0].toUpperCase()}${b.slice(1)}=`)
    .replace(/\s(stop)-(color|opacity)=/g, (_, a, b) => ` ${a}${b[0].toUpperCase()}${b.slice(1)}=`)
    .trim();

const parts = IDS.map((id) => {
  const key = id.toUpperCase();
  const jsx = OVERRIDES[key] ?? toJsx(readFileSync(`${SRC}/${id}.svg`, 'utf8'));
  return `  ${key}: (\n    <>\n      ${jsx}\n    </>\n  ),`;
}).join('\n');

writeFileSync(
  'src/dashboard/tokenArt.tsx',
  `/**
 * Official token artwork from the cryptocurrency-icons package (CC0), inlined
 * so the single-file preview carries it, with the marks that package has let
 * go stale overridden in the generator. Regenerate with:
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
