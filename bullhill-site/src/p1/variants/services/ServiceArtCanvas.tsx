import { useEffect, useRef } from 'react';
import { plan } from './plan';
import type { Kind } from './plan';

// Version 3 of the service dot art, the default, drawn on one canvas per card instead of one
// animated svg circle per dot. The look and the timing are the ones services.css gave the svg, so
// read the two together. One requestAnimationFrame loop serves all four cards. It runs only while
// a card that has entered is on screen, and the card's clock stops while it is off screen, as
// animation-play-state paused did. No React state changes per frame and nothing reads layout there.
//
// The box is the svg's box, 240 by 300 units, scaled to fit the width. The canvas is larger than
// the box on every side, since the scattered dots start up to 64 units outside it and the svg let
// them show. Its margin past the box is a whole number of css pixels, so the canvas lands on the
// pixel grid as the box does and the dots keep the svg's sub pixel positions. ?svct=<seconds> freezes the clock of every card at that time after it entered, for
// side by side shots against the old svg.

const PERIOD: Record<Kind, number> = { trench: 5, ducts: 6, house: 5.4, layers: 4.6 };
const TURN = 360 * 3 / 64;
const DUR = 1.1;
const VW = 240;
const VH = 300;
// the canvas reaches at least this far past the box, in units
const PAD_X = 24;
const PAD_Y = 64;
const TONES = ['--d1', '--d2', '--d3', '--dr'];
const FALLBACK = ['#ffffff', '#9a9a9a', '#7a7a7a', '#d00b11'];
const TAU = Math.PI * 2;
const R1 = (n: number) => Math.round(n * 10) / 10;
const R2 = (n: number) => Math.round(n * 100) / 100;

// CSS cubic-bezier easing, as a function of progress
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = X(t) - x;
      if (Math.abs(err) < 1e-7) return Y(t);
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      if (X(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}
// the value of --m-ease in motion.css
const easeM = bezier(0.2, 0.7, 0.1, 1);
// the keyframe timing of the loop, ease-in-out
const easeIO = bezier(0.42, 0, 0.58, 1);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

type Dot = {
  x: number; y: number; r: number;
  o: number; // opacity at rest, as the svg attribute had it
  or: number; // the --o of the keyframes, not rounded
  t: number; // tone index
  sx: number; sy: number; // scatter offset
  d: number; ld: number; gs: number;
  k: number; // loop kind, 0 none, 1 run, 2 fan, 3 glow
  ring: boolean;
};

const LOOP = { run: 1, fan: 2, glow: 3 } as const;
const TONE_IX = { 1: 0, 2: 1, 3: 2, r: 3 } as const;

function dotsOf(kind: Kind): { dots: Dot[]; spin: boolean } {
  const spin = kind === 'ducts';
  const dots: Dot[] = plan(kind, 3).map((it) => {
    const v = it.v;
    return {
      x: R1(it.dot.x), y: R1(it.dot.y), r: R1(it.dot.r),
      o: it.dot.o === 1 ? 1 : R2(it.dot.o), or: v.o ?? it.dot.o,
      t: TONE_IX[it.dot.t],
      sx: v.sx, sy: v.sy, d: v.d ?? 0, ld: v.ld ?? 0, gs: v.gs ?? 1,
      k: it.l ? LOOP[it.l as keyof typeof LOOP] : 0,
      ring: spin && !!it.g,
    };
  });
  // the svg drew the turning ring first, then the rest
  return { dots: spin ? [...dots.filter((d) => d.ring), ...dots.filter((d) => !d.ring)] : dots, spin };
}

// the box, in units, that the moving dots stay inside at their largest, 1.9 times their size
function reachOf(list: Dot[]) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of list) {
    const m = p.r * Math.max(1.9, p.gs) + 1;
    // a ring dot turns about the centre of the ring, so it can reach anywhere on its circle
    const e = p.ring ? Math.hypot(p.x - 120, p.y - 150) : 0;
    const cx = p.ring ? 120 : p.x;
    const cy = p.ring ? 150 : p.y;
    x0 = Math.min(x0, cx - e - m);
    y0 = Math.min(y0, cy - e - m);
    x1 = Math.max(x1, cx + e + m);
    y1 = Math.max(y1, cy + e + m);
  }
  return [x0, y0, x1, y1];
}

