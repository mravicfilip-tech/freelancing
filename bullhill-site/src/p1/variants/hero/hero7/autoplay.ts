import { useEffect, useState } from 'react';
import { clamp01 } from '../hero6/geometry';
import { urlProgress, type Progress } from '../hero6/progress';

// The phone's progress. Hero 7 on a phone plays by itself, Filip, 15 October 2026, "it can just autoplay
// itself on load like a decent normal speed". The same Progress interface as hero6/progress.ts, sample,
// current and subscribe, but p is driven by time and not by the scroll. It runs 0 to 1 in PLAY_MS once it is
// armed, which is when the hero is on screen and the load has shown the headline and drawn the route, and
// then holds at 1, the lit house. It plays once per page load and never loops. It stops while the hero is off
// screen or the tab is hidden and goes on from where it was. `?p=` pins a frame the way it does on a desktop,
// and wins. A `gate` can hold the clock while the flipbook has not got the next frame yet, so a slow
// connection waits and never skips.

// The pace, seconds from the start to p, a key at the end of each beat. The story was paced for the scroll, so
// an even run of 12 seconds gave a dig cycle of 0.63s and a backfill cycle of 0.31s, and in the backfill the
// house swung up to 16 degrees from one frame to the next at 60 frames a second, which reads as a jerk at any
// frame rate. Filip, 15 October 2026, "acting weird and still not smooth". Each beat now gets the time its
// motion needs, a dig cycle of 1.1s and a backfill cycle of 0.9s, the house swings under 7 degrees a frame,
// and the still opening is short. Between the keys the speed changes smoothly and never runs backwards, and it
// eases from rest at the start and to rest on the lit house.
const PACE: readonly (readonly [number, number])[] = [
  [0, 0],
  [1.5, 0.15], // the route marked, nothing moves, long enough to read the first step
  [7, 0.45], // the dig, five cycles
  [11, 0.76], // the ducts laid and the fibre blown in, the camera's widest moves
  [15.5, 0.89], // the backfill, five cycles
  [18, 1], // the surface put back, the machine drives off and the house lights up
];
export const PLAY_MS = PACE[PACE.length - 1][0] * 1000;
// the speed at each key, zero at the two ends, the harmonic mean of the speeds either side between
const RATE = PACE.map((k, i) => {
  if (i === 0 || i === PACE.length - 1) return 0;
  const a = (k[1] - PACE[i - 1][1]) / (k[0] - PACE[i - 1][0]);
  const b = (PACE[i + 1][1] - k[1]) / (PACE[i + 1][0] - k[0]);
  return (2 * a * b) / (a + b);
});
// the share of the hero that must be on screen for the story to run
export const SEEN = 0.25;

// p at ms into the story
export const playAt = (ms: number) => {
  const s = ms / 1000;
  if (s <= 0) return 0;
  if (s >= PACE[PACE.length - 1][0]) return 1;
  let i = 0;
  while (s > PACE[i + 1][0]) i++;
  const [t0, p0] = PACE[i];
  const [t1, p1] = PACE[i + 1];
  const h = t1 - t0;
  const t = (s - t0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return clamp01((2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * RATE[i] + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * RATE[i + 1]);
};

export type Autoplay = Progress & {
  // armed once the headline is shown and the scene or the first frame is up
  arm(on: boolean): void;
  see(on: boolean): void;
  hold(gate: ((p: number) => boolean) | null): void;
  start(): () => void;
};

export function createAutoplay(): Autoplay {
  const subs = new Set<(p: number) => void>();
  const override = urlProgress();
  let elapsed = 0;
  let p = 0;
  let armed = false;
  let seen = true;
  let tab = typeof document === 'undefined' ? true : !document.hidden;
  let gate: ((p: number) => boolean) | null = null;
  let raf = 0;
  let t0 = 0;
  let on = false;

  const run = () => override === null && armed && seen && tab && p < 1;
  const emit = () => subs.forEach((f) => f(override !== null ? override : p));
  const tick = (now: number) => {
    raf = 0;
    if (!on) return;
    if (!run()) {
      t0 = 0;
      return;
    }
    // a pause, off screen, a hidden tab or a held gate, restarts t0, so a gap here is only a slow frame and
    // the story keeps real time on a slow phone. A stall of 2s or more counts as 2s.
    const dt = t0 ? Math.min(2000, now - t0) : 0;
    t0 = now;
    if (!gate || gate(p)) {
      elapsed += dt;
      const q = playAt(elapsed);
      if (q !== p) {
        p = q;
        emit();
      }
    }
    if (run()) raf = requestAnimationFrame(tick);
  };
  const ask = () => {
    if (on && !raf && run()) raf = requestAnimationFrame(tick);
  };

  const store: Autoplay = {
    sample: () => (override !== null ? override : p),
    current: () => (override !== null ? override : p),
    subscribe(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    arm(v) {
      armed = v;
      ask();
    },
    see(v) {
      seen = v;
      t0 = 0;
      ask();
    },
    hold(g) {
      gate = g;
    },
    start() {
      on = true;
      const vis = () => {
        tab = !document.hidden;
        t0 = 0;
        ask();
      };
      document.addEventListener('visibilitychange', vis);
      // a pinned frame tells its subscribers once, so the label and the scene draw it
      if (override !== null) raf = requestAnimationFrame(() => ((raf = 0), emit()));
      ask();
      return () => {
        on = false;
        document.removeEventListener('visibilitychange', vis);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
    },
  };
  return store;
}

// The hero's autoplay. `enabled` is false for reduced motion, which keeps p at 0 and never starts.
export function useAutoplay(section: React.RefObject<HTMLElement | null>, enabled: boolean): Autoplay {
  const [store] = useState(createAutoplay);
  useEffect(() => {
    if (!enabled) return;
    return store.start();
  }, [store, enabled]);
  // on screen, a quarter of the hero or more
  useEffect(() => {
    const el = section.current;
    if (!enabled || !el) return;
    const io = new IntersectionObserver((es) => store.see(es[es.length - 1].intersectionRatio >= SEEN - 0.01), { threshold: [0, SEEN, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [store, enabled, section]);
  return store;
}
