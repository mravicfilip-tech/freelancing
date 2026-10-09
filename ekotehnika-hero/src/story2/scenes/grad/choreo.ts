// The choreography of the Grad scene for storyline 2, every value a pure function of the scroll position
// in story pixels (clock.pos), so a frozen shot or a reduced motion still draws the same frame the live
// clock does. Metres, x east, z south, y up. A forklift's yaw 0 faces +x and turns toward -z.
//
// The world, west to east along the drive.
//   SITE   the Ekotehnika yard in Vrčin, a straight lane along z = 0, then a short S shaped path to
//          the warehouse that stands at the east end.
//   BP     the blueprint stage, far off at z = 2000, dark.
//   GRID   the rental grid stage at z = 4000, light unlit floor.
//   BOTS   the automation stage at z = 6000, dark.
import { TIMELINE } from '../../timeline';

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const eio = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

const span = (id: string) => TIMELINE.find((b) => b.id === id)!;
export const T = {
  H: span('H'), D1: span('D1'), C1: span('C1'), D2: span('D2'), F: span('F'), R: span('R'), Z: span('Z'),
  P: span('P'), A: span('A'), B: span('B'), S: span('S'), L: span('L'), N: span('N'), T: span('T'), AT: span('AT'),
};

/* ------------------------------------------------------------------ the stages */

export const BP_Z = 2000;
export const GRID_Z = 4000;
export const BOTS_Z = 6000;

// the warehouse at the east end of the path
export const WH = { x0: 170, x1: 210, z0: -23, z1: 5, wall: 7.5, ridge: 11, cx: 190, cz: -9 };

/* ------------------------------------------------------------------ the route */

// A straight lane, then the S, down toward -z and back to +x, then straight to the warehouse door. Each corner
// is a quarter circle of radius ARC_R on the centre line.
export const ARC_R = 3;
export const S_X = 118; // where the first corner starts
export const JOG = 9; // distance between the two straight legs
export const END_X = 166; // the forklift stops here, forks at the warehouse door

type RP = { x: number; z: number; yaw: number; s: number };
const route: RP[] = [];
(() => {
  let s = 0;
  const push = (x: number, z: number, yaw: number) => {
    const last = route[route.length - 1];
    if (last) s += Math.hypot(x - last.x, z - last.z);
    route.push({ x, z, yaw, s });
  };
  for (let x = -100; x < S_X; x += 2) push(x, 0, 0);
  const R = ARC_R;
  const n = 18;
  // corner one, centre (S_X, -R), turning from +x toward -z
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 0.5;
    push(S_X + R * Math.sin(a), -R + R * Math.cos(a), a);
  }
  const zMid = -(JOG - 2 * R);
  for (let z = -R - 1; z > -R + zMid; z -= 1) push(S_X + R, z, Math.PI / 2);
  // corner two, centre (S_X + 2R, -JOG + R) turning from -z toward +x
  const cx = S_X + 2 * R;
  const cz = -JOG + R;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 0.5;
    push(cx - R * Math.cos(a), cz - R * Math.sin(a), Math.PI / 2 - a);
  }
  for (let x = cx + 2; x < END_X; x += 2) push(x, -JOG, 0);
  push(END_X, -JOG, 0);
})();
export const ROUTE_LEN = route[route.length - 1].s;
// route zero is x = -100, so the forklift's arc length counts from there
export const S_START = 100;

export const routePoints = route;

const rp = { x: 0, z: 0, yaw: 0 };
// position and heading at arc length s measured from the forklift's start at x = 0
export function routeAt(s: number, out = rp) {
  const t = clamp01((s + S_START) / ROUTE_LEN) * ROUTE_LEN;
  let lo = 0;
  let hi = route.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (route[m].s <= t) lo = m;
    else hi = m;
  }
  const a = route[lo];
  const b = route[hi];
  const f = b.s > a.s ? (t - a.s) / (b.s - a.s) : 0;
  out.x = lerp(a.x, b.x, f);
  out.z = lerp(a.z, b.z, f);
  out.yaw = lerp(a.yaw, b.yaw, f);
  return out;
}

// the arc length of the end of the drive
export const S_END = ROUTE_LEN - S_START;
export const S_BUILDING = 70; // the forklift rests here at C1, in front of the Ekotehnika building

