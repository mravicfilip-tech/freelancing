// The storyline 2 clock every scene and the shell read. Values live in refs and change every frame, so read them in
// useFrame or a requestAnimationFrame loop, never through React state.
//
// beat  index into TIMELINE
// k     0 to 1 inside the beat, following the scroll
// pos   smoothed scroll position in story pixels, 0 to LENGTH
// still true for a reduced motion still or a frozen shot, the refs never change

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScrollStory, clamp01 } from '../scroll/useScrollStory';
import { LENGTH, TIMELINE, beatAt } from './timeline';
import { RETURN } from './preview';

// The progress the page lands on after a switch of the panel reloaded it, from the beat id and k it left, with this page's spans.
const RESTORE = (() => {
  const r = RETURN;
  if (!r) return null;
  const b = TIMELINE.find((x) => x.id === r.id);
  return b ? (b.start + (b.end - b.start) * Math.min(1, Math.max(0, r.k))) / LENGTH : null;
})();

export type StoryClock = {
  beat: { current: number };
  k: { current: number };
  pos: { current: number };
  still: boolean;
};

export type SceneProps = { clock: StoryClock };

export const stillClock = (beat: number, k = 1): StoryClock => ({
  beat: { current: beat },
  k: { current: k },
  pos: { current: TIMELINE[beat].start + (TIMELINE[beat].end - TIMELINE[beat].start) * k },
  still: true,
});

export function useStoryClock(reduced: boolean) {
  const { stageRef, progress, goTo } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.09, restore: RESTORE });
  const beat = useRef(0);
  const k = useRef(0);
  const pos = useRef(0);
  const [beatState, setBeatState] = useState(0);
  const clock = useRef<StoryClock>({ beat, k, pos, still: reduced }).current;
  clock.still = reduced;

  useEffect(() => {
    if (reduced) return;
    // A read only handle for timing checks, ?debug=clock.
    const debug = new URLSearchParams(window.location.search).get('debug') === 'clock';
    if (debug) Object.defineProperty(window, '__storyPos', { get: () => pos.current, configurable: true });
    // Shots and reviews can freeze the clock on one keyframe, ?at=<beatId>&k=<0 to 1>.
    const q = new URLSearchParams(window.location.search);
    const at = TIMELINE.findIndex((b) => b.id === q.get('at'));
    if (at >= 0) {
      const kk = clamp01(Number(q.get('k') ?? 1));
      beat.current = at;
      k.current = kk;
      pos.current = TIMELINE[at].start + (TIMELINE[at].end - TIMELINE[at].start) * kk;
      clock.still = true;
      setBeatState(at);
      return;
    }
    let last = -1;
    const tick = () => {
      pos.current = progress.current * LENGTH;
      const i = beatAt(pos.current);
      const span = TIMELINE[i];
      k.current = clamp01((pos.current - span.start) / (span.end - span.start));
      if (i !== last) {
        last = i;
        beat.current = i;
        setBeatState(i);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      if (debug) delete (window as { __storyPos?: number }).__storyPos;
    };
  }, [reduced, progress, clock]);

  const goToBeat = (id: string) => {
    const b = TIMELINE.find((x) => x.id === id);
    if (b) goTo((b.start + 4) / LENGTH);
  };

  return { stageRef, clock, beat: beatState, goToBeat };
}
