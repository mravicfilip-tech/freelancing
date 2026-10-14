import { useEffect, useRef } from 'react';
import { waveCam, waveDot, waveNodes, type WaveDot } from '../art';
import { runField, type Env } from './fieldLoop';

// The dotted wave above the FAQ, alive. The same grid, projection, sizes and greys as the still wave,
// on a canvas 2D. Two slow waves roll along its length, about 21 and 14 seconds a cycle, and the
// swell grows by up to 45 percent in the middle of the block's pass through the viewport. Nothing
// draws while it is off screen. With motion off one still frame of the old wave is drawn.

const ROLL = 1;       // radians a second of the roll phase
const SWELL = 0.45;   // extra height at the middle of the pass

export function WaveField({ className, w, h }: { className?: string; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const nodes = waveNodes(w, h);
    const cam = waveCam(w, h);
    const d: WaveDot = { x: 0, y: 0, r: 0, o: 0, t: 1, ok: false };
    return runField(cv, w, h, (ctx: CanvasRenderingContext2D, env: Env) => {
      if (!env.live) {
        for (const n of nodes) {
          waveDot(n, cam, w, 0, 1, d);
          if (!d.ok) continue;
          ctx.globalAlpha = Math.round(d.o * 100) / 100;
          ctx.fillStyle = env.tones[d.t];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      const amp = 1 + SWELL * Math.sin(Math.PI * env.p);
      const t = env.time * ROLL;
      // one path per tone and opacity step, so a frame is a few fills and not a few thousand
      const paths: (Path2D | undefined)[] = [];
      for (const n of nodes) {
        waveDot(n, cam, w, t, amp, d);
        if (!d.ok) continue;
        const b = d.t * 11 + Math.round(d.o * 10);
        const p = (paths[b] ??= new Path2D());
        p.moveTo(d.x + d.r, d.y);
        p.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      paths.forEach((p, b) => {
        if (!p) return;
        ctx.globalAlpha = (b % 11) / 10;
        ctx.fillStyle = env.tones[Math.floor(b / 11)];
        ctx.fill(p);
      });
    });
  }, [w, h]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
