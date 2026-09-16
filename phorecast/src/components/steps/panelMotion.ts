// Motion plumbing local to the steps slider.
//
// The slider mounts exactly one panel at a time (`key={shown}` in Steps.tsx),
// because Chromium paints `backdrop-filter` straight through an `opacity: 0`
// ancestor — a parked, faded-out panel leaks its blurred chrome over the live
// one. So a swap is a real unmount, and the outgoing panel has to be allowed to
// finish leaving *before* React tears it down. That is what `PanelStage` is
// for: the mounted panel publishes an `exit()` that returns how long it needs,
// and the slider waits that long before changing `shown`.
//
// A panel has four layers of motion, and each one is declared by the panel
// itself in a `PanelSpec`:
//
//   enter    the assembly, played once when the panel arrives
//   leave    the departure, played before React unmounts it
//   ambient  endless loops that start the moment the assembly lands
//   pointer  a damped tilt/parallax answer to the cursor, built in here
//
// Everything animates *from* a visible baseline with `gsap.from`, and every
// loop is off under reduced motion, so a panel whose script never runs — or
// whose visitor has asked for less — is exactly the static Figma design.

import { createContext, useContext, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { drawPaths, EASE, REDUCED } from '../../lib/motion';
import { mountField } from './field';
import type { FieldOptions } from './field';

/** Panel internals are placed at Figma coordinates against an 886px frame. */
export const PANEL_W = 886;

const EXIT_EASE = 'power3.in';

export interface PanelHandle {
  /** Plays the leaving timeline. Returns its length in ms (0 = swap now). */
  exit(): number;
}

/**
 * The slot the live panel registers itself into. A ref rather than state: the
 * slider reads it inside an event handler, and it must never cause a render.
 */
export type PanelStageRef = RefObject<PanelHandle | null>;
export const PanelStage = createContext<PanelStageRef | null>(null);

export interface PanelScope {
  /** The `.panel` element. */
  root: HTMLElement;
  /** Scoped query — a panel can never reach outside itself. */
  q: (selector: string) => HTMLElement[];
  /** Same for SVG geometry, which `drawPaths` needs. */
  paths: (selector: string) => SVGGeometryElement[];
  /** One Figma pixel in real pixels, so distances scale with the panel. */
  p: number;
}

export interface PanelMotion extends PanelScope {
  tl: gsap.core.Timeline;
}

export interface PanelSpec {
  enter: (m: PanelMotion) => void;
  leave: (m: PanelMotion) => void;
  /**
   * Endless loops, added to their own container timeline at absolute
   * positions. Started when the entrance lands, never under reduced motion.
   */
  ambient?: (m: PanelMotion) => void;
}

export interface PanelProps {
  /** False until the section has scrolled into view. */
  ready?: boolean;
  /** Seconds to hold, so the first panel builds after the heading and list. */
  delay?: number;
}

/**
 * Builds a panel's entrance when the section is ready, starts its ambient loops
 * behind it, drives the pointer answer, and exposes its exit to the slider.
 *
 * All of it lives in one gsap context scoped to the panel, so unmounting kills
 * every tween and restores every inline style. Panels mount and unmount on a
 * six-second loop, so a leak would compound within a minute.
 */
export function usePanelMotion(
  spec: PanelSpec,
  { ready = false, delay = 0 }: PanelProps,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useContext(PanelStage);
  // Read once: the slider flips `delay` to 0 the moment the first swap is
  // requested, and a dependency change there would rebuild a panel mid-exit.
  const delayRef = useRef(delay);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const scope = gsap.context(() => {}, root);
    let entering: gsap.core.Timeline | null = null;
    let loops: gsap.core.Timeline | null = null;
    let stopPointer = () => {};
    let leaving = false;
    let until = 0;

    const measure = (): PanelScope => ({
      root,
      q: (selector) => Array.from(root.querySelectorAll<HTMLElement>(selector)),
      paths: (selector) => Array.from(root.querySelectorAll<SVGGeometryElement>(selector)),
      p: root.clientWidth / PANEL_W || 1,
    });

    if (ready) {
      scope.add(() => {
        const tl = gsap.timeline({ delay: delayRef.current, defaults: { ease: EASE, duration: 0.6 } });
        entering = tl;
        spec.enter({ ...measure(), tl });
        if (!REDUCED && spec.ambient) {
          // The loops live in their own container, inside the same context: the
          // container is what the departure kills, the context is what unmount
          // reverts.
          tl.call(
            () =>
              scope.add(() => {
                loops = gsap.timeline();
                spec.ambient?.({ ...measure(), tl: loops });
              }),
            undefined,
            // Strictly after the assembly: several entrance tweens hand their
            // element back with clearProps, which would wipe a loop that had
            // already taken the same property.
            '>',
          );
        }
        if (REDUCED) tl.progress(1).kill();
      });
      if (!REDUCED) stopPointer = drivePointer(root);
    }

    const handle: PanelHandle = {
      exit() {
        if (leaving) return Math.max(0, Math.round(until - performance.now()));
        leaving = true;
        if (REDUCED || !ready) return 0;
        stopPointer();
        // The loops and the assembly both have to let go before the departure
        // can take the same properties over.
        entering?.kill();
        loops?.kill();
        entering = null;
        loops = null;
        const ms = scope.add(() => {
          const tl = gsap.timeline({ defaults: { ease: EXIT_EASE, duration: 0.22 } });
          spec.leave({ ...measure(), tl });
          return Math.round(tl.duration() * 1000);
        });
        until = performance.now() + ms;
        return ms;
      },
    };
    if (stage) stage.current = handle;

    return () => {
      if (stage && stage.current === handle) stage.current = null;
      stopPointer();
      scope.revert();
    };
  }, [ready, spec, stage]);

  return ref;
}

