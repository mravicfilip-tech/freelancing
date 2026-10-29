// The Najam warehouse as one plan, in hall metres. The hall hangs on the Najam point NP, x runs from the racks out to the dock wall
// and z across the hall, so a hall point (x, z) is the world point (NP.x + x, NP.z + z). Everything that moves in N3 is laid out
// here as a pure function of k of N, the same idea as atplan.ts for the robots, so a frozen clock always draws the same picture and
// scrolling back plays it backwards. Kept free of three so the shell and a plain node check can read it.
//
// N3 is k 0.5 to 0.79 of N. The camera follows one Linde X50 that racks three pallets, one per bay in the first three bays of aisle
// two, then a reach truck lifts the fourth to the top beam. Two other trucks cross the cross aisle at the end of the hall with a pallet
// each. The four pallets are set down at N_PALLETS (timeline.ts), the lit term cell in the shell reads the same marks.
import { track } from '../../../story/scenes/sistem/tracks';
import { N_PALLETS, N_SUB } from '../../timeline';

const PI = Math.PI;
const rad = (d: number) => (d * PI) / 180;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// ---- the hall ---------------------------------------------------------------------------------------------------------

export const HALL = {
  // the inner face of the dock wall, the staging floor runs from the racks out to it
  dockX: 14,
  // the end wall of the depot, WALL_A of grid.tsx, 31.7 m behind the Najam point
  backX: -31.7,
  // the far side wall
  sideZ: -16.2,
  // the front of the rack blocks, toward the staging floor, ten bays of 2.7 m run back from it
  rackX0: 2,
  bay: 2.7,
  bays: 10,
  // three aisles, 5.5 m wide, and four rack blocks of two rows back to back between them. A dock door stands at every block centre.
  aisles: [-7.7, 0, 7.7],
  aisleHalf: 2.75,
  blocks: [-11.55, -3.85, 3.85, 11.55],
  docks: [-11.55, -3.85, 3.85, 11.55],
  // the beam heights of the racks, the pallets of a level stand on the beam, the floor level on the floor
  levels: [0, 1.5, 3.0, 4.5],
} as const;

// the bottom of a pallet that stands on a level, on the flange of its beam
export const levelY = (ly: number) => (ly === 0 ? 0 : ly + 0.1);
// the x of a pallet place in a bay, sub 1 is the half nearer the staging floor, sub 0 the half behind it
export const slotX = (b: number, sub: 0 | 1) => HALL.rackX0 - HALL.bay * (b + 0.5) + (sub ? 0.65 : -0.65);
// the z of the pallet row that faces aisle two on its -z side, the side the trucks work on, away from the text
export const FACE_Z = -3.3;
// the heading of a truck that faces the racks on the -z side, in degrees
const FACE = 270;

// ---- pallets and trucks -----------------------------------------------------------------------------------------------

// th is the heading in radians, 0 faces +x and a truck faces -z at 3 PI / 2, the same as the heading of a route
export type Spot = { x: number; y: number; z: number; th: number };

