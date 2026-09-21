/* The About page's six entrances.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots, rotates for
 * effect or floats while idle. The page's own accent is the soft-to-sharp
 * resolve the hero, the pillars, the steps, the built band and the FAQ already
 * use, so type and cards arrive OUT OF BLUR rather than simply fading.
 *
 * THE SHAPE OF EVERY BAND HERE IS THE SAME, because the brief for it is one
 * sentence: first one object comes out, the rest follow. So each band names
 * itself with its eyebrow, then the one thing it is about arrives alone and
 * has the frame to itself for the better part of a second, and only then does
 * everything else come after it on a tight stagger. Nothing on this page is
 * ever two things arriving at once.
 *
 * NOTHING DELAYS CONTENT. Two things guarantee that and both were paid for:
 * the shared gate is a -5% bottom margin rather than -25% (see GATE in
 * src/lib/motion.ts for the measurement that forced it), and the longest cue
 * in any band below is 1.15s, with the phone schedule taking all of them at
 * 0.42. There is no canvas on this page -- the hero's WebGL mark is the
 * landing page's and stays there -- so nothing here can repeat the
 * ReadPixels stall that held the main thread for a second on load.
 *
 * NO HOVER ANIMATION ANYWHERE AND NOTHING LISTENS TO THE POINTER. The product
 * shots and the table icons are load-in only; there is no loop on this page at
 * all, because nothing on it is a thing doing its job over time.
 *
 * THIS MODULE HAS NO COLOUR IN IT, which is why it needed nothing for light
 * mode. It tweens y, x, opacity, scale and filter: blur() and nothing else, so
 * there is no resting colour read out of getComputedStyle at build time to
 * freeze against whichever palette happened to be live (src/lib/theme.ts
 * explains that hazard). Nor is there a beat that lifts something by making it
 * BRIGHTER -- the move that has to invert on paper. Everything here resolves
 * out of blur, which reads the same on either ground.
 */

import { EASE, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * THE PHONE PLAYS THE SAME SEQUENCE, TIGHTER — the argument is Pillars.motion's
 * and is not repeated here. CUE scales where a BEAT starts, which is the wait
 * worth cutting because nothing is happening during it. STEP scales the gap
 * between things INSIDE a beat, and is barely cut at all: that gap is the "one
 * object comes out, the rest follow" the whole page is built on, and squeezed
 * to a frame and a half it stops being a stagger.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/* Asked per build rather than read at module scope: a module-scope matchMedia
 * is answered once, when the bundle is parsed, so a rotation or a resize would
 * keep whichever schedule the page happened to load under. */
export function schedule() {
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  return {
    cue: (t: number) => (tight ? t * CUE : t),
    step: (t: number) => (tight ? t * STEP : t),
  };
}

/**
 * Rise out of blur: the travel and the softening on one tween, the opacity on
 * its own much shorter one starting at the same moment.
 *
 * The pairing is not cosmetic. An element parked at full opacity while still
 * blurred paints a visible smudge of itself before its turn — recorded in
 * src/components/hero/entrance.ts and re-learned in three bands since. Opacity
 * therefore never rides the whole blur duration: the thing is invisible while
 * it is at its softest and has resolved most of its blur by the time it is
 * fully opaque.
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

/** The shell arrives, then fills: screenshot, title, copy, on a tight stagger,
 *  so a card reads as being built rather than as switching on whole. */
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
 * 0.30  The three cards, 0.16s apart — far enough that three cards read as
 *       three arrivals rather than one row sliding.
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

/* The four bands that live in their own files now. Re-exported here so that
   About.tsx keeps importing every builder from one place. */
export { buildAboutHero } from './About.hero.motion';
export { buildBrand } from './About.brand.motion';
export { buildConviction } from './About.conv.motion';
export { buildCompare } from './About.cmp.motion';