// How far the outdoor forklift has driven, by scroll position.
export function driven(pos: number) {
  if (pos <= T.D1.start) return 0;
  if (pos <= T.D1.end) return S_BUILDING * eio(seg(pos, T.D1.start, T.D1.end));
  if (pos <= T.D2.start) return S_BUILDING;
  // D2, F and R are one drive, a speed that rises from rest, holds, and eases to a stop at the door, so the world
  // never halts during the flip and the truck is at the start of the S when R begins
  const A = 500;
  const Dd = 300;
  const total = T.R.end - T.D2.start;
  const v = (S_END - S_BUILDING) / (total - A / 2 - Dd / 2);
  const x = Math.min(total, pos - T.D2.start);
  let d: number;
  if (x < A) d = (v * x * x) / (2 * A);
  else if (x < total - Dd) d = v * (A / 2 + (x - A));
  else {
    const y = total - x;
    d = (S_END - S_BUILDING) - (v * y * y) / (2 * Dd);
  }
  return Math.min(S_END, S_BUILDING + d);
}

// fork height of the outdoor truck, up at the stop in front of the building
export function outLift(pos: number) {
  const up = smooth(seg(pos, 1150, 1500)) * (1 - smooth(seg(pos, 2300, 2650)));
  return 0.35 + 1.75 * up;
}

/* ------------------------------------------------------------------ the camera */

export type Pose = {
  t: [number, number, number]; // look at point, x relative to the outdoor forklift in the SITE region
  yaw: number; // degrees, 0 puts the camera on +z, 90 on +x
  el: number; // degrees above the horizon, 90 is straight down
  d: number;
  fov: number;
  ox: number; // where the look at point lands on screen, 0 to 1
  oy: number;
};
type Key = { p: number; v: number[]; stop?: boolean };
const K = (p: number, t: [number, number, number], yaw: number, el: number, d: number, fov: number, ox: number, oy: number, stop = false): Key => ({
  p,
  v: [t[0], t[1], t[2], yaw, el, d, fov, ox, oy],
  stop,
});

// Subject positions on screen. The shell's text sits at the left, so the subject is right of centre.
const SX = 0.78;

export type Region = 'site' | 'bp' | 'grid' | 'bots';
export const SWAP_T = 10840; // the dark floor covers the whole screen, the robot floor takes over
export const regionAt = (pos: number): Region => (pos < T.S.start ? 'site' : pos < T.N.start ? 'bp' : pos < SWAP_T ? 'grid' : 'bots');

// Keys per region. SITE target x is relative to the outdoor forklift's x, the others are absolute.
const KEYS: Record<Region, Key[]> = {
  site: [
    // H, D1, C1, D2 the side on drive, the forklift stays at the same spot on screen
    K(0, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.5, true),
    K(2900, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.5, true),
    // F flips from side on to straight down, swinging round to the front of the truck
    K(3180, [0.5, 0.8, -1.5], 46, 38, 23, 26, 0.62, 0.45),
    K(3500, [0.5, 0, -4.5], 90, 90, 36, 26, 0.59, 0.4, true),
    // R follows the truck along the S
    K(4700, [0.5, 0, -4.5], 90, 90, 36, 26, 0.59, 0.4, true),
    // Z flies over the roof until it fills the screen
    K(5300, [24, 11, -9], 90, 90, 13, 26, 0.5, 0.5, true),
    K(5850, [24, 11, -9], 90, 90, 13, 26, 0.5, 0.5, true),
    // P, then the model from a high corner
    K(6400, [24, 1.5, -9], 40, 37, 104, 20, 0.5, 0.5, true),
    // A, low and side on, then swinging into the aisle
    K(6700, [21, 1.3, -9], 6, 9, 26, 30, 0.5, 0.52),
    K(7050, [26.5, 1.2, -9], 50, 7, 18, 30, 0.5, 0.52),
    K(7600, [30.7, 1.15, -9], 90, 6.5, 11, 30, 0.5, 0.52, true),
    // B pushes into the black of the truck
    K(8000, [31.1, 1.0, -9], 90, 4, 0.5, 30, 0.5, 0.5, true),
  ],
  bp: [K(8000, [0, 1.1, BP_Z], 50, 28, 12.5, 24, 0.7, 0.5, true), K(9600, [0, 1.1, BP_Z], 50, 28, 12.5, 24, 0.7, 0.5, true)],
  grid: [K(9600, [0, 1.2, GRID_Z], 0, 17, 44, 20, 0.5, 0.7, true), K(SWAP_T, [0, 1.2, GRID_Z], 0, 17, 44, 20, 0.5, 0.7, true)],
  bots: [K(SWAP_T, [0, 0, BOTS_Z], 0, 90, 19, 26, 0.5, 0.5, true), K(12000, [0, 0, BOTS_Z], 0, 90, 19, 26, 0.5, 0.5, true)],
};

