// Base layout scale from the studio kit, with Lusty Lagoon's colours and type mapped on top.
// Colours point at the tokens in src/styles/tokens.css, so a value changes in one place.
const path = require('node:path');
const { presetFor } = require(path.join(__dirname, '..', 'studio', 'foundation', 'tailwind-preset.cjs'));

const SQUARE = { 5: '20px', 9: '36px', 10: '40px', 11: '44px' };
const token = (name) => `rgb(var(--ll-${name}) / <alpha-value>)`;

module.exports = {
  presets: [presetFor('lusty-lagoon')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: token('page'),
        panel: token('panel'),
        raised: token('raised'),
        sunken: token('sunken'),
        line: token('line'),
        field: token('field'),
        ink: token('ink'),
        ink2: token('ink-2'),
        ink3: token('ink-3'),
        accent: token('accent'),
        brand: token('brand'),
        gold: token('gold'),
        'gold-hover': token('gold-hover'),
        'gold-press': token('gold-press'),
        'on-gold': token('on-gold'),
        tonal: token('tonal'),
        'tonal-hover': token('tonal-hover'),
        'tonal-line': token('tonal-line'),
        pending: token('pending'),
        success: token('success'),
        danger: token('danger'),
        topbar: token('topbar'),
        'topbar-line': token('topbar-line'),
        'side-line': token('side-line'),
        'menu-well': token('menu-well'),
        'menu-active': token('menu-active'),
        'menu-active-line': token('menu-active-line'),
        'menu-active-well': token('menu-active-well'),
        label: token('label'),
        'card-line': token('card-line'),
        tile: token('tile'),
        'tile-line': token('tile-line'),
        thead: token('thead'),
        'rank-box': token('rank-box'),
        'rank-box-line': token('rank-box-line'),
        'rank-track': token('rank-track'),
        'rank-fill': token('rank-fill'),
        win: token('win'),
        'cta-gold-line': token('cta-gold-line'),
        orange: token('orange'),
        'on-orange': token('on-orange'),
        'cta-orange-line': token('cta-orange-line'),
      },
      fontFamily: {
        display: ['"Bai Jamjuree"', 'system-ui', 'sans-serif'],
        sans: ['Switzer', 'system-ui', 'sans-serif'],
      },
      // Square controls and icon boxes, so a width can match the height scale (h-5 w-5, h-10 w-10).
      width: { ...SQUARE, sidebar: 'var(--bl-sidebar-open)' },
      minWidth: SQUARE,
      size: SQUARE,
      maxWidth: {
        canvas: 'var(--bl-canvas-max)',
      },
    },
  },
  plugins: [],
};
