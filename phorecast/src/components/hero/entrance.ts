// The hero's opening, its per-slide choreography, and the one beat it keeps.
//
// Written in the Remittix motion language (see src/lib/motion.ts): entrances
// rise a few pixels on expo.out, staggered tightly; nothing overshoots, rotates
// for effect, or floats while idle. The loop is one deterministic story beat
// that shows the product doing its job, then rests -- here, the market prices
// moving and flashing.
//
// Two triggers only: the load-in, and that loop. Nothing listens to the pointer.

import { gsap } from 'gsap';
import { EASE, all, intoLines, one, pop, rise } from '../../lib/motion';

const PRICE_EVERY = 2600;

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

  if (eyebrow) rise(tl, eyebrow, at, { y: 0, x: -10, duration: 0.75 });

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
    tl.from(lines, { yPercent: 112, filter: 'blur(12px)', duration: 1.15, stagger: 0.22, ease: 'power4.out', clearProps: 'filter' }, at + 0.14)
      .from(lines, { opacity: 0, duration: 0.3, stagger: 0.22, ease: 'none' }, at + 0.14);
  }

  // The illustration is the largest thing on screen; leaving it out of the
  // sequence made the copy look like it was arriving beside a static page.
  if (visual) {
    const kids = Array.from(visual.children) as HTMLElement[];
    const nested = Array.from(visual.firstElementChild?.children ?? []) as HTMLElement[];
    const parts = kids.length > 1 ? kids : nested;
    if (parts.length > 1) pop(tl, parts, at + 0.3, { scale: 0.92, y: 12, duration: 0.85, stagger: 0.1 });
    else rise(tl, visual, at + 0.3, { y: 16, duration: 1.0 });
  }

  // Less blur on the lede: it is set much smaller, so the same 12px would wash
  // a whole line out rather than soften its edges.
  if (lede) {
    rise(tl, intoLines(lede), at + 0.72, { y: 0, yPercent: 108, filter: 'blur(7px)', duration: 0.85, clearProps: 'filter' });
  }
  if (cta) pop(tl, cta, at + 0.98, { scale: 0.94, duration: 0.7 });
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
  if (navParts.length) {
    tl.from(navParts, {
      y: -14,
      opacity: 0,
      duration: 0.85,
      stagger: 0.075,
      ease: EASE,
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

  if (slide) slideIn(slide, tl, 0.3);

  rise(tl, all(hero, '.hero__position'), 1.3, { y: 8, duration: 0.6 });

  // The market cards deal in one at a time, left to right. They used to pop on
  // a back.out overshoot, which is the one thing the house style says not to
  // do: the scale bounce made four cards look like they were springing rather
  // than being dealt. Each one now wipes up out of its own edge -- the same
  // masked reveal the headline uses, so the section speaks one language -- and
  // rises the last few pixels on the band's own ease. clearProps hands the
  // transform back to CSS afterwards, otherwise the inline matrix GSAP leaves
  // behind outranks the hover lift.
  const cards = all(hero, '.hero__foot > *');
  if (cards.length) {
    tl.from(cards, {
      clipPath: 'inset(100% 0% 0% 0%)',
      y: 22,
      opacity: 0,
      duration: 0.9,
      stagger: 0.14,
      ease: EASE,
      clearProps: 'transform,opacity,clipPath',
    }, 1.25);
  }
}

/**
 * The loop. It looks the active slide up when it fires -- bound to the elements
 * present at mount it would stop silently after the first slide change, because
 * the carousel replaces that DOM.
 */
export function heroIdle(hero: HTMLElement): () => void {
  // The market cards were frozen, which is the wrong look for a trading product.
  const priceTimer = window.setInterval(() => {
    const live = all<HTMLElement>(hero, '.hero__foot > *');
    if (!live.length) return;
    const priceEl = one<HTMLElement>(live[Math.floor(Math.random() * live.length)], '.ticker__price');
    if (!priceEl) return;

    const raw = priceEl.textContent ?? '';
    const value = Number(raw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(value) || value === 0) return;

    const next = value * (1 + (Math.random() - 0.5) * 0.0016);
    const decimals = (raw.split('.')[1] ?? '').length || 2;
    priceEl.textContent = `$${next.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    gsap.fromTo(priceEl, { color: next > value ? '#4ade80' : '#f87171' }, { color: '', duration: 1.1, ease: 'power2.out', clearProps: 'color' });
  }, PRICE_EVERY);

  return () => window.clearInterval(priceTimer);
}
