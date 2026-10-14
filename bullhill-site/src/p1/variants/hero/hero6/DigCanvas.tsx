import { useEffect, useRef } from 'react';
import { grainAt, sampleGround } from './acts';
import { CAMS, VIEWS, project, type View } from './geometry';
import type { Progress } from './progress';

// Beat 4 without WebGL, phones and the stills. The dig cloud as a 2D canvas over the still pair, the
// same grains, timeline and colours as the live scene (hero6/acts.ts), projected with the stills'
// own camera. It draws only when p changes and clears itself once the ground is home. The canvas
// runs 10 percent of the box past it above and below, so the cloud has room over the block.

export const PHONE_POINTS = 600;
const OVER = 0.1;
// the box is small on a phone, so the cloud lifts further in screen space, up over the block's top and clear of the headline
const LIFT_X = 0.02;
const LIFT_Y = -0.07;

export function DigCanvas({ view, progress }: { view: View; progress: Progress }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const grains = sampleGround(PHONE_POINTS, 7);
    const cam = CAMS[view];
    const aspect = VIEWS[view].aspect;
    // one colour per batch, so a frame sets fillStyle a few dozen times and not 600
    const byColour = new Map<string, number[]>();
    grains.forEach((g, i) => {
      const k = byColour.get(g.color);
      if (k) k.push(i);
      else byColour.set(g.color, [i]);
    });
    let dirty = true;
    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.round(cv.clientWidth * dpr);
      h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      dirty = true;
    };
    size();
    let shown = false;
    const draw = (p: number) => {
      const live = p > 0 && p < 1;
      if (!live && !shown && !dirty) return;
      dirty = false;
      ctx.clearRect(0, 0, w, h);
      shown = false;
      if (!live) return;
      const dot = Math.max(3, Math.round((w / cv.clientWidth) * 3));
      const pos = grains.map((g) => grainAt(g, p));
      byColour.forEach((ids, colour) => {
        ctx.fillStyle = colour;
        for (const i of ids) {
          const { pos: q, a, f } = pos[i];
          if (a < 0.01) continue;
          const [px, py] = project(cam, aspect, q);
          const fx = px + LIFT_X * f;
          const fy = py + LIFT_Y * f * aspect;
          ctx.globalAlpha = a;
          ctx.fillRect(Math.round(fx * w - dot / 2), Math.round(((fy + OVER) / (1 + 2 * OVER)) * h - dot / 2), dot, dot);
          shown = true;
        }
      });
      ctx.globalAlpha = 1;
    };
    const ro = new ResizeObserver(() => {
      size();
      draw(progress.sample());
    });
    ro.observe(cv);
    draw(progress.sample());
    const off = progress.subscribe(draw);
    return () => {
      off();
      ro.disconnect();
    };
  }, [view, progress]);
  return <canvas ref={ref} className="hv6__dig" aria-hidden="true" />;
}
