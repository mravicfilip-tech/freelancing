/* "Built for Better Trading" — the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's own accent is the soft-to-sharp resolve borrowed from the
 * hero's headline, so the type and the cards arrive out of blur rather than
 * simply fading.
 *
 * THE SEQUENCE (3.2s end to end)
 *   0.00  The glow blooms out of the top-right corner. Light first, so the
 *         band is lit before anything is standing in it.
 *   0.18  The eyebrow — the label on the section, small and quiet.
 *   0.34  THE HEADLINE, rising out of its own mask and resolving from soft.
 *         The one object the section leads with; everything else follows it.
 *   0.95  The three cards, 0.16s apart, each one's copy trailing its shell by
 *         a beat so a card reads as filling rather than appearing whole.
 *   2.05  The four pill rows, last and quickest, left to right.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a build
 * that never runs leaves the section simply present.
 *
 * The blur carries its own lesson, recorded in src/components/hero/entrance.ts:
 * an element parked at full opacity while still blurred paints a visible smudge
 * of itself before its turn. So opacity is always a second, much shorter tween
 * rather than riding the whole blur duration — the thing is invisible while it
 * is at its softest, and has resolved most of its blur by the time it is fully
 * opaque.
 *
 * No hover animation on the illustrations and nothing listens to the pointer;
 * the only hover here is the pill rows' CSS background, which is not ours.
 */
import { EASE, intoLines, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/** The cards' opening beat, and the gap between one card and the next. */
const CARDS_AT = 0.95;
const CARD_STEP = 0.16;
/** The rows, after the last card has begun to settle. */
const ROWS_AT = 2.05;
const ROW_STEP = 0.1;

/**
 * Rise out of blur: the travel and the softening on one tween, the opacity on
 * its own shorter one starting at the same moment. See the note above — this
 * pairing is the whole reason the blur does not smear.
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

  /* 1 — light. The glow lives above the top edge and spills down from the
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

  /* 2 — the band names itself. */
  rise(tl, q('.eyebrow'), 0.18, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });

  /* 3 — the headline. One sentence, so one mask: the whole block rises out of
     it as a unit and sharpens on the way, which is the largest single movement
     in the section and the thing the eye should land on first. */
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
    }, 0.34);
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, 0.34);
  }

  /* 4 — the three cards, one after another. The shell arrives out of blur;
     its contents follow a beat later on a tight stagger, so each card fills
     rather than switching on. */
  outOfBlur(tl, cards, CARDS_AT, { y: 22, blur: 9, duration: 0.95, stagger: CARD_STEP, fade: 0.4 });

  cards.forEach((card, i) => {
    const parts = Array.from(
      card.querySelectorAll<HTMLElement>('.pcard__eyebrow, .pcard__mark, .pcard__body > *'),
    );
    if (parts.length) {
      rise(tl, parts, CARDS_AT + i * CARD_STEP + 0.2, {
        y: 8,
        duration: 0.55,
        stagger: 0.06,
        clearProps: 'transform,opacity',
      });
    }
  });

  /* 5 — the pill rows, last. Quicker and shallower than the cards: they are the
     footnote to the three statements above them, not a fourth statement. */
  outOfBlur(tl, rows, ROWS_AT, { y: 16, blur: 6, duration: 0.8, stagger: ROW_STEP, fade: 0.32 });
}
