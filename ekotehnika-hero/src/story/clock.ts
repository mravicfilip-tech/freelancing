// The story clock every scene and the shell read. Values live in refs and change every frame, so
// scenes read them inside useFrame or their own requestAnimationFrame loop, never through React state.
//
// beat  index into TIMELINE
// k     0 to 1 inside the beat. Scroll beats follow the scroll, clip beats follow their own timer.
// pos   smoothed scroll position in story pixels, 0 to LENGTH
// still true for a reduced motion still, the refs never change

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScrollStory, clamp01 } from '../scroll/useScrollStory';
import { LENGTH, TIMELINE, beatAt, firstBeatOf, type ServiceId } from './timeline';

export type StoryClock = {
  beat: { current: number };
  k: { current: number };
  pos: { current: number };
  still: boolean;
};

export type SceneProps = { clock: StoryClock };

// A fixed clock for stills, the reduced motion panels and the board.
export const stillClock = (beat: number, k = 1): StoryClock => ({
  beat: { current: beat },
  k: { current: k },
  pos: { current: TIMELINE[beat].start + (TIMELINE[beat].end - TIMELINE[beat].start) * k },
  still: true,
});

const IDLE_MS = 160;
const SKIP_RATE = 3.2; // clip progress per second while the visitor scrolls forward through a clip

export function useStoryClock(reduced: boolean) {
  const { stageRef, progress, raw, goTo } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.09 });
  const beat = useRef(0);
  const k = useRef(0);
  const pos = useRef(0);
  const clip = useRef(0);
  const [beatState, setBeatState] = useState(0);
  const clock = useRef<StoryClock>({ beat, k, pos, still: reduced }).current;
  clock.still = reduced;

  useEffect(() => {
    if (reduced) return;
    // Shots and reviews can freeze the clock on one keyframe, ?at=<beatId>&k=<0 to 1>.
    const q = new URLSearchParams(window.location.search);
    const at = TIMELINE.findIndex((b) => b.id === q.get('at'));
    if (at >= 0) {
      const kk = clamp01(Number(q.get('k') ?? 1));
      beat.current = at;
      k.current = kk;
      pos.current = TIMELINE[at].start + (TIMELINE[at].end - TIMELINE[at].start) * kk;
      setBeatState(at);
      return;
    }
    let lastRaw = raw.current;
    let lastMove = performance.now();
    let dir = 1;
    let lastBeat = -1;
    let lastT = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const r = raw.current;
      if (Math.abs(r - lastRaw) > 1e-6) {
        dir = r > lastRaw ? 1 : -1;
        lastMove = now;
        lastRaw = r;
      }
      const moving = now - lastMove < IDLE_MS;
      pos.current = progress.current * LENGTH;
      const i = beatAt(pos.current);
      const span = TIMELINE[i];
      const sk = clamp01((pos.current - span.start) / (span.end - span.start));
      if (i !== lastBeat) {
        // Entering a clip from before starts it at 0, from after starts it at its end.
        clip.current = i > lastBeat ? 0 : 1;
        if (i === 0 && lastBeat === -1) clip.current = 0;
        lastBeat = i;
        beat.current = i;
        setBeatState(i);
      }
      if (span.clip) {
        if (moving && dir > 0) clip.current = Math.min(1, Math.max(clip.current, sk) + dt * SKIP_RATE);
        else if (moving && dir < 0) clip.current = Math.min(clip.current, sk);
        else if (dir > 0 || i === 0) clip.current = Math.min(1, clip.current + dt / span.clip);
        k.current = clip.current;
      } else {
        k.current = sk;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced, progress, raw]);

  // Scroll to a service, landing just inside its first beat.
  const goToService = (s: ServiceId) => {
    const b = TIMELINE[firstBeatOf(s)];
    goTo((b.start + 4) / LENGTH);
  };

  return { stageRef, clock, beat: beatState, goToService };
}
