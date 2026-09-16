// Shared motion language, carried over from the Remittix build so the two sites
// move the same way.
//
// The house style, in its words: entrances rise a few pixels on `expo.out`,
// staggered tightly; nothing overshoots, rotates for effect, or floats while
// idle. Each loop is one deterministic story beat that shows the product doing
// its job, then rests.
//
// Sections render with `data-motion="pending"`, which hides the animated parts
// in CSS; the attribute is deleted in the same frame GSAP takes over, and
// immediately when motion is reduced or the build fails. Nothing is ever left
// hidden by a script that did not run.

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

export type Timeline = gsap.core.Timeline;

export const REDUCED =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// GSAP freezes a timeline whenever a frame exceeds half a second, which is the
// wrong default here: the WebGL mark stalls the compositor well past that on a
// weak GPU, and a frozen entrance leaves a section half-built. Advance on
// wall-clock time instead.
gsap.ticker.lagSmoothing(0);

/** The band's entrance ease, and the small rise every element makes as it appears. */
export const EASE = 'expo.out';
export const RISE = { y: 10, opacity: 0, duration: 0.7, ease: EASE } as const;

export const one = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  root.querySelector<T>(sel);
export const all = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Draw stroked paths tip to tail. Elements with no length are skipped. */
export function draw(tl: Timeline, paths: SVGGeometryElement[], at: number, duration: number, stagger = 0) {
  paths
    .filter((p) => typeof p.getTotalLength === 'function' && p.getTotalLength() > 0)
    .forEach((p, i) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(p, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, at + i * stagger);
    });
}

/** Pop in from small. */
export function pop(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { scale: 0.6, opacity: 0, duration: 0.55, ease: 'back.out(1.8)', transformOrigin: '50% 50%', ...vars }, at);
}

/** Rise a few pixels into place — the default entrance for copy and cards. */
export function rise(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { ...RISE, ...vars }, at);
}

/** Count a number into an element. */
export function count(tl: Timeline, el: HTMLElement, from: number, to: number, at: number, duration: number, fmt: (n: number) => string) {
  const o = { v: from };
  tl.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
}

/** Reveal with a clip-path wipe from `from` (an `inset(...)` value) to fully visible. */
export function wipe(tl: Timeline, el: Element, at: number, duration: number, from: string) {
  tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power2.inOut' }, at);
}

/** A gentle bob, out of phase with its neighbours. */
export function bob(el: Element | null, amplitude = 3, seconds = 3, delay = 0) {
  if (el) gsap.to(el, { y: -amplitude, duration: seconds, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/** Roll a figure to a new value: the old slides up and out, the new one in. */
export function roll(el: HTMLElement, next: string) {
  gsap.timeline()
    .to(el, { yPercent: -45, opacity: 0, duration: 0.24, ease: 'power2.in' })
    .add(() => { el.textContent = next; })
    .fromTo(el, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
}

/**
 * Splits text into masked lines so each can rise out of its own mask. Returns
 * the inner spans — the things that move. Idempotent: calling it twice on the
 * same element returns the spans already there.
 */
export function intoLines(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split) return all(el, '.line__in');

  const text = el.textContent ?? '';
  const parts = text.includes('\n') ? text.split('\n') : [text];
  el.textContent = '';
  parts.forEach((part) => {
    const inner = document.createElement('span');
    inner.className = 'line__in';
    inner.textContent = part;
    const mask = document.createElement('span');
    mask.className = 'line';
    mask.appendChild(inner);
    el.appendChild(mask);
  });
  el.dataset.split = 'true';
  return all(el, '.line__in');
}

export interface SectionMotion {
  el: HTMLElement;
  q: (selector: string) => HTMLElement[];
  tl: Timeline;
}

/**
 * Builds a section's entrance the first time it is on screen, then hands the
 * finished timeline to `idle` for its loop. The whole thing lives in a gsap
 * context scoped to the element, so unmounting kills every tween it created.
 *
 * `build` runs against a paused timeline that is released on the next frame, so
 * a slow first paint cannot consume the sequence before anyone sees it.
 */
export function useSectionMotion<T extends HTMLElement = HTMLElement>(
  build: (m: SectionMotion) => void,
  { threshold = 0.15, idle }: { threshold?: number; idle?: (el: HTMLElement) => () => void } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => { delete el.dataset.motion; };

    if (REDUCED) { reveal(); return; }

    let ctx: gsap.Context | undefined;
    let stopIdle: (() => void) | undefined;
    let tl: Timeline | undefined;

    const start = () => {
      // React's StrictMode runs effects twice in development. Without this the
      // entrance builds, is torn down mid-flight, and rebuilds — a visible
      // stutter that looks like a bug and only ever appears in dev. The flag
      // lives on the node so it survives the remount.
      if (el.dataset.motionBuilt) return;
      el.dataset.motionBuilt = '1';
      try {
        ctx = gsap.context(() => {
          tl = gsap.timeline({
            paused: true,
            defaults: { ease: EASE },
            onComplete: () => { if (idle) stopIdle = idle(el); },
          });
          const timeline = tl;
          build({ el, q: (sel) => all(el, sel), tl: timeline });
          reveal();
          requestAnimationFrame(() => timeline.play());
        }, el);
      } catch (err) {
        // A build that throws part way would leave the section hidden. Show it.
        console.warn('[motion] build failed', err);
        reveal();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      start();
    }, { threshold, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);

    return () => {
      io.disconnect();
      stopIdle?.();
      // Settle rather than rewind. Reverting a half-played entrance puts the
      // section back to its start values, which is what made the double-invoke
      // visible; every tween ends on the design, so finishing is always safe.
      tl?.progress(1);
      ctx?.kill();
      reveal();
    };
  }, [build, threshold, idle]);

  return ref;
}
