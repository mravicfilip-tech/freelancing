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
 * A module is attached *before* the section's entrance reveals the band (the
 * loader's observer is armed a quarter of a viewport earlier than the
 * entrance's; see Bento.tsx), so a module may safely park its illustration
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

/* Never read `--u` to get a number out of it: `getComputedStyle` returns the
   unresolved `calc(100cqw / 774)` rather than a length. Geometry comes from
   `getBoundingClientRect` (see `unitOf` below). */

/**
 * Is the band still held hidden, i.e. may this module park its illustration at a
 * start state?
 *
 * Normally yes: the loader attaches early and the modules are prefetched. But
 * on a cold cache the import is a real fetch, and the band can reveal itself
 * while it is in flight; hiding the artwork then would blank something already
 * seen. So this is checked at attach time, and a module that has missed its
 * window skips its load-in and goes straight to its loop.
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
 * only once the section has dropped `data-motion="pending"`, i.e. once it is
 * animating rather than waiting to be scrolled to. A plain timeout would be
 * wrong: a band not yet reached may sit pending for minutes, and the load-in
 * would play unseen.
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

/**
 * One design pixel of the box `el` belongs to, in real CSS pixels.
 *
 * `designWidth` is that box's width in the Figma frame. Measured, because `--u`
 * cannot be read as a length (see the note above).
 */
export const unitOf = (el: Element, designWidth: number) =>
  el.getBoundingClientRect().width / designWidth;

/**
 * `designPx` of travel, expressed as a percentage of the element's own box.
 *
 * `xPercent`/`yPercent` survive a resize: a percentage of the element's own
 * box scales with the card, so a tween built once stays correct without
 * rebuilding timelines mid-loop. A tween in pixels is right only at the width
 * it was built at.
 */
export function pct(el: Element, designPx: number, u: number, axis: 'x' | 'y' = 'y'): number {
  const r = el.getBoundingClientRect();
  const size = axis === 'x' ? r.width : r.height;
  return size > 0 ? ((designPx * u) / size) * 100 : 0;
}

/**
 * A pulse that leaves nothing behind: out on `out`, back on `back`, ending on
 * the value the tween started from, so the loop's resting frame is the design.
 *
 * `clear` names the properties CSS owns and hands them back once the pulse has
 * landed. Ending on the same value is not the same as no inline style: even an
 * identity `transform` promotes the element to its own compositing layer, and
 * inside a `backdrop-filter` chip Chrome then switches to greyscale text
 * antialiasing. Clearing also restores transforms the design carries (the pie
 * badge's `scale(0.7)`, the diamonds' `rotate(45deg)`) instead of leaving
 * GSAP's inline decomposition to outrank the stylesheet.
 */
export function pulse(
  tl: Timeline,
  target: gsap.TweenTarget,
  at: number,
  out: gsap.TweenVars,
  back: gsap.TweenVars,
  up = 0.38,
  down = 0.72,
  clear?: string,
) {
  tl.to(target, { ...out, duration: up, ease: 'sine.out' }, at)
    .to(target, { ...back, duration: down, ease: 'sine.inOut' }, at + up);
  if (clear) tl.set(target, { clearProps: clear }, at + up + down);
}
