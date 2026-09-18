/* "Built for the Way You Trade" — the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates for
 * effect. The band's accent is the soft-to-sharp resolve the hero, the pillars
 * and the steps already use, so the type and the two cards arrive out of blur
 * rather than simply fading.
 *
 * The section's argument is the two illustrations — one market to start, versus
 * five markets wired into self-custody — so neither card merely fades in. Each
 * one's artwork assembles in the order the picture is read: on the left, "You",
 * then the line running right, then the rings blooming outward around the coin;
 * on the right, the markets appear left to right, the wires draw toward the
 * padlock, and the padlock lands where they converge.
 *
 * THE SEQUENCE (3.99s end to end; times below are measured from the end of the
 * held lead-in beat that every cue is offset by — see LEAD)
 *   0.00  The eyebrow — the label on the band, small and quiet, so the section
 *         is named before anything stands in it.
 *   0.16  THE HEADING, rising out of its own mask and resolving from soft. The
 *         one object the section leads with; everything else follows it.
 *   0.60  The sub-line, out of a shallower blur.
 *   1.00  THE LEFT CARD as one object, out of blur. Then its artwork, from
 *         1.42: the corner labels, the "You" dot and its word, the line drawing
 *         right out of the dot (1.60), the smear lighting under it, and the
 *         rings blooming outward from the coin — coin, disc, mid, outer, 0.08s
 *         apart (1.95) — then "BTC / USD" beside them.
 *   1.72  THE RIGHT CARD, while the left one's artwork is still assembling, so
 *         the two read as a pair rather than two separate arrivals. Its own
 *         artwork from 2.14: the five market nodes left to right (2.15), the
 *         wires drawing from them toward the padlock (2.42), and SELF-CUSTODY
 *         arriving last at the point they converge (3.05).
 *   2.24  The left column's copy and CTA, a beat behind its illustration.
 *   3.12  The right column's copy and CTA. Lands at 3.85.
 *
 * THE TIMELINE IS THE SAME IN BOTH FRAMES. Below 700px Built.css re-lays both
 * cards into a portrait 320 x 356 -- "You" above its line rather than beside
 * it, the five markets in a row above the padlock rather than spread to its
 * left. Every cue above still has something to play, at the same second, and
 * only two of them read the layout rather than assuming it: the line's draw
 * composes with the quarter-turn the stylesheet gives it, and the wire draw
 * asks which wires are actually on the card and which way they run. Neither is
 * a breakpoint test; both are questions about the element in front of them.
 *
 * Every tween is a `from`, so the resting markup is the finished state and a
 * build that never runs leaves the section simply present. The two wire draws
 * are the only `fromTo`s — a clip-path has no interpolable resting value to
 * infer a `from` against — and they carry `immediateRender: false`, because a
 * `fromTo` writes its start value when the timeline is BUILT, not when the
 * playhead arrives; without the flag both wires would be clipped away at build
 * time and un-clipped only when their turn came, which is the same beat played
 * backwards. Each one is paired with a short `from` opacity tween, which DOES
 * render at build, so the wires are held invisible until their cue either way.
 *
 * The blur carries its own lesson, recorded in src/components/hero/entrance.ts:
 * an element parked at full opacity while still blurred paints a visible smudge
 * of itself before its turn. So opacity is always a second, much shorter tween
 * rather than riding the whole blur duration — the thing is invisible while it
 * is at its softest, and has resolved most of its blur by the time it is fully
 * opaque.
 *
 * No `will-change` anywhere: a standing compositor promotion costs text its
 * subpixel antialiasing permanently, and GSAP promotes for the length of a
 * tween by itself. No `clearProps: 'all'` either — the five market nodes carry
 * their positions as `--x`/`--y` in the style attribute, and clearing "all"
 * empties that attribute and collapses the constellation onto its centre. Every
 * clear here names its properties.
 *
 * No hover animation and nothing listens to the pointer. The CTAs' `Roll` hover
 * is CSS in global.css and is not touched: nothing here tweens `.roll__in`, only
 * the `<a>` that contains it.
 */
import { EASE, rise, intoLines } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves.
 *
 * The section is revealed and the timeline starts in the same frame, and that
 * frame is an expensive one: the hold comes off two 640x254 cards carrying
 * twenty-odd SVGs and two 900px blurred glows that have never been painted.
 * Anything scheduled at zero spends that frame travelling unseen. An eighth of
 * a second of nothing costs the sequence nothing and hands the first beat back
 * whole.
 */
const LEAD = 0.14;

