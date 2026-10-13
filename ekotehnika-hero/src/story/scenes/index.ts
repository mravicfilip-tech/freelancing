// The three scenes the story runs on, one per version. Each loads on its own.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { SceneProps } from '../clock';

export type SceneId = 'linija' | 'grad' | 'sistem';
export const SCENES: Record<SceneId, LazyExoticComponent<ComponentType<SceneProps>>> = {
  linija: lazy(() => import('./linija')),
  grad: lazy(() => import('./grad')),
  sistem: lazy(() => import('./sistem')),
};
