import { useEffect, type RefObject } from 'react';

/** What goes in on the left, what comes out on the right. */
const CRYPTO = ['BTC', 'ETH', 'USDT', 'SOL'];
const FIAT = ['NGN', 'PHP', 'INR', 'KES', 'MXN'];
const DWELL = 2.8; // seconds a corridor stays live

const LAVENDER = '#8f91ff';
const LIME = '#d9f24e';
const LINE = 'rgba(40,50,60,';

/**
 * The closing block's field: crypto on the left, local currency on the right, and one corridor
 * live at a time — a payment leaves an asset, crosses beneath the headline and settles as fiat,
 * its route named as it lands. Everything sits well under the type's contrast.
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

    const nodes = (list: string[], side: -1 | 1) =>
      list.map((code, i) => ({
        code,
        x: (side === -1 ? 0.13 : 0.87) * w,
        y: h * (0.5 + ((i - (list.length - 1) / 2) / (list.length - 1 || 1)) * 0.62),
        side,
      }));

    /** A quadratic through the middle of the block, so every route passes under the headline. */
    const at = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
        y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
      };
    };

    const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(w / 2, h / 2, b.x, b.y);
      ctx.stroke();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const left = nodes(CRYPTO, -1);
      const right = nodes(FIAT, 1);

      // the whole lattice, faint
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${LINE}.55)`;
      left.forEach((a) => right.forEach((b) => curve(a, b)));

      // the live corridor
      const step = Math.floor(t / DWELL);
      const p = (t % DWELL) / DWELL;
      const a = left[step % left.length];
      const b = right[(step * 3) % right.length];
      const fade = 1 - Math.max(0, (p - 0.72) / 0.28);

      ctx.strokeStyle = `rgba(64,66,209,${0.9 * fade})`;
      ctx.lineWidth = 1.5;
      curve(a, b);

      // the payment itself, arriving as fiat
      const q = Math.min(1, p / 0.78);
      const pt = at(a, b, q);
      // the packet turns from asset to local currency as it crosses the middle
      ctx.fillStyle = q < 0.5 ? LAVENDER : LIME;
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // the marks, with the live pair named
      ctx.font = '700 11px Onest, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      [...left, ...right].forEach((n) => {
        const live = n === a || n === b;
        ctx.globalAlpha = live ? fade : 0.32;
        ctx.fillStyle = live ? (n.side === -1 ? LAVENDER : LIME) : '#4a545f';
        ctx.beginPath();
        ctx.arc(n.x, n.y, live ? 3.6 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = n.side === -1 ? 'right' : 'left';
        ctx.fillStyle = live ? '#cdd6de' : '#49535e';
        ctx.fillText(n.code, n.x + n.side * 14, n.y + 1);
        ctx.globalAlpha = 1;
      });

      // the route, spelled out under the pair as it lands
      if (p > 0.45) {
        ctx.globalAlpha = Math.min(1, (p - 0.45) / 0.18) * fade * 0.55;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8593a0';
        ctx.font = '600 12px Onest, system-ui, sans-serif';
        ctx.fillText(`${a.code} → ${b.code}`, w / 2, h * 0.88);
        ctx.globalAlpha = 1;
      }
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(DWELL * 0.4);
      return () => ro.disconnect();
    }

    let raf = 0;
    let t = 0;
    let running = false;
    const frame = () => {
      t += 1 / 60;
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
