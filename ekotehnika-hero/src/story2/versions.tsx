// Storyline 2 as the hero, version 5 Sistem, the shell over the Sistem scene on a light ground.
import { StoryShell } from './shell/StoryShell';
import { SCENES } from './scenes';
import { SISTEM_DARK_TOP } from './scenes/sistem/darkTop';

type Props = { reduced: boolean };

// Version 5 is light on every beat but the push to black and the servis blueprint, see taste.md 2026-10-12. The span is
// shared with the scene's band over the top row, see scenes/sistem/darkTop.ts.
export const Sistem = ({ reduced }: Props) => (
  <StoryShell Scene={SCENES.sistem} tone="light" reduced={reduced} darkLayers={['S']} darkTop={SISTEM_DARK_TOP} />
);
