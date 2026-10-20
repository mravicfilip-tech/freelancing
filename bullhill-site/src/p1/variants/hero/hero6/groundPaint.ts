// The ground tiles' painter, apart from three.js, so a worker can run it. hero6/textures.ts makes the
// textures from it on the page, hero7/groundWorker.ts off the main thread. Canvas 2D, tileable, seeded, so
// the still and the live scene look the same. Colours are low saturation warm greys, soil as it reads in
// BullHill's own photos.

import { rng } from './geometry';

export type Kind = 'asphalt' | 'gravel' | 'backfill' | 'sand';
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export type MakeCanvas = (w: number, h: number) => AnyCanvas;

// Periodic value noise, so a tile repeats without a seam.
export function field(w: number, h: number, seed: number, base: number, octaves: number, gain: number) {
  const out = new Float32Array(w * h);
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const r = rng(seed + o * 101);
    const px = base << o;
    const py = Math.max(1, (base << o) / 2);
    const lat = new Float32Array(px * py);
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * py;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      const ya = (y0 % py) * px;
      const yb = ((y0 + 1) % py) * px;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * px;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const xa = x0 % px;
        const xb = (x0 + 1) % px;
        const a = lat[ya + xa] + (lat[ya + xb] - lat[ya + xa]) * sx;
        const b = lat[yb + xa] + (lat[yb + xb] - lat[yb + xa]) * sx;
        out[y * w + x] += (a + (b - a) * sy) * amp;
      }
    }
    norm += amp;
    amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

const hex = (c: string): [number, number, number] => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Draws a shape at its place and at the wrapped places, so features crossing the tile edge match.
function wrapped(w: number, h: number, x: number, y: number, rx: number, ry: number, draw: (x: number, y: number) => void) {
  for (const ox of [-w, 0, w]) {
    if (x + ox + rx < 0 || x + ox - rx > w) continue;
    for (const oy of [-h, 0, h]) {
      if (y + oy + ry < 0 || y + oy - ry > h) continue;
      draw(x + ox, y + oy);
    }
  }
}

function blob(ctx: Ctx, r: () => number, x: number, y: number, rx: number, ry: number, n: number, fill: string, stroke?: string) {
  const rot = r() * Math.PI;
  const pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const m = 0.72 + r() * 0.34;
    const px = Math.cos(a) * rx * m;
    const py = Math.sin(a) * ry * m;
    pts.push([px * Math.cos(rot) - py * Math.sin(rot), px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

export function paintGround(kind: Kind, make: MakeCanvas, w = 1024, h = 512): AnyCanvas {
  const seed = { asphalt: 11, gravel: 23, backfill: 37, sand: 53 }[kind];
  const r = rng(seed);
  const cv = make(w, h);
  const ctx = cv.getContext('2d', { willReadFrequently: true }) as Ctx;
  const img = ctx.createImageData(w, h);
  const lo = field(w, h, seed, 4, 4, 0.55);
  const hi = field(w, h, seed + 7, 64, 3, 0.6);

  const pal = {
    asphalt: [hex('#1b1b1d'), hex('#2d2d30')],
    gravel: [hex('#24211e'), hex('#3a362f')],
    backfill: [hex('#3b342d'), hex('#6a6053')],
    sand: [hex('#a89d88'), hex('#cfc4ad')],
  }[kind] as [[number, number, number], [number, number, number]];
  for (let i = 0; i < w * h; i++) {
    const t = Math.min(1, Math.max(0, (lo[i] - 0.25) * 1.9 + (hi[i] - 0.5) * 0.7));
    const c = mix(pal[0], pal[1], t);
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const dots = (n: number, rMin: number, rMax: number, colours: string[], alpha: number) => {
    for (let i = 0; i < n; i++) {
      const x = r() * w;
      const y = r() * h;
      const rr = rMin + r() * (rMax - rMin);
      ctx.globalAlpha = alpha * (0.5 + r() * 0.5);
      ctx.fillStyle = colours[Math.floor(r() * colours.length)];
      wrapped(w, h, x, y, rr, rr, (px, py) => {
        ctx.beginPath();
        ctx.ellipse(px, py, rr, rr * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
  };

  if (kind === 'asphalt') {
    dots(5200, 0.6, 1.7, ['#6b6b70', '#8e8e93', '#55555a', '#a3a3a8'], 0.75);
    dots(3000, 0.7, 1.9, ['#0b0b0c', '#141416'], 0.9);
    dots(60, 2.5, 5, ['#4a4a4e', '#5c5c60'], 0.5);
  } else if (kind === 'gravel') {
    const cols = ['#8f897d', '#a39c8f', '#716c63', '#b5ae9f', '#5e5a52', '#938a79', '#7c766b', '#c0b9a9'];
    for (let i = 0; i < 1100; i++) {
      const x = r() * w;
      const y = r() * h;
      const rx = 6 + r() * 15;
      const ry = rx * (0.55 + r() * 0.4);
      const col = cols[Math.floor(r() * cols.length)];
      wrapped(w, h, x, y, rx * 1.3, rx * 1.3, (px, py) => {
        const g = ctx.createLinearGradient(px - rx, py - ry, px + rx, py + ry);
        g.addColorStop(0, col);
        g.addColorStop(1, '#3a3630');
        blob(ctx, rng(i + 5), px, py, rx, ry, 6 + Math.floor(r() * 4), g as unknown as string, '#1b1916');
      });
    }
    dots(4000, 0.6, 1.6, ['#7a7468', '#2a2723', '#999283'], 0.55);
  } else if (kind === 'backfill') {
    dots(5200, 0.8, 2.6, ['#8a7e70', '#9a8f80', '#2c2621'], 0.7);
    for (let i = 0; i < 160; i++) {
      const x = r() * w;
      const y = r() * h;
      const rx = 3 + r() * 6;
      wrapped(w, h, x, y, rx * 1.3, rx * 1.3, (px, py) => blob(ctx, rng(i + 9), px, py, rx, rx * (0.6 + r() * 0.4), 6 + Math.floor(r() * 3), ['#8d877d', '#756f65', '#a39b8c'][i % 3], '#1f1b17'));
    }
    dots(260, 3, 8, ['#4a4036', '#2f2822'], 0.45);
  } else {
    // sand, with faint horizontal bedding
    const bed = field(w, h, seed + 3, 2, 3, 0.5);
    const d = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const b = Math.sin((y / h) * Math.PI * 2 * 5 + bed[y * w] * 4) * 7;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const n = (r() - 0.5) * 20 + b;
        d.data[i] += n;
        d.data[i + 1] += n;
        d.data[i + 2] += n * 0.95;
      }
    }
    ctx.putImageData(d, 0, 0);
    dots(1400, 0.6, 1.4, ['#6d655a', '#857d70'], 0.75);
    dots(400, 0.8, 1.6, ['#e2dacb'], 0.6);
    dots(40, 3, 6, ['#948d80'], 0.5);
  }
  return cv;
}
