// Five hero variants, each a 1:1 copy of one reel's visual language in Linde colours. Picked by
// number, see studio/clients/ekotehnika/taste.md 2026-10-08 18:09.
import type { ComponentType } from 'react';
import V1 from './v1';
import V2 from './v2';
import V3 from './v3';
import V4 from './v4';
import V5 from './v5';

export type VariantInfo = { n: number; name: string; Component: ComponentType<{ reduced: boolean }> };

export const variants: VariantInfo[] = [
  { n: 1, name: 'Globus', Component: V1 },
  { n: 2, name: 'Linija', Component: V2 },
  { n: 3, name: 'Crveni sat', Component: V3 },
  { n: 4, name: 'Grad', Component: V4 },
  { n: 5, name: 'Sistem', Component: V5 },
];
