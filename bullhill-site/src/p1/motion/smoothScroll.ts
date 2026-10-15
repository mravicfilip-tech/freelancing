import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect } from 'react';
import { motionOn } from './motion';

// Smooth page scrolling for mouse wheels on a desktop. A wheel moves the page in 100px notches while
// the scroll linked motion glides, so the page and the scene moved out of step. Lenis glides the page
// itself between notches. Trackpads and touch already glide and keep native scrolling, and with
// motion off (reduced motion, ?motion=off, automation) nothing runs. Filip, 15 October 2026, "2 yes go".

// A mouse wheel reports lines (Firefox) or a legacy wheelDelta in steps of 120. A trackpad reports
// a wheelDelta of exactly -3 times its delta. Without either, a wheel notch is a large vertical delta.
function isMouseWheel(e: WheelEvent) {
  if (e.deltaMode === 1) return true;
  const wd = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
  if (typeof wd === 'number' && wd !== 0) return Math.abs(wd) % 120 === 0 && wd !== -3 * e.deltaY;
  return Math.abs(e.deltaY) >= 50 && e.deltaX === 0;
}

export function useSmoothScroll() {
  useEffect(() => {
    if (!motionOn() || !window.matchMedia('(pointer: fine)').matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.09,
      anchors: true,
      allowNestedScroll: true,
      // only mouse wheels are smoothed, a trackpad's own events pass to the browser untouched
      virtualScroll: ({ event }) => !(event instanceof WheelEvent) || isMouseWheel(event),
    });
    return () => lenis.destroy();
  }, []);
}
