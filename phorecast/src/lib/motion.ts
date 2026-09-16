// Shared motion primitives.
//
// Every section animates on the same terms: nothing runs until it is on screen,
// everything is torn down with the component, and a person who has asked for
// less motion gets the finished state immediately rather than a faster version
// of the same movement.

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

export const REDUCED =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The house curve. Fast out of the gate, long settle, no overshoot. */
export const EASE = 'power3.out';

export interface SectionMotion {
  /** The section element itself. */
  el: HTMLElement;
  /** Scoped query, so a build function can never reach into another section. */
  q: (selector: string) => HTMLElement[];
  /** The timeline the section's entrance should be added to. */
  tl: gsap.core.Timeline;
}

/**
 * Runs `build` the first time the element is on screen, inside a gsap context
 * scoped to it. The context is reverted on unmount, which kills every tween the
 * build created and restores inline styles — sections can be remounted (the
 * steps slider does exactly that) without leaking animations.
 */
export function useSectionMotion<T extends HTMLElement = HTMLElement>(
  build: (m: SectionMotion) => void,
  { threshold = 0.15, once = true }: { threshold?: number; once?: boolean } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const built = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ctx: gsap.Context | undefined;

    const start = () => {
      if (built.current && once) return;
      built.current = true;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.7 } });
        build({
          el,
          q: (selector) => Array.from(el.querySelectorAll<HTMLElement>(selector)),
          tl,
        });
        if (REDUCED) tl.progress(1).kill();
      }, el);
    };

    // A section already in view on load should still animate in, so observe
    // rather than checking position once.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          if (once) io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      ctx?.revert();
      built.current = false;
    };
  }, [build, threshold, once]);

  return ref;
}

/** Fades elements up in sequence. The default distance is deliberately small. */
export function revealUp(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  { y = 24, stagger = 0.07, duration = 0.7, at = '<0.08' }: RevealOptions = {},
) {
  const list = toList(targets);
  if (!list.length) return tl;
  return tl.from(list, { y, opacity: 0, duration, stagger, clearProps: 'transform' }, at);
}

/** Scales elements in from slightly under size, for cards and tiles. */
export function revealIn(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  { y = 18, stagger = 0.08, duration = 0.8, at = '<0.1' }: RevealOptions = {},
) {
  const list = toList(targets);
  if (!list.length) return tl;
  return tl.from(
    list,
    { y, scale: 0.97, opacity: 0, duration, stagger, transformOrigin: '50% 60%', clearProps: 'transform' },
    at,
  );
}

/**
 * Draws SVG strokes on. Works on any <path>, <line>, <circle> or <polyline>;
 * elements with no measurable length are skipped rather than left invisible.
 */
export function drawPaths(
  tl: gsap.core.Timeline,
  paths: ArrayLike<SVGGeometryElement> | SVGGeometryElement,
  { duration = 1.2, stagger = 0.06, at = '<0.05', ease = 'power2.inOut' }: DrawOptions = {},
) {
  const list = (paths instanceof SVGElement ? [paths] : Array.from(paths)).filter(
    (p): p is SVGGeometryElement => typeof p.getTotalLength === 'function' && p.getTotalLength() > 0,
  );
  if (!list.length) return tl;

  list.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });

  return tl.to(list, { strokeDashoffset: 0, duration, stagger, ease, clearProps: 'strokeDasharray,strokeDashoffset' }, at);
}

/** Counts a number up. Keeps the element's prefix/suffix (currency, units). */
export function countTo(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  to: number,
  { duration = 1.1, decimals = 0, prefix = '', suffix = '', at = '<0.2' }: CountOptions = {},
) {
  const obj = { v: 0 };
  return tl.to(
    obj,
    {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
      },
    },
    at,
  );
}

/**
 * Gentle endless drift for decorative marks. Each element gets its own phase so
 * a group never moves in lockstep. Returns the tweens so a caller can kill them.
 */
export function drift(
  targets: gsap.TweenTarget,
  { distance = 8, duration = 4, rotate = 0 }: DriftOptions = {},
): gsap.core.Tween[] {
  if (REDUCED) return [];
  return toList(targets).map((el, i) =>
    gsap.to(el, {
      y: i % 2 ? distance : -distance,
      rotate: rotate ? (i % 2 ? rotate : -rotate) : 0,
      duration: duration + (i % 3) * 0.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: (i % 5) * 0.35,
    }),
  );
}

/** Moves an element against the scroll. Returns a cleanup function. */
export function parallax(el: HTMLElement, strength = 0.12): () => void {
  if (REDUCED) return () => {};
  const set = gsap.quickSetter(el, 'y', 'px');
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = el.getBoundingClientRect();
      set((r.top + r.height / 2 - innerHeight / 2) * -strength);
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  return () => {
    removeEventListener('scroll', onScroll);
    if (frame) cancelAnimationFrame(frame);
    gsap.set(el, { y: 0 });
  };
}

const toList = (t: gsap.TweenTarget): HTMLElement[] =>
  typeof t === 'string' ? [] : Array.isArray(t) ? (t as HTMLElement[]) : t ? [t as HTMLElement] : [];

interface RevealOptions {
  y?: number;
  stagger?: number;
  duration?: number;
  at?: gsap.Position;
}

interface DrawOptions {
  duration?: number;
  stagger?: number;
  at?: gsap.Position;
  ease?: string;
}

interface CountOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  at?: gsap.Position;
}

interface DriftOptions {
  distance?: number;
  duration?: number;
  rotate?: number;
}
