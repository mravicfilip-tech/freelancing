// Variant switches for Foundry, read from the URL so a link opens the variant it names.
//   ?v=1&hero=1..7   hero design, 7 the excavator is the default, Filip's pick for production on
//                    15 October, 6 the cable specimen before it, 1 is the hero as built in round 2
//   ?v=1&btn=1..5    button style site wide, 3 the slab and arrow is the default, Filip's pick
//   ?v=1&btn=3&slab=1..5 the five versions of the slab and arrow, site wide, 3 the arrow cell is
//                    the default, Filip's pick, 1 is style 3 as first built
//   ?v=1&lab=buttons the five buttons side by side with their states
//   ?v=1&lab=slab    the five slab and arrow versions as numbered rows on dark, light and red
//   ?v=1&blk=1..3    the colour of the text reveal's blocks, 1 the text's own colour, 2 bull-red,
//                    3 bull-red on headlines and the text's own colour on body copy. Red panels keep 1
const q = () => new URLSearchParams(window.location.search);
const pick = (key: string, max = 5, fallback = 1) => {
  const n = Number(q().get(key));
  return n >= 1 && n <= max ? n : fallback;
};

export type VariantN = 1 | 2 | 3 | 4 | 5;
export type HeroN = VariantN | 6 | 7;
export const heroVariant = () => pick('hero', 7, 7) as HeroN;
export const btnVariant = () => pick('btn', 5, 3) as VariantN;
export const blkVariant = () => pick('blk', 3, 1);
export type SlabN = VariantN;
// The slab switch. Null when the URL does not carry a valid ?slab, so the arrow cell, 3, holds.
export const slabVariant = () => {
  const n = Number(q().get('slab'));
  return n >= 1 && n <= 5 ? (n as SlabN) : null;
};
// Which lab page the URL asks for. Foundry.tsx renders ButtonLab for any truthy `lab()`,
// so both pages return 'buttons' there and ButtonLab reads labKind() to pick the page.
export const labKind = () => {
  const v = q().get('lab');
  return v === 'buttons' || v === 'slab' ? v : null;
};
export const lab = () => (labKind() ? 'buttons' : null);
