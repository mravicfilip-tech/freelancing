// Hero choreography: one timeline for the page load, one for every slide
// change. Both are built inside a gsap.context owned by Hero.tsx, so reverting
// the context restores every inline style these functions write.
//
// The rules that shape the code below:
//  - every reveal is a `from` tween off the settled state, so a script that
//    never runs leaves the design exactly as the CSS paints it;
//  - elements that still carry a CSS transform (the two diamonds rotate 45deg,
//    the lower circuit is flipped) are only ever scaled or faded, never given
//    an absolute x/y;
//  - nothing here loops — idle life lives in ambient.ts.
//
// Direction, not stagger: the headline leads, the sub and the CTA follow it
// down, the illustration starts arriving before the copy has finished, and on
// the way out everything leaves in the reverse of the order it came in.

import { gsap } from 'gsap';
import { EASE, drawPaths, revealUp } from '../../lib/motion';
import { countFromRatio } from './ambient';

const q = (root: ParentNode, selector: string) =>
  selector ? Array.from(root.querySelectorAll<Element>(selector)) : [];

/** `tl.from` that skips an empty list, so a slide without a given part is silent. */
function from(tl: gsap.core.Timeline, targets: Element[], vars: gsap.TweenVars, at: gsap.Position) {
  if (targets.length) tl.from(targets, vars, at);
  return tl;
}

function to(tl: gsap.core.Timeline, targets: Element[], vars: gsap.TweenVars, at: gsap.Position) {
  if (targets.length) tl.to(targets, vars, at);
  return tl;
}

/** The floating pieces of each slide. */
const CARDS: Record<string, string> = {
  mark: '',
  account: '.pred, .mcard, .mini, .toast, .hv2__tile, .hv2__onchain, .acct-pill, .hv2__y',
  bonus: '.stack__bar, .stack__tile, .stack__tag, .stack__total, .stack__adds, .stack__bracket',
  future: '.hv4__tile, .hv4__chip, .hv4__ring, .hv4__dot, .hv4__pill, .hv4__tag',
};

/* ------------------------------------------------------------------ visuals */

/**
 * The per-slide illustration. Each one has a lead element that establishes the
 * idea, a body that fills in around it and a late accent — never one uniform
 * stagger across the whole group.
 */
