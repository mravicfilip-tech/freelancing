import { useEffect, useState } from 'react';
import { clamp01, smooth } from '../hero6/geometry';
import { urlProgress, type Progress } from '../hero6/progress';

// The phone's progress. Hero 7 on a phone plays by itself, Filip, 15 October 2026, "it can just autoplay
// itself on load like a decent normal speed". The same Progress interface as hero6/progress.ts, sample,
// current and subscribe, but p is driven by time and not by the scroll. It runs 0 to 1 in PLAY_MS once it is
// armed, which is when the hero is on screen and the load has shown the headline and drawn the route, and
// then holds at 1, the lit house. It plays once per page load and never loops. It stops while the hero is off
// screen or the tab is hidden and goes on from where it was. `?p=` pins a frame the way it does on a desktop,
// and wins. A `gate` can hold the clock while the flipbook has not got the next frame yet, so a slow
// connection waits and never skips.

export const PLAY_MS = 12000;
// how much of a smoothstep is mixed into the linear run, 0 is linear, 1 a full smoothstep. A gentle ease at
// both ends, the first and the last tenth of the story move at about half speed.
const EASE = 0.5;
// the share of the hero that must be on screen for the story to run
export const SEEN = 0.25;

export const playAt = (t: number) => {
  const k = clamp01(t);
  return k + EASE * (smooth(k) - k);
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
      const q = playAt(elapsed / PLAY_MS);
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
