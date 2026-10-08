// The scroll side of a story. Creates the engine on the canvas, pins the stage for
// scrollPerBeat x lastBeat pixels, eases story time toward the scroll position, and rests
// inside chapters. onFrame runs on every frame with story time b, for the direction's DOM.
//
// With reduced motion there is no pin and no easing. goTo(b) shows a still frame.

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StoryEngine, type StoryDef } from '../three/engine';

gsap.registerPlugin(ScrollTrigger);

export type StoryOptions = {
  story: StoryDef;
  reduced: boolean;
  scrollPerBeat?: number;
  // story times scroll comes to rest at, defaults to each chapter plus 0.22
  rests?: number[];
  onFrame: (b: number, engine: StoryEngine) => void;
};

export function useStory({ story, reduced, scrollPerBeat = 950, rests, onFrame }: StoryOptions) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StoryEngine | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const bRef = useRef(0);
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;
  const [failed, setFailed] = useState(false);

  const apply = (b: number) => {
    bRef.current = b;
    const e = engineRef.current;
    if (!e) return;
    e.setStory(b);
    frameRef.current(b, e);
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const box = stageRef.current;
    if (!canvas || !box) return;
    let engine: StoryEngine;
    try {
      engine = new StoryEngine(canvas, story);
    } catch {
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    const ro = new ResizeObserver(() => {
      engine.resize(box.clientWidth, box.clientHeight);
      apply(bRef.current);
    });
    ro.observe(box);
    engine.resize(box.clientWidth, box.clientHeight);
    apply(bRef.current);
    return () => {
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, [story]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (reduced) {
      apply(bRef.current);
      return;
    }
    const last = story.lastBeat;
    const points = (rests ?? [0, ...Array.from({ length: last - 1 }, (_, i) => i + 1.22), last]).map((r) => r / last);
    const ctx = gsap.context(() => {
      const state = { b: bRef.current };
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${scrollPerBeat * last}`,
        pin: true,
        anticipatePin: 1,
        snap: {
          snapTo: (v: number) => points.reduce((best, r) => (Math.abs(r - v) < Math.abs(best - v) ? r : best), 0),
          duration: { min: 0.3, max: 1 },
          delay: 0.15,
          ease: 'power2.inOut',
        },
        onUpdate: (self) => {
          gsap.to(state, {
            b: self.progress * last,
            duration: 0.5,
            ease: 'power3.out',
            overwrite: true,
            onUpdate: () => apply(state.b),
          });
        },
        onRefresh: () => requestAnimationFrame(() => apply(state.b)),
      });
    }, stage);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      stRef.current = null;
      ctx.revert();
    };
  }, [reduced, story]);

  const goTo = (b: number) => {
    const st = stRef.current;
    if (!st || reduced) {
      apply(b);
      return;
    }
    window.scrollTo({ top: st.start + ((st.end - st.start) * b) / story.lastBeat, behavior: 'smooth' });
  };

  return { stageRef, canvasRef, failed, goTo };
}

// Helpers for direction DOM layers.
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);

// Window helper. 0 before from, rising to 1 by from + inLen, held, falling to 0 over outLen after to.
export function windowed(b: number, from: number, to: number, inLen = 0.3, outLen = 0.15) {
  return smooth(clamp01((b - from) / inLen)) * (1 - smooth(clamp01((b - to) / outLen)));
}

export function show(el: HTMLElement | null, o: number, y = 0) {
  if (!el) return;
  el.style.opacity = String(o);
  el.style.transform = `translateY(${y}px)`;
  el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  el.inert = o < 0.5;
}
