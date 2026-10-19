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
