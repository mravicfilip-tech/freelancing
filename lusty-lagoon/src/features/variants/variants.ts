import type { SwitcherVariant } from '../../components/dev/VariantSwitcher';

// The dashboard variant set, round 6. Three directions kept, 1, 2 and 5 (briefs/round-6/notes.md). The index page and the variant switcher both read this list.
// The baseline is the Figma 1 to 1 lobby, reached as /lobby?compare so the switcher shows there too.
export const DASHBOARD_VARIANTS: SwitcherVariant[] = [
  { key: '0', label: 'Baseline', short: 'Base', href: '/lobby?compare', note: 'The Figma Dashboard frame, 1 to 1, with the review notes applied' },
  { key: '1', label: 'Neon arcade', href: '/variants/1', note: 'Vivid and social, three columns with a live feed and the chat rail' },
  { key: '2', label: 'Mascot stage', href: '/variants/2', note: 'Cinematic hero with the character breaking out, then tall originals tiles' },
  { key: '5', label: 'Glass vault', href: '/variants/5', note: 'True black and frosted glass, the balance as the hero, then checkout' },
];
