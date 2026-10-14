import type { ComponentType } from 'react';
import type { Content } from '../../../shared/content';
import { Hero2 } from './Hero2';
import { Hero3 } from './Hero3';
import { Hero4 } from './Hero4';
import { Hero5 } from './Hero5';

// Hero designs 2 to 5. Each is its own component in this folder. 1 is the round 2 hero.
export const HERO_VARIANTS: Record<2 | 3 | 4 | 5, ComponentType<{ c: Content }>> = {
  2: Hero2,
  3: Hero3,
  4: Hero4,
  5: Hero5,
};
