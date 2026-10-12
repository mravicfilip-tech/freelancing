// Storyline 2 as the three hero versions, the same shell over each version's scene, all on a light ground.
import { StoryShell } from './shell/StoryShell';
import { SCENES } from './scenes';

type Props = { reduced: boolean };

export const Linija = ({ reduced }: Props) => <StoryShell Scene={SCENES.linija} tone="light" reduced={reduced} />;
export const Grad = ({ reduced }: Props) => <StoryShell Scene={SCENES.grad} tone="light" reduced={reduced} />;
// Version 5 is light on every beat but the push to black and the servis blueprint, see taste.md 2026-10-12.
const SISTEM_DARK_TOP: [number, number][] = [[7790, 9525]];
export const Sistem = ({ reduced }: Props) => (
  <StoryShell Scene={SCENES.sistem} tone="light" reduced={reduced} darkLayers={['S']} darkTop={SISTEM_DARK_TOP} />
);
