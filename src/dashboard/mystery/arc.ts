/**
 * The Unicorn Studio scene each card shipped with, rebuilt on a 2D canvas so
 * it runs without the Unicorn runtime: the "Lightning Border" pass (an
 * electric arc tracing the rounded border, a white-hot core over a plasma
 * glow in the rarity's colour, jittered by layered 1D noise) and the mouse
 * light trail (a ping-pong buffer in the original; a short list of fading
 * spots here). The noise functions and constants are the shader's own.
 *
 * One canvas serves a whole row of cards rather than one per card: it lies
 * over the row and draws each card's arc where the card currently is, so a
 * reel of forty cards costs the compositor one layer, not forty.
 */
import { RARITY, type Rarity } from './data';

type Row = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  trail: { x: number; y: number; t: number; glow: [number, number, number] }[];
  w: number;
  h: number;
  dpr: number;
  visible: boolean;
};

const rows = new Set<Row>();
let raf = 0;
let t0 = 0;
let lastFrame = 0;

/* ---- the shader's noise, verbatim ---- */
const fract = (x: number) => x - Math.floor(x);
function hash11(p: number) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
function noise1D(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash11(i) + (hash11(i + 1) - hash11(i)) * u;
}
function electricNoise(s: number, t: number) {
  const n1 = noise1D(s * 0.05 + t * 18) - 0.5;
  const n2 = (noise1D(s * 0.15 - t * 32) - 0.5) * 0.5;
  const n3 = (noise1D(s * 0.45 + t * 50) - 0.5) * 0.25;
  return n1 + n2 + n3;
}

/* The shader's settings, then ours on top: the export's jitter was too
   busy at card size, so the arc moves at under half its amplitude and a
   slower clock, and the trail is a faint spot rather than a lamp. */
const JITTER = 0.23 * 14 * 0.4;
const CLOCK = 0.7;
const CORE = 0.5 + 2.5 * 0.07;
const SPREAD = 2.5 + 19.5 * 0.94;
const TRAIL_ALPHA = 0.07;
const TRAIL_R = 22;
const TRAIL_MAX = 10;
const TRAIL_MS = 500;
const R = 11;

