/* "Built for better prediction markets": the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates. The
 * band's accent is the hero headline's soft-to-sharp resolve, so the type and
 * the cards arrive out of blur rather than simply fading.
 *
 * THE SEQUENCE (3.2s end to end)
 *   0.00  The glow blooms out of the top-right corner, so the band is lit
 *         before anything stands in it.
 *   0.18  The eyebrow.
 *   0.34  The headline, rising out of its own mask and resolving from soft.
 *   0.95  The three cards, 0.16s apart, each card's contents trailing its
 *         shell by a beat so the card reads as filling rather than appearing.
 *   2.05  The four pill rows, last and quickest, left to right.
 *
 * Under 700px the beats are cued at 0.42 of those times and the staggers
 * inside them at 0.7, so the band lands in 1.9s; see CUE and STEP.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a
 * build that never runs leaves the section simply present.
 *
 * Opacity is always a separate, much shorter tween than the blur (see
 * src/components/hero/entrance.ts): an element at full opacity while still
 * blurred paints a visible smudge of itself before its turn.
 *
 * No colour is tweened here (only y, yPercent, blur, opacity and scale), so
 * nothing needs `tok()` and the build is theme-independent. No pointer
 * listeners; the pill rows' hover is plain CSS.
 */
import { EASE, intoLines, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/** The cards' opening beat, and the gap between one card and the next. */
const CARDS_AT = 0.95;
const CARD_STEP = 0.16;
/** The parts inside a card, a beat behind the shell that holds them. */
const PARTS_IN = 0.2;
const PART_STEP = 0.06;
/** The rows, after the last card has begun to settle. */
const ROWS_AT = 2.05;
const ROW_STEP = 0.1;

/**
 * The phone plays the same sequence, tighter. At 390px the band is four
 * screens tall and is read mid-scroll, so a beat cued at two seconds plays to
 * an empty screen.
 *
 * CUE scales where a beat starts (the waits between headline, cards and
 * rows), which is the idle time worth cutting. STEP scales the gaps inside a
 * beat and is barely cut: squeezed further, the card stagger stops reading as
 * three arrivals. Durations are unchanged, so beats overlap more rather than
 * running faster.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * Rise out of blur: travel and softening on one tween, opacity on its own
 * shorter one starting at the same moment, so the blur does not smear.
 */
function outOfBlur(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: { y?: number; blur?: number; duration?: number; stagger?: number; fade?: number },
) {
  const { y = 12, blur = 8, duration = 0.9, stagger = 0, fade = 0.35 } = vars;
  tl.from(targets, {
    y,
    filter: `blur(${blur}px)`,
    duration,
    stagger,
    ease: EASE,
    clearProps: 'transform,filter',
  }, at);
  tl.from(targets, { opacity: 0, duration: fade, stagger, ease: 'none', clearProps: 'opacity' }, at);
}

export function buildPillars({ q, tl }: SectionMotion) {
  const glow = q('.pillars__glow')[0];
  const title = q('.pillars__title')[0];
  const cards = q('.pcard');
  const rows = q('.prow');

  // Asked per build rather than at module scope, so a rebuild (theme switch,
  // remount) picks up the current viewport instead of the one at load.
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => (tight ? t * CUE : t);
  const step = (t: number) => (tight ? t * STEP : t);
  const cardsAt = cue(CARDS_AT);
  const cardStep = step(CARD_STEP);

  /* 1. Light. The glow lives above the top edge and spills down from the
     right, so it blooms from that corner rather than from its own middle. */
  if (glow) {
    tl.from(glow, {
      opacity: 0,
      scale: 1.06,
      duration: 1.3,
      ease: 'power2.out',
      transformOrigin: '75% 0%',
      clearProps: 'transform',
    }, 0);
  }

  /* 2. The eyebrow. */
  rise(tl, q('.eyebrow'), cue(0.18), { y: 14, duration: 0.8, clearProps: 'transform,opacity' });

  /* 3. The headline. One sentence, so one mask: the block rises out of it as
     a unit and sharpens on the way. */
  if (title) {
    // `intoLines` rewrites the element in place and is idempotent, so a
    // StrictMode remount reuses the spans that are already there.
    const lines = intoLines(title);
    tl.from(lines, {
      yPercent: 108,
      filter: 'blur(10px)',
      duration: 1.15,
      ease: 'power4.out',
      clearProps: 'filter',
    }, cue(0.34));
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, cue(0.34));
  }

  /* 4. The three cards. The shell arrives out of blur; its contents follow a
     beat later on a tight stagger. */
  outOfBlur(tl, cards, cardsAt, { y: 22, blur: 9, duration: 0.95, stagger: cardStep, fade: 0.4 });

  cards.forEach((card, i) => {
    const parts = Array.from(
      card.querySelectorAll<HTMLElement>('.pcard__eyebrow, .pcard__mark, .pcard__body > *'),
    );
    if (parts.length) {
      rise(tl, parts, cardsAt + i * cardStep + step(PARTS_IN), {
        y: 8,
        duration: 0.55,
        stagger: step(PART_STEP),
        clearProps: 'transform,opacity',
      });
    }
  });

  /* 5. The pill rows, last. Quicker and shallower than the cards: they are a
     footnote to the cards, not a fourth statement. */
  outOfBlur(tl, rows, cue(ROWS_AT), { y: 16, blur: 6, duration: 0.8, stagger: step(ROW_STEP), fade: 0.32 });
}