// Where the four pallets of N3 end up. The first three go side by side on the first beam at the mouth of the aisle, the fourth on the
// top beam six bays in.
export const SLOTS: Spot[] = [
  { x: slotX(0, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(0, 0), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(1, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(6, 1), y: levelY(4.5), z: FACE_Z, th: rad(FACE) },
];
// Whether a rack place is one of them, so the racks leave it empty for the pallet to land in. z is the row's z, ly the beam height.
export const isHeroSlot = (x: number, z: number, ly: number) => SLOTS.some((s) => Math.abs(s.x - x) < 0.3 && Math.abs(s.z - z) < 0.3 && Math.abs(s.y - levelY(ly)) < 0.05);

// Two staged pallets wait at the mouth of aisle two for the X50, one behind the other, on the -z side so the truck's lane stays clear.
const STAGE = [
  { x: 3.4, z: -1.4 },
  { x: 4.6, z: -1.4 },
];
// How far in front of the truck's origin the centre of its pallet stands, and how high a pallet's bottom sits over the fork height.
const X50_FWD = 1.15;
const X50_PAL = 0.065;
const R16_FWD = 0.75;
const R16_PAL = 0.07;

// ---- routes -----------------------------------------------------------------------------------------------------------

// A waypoint of a truck's route. th is the heading in degrees, 0 faces +x and 270 faces -z, and the truck turns right as it grows.
// dir is the direction of travel of the leg that leaves the waypoint, 1 forward and -1 in reverse. mi and mo set how hard the path
// bends into and out of it, 1.657 times the radius makes a 90 degree turn of that radius, and the chord of the leg is the default.
export type Way = { x: number; z: number; th: number; dir?: 1 | -1; mi?: number; mo?: number };

type Samples = { s: number; x: number; z: number; th: number; roll: number };

export type Route = {
  /** the arc length of the route, and at each waypoint */
  len: number;
  at: number[];
  pose: (s: number, out?: { x: number; z: number; th: number; roll: number }) => { x: number; z: number; th: number; roll: number };
};

// Each leg is a cubic between two waypoints. The heading is the direction the path runs, turned half a circle in reverse, so a truck
// never slides sideways, and the roll of its wheels is the signed distance it has covered.
export function route(ways: Way[]): Route {
  const pts: Samples[] = [];
  const at: number[] = [];
  let s = 0;
  let roll = 0;
  let th = rad(ways[0].th);
  for (let i = 0; i < ways.length - 1; i++) {
    const a = ways[i];
    const b = ways[i + 1];
    const dir = a.dir ?? 1;
    const chord = Math.hypot(b.x - a.x, b.z - a.z);
    const m0 = a.mo ?? chord;
    const m1 = b.mi ?? chord;
    const t0 = [dir * m0 * Math.cos(rad(a.th)), dir * m0 * Math.sin(rad(a.th))];
    const t1 = [dir * m1 * Math.cos(rad(b.th)), dir * m1 * Math.sin(rad(b.th))];
    at.push(s);
    const N = 64;
    let px = a.x;
    let pz = a.z;
    for (let j = 0; j <= N; j++) {
      const t = j / N;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = (2 * t3 - 3 * t2 + 1) * a.x + (t3 - 2 * t2 + t) * t0[0] + (-2 * t3 + 3 * t2) * b.x + (t3 - t2) * t1[0];
      const z = (2 * t3 - 3 * t2 + 1) * a.z + (t3 - 2 * t2 + t) * t0[1] + (-2 * t3 + 3 * t2) * b.z + (t3 - t2) * t1[1];
      if (j > 0) {
        const d = Math.hypot(x - px, z - pz);
        s += d;
        roll += dir * d;
        px = x;
        pz = z;
      }
      // the heading from the slope of the cubic, a reversing truck faces the other way along its path
      const dx = (6 * t2 - 6 * t) * a.x + (3 * t2 - 4 * t + 1) * t0[0] + (-6 * t2 + 6 * t) * b.x + (3 * t2 - 2 * t) * t1[0];
      const dz = (6 * t2 - 6 * t) * a.z + (3 * t2 - 4 * t + 1) * t0[1] + (-6 * t2 + 6 * t) * b.z + (3 * t2 - 2 * t) * t1[1];
      let h = Math.atan2(dz, dx) + (dir < 0 ? PI : 0);
      while (h - th > PI) h -= 2 * PI;
      while (h - th < -PI) h += 2 * PI;
      th = h;
      pts.push({ s, x, z, th, roll });
    }
  }
  at.push(s);
  const pose = (q: number, out = { x: 0, z: 0, th: 0, roll: 0 }) => {
    const v = Math.min(Math.max(q, 0), s);
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (pts[m].s <= v) lo = m;
      else hi = m;
    }
    const A = pts[lo];
    const B = pts[hi];
    const f = B.s - A.s > 1e-9 ? (v - A.s) / (B.s - A.s) : 0;
    out.x = A.x + (B.x - A.x) * f;
    out.z = A.z + (B.z - A.z) * f;
    out.th = A.th + (B.th - A.th) * f;
    out.roll = A.roll + (B.roll - A.roll) * f;
    return out;
  };
  return { len: s, at, pose };
}

// ---- the X50, the truck the camera follows ----------------------------------------------------------------------------

const R = 2.0;
const BEND = 1.657 * R;
const RR = 1.3;
const BEND_R = 1.657 * RR;
// Three trips. The truck stands at the staging floor with the first pallet on its forks and backs into aisle two, swings its nose
// round to face the rack and sets the pallet on the first beam. It backs out, drives forward to the next staged pallet at the mouth of
// the aisle, backs into the aisle again and racks the second, and once more for the third, then drives back out to its place.

// the lane the truck drives in along aisle two, near the middle, where the swing of its tail on a turn stays inside the aisle
const LANE = 0.3;
const X50_WAYS: Way[] = [
  { x: 9.0, z: LANE, th: 0, dir: -1 }, // 0 at rest with the first pallet
  { x: SLOTS[0].x - R, z: LANE, th: 0, dir: 1, mo: BEND }, // 1 where the first turn starts
  { x: SLOTS[0].x, z: LANE - R, th: FACE, dir: 1, mi: BEND }, // 2 facing the rack
  { x: SLOTS[0].x, z: FACE_Z + X50_FWD, th: FACE, dir: -1 }, // 3 the pallet is in the rack
  { x: SLOTS[0].x, z: FACE_Z + X50_FWD + 1.4, th: FACE, dir: -1, mo: BEND_R }, // 4 backed out of the rack
  { x: SLOTS[0].x - RR, z: FACE_Z + X50_FWD + 1.4 + RR, th: 0, dir: 1, mi: BEND_R }, // 5 facing the mouth
  { x: STAGE[0].x - X50_FWD, z: STAGE[0].z, th: 0, dir: -1 }, // 6 the forks are in the second pallet
  { x: SLOTS[1].x - R, z: LANE, th: 0, dir: 1, mo: BEND }, // 7 where the second turn starts
  { x: SLOTS[1].x, z: LANE - R, th: FACE, dir: 1, mi: BEND }, // 8
  { x: SLOTS[1].x, z: FACE_Z + X50_FWD, th: FACE, dir: -1 }, // 9 the second pallet is in the rack
  { x: SLOTS[1].x, z: FACE_Z + X50_FWD + 1.4, th: FACE, dir: -1, mo: BEND_R }, // 10
  { x: SLOTS[1].x - RR, z: FACE_Z + X50_FWD + 1.4 + RR, th: 0, dir: 1, mi: BEND_R }, // 11
  { x: STAGE[1].x - X50_FWD, z: STAGE[1].z, th: 0, dir: -1 }, // 12 the forks are in the third pallet
  { x: SLOTS[2].x - R, z: LANE, th: 0, dir: 1, mo: BEND }, // 13
  { x: SLOTS[2].x, z: LANE - R, th: FACE, dir: 1, mi: BEND }, // 14
  { x: SLOTS[2].x, z: FACE_Z + X50_FWD, th: FACE, dir: -1 }, // 15 the third pallet is in the rack
  { x: SLOTS[2].x, z: FACE_Z + X50_FWD + 1.4, th: FACE, dir: -1, mo: BEND_R }, // 16
  { x: SLOTS[2].x - RR, z: FACE_Z + X50_FWD + 1.4 + RR, th: 0, dir: 1, mi: BEND_R }, // 17
  { x: 9.0, z: LANE, th: 0 }, // 18 back at rest
];
const X50_ROUTE = route(X50_WAYS);

// k of N the truck reaches each waypoint, a pause is a repeat. Hand set so a trip takes about a fifth of N3 and the truck rests while
// its forks work, at the rack and at the staged pallet.
const X50_T: [number, number][] = [
  [0.5, 0],
  [0.507, 0],
  [0.552, 1],
  [0.555, 1],
  [0.568, 2],
  [0.575, 3],
  [0.59, 3],
  [0.595, 4],
  [0.603, 5],
  [0.605, 5],
  [0.615, 6],
  [0.621, 6],
  [0.633, 7],
  [0.635, 7],
  [0.642, 8],
  [0.647, 9],
  [0.656, 9],
  [0.66, 10],
  [0.667, 11],
  [0.669, 11],
  [0.679, 12],
  [0.685, 12],
  [0.699, 13],
  [0.701, 13],
  [0.709, 14],
  [0.714, 15],
  [0.723, 15],
  [0.728, 16],
  [0.735, 17],
  [0.738, 17],
  [0.79, 18],
];
const X50_S = track(X50_T.map(([k, w]) => [k, X50_ROUTE.at[w]] as [number, number]));

// The forks, raised as the truck swings round to the rack, lowered to set the pallet down at its mark, dropped to the floor for the
// next pallet and raised a hand's width to carry it.
const X50_LIFT = track([
  [0.0, 0.15],
  [0.545, 0.15],
  [0.57, 1.615],
  [0.576, 1.615],
  [0.585, 1.535],
  [0.589, 1.45],
  [0.599, 1.45],
  [0.607, 0.05],
  [0.613, 0.02],
  [0.617, 0.02],
  [0.622, 0.15],
  [0.64, 0.15],
  [0.644, 1.615],
  [0.648, 1.615],
  [0.652, 1.535],
  [0.656, 1.45],
  [0.664, 1.45],
  [0.668, 0.05],
  [0.676, 0.02],
  [0.68, 0.02],
  [0.686, 0.15],
  [0.707, 0.15],
  [0.711, 1.615],
  [0.714, 1.615],
  [0.718, 1.535],
  [0.723, 1.45],
  [0.731, 1.45],
  [0.737, 0.05],
  [1.0, 0.05],
]);

// ---- the reach truck, the last pallet to the top beam -----------------------------------------------------------------

// the carriage reaches forward 1.1 m to push the pallet into the rack, the truck stands with its legs at the rack face
const R16_REACH = 1.1;
export const R16 = { x: SLOTS[3].x, z: FACE_Z + R16_FWD + R16_REACH, th: FACE };
const R16_LIFT = track([
  [0.0, 0.15],
  [0.7, 0.15],
  [0.748, SLOTS[3].y - R16_PAL + 0.08],
  [0.762, SLOTS[3].y - R16_PAL + 0.08],
  [0.776, SLOTS[3].y - R16_PAL],
  [0.779, SLOTS[3].y - R16_PAL],
  [0.79, 0.15],
  [1.0, 0.15],
]);
const R16_OUT = track([
  [0.0, 0],
  [0.752, 0],
  [0.768, R16_REACH],
  [0.776, R16_REACH],
  [0.781, R16_REACH],
  [0.789, 0],
  [1.0, 0],
]);

// ---- trucks that cross the end of the hall ----------------------------------------------------------------------------

// A D12 and an H30 cross the cross aisle behind the last bay, each with a pallet on its forks, one from each side.
const CROSS_D12 = { x: -28.0, z0: 12.0, z1: -12.0, k0: 0.53, k1: 0.71 };
const CROSS_H30 = { x: -30.0, z0: -12.5, z1: 10.0, k0: 0.57, k1: 0.76 };
const ease = (t: number) => t * t * (3 - 2 * t);
const crossAt = (c: { z0: number; z1: number; k0: number; k1: number }, k: number) => c.z0 + (c.z1 - c.z0) * ease(clamp01((k - c.k0) / (c.k1 - c.k0)));

// ---- the poses --------------------------------------------------------------------------------------------------------

export type Pose = { x: number; z: number; th: number; lift: number; roll: number; reach: number };
const mk = (): Pose => ({ x: 0, z: 0, th: 0, lift: 0, roll: 0, reach: 0 });

const tmp = { x: 0, z: 0, th: 0, roll: 0 };
export function x50At(k: number, out: Pose = mk()): Pose {
  X50_ROUTE.pose(X50_S(k), tmp);
  out.x = tmp.x;
  out.z = tmp.z;
  out.th = tmp.th;
  out.roll = tmp.roll;
  out.lift = X50_LIFT(k);
  out.reach = 0;
  return out;
}

export function r16At(k: number, out: Pose = mk()): Pose {
  out.x = R16.x;
  out.z = R16.z;
  out.th = rad(R16.th);
  out.roll = 0;
  out.lift = R16_LIFT(k);
  out.reach = R16_OUT(k);
  return out;
}

// a truck on the z axis faces PI / 2 going +z and 3 PI / 2 going -z
export function d12At(k: number, out: Pose = mk()): Pose {
  const z = crossAt(CROSS_D12, k);
  out.x = CROSS_D12.x;
  out.z = z;
  out.th = rad(CROSS_D12.z1 < CROSS_D12.z0 ? 270 : 90);
  out.lift = 0;
  out.roll = Math.abs(z - CROSS_D12.z0);
  out.reach = 0;
  return out;
}

export function h30At(k: number, out: Pose = mk()): Pose {
  const z = crossAt(CROSS_H30, k);
  out.x = CROSS_H30.x;
  out.z = z;
  out.th = rad(CROSS_H30.z1 < CROSS_H30.z0 ? 270 : 90);
  out.lift = 0;
  out.roll = Math.abs(z - CROSS_H30.z0);
  out.reach = 0;
  return out;
}

// ---- the pallets ------------------------------------------------------------------------------------------------------

export type PalletPose = { x: number; y: number; z: number; th: number };

// Each of the four pallets, where it waits, which truck carries it and between which k, the first is already on the forks of the X50 and
// the others are picked up from the floor. The marks it is set down at are N_PALLETS, shared with the shell.
type Carry = { from: Spot; by: 'x50' | 'r16'; pick: number; drop: number; to: Spot };
const WAIT = (x: number, z: number): Spot => ({ x, y: 0, z, th: 0 });
export const PALLETS: Carry[] = [
  { from: WAIT(9.0 + X50_FWD, LANE), by: 'x50', pick: -1, drop: N_PALLETS[0], to: SLOTS[0] },
  { from: WAIT(STAGE[0].x, STAGE[0].z), by: 'x50', pick: 0.617, drop: N_PALLETS[1], to: SLOTS[1] },
  { from: WAIT(STAGE[1].x, STAGE[1].z), by: 'x50', pick: 0.681, drop: N_PALLETS[2], to: SLOTS[2] },
  { from: { x: R16.x, y: 0.22, z: R16.z - R16_FWD, th: rad(FACE) }, by: 'r16', pick: -1, drop: N_PALLETS[3], to: SLOTS[3] },
];

const px = mk();
export function palletAt(i: number, k: number, out: PalletPose = { x: 0, y: 0, z: 0, th: 0 }): PalletPose {
  const p = PALLETS[i];
  if (k >= p.drop) {
    out.x = p.to.x;
    out.y = p.to.y;
    out.z = p.to.z;
    out.th = p.to.th;
    return out;
  }
  if (k < p.pick) {
    out.x = p.from.x;
    out.y = p.from.y;
    out.z = p.from.z;
    out.th = p.from.th;
    return out;
  }
  // on the forks, the pallet rides in front of the truck at the height of its forks
  if (p.by === 'x50') {
    x50At(k, px);
    const c = Math.cos(px.th);
    const s = Math.sin(px.th);
    out.x = px.x + c * X50_FWD;
    out.z = px.z + s * X50_FWD;
    // off the floor the pallet takes the height of the forks, so lifting from the floor is not a jump
    out.y = Math.max(0, px.lift) + X50_PAL * clamp01(px.lift / 0.1);
    out.th = px.th;
  } else {
    r16At(k, px);
    const f = R16_FWD + px.reach;
    out.x = px.x + Math.cos(px.th) * f;
    out.z = px.z + Math.sin(px.th) * f;
    out.y = px.lift + R16_PAL;
    out.th = px.th;
  }
  return out;
}

// ---- the camera's own tracks ------------------------------------------------------------------------------------------

// The X50 smoothed over a few hundredths of N, so the follow camera does not jerk on the cusps of the trips.
export function x50Follow(k: number, out: { x: number; z: number } = { x: 0, z: 0 }) {
  const W = 0.026;
  const n = 12;
  let ax = 0;
  let az = 0;
  const p = mk();
  for (let i = 0; i <= n; i++) {
    x50At(k - W + (2 * W * i) / n, p);
    ax += p.x;
    az += p.z;
  }
  out.x = ax / (n + 1);
  out.z = az / (n + 1);
  return out;
}



// ---- the camera -------------------------------------------------------------------------------------------------------

// The camera of N as one pose in the units of the Rig in camera.tsx, a target in hall metres, an orbit distance, a yaw and pitch in
// degrees and the lens shift as a share of the frame. N1, N2 and N4 hold a high three quarter view over the docks and the aisles, N3
// eases down behind and beside the X50 at about 2.7 m, follows it, and rises with the reach truck's lift to see the pallet land on
// the top beam, then eases back up. The last of N hands over to the pose T starts from.
export type Cam = { x: number; y: number; z: number; d: number; yaw: number; pitch: number; sx: number; sy: number; shadow: number };
const cam = (): Cam => ({ x: 0, y: 0, z: 0, d: 0, yaw: 0, pitch: 0, sx: 0, sy: 0, shadow: 0 });

// the high view, the hall from the lorry's side with the staging floor, the dock wall and the aisles in the lower part of the frame
// and the far wall above them where the text of N1 and N2 sits
const HIGH: Cam = { x: 3, y: 0, z: -3, d: 118, yaw: 50, pitch: -30, sx: 0.0, sy: 0.38, shadow: 60 };
// N4 keeps the bottom band of the frame clear for the term cells, so the hall stands higher in it
const HIGH4: Cam = { x: 3, y: 0, z: -3, d: 118, yaw: 50, pitch: -30, sx: 0.17, sy: 0.04, shadow: 60 };
// T begins from the pose of the old rental floor, camera.tsx N_D and N_SY, so the cut to the grid at u 13 lands on the same frame
const T_START: Cam = { x: -0.5, y: 0.9, z: 0, d: 52, yaw: 90, pitch: -24, sx: 0, sy: 0.305, shadow: 18 };
const FOLLOW: Cam = { x: 0, y: 0.9, z: 0, d: 15, yaw: 84, pitch: -8, sx: 0.2, sy: 0.0, shadow: 18 };
const REACH: Cam = { x: R16.x + 0.3, y: 1.0, z: -1.8, d: 11, yaw: 90, pitch: -6, sx: 0.2, sy: 0.0, shadow: 18 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Cam, b: Cam, t: number, o: Cam) => {
  o.x = lerp(a.x, b.x, t);
  o.y = lerp(a.y, b.y, t);
  o.z = lerp(a.z, b.z, t);
  // the distance runs on its logarithm, so a fall from 74 m to 10 m does not spend its last half in a few frames
  o.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t));
  o.yaw = lerp(a.yaw, b.yaw, t);
  o.pitch = lerp(a.pitch, b.pitch, t);
  o.sx = lerp(a.sx, b.sx, t);
  o.sy = lerp(a.sy, b.sy, t);
  o.shadow = lerp(a.shadow, b.shadow, t);
  return o;
};
const tc = { follow: cam(), reach: cam(), at: cam(), out: cam(), flw: { x: 0, z: 0 } };

