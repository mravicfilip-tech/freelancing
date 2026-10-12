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
// T is one move. The hall of the robots, drawn from its own camera, pushes the rental depot off the top of the frame, the two meet on
// one hard edge that climbs the frame, the depot above it and the hall below it. By STRIP_END the hall fills the frame.
export const STRIP_START = 10500;
export const STRIP_END = 10860;
export const SWAP_T = STRIP_END;
export const strip = (pos: number) => eio(seg(pos, STRIP_START, STRIP_END));
// B cuts from the black of the truck straight to the dark stage of the schematic at B_CUT, where the drawing is drawn on
export const B_CUT = 7790;
export const regionAt = (pos: number): Region => (pos < B_CUT ? 'site' : pos < T.N.start ? 'bp' : pos < SWAP_T ? 'grid' : 'bots');

// Keys per region. SITE target x is relative to the outdoor forklift's x, the others are absolute.
const KEYS: Record<Region, Key[]> = {
  site: [
    // H holds the truck high enough that the road ends above the headline, so the title stands on bare ground. D1 lowers the view
    // to the C1 framing, the road in the middle of the frame and the bare ground under it for the spec row.
    K(0, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.4, true),
    K(500, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.4, true),
    K(1500, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.5, true),
    K(2900, [0.5, 1.2, 0], 0, 6, 16.5, 26, SX, 0.5, true),
    // F flips from side on to straight down, swinging round to the front of the truck
    K(3180, [0.5, 0.8, -1.5], 46, 38, 23, 26, 0.62, 0.45),
    K(3500, [0.5, 0, -4.5], 90, 90, 36, 26, 0.59, 0.4, true),
    // R follows the truck along the S
    K(4700, [0.5, 0, -4.5], 90, 90, 36, 26, 0.59, 0.4, true),
    // Z flies over the roof until it fills the screen
    K(5300, [24, 11, -9], 90, 90, 13, 26, 0.5, 0.5, true),
    // the opened hall stays a calm floor with its lane lines under the cut out of the shell for the whole hold of the models
    K(6240, [24, 11, -9], 90, 90, 13, 26, 0.5, 0.5, true),
    // as the text leaves, the model from a high corner, the hall in columns 7 to 12, columns 1 to 6 still under the text cell
    // it rises straight up first, so it never passes close to the trees round the hall, then swings to the corner
    K(6390, [24, 1.5, -9], 90, 90, 70, 22, 0.72, 0.5, true),
    K(6480, [24, 1.5, -9], 40, 37, 104, 20, 0.75, 0.5, true),
    // A, low and side on, then swinging into the aisle
    K(6700, [21, 1.3, -9], 6, 9, 26, 30, 0.5, 0.52),
    K(7050, [26.5, 1.2, -9], 50, 7, 18, 30, 0.5, 0.52),
    K(7600, [30.7, 1.15, -9], 90, 6.5, 11, 30, 0.5, 0.52, true),
    // B pushes into the black of the truck
    K(7790, [31.1, 1.0, -9], 90, 4, 0.5, 30, 0.5, 0.5, true),
    K(8000, [31.1, 1.0, -9], 90, 4, 0.5, 30, 0.5, 0.5, true),
  ],
  // S sees the X50 schematic from behind and above, in columns 5 to 12
  bp: [K(8000, [-0.3, 1.0, BP_Z], -35, 26, 13, 28, 0.65, 0.5, true), K(9600, [-0.3, 1.0, BP_Z], -35, 26, 13, 28, 0.65, 0.5, true)],
  // N frames the depot under the text band, the rig fits it to the viewport, see gridFit
  grid: [K(9600, [0, 1.2, GRID_Z], 0, 24, 56, 20, 0.74, 0.7, true), K(SWAP_T, [0, 1.2, GRID_Z], 0, 24, 56, 20, 0.74, 0.7, true)],
  // AT, a three quarter view of the order at about 4 m eye height, from the south west, the job in the right half
  // close enough that the active C-Matic is about 180px across at 1920, the order stays right of the column 7 line
  bots: [K(SWAP_T, [3.0, 0.9, BOTS_Z - 2.9], -28, 13, 15.5, 26, 0.77, 0.63, true), K(12000, [3.0, 0.9, BOTS_Z - 2.9], -28, 13, 15.5, 26, 0.77, 0.63, true)],
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
// the camera backs off over the flat floor first, then the walls and racks rise under the high corner view
export const wallsGrow = (pos: number) => smooth(seg(pos, 6380, 6560));
export const racksGrow = (pos: number) => smooth(seg(pos, 6420, 6620));
export const propsGrow = (pos: number) => smooth(seg(pos, 6460, 6650));
// the lane lines of the floor are painted from the moment the roof is off, so the floor under the cut out reads as the hall's
export const linesOn = (pos: number) => pos >= 5700;
// the racks on the near side of the aisle are cut down for the side view, and rise again only once the camera has swung into the
// aisle, so it never looks through a rising row at a load a metre from the lens
export const nearRacks = (pos: number) => {
  const cut = lerp(0.22, 0, smooth(seg(pos, 6420, 6650)));
  return pos < 6900 ? cut : lerp(0, 1, smooth(seg(pos, 7400, 7650)));
};
// the indoor truck in the main aisle, heading east
export const AISLE_Z = WH.cz;
export const IN_X0 = 178;
export const IN_X1 = 196.5;
export const indoorX = (pos: number) => lerp(IN_X0, IN_X1, eio(seg(pos, 6450, 7600)));
// the warehouse grows from a flat floor, and the hero truck only exists once props appear
// B pushes the camera into the black part of the truck and cuts, where it fills the frame, to the dark stage of the schematic. There
// the X50 is drawn the way a draughtsman draws it, the outer contour at once, then the centre lines, the edges from the ground up, the
// wheels as arcs that close, and last the dimensions with their figures. Lines are added, never faded. The share drawn, 0 to 1, is
// whole by the time the S text arrives.
export const drawOn = (pos: number) => (pos < B_CUT ? 0 : eio(seg(pos, B_CUT + 10, T.S.start - 20)));

// P text sits on a hard edged cell of plain ground, from the left edge to the column 7 line of the grid (the frame's 50 percent
// and 12px) and from the top rule down. It wipes open by its right edge just before the text arrives and holds to the end of the
// hold, so no part of the hall enters columns 1 to 6 while P is on screen, then wipes shut at the start of A. The hall behind it
// is whole and runs on under it. The share of that width, 0 to 1.
//
// R has the same cell over columns 1 to 4, to the column 5 line, in the exact ground colour of the yard as it renders (#f1f1f1),
// so it cannot be seen until the hall and its shadow reach it late in the hold. It closes over the first 90px of Z.
export type Cell = { share: number; edge: string; ground: string };
const R_GROUND = '#f1f1f1';
const cellOut: Cell = { share: 0, edge: '50% + 12px', ground: '#ffffff' };
export const textCell = (pos: number): Cell => {
  if (pos < T.Z.end) {
    cellOut.share = eio(seg(pos, T.R.start + 0.5 * (T.R.end - T.R.start), T.R.start + 0.55 * (T.R.end - T.R.start))) * (1 - eio(seg(pos, T.R.end, T.R.end + 90)));
    cellOut.edge = '33.3333% + 24px';
    cellOut.ground = R_GROUND;
  } else {
    cellOut.share = eio(seg(pos, 5230, 5300)) * (1 - eio(seg(pos, T.P.end, T.P.end + 90)));
    cellOut.edge = '50% + 12px';
    cellOut.ground = BAND.site;
  }
  return cellOut;
};

// The plain band of the top row, 136px, in the ground of the beat. It turns dark where the shell turns the top row dark, 7790 to
// 9525 and from 10790, and it is white on the lit light beats and the flat floor colour of the depot and the dark floors, so it reads as the ground and not as a panel.
export const BAND = { site: '#ffffff', grid: '#eeeff3', dark: '#222222' };
export const topBand = (pos: number) => ((pos >= 7790 && pos < 9525) || pos >= 10790 ? BAND.dark : pos >= 9525 ? BAND.grid : BAND.site);

/* ------------------------------------------------------------------ S, L, N, T, AT */

export const bpRoll = (pos: number) => pos * 0.026; // metres of wheel travel, so the tyres turn with the scroll
// the lifter, the light section with the fork blade on its top edge, rises in L, top edge in screen units, -1 bottom to +1 top
// the blade has cleared the top row of the page at 9525, where the shell turns the nav from white to ink
export const lift = (pos: number) =>
  pos < 9500 ? -1.2 + 2.27 * seg(pos, 9040, 9500) : pos < 9525 ? 1.07 + 0.23 * seg(pos, 9500, 9525) : 1.3 + 0.25 * seg(pos, 9525, 9610);
// the trucks of the depot drive off to both sides while the hall pushes the depot up
export const gridExit = (pos: number) => seg(pos, STRIP_START, 10780);
// the grid of fifteen fills row by row
export const gridFill = (pos: number) => seg(pos, T.N.start + 60, T.N.end - 120);
export const botPhase = (pos: number) => seg(pos, T.AT.start, T.AT.end);

// Where the depot of N sits. The text takes the top band down to the bottom rule of the spec row, the depot floor with its bays
// runs edge to edge under it, and the trucks stand in three rows across the whole width with bays going on past both edges.
// The view looks north from the south at 24 degrees. The depot's near bay edge is put just above the bottom rule of the grid, and
// the view backs off until the far trucks stand clear of the spec row, never closer than 38 m across. This is the camera maths of
// the director written out for the depot, so the fit can be solved before the picture is drawn.
const DEPOT = { el: 24, fov: 20, near: 5.4 + 2.3, far: -5.4 - 2.3, truck: 2.5, y: 1.2 };
export const gridFit = (w: number, h: number, topLimit = 524) => {
  const aspect = w / h;
  const el = (DEPOT.el * Math.PI) / 180;
  const f = h / 2 / Math.tan((DEPOT.fov * Math.PI) / 360);
  // screen y of a point in the depot's own metres (z south, y up) for a camera d away, the look at point at the frame middle
  const rowY = (d: number, z: number, y: number) => {
    const vy = y - DEPOT.y - d * Math.sin(el);
    const vz = z - d * Math.cos(el);
    const depth = vy * -Math.sin(el) + vz * -Math.cos(el);
    const up = vy * Math.cos(el) + vz * -Math.sin(el);
    return h / 2 - (f * up) / depth;
  };
  let d = 105 / aspect;
  const target = h - 65 - 10;
  let oy = 0.5;
  for (let i = 0; i < 10; i++) {
    oy = 0.5 + (target - rowY(d, DEPOT.near, 0)) / h;
    const farTop = rowY(d, DEPOT.far, DEPOT.truck) + (oy - 0.5) * h;
    if (farTop >= topLimit + 12 || d > (105 / aspect) * 1.3) break;
    d *= 1.04;
  }
  return { ox: 0.5, oy, d };
};
