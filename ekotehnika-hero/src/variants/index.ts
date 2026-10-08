// The three hero variants still in play, each a 1:1 copy of one reel's visual language in Linde
// colours. 1 and 3 were dropped, see studio/clients/ekotehnika/taste.md. Each loads on its own, so a
// visitor only downloads the variant on screen.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Variant = ComponentType<{ reduced: boolean }>;
export type VariantInfo = { n: number; name: string; Component: LazyExoticComponent<Variant> };

export const variants: VariantInfo[] = [
  { n: 2, name: 'Linija', Component: lazy(() => import('./v2')) },
  { n: 4, name: 'Grad', Component: lazy(() => import('./v4')) },
  { n: 5, name: 'Sistem', Component: lazy(() => import('./v5')) },
];
