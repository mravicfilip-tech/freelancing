// The hero's opening and its per-slide choreography.
//
// Follows the shared motion language in src/lib/motion.ts: entrances rise a few
// pixels on expo.out, staggered tightly; nothing overshoots, rotates for
// effect, or floats while idle.
//
// The hero keeps no idle loop of its own; the slides' loops
// (slides/*.motion.ts) carry the idle motion. Nothing listens to the pointer.

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
  const terms = one(slide, '.hero__terms');
  const visual = one(slide, '.hero__visual');

  if (eyebrow) rise(tl, eyebrow, at, { y: 0, x: -10, duration: 0.55 });

  // The line rises out of its mask and resolves from soft as it arrives. The
  // blur is cleared afterwards so the settled type is sharp and CSS owns it
  // again.
  //
  // The opacity is a second, much shorter tween rather than part of the first.
  // A blur bleeds past its mask: parked below the clip at full opacity, the
  // blurred line leaks a faint grey smudge of the headline into the hero before
  // anything has arrived. Starting at zero stops the leak, and ramping in over
  // 0.3s (while the line is still deep in the mask and still soft) leaves the
  // reveal itself unchanged.
  if (title) {
    const lines = intoLines(title);
    tl.from(lines, { yPercent: 112, filter: 'blur(12px)', duration: 0.8, stagger: 0.13, ease: 'power4.out', clearProps: 'filter' }, at + 0.08)
      .from(lines, { opacity: 0, duration: 0.3, stagger: 0.13, ease: 'none' }, at + 0.08);
  }

  // The illustration is the largest thing on screen, so it joins the sequence;
  // without it the copy looks like it is arriving beside a static page.
  if (visual) {
    const kids = Array.from(visual.children) as HTMLElement[];
    const nested = Array.from(visual.firstElementChild?.children ?? []) as HTMLElement[];
    const parts = kids.length > 1 ? kids : nested;
    if (parts.length > 1) pop(tl, parts, at + 0.22, { scale: 0.92, y: 12, duration: 0.7, stagger: 0.08, ease: EASE });
    // Explicitly fromTo, never `rise` (which is a `from`). `.hero__visual`
    // carries a CSS `transition: transform 800ms` toward `transform: none` on
    // `.is-active`, and a `from` tween reads its end value off the element when
    // it is built, which is mid-transition. The illustration then settles
    // wherever the transition happened to be, slightly off and on a different
    // sub-pixel each load, so its hairlines rasterise inconsistently. Stating
    // both ends cannot be poisoned by a transform in flight, and clearing the
    // props hands the settled element back to CSS. See also the `pop()`
    // docstring in lib/motion.ts.
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
  // Slide 3's small print follows its button, a beat behind, the way the
  // lede follows the title: it belongs to the button and arrives after it.
  if (terms) rise(tl, terms, at + 0.82, { y: 6, duration: 0.5 });
}

/** The load-in. The nav drops in, light ignites, everything else overlaps it. */
export function heroBuild(hero: HTMLElement, tl: gsap.core.Timeline): void {
  // Document order is already left to right here, which is what the stagger wants.
  const navParts = all(hero, '.nav .logo, .nav__links > *, .nav__actions > *, .nav__burger');
  const glows = all(hero, '.hero__glow');
  const horizon = all(hero, '.hero__horizon');
  const mark = all(hero, '.hero__logo');
  const slide = one<HTMLElement>(hero, '.hero__slide.is-active');

  // The nav assembles rather than arriving. The bar itself never moves (moving
  // both the bar and its contents makes the logo fall twice and reads as a
  // flop). Its pieces come in left to right on one stagger, logo, then each
  // link, then the buttons, so the eye is led across the top of the page once.
  //
  // fromTo, never from, as with `.hero__visual` above: `.btn` carries
  // `transition: ... transform 160ms ease` in global.css for its `:active`
  // press. With a `from` tween, the staggered buttons read their end value
  // after the transition had already moved them to -14, animate -14 to -14,
  // and stay parked 14px above the rest of the nav. Stating both ends avoids
  // that, and clearing the props hands the bar back to CSS, which also
  // restores the buttons' :active press (an inline transform would outrank it).
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
  // mask reveal is the one beat that must not drop frames: it is the largest
  // moving thing on the page and half-formed type reads as a fault. Once it has
  // landed, the rest is copy and the pager fading, and something expensive can
  // start compiling under them. The 3D mark waits for this event rather than
  // for the whole sequence, which would delay it by seconds.
  // slideIn runs from 0.2; its lines start at +0.08, stagger 0.13 and run 0.8,
  // so the second line of a two-line title lands at 1.21. This sits just past
  // that.
  tl.call(() => hero.dispatchEvent(new CustomEvent('motion:ready', { bubbles: true })), undefined, 1.3);

  rise(tl, all(hero, '.hero__position'), 0.95, { y: 8, duration: 0.55 });
}
