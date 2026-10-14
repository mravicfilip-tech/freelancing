import { DUCTS, H, L, Y, clamp01, rng, smooth, type V3 } from './geometry';

// Beat 4, dig, lay, restore. briefs/website/hero6-story.md, "Beat 4 redraw". p runs 0 to 1 across
// the pin. Pure numbers, no three.js, so the live scene, the overlay and the 2D phone canvas read
// one timeline.
//
//   dig      p 0 to 0.35     a trench opens along the duct line, the ground in it lifts into a cloud
//   lay      p 0.35 to 0.65  the ducts slide in from the far end, light runs through them and out
//   restore  p 0.65 to 1     the cloud falls back, sand first, and the seam sweeps to 0.15
//
// The ground in the trench is five courses. Each has its own window inside dig and restore, so the
// cut goes top down and the fill comes back bottom up. At p 0 and p 1 every course is home.

export const P_DIG = 0.35;
export const P_LAY = 0.65;

// half width of the trench across the duct axis, and its floor, just under the lowest duct
export const TZ = 0.74;
export const FLOOR = 0.12;

export type Course = 'sand' | 'backfill' | 'tape' | 'base' | 'surface';
export const COURSES: Course[] = ['sand', 'backfill', 'tape', 'base', 'surface'];
export const SPAN: Record<Course, [number, number]> = {
  sand: [FLOOR, Y.sand],
  backfill: [Y.sand, Y.backfill],
  tape: [Y.tape - Y.tapeT / 2, Y.tape + Y.tapeT / 2],
  base: [Y.backfill, Y.base],
  surface: [Y.base, H],
};
// windows as shares of dig and of restore
const LIFT: Record<Course, [number, number]> = { surface: [0, 0.42], base: [0.14, 0.58], tape: [0.3, 0.62], backfill: [0.3, 0.76], sand: [0.48, 0.96] };
const FALL: Record<Course, [number, number]> = { sand: [0, 0.34], backfill: [0.14, 0.5], tape: [0.32, 0.54], base: [0.4, 0.74], surface: [0.56, 0.94] };

const win = (v: number, [a, b]: [number, number]) => clamp01((v - a) / (b - a));
export const digAt = (p: number) => clamp01(p / P_DIG);
export const layAt = (p: number) => clamp01((p - P_DIG) / (P_LAY - P_DIG));
export const restoreAt = (p: number) => clamp01((p - P_LAY) / (1 - P_LAY));

// how far the lift and the fall of a course have got, 0 to 1 each
export function courseAt(p: number, c: Course) {
  return { lift: win(digAt(p), LIFT[c]), fall: win(restoreAt(p), FALL[c]) };
}
// share of a course that is out of the ground, which is how much of its face has dissolved
export function cutAt(p: number, c: Course) {
  const k = courseAt(p, c);
  return smooth(k.lift) * (1 - smooth(k.fall));
}

// the ducts draw back out of the far end while the ground opens, and slide in again in lay,
// each a little after the one before. 0 is home, 1 all the way out past the far end.
export const SLIDE = L + 2.2;
export function ductOut(p: number, i: number) {
  const out = smooth(clamp01((digAt(p) - 0.04 - i * 0.03) / 0.5));
  const back = clamp01((layAt(p) - i * 0.07) / 0.42);
  const easeOut = 1 - Math.pow(1 - back, 3);
  return p >= P_DIG ? 1 - easeOut : out;
}

// light in the ducts, from the far end to the near one, then out of the open ends as points
export const LIGHT = { head0: 0.4, head1: 0.62, stream0: 0.52, stream1: 0.76 };
export function lightAt(p: number) {
  const h = clamp01((p - LIGHT.head0) / (LIGHT.head1 - LIGHT.head0));
  const glow = clamp01((p - LIGHT.head0) / 0.03) * (1 - clamp01((p - LIGHT.head1 + 0.02) / 0.05));
  return { head: h, glow, stream: clamp01((p - LIGHT.stream0) / (LIGHT.stream1 - LIGHT.stream0)) };
}

