// Where the shell puts its text, as numbers in the 1440 by 900 drawing. The drawing is fitted to the stage by one slice
// scale, so a screen pixel at 1920 by 1080 is not a drawing unit. The shell grid is in screen pixels (48px margin, 12
// columns, 24px gutters, rules at 136 from the top and 64 from the bottom, see shell.css and Grid.tsx), so every layer that
// has to keep a text column plain reads this and works in columns, whatever the viewport.
import { useLayoutEffect, useState, type RefObject } from 'react';
import { W, H } from './frame';

export type Stage = { w: number; h: number; sc: number; ox: number; oy: number };

export const stageOf = (w: number, h: number): Stage => {
  const sc = Math.max(w / W, h / H);
  return { w, h, sc, ox: (w - W * sc) / 2, oy: (h - H * sc) / 2 };
};

export const STAGE_1440: Stage = stageOf(W, H);

export function useStage(ref: RefObject<HTMLElement | null>): Stage {
  const [s, setS] = useState<Stage>(STAGE_1440);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setS((p) => (Math.abs(p.w - r.width) < 0.5 && Math.abs(p.h - r.height) < 0.5 ? p : stageOf(r.width, r.height)));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

export type Cols = {
  sc: number;
  // drawing units of a screen x, a screen y, and back
  vx: (px: number) => number;
  vy: (py: number) => number;
  // left and right edge of column n (1 to 12), in drawing units
  left: (n: number) => number;
  right: (n: number) => number;
  // the rule under the top row and the rule above the bottom band
  top: number;
  bottom: number;
  // the edges of the visible stage
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

export function colsOf(s: Stage): Cols {
  const cw = (s.w - 96 - 264) / 12;
  const gx = cw + 24;
  const vx = (px: number) => (px - s.ox) / s.sc;
  const vy = (py: number) => (py - s.oy) / s.sc;
  return {
    sc: s.sc,
    vx,
    vy,
    left: (n) => vx(48 + (n - 1) * gx),
    right: (n) => vx(48 + (n - 1) * gx + cw),
    top: vy(136),
    bottom: vy(s.h - 64),
    x0: vx(0),
    x1: vx(s.w),
    y0: vy(0),
    y1: vy(s.h),
  };
}
