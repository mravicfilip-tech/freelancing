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
// Everything here animates *from* a visible baseline with `gsap.from`, so a
// panel whose script never runs is simply the static Figma design.

import { createContext, useContext, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { drawPaths, EASE, REDUCED } from '../../lib/motion';

/** Panel internals are placed at Figma coordinates against an 886px frame. */
export const PANEL_W = 886;

/** How long the slider holds the outgoing panel before unmounting it. */
export const EXIT_EASE = 'power2.in';

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

export interface PanelMotion {
  /** The `.panel` element. */
  root: HTMLElement;
  /** Scoped query — a panel can never reach outside itself. */
  q: (selector: string) => HTMLElement[];
  /** Same for SVG geometry, which `drawPaths` needs. */
  paths: (selector: string) => SVGGeometryElement[];
  /** One Figma pixel in real pixels, so travel distances scale with the panel. */
  p: number;
  tl: gsap.core.Timeline;
}

export interface PanelProps {
  /** False until the section has scrolled into view. */
  ready?: boolean;
  /** Seconds to hold, so the first panel builds after the heading and list. */
  delay?: number;
}

/**
 * Builds a panel's entrance when the section is ready, and exposes its exit to
 * the slider. The whole thing lives in a gsap context scoped to the panel, so
 * unmounting kills every tween and restores every inline style — panels mount
 * and unmount on a 6s loop, so a leak would compound quickly.
 */
export function usePanelMotion(
  enter: (m: PanelMotion) => void,
  leave: (m: PanelMotion) => void,
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
    let leaving = false;
    let until = 0;

    const measure = () => ({
      root,
      q: (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector)),
      paths: (selector: string) => Array.from(root.querySelectorAll<SVGGeometryElement>(selector)),
      p: root.clientWidth / PANEL_W || 1,
    });

    if (ready) {
      scope.add(() => {
        const tl = gsap.timeline({ delay: delayRef.current, defaults: { ease: EASE, duration: 0.6 } });
        entering = tl;
        enter({ ...measure(), tl });
        if (REDUCED) tl.progress(1).kill();
      });
    }

    const handle: PanelHandle = {
      exit() {
        if (leaving) return Math.max(0, Math.round(until - performance.now()));
        leaving = true;
        if (REDUCED || !ready) return 0;
        entering?.kill();
        const ms = scope.add(() => {
          const tl = gsap.timeline({ defaults: { ease: EXIT_EASE, duration: 0.24 } });
          leave({ ...measure(), tl });
          return Math.round(tl.duration() * 1000);
        });
        until = performance.now() + ms;
        return ms;
      },
    };
    if (stage) stage.current = handle;

    return () => {
      if (stage && stage.current === handle) stage.current = null;
      scope.revert();
    };
  }, [ready, enter, leave, stage]);

  return ref;
}

/**
 * The rotation baked into an element's CSS transform, in radians. The comets in
 * panel 2 each lie along their own line; reading the angle back off the element
 * means the travel direction stays correct without restating Figma's numbers.
 */
export function angleOf(el: Element): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  const nums = t.slice(t.indexOf('(') + 1, -1).split(',').map(Number);
  if (t.startsWith('matrix3d')) return Math.atan2(nums[1], nums[0]);
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
 */
export function drawOver(
  tl: gsap.core.Timeline,
  image: HTMLElement | undefined,
  twin: HTMLElement | undefined,
  strokes: SVGGeometryElement[],
  { at = 0, duration = 0.6, stagger = 0.06, ease = 'power2.inOut' } = {},
) {
  if (!image || !twin || !strokes.length) return;
  const end = at + duration + stagger * (strokes.length - 1);
  tl.set(twin, { display: 'block' }, at).set(image, { opacity: 0 }, at);
  drawPaths(tl, strokes, { duration, stagger, ease, at });
  tl.set(image, { clearProps: 'opacity' }, end).set(twin, { clearProps: 'display' }, end);
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
