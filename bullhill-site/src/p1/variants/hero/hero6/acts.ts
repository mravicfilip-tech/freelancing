import { DUCTS, H, L, Y, clamp01, rng, smooth, type V3 } from './geometry';

// The hero scroll as five named steps. briefs/website/round5-notes.md, "Hero storyboard". p runs 0 to
// 1 across the pin. Pure numbers, no three.js, so the live scene, the overlay, the 2D phone canvas and
// the still renders all read one timeline. One thing happens at a time.
//
//   1 Dig                 p 0 to 0.2     the trench opens, the ground in it lifts out as points
//   2 Sand bed            p 0.2 to 0.35  sand pours onto the trench floor and settles flat
//   3 Ducts               p 0.35 to 0.55 the empty ducts slide in along the sand bed
//   4 Ready for fibre     p 0.55 to 0.7  a pulse of light runs through the ducts and out of their ends
//   5 Backfill, restore   p 0.7 to 1     the same points fall back in layers, tape, base, surface
//
// The seam does not move. The schematic half stays the finished plan, the work is on the render half.
// The ground in the trench is six courses. The bed is the sand under the ducts, the sand above it
// is the haunch. Each course has a window inside the step that lifts it and the step that returns
// it, so the cut goes top down and the fill comes back bottom up. At p 0 and p 1 every course is home.

export const STEPS = [0, 0.2, 0.35, 0.55, 0.7, 1] as const;
export const P_DIG = STEPS[1];
export const P_SAND = STEPS[2];
export const P_DUCTS = STEPS[3];
export const P_LIGHT = STEPS[4];

// half width of the trench across the duct axis, its floor just under the lowest duct, and the top of
// the bed, where the lowest ducts rest (their lowest line is at 0.16)
export const TZ = 0.74;
export const FLOOR = 0.03;
export const BED = 0.17;

export type Course = 'bed' | 'sand' | 'backfill' | 'tape' | 'base' | 'surface';
export const COURSES: Course[] = ['bed', 'sand', 'backfill', 'tape', 'base', 'surface'];
export const SPAN: Record<Course, [number, number]> = {
  bed: [FLOOR, BED],
  sand: [BED, Y.sand],
  backfill: [Y.sand, Y.backfill],
  tape: [Y.tape - Y.tapeT / 2, Y.tape + Y.tapeT / 2],
  base: [Y.backfill, Y.base],
  surface: [Y.base, H],
};
// windows as shares of the step that lifts the course, dig, and of the step that returns it. The bed
// returns in step 2, every other course in step 5.
const LIFT: Record<Course, [number, number]> = { surface: [0, 0.42], base: [0.14, 0.58], tape: [0.3, 0.62], backfill: [0.3, 0.74], sand: [0.44, 0.88], bed: [0.6, 1] };
const FALL: Record<Course, [number, number]> = { bed: [0, 1], sand: [0, 0.3], backfill: [0.18, 0.5], tape: [0.44, 0.62], base: [0.52, 0.8], surface: [0.68, 0.97] };

const win = (v: number, [a, b]: [number, number]) => clamp01((v - a) / (b - a));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const digAt = (p: number) => seg(p, 0, P_DIG);
export const sandAt = (p: number) => seg(p, P_DIG, P_SAND);
export const ductsAt = (p: number) => seg(p, P_SAND, P_DUCTS);
export const lightStep = (p: number) => seg(p, P_DUCTS, P_LIGHT);
export const restoreAt = (p: number) => seg(p, P_LIGHT, 1);

// the step p is in, 0 to 4
export function stepAt(p: number) {
  let i = 0;
  for (let k = 1; k < 5; k++) if (p >= STEPS[k]) i = k;
  return i;
}

// The label of each step, opacity at p. A step's label fades in just before its boundary and out
// just after the next one, so the two cross at the boundary. The first one waits for the first bit
// of scroll, so the idle state at p 0 carries no label.
const FADE = 0.014;
export function labelAt(p: number, i: number) {
  const a = i === 0 ? clamp01(p / 0.02) : clamp01((p - STEPS[i] + FADE) / (2 * FADE));
  const b = i === 4 ? 1 : 1 - clamp01((p - STEPS[i + 1] + FADE) / (2 * FADE));
  return Math.min(a, b);
}

