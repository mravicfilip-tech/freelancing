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

type Node = { code: string; kind: -1 | 1; x: number; y: number };

/**
 * The closing block's field. Assets and local currencies sit on one slowly turning ring; a payment
 * leaves an asset, crosses beneath the headline turning from asset to fiat as it passes the middle,
 * and lands on a currency, with the pair named as it settles. Only the live route and three ghosts
 * are ever drawn, so the block keeps its air.
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

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(40,50,60,.7)';
      for (let g = 0; g < GHOSTS; g++) curve(crypto[g % crypto.length], fiat[(g * 2 + 1) % fiat.length]);

      const step = Math.floor(t / DWELL);
      const p = (t % DWELL) / DWELL;
      const fade = 1 - Math.max(0, (p - 0.74) / 0.26);
      const from = crypto[step % crypto.length];
      const to = fiat[(step * 3) % fiat.length];

      ctx.strokeStyle = `rgba(64,66,209,${0.9 * fade})`;
      ctx.lineWidth = 1.5;
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
    let running = false;
    const frame = () => {
      t += SPEED / 60;
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
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