/**
 * The panel answers the cursor: the illustration tilts in real perspective, the
 * blurred mark slides the other way behind it and the glow leads. Damped
 * towards the pointer rather than pinned to it, and it eases back to neutral
 * when the pointer leaves rather than snapping.
 *
 * Only `x`/`xPercent` and the rotations are written here; the scroll driver in
 * Steps.tsx owns `y` on the same elements, so the two never fight over a
 * property. Percentages, not pixels, on the illustration — `.s1` and `.s3` are
 * centred with `translate(-50%, -50%)`, which GSAP holds as `x`/`y`.
 */
function drivePointer(root: HTMLElement): () => void {
  const art = root.querySelector<HTMLElement>('.s1, .s2, .s3');
  const mark = root.querySelector<HTMLElement>('.steps__mark');
  const glow = root.querySelector<HTMLElement>('.steps__glow');
  if (!art) return () => {};

  gsap.set(art, { transformPerspective: 1100, transformOrigin: '50% 50%' });
  const rotY = gsap.quickSetter(art, 'rotationY', 'deg');
  const rotX = gsap.quickSetter(art, 'rotationX', 'deg');
  const artX = gsap.quickSetter(art, 'xPercent');
  const markX = mark ? gsap.quickSetter(mark, 'x', 'px') : null;
  const glowX = glow ? gsap.quickSetter(glow, 'x', 'px') : null;

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let frame = 0;

  const run = () => {
    frame = 0;
    // ~0.6s to settle. Slower than instinct says, which is the point.
    cx += (tx - cx) * 0.055;
    cy += (ty - cy) * 0.055;
    rotY(cx * 3.4);
    rotX(cy * -2.4);
    artX(cx * 0.8);
    markX?.(cx * -15);
    glowX?.(cx * 20);
    if (Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015) frame = requestAnimationFrame(run);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(run);
  };

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    wake();
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
    wake();
  };

  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  return () => {
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', onLeave);
    if (frame) cancelAnimationFrame(frame);
  };
}

/** Mounts the shader field on a canvas once the section is in view. */
export function useField(
  ref: RefObject<HTMLCanvasElement | null>,
  options: FieldOptions,
  ready: boolean,
) {
  const opts = useRef(options);
  useEffect(() => {
    const canvas = ref.current;
    if (!ready || !canvas) return;
    let dispose: (() => void) | null = null;
    let done = false;
    mountField(canvas, opts.current).then((d) => {
      if (done) d();
      else dispose = d;
    });
    return () => {
      done = true;
      dispose?.();
    };
  }, [ref, ready]);
}


/* The pacing primitives every panel is built from. MOTION.md: one object
   arrives, lands, and only then do the rest follow; position runs long and
   opacity finishes before it, so nothing is still fading while it is still
   moving. Both return the time the group has finished, so a timeline can be
   written as a sequence of beats rather than a pile of magic numbers. */

/** Transform only — opacity is handed back by its own tween. */
export const CLEAR_T = 'transform,transformOrigin';

export interface ArriveOptions {
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  /** Position duration. 1.1–1.6s for a lead, 0.9–1.3s for followers. */
  dur?: number;
  /** 0.14–0.24s. You should be able to count them. */
  stagger?: number;
  at?: number;
  ease?: string;
  origin?: string;
  /** Opacity duration as a fraction of `dur`. */
  fade?: number;
  /** What to hand back when it lands. `false` keeps the transform, for the
   *  layers the scroll and pointer drivers own. */
  clear?: string | false;
}