const out = new Array(9).fill(0);
export function camAt(pos: number, region = regionAt(pos)): Pose {
  const ks = KEYS[region];
  const n = ks.length;
  const p = Math.min(ks[n - 1].p, Math.max(ks[0].p, pos));
  let i = 0;
  while (i < n - 2 && p > ks[i + 1].p) i++;
  const a = ks[i];
  const b = ks[i + 1];
  const h = b.p - a.p;
  const s = h > 0 ? (p - a.p) / h : 0;
  const s2 = s * s;
  const s3 = s2 * s;
  const tan = (k: number, c: number) => {
    const kk = ks[k];
    if (kk.stop || k === 0 || k === n - 1) return 0;
    return (ks[k + 1].v[c] - ks[k - 1].v[c]) / (ks[k + 1].p - ks[k - 1].p);
  };
  for (let c = 0; c < 9; c++) {
    out[c] = (2 * s3 - 3 * s2 + 1) * a.v[c] + (s3 - 2 * s2 + s) * h * tan(i, c) + (-2 * s3 + 3 * s2) * b.v[c] + (s3 - s2) * h * tan(i + 1, c);
  }
  return { t: [out[0], out[1], out[2]], yaw: out[3], el: out[4], d: out[5], fov: out[6], ox: out[7], oy: out[8] };
}

/* ------------------------------------------------------------------ the warehouse */

// Roof halves slide apart, then the model grows
export const roofSlide = (pos: number) => smooth(seg(pos, 5450, 5700));
export const wallsGrow = (pos: number) => smooth(seg(pos, 5800, 6150));
export const racksGrow = (pos: number) => smooth(seg(pos, 5900, 6250));
export const propsGrow = (pos: number) => smooth(seg(pos, 6050, 6350));
// the racks on the near side of the aisle are cut down for the side view, then rise again as the camera swings in
export const nearRacks = (pos: number) => {
  const cut = lerp(0.22, 0, smooth(seg(pos, 6420, 6650)));
  return pos < 6900 ? cut : lerp(0, 1, smooth(seg(pos, 6950, 7350)));
};
// the indoor truck in the main aisle, heading east
export const AISLE_Z = WH.cz;
export const IN_X0 = 178;
export const IN_X1 = 196.5;
export const indoorX = (pos: number) => lerp(IN_X0, IN_X1, eio(seg(pos, 6450, 7600)));
// the warehouse grows from a flat floor, and the hero truck only exists once props appear
export const blackOut = (pos: number) => (pos < T.S.start ? smooth(seg(pos, 7650, 7790)) : 1 - smooth(seg(pos, 8000, 8160)));

/* ------------------------------------------------------------------ S, L, N, T, AT */

export const bpRoll = (pos: number) => pos * 0.026; // metres of wheel travel, so the tyres turn with the scroll
// the lifter, the light section with the fork blade on its top edge, rises in L, top edge in screen units, -1 bottom to +1 top
// the blade has cleared the top row of the page at 9525, where the shell turns the nav from white to ink
export const lift = (pos: number) =>
  pos < 9500 ? -1.2 + 2.27 * seg(pos, 9040, 9500) : pos < 9525 ? 1.07 + 0.23 * seg(pos, 9500, 9525) : 1.3 + 0.25 * seg(pos, 9525, 9610);
// T, the dark floor comes up from the bottom while the grid drops away
// and reaches the top row at 10790, where the shell turns the nav white
export const darkRise = (pos: number) => -1.2 + 2.45 * seg(pos, 10520, 10830);
export const gridDrop = (pos: number) => smooth(seg(pos, 10500, 10830));
// the grid of fifteen fills row by row
export const gridFill = (pos: number) => seg(pos, T.N.start + 60, T.N.end - 120);
// the robots, the dotted paths draw on in the second half of T
export const pathDraw = (pos: number) => smooth(seg(pos, SWAP_T + 10, 11120));
export const botPhase = (pos: number) => seg(pos, T.AT.start, T.AT.end);
