// Variant switches for Foundry, read from the URL so a link opens the variant it names.
//   ?v=1&hero=1..6   hero design, 1 is the hero as built in round 2, 6 the cable specimen
//   ?v=1&btn=1..5    button style site wide, 1 is the bracket button as built
//   ?v=1&lab=buttons the five buttons side by side with their states
const q = () => new URLSearchParams(window.location.search);
const pick = (key: string, max = 5) => {
  const n = Number(q().get(key));
  return n >= 1 && n <= max ? n : 1;
};

export type VariantN = 1 | 2 | 3 | 4 | 5;
export type HeroN = VariantN | 6;
export const heroVariant = () => pick('hero', 6) as HeroN;
export const btnVariant = () => pick('btn') as VariantN;
export const lab = () => (q().get('lab') === 'buttons' ? 'buttons' : null);
