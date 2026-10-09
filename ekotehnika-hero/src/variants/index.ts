// The three hero versions Filip drives the next storyline in, see studio/clients/ekotehnika/taste.md
// 2026-10-09. 2 Linija is the drawn style, 4 Grad the 3D city, 5 Sistem the dark 3D studio. Each
// loads on its own, so a visitor only downloads the version on screen. The nine story combinations
// stay in src/story and are reachable at /?story=<linija|grad|sistem>&ui=<A|B|C>.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Variant = ComponentType<{ reduced: boolean }>;
export type VariantInfo = { id: string; name: string; Component: LazyExoticComponent<Variant> };

export const variants: VariantInfo[] = [
  { id: '2', name: 'Linija', Component: lazy(() => import('./v2')) },
  { id: '4', name: 'Grad', Component: lazy(() => import('./v4')) },
  { id: '5', name: 'Sistem', Component: lazy(() => import('./v5')) },
];
