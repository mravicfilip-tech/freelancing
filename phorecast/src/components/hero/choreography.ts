// Hero choreography: one timeline for the page load, one for every slide
// change. Both are built inside a gsap.context owned by Hero.tsx, so reverting
// the context restores every inline style these functions write.
//
// Rules that shape the code below:
//  - every reveal is a `from` tween off the settled state, so a script that
//    never runs leaves the design exactly as the CSS paints it;
//  - elements that carry a CSS transform (the slide-4 chips translate(-50%,-50%),
//    the diamonds rotate 45deg) are only ever scaled or faded, never given an
//    absolute x/y, which would replace the transform they are positioned with;
//  - nothing loops, so there is no idle work to kill when the hero scrolls away.

import { gsap } from 'gsap';
import { EASE, drawPaths, revealIn, revealUp } from '../../lib/motion';

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

/** Copy block in reading order — the same four beats on every slide. */
const COPY = '.eyebrow, .hero__title, .hero__lede, .hero__cta';

/** The floating pieces of each slide, in the order they should arrive. */
const CARDS: Record<string, string> = {
  account: '.pred, .mcard, .mini, .toast, .hv2__tile, .hv2__onchain, .acct-pill',
  bonus: '.stack__bar, .stack__tile, .stack__tag',
  future: '.hv4__tile, .hv4__chip, .hv4__pill, .hv4__tag',
};

/* ------------------------------------------------------------------ visuals */

/**
 * The per-slide illustration. Every one is staggered into groups rather than
 * moved as a block: cards first, then the small badges, then the connectors
 * that tie them together.
 */
function visualIn(tl: gsap.core.Timeline, slide: ParentNode, id: string, at: number) {
  const sel = (s: string) => q(slide, s);

  if (id === 'account') {
    // prediction card → the two market cards → the three minis, then the badge
    // row, then the wires and the "One Account" pill that joins them.
    revealIn(tl, sel('.pred, .mcard, .mini'), { y: 22, stagger: 0.055, duration: 0.6, at });
    revealIn(tl, sel('.toast, .hv2__tile, .hv2__onchain'), { y: 14, stagger: 0.05, duration: 0.5, at: at + 0.22 });
    from(tl, sel('.hv2__y'), { opacity: 0, duration: 0.45, stagger: 0.06 }, at + 0.3);
    // rotate(45deg) in CSS: scale only, never y.
    from(tl, sel('.hv2__diamond'), { opacity: 0, scale: 0.4, duration: 0.4, clearProps: 'transform' }, at + 0.4);
    from(tl, sel('.acct-pill'), { opacity: 0, scale: 0.9, duration: 0.5, clearProps: 'transform' }, at + 0.36);
    return;
  }

  if (id === 'bonus') {
    // the stack builds: the two dark columns settle, the rule and the deposit
    // figure land on them, then the orange match drops in from above.
    from(tl, sel('.stack__col--deposit .stack__bar, .stack__col--base .stack__bar'),
      { y: 12, opacity: 0, duration: 0.5, stagger: 0.028, clearProps: 'transform' }, at);
    from(tl, sel('.stack__rule, .stack__deposit-amt, .stack__cap'),
      { y: 8, opacity: 0, duration: 0.45, stagger: 0.05, clearProps: 'transform' }, at + 0.2);
    from(tl, sel('.stack__col--bonus .stack__bar'),
      { y: -18, opacity: 0, duration: 0.55, stagger: 0.05, clearProps: 'transform' }, at + 0.3);
    from(tl, sel('.stack__bracket'),
      { scaleY: 0, opacity: 0, transformOrigin: '50% 0%', duration: 0.5, clearProps: 'transform' }, at + 0.52);
    from(tl, sel('.stack__total, .stack__adds'),
      { y: 10, opacity: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform' }, at + 0.56);
    revealIn(tl, sel('.stack__tile, .stack__tag'), { y: 10, stagger: 0.07, duration: 0.45, at: at + 0.46 });
    return;
  }

  if (id === 'future') {
    // The circuit is the spine of this slide, so it draws first and everything
    // else arrives along it. `hv4__trace` is the solid stand-in that draws;
    // the dotted design line fades up underneath as the trace leaves.
    const traces = slide.querySelectorAll<SVGGeometryElement>('.hv4__trace');
    if (traces.length) {
      tl.set(traces, { opacity: 1 }, at);
      drawPaths(tl, traces, { duration: 0.72, stagger: 0.09, at, ease: 'power2.inOut' });
      tl.to(traces, { opacity: 0, duration: 0.3, ease: 'power1.out' }, at + 0.62);
    }
    from(tl, sel('.hv4__wire'), { opacity: 0, duration: 0.4, clearProps: 'opacity' }, at + 0.5);
    from(tl, sel('.hv4__ring'), { opacity: 0, scale: 0.92, duration: 0.55, stagger: 0.07, clearProps: 'transform' }, at + 0.12);
    from(tl, sel('.hv4__dot'), { opacity: 0, scale: 0.3, duration: 0.4, stagger: 0.03, clearProps: 'transform' }, at + 0.36);
    from(tl, sel('.hv4__tile'), { opacity: 0, scale: 0.93, duration: 0.65, clearProps: 'transform' }, at + 0.08);
    // translate(-50%, -50%) in CSS: scale only, never y.
    from(tl, sel('.hv4__chip'), { opacity: 0, scale: 0.78, duration: 0.45, stagger: 0.06, clearProps: 'transform' }, at + 0.28);
    from(tl, sel('.hv4__pill, .hv4__line'), { opacity: 0, scale: 0.92, duration: 0.5, stagger: 0.06, clearProps: 'transform' }, at + 0.44);
    from(tl, sel('.hv4__diamond'), { opacity: 0, scale: 0.4, duration: 0.4, clearProps: 'transform' }, at + 0.52);
    revealUp(tl, sel('.hv4__tag'), { y: 8, stagger: 0.08, duration: 0.4, at: at + 0.56 });
  }
}

/* ----------------------------------------------------------------- entrance */

/**
 * The page load. Above the fold, so it runs on mount rather than on scroll.
 * Order of the eye: background, the mark's slot, headline, sub, CTA, ticker.
 */
export function heroEntrance(el: HTMLElement, id: string): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.7 } });
  const slide = el.querySelector('.hero__slide.is-active') ?? el;

  // 0.00 the ground: the glows bloom out of the black, the horizon settles over
  //      them a beat later so the sun reads as rising into its cut.
  from(tl, q(el, '.hero__glow'),
    { opacity: 0, scale: 0.88, duration: 0.9, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }, 0);
  from(tl, q(el, '.hero__horizon'),
    { opacity: 0, yPercent: 3, duration: 0.9, ease: 'power2.out', clearProps: 'transform' }, 0.06);

  // 0.26 the mark. HeroLogo idle-loads Three.js and runs its own 2.2s entrance,
  //      so the timeline leaves it a beat rather than tweening the canvas
  //      underneath it.
  tl.addLabel('mark', 0.26);

  // 0.38 copy, in reading order.
  revealUp(tl, q(slide, '.eyebrow'), { y: 14, duration: 0.55, at: 0.38 });
  revealUp(tl, q(slide, '.hero__title'), { y: 26, duration: 0.7, at: 0.46 });
  revealUp(tl, q(slide, '.hero__lede'), { y: 20, duration: 0.6, at: 0.58 });
  from(tl, q(slide, '.hero__cta'), { y: 14, opacity: 0, scale: 0.96, duration: 0.5, clearProps: 'transform' }, 0.68);

  // 0.76 the position indicator: counter, then the ladder wipes out from its left.
  revealUp(tl, q(el, '.position__counter'), { y: 10, duration: 0.45, at: 0.76 });
  from(tl, q(el, '.position__seg'),
    { scaleX: 0, opacity: 0, transformOrigin: '0% 50%', duration: 0.4, stagger: 0.06, clearProps: 'transform' }, 0.8);

  // 0.86 the ticker row, last, and the slide's own illustration alongside it.
  revealUp(tl, q(el, '.hero__foot .ticker'), { y: 26, stagger: 0.07, duration: 0.6, at: 0.86 });
  visualIn(tl, slide, id, 0.7);

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
}

