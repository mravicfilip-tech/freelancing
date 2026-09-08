import { useEffect, type RefObject } from 'react';

/** Crypto on one side, fiat on the other; they cross under the headline and trade places. */
const CRYPTO = ['₿', 'Ξ', '₮'];
const FIAT = ['$', '€', '₦'];
const PERIOD = 19; // seconds for a full there-and-back exchange

type Blob = { c: [number, number, number]; r: number; a: number; side: 1 | -1; oy: number; drift: number };

const FIELD: Blob[] = [
  { c: [64, 66, 209], r: 0.66, a: 0.24, side: 1, oy: 0.44, drift: 0.09 },
  { c: [90, 60, 190], r: 0.46, a: 0.16, side: 1, oy: 0.66, drift: -0.07 },
  { c: [217, 242, 78], r: 0.44, a: 0.08, side: -1, oy: 0.56, drift: 0.06 },
  { c: [42, 84, 160], r: 0.58, a: 0.18, side: -1, oy: 0.36, drift: -0.05 },
];

/**
 * The closing block's field. Two masses of light — crypto indigo and fiat lime — drift toward each
 * other, cross beneath the headline and come out the other side, carrying their currency marks
 * with them. Low luminance throughout, so the type never loses contrast.
 */
export function useAurora(host: RefObject<HTMLElement | null>) {
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

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // 0 → 1 → 0: the two fields swap sides and swap back
      const phase = (1 - Math.cos((t / PERIOD) * Math.PI * 2)) / 2;

      ctx.globalCompositeOperation = 'lighter';
      FIELD.forEach((b, i) => {
        const from = b.side === 1 ? 0.3 : 0.7;
        const to = b.side === 1 ? 0.7 : 0.3;
        const x = (from + (to - from) * phase) * w;
        const y = (b.oy + Math.sin(t * b.drift + i * 1.7) * 0.1) * h;
        const r = b.r * Math.min(w, h) * (1 + Math.sin(t * 0.11 + i) * 0.08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`);
        g.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';

      // the marks ride with their own field, so each currency ends up where the other began
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const marks = (list: string[], side: 1 | -1, tint: string) => {
        const from = side === 1 ? 0.3 : 0.7;
        const to = side === 1 ? 0.7 : 0.3;
        const x = (from + (to - from) * phase) * w;
        list.forEach((glyph, i) => {
          const y = h * (0.3 + i * 0.2) + Math.sin(t * 0.2 + i * 2.1) * 10;
          ctx.font = `500 ${Math.round(Math.min(w, h) * 0.13)}px Onest, system-ui, sans-serif`;
          ctx.fillStyle = tint;
          ctx.globalAlpha = 0.05 + Math.sin(t * 0.5 + i) * 0.012;
          ctx.fillText(glyph, x + (i - 1) * Math.min(w, h) * 0.16, y);
        });
        ctx.globalAlpha = 1;
      };
      marks(CRYPTO, 1, '#8f91ff');
      marks(FIAT, -1, '#d9f24e');
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(PERIOD * 0.24); // a still frame with the fields apart
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
