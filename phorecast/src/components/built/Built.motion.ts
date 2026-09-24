/* "Built to grow with you": the section's load-in.
 *
 * Written in the house language (src/lib/motion.ts): entrances rise a few
 * pixels on `expo.out`, staggered tightly, nothing overshoots or rotates. The
 * type and the two cards resolve out of blur, as in the hero, the pillars and
 * the steps.
 *
 * Each card's artwork assembles in reading order: on the left, "You", the
 * line running out of it, then the rings blooming around the coin; on the
 * right, the markets, the wires, then the padlock they converge on.
 *
 * THE SEQUENCE (3.99s end to end; times are after the LEAD hold)
 *   0.00  The eyebrow.
 *   0.16  The heading, rising out of its mask and resolving from soft.
 *   0.60  The sub-line, out of a shallower blur.
 *   1.00  The left card, out of blur. Its artwork from 1.42: corner labels,
 *         the dot and "You", the line (1.60), the smear, the rings from the
 *         coin outward 0.08s apart (1.95), then the question and note.
 *   1.72  The right card, while the left one is still assembling, so the two
 *         read as a pair. Its artwork from 2.14: the markets (2.15), the
 *         wires (2.42), and SELF-CUSTODY last (3.05).
 *   2.24  The left column's copy and CTA.
 *   3.12  The right column's copy and CTA; lands at 3.85.
 *
 * Under 700px the band's cues are taken at 0.42 of those times and offsets
 * inside an illustration at 0.7, so the band lands in about 2.5s instead of
 * 4.0. Order, eases and durations are unchanged; see CUE and STEP.
 *
 * The timeline is the same in both frames. Below 700px Built.css re-lays the
 * cards in portrait (card two as the Figma 526:2656 ring), and three cues
 * read the layout rather than assuming it: the line draw composes with the
 * stylesheet's rotation, the market nodes are ordered by position, and the
 * wires choose between an edge wipe and a radial open by their shape.
 *
 * Every tween is a `from`, so a build that never runs leaves the section
 * present. The landscape wire draws are the only `fromTo`s (a clip-path has
 * no resting value to infer a `from` against) and carry `immediateRender:
 * false`, because a `fromTo` writes its start value when the timeline is
 * built; each is paired with a short `from` opacity tween that holds the
 * wire invisible until its cue.
 *
 * Opacity is always a separate, much shorter tween than the blur (see
 * src/components/hero/entrance.ts): an element at full opacity while still
 * blurred paints a visible smudge of itself before its turn.
 *
 * No `will-change`: a standing promotion costs text its subpixel
 * antialiasing, and GSAP promotes for the length of a tween anyway. Never
 * `clearProps: 'all'`: the market nodes keep `--x`/`--y` in the style
 * attribute, and clearing it collapses them onto the centre. Every clear
 * names its properties.
 *
 * No pointer listeners. The CTAs' `Roll` hover is CSS (global.css); only the
 * `<a>` is tweened, never `.roll__in`.
 */
import { EASE, rise, intoLines } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';

/**
 * A held beat before the first element moves. The reveal frame is expensive
 * (two cards of SVGs and two large blurred glows painted for the first time),
 * and anything scheduled at zero would travel unseen during it.
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

/* Card one's artwork, as gaps from the card's own cue, so moving the card
   moves the artwork with it, still in order. */
const LABEL_STEP = 0.08;
const C1_LABELS = 0.42;
const C1_DOT = 0.45;
const C1_YOU = 0.52;
const C1_LINE = 0.6;
const C1_SMEAR = 0.78;
const C1_RINGS = 0.95;
const C1_RING_STEP = 0.08;
const C1_TEXT = 1.28;

/* Card two's artwork: markets, then wires, then the padlock. Gaps from card
   two's cue. */
const C2_LABELS = 0.42;
const C2_NODES = 0.43;
const C2_NODE_STEP = 0.1;
const C2_FAN = 0.7;
const C2_MAIN = 0.78;
const C2_SMEAR = 1.08;
const C2_LOCK = 1.33;

/* Each column's copy, as a gap from that column's card. */
const COPY_IN = [1.24, 1.4];
const COPY_STEP = 0.09;