/* The head: label, heading, sub-line. */
const TITLE_AT = LEAD + 0.16;
const SUB_AT = LEAD + 0.6;

/* The two cards. The left one leads; the right one opens while the left one's
   artwork is still assembling, so the pair reads as one movement across the
   band rather than two separate arrivals. */
const CARD1_AT = LEAD + 1.0;
const CARD2_AT = LEAD + 1.72;

/* Card one's artwork, in the order the picture is read. */
const C1_LABELS = LEAD + 1.42;
const C1_DOT = LEAD + 1.45;
const C1_YOU = LEAD + 1.52;
const C1_LINE = LEAD + 1.6;
const C1_SMEAR = LEAD + 1.78;
const C1_RINGS = LEAD + 1.95;
const C1_RING_STEP = 0.08;
const C1_TEXT = LEAD + 2.28;

/* Card two's artwork: markets, then wires, then the thing they converge on. */
const C2_LABELS = LEAD + 2.14;
const C2_NODES = LEAD + 2.15;
const C2_NODE_STEP = 0.1;
const C2_FAN = LEAD + 2.42;
const C2_MAIN = LEAD + 2.5;
const C2_SMEAR = LEAD + 2.8;
const C2_LOCK = LEAD + 3.05;

/* Each column's copy, a beat behind its own illustration. */
const COPY_AT = [LEAD + 2.24, LEAD + 3.12];
const COPY_STEP = 0.09;

/**
 * The lit ring's box centre is not its visual centre.
 *
 * `ring-disc.svg` draws its circle at (96.9, 92.9) inside a 193.8 square
 * viewBox — centred across, four units high, because the export reserves room
 * for a drop shadow underneath. Built.css compensates with deliberately
 * asymmetric offsets (left: -29.4, top: -25.4) so the drawn circle is
 * concentric with the coin. Scaling it about "50% 50%" would therefore swing
 * the lit ring off the coin on the way in and land it back only at the end.
 * 92.9 / 193.8 = 47.936%, which is where the circle actually is.
 */
const DISC_ORIGIN = '50% 47.936%';

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
 * its own much shorter one starting at the same moment. See the note above —
 * this pairing is the whole reason the blur does not smear. Lifted from
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
 * Bloom outward from a point: scale up into place, opacity on its own shorter
 * tween. Used for the coin and the three rings around it, and for the nodes in
 * the constellation. `origin` matters for the lit ring — see DISC_ORIGIN.
 */
function bloom(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: { scale?: number; y?: number; duration?: number; stagger?: number; fade?: number; origin?: string; blur?: number },
) {
  const { scale = 0.55, y = 0, duration = 0.7, stagger = 0, fade = 0.3, origin = '50% 50%', blur = 0 } = vars;
  // `transformOrigin` is named in the clear as well as `transform`: GSAP writes
  // the origin inline and leaving it behind would put a stale one on an element
  // whose CSS never asked for it. Named properties only, never `all` — that
  // would empty the style attribute the market nodes keep `--x`/`--y` in.
  const from: gsap.TweenVars = { scale, transformOrigin: origin, duration, stagger, ease: EASE, clearProps: 'transform,transformOrigin' };
  if (y) from.y = y;
  if (blur) { from.filter = `blur(${blur}px)`; from.clearProps = 'transform,transformOrigin,filter'; }
  tl.from(targets, from, at);
  tl.from(targets, { opacity: 0, duration: fade, stagger, ease: 'none', clearProps: 'opacity' }, at);
}

/**
 * Draw a line that is an image, not a stroked path in the document.
 *
 * `draw()` in lib/motion.ts animates `stroke-dashoffset`, which needs the path
 * itself; these wires are a mask over a CSS paint (Built.tsx), so there is no
 * path here either and the equivalent is a clip-path opening in the direction
 * the line runs. It clips the mask and the paint together, so the conversion
 * changed nothing about this cue.
 *
 * WHICH DIRECTION IS THE LAYOUT'S TO SAY. In the landscape frame both of card
 * two's wires run left to right into the padlock, so both are uncovered from
 * the left. In the portrait frame the five wires run DOWNWARD out of the
 * market row into the padlock beneath it, so the same cue has to open from the
 * top -- `down` is not a style choice, it is where the padlock is.
 *
 * `immediateRender: false` for the reason in the file header. The paired
 * opacity tween is a `from`, which does render at build, and is what holds the
 * wire invisible between the card's reveal and this cue.
 */
