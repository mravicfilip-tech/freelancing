/* The footer's load-in, rebuilt for the new markup.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's accent is the soft-to-sharp resolve every other band on
 * the page uses, so the type arrives out of blur rather than simply fading.
 *
 * Its own section entrance, not a continuation of the FAQ's. The two bands are
 * scrolled to at different moments and each has its own `useSectionMotion`, so
 * the footer opens when the footer is reached.
 *
 * THE SHAPE: ONE THING, THEN THE REST. The design opens with a rule and a
 * logo and then fills three columns, and the sequence says exactly that. The
 * logo is alone on screen for a third of a second; after it, everything is a
 * stagger and nothing gets a solo again.
 *
 * THE SEQUENCE (2.83s end to end; times below are measured from the end of the
 * held lead-in beat that every cue is offset by — see LEAD)
 *   0.00  The top hairline draws out from the left, the way a rule is read.
 *         It is the design's first element and it is the cheapest thing in the
 *         band to paint, which is why it leads.
 *   0.22  THE LOGO. The one object the footer leads with, alone for a beat.
 *   0.55  The description under it, out of a shallower blur.
 *   1.00  The three link columns, left to right, 0.16s apart — and each column
 *         fills top down, its heading then its rows on a tight 0.05s stagger,
 *         so a column reads as filling rather than switching on. The four
 *         social icons are the `<li>` of the third column's list and arrive
 *         as part of it, left to right on the same step; they are not a
 *         separate beat, because in this design they are not a separate
 *         object.
 *   1.90  The bottom hairline draws out, and the two ends of the bottom bar
 *         resolve under it. Lands at 2.83.
 *
 * Under 700px those cues are taken at 0.42 of the times above and the staggers
 * inside them at 0.7, so the band lands in about 1.9s rather than 2.83 and the
 * link columns — which are what a footer is for — are readable at about 0.6s
 * rather than 1.5. Nothing about the order, the eases or the durations
 * changes; only the waiting between the beats does. See CUE and STEP.
 *
 * WHAT WENT WITH THE OLD MARKUP. The glow bloom at 0.00 (there is no glow any
 * more), the four social buttons' own beat at 2.05 (they are a row inside the
 * Social column now), and the wordmark's long rise at 2.65 that used to
 * close the band. Nothing below queries a selector that no longer exists —
 * `.footer__glow`, `.footer__socials li` as a top-level beat, `.footer__meta >
 * p, .footer__legal-links li`, `.footer__wordmark span` are all gone rather
 * than left tweening nothing. The band is shorter than it was and so is this.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the footer simply present. There is no `fromTo`
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
 * The link hovers. Every footer link wraps its label in `Roll`, whose two
 * `.roll__in` spans slide against each other on a CSS transition driven by the
 * selectors in global.css. Nothing here targets `.roll__in`, or the `<a>`
 * around it: the columns' tween moves the `<li>`, which is the `Roll`'s
 * grandparent and carries no hover rule of its own. An inline transform on the
 * anchor would have outranked nothing but would have promoted the span; an
 * inline transform on the span itself would have frozen the roll outright.
 *
 * The social icons' hover, which is a `color`, background and border move on
 * the `.footer__social` anchor (the glyph is a mask and takes its paint from
 * `color`). The tween below moves the `<li>` and clears `transform`, `filter`
 * and `opacity` from THAT element by name; it has never touched `color`,
 * `background-color` or `border-color` on anything, so nothing inline is left
 * sitting on the anchor for the hover rules to fight.
 *
 * The icons' masks. Each glyph is an <Icon>, whose mask URL lives in an INLINE
 * custom property, `--icon`, on its span. `clearProps: 'all'` would empty that
 * style attribute and leave a solid square where each mark was. Nothing here
 * targets the span, and the `<li>` above it is cleared by name, so the four
 * masks are never in reach.
 *
 * COLOUR, AT ALL. This module reads no colour and sets none: every tween here
 * is y, blur, opacity or scaleX. That is why there is no `tok()` call in it and
 * why it needs none — there is no cool-down target to capture, so nothing here
 * can freeze against the palette that was live when the section built. Blur and
 * opacity mean the same thing on paper as on the dark page: out of soft into
 * sharp, out of nothing into present. The one beat that could ever have been
 * theme-shaped was the glow bloom, and the glow is gone.
 *
 * No `will-change` anywhere: a standing compositor promotion costs text its
 * subpixel antialiasing permanently, and GSAP promotes for the length of a
 * tween by itself. No `clearProps: 'all'` either — that empties the style
 * attribute outright. Every clear here names its properties.
 *
 * No hover animation and nothing listens to the pointer.
 */
import { EASE } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves.
 *
 * The footer is revealed and the timeline starts in the same frame, and that
 * frame is the first time any of this band has been laid out or painted.
 * Anything scheduled at zero spends it travelling unseen. An eighth of a second
 * of nothing costs the sequence nothing and hands the first beat back whole.
 *
 * It is cheaper than it was — four 1400px discs under a 110px blur and a
 * wordmark set at up to 230px all left with the old design — but the beat is
 * kept, because the cost it buys back is the first layout of the band and not
 * the glow specifically.
 */
const LEAD = 0.12;

/* The rule, then the brand block standing under it. */
const RULE_TOP_AT = LEAD;
const LOGO_AT = LEAD + 0.22;
const DESC_AT = LEAD + 0.55;

