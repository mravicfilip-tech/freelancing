/** The five treatments of the mark. The id rides on `?variant=` and in localStorage (see src/site.ts). */
export const VARIANTS = [
  { id: 'lined', label: 'Lined', blurb: 'The outline extruded as slices and ribs, drawn in orange light' },
  { id: 'glass', label: 'Glass', blurb: 'Three slabs of tinted glass under a studio light' },
  { id: 'particles', label: 'Particles', blurb: 'Forty thousand points assemble the mark, then scatter' },
  { id: 'solid', label: 'Solid', blurb: 'A matte object, orange face, one orange rim light' },
  { id: 'liquid', label: 'Liquid', blurb: 'A wet orange surface that never quite settles' },
] as const;

export type VariantId = (typeof VARIANTS)[number]['id'];
export const DEFAULT_VARIANT: VariantId = 'lined';
export const isVariantId = (v: unknown): v is VariantId => VARIANTS.some((x) => x.id === v);