function wipeIn(tl: Timeline, el: Element, at: number, duration: number, fade = 0.3, down = false) {
  tl.fromTo(el,
    { clipPath: down ? 'inset(0% 0% 100% 0%)' : 'inset(0% 100% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
    at);
  tl.from(el, { opacity: 0, duration: fade, ease: 'none', clearProps: 'opacity' }, at);
}

export function buildBuilt({ el, q, tl }: SectionMotion) {
  // Landed already and still on screen: settle, do not re-perform. See LANDED.
  if (LANDED.has(el)) return;

  const title = q('.built__title')[0];
  const sub = q('.built__sub')[0];
  const card1 = q('.bt-card--one')[0];
  const card2 = q('.bt-card--two')[0];

  const inside = (card: HTMLElement | undefined, sel: string) =>
    card ? Array.from(card.querySelectorAll<HTMLElement>(sel)) : [];

  /* 1 — the band names itself. */
  rise(tl, q('.eyebrow'), LEAD, { y: 16, duration: 0.8, clearProps: 'transform,opacity' });

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

  /* 3 — the sub-line. Set much smaller than the heading, so a shallower blur:
     the same 10px would wash the whole line out rather than soften it. */
  if (sub) outOfBlur(tl, sub, SUB_AT, { y: 14, blur: 6, duration: 0.85, fade: 0.32 });

  /* 4 — the two cards, each as one object, out of blur. The card is the panel
     its artwork stands in, so it arrives whole and empty; everything inside it
     is held until the panel has all but settled. `expo.out` is 99% travelled at
     70% of its duration, so the artwork never assembles on a moving ground. */
  if (card1) outOfBlur(tl, card1, CARD1_AT, { y: 28, blur: 12, duration: 1.1, fade: 0.45 });
  if (card2) outOfBlur(tl, card2, CARD2_AT, { y: 28, blur: 12, duration: 1.1, fade: 0.45 });

  /* 5 — card one's artwork, in the order the picture is read: you, the line you
     run along, then what it arrives at. */
  const labels1 = inside(card1, '.bt-label');
  if (labels1.length) rise(tl, labels1, C1_LABELS, { y: 10, duration: 0.6, stagger: 0.08, clearProps: 'transform,opacity' });

  const dot = inside(card1, '.bt1__dot');
  if (dot.length) bloom(tl, dot, C1_DOT, { scale: 0.4, y: 6, duration: 0.6, fade: 0.26 });

  const you = inside(card1, '.bt1__you');
  // 10px, not the 6 this started at: measured on its own, away from the card's
  // rise underneath it, 6px of travel on a 12px word is under the 8px this
  // project counts as visible.
  if (you.length) rise(tl, you, C1_YOU, { y: 10, duration: 0.55, clearProps: 'transform,opacity' });

  /* The line runs out of the dot toward the rings, so it is drawn from its
     starting end: `scaleX` about `0% 50%` is the same movement `draw()` makes on
     a path, and unlike a clip-path it is a plain `from`. The line is a mask over
     a gradient now rather than a `preserveAspectRatio="none"` <img>, and a
     transform scales both together, so this reads exactly as it did.

     IT NEEDS NO SECOND CASE FOR THE PORTRAIT CARD, and that is the reason the
     stylesheet rotates that line rather than reshaping its box. GSAP decomposes
     the `rotate(90deg)` already on the element and composes this scale after
     it, so `scaleX` about `0% 50%` is the element's OWN x either way: rightward
     out of the dot at 1600, downward out of it on a phone. `clearProps` names
     `transform`, which hands the rotation back to the stylesheet rather than
     clearing it -- the rotation is CSS, not something written here. */
  const lineImg = inside(card1, '.bt1__line');
  if (lineImg.length) {
    tl.from(lineImg, {
      scaleX: 0,
      transformOrigin: '0% 50%',
      duration: 0.75,
      ease: 'power2.inOut',
      clearProps: 'transform,transformOrigin',
    }, C1_LINE);
    tl.from(lineImg, { opacity: 0, duration: 0.25, ease: 'none', clearProps: 'opacity' }, C1_LINE);
  }

  /* The smear is light under the line, not an object: it only lifts. */
  const smear1 = inside(card1, '.bt1__smear');
  if (smear1.length) tl.from(smear1, { opacity: 0, duration: 0.5, ease: 'none', clearProps: 'opacity' }, C1_SMEAR);

  /* The rings bloom outward from the coin — coin first, then the lit disc, the
     mid ring and the outer ring — so the target reads as opening around the
     market rather than three circles fading up together. The lit ring scales
     about the circle it draws, not about its own box; see DISC_ORIGIN. */
  const coin = inside(card1, '.bt1__coin');
  if (coin.length) bloom(tl, coin, C1_RINGS, { scale: 0.45, duration: 0.7, fade: 0.28 });

  const disc = inside(card1, '.bt1__ring-disc');
  if (disc.length) bloom(tl, disc, C1_RINGS + C1_RING_STEP, { scale: 0.5, duration: 0.8, fade: 0.3, origin: DISC_ORIGIN });

  const mid = inside(card1, '.bt1__ring-mid');
  if (mid.length) bloom(tl, mid, C1_RINGS + C1_RING_STEP * 2, { scale: 0.5, duration: 0.8, fade: 0.3 });

  const outer = inside(card1, '.bt1__ring-outer');
  if (outer.length) bloom(tl, outer, C1_RINGS + C1_RING_STEP * 3, { scale: 0.5, duration: 0.8, fade: 0.3 });

  /* The pair the whole left card is about, last, beside the settled rings. */
  const text1 = inside(card1, '.bt1__text');
  if (text1.length) outOfBlur(tl, text1, C1_TEXT, { y: 10, blur: 5, duration: 0.75, fade: 0.3 });

  /* 6 — card two's artwork: the markets exist, the wires run from them, the
     padlock is what they run to. */
  const labels2 = inside(card2, '.bt-label');
  if (labels2.length) rise(tl, labels2, C2_LABELS, { y: 10, duration: 0.6, stagger: 0.08, clearProps: 'transform,opacity' });

  /* Left to right across the constellation, by where each node actually sits
     rather than by source order — the markup lists them BTC, TSLA, DAX, EUR,
     XAU, which is not the order the eye crosses the picture. Measured, not
     read off `--x`, so the order survives any later edit to the layout. */
  const nodes = inside(card2, '.bt2__node:not(.bt2__node--lock)')
    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  if (nodes.length) {
    bloom(tl, nodes, C2_NODES, { scale: 0.5, y: 10, duration: 0.8, stagger: C2_NODE_STEP, fade: 0.32, blur: 5 });
  }

  /* The wires, drawn from the markets toward the padlock.
     -----------------------------------------------------------------------
     Landscape: the fan first, since it carries four of the five markets, and
     BTC's own link a beat behind it, both opening from the left.

     Portrait: there is no second wire. Built.css gives `.bt2__fan` a mask drawn
     for that frame which carries all five lines, and takes `.bt2__main` off the
     card entirely -- so this reads `display` rather than a width, and the cue
     that has nothing left to draw is not queued at all. A `fromTo` on a
     `display: none` element would still write its start value at build time,
     still hold a `clearProps` to run, and still read as a wire being drawn in
     the timeline while moving no pixels: a dead selector with a schedule. The
     one wire that IS there takes both slots' worth of the beat -- it starts at
     the fan's cue and runs to where the main link's would have ended -- so the
     portrait card spends the same time drawing its circuit as the landscape
     one does. */
  const fan = inside(card2, '.bt2__fan')[0];
  const main = inside(card2, '.bt2__main')[0];
  const mainOff = !main || getComputedStyle(main).display === 'none';
  if (fan) wipeIn(tl, fan, C2_FAN, mainOff ? (C2_MAIN - C2_FAN) + 0.75 : 0.85, 0.32, mainOff);
  if (main && !mainOff) wipeIn(tl, main, C2_MAIN, 0.75, 0.3);

  const smear2 = inside(card2, '.bt2__smear');
  if (smear2.length) tl.from(smear2, { opacity: 0, duration: 0.5, ease: 'none', clearProps: 'opacity' }, C2_SMEAR);

  /* SELF-CUSTODY, last on the card and at the point the wires converge. It is
     what the right-hand argument is for, so it lands alone, after everything
     that points at it. */
  const lock = inside(card2, '.bt2__node--lock');
  if (lock.length) bloom(tl, lock, C2_LOCK, { scale: 0.55, duration: 0.85, fade: 0.34, blur: 6 });

  /* 7 — each column's copy and CTA, tightly staggered, a beat behind its own
     illustration. Only the `<a>` is moved; the `Roll` spans inside it own their
     own transform for the hover and are left alone. */
  q('.built__col').forEach((col, i) => {
    const parts = Array.from(col.querySelectorAll<HTMLElement>('.built__copy > *'));
    if (!parts.length) return;
    rise(tl, parts, COPY_AT[i] ?? COPY_AT[COPY_AT.length - 1], {
      y: 12,
      duration: 0.55,
      stagger: COPY_STEP,
      clearProps: 'transform,opacity',
    });
  });

  // The last item on the timeline: reached only by a build that performed the
  // whole entrance. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
