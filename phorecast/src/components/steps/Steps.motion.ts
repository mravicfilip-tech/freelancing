/* Steps band entrance.
 *
 * House language (src/lib/motion.ts): entrances rise a few pixels on
 * `expo.out`, staggered tightly, and resolve out of blur like the hero and
 * the pillars.
 *
 * Sequence (seconds, after LEAD):
 *   0.00  eyebrow
 *   0.18  heading, rising out of its own line mask and sharpening
 *   0.95  the three step cards, 0.18s apart, top to bottom
 *   1.50  the panel, as one object: the largest travel, deepest blur and
 *         longest tween. The timeline ends at about 2.9s.
 *
 * Under 1080px the grid stacks with the panel above the list, so the last two
 * beats swap (see LEAD_AT). Under 700px the band is a tab row over a
 * swipeable track, so those beats become two objects: the tabs, then the
 * track (see PHONE). At that width cues are also scaled by CUE and staggers by
 * STEP; order, eases and durations are unchanged.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the section simply present.
 *
 * Opacity is always a separate, much shorter tween than the blur: an element
 * at full opacity while still blurred paints a visible smudge (see
 * src/components/hero/entrance.ts).
 *
 * WHAT THIS DELIBERATELY DOES NOT TOUCH
 *
 * The panel's contents. Each panel runs its own story loop inside the
 * stepper's 6s dwell, and `.steps__panel-slot` plays a CSS `steps-fade` on
 * every change. Only `.steps__panels` (the grid holding the slot) is tweened.
 * A CSS animation with `animation-fill-mode: both` outranks inline style, so a
 * tween on the slot itself would be silently ignored.
 *
 * The progress bar (`.step.is-active.is-playing::after`) is a pseudo-element
 * and rides the card's transform. It does not start until the entrance ends;
 * see the `armed` state in Steps.tsx.
 *
 * No hover animation; the card's hover is plain CSS.
 */
import { EASE, intoLines, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves. The reveal frame is expensive
 * (the large panel paints for the first time), so anything scheduled at zero
 * would be partly through its motion before the first visible frame.
 */
const LEAD = 0.12;

/** The heading, a beat after the eyebrow that names the band. */
const TITLE_AT = LEAD + 0.18;
/**
 * Cue times for the cards and the panel. Whichever the layout puts first goes
 * first: under 1080px the panel sits ABOVE the list, so the order swaps to
 * keep the band filling top down.
 */
const LEAD_AT = LEAD + 0.95;
const FOLLOW_AT = LEAD + 1.5;
const CARD_STEP = 0.18;
/** Where the stack puts the panel first. Matches `.steps__panels { order: 1 }`. */
const STACKED = '(max-width: 1080px)';
/**
 * Where the band becomes a tab switcher and a slider. Must match PHONE in
 * Steps.tsx and the `max-width: 700px` block in Steps.css: below it there are
 * no step cards to stagger, so the tab row and the track take the two cues.
 */
const PHONE = '(max-width: 700px)';

/**
 * On a phone the same sequence plays on a tighter schedule, because the reader
 * usually arrives mid-scroll and the track is the only content.
 *
 * CUE scales where each beat starts. STEP scales the gaps inside a beat and is
 * cut much less, so a stagger still reads as one. Durations are unchanged.
 *
 * The stepper arms its 6s timer on `motion:done` (the `armed` state in
 * Steps.tsx), so a shorter entrance just starts the first dwell sooner.
 */
const CUE = 0.42;
const STEP = 0.7;

/**
 * Elements whose entrance has run to the end. Set by the LAST item on the
 * timeline, so a build reverted part-way (StrictMode's first pass) does not
 * count. A later rebuild on the same node adds no tweens, so the entrance is
 * never replayed under a live panel loop. Keyed on the element, so a new
 * section node still animates.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Rise out of blur: travel and blur on one tween, opacity on a much shorter
 * one starting at the same moment (see the header). Same helper as
 * Pillars.motion.ts, so the bands resolve the same way.
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
  const phone = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const stacked = typeof matchMedia !== 'undefined' && matchMedia(STACKED).matches;
  // LEAD is a fixed cost, so it is added AFTER scaling rather than scaled.
  const cue = (t: number) => LEAD + (phone ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (phone ? t * STEP : t);
  const cardsAt = cue(stacked ? FOLLOW_AT : LEAD_AT);
  const panelAt = cue(stacked ? LEAD_AT : FOLLOW_AT);

  /* 1: the eyebrow. */
  rise(tl, q('.eyebrow'), LEAD, { y: 16, duration: 0.8, clearProps: 'transform,opacity' });

  /* 2: the heading, rising out of its line mask and sharpening. */
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
    }, cue(TITLE_AT));
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, cue(TITLE_AT));
  }

  /* 3p: the phone. The tab row, then the track as ONE object: two of its
     three slides are off screen, so staggering them would only delay the
     settle. */
  if (phone) {
    const tabs = q('.steps__tabs')[0];
    const track = q('.steps__track')[0];
    if (tabs) outOfBlur(tl, tabs, cue(LEAD_AT), { y: 16, blur: 7, duration: 0.85, fade: 0.35 });
    if (track) outOfBlur(tl, track, cue(FOLLOW_AT), { y: 30, blur: 12, duration: 1.2, fade: 0.5 });
    tl.call(() => { LANDED.add(el); });
    return;
  }

  /* 3: the three cards, top to bottom, each as one object. The active card's
     rail and progress bar are pseudo-elements and ride its transform. */
  outOfBlur(tl, cards, cardsAt, { y: 24, blur: 9, duration: 0.95, stagger: step(CARD_STEP), fade: 0.4 });

  /* 4: the panel, as one object. `expo.out` has nearly finished travelling
     well before the tween ends, so the story loop inside never plays against
     a moving frame. */
  if (panels) {
    outOfBlur(tl, panels, panelAt, { y: 34, blur: 14, duration: 1.25, fade: 0.5 });
  }

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
