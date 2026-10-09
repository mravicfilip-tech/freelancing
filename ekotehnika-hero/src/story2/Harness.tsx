// Dev route for storyline 2, /?story2=<linija|grad|sistem>, one scene without the version switcher.
import { StoryShell } from './shell/StoryShell';
import { SCENES, type SceneId } from './scenes';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function Harness2() {
  const q = new URLSearchParams(window.location.search);
  const id = (q.get('story2') as SceneId) in SCENES ? (q.get('story2') as SceneId) : 'linija';
  return <StoryShell Scene={SCENES[id]} tone={id === 'sistem' ? 'dark' : 'light'} reduced={reducedQuery.matches} />;
}
