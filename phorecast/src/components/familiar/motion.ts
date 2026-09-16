// Motion for "Familiar Trading" (Figma 244:1465), built to MOTION.md.
//
// Three things run here, in this order:
//
// 1. The entrance — one timeline, built by `useSectionMotion` the first time the
//    section is on screen. The phone is the lead: it arrives alone, lands, and
//    is given a beat before anything else moves. The heading follows, then the
//    cards settle around the phone one at a time in a spatial order — near left,
//    far left, the two ghosts behind, the prediction card in front — and the
//    horizon glow blooms last and slowest as the closing note. About four
//    seconds end to end, and nothing in it is allowed to feel quick.
// 2. The life — from `fam:settled` on, one rAF loop drives every floating layer
//    from three inputs composed into a single transform each: where the section
//    is in its scroll pass, a long idle drift on its own phase and period, and a
//    damped pointer. The same loop drives the WebGL horizon. Paused off screen.
// 3. The reactions — per card, per chip, per row: a slow hover lift fed into the
//    same compose step, so nothing fights over a transform.
//
// Rules of the house: everything animates *from* the rendered baseline, so a
// section whose script never ran is the static design; at the resting point of
// the scroll pass (the section centred) every layer offset is exactly zero;
// `prefers-reduced-motion: reduce` gets the finished state and no loops at all.
//
// `?still=1` is a review helper, in the spirit of `?slide=`: the entrance runs,
// nothing else does, so a screenshot can be diffed against the static design.

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { REDUCED, revealUp, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { createHorizon } from './horizon';
import type { HorizonLayer } from './horizon';

const TAU = Math.PI * 2;
const clamp = (v: number, min = -1, max = 1) => (v < min ? min : v > max ? max : v);

const STILL =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('still');

/** One design pixel: the stage is laid out in 1920ths, 1400ths under 1100px. */
function unit(el: HTMLElement): number {
  const stage = el.querySelector<HTMLElement>('.fam__stage');
  const design = matchMedia('(max-width: 1100px)').matches ? 1400 : 1920;
  return (stage?.clientWidth || design) / design;
}

/* 1 — The entrance ---------------------------------------------------------- */

interface ArriveOptions {
  /** Travel, in design pixels. Short: MOTION.md wants 16-28, never 80. */
  x?: number;
  y?: number;
  scale?: number;
  duration: number;
  ease?: string;
  stagger?: number | gsap.StaggerVars;
}

function build({ el, q, tl }: SectionMotion) {
  const u = unit(el);
  const one = (selector: string) => el.querySelector<HTMLElement>(selector);
  const CLEAR = 'transform,transformOrigin,opacity';

  /**
   * Something arrives: a long, decelerating move over a short distance, with the
   * fade finishing well before the travel does so nothing is still dissolving
   * while it is still moving.
   */
  const arrive = (targets: HTMLElement | HTMLElement[] | null, at: number, o: ArriveOptions) => {
    const list = (Array.isArray(targets) ? targets : [targets]).filter((n): n is HTMLElement => !!n);
    if (!list.length) return;
    tl.from(
      list,
      {
        x: (o.x ?? 0) * u,
        y: (o.y ?? 22) * u,
        scale: o.scale ?? 1,
        duration: o.duration,
        ease: o.ease ?? 'power3.out',
        stagger: o.stagger,
        transformOrigin: '50% 60%',
        clearProps: CLEAR,
      },
      at,
    ).from(
      list,
      { opacity: 0, duration: o.duration * 0.5, ease: 'power2.out', stagger: o.stagger },
      at,
    );
  };

  // 0.00 — Context. The stage lights come up: the glow stack swells a hair and
  // the ground settles onto its mark. Slow enough to read as light, not motion.
  tl.from(
    q('.fam__g'),
    {
      scale: 0.975,
      opacity: 0.55,
      duration: 1.6,
      stagger: 0.2,
      ease: 'power2.out',
      transformOrigin: '50% 72%',
      clearProps: CLEAR,
    },
    0,
  );
  const horizon = one('.fam__horizon');
  if (horizon) {
    tl.from(horizon, { y: -16 * u, duration: 2.2, ease: 'expo.out', clearProps: CLEAR }, 0.05);
  }

  // 0.12 — The lead. The phone arrives whole, on its own, and is allowed to land
  // before anything else in the section moves: 1.35s for 26 design pixels.
  arrive(one('.fam__phone'), 0.12, { y: 26, scale: 0.975, duration: 1.35, ease: 'power3.out' });

  // 1.47 -> 1.77 — the beat. Nothing moves for a third of a second.

  // 1.77 — The claim, in reading order, countable.
  arrive([one('.fam__copy--left .eyebrow'), one('.fam__title')], 1.77, {
    y: 20,
    duration: 1,
    ease: 'power2.out',
    stagger: 0.18,
  });

  // 2.00 — The cluster settles around the phone, one card at a time, in a
  // spatial order: nearest left, outer left, the two ghosts behind, then the
  // prediction card in front. Each is shorter and smaller than the lead.
  const ghosts = q('.fam__ghost');
  arrive(one('.fam__mkt--ecb'), 2.0, { x: -12, y: 22, scale: 0.97, duration: 1.15 });
  arrive(one('.fam__mkt--nvda'), 2.2, { x: -8, y: 20, scale: 0.97, duration: 1.1 });
  arrive(ghosts[0] ?? null, 2.4, { x: 10, y: 16, scale: 0.98, duration: 1.05, ease: 'power2.out' });
  arrive(ghosts[1] ?? null, 2.58, { x: 12, y: 16, scale: 0.98, duration: 1.05, ease: 'power2.out' });
  arrive(one('.fam__pred'), 2.76, { x: 12, y: 22, scale: 0.97, duration: 1.1 });

  // 2.50 — The offer, under the cluster.
  arrive(q('.fam__copy--right > *'), 2.5, { y: 18, duration: 0.95, ease: 'power2.out', stagger: 0.16 });

  // 2.90 — The chips come up off the crest, outward from the middle.
  arrive(q('.fam__chip-pill'), 2.9, {
    y: 18,
    scale: 0.96,
    duration: 0.9,
    ease: 'power2.out',
    stagger: { each: 0.16, from: 'center' },
  });
  // The two live dots are the only accent small enough to earn an overshoot.
  const dots = q('.fam__chip-dot');
  if (dots.length) {
    tl.from(
      dots,
      { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.14, transformOrigin: '50% 50%', clearProps: CLEAR },
      3.25,
    );
  }

  // 2.95 — The closing note: the horizon blooms, the slowest move in the
  // section. The shader layer fades its grain in over the same beat.
  const cream = one('.fam__g--cream');
  if (cream) {
    tl.to(cream, { scale: 1.03, duration: 1.1, ease: 'sine.inOut', transformOrigin: '50% 62%' }, 2.95)
      .to(cream, { scale: 1, duration: 1.3, ease: 'sine.inOut', clearProps: CLEAR }, 4.05);
  }

  // Hand over to the live layer.
  tl.call(() => el.dispatchEvent(new CustomEvent('fam:settled')));
}

/* 2 — The life ------------------------------------------------------------- */

interface LayerSpec {
  selector: string;
  /** Design px of scroll parallax at the ends of the pass; zero when centred. */
  scroll?: number;
  /** Design px the pointer pulls the layer at the edge of the section. */
  pointer?: number;
  /** Degrees the layer leans toward the pointer. */
  lean?: number;
  /** Degrees of 3D tilt toward the pointer, on a real perspective. */
  tilt?: number;
  /** Idle drift: amplitude in design px, period in seconds, phase in radians. */
  drift?: { amp: number; period: number; phase: number; sway?: number };
  /** Hover lift in design px, and the scale it settles at. */
  hover?: { lift: number; scale: number };
  /** The element carries a translateX(-50%) in CSS that must be preserved. */
  centred?: boolean;
}

// Depth order: the prediction card is nearest, the ground furthest.
const LAYERS: LayerSpec[] = [
  { selector: '.fam__pred', scroll: 64, pointer: 30, lean: 2, drift: { amp: 8, period: 5.8, phase: 1.2, sway: 0.6 }, hover: { lift: -12, scale: 1.035 } },
  { selector: '.fam__mkt--ecb', scroll: 56, pointer: 26, lean: 1.6, drift: { amp: 7, period: 6.5, phase: 0.4, sway: 0.5 }, hover: { lift: -10, scale: 1.03 } },
  { selector: '.fam__mkt--nvda', scroll: 48, pointer: 22, lean: 1.3, drift: { amp: 6, period: 7.4, phase: 2.1, sway: 0.4 }, hover: { lift: -10, scale: 1.03 } },
  { selector: '.fam__phone', scroll: 30, pointer: 10, tilt: 3.4, drift: { amp: 3, period: 9.2, phase: 0.8 } },
  { selector: '.fam__ghost--a', scroll: 22, pointer: 13, lean: 0.8, drift: { amp: 5, period: 8.2, phase: 3.1, sway: 0.4 }, hover: { lift: -6, scale: 1.025 } },
  { selector: '.fam__ghost--b', scroll: 16, pointer: 9, lean: 0.6, drift: { amp: 4, period: 9.6, phase: 4.4, sway: 0.3 }, hover: { lift: -6, scale: 1.025 } },
  { selector: '.fam__copy--right', scroll: 34, pointer: 8 },
  { selector: '.fam__copy--left', scroll: 26, pointer: 6 },
  { selector: '.fam__chips', scroll: 14, pointer: 4, centred: true },
  { selector: '.fam__horizon', scroll: -18, centred: true, drift: { amp: 2.5, period: 13, phase: 0 } },
];

interface Layer {
  spec: LayerSpec;
  el: HTMLElement;
  set: (vars: Record<string, number>) => void;
  /** Tweened by the hover handlers, read by the loop. */
  hover: { y: number; scale: number };
}

/** The ambient pass: what keeps moving when nobody is doing anything. */
function ambientTimeline(el: HTMLElement, u: number): { tl: gsap.core.Timeline; targets: HTMLElement[] } {
  const one = (s: string) => el.querySelector<HTMLElement>(s);
  const tl = gsap.timeline({ paused: true });
  const targets: HTMLElement[] = [];
  const add = (node: HTMLElement | null, vars: gsap.TweenVars, at: gsap.Position = 0) => {
    if (!node) return;
    targets.push(node);
    tl.to(node, { ease: 'sine.inOut', repeat: -1, yoyo: true, ...vars }, at);
  };

  // The live dot means live.
  add(one('.eyebrow__dot'), { opacity: 0.35, duration: 1.15 }, 0);
  // The BTC gauge keeps reading.
  add(one('.fam__gauge'), { rotation: 17, duration: 5.2, transformOrigin: '50% 50%' }, 0);
  // The odds on the prediction card move under the label.
  add(one('.fam__pred-bar i'), { scaleX: 0.955, duration: 4.4, transformOrigin: '0% 50%' }, 0.6);
  // The glow breathes, the two discs out of phase so the crest never sits still.
  add(one('.fam__g--cream'), { scale: 1.035, opacity: 0.92, duration: 9, transformOrigin: '50% 62%' }, 0);
  add(one('.fam__g--orange'), { scale: 1.05, opacity: 0.9, duration: 11.5, transformOrigin: '50% 62%' }, 1.4);
  // The ghost cards breathe against each other.
  add(one('.fam__ghost--a'), { opacity: 0.47, duration: 6.4 }, 0.4);
  add(one('.fam__ghost--b'), { opacity: 0.34, duration: 7.8 }, 1.1);

  // A market card taking a new print: the value blinks out and re-seats, and the
  // trend mark brightens with it. The two cards run on different cycles.
  const refresh = (card: string, delay: number, gap: number) => {
    const value = el.querySelector<HTMLElement>(`${card} .fam__mkt-value`);
    const trend = el.querySelector<HTMLElement>(`${card} .fam__mkt-trend`);
    const foot = el.querySelector<HTMLElement>(`${card} .fam__mkt-foot`);
    if (!value) return;
    targets.push(value);
    if (trend) targets.push(trend);
    if (foot) targets.push(foot);
    const beat = gsap.timeline({ repeat: -1, repeatDelay: gap, delay });
    beat
      .to(value, { opacity: 0.2, y: -5 * u, duration: 0.16, ease: 'power2.in' })
      .to(value, { opacity: 1, y: 0, duration: 0.46, ease: 'power3.out' });
    if (trend) beat.fromTo(trend, { opacity: 0.45 }, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.12);
    if (foot) beat.fromTo(foot, { opacity: 0.72 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.16);
    tl.add(beat, 0);
  };
  refresh('.fam__mkt--nvda', 1.2, 5.4);
  refresh('.fam__mkt--ecb', 3.9, 7.1);

  return { tl, targets };
}

/** Wires the per-element reactions. Returns a teardown. */
function reactions(el: HTMLElement, layers: Layer[], u: number): () => void {
  const off: Array<() => void> = [];

  // Layers are moved by the loop, so hover feeds the same compose step.
  for (const layer of layers) {
    const spec = layer.spec.hover;
    if (!spec) continue;
    const enter = () =>
      gsap.to(layer.hover, { y: spec.lift, scale: spec.scale, duration: 0.34, ease: 'power3.out', overwrite: true });
    const leave = () =>
      gsap.to(layer.hover, { y: 0, scale: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
    layer.el.addEventListener('pointerenter', enter);
    layer.el.addEventListener('pointerleave', leave);
    off.push(() => {
      layer.el.removeEventListener('pointerenter', enter);
      layer.el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(layer.hover);
    });
  }

  // Everything else owns its own transform, so it can be tweened directly.
  const solo: Array<[string, gsap.TweenVars, gsap.TweenVars]> = [
    [
      '.fam__chip-pill',
      { y: -5 * u, scale: 1.06, duration: 0.3, ease: 'back.out(2.4)' },
      { y: 0, scale: 1, duration: 0.45, ease: 'power3.out' },
    ],
    [
      '.fam__event',
      { y: -3 * u, scale: 1.015, duration: 0.32, ease: 'power3.out' },
      { y: 0, scale: 1, duration: 0.5, ease: 'power3.out' },
    ],
    [
      '.fam__chip-dot',
      { scale: 1.5, duration: 0.28, ease: 'back.out(3)' },
      { scale: 1, duration: 0.42, ease: 'power3.out' },
    ],
  ];
  for (const [selector, over, out] of solo) {
    for (const node of Array.from(el.querySelectorAll<HTMLElement>(selector))) {
      const enter = () => gsap.to(node, { ...over, overwrite: true, transformOrigin: '50% 50%' });
      const leave = () => gsap.to(node, { ...out, overwrite: true, clearProps: 'transform,transformOrigin' });
      node.addEventListener('pointerenter', enter);
      node.addEventListener('pointerleave', leave);
      off.push(() => {
        node.removeEventListener('pointerenter', enter);
        node.removeEventListener('pointerleave', leave);
        gsap.killTweensOf(node);
        gsap.set(node, { clearProps: 'transform,transformOrigin' });
      });
    }
  }

  return () => off.forEach((fn) => fn());
}

/**
 * Starts everything that runs after the entrance: the scroll/pointer/drift loop,
 * the ambient timeline, the reactions and the WebGL horizon. Returns a teardown
 * that leaves the DOM exactly as the stylesheet wrote it.
 */
function startLife(el: HTMLElement): () => void {
  const u = unit(el);

  const layers: Layer[] = LAYERS.flatMap((spec) => {
    const node = el.querySelector<HTMLElement>(spec.selector);
    if (!node) return [];
    return [
      {
        spec,
        el: node,
        set: gsap.quickSetter(node, 'css') as (vars: Record<string, number>) => void,
        hover: { y: 0, scale: 1 },
      },
    ];
  });

  const { tl: ambient, targets: ambientTargets } = ambientTimeline(el, u);
  const stopReactions = reactions(el, layers, u);

  // Pointer, damped. Coarse pointers get none of it.
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let rect = el.getBoundingClientRect();
  const onMove = (event: PointerEvent) => {
    // The rect is already read once a frame by the loop; reuse it.
    pointer.tx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointer.ty = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const onLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
  };
  if (fine) {
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
  }

  // The shader horizon, if this browser has one to give.
  let horizon: HorizonLayer | null = null;
  let disposed = false;
  const bloom = { v: 0 };
  const band = el.querySelector<HTMLElement>('.fam__band');
  if (band) {
    void createHorizon(band, band.querySelector<HTMLElement>('.fam__chips')).then((layer) => {
      if (!layer) return;
      if (disposed) {
        layer.dispose();
        return;
      }
      horizon = layer;
      gsap.to(bloom, { v: 1, duration: 1.2, ease: 'power2.out' });
    });
  }

  // The loop takes over from the entrance over half a second, so a section that
  // is already half way up the viewport does not jump when it starts.
  const intro = { v: 0 };
  gsap.to(intro, { v: 1, duration: 0.6, ease: 'power2.out' });

  const started = performance.now();
  let frame = 0;
  let running = false;

  const tick = () => {
    frame = requestAnimationFrame(tick);
    const t = (performance.now() - started) / 1000;
    rect = el.getBoundingClientRect();

    // Where the section is in its pass: -1 below the fold, 0 centred, +1 above.
    const progress = clamp((rect.top + rect.height / 2 - innerHeight / 2) / ((innerHeight + rect.height) / 2));
    pointer.x += (pointer.tx - pointer.x) * 0.075;
    pointer.y += (pointer.ty - pointer.y) * 0.075;
    const k = intro.v;

    for (const layer of layers) {
      const s = layer.spec;
      const drift = s.drift ? Math.sin((t / s.drift.period) * TAU + s.drift.phase) * s.drift.amp : 0;
      const sway = s.drift?.sway ? Math.sin((t / (s.drift.period * 1.37)) * TAU + s.drift.phase + 1.7) * s.drift.sway : 0;
      const pull = s.pointer ?? 0;
      const vars: Record<string, number> = {
        x: pull * pointer.x * u * k,
        y: (progress * (s.scroll ?? 0) + drift + pull * pointer.y * 0.55) * u * k + layer.hover.y * u,
        rotation: (sway + (s.lean ?? 0) * pointer.x) * k,
        scale: layer.hover.scale,
      };
      if (s.centred) vars.xPercent = -50;
      if (s.tilt) {
        vars.transformPerspective = 1600;
        vars.rotationY = s.tilt * pointer.x * k;
        vars.rotationX = -s.tilt * pointer.y * k;
      }
      layer.set(vars);
    }

    horizon?.render(t, bloom.v, Math.sin(t * 0.52));
  };

  // Nothing loops off screen.
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting === running) return;
      running = entry.isIntersecting;
      if (running) {
        ambient.play();
        frame = requestAnimationFrame(tick);
      } else {
        ambient.pause();
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0 },
  );
  io.observe(el);

  return () => {
    disposed = true;
    io.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (fine) {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    }
    stopReactions();
    ambient.kill();
    gsap.killTweensOf([intro, bloom]);
    horizon?.dispose();
    horizon = null;
    if (ambientTargets.length) gsap.set(ambientTargets, { clearProps: 'transform,transformOrigin,opacity' });
    if (layers.length) gsap.set(layers.map((l) => l.el), { clearProps: 'transform,transformOrigin' });
  };
}

/* 3 — The hook ------------------------------------------------------------- */

/** The section ref: the entrance timeline, and the life that follows it. */
export function useFamiliarMotion(): RefObject<HTMLElement | null> {
  const ref = useSectionMotion<HTMLElement>(build, { threshold: 0.12 });

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED || STILL) return;

    let stop: (() => void) | null = null;
    const onSettled = () => {
      if (!stop) stop = startLife(el);
    };
    el.addEventListener('fam:settled', onSettled);

    return () => {
      el.removeEventListener('fam:settled', onSettled);
      stop?.();
      stop = null;
    };
  }, [ref]);

  return ref;
}
