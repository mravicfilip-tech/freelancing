// The scene storyline 2 runs on, Sistem. It loads on its own.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { SceneProps } from '../clock';

export type SceneId = 'sistem';
export const SCENES: Record<SceneId, LazyExoticComponent<ComponentType<SceneProps>>> = {
  sistem: lazy(() => import('./sistem')),
};
