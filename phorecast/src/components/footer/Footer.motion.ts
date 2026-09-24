/* Footer entrance.
 *
 * House language (src/lib/motion.ts): entrances rise a few pixels on
 * `expo.out`, staggered tightly, and resolve out of blur like every other
 * band. It is its own section entrance, started when the footer is reached,
 * not a continuation of the FAQ's.
 *
 * The logo gets a brief solo; everything after it is a stagger
 * (seconds, after LEAD):
 *   0.00  the top hairline draws out from the left
 *   0.22  the logo
 *   0.55  the description, out of a shallower blur
 *   1.00  the four columns, left to right, 0.16s apart; each fills top down
 *         (heading, then rows at 0.05s). The social icons are `<li>`s of the
 *         fourth column and arrive as part of it.
 *   1.90  the bottom hairline, then the two ends of the bottom bar; the
 *         timeline ends at about 3s
 *
 * Under 700px the cues are scaled by CUE and the staggers by STEP, so the
 * link columns are readable at about 0.6s. Order, eases and durations are
 * unchanged.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the footer simply present.
 *
 * Opacity is always a separate, much shorter tween than the blur: an element
 * at full opacity while still blurred paints a visible smudge (see
 * src/components/hero/entrance.ts).
 *
 * WHAT THIS DELIBERATELY DOES NOT TOUCH
 *
 * The link hovers. Each label is wrapped in `Roll`, whose `.roll__in` spans
 * slide on a CSS transition (global.css). Only the `<li>` is tweened; an
 * inline transform on the span would freeze the roll.
 *
 * The social icons' hover (`color`, background, border on `.footer__social`).
 * Only `transform`, `filter` and `opacity` are set, on the `<li>`, and cleared
 * by name, so nothing inline fights the hover rules.
 *
 * The icons' masks. <Icon> keeps its mask URL in an inline `--icon` custom
 * property; `clearProps: 'all'` would delete it and leave solid squares.
 * Nothing here targets the span, and the `<li>` is cleared by name.
 *
 * Colour. No colour is read or set (no `tok()`), so a theme switch needs
 * nothing from this module.
 *
 * No `will-change` (a standing promotion costs text its subpixel
 * antialiasing) and no `clearProps: 'all'`. No hover animation.
 */
import { EASE } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves. The reveal frame is the band's
 * first layout and paint, so anything scheduled at zero would travel unseen.
 */
const LEAD = 0.12;

/* The rule, then the brand block standing under it. */
const RULE_TOP_AT = LEAD;
const LOGO_AT = LEAD + 0.22;
const DESC_AT = LEAD + 0.55;

/* The four columns, left to right; each fills top down on its own tight step. */
const COLS_AT = LEAD + 1.0;
const COL_STEP = 0.16;
const LINK_STEP = 0.05;

/* The closing rule and the bottom bar. */
const META_AT = LEAD + 1.9;
const META_IN = 0.12;
const META_STEP = 0.08;

/**
 * On a phone the same sequence plays on a tighter schedule: the footer spans
 * about two screens and is usually reached mid-scroll, so late beats would
 * play to no one.
 *
 * CUE scales where each beat starts. STEP scales the gaps inside a beat and is
 * cut much less, so columns still fill top down. Durations are unchanged.
 * LEAD is a fixed cost and is added after scaling, not scaled.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * Elements whose entrance has run to the end. Set by the LAST item on the
 * timeline, so a build reverted part-way (StrictMode's first pass) does not
 * count. A later rebuild on the same node adds no tweens, so a hot update or
 * remount does not replay the entrance. Keyed on the element, so a new
 * footer node still animates.
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

/**
 * A hairline draws out from the left. A plain `from` on `scaleX`; the paired
 * opacity tween keeps it invisible until its cue. Used for both rules.
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

  // Read per build, not at module scope, so a resize or rotation picks up the
  // right schedule on the next rebuild (theme switch or remount).
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);

  /* 1: the top rule, the cheapest thing to paint, so it leads. */
  if (ruleTop) drawRule(tl, ruleTop, cue(RULE_TOP_AT));

  /* 2: the logo, out of the deepest blur in the brand block. */
  if (logo) outOfBlur(tl, logo, cue(LOGO_AT), { y: 22, blur: 10, duration: 1.05, fade: 0.4 });

  /* 3: the description, out of a shallower blur; the logo's 10px would wash
     out body text. */
  if (desc) outOfBlur(tl, desc, cue(DESC_AT), { y: 16, blur: 6, duration: 0.9, fade: 0.34 });

  /* 4: the four columns, left to right, each filling top down (heading, then
     rows). The social icons are `.footer__links li` too, so the same query
     picks them up. Only the `<li>` moves; see the header. */
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

  /* 5: the bottom rule, then the bar's two ends, left then right. */
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
