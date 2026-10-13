// The hero, version 5 Sistem, the only version since Filip dropped 2 Linija and 4 Grad on 2026-10-13, see
// studio/clients/ekotehnika/taste.md. It loads on its own. The nine storyline 1 combinations stay in src/story and are
// reachable at /?story=<linija|grad|sistem>&ui=<A|B|C>.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Variant = ComponentType<{ reduced: boolean }>;
export type VariantInfo = { id: string; name: string; Component: LazyExoticComponent<Variant> };

// Storyline 2, see src/story2. The earlier single scene versions stay in v2, v4 and v5 for storyline 1 and the board.
export const variants: VariantInfo[] = [
  { id: '5', name: 'Sistem', Component: lazy(() => import('../story2/versions').then((m) => ({ default: m.Sistem }))) },
];