type Card = {
  box: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dots: Dot[]; // all, in the order the svg drew them
  fixed: Dot[]; // the ones that stay where they land
  moving: Dot[]; // the ones the loop moves, and the turning ring
  still: HTMLCanvasElement; // the fixed dots, drawn once, not in the page
  mode: number; // 0 drawing every dot, 1 the fixed dots are on the still canvas
  settle: number; // the clock time when every dot has landed
  bounds: number[]; // the area the moving dots reach, in units, x0 y0 x1 y1
  reach: number[]; // the same in canvas pixels, x y width height
  spin: boolean;
  cd: number;
  per: number;
  colors: string[];
  scale: number; // canvas pixels per unit
  ox: number; // canvas pixels from the canvas edge to the box edge
  oy: number;
  entered: boolean;
  visible: boolean;
  acc: number; // seconds of clock before the last resume
  since: number; // frame time of the last resume, or -1 while the clock is stopped
  dirty: boolean;
};

const active = new Set<Card>();
let raf = 0;

const frozen = (() => {
  const s = new URLSearchParams(window.location.search).get('svct');
  const n = s === null || s === '' ? NaN : Number(s);
  return Number.isFinite(n) ? n : null;
})();

function clockOf(c: Card, now: number) {
  if (frozen !== null) return frozen;
  return c.since < 0 ? c.acc : c.acc + Math.max(0, now - c.since) / 1000;
}

// one pass over a list of dots at clock time t, in the card's units
function paint(c: Card, list: Dot[], t: number, ctx: CanvasRenderingContext2D) {
  const colors = c.colors;
  const k = c.scale;
  ctx.setTransform(k, 0, 0, k, c.ox, c.oy);
  const ts = c.cd + 1.6;
  let ang = 0;
  if (c.spin && t >= ts) ang = (((t - ts) / c.per) % 1) * TURN * (Math.PI / 180);
  const cs = Math.cos(ang);
  const sn = Math.sin(ang);
  let tone = -1;
  let alpha = -1;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const u = t - c.cd - p.d;
    if (u < 0) continue; // waiting, opacity 0
    let x = p.x;
    let y = p.y;
    let a = p.o;
    let s = 1;
    if (u < DUR) {
      const q = u / DUR;
      const e = 1 - easeM(q);
      x += p.sx * e;
      y += p.sy * e;
      a = q < 0.25 ? p.or * easeM(q / 0.25) : mix(p.or, p.o, easeM((q - 0.25) / 0.75));
    }
    const ls = c.cd + p.d + 1.4 + p.ld;
    if (p.k && t >= ls) {
      const f = ((t - ls) / c.per) % 1;
      if (p.k === 1) {
        s = f < 0.1 ? mix(1, 1.9, easeIO(f / 0.1)) : f < 0.22 ? mix(1.9, 1, easeIO((f - 0.1) / 0.12)) : 1;
      } else if (p.k === 2) {
        if (f < 0.1) {
          const e = easeIO(f / 0.1);
          s = mix(1, 1.7, e);
          a = mix(p.or, 1, e);
        } else if (f < 0.22) {
          const e = easeIO((f - 0.1) / 0.12);
          s = mix(1.7, 1, e);
          a = mix(1, p.or, e);
        } else {
          a = mix(p.or, p.o, easeIO((f - 0.22) / 0.78));
        }
      } else {
        s = f < 0.12 ? mix(1, p.gs, easeIO(f / 0.12)) : f < 0.24 ? mix(p.gs, 1, easeIO((f - 0.12) / 0.12)) : 1;
      }
    }
    if (p.ring && ang !== 0) {
      const dx = x - 120;
      const dy = y - 150;
      x = 120 + dx * cs - dy * sn;
      y = 150 + dx * sn + dy * cs;
    }
    if (a <= 0) continue;
    if (p.t !== tone) {
      tone = p.t;
      ctx.fillStyle = colors[tone];
    }
    if (a !== alpha) {
      alpha = a;
      ctx.globalAlpha = a;
    }
    ctx.beginPath();
    ctx.arc(x, y, p.r * s, 0, TAU);
    ctx.fill();
  }
}

// While the dots assemble, every dot is drawn each frame. Once they have all landed, the dots that
// never move again are drawn once onto a second canvas that is not in the page, and each frame only
// clears the part of the card the moving dots reach, copies the still dots back into it and draws
// the moving ones. Moving dots are drawn above still ones, the svg drew them in list order.
function draw(c: Card, now: number) {
  const { ctx } = c;
  const t = clockOf(c, now);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; // the last pass left a dot's opacity set
  if (t < c.settle) {
    c.mode = 0;
    ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
    paint(c, c.dots, t, ctx);
    c.dirty = false;
    return;
  }
  if (c.mode === 0) {
    const sctx = c.still.getContext('2d');
    if (!sctx) return;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, c.still.width, c.still.height);
    paint(c, c.fixed, t, sctx);
    ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
    ctx.drawImage(c.still, 0, 0);
    c.mode = 1;
  }
  const [rx, ry, rw, rh] = c.reach;
  ctx.clearRect(rx, ry, rw, rh);
  ctx.drawImage(c.still, rx, ry, rw, rh, rx, ry, rw, rh);
  paint(c, c.moving, t, ctx);
  c.dirty = false;
}

