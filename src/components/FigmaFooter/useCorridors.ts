import { useEffect, type RefObject } from 'react';

/** What goes in, and what comes out. Both sit on one ring around the closing block. */
const CRYPTO = ['BTC', 'ETH', 'USDT', 'SOL'];
const FIAT = ['NGN', 'PHP', 'INR', 'KES', 'MXN'];

const DWELL = 3.2; // seconds a corridor stays live, before SPEED
const SPEED = 0.4; // the whole field runs at 40% — one knob, everything scales together
const GHOSTS = 3; // routes held faintly behind the live one; the rest of the mesh is left out

const LAVENDER = '#8f91ff';
const LIME = '#d9f24e';
const DIM = '#49535e';
const TEXT = '#cdd6de';
const DOT = '#3d4854';
const GAP = 26; // the lattice's pitch, as in the design file's dot field

type Node = { code: string; kind: -1 | 1; x: number; y: number };

/**
 * The closing block's field. Assets and local currencies sit on one slowly turning ring; a payment
 * leaves an asset, crosses beneath the headline turning from asset to fiat as it passes the middle,
 * and lands on a currency, with the pair named as it settles. Only the live route and three ghosts
 * are ever drawn, so the block keeps its air.
 *
 * Under it all sits the design file's dot lattice, quiet until the payment arrives — settlement
 * sends one ring out through the dots, so the field's only move is the moment money lands.
 */
export function useCorridors(host: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const cv = el.querySelector('canvas') as HTMLCanvasElement | null;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;

    let w = 0;
    let h = 0;
    const size = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const ALL: { code: string; kind: -1 | 1 }[] = [
      ...CRYPTO.map((code) => ({ code, kind: -1 as const })),
      ...FIAT.map((code) => ({ code, kind: 1 as const })),
    ];

    const ring = (t: number): Node[] =>
      ALL.map((n, i) => {
        const a = (i / ALL.length) * Math.PI * 2 + t * 0.022 - Math.PI / 2;
        return { ...n, x: w / 2 + Math.cos(a) * w * 0.37, y: h / 2 + Math.sin(a) * h * 0.36 };
      });

    const curve = (a: Node, b: Node) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(w / 2, h / 2, b.x, b.y);
      ctx.stroke();
    };
    const along = (a: Node, b: Node, t: number) => {
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * (w / 2) + t * t * b.x,
        y: u * u * a.y + 2 * u * t * (h / 2) + t * t * b.y,
      };
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const pts = ring(t);
      const crypto = pts.filter((p) => p.kind < 0);
      const fiat = pts.filter((p) => p.kind > 0);

      const step = Math.floor(t / DWELL);
      const p = (t % DWELL) / DWELL;
      const fade = 1 - Math.max(0, (p - 0.74) / 0.26);
      const from = crypto[step % crypto.length];
      const to = fiat[(step * 3) % fiat.length];

      // The lattice answers only at settlement: one ring out from where the money landed.
      const landed = Math.max(0, (p - 0.78) / 0.22);
      const reach = Math.hypot(w, h) * 0.5;
      for (let x = GAP; x < w; x += GAP) {
        for (let y = GAP; y < h; y += GAP) {
          let k = 0;
          if (landed > 0) {
            const d = Math.hypot(x - to.x, y - to.y);
            k = Math.max(0, 1 - Math.abs(d - landed * reach) / 60) * (1 - landed);
          }
          ctx.globalAlpha = Math.min(1, 0.3 + k * 0.7);
          ctx.fillStyle = k > 0.6 ? LIME : k > 0.2 ? '#5b62d8' : DOT;
          ctx.beginPath();
          ctx.arc(x, y, 1.35 + k * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(40,50,60,.5)';
      for (let g = 0; g < GHOSTS; g++) curve(crypto[g % crypto.length], fiat[(g * 2 + 1) % fiat.length]);

      ctx.strokeStyle = `rgba(64,66,209,${0.8 * fade})`;
      ctx.lineWidth = 1.2;
      curve(from, to);

      // the payment turns from asset to local currency as it crosses the middle
      const q = Math.min(1, p / 0.78);
      const at = along(from, to, q);
      ctx.globalAlpha = fade;
      ctx.fillStyle = q < 0.5 ? LAVENDER : LIME;
      ctx.beginPath();
      ctx.arc(at.x, at.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = '700 11px Onest, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      pts.forEach((n) => {
        const live = n === from || n === to;
        const outward = n.x < w / 2 ? -1 : 1; // labels sit outside the ring
        ctx.globalAlpha = live ? fade : 0.3;
        ctx.fillStyle = live ? (n.kind < 0 ? LAVENDER : LIME) : DIM;
        ctx.beginPath();
        ctx.arc(n.x, n.y, live ? 3.6 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = outward < 0 ? 'right' : 'left';
        ctx.fillStyle = live ? TEXT : DIM;
        ctx.fillText(n.code, n.x + outward * 14, n.y + 1);
        ctx.globalAlpha = 1;
      });

      if (p > 0.45) {
        ctx.globalAlpha = Math.min(1, (p - 0.45) / 0.18) * fade * 0.55;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8593a0';
        ctx.font = '600 12px Onest, system-ui, sans-serif';
        ctx.fillText(`${from.code} → ${to.code}`, w / 2, h * 0.88);
        ctx.globalAlpha = 1;
      }
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(DWELL * 0.45);
      return () => ro.disconnect();
    }

    let raf = 0;
    let t = 0;
    let last = 0;
    let running = false;
    // Real elapsed time rather than a frame count, so the field keeps its pace on any refresh rate,
    // and a backgrounded tab does not jump when it comes back.
    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
      last = now;
      t += dt * SPEED;
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = 0;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: '120px' },
    );
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [host]);
}