// how far the lift and the fall of a course have got, 0 to 1 each
export function courseAt(p: number, c: Course) {
  return { lift: win(digAt(p), LIFT[c]), fall: win(c === 'bed' ? sandAt(p) : restoreAt(p), FALL[c]) };
}
// share of a course that is out of the ground, which is how much of its face has dissolved
export function cutAt(p: number, c: Course) {
  const k = courseAt(p, c);
  return smooth(k.lift) * (1 - smooth(k.fall));
}
// how full the bed is, the floor of the trench rises with it from FLOOR to BED
export const bedFill = (p: number) => smooth(win(sandAt(p), [0.1, 1]));

// The ducts draw back out of the far end late in the dig, once the ground above them has lifted, each
// a little after the one before, and slide in again in step 3 the same way. 0 is home, 1 all the way
// out past the far end. They are out of the trench for all of step 2.
export const SLIDE = L + 2.2;
export function ductOut(p: number, i: number) {
  if (p < P_SAND) return smooth(clamp01((digAt(p) - 0.36 - i * 0.045) / 0.45));
  const back = clamp01((ductsAt(p) - i * 0.1) / 0.55);
  return Math.pow(1 - back, 3);
}

// The ducts are empty from the dig to the end of step 5. The strands the finished specimen carries
// out of the orange duct leave with it in the dig and come back as the ground closes.
export function fibreAlpha(p: number) {
  if (p < P_SAND) return 1 - smooth(seg(digAt(p), 0.2, 0.5));
  return smooth(seg(p, 0.9, 0.99));
}

// light in the ducts in step 4, from the far end to the near one, then out of the open ends as points
export const LIGHT = { head0: P_DUCTS + 0.005, head1: 0.64, stream0: 0.6, stream1: P_LIGHT };
export function lightAt(p: number) {
  const h = clamp01((p - LIGHT.head0) / (LIGHT.head1 - LIGHT.head0));
  const glow = clamp01((p - LIGHT.head0) / 0.02) * (1 - clamp01((p - LIGHT.head1 + 0.02) / 0.05));
  return { head: h, glow, stream: clamp01((p - LIGHT.stream0) / (LIGHT.stream1 - LIGHT.stream0)) };
}

// the headline, lede and buttons leave in the last part of step 5, 0 to 1
export const textGone = (p: number) => smooth(seg(p, 0.82, 1));

// ---- the ground as points, sampled inside each course's volume in the trench, with a place in the
// cloud. Seeded, so every frame and every shot draws the same points.

export const PALETTE: Record<Course, string[]> = {
  surface: ['#2b2b2e', '#3a3a3e', '#56565b', '#242426'],
  base: ['#8f897d', '#a39c8f', '#716c63', '#b5ae9f', '#5e5a52'],
  tape: ['#d00b11'],
  backfill: ['#6e6559', '#85796b', '#4a4137', '#9a9183', '#5b5247'],
  sand: ['#b7ae9f', '#9d9586', '#cfc7b8', '#8a8274'],
  bed: ['#b7ae9f', '#9d9586', '#cfc7b8', '#8a8274'],
};
// bands in the cloud, surface on top since it lifts first
const BAND: Record<Course, [number, number]> = { surface: [0.3, 0.42], base: [0.21, 0.34], tape: [0.18, 0.26], backfill: [0.1, 0.24], sand: [0.05, 0.16], bed: [0.02, 0.1] };
export const CLOUD_Y = H + 0.04;
// the bed is thin and has to read as a pour, so it gets more points than its volume
const WEIGHT: Record<Course, number> = { bed: 3, sand: 1, backfill: 1, tape: 0, base: 1, surface: 1 };

export type Grain = { home: V3; cloud: V3; color: string; course: number; r: number; s: number };

// n is the total, shared by volume so every course looks as dense as the next
export function sampleGround(n: number, seed = 7): Grain[] {
  const r = rng(seed);
  const vol = COURSES.map((c) => Math.max(0.05, SPAN[c][1] - SPAN[c][0]) * WEIGHT[c]);
  const sum = vol.reduce((a, b) => a + b, 0);
  const out: Grain[] = [];
  COURSES.forEach((c, ci) => {
    const k = c === 'tape' ? Math.round(n * 0.035) : Math.round((n * 0.965 * vol[ci]) / sum);
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
      const rr = r();
      // the sand pours in from the near end and runs down the trench, so the bed's delay follows x
      const delay = c === 'bed' ? 0.7 * (1 - (x + L / 2) / L) + 0.3 * rr : rr;
      out.push({ home: [x, y, z], cloud: [cx, cy, cz], color: PALETTE[c][Math.floor(r() * PALETTE[c].length)], course: ci, r: delay, s: r() });
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