/**
 * A slide change. The outgoing slide lifts away, the glow group dims through
 * the moment its anchor jumps, then the incoming copy and cards arrive in
 * groups. ~1.2s end to end, well inside the 7s autoplay dwell.
 */
export function heroTransition({ el, fromEl, fromId, toEl, toId, swapBg }: TransitionOpts): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.6 } });
  const bg = el.querySelector('.hero__bg');

  // 0.00 out. The CSS has already dropped the old slide to opacity 0 now that
  //      it has lost .is-active, so hold it up and fade it on our own clock.
  if (fromEl) {
    gsap.set(fromEl, { opacity: 1 });
    // clearProps lands after the slide has already faded out, so the reset is
    // never seen and the slide is left with no inline styles to inherit.
    to(tl, q(fromEl, COPY), { y: -14, duration: 0.3, stagger: 0.035, ease: 'power2.in', clearProps: 'transform' }, 0);
    to(tl, q(fromEl, CARDS[fromId] ?? ''), { y: -14, duration: 0.32, stagger: 0.022, ease: 'power2.in', clearProps: 'transform' }, 0.02);
    to(tl, [fromEl], { opacity: 0, duration: 0.28, ease: 'power2.in', clearProps: 'opacity' }, 0);
  }

  // 0.00 the glows dim, swap anchor at the bottom of the dip, then bloom back.
  if (bg) {
    tl.to(bg, { opacity: 0.32, duration: 0.22, ease: 'power2.in' }, 0)
      .call(swapBg, undefined, 0.22)
      .to(bg, { opacity: 1, duration: 0.6 }, 0.24);
    const glows = q(el, '.hero__glow');
    if (glows.length) {
      tl.fromTo(glows, { scale: 0.94 }, { scale: 1, duration: 0.75, stagger: 0.05, clearProps: 'transform' }, 0.24);
    }
  }

  // 0.30 in. Copy first, then the illustration's groups.
  gsap.set(toEl, { opacity: 1, clearProps: 'transform' });
  revealUp(tl, q(toEl, '.eyebrow'), { y: 16, duration: 0.5, at: 0.3 });
  revealUp(tl, q(toEl, '.hero__title'), { y: 24, duration: 0.6, at: 0.36 });
  revealUp(tl, q(toEl, '.hero__lede'), { y: 18, duration: 0.55, at: 0.44 });
  from(tl, q(toEl, '.hero__cta'), { y: 12, opacity: 0, scale: 0.96, duration: 0.45, clearProps: 'transform' }, 0.5);
  visualIn(tl, toEl, toId, 0.42);

  // Slide 1's ticker row lives outside the slide, under the carousel.
  if (toId === 'mark') revealUp(tl, q(el, '.hero__foot .ticker'), { y: 22, stagger: 0.06, duration: 0.55, at: 0.5 });

  return tl;
}