/**
 * The phone plays the same sequence, tighter. At 390px the cards are stacked
 * and the band is three screens tall, so at desktop timing the right card's
 * content would arrive after it had been scrolled past.
 *
 * CUE scales where a beat starts (head, cards, copy), which is idle time.
 * STEP scales the gaps within a beat (each illustration's reading order,
 * the ring and market staggers) and is barely cut, or "You" would land with
 * its own dot. Durations are unchanged, so beats overlap more. LEAD is a
 * fixed cost for the expensive first frame, so it is added after scaling.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * The lit ring's box centre is not its visual centre. ring-disc.svg draws its
 * circle at (96.9, 92.9) in a 193.8 square viewBox (room for a drop shadow
 * below), and Built.css offsets the box asymmetrically to make it concentric
 * with the coin. Scaling about "50% 50%" would swing the ring off the coin;
 * 92.9 / 193.8 = 47.936% is where the circle is.
 */
const DISC_ORIGIN = '50% 47.936%';

/**
 * Sections whose entrance has already run to completion. The mark is added by
 * the last item on the timeline, so a build reverted part-way (StrictMode's
 * first pass) never sets it and the next build performs the entrance in full.
 * A later rebuild on a landed element adds no tweens, so a hot update or a
 * remount with the section on screen does not replay the arrival. Keyed on
 * the element, so a new section node still animates.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * Rise out of blur: travel and softening on one tween, opacity on its own
 * shorter one starting at the same moment, so the blur does not smear. Same
 * helper as Pillars.motion.ts.
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
 * tween. Used for the coin and its rings, and for the market nodes. `origin`
 * matters for the lit ring; see DISC_ORIGIN.
 */
function bloom(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: { scale?: number; y?: number; duration?: number; stagger?: number; fade?: number; origin?: string; blur?: number },
) {
  const { scale = 0.55, y = 0, duration = 0.7, stagger = 0, fade = 0.3, origin = '50% 50%', blur = 0 } = vars;
  // `transformOrigin` is cleared too, or a stale inline origin would outlive
  // the tween. Named properties only, never `all` (see the header).
  const from: gsap.TweenVars = { scale, transformOrigin: origin, duration, stagger, ease: EASE, clearProps: 'transform,transformOrigin' };
  if (y) from.y = y;
  if (blur) { from.filter = `blur(${blur}px)`; from.clearProps = 'transform,transformOrigin,filter'; }
  tl.from(targets, from, at);
  tl.from(targets, { opacity: 0, duration: fade, stagger, ease: 'none', clearProps: 'opacity' }, at);
}

