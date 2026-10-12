/* Tailwind preset for the base layout, accepted by Filip 12 Oct 2026.
 *
 * Tailwind v3 preset. It REPLACES (not extends) fontSize, spacing, borderRadius, height, minHeight,
 * zIndex, boxShadow and screens with the values in foundation/base-layout.css and nothing else, so an
 * off-scale class such as p-5, rounded-md or z-999 does not exist. Arbitrary
 * values like p-[5px] still compile in Tailwind itself, baselint is what warns on those.
 *
 * Numbers are read from base-layout.css at load, so the css stays the one place the scale lives.
 * No phone breakpoints. screens holds the desktop widths only, as w1280, w1440, w1600 and w1920.
 *
 * How a repo adds it, in tailwind.config.js
 *
 *   const { presetFor } = require(require('node:path').join(require('node:os').homedir(), '.claude', 'studio', 'foundation', 'tailwind-preset.cjs'));
 *   module.exports = {
 *     presets: [presetFor('acme')],            // or require(...) for the base scale alone
 *     content: ['./src/**\/*.{ts,tsx,html}'],
 *     theme: {
 *       extend: {
 *         // Colours are never in the preset. Map the brand tokens here, one name per brand token.
 *         colors: { brand: 'var(--brand-primary)', surface: 'var(--brand-surface)' },
 *       },
 *     },
 *   };
 *
 * Class names
 *   text-14       font size 14 with its paired line height, keyed by px
 *   p-4, gap-6    spacing keeps the Tailwind keys, so 4 is 16px and 6 is 24px (px divided by 4)
 *   rounded-lg    radius keeps the Tailwind names where the value matches (none, rounded, lg, xl, 2xl, 3xl, full)
 *   h-9, min-h-11 control heights 32 36 40 44 are h-8 h-9 h-10 h-11, icons 16 20 24 are h-4 h-5 h-6
 *   z-20          z index keyed by value
 *   shadow-2      shadow levels 1 to 3, shadow-none for none
 *   w1440:p-8     desktop width variants
 *
 * Brand overrides. presetFor(client) reads clients/<client>/base-override.json and swaps in the lists
 * it sets (fontSizes, lineHeights, spacing, radius, controlHeights, iconSizes, zIndex), the same keys
 * scripts/baselint.mjs reads. A client with no override file, or an unknown client, gets the base scale.
 */

const fs = require('node:fs');
const path = require('node:path');

const STUDIO = path.resolve(__dirname, '..');
const CSS = path.join(__dirname, 'base-layout.css');
const OVERRIDE_KEYS = ['fontSizes', 'lineHeights', 'spacing', 'radius', 'controlHeights', 'iconSizes', 'zIndex'];

const num = (n) => Math.round(n * 10000) / 10000;
const px = (n) => `${num(n)}px`;
const byValue = (a, b) => a - b;

// ---------- the base scale, read from base-layout.css ----------
function cssScale() {
  const css = fs.readFileSync(CSS, 'utf8');
  const grab = (prefix, unit) => {
    const out = [];
    const re = new RegExp(`--bl-${prefix}-(\\d+):\\s*(\\d+(?:\\.\\d+)?)${unit}?\\s*;`, 'g');
    let m;
    while ((m = re.exec(css))) out.push([parseInt(m[1], 10), parseFloat(m[2])]);
    return out;
  };
  const fontSizes = grab('fs', 'px').map(([k]) => k);
  const lhPair = Object.fromEntries(grab('lh', 'px'));
  return {
    fontSizes,
    lhPair,
    lineHeights: [...new Set(Object.values(lhPair))].sort(byValue),
    spacing: [0, ...grab('sp', 'px').map(([k]) => k)].sort(byValue),
    radius: [0, ...grab('r', 'px').map(([k]) => k).filter((k) => k > 0)].sort(byValue),
    controlHeights: grab('h', 'px').map(([k]) => k).sort(byValue),
    iconSizes: grab('icon', 'px').map(([k]) => k).sort(byValue),
    zIndex: grab('z', '').map(([k]) => k).sort(byValue),
    widths: grab('w', 'px').map(([k]) => k).sort(byValue),
  };
}

// The scale for a client, the base lists with the brand lists swapped in.
function scaleFor(client) {
  const sc = cssScale();
  if (client && /^[a-z0-9-]+$/.test(client)) {
    const dir = process.env.STUDIO_CLIENTS_DIR || path.join(STUDIO, 'clients');
    const file = path.join(dir, client, 'base-override.json');
    if (fs.existsSync(file)) {
      try {
        const o = JSON.parse(fs.readFileSync(file, 'utf8'));
        for (const k of OVERRIDE_KEYS) if (Array.isArray(o[k])) sc[k] = o[k].slice().sort(byValue);
      } catch { /* an unreadable override means the base scale alone */ }
    }
  }
  return sc;
}

// ---------- the theme ----------
// A size pairs with the css line height when that one is still allowed, else the smallest allowed
// line height at 1.25 times the size or more, else the largest.
function pairedLineHeight(size, sc) {
  const own = sc.lhPair[size];
  if (own !== undefined && sc.lineHeights.includes(own)) return own;
  const lhs = sc.lineHeights;
  return lhs.find((l) => l >= size * 1.25) ?? lhs[lhs.length - 1];
}

const spacingKey = (n) => String(num(n / 4));
const RADIUS_NAME = { 0: 'none', 4: 'DEFAULT', 8: 'lg', 12: 'xl', 16: '2xl', 24: '3xl' };

function themeFor(sc) {
  const fontSize = {};
  for (const s of sc.fontSizes) fontSize[String(s)] = [px(s), { lineHeight: px(pairedLineHeight(s, sc)) }];

  const spacing = {};
  for (const n of sc.spacing) spacing[spacingKey(n)] = n === 0 ? '0px' : px(n);

  const borderRadius = {};
  for (const n of sc.radius) borderRadius[RADIUS_NAME[n] ?? String(n)] = n === 0 ? '0px' : px(n);
  borderRadius.full = '9999px';

  const keywords = { auto: 'auto', full: '100%', screen: '100vh', min: 'min-content', max: 'max-content', fit: 'fit-content' };
  const height = { ...keywords };
  for (const n of [...sc.controlHeights, ...sc.iconSizes]) height[spacingKey(n)] = px(n);
  const minHeight = { 0: '0px', ...height };

  const zIndex = { auto: 'auto' };
  for (const n of sc.zIndex) zIndex[String(n)] = String(n);

  const boxShadow = {
    none: 'none',
    1: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
    2: '0 2px 6px 0 rgba(0, 0, 0, 0.15)',
    3: '0 8px 24px 0 rgba(0, 0, 0, 0.16)',
  };

  const screens = {};
  for (const w of sc.widths) screens[`w${w}`] = px(w);

  return { fontSize, spacing, borderRadius, height, minHeight, zIndex, boxShadow, screens };
}

function presetFor(client) {
  return { theme: themeFor(scaleFor(client)) };
}

const base = presetFor(null);
module.exports = base;
// Non enumerable, so Tailwind never sees them as config keys.
Object.defineProperty(module.exports, 'presetFor', { value: presetFor, enumerable: false });
Object.defineProperty(module.exports, 'scaleFor', { value: scaleFor, enumerable: false });
