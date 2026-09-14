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

type Spark = { x: number; y: number; vx: number; vy: number; born: number; ttl: number; r: number; glow: [number, number, number] };
type Row = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  trail: { x: number; y: number; t: number; glow: [number, number, number] }[];
  sparks: Spark[];
  last: number;
  w: number;
  h: number;
  dpr: number;
  visible: boolean;
};

const rows = new Set<Row>();
const byRoot = new WeakMap<HTMLElement, Row>();
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
const TRAIL_ALPHA = 0.05;
const TRAIL_R = 20;
const TRAIL_MAX = 4;
const TRAIL_MS = 450;
const TRAIL_STEP = 8;
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
function arc(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, rarity: Rarity, won: boolean, t: number, still: boolean, clip: boolean) {
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
  // On a light ground the glow that spills past the card reads as a smudge,
  // so there the scene is kept inside the card's own edge.
  if (clip) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ox, oy, w, h, R + 1);
    ctx.clip();
  }
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
  if (clip) ctx.restore();
}

/** The centre marker while the reel flies: a thicker lime arc, jittering
    like the card borders, so the line the prize will stop on has the same
    charge as the prizes passing it. */
function marker(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, light: boolean) {
  const time = t * CLOCK * 1.6;
  const flicker = 0.9 + 0.1 * Math.sin(t * 11);
  const x0 = w / 2;
  ctx.beginPath();
  for (let y = -4; y <= h + 4; y += 3) {
    const raw = electricNoise(y * 1.3 + 500, time);
    const spark = Math.sign(raw) * Math.pow(Math.abs(raw), 1.15);
    const x = x0 + spark * JITTER * 2.6;
    if (y === -4) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Lime on the dark stage; the theme's indigo on the light one, where a white core would vanish.
  const hue: [number, number, number] = light ? [64, 66, 210] : [217, 242, 78];
  const core: [number, number, number] = light ? [51, 53, 187] : [255, 255, 255];
  const glow = [[30, 0.06], [18, 0.1], [10, 0.18], [5, 0.32]] as const;
  for (const [lw, a] of glow) {
    ctx.strokeStyle = rgb(hue, a * flicker);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.strokeStyle = rgb(hue, 0.95 * flicker);
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = rgb(core, 0.9 * flicker);
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/* The crate's silhouette in its own 401.5 × 406 space: the lid's back and
   right corners, down the right foot, the front foot, the left foot and up
   the left corner. The lid corners are crate.ts's TOP; the feet are where
   the drawing bottoms out. */
let CRATE: [number, number][] = [[205.2, 1.9], [398, 84.2], [398, 305], [199.3, 405], [3.9, 306], [3.9, 80.9]];
/** The chest hands over its real silhouette once it has measured its strokes. */
export function setChestOutline(pts: [number, number][]) {
  if (pts.length >= 3) CRATE = pts;
}

/** An electric outline round a polygon: the card's arc, on the chest's silhouette. */
function outline(ctx: CanvasRenderingContext2D, pts: [number, number][], rarity: Rarity, t: number) {
  const color = RARITY[rarity];
  const time = t * CLOCK;
  const flicker = 0.92 + 0.08 * Math.sin(t * 9);
  const plasma: [number, number, number] = [
    Math.round(255 * (color.base[0] * 0.75 + 0.15)),
    Math.round(255 * (color.base[1] * 0.75 + 0.225)),
    Math.round(255 * (color.base[2] * 0.75 + 0.25)),
  ];
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  ctx.beginPath();
  let along = 0;
  let first = true;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x1 - x0, y1 - y0);
    let nx = (y1 - y0) / len, ny = -(x1 - x0) / len;
    if ((x0 - cx) * nx + (y0 - cy) * ny < 0) { nx = -nx; ny = -ny; }
    for (let d = 0; d <= len; d += 3) {
      const raw = electricNoise(along + d, time);
      const spark = Math.sign(raw) * Math.pow(Math.abs(raw), 1.15);
      const off = spark * JITTER;
      const x = x0 + ((x1 - x0) * d) / len + nx * off;
      const y = y0 + ((y1 - y0) * d) / len + ny * off;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    along += len;
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  // The card's inner passes only: the two widest bloom past a crate's lower
  // edges as a wash, where on a card's rounded corners they read as halo.
  // A third stronger than the card's inner passes: the crate is a bigger, darker object.
  const glow = [[SPREAD * 0.7, 0.13], [SPREAD * 0.4, 0.21], [7, 0.39]] as const;
  for (const [lw, a] of glow) {
    ctx.strokeStyle = rgb(plasma, a * flicker);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.strokeStyle = rgb(color.glow, 1 * flicker);
  ctx.lineWidth = 2.3;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${1 * flicker})`;
  ctx.lineWidth = (CORE + 0.3) * 1.3;
  ctx.stroke();
}

function draw(row: Row, now: number, still: boolean) {
  const { ctx, w, h, dpr, root } = row;
  const t = (now - t0) / 1000;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const base = root.getBoundingClientRect();
  const light = root.closest('.dash')?.getAttribute('data-theme') === 'light';
  // While the reel flies the cards outrun any arc drawn from where they
  // were a frame ago, so the arcs sit out the spin; the cards keep their own
  // ring, and the flash covers the hand-off.
  const flying = root.classList.contains('reel--spin');
  if (flying && !still) marker(ctx, w, h, t, light);
  // The closed chest, on a dark reel, carries the arc too, as the uncommon card does.
  if (!flying && !light && !still && root.classList.contains('reel--idle')) {
    const svg = root.querySelector<SVGSVGElement>('.chest--reel .chest__art svg');
    if (svg) {
      const r = svg.getBoundingClientRect();
      const k = r.width / 401.5;
      outline(ctx, CRATE.map(([x, y]) => [r.left - base.left + x * k, r.top - base.top + y * k]), 'uncommon', t);
    }
  }
  for (const el of flying ? [] : root.querySelectorAll<HTMLElement>('.prize')) {
    const r = el.getBoundingClientRect();
    const ox = r.left - base.left, oy = r.top - base.top;
    if (ox + r.width < -SPREAD || ox > w + SPREAD || oy + r.height < -SPREAD || oy > h + SPREAD) continue;
    arc(ctx, ox, oy, r.width, r.height, el.dataset.rarity as Rarity, el.dataset.won === 'true', t, still, light);
  }
  // The light trail: spots the pointer left, fading over half a second.
  // Blended normally: additive spots stacked to white wherever the pointer
  // paused.
  if (row.trail.length) {
    row.trail = row.trail.filter((p) => now - p.t < TRAIL_MS);
    for (const p of row.trail) {
      const a = (1 - (now - p.t) / TRAIL_MS) * TRAIL_ALPHA;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, TRAIL_R);
      g.addColorStop(0, rgb(p.glow, a));
      g.addColorStop(1, rgb(p.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(p.x - TRAIL_R, p.y - TRAIL_R, TRAIL_R * 2, TRAIL_R * 2);
    }
  }
  // Sparks from an opening: thrown out, pulled down, gone in a second.
  if (row.sparks.length) {
    const dt = Math.min(0.05, (now - row.last) / 1000);
    row.sparks = row.sparks.filter((p) => now - p.born < p.ttl);
    for (const p of row.sparks) {
      p.vy += 520 * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const life = (now - p.born) / p.ttl;
      const a = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
      ctx.fillStyle = rgb(p.glow, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 - life * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  row.last = now;
}

/** Throws `n` sparks out from a point on the row, in a colour, with white among them. */
export function burst(root: HTMLElement, x: number, y: number, glow: [number, number, number], n: number, power = 1) {
  const row = byRoot.get(root);
  if (!row || reduced()) return;
  const now = performance.now();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (140 + Math.random() * 360) * power;
    row.sparks.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80 * power, born: now,
      ttl: 700 + Math.random() * 700, r: 1.5 + Math.random() * 2.5,
      glow: Math.random() < 0.3 ? [255, 255, 255] : glow,
    });
  }
  start();
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
  const row: Row = { root, canvas, ctx, trail: [], sparks: [], last: performance.now(), w: 0, h: 0, dpr: Math.min(window.devicePixelRatio || 1, 1.5), visible: false };
  byRoot.set(root, row);

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
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const last = row.trail[row.trail.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < TRAIL_STEP) return;
    row.trail.push({ x, y, t: performance.now(), glow: RARITY[card.dataset.rarity as Rarity].glow });
    if (row.trail.length > TRAIL_MAX) row.trail.shift();
  };
  root.addEventListener('pointermove', onMove);

  rows.add(row);
  start();
  return () => {
    rows.delete(row);
    byRoot.delete(root);
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
