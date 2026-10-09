// Shared numbers for the Linija scene. One 1440 by 900 drawing, fitted to the stage by one scale, and the
// timeline helpers every layer reads. Every colour is a README token from src/tokens.ts.
import { TIMELINE } from '../../timeline';
import { C } from '../../../tokens';

export const W = 1440;
export const H = 900;

export const K = C.ink;
export const G = C.textGrey;
export const G2 = C.tonedTextGrey;
export const LG = C.lightGrey;
export const SG = C.shadeGrey;
export const HG = C.hoverLightGrey;
export const WH = C.white;
export const RED = C.lindeRed;

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
export const io = (t: number) => 0.5 - Math.cos(Math.PI * clamp01(t)) / 2;
export const ein = (t: number) => clamp01(t) ** 2;
export const eout = (t: number) => 1 - (1 - clamp01(t)) ** 2;
export const eout3 = (t: number) => 1 - (1 - clamp01(t)) ** 3;

type Id = 'H' | 'D1' | 'C1' | 'D2' | 'F' | 'R' | 'Z' | 'P' | 'A' | 'B' | 'S' | 'L' | 'N' | 'T' | 'AT';
const SPAN = Object.fromEntries(TIMELINE.map((b) => [b.id, b])) as Record<Id, (typeof TIMELINE)[number]>;

// 0 to 1 inside a beat, clamped, so 0 before it and 1 after it.
export const seg = (pos: number, id: Id) => clamp01((pos - SPAN[id].start) / (SPAN[id].end - SPAN[id].start));
export const start = (id: Id) => SPAN[id].start;
export const end = (id: Id) => SPAN[id].end;
// 0 to 1 across a run of beats, first start to last end.
export const run = (pos: number, a: Id, b: Id) => clamp01((pos - SPAN[a].start) / (SPAN[b].end - SPAN[a].start));

// Keyframes [p, value], eased in and out between each pair.
export function kf(p: number, keys: [number, number][]) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    const [p0, v0] = keys[i - 1];
    if (p <= p1) return v0 + (v1 - v0) * io((p - p0) / (p1 - p0));
  }
  return keys[keys.length - 1][1];
}
