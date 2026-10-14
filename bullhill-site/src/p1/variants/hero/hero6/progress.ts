import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clamp01 } from './geometry';

// Beat 4 progress. p runs 0 to 1 across the pin, read from the hero section's own position in
// requestAnimationFrame, so a scroll burst costs one read a frame. `?p=` pins a frame for stills and
// shots, 0 to 1, and wins over the scroll. A disabled store (reduced motion) always reads 0.

export type Progress = {
  sample(): number;
  subscribe(fn: (p: number) => void): () => void;
};

type Store = Progress & { bind(section: HTMLElement | null, pin: HTMLElement | null): void; start(): () => void; enabled: boolean };

export function urlProgress(): number | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('p');
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp01(n) : null;
}

function createStore(): Store {
  const subs = new Set<(p: number) => void>();
  const override = urlProgress();
  let section: HTMLElement | null = null;
  let pin: HTMLElement | null = null;
  let last = -1;
  let raf = 0;

  const store: Store = {
    enabled: false,
    bind(s, p) {
      section = s;
      pin = p;
    },
    sample() {
      if (!store.enabled) return 0;
      if (override !== null) return override;
      if (!section || !pin) return 0;
      const range = section.offsetHeight - pin.offsetHeight;
      if (range <= 1) return 0;
      return clamp01(-section.getBoundingClientRect().top / range);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    start() {
      const tick = () => {
        raf = 0;
        const p = store.sample();
        if (Math.abs(p - last) < 1e-4) return;
        last = p;
        subs.forEach((f) => f(p));
      };
      const ask = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      last = -1;
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', ask);
      const ro = new ResizeObserver(ask);
      if (section) ro.observe(section);
      ask();
      return () => {
        window.removeEventListener('scroll', ask);
        window.removeEventListener('resize', ask);
        ro.disconnect();
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
    },
  };
  return store;
}

// The hero binds its section and its sticky stage. `enabled` is false for reduced motion.
export function useProgress(section: React.RefObject<HTMLElement | null>, pin: React.RefObject<HTMLElement | null>, enabled: boolean): Progress {
  const [store] = useState(createStore);
  useLayoutEffect(() => {
    store.enabled = enabled;
    store.bind(section.current, pin.current);
  });
  useEffect(() => {
    if (!enabled) return;
    return store.start();
  }, [store, enabled]);
  return store;
}

// p as React state, for the stills path, which has no frame loop. Steps of 0.002, so a scroll
// sets state a few hundred times across the whole pin at most.
export function useProgressValue(progress: Progress, enabled: boolean): number {
  const [p, setP] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (!enabled) {
      prev.current = 0;
      setP(0);
      return;
    }
    return progress.subscribe((v) => {
      const q = Math.round(v * 500) / 500;
      if (q !== prev.current) {
        prev.current = q;
        setP(q);
      }
    });
  }, [progress, enabled]);
  return p;
}
