/* The About page's entrances: the shared schedule and helpers, plus the
 * CHOOSE and primer bands. The other four bands have their own files and are
 * re-exported at the foot of this one.
 *
 * House language (src/lib/motion.ts): entrances rise a few pixels on
 * `expo.out` with tight staggers, and nothing overshoots, rotates or floats.
 * This page's accent is the soft-to-sharp resolve: type and cards arrive out
 * of blur rather than simply fading.
 *
 * Design decision: every band has the same shape. The eyebrow names the band,
 * then the one thing the band is about arrives alone and holds the frame for
 * the better part of a second, then everything else follows on a tight
 * stagger. Nothing arrives at the same moment as something else.
 *
 * NOTHING DELAYS CONTENT. The shared gate triggers at a -5% bottom margin
 * (see GATE in src/lib/motion.ts), cues are kept short, and the phone
 * schedule scales every cue by 0.42. There is no canvas on this page.
 *
 * No hover animation, no pointer listeners and no idle loops anywhere.
 *
 * No colour is tweened or read from getComputedStyle, so nothing can freeze a
 * palette at build time (src/lib/theme.ts explains the hazard). Blur, travel
 * and opacity read the same on either theme.
 */

import { EASE, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * The phone plays the same sequence, tighter (Pillars.motion.ts argues the
 * approach). CUE scales where a beat starts, which is dead time worth cutting.
 * STEP scales the gap inside a beat and is barely cut: squeezed much further,
 * a stagger stops reading as one thing followed by the rest.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/* Read per build, not at module scope: a module-scope matchMedia is answered
 * once, at parse time, so a rotation or resize would keep the old schedule. */
export function schedule() {
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  return {
    cue: (t: number) => (tight ? t * CUE : t),
    step: (t: number) => (tight ? t * STEP : t),
  };
}

/**
 * Rise out of blur: travel and blur on one tween, opacity on a much shorter
 * one starting at the same moment.
 *
 * An element at full opacity while still blurred paints a visible smudge of
 * itself before its turn (see also src/components/hero/entrance.ts). So the
 * element is invisible while softest and mostly sharp by the time it is fully
 * opaque.
 */
export function outOfBlur(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: { y?: number; x?: number; blur?: number; duration?: number; stagger?: number; fade?: number } = {},
) {
  const { y = 12, x = 0, blur = 8, duration = 0.9, stagger = 0, fade = 0.35 } = vars;
  tl.from(targets, {
    y,
    x,
    filter: `blur(${blur}px)`,
    duration,
    stagger,
    ease: EASE,
    clearProps: 'transform,filter',
  }, at);
  tl.from(targets, { opacity: 0, duration: fade, stagger, ease: 'none', clearProps: 'opacity' }, at);
}

/* ── 1. Hero ──────────────────────────────────────────────────────────────── */


/* ── 2. Choose an event ───────────────────────────────────────────────────── */

const CARDS_AT = 0.3;
const CARD_STEP = 0.16;
/** The parts inside a card, a beat behind the shell that holds them. */
const PARTS_IN = 0.22;
const PART_STEP = 0.07;

/** The shell arrives, then fills (screenshot, title, copy) on a tight
 *  stagger, so a card reads as being built rather than switching on whole. */
function fillCards(tl: Timeline, cards: HTMLElement[], at: number, cardStep: number, step: (t: number) => number, inner: string) {
  cards.forEach((card, i) => {
    const parts = Array.from(card.querySelectorAll<HTMLElement>(inner));
    if (!parts.length) return;
    rise(tl, parts, at + i * cardStep + step(PARTS_IN), {
      y: 8,
      duration: 0.55,
      stagger: step(PART_STEP),
      clearProps: 'transform,opacity',
    });
  });
}

/**
 * 0.00  The band names itself.
 * 0.30  The three cards, 0.16s apart: far enough that they read as three
 *       arrivals rather than one row sliding.
 * 0.52  Each card's contents, a beat behind its own shell.
 */
export function buildChoose({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const cards = q('.ab-card');
  const at = cue(CARDS_AT);
  const cardStep = step(CARD_STEP);

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, cards, at, { y: 22, blur: 9, duration: 0.95, stagger: cardStep, fade: 0.4 });
  fillCards(tl, cards, at, cardStep, step, '.ab-card__shot, .ab-card__title, .ab-card__body');
}

/* ── 3. About Phorcast ────────────────────────────────────────────────────── */


/* ── 4. Cast your conviction ──────────────────────────────────────────────── */


/* ── 5. How it works: price and profit ────────────────────────────────────── */


/* ── 6. Why is it better than bets or crypto/stocks? ──────────────────────── */

/**
 * 0.00  The band names itself.
 * 0.28  The two cards, 0.16s apart.
 * 0.50  Each card's heading and body, a beat behind its own shell.
 */
export function buildPrimer({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const cards = q('.ab-why__card');
  const at = cue(0.28);
  const cardStep = step(CARD_STEP);

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, cards, at, { y: 22, blur: 9, duration: 0.95, stagger: cardStep, fade: 0.4 });
  fillCards(tl, cards, at, cardStep, step, '.ab-why__title, .ab-why__body > *');
}

/* The four bands with their own files, re-exported so About.tsx imports
   every builder from one place. */
export { buildAboutHero } from './About.hero.motion';
export { buildBrand } from './About.brand.motion';
export { buildConviction } from './About.conv.motion';
export { buildCompare } from './About.cmp.motion';
