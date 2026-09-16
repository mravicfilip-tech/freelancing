// The hero's opening sequence, and the slow life it keeps afterwards.
//
// Two triggers only: the load-in that runs once on mount, and loops that run
// forever. Nothing here listens to the pointer.
//
// The order is deliberate. The light arrives first and the mark forms in it;
// both are given room to finish before a single word appears. Then the copy
// reads top to bottom at a pace you could speak it, and the ticker comes last
// because it is the least important thing on the screen.
//
// Every tween is a `from` that clears its own props, so the resting DOM is
// already the finished design — if this never runs, the hero still reads.

import { gsap } from 'gsap';

/** Beats, in seconds. Named so the sequence can be read without counting. */
const LIGHT = 0;
const HORIZON = 0.25;
const MARK = 0.35;
const COPY = 1.75; // the beat after the mark lands — this is what makes it feel directed
const EYEBROW = COPY;
const TITLE = COPY + 0.18;
const LEDE = COPY + 0.45;
const CTA = COPY + 0.7;
const FURNITURE = COPY + 0.9;

export function heroEntrance(hero: HTMLElement): () => void {
  const all = (sel: string) => Array.from(hero.querySelectorAll<HTMLElement>(sel));
  const active = (sel: string) => all(`.hero__slide.is-active ${sel}`);

  const glows = all('.hero__glow');
  const horizon = all('.hero__horizon');
  const mark = all('.hero__logo');
  const cards = all('.hero__foot > *');

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  // Context. The light is already part of the page; it settles rather than appears.
  if (glows.length) {
    tl.from(glows, {
      opacity: 0,
      scale: 0.94,
      duration: 1.4,
      stagger: { each: 0.12, from: 'center' },
      transformOrigin: '50% 50%',
      clearProps: 'transform,opacity',
    }, LIGHT);
  }
  if (horizon.length) {
    tl.from(horizon, { opacity: 0, yPercent: 6, duration: 1.3, clearProps: 'transform,opacity' }, HORIZON);
  }

  // The lead. HeroLogo fades its own canvas in; this gives it somewhere to arrive
  // from without fighting that transition.
  if (mark.length) {
    tl.from(mark, {
      scale: 0.93,
      duration: 1.5,
      ease: 'expo.out',
      transformOrigin: '50% 50%',
      clearProps: 'transform',
    }, MARK);
  }

  // Copy, once the light has stopped moving.
  const line = (sel: string, at: number, y: number, duration: number) => {
    const els = active(sel);
    if (els.length) tl.from(els, { opacity: 0, y, duration, clearProps: 'transform,opacity' }, at);
  };
  line('.eyebrow', EYEBROW, 14, 0.9);
  line('.hero__title', TITLE, 24, 1.2);
  line('.hero__lede', LEDE, 18, 1.0);
  line('.hero__cta', CTA, 14, 0.9);

  if (all('.hero__position').length) {
    tl.from(all('.hero__position'), { opacity: 0, y: 10, duration: 0.8, clearProps: 'transform,opacity' }, FURNITURE);
  }
  if (cards.length) {
    tl.from(cards, {
      opacity: 0,
      y: 20,
      duration: 0.95,
      stagger: 0.14,
      clearProps: 'transform,opacity',
    }, FURNITURE);
  }

  // ---- Loops. Started after the entrance so they never fight a `from`. -------
  const loops: gsap.core.Tween[] = [];

  tl.call(() => {
    // Each glow breathes on its own period, or the group pulses as one mass and
    // reads as a flicker rather than light.
    glows.forEach((g, i) => {
      loops.push(gsap.to(g, {
        scale: 1.035,
        duration: 9 + i * 1.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.8,
        transformOrigin: '50% 50%',
      }));
    });

    horizon.forEach((h) => {
      loops.push(gsap.to(h, { scaleX: 1.02, duration: 13, ease: 'sine.inOut', repeat: -1, yoyo: true }));
    });

    // The ticker drifts a couple of pixels. Enough that the page is never frozen,
    // little enough that a still frame is still the approved design.
    cards.forEach((c, i) => {
      loops.push(gsap.to(c, {
        y: i % 2 ? 3 : -3,
        duration: 10 + (i % 3) * 1.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.9,
      }));
    });

    // The live dot is the one thing allowed a short cycle: it means "live".
    active('.eyebrow__dot').forEach((d) => {
      loops.push(gsap.to(d, { opacity: 0.45, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true }));
    });
  });

  return () => {
    tl.kill();
    loops.forEach((t) => t.kill());
    gsap.set(hero.querySelectorAll('.hero__glow, .hero__horizon, .hero__foot > *, .eyebrow__dot'), {
      clearProps: 'transform,opacity',
    });
  };
}
