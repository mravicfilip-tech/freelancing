import type { SwitcherVariant } from '../../components/dev/VariantSwitcher';

// The dashboard variant set, round 6. Three directions kept, 1, 2 and 5 (briefs/round-6/notes.md). The index page and the variant switcher both read this list.
// The baseline is the Figma 1 to 1 lobby, reached as /lobby?compare so the switcher shows there too.
export const DASHBOARD_VARIANTS: SwitcherVariant[] = [
  { key: '0', label: 'Baseline', short: 'Base', href: '/lobby?compare', note: 'The Figma Dashboard frame, 1 to 1, with the review notes applied' },
  { key: '1', label: 'Neon arcade', href: '/variants/1', note: 'Vivid and social, three columns with a live feed and the chat rail' },
  { key: '2', label: 'Mascot stage', href: '/variants/2', note: 'Cinematic hero with the character breaking out, then tall originals tiles' },
  { key: '5', label: 'Glass vault', href: '/variants/5', note: 'True black and frosted glass, the balance as the hero, then checkout' },
];

// Round 8, Neon arcade picked. Its open choices on /variants/1, one set per choice, each a query value
// the page reads. 0 is Base, the round 7 build. The app mounts one switcher bar per set and keeps the
// other sets' values in every link, so a hero and a card pick can be seen together. On a phone the bars
// are mobile and hero; on desktop hero and cards.
export type V1OptionSet = { param: 'hero' | 'cards' | 'm'; title: string; fallback: string; options: { value: string; short: string; label: string; note: string }[] };
export const V1_OPTION_SETS: V1OptionSet[] = [
  {
    param: 'hero',
    title: 'Hero',
    fallback: '0',
    options: [
      { value: '0', short: 'Base', label: 'Hero, Base', note: 'The round 7 hero, the woman between pillars over the courtyard' },
      { value: '1', short: 'H1', label: 'Hero 1, Spotlight right', note: 'The woman lit on the right, a clean purple headline side' },
      { value: '2', short: 'H2', label: 'Hero 2, Poster', note: 'The scene edge to edge, the headline in frosted glass, one stats bar' },
      { value: '3', short: 'H3', label: 'Hero 3, Carousel', note: 'Three slides, welcome, the giveaway and the Daily chest' },
    ],
  },
  {
    param: 'cards',
    title: 'Cards',
    fallback: '1',
    options: [
      { value: '1', short: 'C1', label: 'Cards 1, Lit stage', note: 'Dark face, the art breaking out of the top, the sheen on hover' },
      { value: '2', short: 'C2', label: 'Cards 2, Deep hue', note: 'A rich hue face falling to the panel, the art large on the right' },
      { value: '3', short: 'C3', label: 'Cards 3, Compact tiles', note: 'Short shortcut tiles, the art cut by the right edge' },
    ],
  },
  {
    param: 'm',
    title: 'Mobile',
    fallback: '1',
    options: [
      { value: '1', short: 'M1', label: 'Mobile 1, Tab bar', note: 'Five tabs, bottom sheets, games in three columns' },
      { value: '2', short: 'M2', label: 'Mobile 2, Deposit centre', note: 'A raised Deposit in the bar, full height panels, games in rails' },
      { value: '3', short: 'M3', label: 'Mobile 3, Floating dock', note: 'A glass dock that hides on scroll, reward chips, drawers' },
    ],
  },
];