export function arrive(
  tl: gsap.core.Timeline,
  targets: Element[],
  { x, y, scale, scaleX, scaleY, dur = 1.1, stagger = 0.18, at = 0, ease = 'power3.out', origin, fade = 0.62, clear = CLEAR_T }: ArriveOptions = {},
): number {
  const list = targets.filter(Boolean);
  if (!list.length) return at;
  const move: gsap.TweenVars = { duration: dur, stagger, ease };
  if (x !== undefined) move.x = x;
  if (y !== undefined) move.y = y;
  if (scale !== undefined) move.scale = scale;
  if (scaleX !== undefined) move.scaleX = scaleX;
  if (scaleY !== undefined) move.scaleY = scaleY;
  if (origin) move.transformOrigin = origin;
  if (clear) move.clearProps = clear;
  if (Object.keys(move).length > 3 || origin) tl.from(list, move, at);
  tl.from(list, { opacity: 0, duration: dur * fade, stagger, ease: 'power2.out', clearProps: 'opacity' }, at);
  return at + dur + stagger * (list.length - 1);
}

export interface DepartOptions {
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  dur?: number;
  stagger?: number;
  at?: number;
  ease?: string;
}

export function depart(
  tl: gsap.core.Timeline,
  targets: Element[],
  { x, y, scale, scaleX, dur = 0.55, stagger = 0.14, at = 0, ease = 'power2.in' }: DepartOptions = {},
): number {
  const list = targets.filter(Boolean);
  if (!list.length) return at;
  const move: gsap.TweenVars = { duration: dur, stagger, ease, opacity: 0 };
  if (x !== undefined) move.x = x;
  if (y !== undefined) move.y = y;
  if (scale !== undefined) move.scale = scale;
  if (scaleX !== undefined) move.scaleX = scaleX;
  tl.to(list, move, at);
  return at + dur + stagger * (list.length - 1);
}

/** The half-beat a group leans the wrong way before it leaves. */
export function anticipate(tl: gsap.core.Timeline, targets: Element[], distance: number, axis: 'x' | 'y' = 'x') {
  const list = targets.filter(Boolean);
  if (!list.length) return;
  tl.to(list, { [axis]: `+=${distance}`, duration: 0.32, ease: 'power2.out' }, 0);
}

/**
 * The rotation baked into an element's CSS transform, in radians. The comets in
 * panel 2 each lie along their own line; reading the angle back off the element
 * means every travel direction stays correct without restating Figma's numbers.
 */
export function angleOf(el: Element): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  const nums = t.slice(t.indexOf('(') + 1, -1).split(',').map(Number);
  if (nums.length < 4) return 0;
  return Math.atan2(nums[1], nums[0]);
}

/**
 * Draws line work on that is rendered as an `<img>`.
 *
 * The strokes of an SVG loaded through `<img>` are unreachable from the page,
 * and inlining the asset instead is not free: both of these are drawn at a size
 * that does not match their intrinsic box, so the image is resampled where
 * inline SVG would be vector-crisp, and the settled panel stops matching Figma.
 * So the exported image stays exactly as it was, and a hidden inline twin does
 * the drawing: the twin is revealed, drawn, then handed back to the image. If
 * this never runs, the twin stays `display: none` and the image is simply
 * there — which is the finished design.
 *
 * With `keep`, the twin is left mounted for an ambient loop to use; the caller
 * is then responsible for making sure it only ever shows a travelling segment.
 */
export function drawOver(
  tl: gsap.core.Timeline,
  image: HTMLElement | undefined,
  twin: HTMLElement | undefined,
  strokes: SVGGeometryElement[],
  { at = 0, duration = 0.6, stagger = 0.06, ease = 'power2.inOut', keep = false } = {},
): number {
  if (!image || !twin || !strokes.length) return at;
  const end = at + duration + stagger * (strokes.length - 1);
  tl.set(twin, { display: 'block' }, at).set(image, { opacity: 0 }, at);
  drawPaths(tl, strokes, { duration, stagger, ease, at });
  tl.set(image, { clearProps: 'opacity' }, end);
  if (!keep) tl.set(twin, { clearProps: 'display' }, end);
  return end;
}

/**
 * Counts a formatted currency figure up. `countTo` in `lib/motion` has no
 * thousands separator and the balance is written `$18,800`, so this keeps the
 * grouping. It lands on the exact final string even if it is interrupted.
 */
export function countMoney(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  to: number,
  { duration = 0.8, prefix = '$', at = '<' }: { duration?: number; prefix?: string; at?: gsap.Position } = {},
) {
  const obj = { v: 0 };
  const fmt = (v: number) => `${prefix}${Math.round(v).toLocaleString('en-US')}`;
  const land = () => {
    el.textContent = fmt(to);
  };
  return tl.to(
    obj,
    {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = fmt(obj.v);
      },
      onComplete: land,
      onInterrupt: land,
    },
    at,
  );
}
