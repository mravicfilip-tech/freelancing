// The hero's opening, its per-slide choreography, and the one beat it keeps.
//
// Written in the Remittix motion language (see src/lib/motion.ts): entrances
// rise a few pixels on expo.out, staggered tightly; nothing overshoots, rotates
// for effect, or floats while idle. The loop is one deterministic story beat
// that shows the product doing its job, then rests -- here, the market prices
// moving and the light crossing the headline.
//
// Two triggers only: the load-in, and that loop. Nothing listens to the pointer.

import { gsap } from 'gsap';
import { EASE, all, intoLines, one, pop, rise } from '../../lib/motion';

const SHEEN_EVERY = 9; // seconds between passes of the highlight
const PRICE_EVERY = 2600;

/** Runs the specular highlight across the glyphs of every headline line. */
function sweep(title: HTMLElement, at: number, tl: gsap.core.Timeline) {
  const gloss = all<HTMLElement>(title, '.line__shine');
  if (!gloss.length) return;

  const pos = { p: 135 };
  tl.set(gloss, { opacity: 1 }, at)
    .to(pos, {
      p: -35,
      duration: 0.95,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = `${pos.p}% 0`;
        gloss.forEach((g) => { g.style.backgroundPosition = v; });
      },
      onComplete: () => gsap.set(gloss, { opacity: 0 }),
    }, at);
}

/** Gives each headline line a duplicate layer clipped to its own glyphs. */
function addShine(title: HTMLElement) {
  all<HTMLElement>(title, '.line__in').forEach((inner) => {
    if (inner.querySelector('.line__shine')) return;
    const gloss = document.createElement('span');
    gloss.className = 'line__shine';
    gloss.setAttribute('aria-hidden', 'true');
    gloss.textContent = inner.textContent;
    inner.appendChild(gloss);
  });
}

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

  if (eyebrow) rise(tl, eyebrow, at, { y: 0, x: -8, duration: 0.6 });

  if (title) {
    const lines = intoLines(title);
    addShine(title);
    // The line rises out of its mask and resolves from soft as it arrives.
    tl.from(lines, { yPercent: 108, filter: 'blur(8px)', duration: 0.95, stagger: 0.1, ease: 'power4.out', clearProps: 'filter' }, at + 0.05);
    sweep(title, at + 0.45, tl);
  }

  // The illustration is the largest thing on screen; leaving it out of the
  // sequence made the copy look like it was arriving beside a static page.
  if (visual) {
    const kids = Array.from(visual.children) as HTMLElement[];
    const nested = Array.from(visual.firstElementChild?.children ?? []) as HTMLElement[];
    const parts = kids.length > 1 ? kids : nested;
    if (parts.length > 1) pop(tl, parts, at + 0.12, { scale: 0.92, y: 10, duration: 0.7, stagger: 0.06 });
    else rise(tl, visual, at + 0.12, { y: 14, duration: 0.85 });
  }

  if (lede) rise(tl, intoLines(lede), at + 0.3, { y: 0, yPercent: 105, duration: 0.65 });
  if (cta) pop(tl, cta, at + 0.42, { scale: 0.94, duration: 0.6 });
}

/** The load-in. Light first, everything else overlapping it. */
export function heroBuild(hero: HTMLElement, tl: gsap.core.Timeline): void {
  const glows = all(hero, '.hero__glow');
  const horizon = all(hero, '.hero__horizon');
  const mark = all(hero, '.hero__logo');
  const slide = one<HTMLElement>(hero, '.hero__slide.is-active');

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

  if (slide) slideIn(slide, tl, 0.16);

  rise(tl, all(hero, '.hero__position'), 0.6, { y: 8, duration: 0.5 });
  const cards = all(hero, '.hero__foot > *');
  if (cards.length) pop(tl, cards, 0.58, { scale: 0.94, y: 10, duration: 0.6, stagger: 0.06 });
}

/**
 * The loop. Both beats look the active slide up when they fire -- bound to the
 * elements present at mount they stop silently after the first slide change,
 * because the carousel replaces that DOM.
 */
export function heroIdle(hero: HTMLElement): () => void {
  const sheenTimer = window.setInterval(() => {
    const title = one<HTMLElement>(hero, '.hero__slide.is-active .hero__title');
    if (title) sweep(title, 0, gsap.timeline());
  }, SHEEN_EVERY * 1000);

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

  return () => {
    window.clearInterval(sheenTimer);
    window.clearInterval(priceTimer);
  };
}
