// What the hero does when you point at it and when you scroll past it.
//
// Three systems write transforms here and they are deliberately kept to
// separate channels so they can never fight over one element:
//   drift (ambient.ts) owns  y  on the floating cards
//   the pointer field owns   x  on everything it touches
//   scroll depth owns        y  on the structural containers
//   hover owns               scale (and opacity on the neighbours)
// Everything is pushed through gsap.quickSetter, and every listener is
// rAF-throttled and passive.

import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';
import type { GlowState } from './glow/GlowLayer';

const q = (root: ParentNode, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

/** gsap's quickSetter is typed as a bare Function; this is what it really is. */
type Setter = (value: number) => void;
const setter = (el: Element, prop: string, unit?: string): Setter =>
  gsap.quickSetter(el, prop, unit) as Setter;

const FINE = () => typeof matchMedia === 'undefined' || !matchMedia('(hover: none), (pointer: coarse)').matches;

/* -------------------------------------------------------------- the pointer */

/** How far, in px, each layer slides across the full width of the hero. */
const DEPTH: Record<string, [string, number][]> = {
  mark: [],
  account: [
    ['.hv2__y', 4],
    ['.pred', 9],
    ['.mcard', 13],
    ['.mini', 18],
    ['.toast, .hv2__tile, .hv2__onchain', 22],
    ['.acct-pill', 26],
  ],
  bonus: [
    ['.stack__total, .stack__adds', 7],
    ['.stack__col--base .stack__bar, .stack__col--deposit .stack__bar', 10],
    ['.stack__col--bonus .stack__bar', 15],
    ['.stack__tile, .stack__tag', 22],
  ],
  future: [
    ['.hv4__ring', 5],
    ['.hv4__dot', 8],
    ['.hv4__tile', 12],
    ['.hv4__pill, .hv4__tag', 19],
    ['.hv4__chip', 26],
  ],
};

interface Layer {
  set: Setter;
  depth: number;
}

export interface Interact {
  setSlide(id: string, slide: HTMLElement | null): void;
  stop(): void;
}

export function startInteract(el: HTMLElement, glow: GlowState): Interact {
  if (REDUCED) return { setSlide() {}, stop() {} };

  /* ---- pointer field: a damped -1..1 that everything hangs off ---------- */

  const target = { x: 0, y: 0, on: 0 };
  const now = { x: 0, y: 0, on: 0 };
  let layers: Layer[] = [];
  let copyX: Setter | null = null;
  let frame = 0;
  let live = false;

  const bindCopy = () => {
    const copy = el.querySelector<HTMLElement>('.hero__slide.is-active .hero__copy');
    copyX = copy ? setter(copy, 'x', 'px') : null;
  };

  const settle = () => {
    frame = 0;
    // A damped follow, not a 1:1 map — the hero leans, it does not twitch.
    now.x += (target.x - now.x) * 0.075;
    now.y += (target.y - now.y) * 0.075;
    now.on += (target.on - now.on) * 0.08;

    for (const l of layers) l.set(now.x * l.depth);
    copyX?.(now.x * 6);

    // The shader reads the same field: the lens warps, and the lamp term
    // follows the cursor across the glow.
    glow.depth = now.x;
    glow.pointerIn = now.on;
    glow.pointerX = 960 + now.x * 960;
    glow.pointerY = 540 + now.y * 540;

    const rest =
      Math.abs(target.x - now.x) < 0.0015 &&
      Math.abs(target.y - now.y) < 0.0015 &&
      Math.abs(target.on - now.on) < 0.0015;
    if (rest) { live = false; return; }
    frame = requestAnimationFrame(settle);
  };

  const wake = () => {
    live = true;
    if (!frame) frame = requestAnimationFrame(settle);
  };

  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    target.x = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
    target.y = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    target.on = 1;
    if (!live) wake();
  };
  const onLeave = () => { target.x = 0; target.y = 0; target.on = 0; wake(); };

  if (FINE()) {
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
  }

  /* ---- scroll depth: layers separate as the hero leaves ----------------- */

  const stage = el.querySelector<HTMLElement>('.hero__stage');
  const position = el.querySelector<HTMLElement>('.hero__position');
  const bg = el.querySelector<HTMLElement>('.hero__bg');
  const setStage = stage && setter(stage, 'y', 'px');
  const fadeStage = stage && setter(stage, 'opacity');
  const setPos = position && setter(position, 'y', 'px');
  const fadePos = position && setter(position, 'opacity');
  const setBg = bg && setter(bg, 'y', 'px');
  let foot: HTMLElement | null = null;
  let setFoot: Setter | null = null;
  let fadeFoot: Setter | null = null;
  let setVisual: Setter | null = null;

  const bindScrollTargets = () => {
    foot = el.querySelector<HTMLElement>('.hero__foot');
    setFoot = foot ? setter(foot, 'y', 'px') : null;
    fadeFoot = foot ? setter(foot, 'opacity') : null;
    const visual = el.querySelector<HTMLElement>('.hero__slide.is-active .hero__visual');
    setVisual = visual ? setter(visual, 'y', 'px') : null;
  };
  bindScrollTargets();

  let sFrame = 0;
  const readScroll = () => {
    sFrame = 0;
    const r = el.getBoundingClientRect();
    // 0 while the hero owns the screen, 1 once it has fully left upward.
    const p = gsap.utils.clamp(0, 1, -r.top / Math.max(r.height, 1));
    setStage?.(p * -70);
    fadeStage?.(1 - p * 0.55);
    setVisual?.(p * 34);
    setPos?.(p * -120);
    fadePos?.(1 - p);
    setFoot?.(p * -190);
    fadeFoot?.(1 - p * 0.85);
    setBg?.(p * 90);
    glow.scroll = p;
  };
  const onScroll = () => { if (!sFrame) sFrame = requestAnimationFrame(readScroll); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  readScroll();

  /* ---- hover, one element at a time ------------------------------------ */

  let hovers: (() => void)[] = [];

  /** A hover that runs on its own tween, so ten of them never move as one. */
  const hover = (
    node: HTMLElement,
    over: gsap.TweenVars,
    out: gsap.TweenVars,
    extra?: (on: boolean) => void,
  ) => {
    const enter = () => { gsap.to(node, { ...over, duration: 0.34, ease: 'power3.out', overwrite: 'auto' }); extra?.(true); };
    const leave = () => { gsap.to(node, { ...out, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }); extra?.(false); };
    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('focus', enter);
    node.addEventListener('blur', leave);
    hovers.push(() => {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focus', enter);
      node.removeEventListener('blur', leave);
      gsap.killTweensOf(node);
    });
  };

  const bindHovers = (slide: HTMLElement | null) => {
    hovers.forEach((off) => off());
    hovers = [];

    // The CTA: the one thing on the page you can press, so it gets the most.
    q(el, '.hero__slide.is-active .hero__cta').forEach((cta) => {
      hover(cta, { scale: 1.035, y: -3 }, { scale: 1, y: 0 });
      const down = () => gsap.to(cta, { scale: 0.985, duration: 0.12, ease: 'power2.out' });
      const up = () => gsap.to(cta, { scale: 1.035, duration: 0.25, ease: 'power3.out' });
      cta.addEventListener('pointerdown', down);
      cta.addEventListener('pointerup', up);
      hovers.push(() => { cta.removeEventListener('pointerdown', down); cta.removeEventListener('pointerup', up); });
    });

    // Ticker rows: the one you are on lifts, the others step back.
    const tickers = q(el, '.hero__foot .ticker');
    tickers.forEach((card) => {
      hover(
        card,
        { scale: 1.03, y: -8 },
        { scale: 1, y: 0 },
        (on) => {
          const others = tickers.filter((t) => t !== card);
          gsap.to(others, { opacity: on ? 0.55 : 1, duration: on ? 0.35 : 0.5, ease: 'power2.out' });
          const trend = card.querySelector('.ticker__trend');
          if (trend) gsap.to(trend, { x: on ? 3 : 0, y: on ? -3 : 0, duration: 0.4, ease: 'power3.out' });
        },
      );
    });

    // Position ladder: each segment thickens on its own.
    q(el, '.position__seg').forEach((seg) => hover(seg, { scaleY: 2.4 }, { scaleY: 1 }));

    // Floating cards use scale only — drift owns their y, and the neighbours
    // recede so the one under the cursor is the one you are reading.
    if (!slide) return;
    const cards = q(slide, '.pred, .mcard, .mini, .toast, .hv2__tile, .acct-pill, .hv4__chip, .hv4__tile, .hv4__pill, .stack__tile');
    cards.forEach((card) => {
      hover(
        card,
        { scale: 1.04 },
        { scale: 1 },
        (on) => gsap.to(cards.filter((c) => c !== card), { opacity: on ? 0.62 : 1, duration: on ? 0.35 : 0.5, ease: 'power2.out' }),
      );
    });
  };

  bindHovers(null);

  return {
    setSlide(id, slide) {
      layers = [];
      if (slide) {
        for (const [sel, depth] of DEPTH[id] ?? []) {
          q(slide, sel).forEach((node, i, all) => {
            // Within a group each element carries a slightly different depth,
            // so a row of cards fans rather than sliding as a slab.
            const spread = all.length > 1 ? 0.82 + (i / (all.length - 1)) * 0.36 : 1;
            layers.push({ set: setter(node, 'x', 'px'), depth: depth * spread });
          });
        }
        if (id === 'mark') {
          q(el, '.hero__foot .ticker').forEach((node, i) =>
            layers.push({ set: setter(node, 'x', 'px'), depth: 8 + i * 3 }),
          );
        }
      }
      bindCopy();
      bindScrollTargets();
      bindHovers(slide);
      readScroll();
      wake();
    },
    stop() {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (sFrame) cancelAnimationFrame(sFrame);
      hovers.forEach((off) => off());
      hovers = [];
      layers = [];
    },
  };
}
