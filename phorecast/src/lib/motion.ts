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

/**
 * Pop in from small. `vars` carries both the start offsets (scale, opacity and
 * any transform key) and the tween's own options; they are split here.
 *
 * Explicitly fromTo, never from. A `from` tween infers its end from whatever
 * the element reads as when the tween is created, and an element that already
 * carries an inline transform -- left by an earlier entrance, a rebuild, or a
 * timeline that was killed part-way -- reads as its own start value. The tween
 * is then built to animate 0.94 to 0.94: it runs, it reports complete, and the
 * element is stranded 6% small forever. That is exactly what had happened to
 * the hero's Get Started button. Stating both ends cannot be poisoned by prior
 * state, and clearing the props at the end hands the settled element back to
 * CSS so the next run starts from a clean slate.
 */
const START_KEYS = ['scale', 'opacity', 'x', 'y', 'xPercent', 'yPercent', 'rotation', 'rotate'] as const;

export function pop(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  const from: gsap.TweenVars = { scale: 0.6, opacity: 0, transformOrigin: '50% 50%' };
  const to: gsap.TweenVars = { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.8)', clearProps: 'transform,opacity' };

  for (const [k, v] of Object.entries(vars)) {
    if ((START_KEYS as readonly string[]).includes(k)) {
      from[k] = v;
      // Whatever the caller offsets from, the element ends at its natural value.
      if (k !== 'scale' && k !== 'opacity') to[k] = 0;
    } else if (k === 'transformOrigin') {
      from[k] = v;
    } else {
      to[k] = v;
    }
  }
  tl.fromTo(targets, from, to, at);
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
  // `immediateRender: false` because this is a fromTo, and a fromTo writes its
  // START value the moment the tween is BUILT rather than when the playhead
  // reaches it. Called at a non-zero `at`, the element would therefore sit
  // clipped from the first painted frame and only un-clip when its turn came --
  // invisible for the whole run-up while every "does it animate" check passes.
  // Clearing the property at the end hands the settled element back to CSS.
  tl.fromTo(
    el,
    { clipPath: from },
    { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
    at,
  );
}

/** A gentle bob, out of phase with its neighbours. */
export function bob(el: Element | null, amplitude = 3, seconds = 3, delay = 0) {
  if (el) gsap.to(el, { y: -amplitude, duration: seconds, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/**
 * Roll a figure to a new value: the old slides up and out, the new one in.
 *
 * `immediateRender: false` is load-bearing. A `fromTo` writes its START values
 * the moment the tween is BUILT, not when the playhead reaches it -- and this
 * one is built at the same instant as the departure tween that is supposed to
 * run first. Without the flag the outgoing figure is parked 45% down at opacity
 * 0 before it has moved at all, so the departure plays on something already
 * invisible and only the second half of the roll is ever seen.
 */
export function roll(el: HTMLElement, next: string) {
  gsap.timeline()
    .to(el, { yPercent: -45, opacity: 0, duration: 0.24, ease: 'power2.in' })
    .add(() => { el.textContent = next; })
    .fromTo(el,
      { yPercent: 45, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out', immediateRender: false });
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
  { threshold = 0, rootMargin = '0px 0px -25% 0px', idle, immediate = false }:
    { threshold?: number; rootMargin?: string; idle?: (el: HTMLElement) => () => void; immediate?: boolean } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);

  // Layout effect, not effect: `useEffect` runs after the browser paints, so the
  // section would paint once in its hidden pending state before any of this ran
  // — a visible blank frame, and the whole "nothing happens, then everything"
  // complaint. A layout effect reveals and starts before that first paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // What the section was holding before this effect touched it, so teardown
    // can put it back. Cleanup used to reveal unconditionally, and React runs
    // mount, cleanup, mount: the cleanup stripped the pending attribute and the
    // second mount never got it back, so an observer-gated section sat visible
    // and finished from the first paint while still waiting to be scrolled to.
    const held = el.dataset.motion;
    const reveal = () => { delete el.dataset.motion; };
    const rehide = () => { if (held !== undefined) el.dataset.motion = held; };

    // The flag matters as much as the event: a listener that attaches after the
    // entrance has already finished would otherwise wait for one that will
    // never fire again.
    const done = () => {
      el.dataset.motionDone = '1';
      el.dispatchEvent(new CustomEvent('motion:done', { bubbles: true }));
    };

    if (REDUCED) { reveal(); done(); return; }

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
              onComplete: () => {
                // Anything expensive that would have stolen frames from this
                // sequence can start now. The 3D mark listens for it.
                //
                // `done()`, not a bare dispatch. This is the ordinary success
                // path, and it used to fire the event without setting the flag
                // -- so `dataset.motionDone` was written only when motion was
                // reduced or the build threw, i.e. never on a normal entrance.
                // That defeats the whole point recorded where `done` is
                // defined: a consumer that attaches after the entrance has
                // finished asks the flag precisely because the event it missed
                // will not fire again. Familiar.loop.ts reads that flag first
                // and was silently falling through to its polling fallback on
                // every load.
                done();
                if (idle) stopIdle = idle(el);
              },
            });
            const timeline = tl;
            build({ el, q: (sel) => all(el, sel), tl: timeline });
            reveal();

            // If the sequence stalls, settle it rather than leave the section
            // half-built. A fixed deadline cannot tell "stuck" from "slow":
            // lag smoothing means a blocked main thread makes an honest
            // sequence take longer in wall time than its own duration, and
            // snapping that one cuts the entrance off for everyone on modest
            // hardware. So sample twice a second past the deadline and only
            // force the end once progress has actually stopped moving.
            let seen = -1;
            const watch = () => {
              const now = timeline.progress();
              if (now >= 1) return;
              if (now === seen) { timeline.progress(1); return; }
              seen = now;
              guard = window.setTimeout(watch, 500);
            };
            guard = window.setTimeout(watch, (timeline.duration() + 1.5) * 1000);
          }, el);
        } catch (err) {
          console.warn('[motion] build failed', err);
          reveal();
          done();
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
      // "Has this been scrolled to" is a question about how far the section has
      // come up the screen, not what fraction of it is showing. A ratio cannot
      // answer it: a section taller than the viewport can never reach a high
      // one, so a threshold set high enough to ignore the sliver under the hero
      // is a threshold the section may never cross, and the band sits holding
      // an empty frame the whole way down. The negative bottom margin asks the
      // question directly -- the section must climb a quarter of the screen
      // before it counts -- and it behaves the same whatever either height is.
      io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < threshold) return;
        io?.disconnect();
        start();
      }, { threshold, rootMargin });
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
      // Back to how it was found. A section that never built stays hidden for
      // the next mount; one that did will reveal again when it rebuilds.
      rehide();
    };
  }, [build, threshold, idle, immediate]);

  return ref;
}
