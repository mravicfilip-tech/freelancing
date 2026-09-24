/* FAQ band entrance.
 *
 * House language (src/lib/motion.ts): entrances rise a few pixels on
 * `expo.out`, staggered tightly, and resolve out of blur like the hero, the
 * pillars, the steps and the built band.
 *
 * The rail speaks first, then the list follows (seconds, after LEAD):
 *   0.00  eyebrow
 *   0.18  heading, out of the deepest blur and the longest travel in the rail
 *   0.90  lede, out of a shallower blur
 *   1.25  the 3D mark, as one object (see step 4)
 *   1.85  the seven rows, 0.13s apart; the timeline ends at about 3.6s
 *
 * Under 700px the cues are scaled by CUE and the stagger by STEP, so the band
 * lands in about 2.2s. Order, eases and durations are unchanged.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the section simply present.
 *
 * Opacity is always a separate, much shorter tween than the blur: an element
 * at full opacity while still blurred paints a visible smudge (see
 * src/components/hero/entrance.ts).
 *
 * THE ACCORDION IS NOT TOUCHED. The entrance moves each `<li>` and nothing
 * else (`transform`, `filter`, `opacity`, cleared by name at the end). The
 * answer panel's box is never read or written, so an interrupted timeline
 * cannot leave a row half open, and a click during the entrance only changes
 * a class. The toggle and row background use their own CSS transitions.
 *
 * `intoLines` is not used on the heading or lede: it splits on newlines in
 * `textContent`, where a `<br>` contributes nothing, so it would fuse
 * "Answers<br />before you start" into one line permanently.
 *
 * No `will-change` (a standing promotion costs text its subpixel
 * antialiasing) and no `clearProps: 'all'` (it empties the style attribute).
 * No hover animation.
 */
import { EASE, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves. The reveal frame is expensive
 * (a WebGL host and seven rows painting at once), so anything scheduled at
 * zero would travel unseen.
 */
const LEAD = 0.12;

/* The rail, top to bottom. */
const TITLE_AT = LEAD + 0.18;
const LEDE_AT = LEAD + 0.9;
const MARK_AT = LEAD + 1.25;

/* The list, after the rail has said what the band is. */
const ROWS_AT = LEAD + 1.85;
const ROW_STEP = 0.13;

/**
 * On a phone the same sequence plays on a tighter schedule. The rail fills a
 * screen of its own there, so at full timing the rows would arrive after the
 * reader had scrolled past them.
 *
 * CUE scales where each beat starts. STEP scales the gap inside a beat and is
 * cut much less, so the rows still read as separate arrivals. Durations are
 * unchanged, so beats simply overlap more. LEAD is a fixed cost and is added
 * after scaling, not scaled.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * Elements whose entrance has run to the end. Set by the LAST item on the
 * timeline, so a build reverted part-way (StrictMode's first pass) does not
 * count. A later rebuild on the same node adds no tweens, so a hot update or
 * remount does not replay the entrance. Keyed on the element, so a new
 * section node still animates.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Rise out of blur: travel and blur on one tween, opacity on a much shorter
 * one starting at the same moment (see the header). Same helper as
 * Pillars.motion.ts, so every band resolves the same way.
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

export function buildFaq({ el, q, tl }: SectionMotion) {
  // Landed already and still on screen: settle, do not re-perform. See LANDED.
  if (LANDED.has(el)) return;

  const eyebrow = q('.faq__rail .eyebrow');
  const title = q('.faq__title');
  const lede = q('.faq__lede');
  const mark = q('.faq__mark')[0];
  const rows = q('.faq__row');

  // Read per build, not at module scope, so a resize or rotation picks up the
  // right schedule on the next rebuild (theme switch or remount).
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);

  /* 1: the eyebrow. */
  if (eyebrow.length) {
    rise(tl, eyebrow, LEAD, { y: 16, duration: 0.8, clearProps: 'transform,opacity' });
  }

  /* 2: the heading, the largest movement in the band, as one object (see the
     header on `intoLines`). */
  if (title.length) outOfBlur(tl, title, cue(TITLE_AT), { y: 26, blur: 10, duration: 1.15, fade: 0.4 });

  /* 3: the lede, out of a shallower blur; the heading's 10px would wash out
     the smaller body text. */
  if (lede.length) outOfBlur(tl, lede, cue(LEDE_AT), { y: 16, blur: 6, duration: 0.9, fade: 0.34 });

  /* 4: the mark, as one object only. `.faq__mark` hosts a WebGL scene
     (HeroLogo) whose shader compile blocks the main thread, so HeroLogo waits
     for `data-motion-done` / `motion:done`, which `useSectionMotion` raises
     from this timeline's `onComplete`. Only the host box animates here;
     nothing inside it is a tween target. No `motion:ready` is raised: the
     compile would stutter the row stagger that follows. The ~3.6s timeline
     is well inside HeroLogo's 6s cap.

     Skipped under 1180px, where `.faq__mark` is `display: none`. */
  if (mark && getComputedStyle(mark).display !== 'none') {
    outOfBlur(tl, mark, cue(MARK_AT), { y: 30, blur: 14, duration: 1.25, fade: 0.5 });
  }

  /* 5: the rows, top to bottom. Each whole `<li>` arrives as one thing, which
     keeps the open answer panel out of the animation (see the header). */
  if (rows.length) {
    outOfBlur(tl, rows, cue(ROWS_AT), { y: 20, blur: 8, duration: 0.85, stagger: step(ROW_STEP), fade: 0.36 });
  }

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
