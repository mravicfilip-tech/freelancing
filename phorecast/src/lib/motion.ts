// Shared motion language, carried over from the Remittix build so the two sites
// move the same way.
//
// The house style, in its words: entrances rise a few pixels on `expo.out`,
// staggered tightly; nothing overshoots, rotates for effect, or floats while
// idle. Each loop is one deterministic story beat that shows the product doing
// its job, then rests.
//
// Sections render with `data-motion="pending"`, which hides the animated parts
// in CSS; the attribute is deleted in the same frame GSAP takes over, and
// immediately when motion is reduced or the build fails. Nothing is ever left
// hidden by a script that did not run.

import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

export type Timeline = gsap.core.Timeline;

export const REDUCED =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lag smoothing stays ON. Turning it off makes tweens advance on wall-clock
// time, which sounds right and is badly wrong here: the main thread blocks
// while the WebGL mark initialises and fonts load, the timeline runs through
// that freeze unseen, and the first frame the browser paints is already near
// the end — nothing, nothing, then everything at once. Skipped frames must not
// advance the sequence; the guard below handles the case where it truly stalls.
// A middle setting. Off, and a blocked main thread lets the sequence run to its
// end unseen; very tight, and it crawls through the block instead. Neither
// matters much now that nothing is built until the page can actually render
// frames — see waitForSmoothFrames below.
gsap.ticker.lagSmoothing(250, 20);

/** The band's entrance ease, and the small rise every element makes as it appears. */
export const EASE = 'expo.out';
export const RISE = { y: 10, opacity: 0, duration: 0.7, ease: EASE } as const;

export const one = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  root.querySelector<T>(sel);
export const all = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Draw stroked paths tip to tail. Elements with no length are skipped. */
export function draw(tl: Timeline, paths: SVGGeometryElement[], at: number, duration: number, stagger = 0) {
  paths
    .filter((p) => typeof p.getTotalLength === 'function' && p.getTotalLength() > 0)
    .forEach((p, i) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(p, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, at + i * stagger);
    });
}

/** Pop in from small. */
export function pop(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { scale: 0.6, opacity: 0, duration: 0.55, ease: 'back.out(1.8)', transformOrigin: '50% 50%', ...vars }, at);
}

/** Rise a few pixels into place — the default entrance for copy and cards. */
export function rise(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { ...RISE, ...vars }, at);
}

/** Count a number into an element. */
export function count(tl: Timeline, el: HTMLElement, from: number, to: number, at: number, duration: number, fmt: (n: number) => string) {
  const o = { v: from };
  tl.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
}

/** Reveal with a clip-path wipe from `from` (an `inset(...)` value) to fully visible. */
export function wipe(tl: Timeline, el: Element, at: number, duration: number, from: string) {
  tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power2.inOut' }, at);
}

/** A gentle bob, out of phase with its neighbours. */
export function bob(el: Element | null, amplitude = 3, seconds = 3, delay = 0) {
  if (el) gsap.to(el, { y: -amplitude, duration: seconds, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/** Roll a figure to a new value: the old slides up and out, the new one in. */
export function roll(el: HTMLElement, next: string) {
  gsap.timeline()
    .to(el, { yPercent: -45, opacity: 0, duration: 0.24, ease: 'power2.in' })
    .add(() => { el.textContent = next; })
    .fromTo(el, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
}

/**
 * Splits text into masked lines so each can rise out of its own mask. Returns
 * the inner spans — the things that move. Idempotent: calling it twice on the
 * same element returns the spans already there.
 */
export function intoLines(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split) return all(el, '.line__in');

  const text = el.textContent ?? '';
  const parts = text.includes('\n') ? text.split('\n') : [text];
  el.textContent = '';
  parts.forEach((part) => {
    const inner = document.createElement('span');
    inner.className = 'line__in';
    inner.textContent = part;
    const mask = document.createElement('span');
    mask.className = 'line';
    mask.appendChild(inner);
    el.appendChild(mask);
  });
  el.dataset.split = 'true';
  return all(el, '.line__in');
}

export interface SectionMotion {
  el: HTMLElement;
  q: (selector: string) => HTMLElement[];
  tl: Timeline;
}

/**
 * Builds a section's entrance the first time it is on screen, then hands the
 * finished timeline to `idle` for its loop. The whole thing lives in a gsap
 * context scoped to the element, so unmounting kills every tween it created.
 *
 * `build` runs against a paused timeline that is released on the next frame, so
 * a slow first paint cannot consume the sequence before anyone sees it.
 */
export function useSectionMotion<T extends HTMLElement = HTMLElement>(
  build: (m: SectionMotion) => void,
  { threshold = 0.15, idle, immediate = false }:
    { threshold?: number; idle?: (el: HTMLElement) => () => void; immediate?: boolean } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);

  // Layout effect, not effect: `useEffect` runs after the browser paints, so the
  // section would paint once in its hidden pending state before any of this ran
  // — a visible blank frame, and the whole "nothing happens, then everything"
  // complaint. A layout effect reveals and starts before that first paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => { delete el.dataset.motion; };

    if (REDUCED) { reveal(); return; }

    let ctx: gsap.Context | undefined;
    let stopIdle: (() => void) | undefined;
    let tl: Timeline | undefined;
    let guard = 0;
    let cancelled = false;

    const start = () => {
      if (el.dataset.motionBuilt) return;
      el.dataset.motionBuilt = '1';

      // Build and play at once. Waiting for calm frames was solving a problem
      // the pending CSS already solves — the section is hidden from the first
      // paint either way — so the wait only ever delayed the opening, and mount
      // is exactly when frames are janky. This makes a first load behave like a
      // slide change, which is the path that already looked right.
      if (!cancelled) {
        try {
          ctx = gsap.context(() => {
            tl = gsap.timeline({
              defaults: { ease: EASE },
              onComplete: () => { if (idle) stopIdle = idle(el); },
            });
            const timeline = tl;
            build({ el, q: (sel) => all(el, sel), tl: timeline });
            reveal();

            // If something stalls the sequence far past its own length, settle
            // it rather than leave the section half-built.
            guard = window.setTimeout(() => {
              if (timeline.progress() < 1) timeline.progress(1);
            }, (timeline.duration() + 2.5) * 1000);
          }, el);
        } catch (err) {
          console.warn('[motion] build failed', err);
          reveal();
        }
      }
    };

    // An above-the-fold section is on screen by definition; routing it through
    // an observer only adds the callback's latency, and the section is hidden
    // for every millisecond of it.
    let io: IntersectionObserver | undefined;
    if (immediate) {
      start();
    } else {
      io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io?.disconnect();
        start();
      }, { threshold, rootMargin: '0px 0px -10% 0px' });
      io.observe(el);
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      window.clearTimeout(guard);
      stopIdle?.();

      // Rewind, and allow a rebuild. React's StrictMode runs this mount →
      // cleanup → mount; because it is a layout effect the whole cycle happens
      // before a paint, so reverting undoes the first build invisibly and the
      // second one plays in full. Settling here instead — and refusing to
      // rebuild — is what made the entrance finish instantly on load while
      // slide changes, which take a different path, still animated.
      ctx?.revert();
      tl = undefined;
      delete el.dataset.motionBuilt;
      reveal();
    };
  }, [build, threshold, idle, immediate]);

  return ref;
}
