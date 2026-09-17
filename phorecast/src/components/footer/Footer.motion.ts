/* The footer's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's accent is the soft-to-sharp resolve every other band on
 * the page now uses, so the type arrives out of blur rather than simply fading.
 *
 * Its own section entrance, not a continuation of the FAQ's. The two bands are
 * scrolled to at different moments and each has its own `useSectionMotion`, so
 * the footer opens when the footer is reached.
 *
 * THE SEQUENCE (4.07s end to end; times below are measured from the end of the
 * held lead-in beat that every cue is offset by — see LEAD)
 *   0.00  The glow band blooms up off the bottom edge. Light first, so the
 *         band is lit before anything is standing in it — the same opening
 *         beat the pillars use.
 *   0.25  THE LOGO. The one object the footer leads with, alone for a beat.
 *   0.55  The tagline under it, out of a shallower blur.
 *   1.00  The four link columns, left to right, 0.16s apart — and each column
 *         fills top down, its title then its links on a tight 0.05s stagger,
 *         so a column reads as filling rather than switching on.
 *   2.05  The four social buttons, left to right.
 *   2.45  The rule draws out from the left, and the copyright line and the
 *         legal links resolve above it.
 *   2.65  THE WORDMARK, last and largest, rising out of the crop it sits in.
 *         The band's closing accent. Lands at 4.07.
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
 * The social buttons' hover. `.footer__social img` carries a `filter` of its
 * own in Footer.css that takes the glyph to white on hover and on focus. The
 * tween below moves the `<li>` and clears `transform`, `filter` and `opacity`
 * from THAT element by name, so nothing inline is ever left sitting on the
 * anchor or on the image for the hover rule to fight.
 *
 * No `will-change` anywhere: a standing compositor promotion costs text its
 * subpixel antialiasing permanently, and GSAP promotes for the length of a
 * tween by itself. No `clearProps: 'all'` either — that empties the style
 * attribute outright, and `.footer__g` discs are absolutely positioned off
 * their own edges. Every clear here names its properties.
 *
 * No hover animation and nothing listens to the pointer.
 */
import { EASE } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves.
 *
 * The footer is revealed and the timeline starts in the same frame, and that
 * frame is an expensive one: the hold comes off four discs of up to 1400px
 * each under a 110px blur, plus a wordmark set at up to 230px, none of which
 * has been painted. Anything scheduled at zero spends that frame travelling
 * unseen. An eighth of a second of nothing costs the sequence nothing and hands
 * the first beat back whole.
 */
const LEAD = 0.12;

/* Light, then the brand block that stands in it. */
const GLOW_AT = LEAD;
const LOGO_AT = LEAD + 0.25;
const TAG_AT = LEAD + 0.55;

/* The four columns, left to right; each fills top down on its own tight step. */
const COLS_AT = LEAD + 1.0;
const COL_STEP = 0.16;
const LINK_STEP = 0.05;

/* The social row, then the legal line, then the closer. */
const SOCIAL_AT = LEAD + 2.05;
const SOCIAL_STEP = 0.09;
const LEGAL_AT = LEAD + 2.45;
const WORD_AT = LEAD + 2.65;

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

export function buildFooter({ el, q, tl }: SectionMotion) {
  // Landed already and still on screen: settle, do not re-perform. See LANDED.
  if (LANDED.has(el)) return;

  const glow = q('.footer__glow')[0];
  const logo = q('.footer__brand .logo')[0];
  const tagline = q('.footer__tagline')[0];
  const cols = q('.footer__col');
  const socials = q('.footer__socials li');
  const rule = q('.footer__rule')[0];
  const meta = q('.footer__meta > p, .footer__legal-links li');
  const word = q('.footer__wordmark span')[0];

  /* 1 — light. The glow band sits on the bottom edge and spills upward through
     a mask, so it blooms from that edge rather than from its own middle. The
     `from` ends wherever the element already is, which is the stylesheet's
     0.8 — a stated `opacity: 1` here would have brightened the whole band. */
  if (glow) {
    tl.from(glow, {
      opacity: 0,
      scale: 1.05,
      duration: 1.4,
      ease: 'power2.out',
      transformOrigin: '50% 100%',
      clearProps: 'transform,transformOrigin,opacity',
    }, GLOW_AT);
  }

  /* 2 — the logo. The one object the band leads with, out of the deepest blur
     in the brand block and alone on screen for a beat before its copy. */
  if (logo) outOfBlur(tl, logo, LOGO_AT, { y: 22, blur: 10, duration: 1.05, fade: 0.4 });

  /* 3 — the claim under it, out of a shallower blur: two short lines at 16px,
     where the logo's 10px would wash them out rather than soften them. */
  if (tagline) outOfBlur(tl, tagline, TAG_AT, { y: 16, blur: 6, duration: 0.9, fade: 0.34 });

  /* 4 — the four columns, left to right. Each one fills top down rather than
     arriving whole: the heading, then its links on a tight step, which is the
     treatment the pillars' cards use. Only the `<li>` moves — see the header
     for why the anchor and the `Roll` spans inside it are left alone. */
  cols.forEach((col, i) => {
    const parts = Array.from(col.querySelectorAll<HTMLElement>('.footer__col-title, .footer__links li'));
    if (!parts.length) return;
    outOfBlur(tl, parts, COLS_AT + i * COL_STEP, {
      y: 16,
      blur: 6,
      duration: 0.8,
      stagger: LINK_STEP,
      fade: 0.3,
    });
  });

  /* 5 — the four social buttons, left to right. They sit above the columns on
     the page but arrive after them: the columns are what the footer is for and
     these are its accent, so they land on a band that has already filled. */
  if (socials.length) {
    outOfBlur(tl, socials, SOCIAL_AT, { y: 14, blur: 5, duration: 0.75, stagger: SOCIAL_STEP, fade: 0.3 });
  }

  /* 6 — the legal line. The rule draws out from the left, the way a rule is
     read, and the copy above it resolves alongside. `scaleX` from zero about
     `0% 50%` is a plain `from`, so there is no delayed `fromTo` to carry an
     `immediateRender` flag; the paired opacity tween is what holds the hairline
     invisible until its cue. */
  if (rule) {
    tl.from(rule, {
      scaleX: 0,
      transformOrigin: '0% 50%',
      duration: 0.9,
      ease: 'power2.inOut',
      clearProps: 'transform,transformOrigin',
    }, LEGAL_AT);
    tl.from(rule, { opacity: 0, duration: 0.3, ease: 'none', clearProps: 'opacity' }, LEGAL_AT);
  }
  if (meta.length) {
    outOfBlur(tl, meta, LEGAL_AT + 0.12, { y: 12, blur: 5, duration: 0.75, stagger: 0.06, fade: 0.3 });
  }

  /* 7 — the wordmark, last and largest. It is set at up to 230px inside a crop
     that shows only its top, so it rises out of that crop: a long travel out of
     a deep blur, the one movement in the band big enough to close it. Blur and
     transform are cleared by name so the settled type is sharp and CSS owns it
     again — no `will-change` is ever set on it, and GSAP's own promotion is
     dropped when the tween ends. */
  if (word) outOfBlur(tl, word, WORD_AT, { y: 60, blur: 16, duration: 1.3, fade: 0.5 });

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
