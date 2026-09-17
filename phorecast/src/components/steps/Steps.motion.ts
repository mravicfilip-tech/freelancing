/* "Open an account in 3 simple steps" — the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's accent is the soft-to-sharp resolve the hero and the
 * pillars already use, so the type and the cards arrive out of blur rather than
 * simply fading.
 *
 * THE SEQUENCE (2.75s end to end)
 *   0.00  The eyebrow — the label on the band, small and quiet, so the section
 *         is named before anything stands in it.
 *   0.18  THE HEADING, rising out of its own mask and resolving from soft. The
 *         one object the section leads with; everything else follows it.
 *   0.95  The three step cards down the left, 0.18s apart. Reading order, top
 *         to bottom, and the gap is wide enough that three cards read as three
 *         arrivals rather than one column sliding.
 *   1.50  THE PANEL, as a single object, while the third card is still
 *         settling. It is the largest thing in the band, so it travels
 *         furthest, out of the deepest blur, over the longest tween — it is
 *         what the three cards have been pointing at. Lands at 2.75.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a build
 * that never runs leaves the section simply present. There is no `fromTo` here
 * at all, delayed or otherwise — see the note on `immediateRender` in
 * src/lib/motion.ts for what that construct costs.
 *
 * The blur carries its own lesson, recorded in src/components/hero/entrance.ts:
 * an element parked at full opacity while still blurred paints a visible smudge
 * of itself before its turn. So opacity is always a second, much shorter tween
 * rather than riding the whole blur duration — the thing is invisible while it
 * is at its softest, and has resolved most of its blur by the time it is fully
 * opaque.
 *
 * WHAT THIS DELIBERATELY DOES NOT TOUCH
 *
 * The panel. Each of the three panels mounts with its own story loop that runs
 * inside the stepper's 6s dwell, and the slot it lives in carries a CSS
 * `steps-fade` on every slide change. Nothing inside `.steps__panel-slot` is
 * animated here, and the slot itself is not either: the entrance moves
 * `.steps__panels`, the grid that holds the slot, so the panel arrives as one
 * object and its own beat — and the slot's fade — are left completely alone. A
 * CSS animation with `animation-fill-mode: both` outranks inline style anyway,
 * so a GSAP tween on the slot would have been silently swallowed.
 *
 * The progress bar. `.step.is-active.is-playing::after` is a CSS animation on a
 * pseudo-element and cannot be reached from here; the card's own transform and
 * blur carry it, which is right, because it is part of the card. It is not
 * started until the entrance is over — see the `armed` state in Steps.tsx.
 *
 * No hover animation and nothing listens to the pointer; the only hover in this
 * band is the card's CSS background, which is not ours.
 */
import { EASE, intoLines, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/** The heading, a beat after the eyebrow that names the band. */
const TITLE_AT = 0.18;
/** The step cards, once the heading has stopped moving, and the gap between them. */
const CARDS_AT = 0.95;
const CARD_STEP = 0.18;
/** The panel, overlapping the last card so the column flows into it. */
const PANEL_AT = 1.5;

/**
 * Already arrived once, on this very element, and the timeline ran to its end.
 *
 * The mark is added by the LAST item on the timeline, so a build that is
 * reverted part-way — StrictMode's first pass, always — never sets it and the
 * next build performs the entrance in full. One that completed does, and a
 * later rebuild on the same node adds no tweens: the hook reveals the section,
 * the empty timeline completes on the next tick, and the band is simply there,
 * already landed, with the stepper carrying on over it. Without this the
 * section could re-perform its arrival under a live panel loop.
 *
 * Keyed on the element, so a genuinely new section node arrives properly.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Rise out of blur: the travel and the softening on one tween, the opacity on
 * its own much shorter one starting at the same moment. See the note above —
 * this pairing is the whole reason the blur does not smear. Lifted from
 * Pillars.motion.ts so the two bands resolve the same way.
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

export function buildSteps({ el, q, tl }: SectionMotion) {
  // Landed already and still on screen: settle, do not re-perform. See LANDED.
  if (LANDED.has(el)) return;

  const title = q('.steps__title')[0];
  const cards = q('.step');
  const panels = q('.steps__panels')[0];

  /* 1 — the band names itself. */
  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });

  /* 2 — the heading. One sentence, so one mask: the whole line rises out of it
     as a unit and sharpens on the way. It is the first real movement in the
     band and the thing the eye should land on. */
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
    }, TITLE_AT);
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, TITLE_AT);
  }

  /* 3 — the three cards, top to bottom. Each is a whole statement, so the whole
     card arrives as one thing; nothing inside them is staggered separately.
     The active card's orange rail and its progress bar are pseudo-elements and
     ride the card's own transform. */
  outOfBlur(tl, cards, CARDS_AT, { y: 24, blur: 9, duration: 0.95, stagger: CARD_STEP, fade: 0.4 });

  /* 4 — the panel, last and largest, as a single object. `expo.out` is 99%
     travelled at 70% of its duration, so it is effectively standing still well
     before the tween formally ends and the story loop inside it is never
     playing against a moving frame. */
  if (panels) {
    outOfBlur(tl, panels, PANEL_AT, { y: 34, blur: 14, duration: 1.25, fade: 0.5 });
  }

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