/** A point and outward normal at distance `s` along a rounded rectangle. */
function pointAt(s: number, w: number, h: number, r: number, inset: number) {
  const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset;
  const sw = x1 - x0 - 2 * r, sh = y1 - y0 - 2 * r, q = (Math.PI * r) / 2;
  const segs: [number, (u: number) => [number, number, number, number]][] = [
    [sw, (u) => [x0 + r + u, y0, 0, -1]],
    [q, (u) => { const a = -Math.PI / 2 + (u / q) * (Math.PI / 2); return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [sh, (u) => [x1, y0 + r + u, 1, 0]],
    [q, (u) => { const a = (u / q) * (Math.PI / 2); return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [sw, (u) => [x1 - r - u, y1, 0, 1]],
    [q, (u) => { const a = Math.PI / 2 + (u / q) * (Math.PI / 2); return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [sh, (u) => [x0, y1 - r - u, -1, 0]],
    [q, (u) => { const a = Math.PI + (u / q) * (Math.PI / 2); return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
  ];
  for (const [len, f] of segs) {
    if (s <= len) return f(s);
    s -= len;
  }
  return segs[0][1](0);
}

const rgb = ([r, g, b]: [number, number, number], a: number) => `rgba(${r},${g},${b},${a})`;

/** One card's arc, drawn at (ox, oy) in the row's space. */
function arc(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, rarity: Rarity, won: boolean, t: number, still: boolean) {
  const color = RARITY[rarity];
  const hot = won ? 1.7 : 1;
  const time = still ? 0 : t * CLOCK;
  const flicker = still ? 1 : 0.92 + 0.08 * Math.sin(t * 9 + ox * 0.01);
  // Plasma = mix(base, (0.6, 0.9, 1.0), 0.25), as the shader mixes it.
  const plasma: [number, number, number] = [
    Math.round(255 * (color.base[0] * 0.75 + 0.15)),
    Math.round(255 * (color.base[1] * 0.75 + 0.225)),
    Math.round(255 * (color.base[2] * 0.75 + 0.25)),
  ];
  const inset = 1;
  const P = 2 * (w - 2 * inset - 2 * R) + 2 * (h - 2 * inset - 2 * R) + 2 * Math.PI * R;
  const N = Math.max(120, Math.round(P / 4));
  const cx = w / 2, cy = h / 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const s = (i % N) * (P / N);
    const [x, y, nx, ny] = pointAt(s, w, h, R, inset);
    const ang = Math.atan2(y - cy, x - cx);
    const along = (ang / (Math.PI * 2) + 0.5) * P;
    const raw = still ? 0 : electricNoise(along + ox, time);
    const spark = Math.sign(raw) * Math.pow(Math.abs(raw), 1.15);
    const off = spark * JITTER * hot;
    const px = ox + x + nx * off, py = oy + y + ny * off;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  // The glow: the shader's exp falloff, laid down as widening strokes at
  // falling alpha rather than a canvas shadow, which costs a blur per frame.
  const glow = [[SPREAD * 1.6, 0.05], [SPREAD * 1.1, 0.08], [SPREAD * 0.7, 0.12], [SPREAD * 0.4, 0.18], [6, 0.32]] as const;
  for (const [lw, a] of glow) {
    ctx.strokeStyle = rgb(plasma, a * flicker * hot);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.strokeStyle = rgb(color.glow, 0.85 * flicker);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.95 * flicker})`;
  ctx.lineWidth = CORE + 0.3;
  ctx.stroke();
}

function draw(row: Row, now: number, still: boolean) {
  const { ctx, w, h, dpr, root } = row;
  const t = (now - t0) / 1000;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const base = root.getBoundingClientRect();
  for (const el of root.querySelectorAll<HTMLElement>('.prize')) {
    const r = el.getBoundingClientRect();
    const ox = r.left - base.left, oy = r.top - base.top;
    if (ox + r.width < -SPREAD || ox > w + SPREAD || oy + r.height < -SPREAD || oy > h + SPREAD) continue;
    arc(ctx, ox, oy, r.width, r.height, el.dataset.rarity as Rarity, el.dataset.won === 'true', t, still);
  }
  // The light trail: spots the pointer left, fading over half a second.
  if (row.trail.length) {
    ctx.globalCompositeOperation = 'lighter';
    row.trail = row.trail.filter((p) => now - p.t < TRAIL_MS);
    for (const p of row.trail) {
      const a = (1 - (now - p.t) / TRAIL_MS) * TRAIL_ALPHA;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, TRAIL_R);
      g.addColorStop(0, rgb(p.glow, a));
      g.addColorStop(1, rgb(p.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(p.x - TRAIL_R, p.y - TRAIL_R, TRAIL_R * 2, TRAIL_R * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loop(now: number) {
  raf = 0;
  if (document.hidden) return;
  // Thirty frames a second is plenty for an arc; it halves the paint cost.
  if (now - lastFrame >= 30) {
    lastFrame = now;
    for (const row of rows) if (row.visible) draw(row, now, false);
  }
  if (rows.size) raf = requestAnimationFrame(loop);
}
function start() {
  if (!raf && !reduced()) raf = requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => !document.hidden && start());

/** Runs the scene over a row of cards until the returned cleanup is called. */
export function mountRow(root: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  if (!t0) t0 = performance.now();
  const row: Row = { root, canvas, ctx, trail: [], w: 0, h: 0, dpr: Math.min(window.devicePixelRatio || 1, 1.5), visible: false };

  const size = () => {
    const r = root.getBoundingClientRect();
    row.w = Math.round(r.width);
    row.h = Math.round(r.height);
    canvas.width = row.w * row.dpr;
    canvas.height = row.h * row.dpr;
    if (reduced()) draw(row, performance.now(), true);
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(root);
  const io = new IntersectionObserver(([e]) => {
    row.visible = e.isIntersecting;
    if (row.visible) start();
  });
  io.observe(root);
  // With motion off the arcs still have to follow a scroll or a spin.
  const onScroll = () => reduced() && draw(row, performance.now(), true);
  root.addEventListener('scroll', onScroll, { passive: true });

  const onMove = (e: PointerEvent) => {
    if (reduced()) return;
    const card = (e.target as HTMLElement).closest<HTMLElement>('.prize');
    if (!card) return;
    const r = root.getBoundingClientRect();
    row.trail.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), glow: RARITY[card.dataset.rarity as Rarity].glow });
    if (row.trail.length > TRAIL_MAX) row.trail.shift();
  };
  root.addEventListener('pointermove', onMove);

  rows.add(row);
  start();
  return () => {
    rows.delete(row);
    ro.disconnect();
    io.disconnect();
    root.removeEventListener('scroll', onScroll);
    root.removeEventListener('pointermove', onMove);
  };
}

/** Redraw once now: for a still scene after the reel has moved. */
export function redraw() {
  if (!reduced()) return;
  for (const row of rows) draw(row, performance.now(), true);
}
