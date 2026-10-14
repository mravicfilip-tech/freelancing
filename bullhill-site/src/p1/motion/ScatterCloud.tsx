import { useEffect, useRef } from 'react';
import { rng, scatterDots } from '../art';
import { clamp01, motionOn, onScroll } from './motion';

// The audience dot field. A canvas 2D cloud of points in 3D with a perspective projection, drawn in
// the 720 by 960 units of the old static field and fitted with the same xMidYMid slice.
//   scroll   the camera moves forward through the cloud as the block passes the viewport, driven by
//            onScroll. Near points grow and leave past the edges, far points drift in from the depth,
//            and points that pass the camera wrap to the back.
//   turn     the cloud turns about its vertical axis, one turn in three minutes.
// Size, brightness and tone come from depth only. Nothing runs while the canvas is off screen or the
// tab is hidden. With motion off one still frame of the old field is drawn and nothing moves.

const VW = 720;
const VH = 960;
const FOCAL = 720;        // projection scale in field units
const ZN = 0.6;           // nearest depth, points wrap to the back past it
const LEN = 3.6;          // depth of the cloud, the back is at ZN + LEN
const ZMID = ZN + LEN / 2;
const ZREF = 1.5;         // depth where the cloud's ellipse fills the field
const SIZE = 4;           // dot radius is SIZE / depth
const TRAVEL = 2.4;       // camera travel over the block's whole pass
const TURN = (Math.PI * 2) / 180; // radians a second

type Cloud = { n: number; x: Float32Array; y: Float32Array; z: Float32Array };

function makeCloud(seed: number, n: number): Cloud {
  const rand = rng(seed * 7919 + 13);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.pow(rand(), 0.7); // dense in the middle, as the still field is
    const zz = ZN + Math.pow(rand(), 0.7) * LEN; // a little more of the cloud lies far, as in the still
    const wide = 0.55 + 0.25 * zz; // a shallow cone, so the far end still fills the field
    x[i] = Math.cos(a) * rr * 0.5 * ZREF * wide;
    y[i] = Math.sin(a) * rr * (VH / VW / 2) * ZREF * wide;
    z[i] = zz;
  }
  return { n, x, y, z };
}

const mod = (v: number, m: number) => ((v % m) + m) % m;

export function ScatterCloud({ className, seed }: { className?: string; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const live = motionOn();
    const cloud = live ? makeCloud(seed, window.innerWidth < 768 ? 200 : 400) : null;
    const still = live ? null : scatterDots(VW, VH, seed);
    const tones = ['', '', '', ''];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let p = 0;
    let angle = (seed % 7) * 0.9;
    let last = 0;
    let lastDraw = 0;
    let running = false;
    let onScreen = false;
    let unsub: (() => void) | null = null;
    let idle = 0;

    function fit() {
      if (!cv || !ctx) return;
      const cs = getComputedStyle(cv);
      for (let t = 1; t <= 3; t++) tones[t] = cs.getPropertyValue(`--d${t}`).trim() || '#7a7a7a';
      w = cv.clientWidth;
      h = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }

    function frame() {
      if (!ctx || !w || !h) return;
      const k = Math.max(w / VW, h / VH) * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv!.width, cv!.height);
      ctx.setTransform(k, 0, 0, k, (cv!.width - VW * k) / 2, (cv!.height - VH * k) / 2);
      if (still) {
        for (const d of still) {
          ctx.globalAlpha = d.o;
          ctx.fillStyle = tones[d.t === 'r' ? 1 : d.t];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (!cloud) return;
      const cam = p * TRAVEL;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const m = 24;
      for (let i = 0; i < cloud.n; i++) {
        const dz = cloud.z[i] - ZMID;
        const px = cloud.x[i] * c - dz * s;
        const ze = ZN + mod(ZMID + dz * c + cloud.x[i] * s - cam - ZN, LEN);
        const f = FOCAL / ze;
        const sx = VW / 2 + px * f;
        const sy = VH / 2 + cloud.y[i] * f;
        const r = SIZE / ze;
        if (sx < -r - m || sx > VW + r + m || sy < -r - m || sy > VH + r + m) continue;
        const near = 1 - (ze - ZN) / LEN;
        // dim far, bright near, and a short fade at both ends of the depth so the wrap never shows
        const fade = Math.min(1, (ze - ZN) / 0.4, (ZN + LEN - ze) / 0.5);
        ctx.globalAlpha = (0.3 + 0.55 * near) * fade;
        ctx.fillStyle = tones[ze < 1.6 ? 1 : ze < 2.8 ? 2 : 3];
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function draw(now: number) {
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      angle += (dt / 1000) * TURN;
      lastDraw = now;
      frame();
    }

    function progress() {
      const r = cv!.getBoundingClientRect();
      p = clamp01((window.innerHeight - r.top) / (window.innerHeight + r.height));
    }

    function idleLoop(now: number) {
      idle = requestAnimationFrame(idleLoop);
      if (now - lastDraw >= 33) draw(now); // the turn alone redraws at 30 a second
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      unsub = onScroll(() => {
        progress();
        draw(performance.now());
      });
      idle = requestAnimationFrame(idleLoop);
    }
    function stop() {
      if (!running) return;
      running = false;
      unsub?.();
      unsub = null;
      cancelAnimationFrame(idle);
    }
    const sync = () => (onScreen && !document.hidden ? start() : stop());

    fit();
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    if (live) {
      progress();
      io = new IntersectionObserver((es) => {
        onScreen = es[es.length - 1].isIntersecting;
        sync();
      });
      io.observe(cv);
      document.addEventListener('visibilitychange', sync);
    }
    ro = new ResizeObserver(() => {
      fit();
      if (live) progress();
      frame();
    });
    ro.observe(cv);
    frame();

    return () => {
      stop();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [seed]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
