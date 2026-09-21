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

import { EASE, intoLines, rise } from '../../lib/motion';
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
function schedule() {
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
function outOfBlur(
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

/**
 * 0.00  The ground lights, from the bottom of its own field so the ember
 *       grows up out of the page rather than switching on whole.
 * 0.10  The nav, left to right. It is furniture: it arrives quickly and
 *       quietly and is finished before the headline starts.
 * 0.30  THE HEADLINE, rising out of its own mask and sharpening on the way.
 *       The one object the page leads with, and the largest single movement
 *       on it. It has the frame to itself for 0.65s.
 * 0.95  The description.
 * 1.15  Get Started, last, so the eye ends on the thing to press.
 */
export function buildAboutHero({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const glow = q('.hero__bg')[0];
  const title = q('.ab-hero__title')[0];

  if (glow) {
    tl.from(glow, {
      opacity: 0,
      scale: 1.05,
      duration: 1.4,
      ease: 'power2.out',
      transformOrigin: '50% 100%',
      clearProps: 'transform',
    }, 0);
  }

  const nav = q('.nav .logo, .nav__links > *, .nav__actions > *, .nav__burger');
  if (nav.length) {
    rise(tl, nav, cue(0.1), { y: 8, duration: 0.55, stagger: step(0.05), clearProps: 'transform,opacity' });
  }

  if (title) {
    // `intoLines` rewrites the element in place and is idempotent, so a
    // StrictMode remount reuses the spans that are already there. Safe here
    // because the headline is plain text; the statement in band 4 is NOT, and
    // is deliberately animated as one block instead.
    const lines = intoLines(title);
    tl.from(lines, {
      yPercent: 108,
      filter: 'blur(10px)',
      duration: 1.15,
      ease: 'power4.out',
      clearProps: 'filter',
    }, cue(0.3));
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, cue(0.3));
  }

  outOfBlur(tl, q('.ab-hero__lede'), cue(0.95), { y: 14, blur: 6, duration: 0.8, fade: 0.32 });
  rise(tl, q('.ab-hero__cta'), cue(1.15), { y: 12, duration: 0.7, clearProps: 'transform,opacity' });
}

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

/**
 * 0.00  The band names itself.
 * 0.24  The card, out of blur. One object, and a wide one.
 * 0.62  The mark — the brand's own glyph, alone, before a word of the copy.
 * 0.78  The two paragraphs.
 * 0.86  The product shot, sliding in from the edge it bleeds off. It is the
 *       one thing on the page that moves horizontally, and it moves the way
 *       the composition already points.
 */
export function buildBrand({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-brand__card'), cue(0.24), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });
  rise(tl, q('.ab-brand__mark'), cue(0.62), { y: 10, duration: 0.6, clearProps: 'transform,opacity' });
  rise(tl, q('.ab-brand__prose > *'), cue(0.78), {
    y: 10, duration: 0.6, stagger: step(0.1), clearProps: 'transform,opacity',
  });
  outOfBlur(tl, q('.ab-brand__visual'), cue(0.86), { y: 0, x: 44, blur: 6, duration: 1.1, fade: 0.45 });
}

/* ── 4. Cast your conviction ──────────────────────────────────────────────── */

/**
 * 0.00  The band names itself.
 * 0.24  THE STATEMENT, out of the deepest blur on the page and travelling
 *       furthest. It is the only thing in the band and it is the band.
 * 1.10  The goal line, quieter and shallower, after the statement has settled.
 *
 * The statement is animated AS ONE BLOCK and is never split into lines.
 * `intoLines` rebuilds an element from its `textContent`, which would throw
 * away the `<span class="ab-conv__rest">` that carries the second half of the
 * sentence in a dimmer ink — the type would animate correctly and come to rest
 * one flat colour. Whether the mask is worth that is not a close call.
 */
export function buildConviction({ q, tl }: SectionMotion) {
  const { cue } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-conv__statement'), cue(0.24), { y: 24, blur: 12, duration: 1.2, fade: 0.4 });
  outOfBlur(tl, q('.ab-conv__goal'), cue(1.1), { y: 12, blur: 5, duration: 0.75, fade: 0.3 });
}

/* ── 5. How it works: price and profit ────────────────────────────────────── */

/**
 * 0.00  The band names itself.
 * 0.24  The card, out of blur.
 * 0.62  The five column heads, left to right — the venues being compared are
 *       named before anything is said about them.
 * 0.95  The five rows, top to bottom, each row's criterion and its five
 *       verdicts arriving together. A row is one statement; splitting the
 *       verdicts out of it would make the reader watch a table fill in
 *       thirty pieces.
 */
export function buildCompare({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-cmp__card'), cue(0.24), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });

  const heads = q('.ab-cmp__brand');
  if (heads.length) {
    rise(tl, heads, cue(0.62), { y: 10, duration: 0.6, stagger: step(0.07), clearProps: 'transform,opacity' });
  }

  const rows = q('.ab-cmp__table tbody tr');
  if (rows.length) {
    rows.forEach((row, i) => {
      const cells = Array.from(row.querySelectorAll<HTMLElement>('.ab-cmp__crit, .ab-cmp__vote'));
      if (!cells.length) return;
      rise(tl, cells, cue(0.95) + i * step(0.09), {
        y: 8, duration: 0.5, stagger: step(0.02), clearProps: 'transform,opacity',
      });
    });
  }
}

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
