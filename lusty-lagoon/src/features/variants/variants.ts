import type { SwitcherVariant } from '../../components/dev/VariantSwitcher';

// The dashboard variant set, round 4. Variant 2 was dropped and the rest keep their numbers. The index page and the variant switcher both read this list.
// The baseline is the Figma 1 to 1 lobby, reached as /lobby?compare so the switcher shows there too.
export const DASHBOARD_VARIANTS: SwitcherVariant[] = [
  { key: '0', label: 'Baseline', short: 'Base', href: '/lobby?compare', note: 'The Figma Dashboard frame, 1 to 1, with the review notes applied' },
  { key: '1', label: 'Social lagoon', href: '/variants/1', note: 'Three columns, a live chat rail with the daily chest on top' },
  { key: '3', label: 'Rank road', href: '/variants/3', note: 'The chest streak, the rank road and the weekly race first' },
  { key: '4', label: 'Casino floor', href: '/variants/4', note: 'Rooms as vivid tiles, then a fast game finder, no sidebar' },
  { key: '5', label: 'Quiet vault', href: '/variants/5', note: 'Balance, quick deposit and live wagers first, calm surfaces' },
];

// Round 4 micro detail boards. Each option is its own URL and the switcher walks them, Base first.
// The list leaves with the board pages once Filip picks.
export const BUTTON_VARIANTS: SwitcherVariant[] = [
  { key: '0', label: 'Base', short: 'Base', href: '/variants/buttons?btn=0', note: 'Round 3, purple primary and gold Checkout' },
  { key: '1', label: 'Flat', href: '/variants/buttons?btn=1', note: 'Solid orange, 12 radius, sentence case, dark label' },
  { key: '2', label: 'Pill', href: '/variants/buttons?btn=2', note: 'Two close orange stops, a full pill, dark label' },
  { key: '3', label: 'Caps', href: '/variants/buttons?btn=3', note: 'Solid orange, 8 radius, lighter edge, display capitals' },
  { key: '4', label: 'Icon tile', href: '/variants/buttons?btn=4', note: 'Solid orange with a darker arrow square at the end' },
  { key: '5', label: 'Ember', href: '/variants/buttons?btn=5', note: 'Deep burnt orange, warm edge, white label' },
];

export const SIDEBAR_VARIANTS: SwitcherVariant[] = [
  { key: '0', label: 'Base', short: 'Base', href: '/variants/sidebar?nav=0', note: 'Round 3, purple wash with a faint edge' },
  { key: '1', label: 'Raised with a light edge', href: '/variants/sidebar?nav=1', note: 'The row lifts one step with a 1px white edge' },
  { key: '2', label: 'Accent bar', href: '/variants/sidebar?nav=2', note: 'The row lifts with a 3px accent bar at the left' },
  { key: '3', label: 'Accent edge', href: '/variants/sidebar?nav=3', note: 'The fill stays, a 1px accent edge all round' },
  { key: '4', label: 'Soft light', href: '/variants/sidebar?nav=4', note: 'A purple light from the left inside the row' },
];
