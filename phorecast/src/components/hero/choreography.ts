// Hero choreography: one timeline for the page load, one for every slide
// change. Both are built inside a gsap.context owned by Hero.tsx, so reverting
// the context restores every inline style these functions write.
//
// Built to MOTION.md. One object arrives, is allowed to land, then the rest
// follow it in its wake:
//
//   0.0s  the ground — glow and horizon bloom, the only thing on screen
//   ~1.3s the mark has had the stage to itself; the timeline waits for it
//   1.3s  eyebrow, then the headline line by line out of its own mask
//   2.2s  the illustration starts arriving under the headline's tail
//   2.4s  sub, then the CTA
//   2.6s  the position indicator, then the ticker row last and quietest
//   ~4.0s settled
//
// Rules that shape the code: every reveal is a `from` off the settled state, so
// a script that never runs leaves the design as the CSS paints it; opacity
// always finishes before position does; nothing structural overshoots; and the
// two elements that still carry a CSS transform (the diamonds, rotate 45deg)
// are only ever scaled, never given an absolute x/y.

import { gsap } from 'gsap';
import { drawPaths } from '../../lib/motion';
import { countFromRatio } from './ambient';

/** The beat the copy waits for, while the mark has the stage alone. */
export const LEAD = 1.3;

const q = (root: ParentNode, selector: string) =>
  selector ? Array.from(root.querySelectorAll<Element>(selector)) : [];

interface Arrive {
  y?: number;
  x?: number;
  scale?: number;
  /** How long the movement takes. Opacity always finishes well before it. */
  dur?: number;
  stagger?: number | gsap.StaggerVars;
  ease?: string;
}

/**
 * The house arrival. Two tweens on purpose: the move is long and decelerating,
 * the fade is shorter, so nothing is still fading while it is still travelling.
 */
function arrive(
  tl: gsap.core.Timeline,
  targets: Element[],
  at: gsap.Position,
  { y = 22, x, scale, dur = 1.1, stagger = 0.16, ease = 'power3.out' }: Arrive = {},
) {
  if (!targets.length) return;
  tl.from(targets, { y, x, scale, duration: dur, stagger, ease, clearProps: 'transform' }, at);
  tl.from(targets, { opacity: 0, duration: dur * 0.6, stagger, ease: 'power2.out', clearProps: 'opacity' }, at);
}

/** The house departure: shorter than the arrival, and it leads with opacity. */
function leave(
  tl: gsap.core.Timeline,
  targets: Element[],
  at: gsap.Position,
  { y = -18, x, scale, dur = 0.6, stagger = 0.1 }: Arrive = {},
) {
  if (!targets.length) return;
  tl.to(targets, { y, x, scale, duration: dur, stagger, ease: 'power2.in', clearProps: 'transform' }, at);
  tl.to(targets, { opacity: 0, duration: dur * 0.8, stagger, ease: 'power2.in', clearProps: 'opacity' }, at);
}

/** The floating pieces of each slide, for the exit. */
const CARDS: Record<string, string> = {
  mark: '',
  account: '.pred, .mcard, .mini, .toast, .hv2__tile, .hv2__onchain, .acct-pill, .hv2__y',
  bonus: '.stack__bar, .stack__tile, .stack__tag, .stack__total, .stack__adds, .stack__bracket',
  future: '.hv4__tile, .hv4__chip, .hv4__ring, .hv4__dot, .hv4__pill, .hv4__tag',
};

/* ------------------------------------------------------------------ visuals */

/**
 * The per-slide illustration. Each has one lead element that lands alone, then
 * support in its wake, then a late accent — never one uniform stagger across
 * the group. Counted staggers, 0.14–0.22s, so you can see the order.
 */