// The seam holds at the middle through dig and lay and sweeps left with the falling ground. With
// the acts off (motion off) it keeps the old mapping, smoothstep across the whole pin.
export const seamEase = (p: number, acts: boolean) => (acts ? smooth(restoreAt(p)) : smooth(p));

// ---- the ground as points, sampled inside each course's volume in the trench, with a place in the
// cloud. Seeded, so every frame and every shot draws the same points.

export const PALETTE: Record<Course, string[]> = {
  surface: ['#2b2b2e', '#3a3a3e', '#56565b', '#242426'],
  base: ['#8f897d', '#a39c8f', '#716c63', '#b5ae9f', '#5e5a52'],
  tape: ['#d00b11'],
  backfill: ['#6e6559', '#85796b', '#4a4137', '#9a9183', '#5b5247'],
  sand: ['#b7ae9f', '#9d9586', '#cfc7b8', '#8a8274'],
};
// bands in the cloud, surface on top since it lifts first
const BAND: Record<Course, [number, number]> = { surface: [0.3, 0.42], base: [0.21, 0.34], tape: [0.18, 0.26], backfill: [0.1, 0.24], sand: [0.02, 0.13] };
export const CLOUD_Y = H + 0.04;

export type Grain = { home: V3; cloud: V3; color: string; course: number; r: number; s: number };

// n is the total, shared by volume so every course looks as dense as the next
export function sampleGround(n: number, seed = 7): Grain[] {
  const r = rng(seed);
  const vol = COURSES.map((c) => Math.max(0.05, SPAN[c][1] - SPAN[c][0]));
  const sum = vol.reduce((a, b) => a + b, 0);
  const out: Grain[] = [];
  COURSES.forEach((c, ci) => {
    const k = c === 'tape' ? Math.round(n * 0.03) : Math.round((n * 0.97 * vol[ci]) / (sum - vol[2]));
    const [y0, y1] = SPAN[c];
    const [b0, b1] = BAND[c];
    for (let i = 0; i < k; i++) {
      const x = (r() - 0.5) * L;
      const y = y0 + r() * (y1 - y0);
      const z = (r() - 0.5) * 2 * TZ;
      // the cloud gathers over the render half, towards the near end, clear of the headline
      const cx = 1.45 + x * 0.66 + (r() - 0.5) * 0.3;
      const cy = CLOUD_Y + b0 + r() * (b1 - b0);
      const cz = z * 0.6 - 0.2 + (r() - 0.5) * 0.25;
      out.push({ home: [x, y, z], cloud: [cx, cy, cz], color: PALETTE[c][Math.floor(r() * PALETTE[c].length)], course: ci, r: r(), s: r() });
    }
  });
  return out;
}

// where a grain is at p, and how visible. The same maths as the shader in Dig.ts.
export function grainAt(g: Grain, p: number): { pos: V3; a: number; f: number } {
  const c = COURSES[g.course];
  const k = courseAt(p, c);
  const d = g.r * 0.4;
  const lift = smooth(clamp01((k.lift - d) / 0.6));
  const fall = smooth(clamp01((k.fall - d) / 0.6));
  const f = lift * (1 - fall);
  const arc = Math.sin(Math.PI * f) * 0.12;
  const w = p * 6.283 + g.s * 6.283;
  const pos: V3 = [
    g.home[0] + (g.cloud[0] - g.home[0]) * f + Math.sin(w) * 0.05 * f,
    g.home[1] + (g.cloud[1] - g.home[1]) * f + arc + Math.cos(w * 0.7) * 0.025 * f,
    g.home[2] + (g.cloud[2] - g.home[2]) * f,
  ];
  return { pos, a: smooth(clamp01(f / 0.12)), f };
}

// the near end of each duct, where the light comes out
export const NEAR_END = DUCTS.map((d) => L / 2 + d.near);
