/* "Answers you can verify" — the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's accent is the soft-to-sharp resolve the hero, the pillars,
 * the steps and the built band already use, so the type, the mark and the rows
 * arrive out of blur rather than simply fading.
 *
 * The band is two columns: a rail on the left that names the section and stands
 * the 3D mark under it, and the seven questions down the right. So the rail
 * speaks first — label, heading, lede, mark — and the list follows it down.
 *
 * THE SEQUENCE (3.60s end to end; times below are measured from the end of the
 * held lead-in beat that every cue is offset by — see LEAD)
 *   0.00  The eyebrow — the label on the band, small and quiet, so the section
 *         is named before anything stands in it.
 *   0.18  THE HEADING, out of the deepest blur in the rail and travelling
 *         furthest of the type. The one object the section leads with; it is
 *         alone on screen for most of a second before anything follows.
 *   0.90  The lede, out of a shallower blur — it is set much smaller, and the
 *         heading's 10px would wash it out rather than soften it.
 *   1.25  THE MARK, as one object. See MARK below: nothing inside it is
 *         touched.
 *   1.85  The seven rows down the list, 0.13s apart, top to bottom. The gap is
 *         wide enough that seven rows read as seven arrivals rather than one
 *         column sliding. Lands at 3.60.
 *
 * Under 700px those cues are taken at 0.42 of the times above and the stagger
 * at 0.7, so the band lands in about 2.2s rather than 3.6 and the first
 * question is readable at 1.2s rather than 3.2. The mark is not on the page at
 * that width at all. Nothing about the order, the eases or the durations
 * changes; only the waiting between the beats does. See CUE and STEP.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the section simply present. There is no `fromTo`
 * here at all, delayed or otherwise — see the note on `immediateRender` in
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
 * The accordion. Row four is open on load and every row expands and collapses
 * on click, which React drives by adding `is-open` to the `<li>` and dropping
 * `hidden` from the answer. The entrance moves the `<li>` and nothing else:
 * only `transform`, `filter` and `opacity`, all of them cleared by name when
 * the tween ends. The answer panel's own box — its `display`, its height, its
 * padding — is never read and never written, so a row cannot be left half open
 * by a timeline that was interrupted, and a click during the entrance changes
 * a class on an element GSAP is only translating.
 *
 * The toggle's plus/minus and the row's background both animate on CSS
 * transitions of their own (`transform`, `opacity`, `background-color`). None
 * of those properties is tweened on those elements here; the row's transform
 * belongs to the `<li>`, the toggle's to the `<i>` inside it.
 *
 * `intoLines` is not used on the heading or the lede, which is the one place
 * this band departs from Steps and Built. Both of those elements carry literal
 * `<br>` tags, and `intoLines` splits on newlines in `textContent` — where a
 * `<br>` contributes nothing at all. Run against "Answers<br />you can verify"
 * it would rebuild the element as the single run "Answersyou can verify" and
 * the heading would lose its line break permanently. So the heading arrives as
 * one object, out of a deeper blur and over a longer travel than anything else
 * in the rail, which is what makes it the accent instead of the mask.
 *
 * No `will-change` anywhere: a standing compositor promotion costs text its
 * subpixel antialiasing permanently, and GSAP promotes for the length of a
 * tween by itself. No `clearProps: 'all'` either — that empties the style
 * attribute outright. Every clear here names its properties.
 *
 * No hover animation and nothing listens to the pointer.
 */