/* The three columns, left to right; each fills top down on its own tight step. */
const COLS_AT = LEAD + 1.0;
const COL_STEP = 0.16;
const LINK_STEP = 0.05;

/* The closing rule and the bottom bar. */
const META_AT = LEAD + 1.9;
const META_IN = 0.12;
const META_STEP = 0.08;

/**
 * THE PHONE PLAYS THE SAME SEQUENCE, TIGHTER.
 *
 * Not a second design: the same beats, in the same order, out of the same
 * blur, on the same eases and over the same durations. What changes is the
 * SCHEDULE, and it changes because the band is read differently. At 1600 the
 * whole footer is one screen and the spread is a composition the eye follows
 * across a held frame. At 390 it is the better part of two screens, reached at
 * the end of a long scroll and usually still moving, so a beat cued at two
 * seconds — the rule and the bottom bar that close the page — is a beat played
 * to an empty seat.
 *
 * Two numbers, because the two kinds of gap answer to different things. CUE
 * scales where a BEAT starts, which is the wait worth cutting because nothing
 * is happening during it. STEP scales the gap between things INSIDE one beat,
 * and is barely cut at all: it is what makes a column fill top down rather
 * than switch on, and the three columns arrive 0.112s apart rather than 0.16,
 * which is still nearly seven frames. Durations are untouched, so the beats
 * simply overlap more.
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
 * later rebuild on the same node adds no tweens: the hook reveals the footer,
 * the empty timeline completes on the next tick, and the band is simply there,
 * already landed. Without this a hot update, or any remount with the footer
 * still on screen, re-performs the whole arrival.
 *
 * Keyed on the element, so a genuinely new footer node arrives properly.
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

/**
 * A hairline draws out from the left, the way a rule is read.
 *
 * `scaleX` from zero about `0% 50%` is a plain `from`, so there is no delayed
 * `fromTo` to carry an `immediateRender` flag; the paired opacity tween is what
 * holds the hairline invisible until its cue. Both rules in the band use this,
 * which is the point of it being a function: the design draws the same line
 * twice and it should arrive the same way twice.
 */
function drawRule(tl: Timeline, rule: HTMLElement, at: number) {
  tl.from(rule, {
    scaleX: 0,
    transformOrigin: '0% 50%',
    duration: 0.9,
    ease: 'power2.inOut',
    clearProps: 'transform,transformOrigin',
  }, at);
  tl.from(rule, { opacity: 0, duration: 0.3, ease: 'none', clearProps: 'opacity' }, at);
}

export function buildFooter({ el, q, tl }: SectionMotion) {
  // Landed already and still on screen: settle, do not re-perform. See LANDED.
  if (LANDED.has(el)) return;

  const ruleTop = q('.footer__rule--top')[0];
  const logo = q('.footer__brand .logo')[0];
  const desc = q('.footer__desc')[0];
  const cols = q('.footer__col');
  const ruleBottom = q('.footer__rule--bottom')[0];
  const meta = q('.footer__meta p');

  // Asked here rather than read at module scope: a module-scope `matchMedia`
  // is answered once, when the bundle is parsed, and never again — so a
  // rotation or a resize would keep whichever schedule the page happened to
  // load under. `useSectionMotion` rebuilds this band on a theme switch and
  // React rebuilds it on a remount; both come back through this line.
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);

  /* 1 — the top rule. The design's first element and the band's cheapest, so
     the frame that reveals the footer has something in it immediately. */
  if (ruleTop) drawRule(tl, ruleTop, cue(RULE_TOP_AT));

  /* 2 — the logo. The one object the band leads with, out of the deepest blur
     in the brand block and alone on screen for a beat before its copy. */
  if (logo) outOfBlur(tl, logo, cue(LOGO_AT), { y: 22, blur: 10, duration: 1.05, fade: 0.4 });

  /* 3 — the claim under it, out of a shallower blur: a few short lines at 16px,
     where the logo's 10px would wash them out rather than soften them. */
  if (desc) outOfBlur(tl, desc, cue(DESC_AT), { y: 16, blur: 6, duration: 0.9, fade: 0.34 });

  /* 4 — the three columns, left to right. Each one fills top down rather than
     arriving whole: the heading, then its rows on a tight step, which is the
     treatment the pillars' cards use. The social column's four icons are `<li>`
     of a `.footer__links` list like every other row, so they are picked up by
     the same query and need no beat of their own. Only the `<li>` moves — see
     the header for why the anchor, the icon's mask and the `Roll` spans inside
     it are left alone. */
  cols.forEach((col, i) => {
    const parts = Array.from(col.querySelectorAll<HTMLElement>('.footer__col-title, .footer__links li'));
    if (!parts.length) return;
    outOfBlur(tl, parts, cue(COLS_AT) + i * step(COL_STEP), {
      y: 16,
      blur: 6,
      duration: 0.8,
      stagger: step(LINK_STEP),
      fade: 0.3,
    });
  });

  /* 5 — the close. The bottom rule draws out on the same curve as the top one,
     and the bar's two ends resolve under it on a step slow enough to read as
     left-then-right rather than as one line. */
  if (ruleBottom) drawRule(tl, ruleBottom, cue(META_AT));
  if (meta.length) {
    outOfBlur(tl, meta, cue(META_AT) + step(META_IN), {
      y: 12, blur: 5, duration: 0.75, stagger: step(META_STEP), fade: 0.3,
    });
  }

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