export function najamCam(u: number, out: Cam = cam()): Cam {
  const k = clamp01(u - 12);
  const into = ease(clamp01((k - N_SUB.N3[0]) / 0.048));
  const back = ease(clamp01((k - 0.772) / (N_SUB.N3[1] - 0.772)));
  const hand = ease(clamp01((k - 0.94) / 0.06));
  const f = tc.follow;
  const r = tc.reach;
  x50Follow(k, tc.flw);
  Object.assign(f, FOLLOW, { x: tc.flw.x, z: tc.flw.z });
  // the reach truck's lift raises the view with the pallet
  const lift = R16_LIFT(k);
  Object.assign(r, REACH, { y: 1.6 + 0.5 * Math.max(0, lift - 0.15) });
  // the camera flies over the X50 on its way down the aisle, the X50 is still working at its mouth, so the view rises on the way and
  // comes back to the height of the lift
  const pan = ease(clamp01((k - 0.688) / 0.052));
  mix(f, r, pan, tc.at);
  tc.at.y += 2.6 * Math.sin(Math.PI * pan);
  // in from the high view of N2 and out to the high view of N4, each eased at the edge of N3
  mix(tc.at, HIGH4, back, tc.out);
  mix(HIGH, tc.out, into, out);
  return hand > 0 ? mix(out, T_START, hand, out) : out;
}
