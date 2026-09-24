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
import { useThemeEpoch } from './theme';

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

/**
 * How far up the screen a section must have come before its entrance starts.
 *
 * This is one number and it decides the whole page's sense of lateness, so the
 * reasoning is written down twice -- once for the shape, once for the size.
 *
 * THE SHAPE. "Has this been scrolled to" is a question about how far the
 * section has come up the screen, not what fraction of it is showing. A ratio
 * cannot answer it: a section taller than the viewport can never reach a high
 * one, so a threshold set high enough to ignore the sliver of a section
 * showing under the one above is a threshold the section may never cross, and
 * the band sits holding an empty frame the whole way down. A negative bottom
 * margin asks the question directly -- the section must climb this far before
 * it counts -- and it behaves the same whatever either height is. That is why
 * this is a bottom margin and not a threshold, and it does not change.
 *
 * THE SIZE. It used to be -25%, and -25% is a quarter of the screen: 211px on
 * an 844px phone. The reader had scrolled 211px INTO the section before the
 * first tween was even created, and the section's own timeline -- one to four
 * seconds of it -- then started from zero. Measured on the fan at 390 wide:
 * the title was unreadable for 1240ms after the section's top crossed the
 * bottom of the screen and the tiles for 3516ms. The entrance was not
 * decorating the content, it was standing in front of it.
 *
 * -5% keeps the guarantee the shape exists for and drops the waiting. It is
 * about 42px on a phone, which is still more than any seam, hairline overlap
 * or rounding error between two abutting sections -- nothing peeks by 42px --
 * so a section genuinely just below the fold still does not count as arrived
 * at. But it means the entrance now starts as the section ENTERS rather than
 * after a quarter of it has gone by, which at a normal phone scroll rate hands
 * the sequence roughly 400ms of run-up. The first beat has landed by the time
 * the section is under the reader's eye; the later beats play while it is.
 *
 * Every section on the page reads this default. Sections that pass their own
 * rootMargin are unaffected.
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
  // that makes it happen.
  //
  // Ten call sites across six motion modules read their resting colours out of
  // `getComputedStyle` at BUILD time and hold them for the life of the loop —
  // the fan's pill fill, Built's cool-down inks, Familiar's card backgrounds,
  // three `borderTopColor` reads in bento, PanelFund's tile rims,
  // SlideAccount's price ink. Nothing re-reads them, and nothing can be made
  // to: a loop that has already captured its targets has no way back to the
  // stylesheet. So a section built in dark and then switched to light cools to
  // near-black on paper, forever, with no error and nothing visible in a
  // still.
  //
  // The rebuild path this takes is not a new one. `ctx.revert()`, `delete
  // motionBuilt`, `rehide()` is exactly the mount -> cleanup -> mount cycle
  // StrictMode runs on every single load, which makes it the best-tested code
  // in this file. Entrances replay on a switch, which is honest: the page the
  // user asked for is a different page.
  //
  // The epoch is bumped only on an actual change of theme (see theme.ts), so
  // this is inert unless someone touches the switcher.
  const themeEpoch = useThemeEpoch();

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

    // A section that has already played once is being rebuilt, not mounted —
    // a theme switch, in practice. Routing it back through the observer would
    // hand it to whether it happens to be on screen at the moment of the
    // click: everything above the fold would revert to its hidden pending
    // state and stay there until it was scrolled to a second time, so
    // switching theme at the footer would empty the page behind you. The flag
    // survives teardown precisely so this question can be asked, and it is
    // never set on a first mount — including StrictMode's second one, whose
    // cleanup runs before any entrance can complete.
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
  }, [build, threshold, idle, immediate, themeEpoch]);

  return ref;
}