function frame(now: number) {
  raf = 0;
  for (const c of active) if (frozen === null || c.dirty) draw(c, now);
  if (frozen === null && active.size) raf = requestAnimationFrame(frame);
}

function kick() {
  if (!raf && active.size) raf = requestAnimationFrame(frame);
}

function readColors(c: Card) {
  const cs = getComputedStyle(c.box);
  c.colors = TONES.map((n, i) => cs.getPropertyValue(n).trim() || FALLBACK[i]);
  c.mode = 0;
  c.dirty = true;
}

// the clock runs while the card has entered and is on screen
function setRun(c: Card, run: boolean) {
  const now = performance.now();
  if (run && c.since < 0) {
    c.since = now;
    readColors(c);
    active.add(c);
    kick();
  } else if (!run && c.since >= 0) {
    c.acc = clockOf(c, now);
    c.since = -1;
    active.delete(c);
  }
}

export function ServiceArtCanvas({ kind, className, index = 0 }: { kind: Kind; className?: string; index?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!box || !canvas || !ctx) return;
    const { dots, spin } = dotsOf(kind);
    const moving = dots.filter((d) => d.k || d.ring);
    const c: Card = {
      box, canvas, ctx, dots, spin,
      fixed: dots.filter((d) => !d.k && !d.ring), moving,
      still: document.createElement('canvas'), mode: 0,
      settle: index * 0.12 + Math.max(...dots.map((d) => d.d)) + DUR,
      bounds: reachOf(moving), reach: [0, 0, 0, 0],
      cd: index * 0.12, per: PERIOD[kind],
      colors: FALLBACK, scale: 1, ox: 0, oy: 0,
      entered: false, visible: false, acc: 0, since: -1, dirty: true,
    };
    // frozen shots have no running clock, so a card draws when it enters and when it changes
    const place = () => {
      if (frozen !== null && c.entered && c.visible) {
        active.add(c);
        c.dirty = true;
        kick();
      }
    };

    const ro = new ResizeObserver((es) => {
      const w = es[es.length - 1].contentRect.width;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const u = w / VW;
      const px = Math.ceil(PAD_X * u);
      const py = Math.ceil(PAD_Y * u);
      const cw = w + px * 2;
      const ch = w * (VH / VW) + py * 2;
      const bw = Math.max(1, Math.round(cw * dpr));
      const bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const st = canvas.style;
      st.left = `${-px}px`;
      st.top = `${-py}px`;
      st.width = `${cw}px`;
      st.height = `${ch}px`;
      c.scale = u * dpr;
      c.ox = px * dpr;
      c.oy = py * dpr;
      c.still.width = bw;
      c.still.height = bh;
      const [x0, y0, x1, y1] = c.bounds;
      const rx = Math.max(0, Math.floor(c.ox + x0 * c.scale));
      const ry = Math.max(0, Math.floor(c.oy + y0 * c.scale));
      c.reach = [rx, ry, Math.min(bw, Math.ceil(c.ox + x1 * c.scale)) - rx, Math.min(bh, Math.ceil(c.oy + y1 * c.scale)) - ry];
      c.mode = 0;
      c.dirty = true;
      if (c.entered && c.visible) draw(c, performance.now());
    });
    ro.observe(box);

    let vis: IntersectionObserver | null = null;
    const enter = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        enter.disconnect();
        c.entered = true;
        c.visible = true;
        setRun(c, true);
        place();
        vis = new IntersectionObserver((vs) => {
          c.visible = vs[vs.length - 1].isIntersecting;
          setRun(c, c.visible);
          place();
          if (!c.visible) active.delete(c);
        });
        vis.observe(box);
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    enter.observe(box);

    // a change of colour scheme can change the tones
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const recolor = () => {
      readColors(c);
      if (c.entered && c.visible) kick();
    };
    mq.addEventListener('change', recolor);

    return () => {
      enter.disconnect();
      vis?.disconnect();
      ro.disconnect();
      mq.removeEventListener('change', recolor);
      active.delete(c);
    };
  }, [kind, index]);

  return (
    <div ref={boxRef} className={`${className ?? ''} svsc`} aria-hidden="true">
      <canvas ref={canvasRef} className="svsc__c" aria-hidden="true" />
    </div>
  );
}
