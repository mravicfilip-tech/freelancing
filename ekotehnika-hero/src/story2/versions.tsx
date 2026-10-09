// Storyline 2 as the three hero versions, the same shell over each version's scene. 2 Linija and 4 Grad sit on a
// light ground, 5 Sistem on dark.
import { StoryShell } from './shell/StoryShell';
import { SCENES } from './scenes';

type Props = { reduced: boolean };

export const Linija = ({ reduced }: Props) => <StoryShell Scene={SCENES.linija} tone="light" reduced={reduced} />;
export const Grad = ({ reduced }: Props) => <StoryShell Scene={SCENES.grad} tone="light" reduced={reduced} />;
export const Sistem = ({ reduced }: Props) => <StoryShell Scene={SCENES.sistem} tone="dark" reduced={reduced} />;