/**
 * Draw a line that is a mask, not a stroked path. `draw()` in lib/motion.ts
 * animates `stroke-dashoffset`, which needs a path; these wires are a mask
 * over a CSS paint (Built.tsx), so the equivalent is a clip-path opening in
 * the direction the line runs, clipping mask and paint together. `down`
 * opens from the top instead of the left.
 *
 * `immediateRender: false` for the reason in the file header; the paired
 * opacity `from` holds the wire invisible until this cue.
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

  // Asked per build rather than at module scope, so a rebuild (theme switch,
  // remount) picks up the current viewport instead of the one at load.
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);
  const card1At = cue(CARD1_AT);
  const card2At = cue(CARD2_AT);

  /* 1. The eyebrow. */
  rise(tl, q('.eyebrow'), LEAD, { y: 16, duration: 0.8, clearProps: 'transform,opacity' });

  /* 2. The heading. One sentence, so one mask: the line rises out of it as a
     unit and sharpens on the way. */
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

  /* 3. The sub-line. Smaller type, so a shallower blur: 10px would wash it
     out rather than soften it. */
  if (sub) outOfBlur(tl, sub, cue(SUB_AT), { y: 14, blur: 6, duration: 0.85, fade: 0.32 });

  /* 4. The two cards, each as one object, out of blur. The artwork inside is
     held until the panel has all but settled (`expo.out` is 99% travelled at
     70% of its duration), so it never assembles on a moving ground. */
  if (card1) outOfBlur(tl, card1, card1At, { y: 28, blur: 12, duration: 1.1, fade: 0.45 });
  if (card2) outOfBlur(tl, card2, card2At, { y: 28, blur: 12, duration: 1.1, fade: 0.45 });

  /* 5. Card one's artwork: you, the line you run along, then what it
     arrives at. */
  const labels1 = inside(card1, '.bt-label');
  if (labels1.length) rise(tl, labels1, card1At + step(C1_LABELS), { y: 10, duration: 0.6, stagger: step(LABEL_STEP), clearProps: 'transform,opacity' });

  const dot = inside(card1, '.bt1__dot');
  if (dot.length) bloom(tl, dot, card1At + step(C1_DOT), { scale: 0.4, y: 6, duration: 0.6, fade: 0.26 });

  const you = inside(card1, '.bt1__you');
  // 10px of travel: on a 12px word, less does not read as movement.
  if (you.length) rise(tl, you, card1At + step(C1_YOU), { y: 10, duration: 0.55, clearProps: 'transform,opacity' });

  /* The line is drawn from its starting end: `scaleX` about `0% 50%` is the
     same movement as a dash-offset draw, and as a plain `from` it scales the
     mask and its gradient together.

     No portrait special case is needed. GSAP decomposes the stylesheet's
     rotation and composes this scale after it, so `scaleX` is along the
     element's own x in both frames. `clearProps: 'transform'` hands the
     rotation back to the stylesheet. */
  const lineImg = inside(card1, '.bt1__line');
  if (lineImg.length) {
    tl.from(lineImg, {
      scaleX: 0,
      transformOrigin: '0% 50%',
      duration: 0.75,
      ease: 'power2.inOut',
      clearProps: 'transform,transformOrigin',
    }, card1At + step(C1_LINE));
    tl.from(lineImg, { opacity: 0, duration: 0.25, ease: 'none', clearProps: 'opacity' }, card1At + step(C1_LINE));
  }

  /* The smear is light under the line, not an object: it only lifts. */
  const smear1 = inside(card1, '.bt1__smear');
  if (smear1.length) tl.from(smear1, { opacity: 0, duration: 0.5, ease: 'none', clearProps: 'opacity' }, card1At + step(C1_SMEAR));

  /* The rings bloom outward from the coin: coin, lit disc, mid ring, outer
     ring. The lit ring scales about the circle it draws; see DISC_ORIGIN. */
  const ringsAt = card1At + step(C1_RINGS);
  const ringStep = step(C1_RING_STEP);
  const coin = inside(card1, '.bt1__coin');
  if (coin.length) bloom(tl, coin, ringsAt, { scale: 0.45, duration: 0.7, fade: 0.28 });

  const disc = inside(card1, '.bt1__ring-disc');
  if (disc.length) bloom(tl, disc, ringsAt + ringStep, { scale: 0.5, duration: 0.8, fade: 0.3, origin: DISC_ORIGIN });

  const mid = inside(card1, '.bt1__ring-mid');
  if (mid.length) bloom(tl, mid, ringsAt + ringStep * 2, { scale: 0.5, duration: 0.8, fade: 0.3 });

  const outer = inside(card1, '.bt1__ring-outer');
  if (outer.length) bloom(tl, outer, ringsAt + ringStep * 3, { scale: 0.5, duration: 0.8, fade: 0.3 });

  /* The question and note, last, beside the settled rings. */
  const text1 = inside(card1, '.bt1__text');
  if (text1.length) outOfBlur(tl, text1, card1At + step(C1_TEXT), { y: 10, blur: 5, duration: 0.75, fade: 0.3 });

  /* 6. Card two's artwork: the markets, the wires from them, then the
     padlock they run to. */
  const labels2 = inside(card2, '.bt-label');
  if (labels2.length) rise(tl, labels2, card2At + step(C2_LABELS), { y: 10, duration: 0.6, stagger: step(LABEL_STEP), clearProps: 'transform,opacity' });

  /* Nodes are ordered by where they sit, never by source order (the markup
     lists BTC, TSLA, DAX, EUR, XAU). Landscape reads left to right, so `left`
     is the order. Portrait is a ring, so nodes are sorted by bearing about
     the card's centre, clockwise from the highest one. */
  let nodes = inside(card2, '.bt2__node:not(.bt2__node--lock)');
  if (tight && card2 && nodes.length) {
    const cb = card2.getBoundingClientRect();
    const cx = cb.left + cb.width / 2;
    const cy = cb.top + cb.height / 2;
    const bear = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return ((Math.atan2(r.left + r.width / 2 - cx, cy - (r.top + r.height / 2)) * 180) / Math.PI + 360) % 360;
    };
    const top = nodes.reduce((a, b) => (b.getBoundingClientRect().top < a.getBoundingClientRect().top ? b : a));
    const from = bear(top);
    const turn = (el: HTMLElement) => (bear(el) - from + 360) % 360;
    nodes = [...nodes].sort((a, b) => turn(a) - turn(b));
  } else {
    nodes = [...nodes].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  }
  if (nodes.length) {
    bloom(tl, nodes, card2At + step(C2_NODES), { scale: 0.5, y: 10, duration: 0.8, stagger: step(C2_NODE_STEP), fade: 0.32, blur: 5 });
  }

  /* The wires. Landscape: the fan first (it carries four of the five
     markets), then BTC's own link, both opening from the left.

     `mainOff` guards against a wire hidden by the stylesheet: a `fromTo` on a
     `display: none` element would still write its start value and schedule a
     tween that moves no pixels. */
  const fan = inside(card2, '.bt2__fan')[0];
  const main = inside(card2, '.bt2__main')[0];
  const mainOff = !main || getComputedStyle(main).display === 'none';
  if (tight) {
    /* Portrait: both wires are circles (`.bt2__main` the large ring,
       `.bt2__fan` the faint inner one), and a clip-path wipe reveals a circle
       as two horns closing, so they open radially instead. The large ring
       takes the earlier slot, since the markets have just bloomed onto it;
       the inner circle takes the later one, just before the padlock inside
       it. The card builds inward and finishes on the lock. */
    if (main && !mainOff) bloom(tl, main, card2At + step(C2_FAN), { scale: 0.72, duration: 0.85, fade: 0.32 });
    if (fan) bloom(tl, fan, card2At + step(C2_MAIN), { scale: 0.7, duration: 0.75, fade: 0.3 });
  } else {
    if (fan) wipeIn(tl, fan, card2At + step(C2_FAN), mainOff ? step(C2_MAIN - C2_FAN) + 0.75 : 0.85, 0.32, mainOff);
    if (main && !mainOff) wipeIn(tl, main, card2At + step(C2_MAIN), 0.75, 0.3);
  }

  const smear2 = inside(card2, '.bt2__smear');
  if (smear2.length) tl.from(smear2, { opacity: 0, duration: 0.5, ease: 'none', clearProps: 'opacity' }, card2At + step(C2_SMEAR));

  /* SELF-CUSTODY, last on the card, where the wires converge. */
  const lock = inside(card2, '.bt2__node--lock');
  if (lock.length) {
    /* In portrait the padlock and its SELF-CUSTODY label are two objects: the
       label is the node's child but sits as a pill 90 units away on the
       lower arc, so blooming the node would fly the pill in from near the
       centre. The mark and the pill bloom separately, each about its own
       centre, a step apart. In landscape the label sits under the disc and
       the node blooms as one. */
    const mark = tight ? lock[0].querySelector<HTMLElement>('.bt2__whole') : null;
    const pill = tight ? lock[0].querySelector<HTMLElement>('.bt2__label--lock') : null;
    const last = mark && pill ? [mark, pill] : lock;
    bloom(tl, last, card2At + step(C2_LOCK), {
      scale: 0.55, duration: 0.85, fade: 0.34, blur: 6, stagger: step(C2_NODE_STEP),
    });
  }

  /* 7. Each column's copy and CTA. Only the `<a>` moves; the `Roll` spans
     inside it own their transform for the hover. */
  q('.built__col').forEach((col, i) => {
    const parts = Array.from(col.querySelectorAll<HTMLElement>('.built__copy > *'));
    if (!parts.length) return;
    rise(tl, parts, (i === 0 ? card1At : card2At) + step(COPY_IN[i] ?? COPY_IN[COPY_IN.length - 1]), {
      y: 12,
      duration: 0.55,
      stagger: step(COPY_STEP),
      clearProps: 'transform,opacity',
    });
  });

  // The last item on the timeline, reached only by a build that performed
  // the whole entrance. See LANDED.
  tl.call(() => { LANDED.add(el); });
}
