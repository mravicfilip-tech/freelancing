import type { ComponentType } from 'react';
import type { Content } from '../../../shared/content';
import { Hero } from '../../Hero';

// Hero designs 2 to 5. Each is its own component in this folder. 1 is the round 2 hero.
export const HERO_VARIANTS: Record<2 | 3 | 4 | 5, ComponentType<{ c: Content }>> = {
  2: Hero,
  3: Hero,
  4: Hero,
  5: Hero,
};