function visualIn(tl: gsap.core.Timeline, slide: ParentNode, id: string, at: number) {
  const sel = (s: string) => q(slide, s);

  if (id === 'account') {
    // Lead: the prediction card — the thing "one account" is about. The market
    // cards follow, the minis fan in from the outer edge, then the badge row
    // and the pill that ties the cluster to the headline.
    arrive(tl, sel('.pred'), at, { y: 26, scale: 0.97, dur: 1.25, ease: 'expo.out' });
    arrive(tl, sel('.mcard'), at + 0.42, { y: 22, scale: 0.975, dur: 1.1, stagger: 0.18 });
    arrive(tl, sel('.mini'), at + 0.7, { y: 0, x: 24, dur: 1.0, stagger: { each: 0.16, from: 'end' } });
    arrive(tl, sel('.toast, .hv2__tile, .hv2__onchain'), at + 1.0, { y: 16, dur: 0.95, stagger: 0.15 });
    arrive(tl, sel('.hv2__y'), at + 1.15, { y: 0, dur: 0.9, stagger: 0.16 });
    arrive(tl, sel('.acct-pill'), at + 1.3, { y: 18, scale: 0.96, dur: 1.05, ease: 'expo.out' });
    // rotate(45deg) in CSS: scale only, and it is 6px across — an accent.
    tl.from(sel('.hv2__diamond'), { opacity: 0, scale: 0.4, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, at + 1.55);
    return;
  }

  if (id === 'bonus') {
    // Lead: the matched half of the stack, dropping in from above — the one
    // movement on the slide that travels downward, because that is the point.
    arrive(tl, sel('.stack__col--bonus .stack__bar'), at, { y: -24, dur: 1.3, stagger: 0.14, ease: 'expo.out' });
    arrive(tl, sel('.stack__total'), at + 0.5, { y: 16, dur: 1.05 });
    arrive(tl, sel('.stack__col--deposit .stack__bar, .stack__col--base .stack__bar'), at + 0.7,
      { y: 18, dur: 1.0, stagger: { each: 0.05, from: 'end' } });
    arrive(tl, sel('.stack__rule, .stack__deposit-amt, .stack__cap'), at + 1.1, { y: 12, dur: 0.95, stagger: 0.14 });
    tl.from(sel('.stack__bracket'),
      { scaleY: 0, transformOrigin: '50% 0%', duration: 1.0, ease: 'power3.out', clearProps: 'transform' }, at + 1.15);
    tl.from(sel('.stack__bracket'), { opacity: 0, duration: 0.5, clearProps: 'opacity' }, at + 1.15);
    arrive(tl, sel('.stack__adds'), at + 1.35, { y: 0, x: -14, dur: 1.0, ease: 'expo.out' });
    arrive(tl, sel('.stack__tile, .stack__tag'), at + 1.2, { y: 14, scale: 0.96, dur: 0.95, stagger: 0.18 });
    return;
  }

  if (id === 'future') {
    // Lead: the circuit draws itself, alone, before anything sits on it.
    // `hv4__trace` is the solid stand-in that draws; the dotted design line
    // fades up underneath as the trace hands over.
    const traces = slide.querySelectorAll<SVGGeometryElement>('.hv4__trace');
    if (traces.length) {
      tl.set(traces, { opacity: 1, clearProps: 'strokeDasharray,strokeDashoffset' }, at);
      drawPaths(tl, traces, { duration: 1.5, stagger: 0.22, at, ease: 'power2.inOut' });
      tl.to(traces, { opacity: 0, duration: 0.7, ease: 'power1.out' }, at + 1.35);
    }
    tl.from(sel('.hv4__wire'), { opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity' }, at + 1.15);
    // Then the app tile — the mark itself — and the rings around it.
    arrive(tl, sel('.hv4__tile'), at + 0.85, { y: 20, scale: 0.96, dur: 1.35, ease: 'expo.out' });
    arrive(tl, sel('.hv4__ring'), at + 1.2, { y: 0, scale: 0.97, dur: 1.15, stagger: { each: 0.18, from: 'end' } });
    arrive(tl, sel('.hv4__chip'), at + 1.35, { y: 0, scale: 0.96, dur: 1.05, stagger: { each: 0.15, from: 'center' } });
    tl.from(sel('.hv4__dot'), { opacity: 0, scale: 0.35, duration: 0.55, stagger: 0.09, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, at + 1.5);
    arrive(tl, sel('.hv4__pill'), at + 1.7, { y: 0, x: -16, dur: 1.05, ease: 'expo.out' });
    tl.from(sel('.hv4__line'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, ease: 'power2.out', clearProps: 'transform' }, at + 1.95);
    tl.from(sel('.hv4__diamond'), { opacity: 0, scale: 0.45, duration: 0.55, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, at + 2.0);
    arrive(tl, sel('.hv4__tag'), at + 1.85, { y: 12, dur: 0.9, stagger: 0.2 });
  }
}

/* ------------------------------------------------------------------- pieces */

/** The headline, one masked line at a time. The accent of every slide. */
function linesIn(tl: gsap.core.Timeline, slide: ParentNode, at: number, dur: number, stagger: number) {
  const lines = q(slide, '.hero__line-in');
  if (!lines.length) return;
  // Long travel out of a clipping box, so expo — and the fade lands first.
  tl.from(lines, { yPercent: 104, duration: dur, stagger, ease: 'expo.out', clearProps: 'transform' }, at);
  tl.from(lines, { opacity: 0, duration: dur * 0.45, stagger, ease: 'power2.out', clearProps: 'opacity' }, at);
}

/** The position ladder fills from the left; the active segment lands last. */
function ladderIn(tl: gsap.core.Timeline, el: ParentNode, at: number) {
  const segs = q(el, '.position__seg');
  if (!segs.length) return;
  tl.from(segs, {
    scaleX: 0,
    transformOrigin: '0% 50%',
    duration: 0.85,
    stagger: 0.14,
    ease: 'power2.out',
    clearProps: 'transform',
  }, at);
  tl.from(segs, { opacity: 0, duration: 0.5, stagger: 0.14, clearProps: 'opacity' }, at);
}

/* ----------------------------------------------------------------- entrance */

/**
 * The page load. Above the fold, so it runs on mount rather than on scroll.
 * It parks at 1.2s: Hero.tsx releases it once the mark has established itself,
 * which is the beat that makes the opening read as a title sequence rather
 * than a page loading.
 */
export function heroEntrance(el: HTMLElement, id: string): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } });
  const slide = el.querySelector('.hero__slide.is-active') ?? el;

  // 0.00 the ground. Context, so it barely moves: the discs bloom outward from
  //      the middle of the stack over a second and a half, and the horizon
  //      settles over them afterwards so the sun reads as rising into a cut.
  //      (With the shader live the same bloom runs through uIntro instead.)
  const glows = q(el, '.hero__glow');
  if (glows.length) {
    tl.from(glows, { scale: 0.96, duration: 1.7, stagger: { each: 0.16, from: 'center' }, ease: 'expo.out', clearProps: 'transform' }, 0);
    tl.from(glows, { opacity: 0, duration: 1.0, stagger: { each: 0.16, from: 'center' }, ease: 'power2.out', clearProps: 'opacity' }, 0);
  }
  const horizon = q(el, '.hero__horizon');
  if (horizon.length) {
    tl.from(horizon, { yPercent: 2, duration: 1.4, ease: 'power2.out', clearProps: 'transform' }, 0.55);
    tl.from(horizon, { opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity' }, 0.55);
  }

  // 1.20 the mark's beat. HeroLogo idle-loads three and runs its own 2.2s
  //      entrance; the timeline stops here and Hero.tsx resumes it once the
  //      scene exists, so the mark is never talked over.
  tl.addPause(1.2);
  tl.addLabel('copy', LEAD);

  // 1.30 the live dot lights — one small accent ahead of any words.
  tl.from(q(slide, '.eyebrow__dot'),
    { scale: 0.3, opacity: 0, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%', clearProps: 'transform,opacity' }, LEAD);
  arrive(tl, q(slide, '.eyebrow'), LEAD + 0.04, { y: 0, x: -12, dur: 1.0 });

  // 1.62 the headline, line by line out of its own mask. This is the accent.
  linesIn(tl, slide, LEAD + 0.32, 1.35, 0.2);

  // 2.20 the illustration starts under the headline's tail rather than queueing
  //      behind it; on slide 1 there is nothing here and the mark holds.
  visualIn(tl, slide, id, LEAD + 0.9);

  // 2.45 sub, then the CTA. Both shorter than the headline, neither overshoots.
  arrive(tl, q(slide, '.hero__lede'), LEAD + 1.15, { y: 20, dur: 1.15 });
  arrive(tl, q(slide, '.hero__cta'), LEAD + 1.4, { y: 18, scale: 0.97, dur: 1.05 });

  // 2.55 the indicator, then the ticker row last and quietest.
  arrive(tl, q(el, '.position__counter'), LEAD + 1.2, { y: 14, dur: 0.95 });
  ladderIn(tl, el, LEAD + 1.25);

  const tickers = q(el, '.hero__foot .ticker');
  if (tickers.length) {
    arrive(tl, tickers, LEAD + 1.3, { y: 22, dur: 1.0, stagger: { each: 0.14, from: 'start', ease: 'power2.in' } });
    // Each price settles onto its figure instead of simply appearing.
    tickers.forEach((card, i) => {
      const price = card.querySelector<HTMLElement>('.ticker__price');
      if (price) countFromRatio(tl, price, 0.992, 1.3, LEAD + 1.45 + i * 0.14);
    });
  }

  return tl;
}

/* --------------------------------------------------------------- transition */

export interface TransitionOpts {
  el: HTMLElement;
  /** The slide leaving, or null when there is nothing to take off screen. */
  fromEl: HTMLElement | null;
  fromId: string;
  toEl: HTMLElement;
  toId: string;
  /** Flips the background class. Called at the dimmest point of the glow swap. */
  swapBg: () => void;
  /** Runs once the change has settled, so the idle loops can rebind. */
  onSettled: () => void;
}

/**
 * A slide change, led rather than cross-faded. The headline leads both halves:
 * it leaves through the top of its mask first and the rest of the slide follows
 * it out; then it rises into the new one and everything else arrives in its
 * wake. ~2.9s end to end, against a 7s autoplay dwell.
 */
export function heroTransition({ el, fromEl, fromId, toEl, toId, swapBg, onSettled }: TransitionOpts): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.0 }, onComplete: onSettled });
  const bg = el.querySelector('.hero__bg');

  // 0.00 out, led by the headline leaving through the top of its mask. Then
  //      the sub, the CTA, the cards and last the eyebrow — the reverse of the
  //      order they arrived in.
  if (fromEl) {
    gsap.set(fromEl, { opacity: 1 });
    const lines = q(fromEl, '.hero__line-in');
    if (lines.length) {
      tl.to(lines, { yPercent: -104, duration: 0.8, stagger: { each: 0.16, from: 'end' }, ease: 'power3.in', clearProps: 'transform' }, 0);
    }
    leave(tl, q(fromEl, '.hero__lede'), 0.2, { y: -14, dur: 0.6 });
    leave(tl, q(fromEl, '.hero__cta'), 0.3, { y: -12, scale: 0.97, dur: 0.6 });
    // The cards follow the headline out, scattered rather than as a block.
    leave(tl, q(fromEl, CARDS[fromId] ?? ''), 0.15,
      { y: -16, scale: 0.985, dur: 0.7, stagger: { each: 0.055, from: 'random' } });
    leave(tl, q(fromEl, '.eyebrow'), 0.4, { y: 0, x: -12, dur: 0.55 });
    tl.to([fromEl], { opacity: 0, duration: 0.5, ease: 'power2.in', clearProps: 'opacity' }, 0.6);
  }

  // 0.00 the glow. With the shader live its discs travel to the new anchor over
  //      the whole change (driven from Hero.tsx); the CSS fallback cannot move
  //      a `left`, so it dims through the swap instead.
  if (bg) {
    tl.to(bg, { opacity: 0.35, duration: 0.6, ease: 'power2.inOut' }, 0)
      .call(swapBg, undefined, 0.6)
      .to(bg, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.7);
    const glows = q(el, '.hero__glow');
    if (glows.length) {
      tl.fromTo(glows, { scale: 0.96 }, { scale: 1, duration: 1.5, stagger: 0.16, ease: 'expo.out', clearProps: 'transform' }, 0.7);
    }
  }

  // 0.80 in, the headline leading again. Everything else arrives under it.
  gsap.set(toEl, { opacity: 1, clearProps: 'transform' });
  arrive(tl, q(toEl, '.eyebrow'), 0.8, { y: 0, x: -12, dur: 0.95 });
  linesIn(tl, toEl, 0.95, 1.25, 0.18);
  visualIn(tl, toEl, toId, 1.3);
  arrive(tl, q(toEl, '.hero__lede'), 1.55, { y: 18, dur: 1.0 });
  arrive(tl, q(toEl, '.hero__cta'), 1.75, { y: 16, scale: 0.97, dur: 0.95 });

  // 0.95 the indicator answers the change: the counter rolls, the new segment
  //      fills from its left edge.
  arrive(tl, q(el, '.position__current'), 0.95, { y: 14, dur: 0.85 });
  const active = q(el, '.position__seg.is-active');
  if (active.length) {
    tl.from(active, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.1, ease: 'expo.out', clearProps: 'transform' }, 0.95);
  }

  // Slide 1's ticker row lives outside the slide, under the carousel.
  if (toId === 'mark') {
    arrive(tl, q(el, '.hero__foot .ticker'), 1.5,
      { y: 20, dur: 0.95, stagger: { each: 0.14, from: 'start', ease: 'power2.in' } });
  }

  return tl;
}
