import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect } from 'react';
import { motionOn } from './motion';

// Smooth page scrolling on a desktop, set as landonorris.com sets it, the reference Filip held up on
// 20 October 2026 as "effortless". Every wheel is smoothed, mouse and trackpad, at a lerp of 0.1, and
// Lenis is stepped on every animation frame. The first version smoothed only what it judged to be a
// mouse wheel, by its step of 120, so a mouse that reports finer steps, a high resolution or free spin
// wheel, scrolled natively in jumps, and its loop slept between gestures. Touch keeps native scrolling,
// and with motion off (reduced motion, ?motion=off, automation) nothing runs.
export function useSmoothScroll() {
  useEffect(() => {
    if (!motionOn() || !window.matchMedia('(pointer: fine)').matches) return;
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.1,
      anchors: true,
      allowNestedScroll: true,
      // a wheel the open menu's scroll lock already stopped is left alone, so the page stays put under it
      virtualScroll: ({ event }) => !event.defaultPrevented,
    });
    let id = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
}
