// Motion for "Familiar Trading" (Figma 244:1465).
//
// Three things run here, in this order:
//
// 1. The entrance — one timeline, built by `useSectionMotion` the first time the
//    section is on screen. The light wakes, the phone leads, the cluster lands
//    around it card by card with its own weight, and the horizon blooms late as
//    the accent. It ends by dispatching `fam:settled` on the section.
// 2. The life — from `fam:settled` on, one rAF loop drives every floating layer
//    from three inputs composed into a single transform each: where the section
//    is in its scroll pass, a slow idle drift on its own phase, and a damped
//    pointer. The same loop drives the WebGL horizon. It is paused whenever the
//    section is off screen.
// 3. The reactions — per card, per chip, per row: a hover lift fed into the same
//    compose step, so nothing fights over a transform.
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

interface LandOptions {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  duration: number;
  ease: string;
}

function build({ el, q, tl }: SectionMotion) {
  const u = unit(el);
  const one = (selector: string) => el.querySelector<HTMLElement>(selector);
  const CLEAR = 'transform,transformOrigin,opacity';

  /** A card falls into formation. Heavy cards travel further and settle harder. */
  const land = (target: HTMLElement | null, at: number, o: LandOptions) => {
    if (!target) return;
    tl.from(
      target,
      {
        x: (o.x ?? 0) * u,
        y: (o.y ?? -50) * u,
        scale: o.scale ?? 1.1,
        rotation: o.rotation ?? 0,
        duration: o.duration,
        ease: o.ease,
        transformOrigin: '50% 60%',
        clearProps: CLEAR,
      },
      at,
    ).from(target, { opacity: 0, duration: 0.3, ease: 'power2.out' }, at);
  };

  // Beat 1 (0.00) — the light wakes. The glow stack swells and the ground drops
  // back onto its mark, which opens the bright crest up from the bottom edge.
  tl.from(
    q('.fam__g'),
    {
      scale: 0.86,
      opacity: 0.22,
      duration: 1.25,
      stagger: 0.09,
      ease: 'power2.out',
      transformOrigin: '50% 72%',
      clearProps: CLEAR,
    },
    0,
  );
  const horizon = one('.fam__horizon');
  if (horizon) {
    tl.from(horizon, { y: -78 * u, duration: 1.15, ease: 'expo.out', clearProps: CLEAR }, 0.02);
  }

  // Beat 2 (0.12) — the claim.
  const head = [one('.fam__copy--left .eyebrow'), one('.fam__title')].filter(
    (n): n is HTMLElement => !!n,
  );
  revealUp(tl, head, { y: 34 * u, duration: 0.72, stagger: 0.12, at: 0.12 });

  // Beat 3 (0.20) — the phone leads: the heaviest thing here, so the slowest,
  // rising and rolling upright on a real perspective.
  const phone = one('.fam__phone');
  if (phone) {
    tl.from(
      phone,
      {
        y: 130 * u,
        scale: 0.9,
        rotationX: 11,
        transformPerspective: 1600,
        transformOrigin: '50% 100%',
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        clearProps: CLEAR,
      },
      0.2,
    );
  }
  // Its screen fills in behind the glass — light rows, quick, close together.
  tl.from(
    q('.fam__screen > *'),
    { y: 34 * u, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', clearProps: CLEAR },
    0.46,
  );

  // Beat 4 (0.58) — the cluster arrives. Furthest and lightest first, with the
  // most overshoot; the heavy ECB card takes the longest and barely overshoots.
  const ghosts = q('.fam__ghost');
  land(ghosts[0] ?? null, 0.58, { x: 64, y: -54, scale: 1.14, rotation: 3.5, duration: 0.78, ease: 'back.out(1.9)' });
  land(ghosts[1] ?? null, 0.66, { x: 78, y: -40, scale: 1.16, rotation: -3, duration: 0.82, ease: 'back.out(1.7)' });
  land(one('.fam__mkt--ecb'), 0.72, { x: -74, y: -62, scale: 1.1, rotation: -4.5, duration: 0.86, ease: 'back.out(1.05)' });
  land(one('.fam__mkt--nvda'), 0.84, { x: -34, y: -78, scale: 1.08, rotation: 3.5, duration: 0.72, ease: 'back.out(1.45)' });
  land(one('.fam__pred'), 0.96, { x: 76, y: -46, scale: 1.12, rotation: 5, duration: 0.66, ease: 'back.out(1.8)' });

  // Beat 5 (0.80) — the offer.
  revealUp(tl, q('.fam__copy--right > *'), { y: 28 * u, duration: 0.66, stagger: 0.1, at: 0.8 });

  // Beat 6 (1.20) — the horizon blooms, late, as the accent: the cream disc
  // swells and settles back, and the shader layer fades its grain in with it.
  const cream = one('.fam__g--cream');
  if (cream) {
    tl.to(cream, { scale: 1.045, duration: 0.55, ease: 'power2.out', transformOrigin: '50% 62%' }, 1.2)
      .to(cream, { scale: 1, duration: 1, ease: 'power2.inOut', clearProps: CLEAR }, 1.72);
  }

  // Beat 7 (1.34) — the chips bloom outward from the middle of the crest.
  tl.from(
    q('.fam__chips > *'),
    {
      y: 30 * u,
      scale: 0.6,
      opacity: 0,
      duration: 0.55,
      ease: 'back.out(2.2)',
      stagger: { each: 0.06, from: 'center' },
      transformOrigin: '50% 50%',
      clearProps: CLEAR,
    },
    1.34,
  );

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
