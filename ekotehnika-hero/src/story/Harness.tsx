// Dev route for the story builds, /?story=<linija|grad|sistem>&ui=<A|B|C>. The nine combinations
// reach the variant switcher once all three scenes and the shell are in.
import { StoryShell, type UiTheme } from './shell/StoryShell';
import { SCENES, type SceneId } from './scenes';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function Harness() {
  const q = new URLSearchParams(window.location.search);
  const id = (q.get('story') as SceneId) in SCENES ? (q.get('story') as SceneId) : 'linija';
  const ui = (['A', 'B', 'C'].includes(q.get('ui') ?? '') ? q.get('ui') : 'A') as UiTheme;
  return (
    <>
      <StoryShell ui={ui} Scene={SCENES[id]} reduced={reducedQuery.matches} />
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </>
  );
}
