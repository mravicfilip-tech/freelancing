import type { ComponentType } from 'react';
import type { Content } from '../../../shared/content';
import { Hero2 } from './Hero2';
import { Hero3 } from './Hero3';
import { Hero4 } from './Hero4';
import { Hero5 } from './Hero5';
import { Hero6 } from './Hero6';
import { Hero7 } from './Hero7';

// Hero designs 2 to 7. Each is its own component in this folder. 1 is the round 2 hero.
export const HERO_VARIANTS: Record<2 | 3 | 4 | 5 | 6 | 7, ComponentType<{ c: Content }>> = {
  2: Hero2,
  3: Hero3,
  4: Hero4,
  5: Hero5,
  6: Hero6,
  7: Hero7,
};