import { EASE, rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves.
 *
 * The section is revealed and the timeline starts in the same frame, and that
 * frame is an expensive one: the hold comes off a 354px WebGL host and seven
 * rows at once, none of which has been painted. Anything scheduled at zero
 * spends that frame travelling unseen. An eighth of a second of nothing costs
 * the sequence nothing and hands the first beat back whole.
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
 * THE PHONE PLAYS THE SAME SEQUENCE, TIGHTER.
 *
 * Not a second design: the same beats, in the same order, out of the same
 * blur, on the same eases and over the same durations. What changes is the
 * SCHEDULE, and it changes because the band is read differently. At 1600 the
 * rail and the seven questions stand side by side on one screen and the spread
 * is a composition the eye follows across a held frame. At 390 the rail is a
 * screen of its own and the questions are two more below it: the reader
 * arrives at the top of the band mid-scroll and keeps going, so the rows —
 * which ARE the section — were arriving between three and four seconds after
 * being scrolled to, which on a phone means arriving after being scrolled
 * past.
 *
 * Two numbers, because the two kinds of gap answer to different things. CUE
 * scales where a BEAT starts, which is the wait worth cutting because nothing
 * is happening during it. STEP scales the gap between things INSIDE one beat,
 * and is barely cut at all: 0.13s between rows becomes 0.091, still five and a
 * half frames, so seven questions still read as seven arrivals rather than one
 * column switching on. Durations are untouched, so the beats simply overlap
 * more — the lede begins while the heading is still resolving.
 *
 * The lead-in hold is a fixed cost rather than a cue — it buys back the
 * expensive first frame, which is no cheaper on a phone — so it is added after
 * the scaling rather than scaled with it.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * Already arrived once, on this very element, and the timeline ran to its end.
 *
 * The mark is added by the LAST item on the timeline, so a build that is
 * reverted part-way — StrictMode's first pass, always — never sets it and the
 * next build performs the entrance in full. One that completed does, and a
 * later rebuild on the same node adds no tweens: the hook reveals the section,
 * the empty timeline completes on the next tick, and the band is simply there,
 * already landed. Without this a hot update, or any remount with the section
 * still on screen, re-performs the whole arrival.
 *
 * Keyed on the element, so a genuinely new section node arrives properly.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Rise out of blur: the travel and the softening on one tween, the opacity on
 * its own much shorter one starting at the same moment. See the header — this
 * pairing is the whole reason the blur does not smear. Lifted from
 * Pillars.motion.ts so every band resolves the same way.
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

  // Asked here rather than read at module scope: a module-scope `matchMedia`
  // is answered once, when the bundle is parsed, and never again — so a
  // rotation or a resize would keep whichever schedule the page happened to
  // load under. `useSectionMotion` rebuilds this band on a theme switch and
  // React rebuilds it on a remount; both come back through this line.
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);

  /* 1 — the band names itself. */
  if (eyebrow.length) {
    rise(tl, eyebrow, LEAD, { y: 16, duration: 0.8, clearProps: 'transform,opacity' });
  }

  /* 2 — the heading. The largest single movement in the band and the thing the
     eye should land on; it holds the screen on its own until the lede. See the
     header for why this is one object rather than a mask reveal. */
  if (title.length) outOfBlur(tl, title, cue(TITLE_AT), { y: 26, blur: 10, duration: 1.15, fade: 0.4 });

  /* 3 — the lede, out of a shallower blur: three short lines at 20px, where the
     heading's 10px would wash the whole block out rather than soften it. */
  if (lede.length) outOfBlur(tl, lede, cue(LEDE_AT), { y: 16, blur: 6, duration: 0.9, fade: 0.34 });

  /* 4 — THE MARK, as one object and one object only.
     `.faq__mark` hosts a WebGL scene (HeroLogo). Compiling its shaders and
     building its geometry blocks the main thread, which is exactly why the
     module holds itself back until the host section says its motion is over —
     it reads `data-motion-done` and listens for `motion:done`, both of which
     `useSectionMotion` raises from this timeline's `onComplete`. So the box is
     what arrives here; the scene fades itself in afterwards, over a settled
     band, and nothing inside the host is ever a tween target. Deliberately no
     `motion:ready` from this file: the hero raises that early beat because its
     remaining beats are copy fading, whereas everything after this cue is a
     seven-row stagger that a shader compile would visibly chew through. The
     3.6s end of this timeline is well inside HeroLogo's own 6s cap.

     Skipped outright under 1180px, where `.faq__mark` is `display: none` and a
     tween on it would be 1.25s of the sequence spent on nothing. */
  if (mark && getComputedStyle(mark).display !== 'none') {
    outOfBlur(tl, mark, cue(MARK_AT), { y: 30, blur: 14, duration: 1.25, fade: 0.5 });
  }

  /* 5 — the seven rows, top to bottom. Each row is one whole question, so the
     whole `<li>` arrives as one thing and nothing inside it is staggered
     separately — which is also what keeps the open row's answer panel out of
     this entirely. See the header. */
  if (rows.length) {
    outOfBlur(tl, rows, cue(ROWS_AT), { y: 20, blur: 8, duration: 0.85, stagger: step(ROW_STEP), fade: 0.36 });
  }

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
