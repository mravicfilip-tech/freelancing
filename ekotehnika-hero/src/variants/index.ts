// The nine hero combinations, three scenes times three UI themes, see
// studio/clients/ekotehnika/briefs/hero-rebuild/storyboard.html and taste.md 2026-10-09. 2 is the
// drawn Linija scene, 4 the Grad 3D city, 5 the Sistem 3D studio. A soft sheet, B glow cards, C
// pills and dots. Each scene loads on its own, so a visitor only downloads the one on screen.
import { createElement, type ComponentType } from 'react';
import { StoryShell, type UiTheme } from '../story/shell/StoryShell';
import { SCENES, type SceneId } from '../story/scenes';

type Variant = ComponentType<{ reduced: boolean }>;
export type VariantInfo = { id: string; name: string; Component: Variant };

const combo = (scene: SceneId, ui: UiTheme): Variant => {
  const C = ({ reduced }: { reduced: boolean }) => createElement(StoryShell, { ui, Scene: SCENES[scene], reduced });
  C.displayName = `Story_${scene}_${ui}`;
  return C;
};

const SCENE_NAMES: [string, SceneId, string][] = [
  ['2', 'linija', 'Linija'],
  ['4', 'grad', 'Grad'],
  ['5', 'sistem', 'Sistem'],
];

export const variants: VariantInfo[] = SCENE_NAMES.flatMap(([n, scene, name]) =>
  (['A', 'B', 'C'] as UiTheme[]).map((ui) => ({ id: `${n}${ui}`, name: `${name} ${ui}`, Component: combo(scene, ui) })),
);
