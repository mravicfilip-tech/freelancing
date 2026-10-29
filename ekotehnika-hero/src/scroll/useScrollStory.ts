// The scroll clock for every variant. Lenis smooths the page scroll, GSAP ScrollTrigger pins the
// stage for length px and scrubs progress from 0 to 1. Read progress.current inside useFrame or a
// requestAnimationFrame loop, never through React state.
//
// The follow is time based, so it feels the same at 30, 60 and 120 fps, and the story clock has a top speed so a hard
// flick plays the beats through at a steady pace. The page scroll itself is never capped.
//
// ?feel=0 is the old per frame follow with no cap. ?feel=1, 2 and 3 cap the clock at 1500, 2500 and 4000 story px a
// second. No parameter means 2. The parameter is read once, when the module loads.
//
// With reduced motion there is no Lenis, no pin and no scrub. goTo(p) sets a still frame.

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

const FEEL_CAPS = [0, 1500, 2500, 4000];
const FEEL = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('feel') ?? 2);
  return Number.isInteger(n) && n >= 0 && n < FEEL_CAPS.length ? n : 2;
})();
// Seconds the speed cap stays lifted after goTo, the 1.4 s jump plus the time the follow takes to catch up.
const JUMP_HOLD = 1.8;

// One Lenis for the page, driven by the GSAP ticker so ScrollTrigger and Lenis share a clock.
function startLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export type ScrollStory = {
  length: number;
  reduced: boolean;
  // progress points where the scroll comes to rest, 0 to 1, leave empty for free scroll
  snap?: number[];
  // a second, smoothed progress that eases toward the scroll, for camera moves
  smoothing?: number;
};

export function useScrollStory({ length, reduced, snap, smoothing = 0.08 }: ScrollStory) {
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const raw = useRef(0);
  const stRef = useRef<ScrollTrigger | null>(null);
  // ticker time until which the speed cap is lifted, set by goTo
  const jumpUntil = useRef(0);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    startLenis();
    const ctx = gsap.context(() => {
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${length}`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        snap: snap?.length
          ? {
              snapTo: (v: number) => snap.reduce((b, r) => (Math.abs(r - v) < Math.abs(b - v) ? r : b), snap[0]),
              duration: { min: 0.3, max: 1.1 },
              delay: 0.12,
              ease: 'power2.inOut',
            }
          : undefined,
        onUpdate: (self) => {
          // The pin start can sit a fraction of a pixel off the top, so the ends are snapped to land on exactly 0 and 1.
          const p = self.progress;
          raw.current = FEEL !== 0 && p * length < 0.05 ? 0 : FEEL !== 0 && (1 - p) * length < 0.05 ? 1 : p;
        },
      });
    }, stage);
    // The old factor per frame was smoothing * 2.2 at 60 fps. The same follow as a rate per second, so a frame of any
    // length moves the same share of the distance.
    const rate = -60 * Math.log(1 - Math.min(smoothing * 2.2, 0.999));
    const cap = FEEL_CAPS[FEEL];
    const tick = (time: number, deltaTime: number) => {
      if (FEEL === 0) {
        progress.current += (raw.current - progress.current) * smoothing * 2.2;
      } else {
        const dt = Math.min(deltaTime / 1000, 0.1);
        let step = (raw.current - progress.current) * (1 - Math.exp(-rate * dt));
        if (time > jumpUntil.current) {
          const max = (cap * dt) / length;
          step = Math.max(-max, Math.min(max, step));
        }
        progress.current += step;
      }
      if (Math.abs(raw.current - progress.current) < 0.00005) progress.current = raw.current;
    };
    gsap.ticker.add(tick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      stRef.current = null;
      ctx.revert();
    };
  }, [length, reduced, smoothing]);

  const goTo = (p: number) => {
    const st = stRef.current;
    if (!st || reduced) {
      raw.current = p;
      progress.current = p;
      return;
    }
    const y = st.start + (st.end - st.start) * p;
    jumpUntil.current = gsap.ticker.time + JUMP_HOLD;
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return { stageRef, progress, raw, goTo };
}

// Helpers for mapping progress onto chapters.
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
// 0 before a, rising to 1 at b
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
// rises over [a, b], holds, falls over [c, d]
export const band = (p: number, a: number, b: number, c: number, d: number) => smooth(range(p, a, b)) * (1 - smooth(range(p, c, d)));
