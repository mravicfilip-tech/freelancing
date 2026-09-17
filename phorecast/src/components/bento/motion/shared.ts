/**
 * Plumbing the four card modules share.
 *
 * This file sits under the same `./motion/*.ts` glob the loader walks, so it is
 * fetched with its four siblings. That is harmless: the loader derives a card
 * class from each module's basename, finds no `.bcard--shared`, and moves on
 * before it ever looks for an exported `shared`.
 *
 * The contract every card module keeps
 * ------------------------------------
 * A module is attached *before* the section's entrance reveals the band — the
 * loader's observer is deliberately armed a quarter of a viewport earlier than
 * the entrance's (see Bento.tsx) — so a module may safely park its illustration
 * at a start state with `gsap.set`. The card is still `visibility: hidden` under
 * `[data-motion='pending']` at that point, so nothing can flash. The start state
 * is written with `set`, never `from`: a `from` tween would fix the end value at
 * whatever the element read as when the tween was built, which is exactly the
 * state a previous mount may have stranded it in.
 *
 * The module then hands its load-in to `onSectionReady`, which plays it once the
 * band's own entrance has landed. Card motion therefore never overlaps the
 * section's arrival: the card frame and its context artwork come in first, then
 * the illustration assembles itself on top.
 */
import type { Timeline } from '../../../lib/motion';

export const q1 = (root: Element, sel: string) => root.querySelector<HTMLElement>(sel);
export const qa = (root: Element, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

/* A note the card modules all depend on: never read `--u` to get a number out of
   it. It is written in container-query units, `getComputedStyle` hands back the
   unresolved `calc(100cqw / 774)` token stream rather than a length, and the
   card that declares it is itself the query container, so it could not resolve
   its own `cqw` in any case. Geometry comes off `getBoundingClientRect`, which
   is correct at every breakpoint and needs no knowledge of the unit. */

/**
 * Is the band still held hidden, i.e. may this module park its illustration at a
 * start state?
 *
 * Normally yes: the loader arms a quarter of a screen before the entrance does,
 * and the modules are warm, so the import resolves in the microtask checkpoint
 * after that callback and well before a paint. But a cold cache turns the import
 * into a real fetch, and the band can reveal itself while it is in flight. A
 * module that hid its artwork at that point would blank something a person has
 * already seen. So the question is asked at the moment of truth rather than
 * assumed, and a module that has missed its window simply skips its load-in and
 * goes straight to its loop -- less motion, never a flash.
 */
export function bandStaged(card: HTMLElement): boolean {
  const section = card.closest<HTMLElement>('.bento');
  return !!section && section.dataset.motion === 'pending' && !section.dataset.motionDone;
}

/**
 * Run `start` once the band's entrance has finished.
 *
 * Three ways in, in order of preference: the `motion:done` event the section
 * dispatches when its timeline completes; the `data-motion-done` flag it sets
 * instead when motion is reduced or the build threw; and, last, a timer armed
 * only once the section has dropped `data-motion="pending"` — i.e. once it is
 * demonstrably animating rather than waiting to be scrolled to. A plain timeout
 * would be wrong here: a band that has not been reached yet may legitimately sit
 * pending for minutes, and starting a load-in behind it would burn the whole
 * sequence unseen.
 */
export function onSectionReady(card: HTMLElement, start: () => void): () => void {
  const section = card.closest<HTMLElement>('.bento');
  if (!section) { start(); return () => {}; }

  let fired = false;
  let timer = 0;
  let observer: MutationObserver | undefined;

  const stop = () => {
    window.clearTimeout(timer);
    observer?.disconnect();
    section.removeEventListener('motion:done', go);
  };
  function go() {
    if (fired) return;
    fired = true;
    stop();
    start();
  }

  if (section.dataset.motionDone) { go(); return () => {}; }

  section.addEventListener('motion:done', go);
  const arm = () => { if (!timer) timer = window.setTimeout(go, 3000); };
  if (section.dataset.motion !== 'pending') arm();
  else {
    observer = new MutationObserver(() => {
      if (section.dataset.motion !== 'pending') { observer?.disconnect(); arm(); }
    });
    observer.observe(section, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return stop;
}

/**
 * Play `tl` while the card is on screen and pause it the moment it is not, so a
 * loop below the fold costs nothing. The margin is generous on purpose: a loop
 * that only wakes at the viewport edge is caught mid-beat on the way in.
 */
export function whileVisible(card: HTMLElement, tl: Timeline): () => void {
  const io = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) tl.play(); else tl.pause(); },
    { rootMargin: '120px' },
  );
  io.observe(card);
  return () => io.disconnect();
}

/** A pulse that leaves nothing behind: out on `up`, back on `down`, ending on
 *  the value the tween started from, so the loop's resting frame is the design. */
export function pulse(
  tl: Timeline,
  target: gsap.TweenTarget,
  at: number,
  out: gsap.TweenVars,
  back: gsap.TweenVars,
  up = 0.38,
  down = 0.72,
) {
  tl.to(target, { ...out, duration: up, ease: 'sine.out' }, at)
    .to(target, { ...back, duration: down, ease: 'sine.inOut' }, at + up);
}
