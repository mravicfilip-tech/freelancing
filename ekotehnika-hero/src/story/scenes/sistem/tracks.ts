// Small timeline helpers for the Sistem scene. A track is a list of [u, value] keys, where u is the
// story position, the beat index plus k. Values run through a monotone cubic curve, so a camera or a
// truck keeps its speed across a beat boundary and never overshoots a key.
import { clamp01, smooth, range } from '../../../scroll/useScrollStory';

export { clamp01, smooth, range };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => smooth(clamp01(t));
// A soft out curve, fast then settling.
export const out = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const inOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export type Key = [number, number];

export function track(keys: Key[]): (u: number) => number {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = h[i] > 1e-9 ? (ys[i + 1] - ys[i]) / h[i] : 0;
  }
  const m: number[] = new Array(n).fill(0);
  if (n > 1) {
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * h[i] + h[i - 1];
        const w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
  }
  return (u: number) => {
    if (u <= xs[0]) return ys[0];
    if (u >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && u > xs[i + 1]) i++;
    const t = (u - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
