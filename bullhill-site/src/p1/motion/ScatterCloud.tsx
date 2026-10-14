import { useEffect, useRef } from 'react';
import { rng, scatterDots } from '../art';
import { runField, type Env } from './fieldLoop';

// The audience dot field, matched to worldquantfoundry's investors and founders field, measured
// from 26 frames at 1440 (one per 100px of scroll). A canvas 2D cloud of points in 3D with a
// perspective projection, in the 720 by 960 units of the old static field, fitted with the same
// xMidYMid slice. The camera flies down the axis as the block scrolls through.
//   far      a vortex of fine dots, about 1px, with three spiral arms, sitting small in the middle
//   fly in   points swell as they near, from 1px to flat translucent discs of about 80px, then fade
//            as they pass. A few points are chunkier in themselves, so big discs are a minority
//   tunnel   after the vortex, rings of dots on a tube, twisted a little so they line up in spokes
// Dot radius is the point's own world size over its depth. Colour is --d1 only, opaque for the
// fine and mid dots, 50 percent for the big discs, as measured. A slow roll about the view axis,
// one turn in three minutes. Big discs are blitted from a pre-rendered sprite so frames stay cheap.
// With motion off one still frame of the old field is drawn and nothing moves.

const VW = 720;
const VH = 960;
const CX = VW / 2;
const CY = VH * 0.48;
const FOCAL = 640;                 // drawing units
const ZN = 0.1;                    // a point past this depth wraps to the back
const LEN = 28;                    // depth the cloud repeats over
const ZMAX = ZN + LEN;
const VORTEX = [7, 12];            // depth of the vortex at the start of the pass
const TUBE = [16.4, 23.9];         // depth of the tunnel rings
const RINGS = 16;
const TRAVEL = 19;                  // camera travel over the block's whole pass
const TURN = (Math.PI * 2) / 180;  // radians a second

type Cloud = { n: number; x: Float32Array; y: Float32Array; z: Float32Array; rho: Float32Array };

function makeCloud(seed: number, n: number, mirror: boolean): Cloud {
  const rand = rng(seed * 7919 + 13);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const rho = new Float32Array(n);
  const nv = Math.round(n * 0.67);
  const per = Math.max(6, Math.round((n - nv) / RINGS));
  const flip = mirror ? -1 : 1;
  let i = 0;
  for (; i < nv; i++) {
    const t = rand();
    const rad = 2.1 * (1 - 0.5 * t) * Math.pow(rand(), 0.6);
    const ang = Math.floor(rand() * 3) * 2.094 + 3 * t + rad * 0.5 + (rand() - 0.5) * 0.8;
    x[i] = Math.cos(ang) * rad * flip;
    y[i] = Math.sin(ang) * rad;
    z[i] = VORTEX[0] + t * (VORTEX[1] - VORTEX[0]);
    rho[i] = 0.007 + 0.07 * Math.pow(rand(), 8);
  }
  for (let k = 0; k < RINGS && i < n; k++) {
    for (let j = 0; j < per && i < n; j++, i++) {
      const ang = (j / per) * Math.PI * 2 + k * 0.28 + (rand() - 0.5) * 0.05;
      const rad = 1.3 * (0.97 + 0.06 * rand());
      x[i] = Math.cos(ang) * rad * flip;
      y[i] = Math.sin(ang) * rad;
      z[i] = TUBE[0] + (k / (RINGS - 1)) * (TUBE[1] - TUBE[0]);
      rho[i] = 0.015 + 0.003 * rand();
    }
  }
  return { n: i, x, y, z, rho };
}

// Flat discs with a feathered edge, three sizes, in the field's own grey.
const SPRITES = [32, 96, 256];
const spriteCache = new Map<string, HTMLCanvasElement[]>();
function sprites(color: string) {
  let s = spriteCache.get(color);
  if (s) return s;
  s = SPRITES.map((d) => {
    const c = document.createElement('canvas');
    c.width = c.height = d;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.94, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, d, d);
    return c;
  });
  spriteCache.set(color, s);
  return s;
}

// Opacity from size, measured. Fine dots dim, mid dots near opaque, big discs about half.
function alphaOf(r: number) {
  if (r < 1.5) return 0.55;
  if (r < 6) return 0.55 + ((r - 1.5) / 4.5) * 0.35;
  if (r < 8) return 0.9;
  if (r < 24) return 0.9 - ((r - 8) / 16) * 0.4;
  return 0.5;
}

const mod = (v: number, m: number) => ((v % m) + m) % m;

export function ScatterCloud({ className, seed, mirror }: { className?: string; seed: number; mirror?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let cloud: Cloud | null = null;
    let still: ReturnType<typeof scatterDots> | null = null;
    const start = (seed % 7) * 0.9;
    return runField(cv, VW, VH, (ctx: CanvasRenderingContext2D, env: Env) => {
      if (!env.live) {
        still ??= scatterDots(VW, VH, seed);
        ctx.fillStyle = env.tones[1];
        for (const d of still) {
          ctx.globalAlpha = d.o;
          ctx.fillStyle = env.tones[d.t === 'r' ? 1 : d.t];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      cloud ??= makeCloud(seed, window.innerWidth < 768 ? 460 : 1400, !!mirror);
      const cam = env.p * TRAVEL;
      const ang = start + env.time * TURN;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const grey = env.tones[1];
      const sp = sprites(grey);
      ctx.fillStyle = grey;
      ctx.imageSmoothingQuality = 'high';
      for (let i = 0; i < cloud.n; i++) {
        const ze = ZN + mod(cloud.z[i] - cam - ZN, LEN);
        const f = FOCAL / ze;
        const r = cloud.rho[i] * f;
        if (r > 120) continue;
        const sx = CX + (cloud.x[i] * c - cloud.y[i] * s) * f;
        const sy = CY + (cloud.x[i] * s + cloud.y[i] * c) * f;
        if (sx < -r || sx > VW + r || sy < -r || sy > VH + r) continue;
        // a little fade as the point passes, and in from the back
        const a = alphaOf(r) * Math.min(1, (ZMAX - ze) / 3) * (r > 60 ? 1 - (r - 60) / 60 : 1);
        ctx.globalAlpha = a;
        if (r < 3.5) {
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(r, 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const d = r * 2 * env.k;
          const img = d <= 36 ? sp[0] : d <= 110 ? sp[1] : sp[2];
          ctx.drawImage(img, sx - r, sy - r, r * 2, r * 2);
        }
      }
    });
  }, [seed, mirror]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
