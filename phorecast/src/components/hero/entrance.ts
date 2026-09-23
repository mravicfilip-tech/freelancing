// The hero's opening and its per-slide choreography.
//
// Written in the Remittix motion language (see src/lib/motion.ts): entrances
// rise a few pixels on expo.out, staggered tightly; nothing overshoots, rotates
// for effect, or floats while idle.
//
// The hero keeps no idle loop of its own. Its one beat was the market prices
// moving and flashing on the snapshot cards under the pager, and those cards
// are gone; the slides' own loops (slides/*.motion.ts) are the story now.
// Nothing listens to the pointer.

import { EASE, all, intoLines, one, pop, rise } from '../../lib/motion';

/**
 * Builds one slide's copy and illustration. Used by the load-in and again on
 * every slide change, so the treatment is seen four times rather than once.
 */
export function slideIn(slide: HTMLElement, tl: gsap.core.Timeline, at: number): void {
  const eyebrow = one(slide, '.eyebrow');
  const title = one<HTMLElement>(slide, '.hero__title');
  const lede = one<HTMLElement>(slide, '.hero__lede');
  const cta = one(slide, '.hero__cta');
  const visual = one(slide, '.hero__visual');

  if (eyebrow) rise(tl, eyebrow, at, { y: 0, x: -10, duration: 0.55 });

  // The line rises out of its mask and resolves from soft as it arrives. The
  // blur is cleared afterwards so the settled type is sharp and CSS owns it
  // again.
  //
  // The opacity is a second, much shorter tween rather than part of the first.
  // A blur bleeds past its mask: parked 84px below the clip at full opacity,
  // 12px of blur leaked a faint grey smudge of the headline into the hero
  // before anything had arrived. Starting at zero stops the leak, and ramping
  // back in 0.3s -- while the line is still deep in the mask and still soft --
  // means the reveal itself looks exactly as it did.
  if (title) {
    const lines = intoLines(title);
    tl.from(lines, { yPercent: 112, filter: 'blur(12px)', duration: 0.8, stagger: 0.13, ease: 'power4.out', clearProps: 'filter' }, at + 0.08)
      .from(lines, { opacity: 0, duration: 0.3, stagger: 0.13, ease: 'none' }, at + 0.08);
  }

  // The illustration is the largest thing on screen; leaving it out of the
  // sequence made the copy look like it was arriving beside a static page.
  if (visual) {
    const kids = Array.from(visual.children) as HTMLElement[];
    const nested = Array.from(visual.firstElementChild?.children ?? []) as HTMLElement[];
    const parts = kids.length > 1 ? kids : nested;
    if (parts.length > 1) pop(tl, parts, at + 0.22, { scale: 0.92, y: 12, duration: 0.7, stagger: 0.08, ease: EASE });
    // Explicitly fromTo, and never `rise`, which is a `from`. `.hero__visual`
    // carries its own CSS `transition: transform 800ms` toward `transform:
    // none` on `.is-active`, and a `from` tween reads its END value off the
    // element when the tween is built -- which is mid-transition, so GSAP
    // recorded whatever the transition happened to be passing through as the
    // place to finish. The illustration then stayed there: measured settling at
    // top 245.0 with `matrix(0.985, ..., 16.31)` against 224.4 and `none` under
    // reduced motion, on every slide, and landing on a different sub-pixel
    // every load (16.2487 / 16.3103 / 16.347 across three runs) so the
    // hairlines in the artwork rasterised differently run to run. Stating both
    // ends cannot be poisoned by a transform in flight, and clearing the props
    // hands the settled element back to CSS. Same fault the `pop()` docstring
    // in lib/motion.ts records against the hero's Get Started button.
    else tl.fromTo(visual,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: EASE, clearProps: 'transform,opacity' },
      at + 0.22);
  }

  // Less blur on the lede: it is set much smaller, so the same 12px would wash
  // a whole line out rather than soften its edges.
  if (lede) {
    rise(tl, intoLines(lede), at + 0.5, { y: 0, yPercent: 108, filter: 'blur(7px)', duration: 0.62, clearProps: 'filter' });
  }
  if (cta) pop(tl, cta, at + 0.72, { scale: 0.94, duration: 0.55, ease: EASE });
}

/** The load-in. The nav drops in, light ignites, everything else overlaps it. */
export function heroBuild(hero: HTMLElement, tl: gsap.core.Timeline): void {
  // Document order is already left to right here, which is what the stagger wants.
  const navParts = all(hero, '.nav .logo, .nav__links > *, .nav__actions > *, .nav__burger');
  const glows = all(hero, '.hero__glow');
  const horizon = all(hero, '.hero__horizon');
  const mark = all(hero, '.hero__logo');
  const slide = one<HTMLElement>(hero, '.hero__slide.is-active');

  // The nav assembles rather than arriving. Dropping the whole bar and then
  // dropping its contents again was two movements on the same pixels: the
  // logo fell twice, the fades multiplied, and the result read as a flop
  // rather than a sequence. The bar itself now never moves. Its pieces come
  // in left to right on one clean stagger -- logo, then each link, then the
  // buttons -- so the eye is led across the top of the page once.
  //
  // fromTo, never from, for the third time in this file: `.btn` carries
  // `transition: ... transform 160ms ease` in global.css so its `:active`
  // press can ease, and a `from` tween reads its end value off the element
  // when it first renders. Setting the start here handed that transition a
  // target, so by the time the staggered button tweens took their reading the
  // element had already transitioned to -14 -- and GSAP built them to animate
  // -14 to -14. They ran, reported complete, and left both nav buttons parked
  // 14px above the logo, the links and the theme toggle, which carry no
  // transform transition and so landed correctly. Same fault the pop()
  // docstring in lib/motion.ts records against the hero's Get Started button
  // and the .hero__visual comment above records against the illustration.
  // Stating both ends cannot be poisoned by a transition in flight, and
  // clearing the props hands the settled bar back to CSS -- which is also what
  // gives the buttons their :active press back, an inline identity transform
  // having outranked it.
  if (navParts.length) {
    tl.fromTo(navParts,
      { y: -14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.055,
        ease: EASE,
        clearProps: 'transform,opacity',
      }, 0.1);
  }

  // Light ignites small and bright and blooms outward, rather than fading up.
  if (glows.length) {
    tl.from(glows, { opacity: 0, scale: 0.84, duration: 1.0, stagger: { each: 0.05, from: 'center' }, transformOrigin: '50% 50%', ease: EASE }, 0);
  }
  if (horizon.length) {
    tl.from(horizon, { opacity: 0, scaleY: 0.35, transformOrigin: '50% 100%', duration: 0.9, ease: EASE }, 0.06);
  }
  if (mark.length) {
    tl.from(mark, { scale: 0.94, duration: 1.0, transformOrigin: '50% 50%', ease: EASE }, 0.08);
  }

  if (slide) slideIn(slide, tl, 0.2);

  // The point past which a stutter no longer costs anything. The headline's
  // mask reveal is the one beat that must not drop frames -- it is the largest
  // moving thing on the page and half-formed type reads as a fault. Once it has
  // landed, the rest is copy and the pager fading, and something expensive can
  // start compiling under them. The 3D mark waits for this rather than for the
  // whole sequence, which had it arriving seconds after everything else.
  // slideIn runs from 0.2; its lines start at +0.08, stagger 0.13 and run 0.8,
  // so the last one lands at 1.21. This sits just past that.
  tl.call(() => hero.dispatchEvent(new CustomEvent('motion:ready', { bubbles: true })), undefined, 1.3);

  rise(tl, all(hero, '.hero__position'), 0.95, { y: 8, duration: 0.55 });
}
