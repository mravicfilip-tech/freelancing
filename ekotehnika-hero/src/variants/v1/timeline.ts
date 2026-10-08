// The V1 scroll story in one place, so the canvas and the DOM read the same clock.
// Chapters by progress. 0 to 0.03 hero hold, 0.01 to 0.1 hero type leaves, 0.03 to 0.33 the
// camera dives to Serbia and the arcs draw in, 0.22 to 0.43 the dots swell into a floor and the
// page floods white, 0.43 to 0.59 a card opens on the dot floor beside the partner line, 0.55 to
// 0.95 the statement and the counters.
import { clamp01, range } from '../../scroll/useScrollStory';

export const LENGTH = 7200;

export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Rect = { x: number; y: number; w: number; h: number };

// The card that opens on the white page. It grows out of a line, then rides up with the scroll.
export function cardAt(p: number, W: number, H: number): Rect & { open: number } {
  const s = W / 1440;
  const open = easeInOut(range(p, 0.432, 0.505));
  const rise = easeInOut(range(p, 0.5, 0.585));
  const w = lerp(300, 300, rise) * s;
  const h = lerp(196, 196, rise) * s;
  const cx = 48 * s + w / 2;
  const cy = lerp(H * 0.42, 150 * s + h / 2, rise);
  const hh = h * open;
  const ww = w * Math.min(1, 0.35 + open * 0.65);
  return { x: cx - ww / 2, y: cy - hh / 2, w: ww, h: hh, open };
}

// How white the page is. The dots swell first, then the flood takes what is left.
export const floodAt = (p: number) => easeInOut(range(p, 0.355, 0.43));
