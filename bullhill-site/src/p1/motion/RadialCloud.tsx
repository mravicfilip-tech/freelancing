import { useEffect, useRef } from 'react';
import { radialDots, radialGeom, radialRings, radialRx } from '../art';
import { runField, type Env } from './fieldLoop';

// The radiating dot field behind the process header, alive, in the same particle language as the
// audience cloud. The 24 rings of the still field keep their dots and their rays, and drift outward
// along them, so a ring born small, dim and fine at the inner edge grows, brightens and spreads as it
// comes forward, then fades as it passes the edge and is born again. Sizes, opacities and greys are
// the still field's own formulas, so the rest frame is the old field. The scroll pushes the rings
// forward, a slow drift and a slow turn, one in three minutes, carry on while it is on screen.
// With motion off one still frame of the old field is drawn.

const SPAN = 0.12;                 // extra depth either side of the rings, where a ring fades in and out
const PERIOD = 1 + 2 * SPAN;
const PUSH = 0.5;                  // ring travel over the pass through the viewport
const DRIFT = 0.02;                // ring travel a second
const TURN = (Math.PI * 2) / 180;  // radians a second

const mod = (v: number, m: number) => ((v % m) + m) % m;

export function RadialCloud({ className, w, h, inner }: { className?: string; w: number; h: number; inner: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = radialGeom(w, h, inner);
    const rings = radialRings(w, h, inner);
    const still = radialDots(w, h, inner);
    return runField(cv, w, h, (ctx: CanvasRenderingContext2D, env: Env) => {
      if (!env.live) {
        for (const d of still) {
          ctx.globalAlpha = d.o;
          ctx.fillStyle = env.tones[d.t === 'r' ? 1 : d.t];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      const s = env.p * PUSH + env.time * DRIFT;
      const turn = env.time * TURN;
      const paths: (Path2D | undefined)[] = [];
      for (const ring of rings) {
        const u = mod(ring.t + s + SPAN, PERIOD) - SPAN;
        const rx = u >= 0 ? radialRx(g, u) : g.inner * (1 + 0.9 * u);
        const ry = rx * 0.6;
        const near = Math.min(1, Math.max(0, u));
        const r = 0.9 + near * 2.3;
        const fade = u < 0 ? 1 + u / SPAN : u > 1 ? 1 - (u - 1) / SPAN : 1;
        const o = (0.35 + 0.55 * near) * fade;
        const tone = near < 0.4 ? 3 : near < 0.7 ? 2 : 1;
        const b = tone * 11 + Math.round(o * 10);
        for (let k = 0; k < ring.n; k++) {
          const a = ring.off + (k / ring.n) * Math.PI * 2 + turn;
          const x = g.cx + Math.cos(a) * rx;
          const y = g.cy + Math.sin(a) * ry;
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
          const p = (paths[b] ??= new Path2D());
          p.moveTo(x + r, y);
          p.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      paths.forEach((p, b) => {
        if (!p) return;
        ctx.globalAlpha = (b % 11) / 10;
        ctx.fillStyle = env.tones[Math.floor(b / 11)];
        ctx.fill(p);
      });
    });
  }, [w, h, inner]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
