// Shared motion language for every section.
//
// The house style: entrances rise a few pixels on `expo.out`,
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
import { useThemeEpoch } from './theme';

export type Timeline = gsap.core.Timeline;

export const REDUCED =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lag smoothing stays ON. Off, tweens advance on wall-clock time: the main
// thread blocks while the WebGL mark initialises and fonts load, the timeline
// runs through that freeze unseen, and the first painted frame is already near
// the end. (250, 20) is a middle setting; very tight, and the sequence crawls
// through the block instead. The stall guard in `useSectionMotion` covers a
// sequence that truly stops.
gsap.ticker.lagSmoothing(250, 20);

/** The band's entrance ease, and the small rise every element makes as it appears. */
export const EASE = 'expo.out';
const RISE = { y: 10, opacity: 0, duration: 0.7, ease: EASE } as const;

export const one = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  root.querySelector<T>(sel);
export const all = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/**
 * Pop in from small. `vars` carries both the start offsets (scale, opacity and
 * any transform key) and the tween's own options; they are split here.
 *
 * Explicitly fromTo, never from. A `from` tween infers its end from whatever
 * the element reads as when the tween is created, and an element that already
 * carries an inline transform -- left by an earlier entrance, a rebuild, or a
 * timeline that was killed part-way -- reads as its own start value. The tween
 * is then built to animate 0.94 to 0.94: it runs, it reports complete, and the
 * element is stranded 6% small forever. Stating both ends cannot be poisoned
 * by prior state, and clearing the props at the end hands the settled element back to
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

/** Rise a few pixels into place: the default entrance for copy and cards. */
export function rise(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { ...RISE, ...vars }, at);
}

/** Count a number into an element. */
export function count(tl: Timeline, el: HTMLElement, from: number, to: number, at: number, duration: number, fmt: (n: number) => string) {
  const o = { v: from };
  tl.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
}

/**
 * Splits text into masked lines so each can rise out of its own mask. Returns
 * the inner spans, which are the things that move. Idempotent: calling it twice on the
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

/**
 * How far up the screen a section must have come before its entrance starts.
 *
 * A negative bottom margin, not a threshold: "has this been scrolled to" is
 * about how far the section has come up the screen, not what fraction of it
 * shows. A section taller than the viewport may never reach a high ratio, and
 * would hold an empty frame the whole way down.
 *
 * -5% (about 42px on a phone) is more than any seam or rounding error between
 * abutting sections, so a section just below the fold does not count, but
 * the entrance starts as the section enters rather than after a large part of
 * it has scrolled past. A larger margin (such as -25%) leaves the content
 * hidden behind its own entrance for seconds on a phone.
 *
 * Every section reads this default unless it passes its own rootMargin.
 */
const GATE = '0px 0px -5% 0px';

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
  { threshold = 0, rootMargin = GATE, idle, immediate = false }:
    { threshold?: number; rootMargin?: string; idle?: (el: HTMLElement) => () => void; immediate?: boolean } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);

  // A theme change has to rebuild every section, and this is the dependency
  // that makes it happen. Several motion modules read resting colours from
  // `getComputedStyle` at build time and hold them for the life of the loop,
  // so a section built in dark would otherwise settle to dark colours on a
  // light page, silently.
  //
  // The rebuild is the same revert, un-flag, rehide cycle StrictMode runs on
  // every development mount. Entrances replay on a theme switch. The epoch
  // changes only on an actual theme change (see theme.ts).
  const themeEpoch = useThemeEpoch();

  // Layout effect, not effect: `useEffect` runs after the browser paints, so the
  // section would paint once in its hidden pending state before any of this
  // ran: a visible blank frame. A layout effect reveals and starts before that
  // first paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // What the section was holding before this effect touched it, so teardown
    // can put it back. React runs mount, cleanup, mount; if cleanup revealed
    // unconditionally, an observer-gated section would lose its pending state
    // and show finished before it was scrolled to.
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

      // Build and play at once. The pending CSS already hides the section from
      // the first paint, so waiting for calm frames would only delay the
      // opening.
      if (!cancelled) {
        try {
          ctx = gsap.context(() => {
            tl = gsap.timeline({
              defaults: { ease: EASE },
              onComplete: () => {
                // Anything expensive that would have stolen frames from this
                // sequence can start now. The 3D mark listens for it.
                //
                // `done()`, not a bare dispatch: it also sets the
                // `motionDone` flag, which late listeners check first
                // (Familiar.loop.ts does).
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

    // A section that has already played once is being rebuilt (a theme
    // switch, in practice), so it starts at once. Routing it back through the
    // observer would leave everything off screen in its hidden pending state,
    // so switching theme at the footer would empty the page above. The flag
    // survives teardown for this check and is never set on a first mount,
    // including StrictMode's second one.
    const replay = el.dataset.motionDone === '1';

    if (immediate || replay) {
      start();
    } else {
      // A bottom margin and not a threshold, and a small one. Both halves of
      // that choice are argued where GATE is defined.
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

      // Rewind, and allow a rebuild. StrictMode runs mount, cleanup, mount
      // inside one layout pass, so reverting undoes the first build invisibly
      // and the second plays in full. Settling here and refusing to rebuild
      // would make the entrance finish instantly on load.
      ctx?.revert();
      tl = undefined;
      delete el.dataset.motionBuilt;
      // Back to how it was found. A section that never built stays hidden for
      // the next mount; one that did will reveal again when it rebuilds.
      rehide();
    };
  }, [build, threshold, rootMargin, idle, immediate, themeEpoch]);

  return ref;
}
