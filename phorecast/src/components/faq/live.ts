// Local motion primitives for the FAQ and the footer.
//
// These belong next to `useSectionMotion` in `src/lib/motion.ts`; they live here
// because that file is owned by another agent for the duration of this pass.
// The footer imports them from `../faq/live` — fold both into `lib/motion.ts`
// when the concurrent work lands.
//
// Everything here is for *continuous* motion — scroll-linked position, damped
// pointer response, idle drift — as opposed to the one-shot entrances that
// `useSectionMotion` builds. Three rules hold throughout:
//
//   * one rAF for the whole page (gsap's ticker), never a loop per effect;
//   * a loop that is off screen or in a hidden tab is removed from the ticker
//     rather than left spinning;
//   * with `prefers-reduced-motion: reduce` no loop is ever started, so the
//     sections sit on their designed, static state.

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * `gsap.quickSetter(el, 'scale')` does not work: `scale` is a shorthand that the
 * quick setter resolves to the literal property name `scaleX,scaleY`, which then
 * lands in `setAttribute` and throws on every frame. Drive the two axes instead.
 */
export function scaleSetter(el: HTMLElement): (v: number) => void {
  const sx = gsap.quickSetter(el, 'scaleX') as (v: number) => void;
  const sy = gsap.quickSetter(el, 'scaleY') as (v: number) => void;
  return (v) => {
    sx(v);
    sy(v);
  };
}

/**
 * Frame-rate independent damping: the same visual settle whether the frame took
 * 16ms or 33ms. `lambda` is roughly "how many e-folds per second".
 */
export const damp = (from: number, to: number, lambda: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-lambda * dt));

/**
 * How far an element has travelled across the viewport: 0 with its top edge on
 * the bottom of the viewport, 1 with its bottom edge on the top.
 */
export function viewProgress(r: DOMRect, vh: number): number {
  return clamp01((vh - r.top) / (r.height + vh));
}

export type LiveTick = (dt: number, time: number) => void;
export type LiveSetup = LiveTick | { tick: LiveTick; stop?: () => void } | void;

/**
 * Runs `make(el)`'s tick every frame, but only while `el` is near the viewport
 * and the tab is visible. Reads (`getBoundingClientRect`) happen at the top of a
 * tick and writes go through `gsap.quickSetter`, so a section costs one layout
 * flush per frame rather than one per property.
 */
export function useLive<T extends HTMLElement>(
  ref: RefObject<T | null>,
  make: (el: T) => LiveSetup,
  { margin = '25% 0px' }: { margin?: string } = {},
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;

    const made = make(el);
    if (!made) return;
    const tick = typeof made === 'function' ? made : made.tick;
    const stop = typeof made === 'function' ? undefined : made.stop;

    let onScreen = false;
    let running = false;
    let last = gsap.ticker.time;

    const frame = () => {
      const t = gsap.ticker.time;
      const dt = Math.min(0.05, t - last);
      last = t;
      tick(dt, t);
    };
    const sync = () => {
      const want = onScreen && document.visibilityState === 'visible';
      if (want === running) return;
      running = want;
      if (want) {
        last = gsap.ticker.time;
        gsap.ticker.add(frame);
      } else {
        gsap.ticker.remove(frame);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', sync);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      gsap.ticker.remove(frame);
      running = false;
      stop?.();
    };
  }, [ref, make, margin]);
}

/**
 * Pointer position over an element as -1..1 on each axis, plus whether the
 * pointer is inside. The values are raw; damp them in the caller's tick.
 */
export interface PointerState {
  x: number;
  y: number;
  /** Position within the element in CSS pixels, for a tracking highlight. */
  px: number;
  py: number;
  inside: number;
}

export function trackPointer(el: HTMLElement): { state: PointerState; stop: () => void } {
  const state: PointerState = { x: 0, y: 0, px: 0, py: 0, inside: 0 };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    state.px = e.clientX - r.left;
    state.py = e.clientY - r.top;
    state.x = (state.px / r.width) * 2 - 1;
    state.y = (state.py / r.height) * 2 - 1;
    state.inside = 1;
  };
  const onLeave = () => {
    state.inside = 0;
    state.x = 0;
    state.y = 0;
  };
  el.addEventListener('pointermove', onMove, { passive: true });
  el.addEventListener('pointerleave', onLeave, { passive: true });
  el.addEventListener('pointercancel', onLeave, { passive: true });
  return {
    state,
    stop: () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
    },
  };
}
