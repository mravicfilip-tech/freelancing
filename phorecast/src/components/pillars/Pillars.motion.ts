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
 * Under 700px the same five beats are cued at 0.42 of those times and the
 * staggers inside them at 0.7, so the band lands in 1.9s rather than 3.2 —
 * the composition and the durations are unchanged, only the waiting is. See
 * CUE and STEP below for why the two scale differently.
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
 *
 * THIS MODULE HAS NO COLOUR IN IT, AND THAT IS WHY IT NEEDED NOTHING FOR LIGHT
 * MODE. It tweens y, yPercent, filter: blur(), opacity and scale and nothing
 * else, so there is no resting colour read from getComputedStyle at build time
 * and therefore nothing that could freeze against the palette that happened to
 * be live when the section built (src/lib/theme.ts explains that hazard, and
 * `tok()` is the answer to it where it applies -- it does not apply here).
 *
 * Nor is there a beat that lifts something by making it BRIGHTER, which is the
 * move that has to invert on paper: the glow blooms from opacity 0 and the
 * type and cards resolve out of blur, and both of those read the same way on
 * either ground. Measured with scripts/amplitude.mjs --entrance, the band is
 * `visible` in both themes -- 47/65px of travel in dark, 69/94 in light, the
 * difference being only which frame the sampler caught.
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
 * THE PHONE PLAYS THE SAME SEQUENCE, TIGHTER.
 *
 * Not a second design: the same beats, in the same order, out of the same
 * blur, on the same eases and over the same durations. What changes is the
 * SCHEDULE -- when each beat is cued -- and it changes because the band is
 * read differently. At 1600 the whole section is on screen at once and the
 * three-second spread is a composition the eye follows across a held frame.
 * At 390 the band is four screens tall: the reader arrives at the top of it
 * mid-scroll and keeps going, so a beat cued at two seconds is a beat played
 * to an empty seat, and the rows that were the section's footnote are simply
 * missing when they are scrolled past.
 *
 * Two numbers, because the two kinds of gap answer to different things. CUE
 * scales where a BEAT starts -- the wait between the headline and the cards,
 * and between the cards and the rows -- and that is the wait worth cutting,
 * because nothing is happening during it. STEP scales the gap between things
 * INSIDE one beat, and it is barely cut at all: that gap is the "one object
 * comes out, the rest follow" the whole band is built on, and squeezed to a
 * frame and a half it stops being a stagger and becomes three cards switching
 * on together. 0.16s between cards becomes 0.112 -- still seven frames, still
 * read as three arrivals.
 *
 * Durations are untouched on purpose. A beat that starts sooner but still
 * takes 0.95s to arrive is the same movement; one that also runs at half the
 * length is a different, twitchier band. The beats overlap more as a result,
 * which is the point -- the cards begin while the headline is still resolving,
 * exactly as the hero's do.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

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

  // Asked here rather than read at module scope: a module-scope `matchMedia`
  // is answered once, when the bundle is parsed, and never again — so a
  // rotation or a resize would keep whichever schedule the page happened to
  // load under. `useSectionMotion` rebuilds this band on a theme switch and
  // React rebuilds it on a remount; both come back through this line.
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => (tight ? t * CUE : t);
  const step = (t: number) => (tight ? t * STEP : t);
  const cardsAt = cue(CARDS_AT);
  const cardStep = step(CARD_STEP);

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
  rise(tl, q('.eyebrow'), cue(0.18), { y: 14, duration: 0.8, clearProps: 'transform,opacity' });

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
    }, cue(0.34));
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, cue(0.34));
  }

  /* 4 — the three cards, one after another. The shell arrives out of blur;
     its contents follow a beat later on a tight stagger, so each card fills
     rather than switching on. */
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

  /* 5 — the pill rows, last. Quicker and shallower than the cards: they are the
     footnote to the three statements above them, not a fourth statement. */
  outOfBlur(tl, rows, cue(ROWS_AT), { y: 16, blur: 6, duration: 0.8, stagger: step(ROW_STEP), fade: 0.32 });
}