function visualIn(tl: gsap.core.Timeline, slide: ParentNode, id: string, at: number) {
  const sel = (s: string) => q(slide, s);

  if (id === 'account') {
    // Lead: the prediction card, the thing the headline is about. The market
    // cards follow it in, the minis fan from the far edge, and the badge row
    // and the pill are the late accents that tie them together.
    from(tl, sel('.pred'), { y: 26, scale: 0.97, opacity: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform' }, at);
    from(tl, sel('.mcard'), { y: 22, scale: 0.97, opacity: 0, duration: 0.65, stagger: 0.07, ease: 'expo.out', clearProps: 'transform' }, at + 0.09);
    from(tl, sel('.mini'), { x: 26, opacity: 0, duration: 0.55, stagger: { each: 0.055, from: 'end' }, ease: 'power3.out', clearProps: 'transform' }, at + 0.16);
    from(tl, sel('.toast, .hv2__tile, .hv2__onchain'), { y: 14, opacity: 0, duration: 0.5, stagger: 0.05, clearProps: 'transform' }, at + 0.3);
    from(tl, sel('.hv2__y'), { opacity: 0, duration: 0.5, stagger: 0.07 }, at + 0.36);
    // rotate(45deg) in CSS: scale only, never y.
    from(tl, sel('.hv2__diamond'), { opacity: 0, scale: 0.35, duration: 0.4, ease: 'back.out(2)', clearProps: 'transform' }, at + 0.5);
    from(tl, sel('.acct-pill'), { opacity: 0, scale: 0.88, duration: 0.55, ease: 'back.out(1.4)', clearProps: 'transform' }, at + 0.44);
    return;
  }

  if (id === 'bonus') {
    // The stack builds bottom-up: the two dark columns settle, the rule and the
    // deposit figure land on them, then the matched half drops in from above —
    // the one movement in the slide that goes downward.
    from(tl, sel('.stack__col--deposit .stack__bar, .stack__col--base .stack__bar'),
      { y: 14, opacity: 0, duration: 0.55, stagger: { each: 0.03, from: 'end' }, ease: 'power3.out', clearProps: 'transform' }, at);
    from(tl, sel('.stack__rule, .stack__deposit-amt, .stack__cap'),
      { y: 8, opacity: 0, duration: 0.45, stagger: 0.05, clearProps: 'transform' }, at + 0.22);
    from(tl, sel('.stack__col--bonus .stack__bar'),
      { y: -26, opacity: 0, duration: 0.6, stagger: 0.055, ease: 'power4.out', clearProps: 'transform' }, at + 0.32);
    from(tl, sel('.stack__bracket'),
      { scaleY: 0, opacity: 0, transformOrigin: '50% 0%', duration: 0.5, ease: 'power3.out', clearProps: 'transform' }, at + 0.56);
    from(tl, sel('.stack__total'), { y: 14, opacity: 0, duration: 0.5, ease: 'expo.out', clearProps: 'transform' }, at + 0.58);
    from(tl, sel('.stack__adds'), { x: -12, opacity: 0, duration: 0.5, ease: 'expo.out', clearProps: 'transform' }, at + 0.64);
    from(tl, sel('.stack__tile, .stack__tag'), { y: 10, scale: 0.94, opacity: 0, duration: 0.45, stagger: 0.07, clearProps: 'transform' }, at + 0.5);
    return;
  }

  if (id === 'future') {
    // The circuit is the spine of this slide, so it draws first and everything
    // else arrives along it. `hv4__trace` is the solid stand-in that draws; the
    // dotted design line fades up underneath as the trace hands over.
    const traces = slide.querySelectorAll<SVGGeometryElement>('.hv4__trace');
    if (traces.length) {
      tl.set(traces, { opacity: 1, clearProps: 'strokeDasharray,strokeDashoffset' }, at);
      drawPaths(tl, traces, { duration: 0.8, stagger: 0.1, at, ease: 'power2.inOut' });
      tl.to(traces, { opacity: 0, duration: 0.3, ease: 'power1.out' }, at + 0.7);
    }
    from(tl, sel('.hv4__wire'), { opacity: 0, duration: 0.45, clearProps: 'opacity' }, at + 0.55);
    // The rings come in from the inside out, the dots pop along them.
    from(tl, sel('.hv4__ring'), { opacity: 0, scale: 0.9, duration: 0.6, stagger: { each: 0.08, from: 'end' }, ease: 'expo.out', clearProps: 'transform' }, at + 0.14);
    from(tl, sel('.hv4__dot'), { opacity: 0, scale: 0.2, duration: 0.4, stagger: 0.035, ease: 'back.out(2.4)', clearProps: 'transform' }, at + 0.4);
    from(tl, sel('.hv4__tile'), { opacity: 0, scale: 0.9, duration: 0.75, ease: 'expo.out', clearProps: 'transform' }, at + 0.06);
    from(tl, sel('.hv4__chip'), { opacity: 0, scale: 0.7, duration: 0.5, stagger: { each: 0.065, from: 'center' }, ease: 'back.out(1.6)', clearProps: 'transform' }, at + 0.3);
    from(tl, sel('.hv4__pill'), { opacity: 0, scale: 0.9, x: -14, duration: 0.55, ease: 'expo.out', clearProps: 'transform' }, at + 0.46);
    from(tl, sel('.hv4__line'), { opacity: 0, scaleX: 0, transformOrigin: '0% 50%', duration: 0.35, clearProps: 'transform' }, at + 0.56);
    from(tl, sel('.hv4__diamond'), { opacity: 0, scale: 0.3, duration: 0.4, ease: 'back.out(2)', clearProps: 'transform' }, at + 0.6);
    revealUp(tl, sel('.hv4__tag'), { y: 8, stagger: 0.09, duration: 0.42, at: at + 0.62 });
  }
}

/* ------------------------------------------------------------------- pieces */

/** The headline, one masked line at a time. This is the lead of every slide. */
function linesIn(tl: gsap.core.Timeline, slide: ParentNode, at: number, stagger: number) {
  const lines = q(slide, '.hero__line-in');
  if (!lines.length) return;
  tl.from(lines, {
    yPercent: 106,
    opacity: 0,
    duration: 0.95,
    stagger,
    ease: 'expo.out',
    clearProps: 'transform,opacity',
  }, at);
}

/** The position ladder fills from the left; the active segment lands last. */
function ladderIn(tl: gsap.core.Timeline, el: ParentNode, at: number) {
  const segs = q(el, '.position__seg');
  if (!segs.length) return;
  tl.from(segs, {
    scaleX: 0,
    opacity: 0,
    transformOrigin: '0% 50%',
    duration: 0.5,
    stagger: 0.055,
    ease: 'power2.out',
    clearProps: 'transform',
  }, at);
  const active = q(el, '.position__seg.is-active');
  if (active.length) {
    tl.from(active, { scaleY: 0.2, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'transform' }, at + 0.3);
  }
}

/* ----------------------------------------------------------------- entrance */

/**
 * The page load. Above the fold, so it runs on mount rather than on scroll.
 * Beat by beat: ground, mark, live dot, eyebrow, headline, sub, CTA, indicator,
 * ticker — roughly 1.7s from black to settled.
 */
export function heroEntrance(el: HTMLElement, id: string): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.7 } });
  const slide = el.querySelector('.hero__slide.is-active') ?? el;

  // 0.00 the ground. The discs bloom outward from the middle of the stack; the
  //      horizon arrives late and lands fast, so the sun reads as rising into
  //      a cut rather than the two fading up together. (When the shader takes
  //      the layer over it runs the same bloom through uIntro.)
  from(tl, q(el, '.hero__glow'),
    { opacity: 0, scale: 0.84, duration: 1.1, stagger: { each: 0.055, from: 'center' }, ease: 'expo.out', clearProps: 'transform' }, 0);
  from(tl, q(el, '.hero__horizon'),
    { opacity: 0, yPercent: 4, duration: 0.72, ease: 'power2.out', clearProps: 'transform' }, 0.24);

  // 0.20 the mark's slot. HeroLogo idle-loads three and runs its own 2.2s
  //      entrance, so the timeline leaves it a beat rather than tweening the
  //      canvas underneath it.
  tl.addLabel('mark', 0.2);

  // 0.18 the live dot is the first thing that moves in the copy column — one
  //      small accent ahead of the words.
  from(tl, q(slide, '.eyebrow__dot'),
    { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2.2)', transformOrigin: '50% 50%', clearProps: 'transform' }, 0.18);
  from(tl, q(slide, '.eyebrow'), { x: -14, opacity: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform' }, 0.26);

  // 0.34 the headline, line by line, out of its own mask.
  linesIn(tl, slide, 0.34, 0.085);

  // 0.62 sub and CTA follow the headline down. The CTA is the only thing that
  //      overshoots, and barely.
  from(tl, q(slide, '.hero__lede'), { y: 18, opacity: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' }, 0.62);
  from(tl, q(slide, '.hero__cta'),
    { y: 14, scale: 0.94, opacity: 0, duration: 0.62, ease: 'back.out(1.15)', clearProps: 'transform' }, 0.74);

  // 0.78 the illustration starts before the copy has settled — the two overlap
  //      rather than queueing.
  visualIn(tl, slide, id, 0.78);

  // 0.80 the indicator, then the ticker row last.
  from(tl, q(el, '.position__counter'), { y: 12, opacity: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform' }, 0.8);
  ladderIn(tl, el, 0.84);

  const tickers = q(el, '.hero__foot .ticker');
  if (tickers.length) {
    tl.from(tickers, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: { each: 0.07, from: 'start', ease: 'power2.in' },
      clearProps: 'transform',
    }, 0.86);
    // Each price settles onto its figure instead of simply appearing.
    tickers.forEach((card, i) => {
      const price = card.querySelector<HTMLElement>('.ticker__price');
      if (price) countFromRatio(tl, price, 0.988, 0.9, 0.95 + i * 0.07);
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
 * A slide change, interlocked rather than cross-faded: the old slide unbuilds
 * in the reverse of the order it was built, and the new one has already started
 * arriving before the last of it has gone. ~1.3s end to end, well inside the 7s
 * autoplay dwell.
 */
export function heroTransition({ el, fromEl, fromId, toEl, toId, swapBg, onSettled }: TransitionOpts): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.6 }, onComplete: onSettled });
  const bg = el.querySelector('.hero__bg');

  // 0.00 out, in reverse: CTA, sub, headline (through its mask), eyebrow. The
  //      CSS has already dropped the old slide to opacity 0 now that it has
  //      lost .is-active, so hold it up and take it down on our own clock.
  if (fromEl) {
    gsap.set(fromEl, { opacity: 1 });
    to(tl, q(fromEl, '.hero__cta'), { scale: 0.94, opacity: 0, duration: 0.26, ease: 'power2.in', clearProps: 'transform,opacity' }, 0);
    to(tl, q(fromEl, '.hero__lede'), { y: -12, opacity: 0, duration: 0.28, ease: 'power2.in', clearProps: 'transform,opacity' }, 0.04);
    to(tl, q(fromEl, '.hero__line-in'), { yPercent: -104, duration: 0.42, stagger: { each: 0.05, from: 'end' }, ease: 'power3.in', clearProps: 'transform' }, 0.06);
    to(tl, q(fromEl, '.eyebrow'), { x: -12, opacity: 0, duration: 0.28, ease: 'power2.in', clearProps: 'transform,opacity' }, 0.12);
    // The cards scatter rather than leaving as a block.
    to(tl, q(fromEl, CARDS[fromId] ?? ''),
      { y: -18, scale: 0.985, opacity: 0, duration: 0.32, stagger: { each: 0.022, from: 'random' }, ease: 'power2.in', clearProps: 'transform,opacity' }, 0.02);
    to(tl, [fromEl], { opacity: 0, duration: 0.24, ease: 'power2.in', clearProps: 'opacity' }, 0.2);
  }

  // 0.00 the glow. With the shader live its discs slide to the new anchor over
  //      the whole change (driven from Hero.tsx); the CSS fallback cannot move
  //      a `left`, so it dims through the swap instead.
  if (bg) {
    tl.to(bg, { opacity: 0.32, duration: 0.22, ease: 'power2.in' }, 0)
      .call(swapBg, undefined, 0.22)
      .to(bg, { opacity: 1, duration: 0.7 }, 0.24);
    const glows = q(el, '.hero__glow');
    if (glows.length) {
      tl.fromTo(glows, { scale: 0.94 }, { scale: 1, duration: 0.8, stagger: 0.05, clearProps: 'transform' }, 0.24);
    }
  }

  // 0.28 in. The illustration is already arriving while the headline is still
  //      rising — that overlap is the whole point.
  gsap.set(toEl, { opacity: 1, clearProps: 'transform' });
  from(tl, q(toEl, '.eyebrow'), { x: -12, opacity: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.28);
  linesIn(tl, toEl, 0.32, 0.075);
  visualIn(tl, toEl, toId, 0.3);
  from(tl, q(toEl, '.hero__lede'), { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform' }, 0.56);
  from(tl, q(toEl, '.hero__cta'),
    { y: 12, scale: 0.95, opacity: 0, duration: 0.55, ease: 'back.out(1.15)', clearProps: 'transform' }, 0.66);

  // 0.34 the indicator answers the change: the counter rolls, the new segment
  //      fills from its left edge.
  from(tl, q(el, '.position__current'), { y: 14, opacity: 0, duration: 0.45, ease: 'power3.out', clearProps: 'transform' }, 0.34);
  const active = q(el, '.position__seg.is-active');
  if (active.length) {
    tl.from(active, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, ease: 'expo.out', clearProps: 'transform' }, 0.34);
  }

  // Slide 1's ticker row lives outside the slide, under the carousel.
  if (toId === 'mark') {
    const tickers = q(el, '.hero__foot .ticker');
    if (tickers.length) {
      tl.from(tickers, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: { each: 0.06, from: 'start', ease: 'power2.in' },
        clearProps: 'transform',
      }, 0.5);
    }
  }

  return tl;
}
