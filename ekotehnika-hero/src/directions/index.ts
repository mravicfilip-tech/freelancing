// The five hero directions under exploration. Each owns its folder, its UI, its type and its
// story. Picked by number, see studio/clients/ekotehnika/taste.md 2026-10-08 17:27.
import type { ComponentType } from 'react';
import D1 from './d1';
import D2 from './d2';
import D3 from './d3';
import D4 from './d4';
import D5 from './d5';

export type DirectionInfo = { n: number; name: string; Component: ComponentType<{ reduced: boolean }> };

export const directions: DirectionInfo[] = [
  { n: 1, name: 'Noćna smena', Component: D1 },
  { n: 2, name: 'Rendgen', Component: D2 },
  { n: 3, name: 'Minijatura', Component: D3 },
  { n: 4, name: 'Anatomija', Component: D4 },
  { n: 5, name: 'Nacrt', Component: D5 },
];
