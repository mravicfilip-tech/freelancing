// The Najam warehouse as one plan, in hall metres. The hall hangs on the Najam point NP, x runs from the racks out to the dock wall
// and z across the hall, so a hall point (x, z) is the world point (NP.x + x, NP.z + z). Everything that moves in N3 is laid out
// here as a pure function of k of N, the same idea as atplan.ts for the robots, so a frozen clock always draws the same picture and
// scrolling back plays it backwards. Kept free of three so the shell and a plain node check can read it.
//
// N3 is k 0.5 to 0.79 of N and it all happens in the last aisle, the one on the open side of the hall, so looking down it from the
// staging floor the racks stand to the right and the left of the frame is floor and the far wall, which is where the text lies.
// Two X50s with a pallet each wait at the mouth of the aisle and rack theirs on the first beam one after the other, a reach truck
// puts a third on the second beam and a second reach truck lifts the fourth to the top beam. A D12 and an H30 cross the cross aisle
// at the end of the hall with a pallet each. No truck runs faster than 0.03 m per story px, no mast lifts faster than 0.015 m per
// story px, see the check in the commit. The four pallets are set down at N_PALLETS (timeline.ts), the lit term cell in the shell
// reads the same marks.
import { N_PALLETS, N_SUB } from '../../timeline';

const PI = Math.PI;
const rad = (d: number) => (d * PI) / 180;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => t * t * (3 - 2 * t);

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
  // three aisles, 5.5 m wide, and three rack blocks of two rows back to back between them. The last aisle has no block on its far side,
  // it is the open edge of the hall. A dock door stands at each of four centres.
  aisles: [-7.7, 0, 7.7],
  aisleHalf: 2.75,
  blocks: [-11.55, -3.85, 3.85],
  docks: [-11.55, -3.85, 3.85, 11.55],
  // the beam heights of the racks, the pallets of a level stand on the beam, the floor level on the floor
  levels: [0, 1.5, 3.0, 4.5],
} as const;

// the bottom of a pallet that stands on a level, on the flange of its beam
export const levelY = (ly: number) => (ly === 0 ? 0 : ly + 0.1);
// the x of a pallet place in a bay, sub 1 is the half nearer the staging floor, sub 0 the half behind it
export const slotX = (b: number, sub: 0 | 1) => HALL.rackX0 - HALL.bay * (b + 0.5) + (sub ? 0.65 : -0.65);
// the work aisle and the z of the pallet row that faces it on its -z side, the side the trucks work on
const AZ = HALL.aisles[2];
export const FACE_Z = HALL.blocks[2] + 0.55;
// the heading of a truck that faces the racks on the -z side, in degrees
const FACE = 270;

// ---- pallets and trucks -----------------------------------------------------------------------------------------------

// th is the heading in radians, 0 faces +x and a truck faces -z at 3 PI / 2, the same as the heading of a route
export type Spot = { x: number; y: number; z: number; th: number };

// Where the four pallets of N3 end up, all in the first four bays of the aisle. Two X50s fill the first beam of the third and second
// bay, a reach truck the second beam of the next and a second reach truck the top beam of the first, the one nearest the staging floor,
// so the landing at 4.6 m is the closest thing to the camera and the trucks that were busy before stand behind it.
export const SLOTS: Spot[] = [
  { x: slotX(3, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(2, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(1, 1), y: levelY(3.0), z: FACE_Z, th: rad(FACE) },
  { x: slotX(0, 1), y: levelY(4.5), z: FACE_Z, th: rad(FACE) },
];
// Whether a rack place is one of them, so the racks leave it empty for the pallet to land in. z is the row's z, ly the beam height.
export const isHeroSlot = (x: number, z: number, ly: number) => SLOTS.some((s) => Math.abs(s.x - x) < 0.3 && Math.abs(s.z - z) < 0.3 && Math.abs(s.y - levelY(ly)) < 0.05);

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


// A value that moves between keys at a steady pace, with a short ramp at each end of a move. Two keys with the same value are a rest.
// The peak pace is 1 / (1 - RAMP) of the average, which is what the pace limits in the head of this file are checked against.
const RAMP = 0.15;
function pace(keys: [number, number][]) {
  const n = keys.length;
  return (k: number) => {
    if (k <= keys[0][0]) return keys[0][1];
    if (k >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (i < n - 2 && k > keys[i + 1][0]) i++;
    const [k0, v0] = keys[i];
    const [k1, v1] = keys[i + 1];
    const t = (k - k0) / (k1 - k0);
    const u = t < RAMP ? (t * t) / (2 * RAMP * (1 - RAMP)) : t > 1 - RAMP ? 1 - ((1 - t) * (1 - t)) / (2 * RAMP * (1 - RAMP)) : (t - RAMP / 2) / (1 - RAMP);
    return v0 + (v1 - v0) * u;
  };
}

// ---- the X50s ---------------------------------------------------------------------------------------------------------

const R = 2.0;
const BEND = 1.657 * R;
// the lane the X50s drive in along the work aisle, on the open side of it, clear of the reach trucks that stand at the rack face
const LANE = AZ + 0.9;
// the fork heights, carrying, at the rack and backed out clear of it
const CARRY = 0.15;
const PUT_UP = levelY(1.5) - X50_PAL + 0.08;
const PUT_DOWN = levelY(1.5) - X50_PAL;

// One X50 with its pallet on the forks. It waits at the mouth of the aisle facing in, drives straight in, turns right with a 2 m
// radius to face the rack, inserts the pallet and sets it down, then backs out a little and stands. The route is its way points,
// s is the distance along it and the lift the fork height, both against k of N. The marks are the k it arrives, sets the pallet
// down and backs clear.
type Trip = { slot: Spot; start: number; go: [number, number]; lift: [number, number]; set: [number, number]; out: [number, number] };
function trip(t: Trip) {
  const x0 = t.slot.x + R;
  const zi = FACE_Z + X50_FWD;
  const ways: Way[] = [
    { x: t.start, z: LANE, th: 180 },
    { x: x0, z: LANE, th: 180, mo: BEND },
    { x: t.slot.x, z: LANE - R, th: FACE, mi: BEND },
    { x: t.slot.x, z: zi, th: FACE, dir: -1 },
    { x: t.slot.x, z: zi + 1.4, th: FACE },
  ];
  const rt = route(ways);
  const s = pace([
    [0, 0],
    [t.go[0], 0],
    [t.go[1], rt.at[3]],
    [t.out[0], rt.at[3]],
    [t.out[1], rt.len],
  ]);
  const lift = pace([
    [0, CARRY],
    [t.lift[0], CARRY],
    [t.lift[1], PUT_UP],
    [t.set[0], PUT_UP],
    [t.set[1], PUT_DOWN],
    [t.out[0], PUT_DOWN],
    [t.out[0] + 0.01, PUT_DOWN - 0.09],
    [t.out[1], PUT_DOWN - 0.09],
    [t.out[1] + 0.055, 0.05],
  ]);
  return { rt, s, lift };
}

// The first X50 racks deepest, the second behind it. The second waits behind the first in the lane, a truck's length and a hand apart.
const X50_A = trip({ slot: SLOTS[0], start: SLOTS[0].x + R + 1.5, go: [0.502, 0.605], lift: [0.515, 0.575], set: [0.605, 0.615], out: [0.625, 0.655] });
const X50_B = trip({ slot: SLOTS[1], start: SLOTS[0].x + R + 1.5 + 4.7, go: [0.53, 0.66], lift: [0.55, 0.625], set: [0.66, 0.67], out: [0.68, 0.71] });

// ---- the reach trucks, one to the second beam and one to the top beam --------------------------------------------------

// the carriage reaches forward 1.1 m to push the pallet into the rack, the truck stands with its legs at the rack face
const R16_REACH = 1.1;
const R16_Z = FACE_Z + R16_FWD + R16_REACH;
type Lift = { slot: Spot; rise: [number, number]; reach: [number, number]; set: [number, number]; back: [number, number]; settle: number };
function reachTruck(t: Lift) {
  const up = t.slot.y - R16_PAL + 0.08;
  const down = t.slot.y - R16_PAL;
  const lift = pace([
    [0, CARRY],
    [t.rise[0], CARRY],
    [t.rise[1], up],
    [t.set[0], up],
    [t.set[1], down],
    [t.back[0], down],
    [t.back[1], down - 0.4],
    ...(t.settle > t.back[1] ? ([[t.settle, down - 1.5]] as [number, number][]) : []),
  ]);
  const out = pace([
    [0, 0],
    [t.reach[0], 0],
    [t.reach[1], R16_REACH],
    [t.back[0], R16_REACH],
    [t.back[1], 0],
  ]);
  return { x: t.slot.x, lift, out };
}
const R16_A = reachTruck({ slot: SLOTS[2], rise: [0.545, 0.668], reach: [0.668, 0.69], set: [0.69, 0.705], back: [0.705, 0.738], settle: 0.79 });
const R16_B = reachTruck({ slot: SLOTS[3], rise: [0.592, 0.742], reach: [0.742, 0.762], set: [0.762, 0.77], back: [0.77, 0.79], settle: 0.79 });

// ---- trucks that cross the end of the hall ----------------------------------------------------------------------------

// A D12 and an H30 cross the cross aisle behind the last bay, each with a pallet on its forks, one from each side, 12 m in all.
const CROSS_D12 = { x: -28.0, z0: 6.0, z1: -6.0, k0: 0.52, k1: 0.77 };
const CROSS_H30 = { x: -30.0, z0: -6.0, z1: 5.0, k0: 0.54, k1: 0.78 };
const crossAt = (c: { z0: number; z1: number; k0: number; k1: number }, k: number) => pace([[c.k0, c.z0], [c.k1, c.z1]])(k);

// ---- the poses --------------------------------------------------------------------------------------------------------

export type Pose = { x: number; z: number; th: number; lift: number; roll: number; reach: number };
const mk = (): Pose => ({ x: 0, z: 0, th: 0, lift: 0, roll: 0, reach: 0 });

const tmp = { x: 0, z: 0, th: 0, roll: 0 };
const x50Of = (T: ReturnType<typeof trip>) => (k: number, out: Pose = mk()): Pose => {
  T.rt.pose(T.s(k), tmp);
  out.x = tmp.x;
  out.z = tmp.z;
  out.th = tmp.th;
  out.roll = tmp.roll;
  out.lift = T.lift(k);
  out.reach = 0;
  return out;
};
export const x50AAt = x50Of(X50_A);
export const x50BAt = x50Of(X50_B);

const r16Of = (T: ReturnType<typeof reachTruck>) => (k: number, out: Pose = mk()): Pose => {
  out.x = T.x;
  out.z = R16_Z;
  out.th = rad(FACE);
  out.roll = 0;
  out.lift = T.lift(k);
  out.reach = T.out(k);
  return out;
};
export const r16AAt = r16Of(R16_A);
export const r16BAt = r16Of(R16_B);

// a truck on the z axis faces PI / 2 going +z and 3 PI / 2 going -z
const crossOf = (c: typeof CROSS_D12) => (k: number, out: Pose = mk()): Pose => {
  const z = crossAt(c, k);
  out.x = c.x;
  out.z = z;
  out.th = rad(c.z1 < c.z0 ? 270 : 90);
  out.lift = 0;
  out.roll = Math.abs(z - c.z0);
  out.reach = 0;
  return out;
};
export const d12At = crossOf(CROSS_D12);
export const h30At = crossOf(CROSS_H30);

// ---- the pallets ------------------------------------------------------------------------------------------------------

export type PalletPose = { x: number; y: number; z: number; th: number };

// Each of the four pallets rides on the forks of its truck from the first frame, so the hall holds still with all four on the forks
// before N3 and with all four racked after it, and sets down at its mark in N_PALLETS, shared with the shell.
type Carry = { by: (k: number, o: Pose) => Pose; kind: 'x50' | 'r16'; drop: number; to: Spot };
export const PALLETS: Carry[] = [
  { by: x50AAt, kind: 'x50', drop: N_PALLETS[0], to: SLOTS[0] },
  { by: x50BAt, kind: 'x50', drop: N_PALLETS[1], to: SLOTS[1] },
  { by: r16AAt, kind: 'r16', drop: N_PALLETS[2], to: SLOTS[2] },
  { by: r16BAt, kind: 'r16', drop: N_PALLETS[3], to: SLOTS[3] },
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
  p.by(k, px);
  if (p.kind === 'x50') {
    out.x = px.x + Math.cos(px.th) * X50_FWD;
    out.z = px.z + Math.sin(px.th) * X50_FWD;
    out.y = px.lift + X50_PAL;
  } else {
    const f = R16_FWD + px.reach;
    out.x = px.x + Math.cos(px.th) * f;
    out.z = px.z + Math.sin(px.th) * f;
    out.y = px.lift + R16_PAL;
  }
  out.th = px.th;
  return out;
}

// ---- the camera -------------------------------------------------------------------------------------------------------

// The camera of N as one pose in the units of the Rig in camera.tsx, a target in hall metres, an orbit distance, a yaw and pitch in
// degrees, the lens shift as a share of the frame and a field of view. N1, N2 and N4 hold a high three quarter view over the docks
// and the aisles. N3 comes down to about 6 m above the staging floor, outside the dock wall, looks along the work aisle with a narrow
// lens and shifts the picture so the aisle and its racks lie right of the third vertical, the left of the frame is the floor of the
// hall and its far wall, and nothing stands in the bottom band of the term cells. Then it moves up to the mouth of the aisle, aims at
// the top beam, and lets the pallet land. The last of N hands over to the pose T starts from.
export type Cam = { x: number; y: number; z: number; d: number; yaw: number; pitch: number; sx: number; sy: number; shadow: number; fov: number };
const cam = (): Cam => ({ x: 0, y: 0, z: 0, d: 0, yaw: 0, pitch: 0, sx: 0, sy: 0, shadow: 0, fov: 28 });

const HIGH: Cam = { x: 3, y: 0, z: -3, d: 118, yaw: 50, pitch: -30, sx: 0.0, sy: 0.38, shadow: 60, fov: 28 };
// N4 keeps the bottom band of the frame clear for the term cells, so the hall stands higher in it
const HIGH4: Cam = { x: 3, y: 0, z: -3, d: 118, yaw: 50, pitch: -30, sx: 0.17, sy: 0.04, shadow: 60, fov: 28 };
// T begins from the pose of the old rental floor, camera.tsx N_D and N_SY, so the cut to the grid at u 13 lands on the same frame
const T_START: Cam = { x: -0.5, y: 0.9, z: 0, d: 52, yaw: 90, pitch: -24, sx: 0, sy: 0.305, shadow: 18, fov: 28 };
// Both shots look down the work aisle from outside the hall, at about 5.6 m, 32 to 36 m out, through the narrow lens, so the nearest
// truck is 28 m away and the whole of it stands over the bottom band, and the picture is shifted right so the aisle and its racks lie
// right of the third vertical. The camera sits at xc, h metres up, and looks at a point of the aisle at height ty.
const SHOT = { z: AZ - 0.3, yaw: 87, sx: 0.2, sy: 0.04, shadow: 30, fov: 18 };
function look(o: Cam, xc: number, h: number, tx: number, ty: number) {
  Object.assign(o, SHOT, { x: tx, y: ty });
  o.d = Math.hypot(xc - tx, h - ty);
  o.pitch = -(Math.asin((h - ty) / o.d) * 180) / PI;
  return o;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Cam, b: Cam, t: number, o: Cam) => {
  o.x = lerp(a.x, b.x, t);
  o.y = lerp(a.y, b.y, t);
  o.z = lerp(a.z, b.z, t);
  // the distance runs on its logarithm, so a fall from 118 m to 24 m does not spend its last half in a few frames
  o.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t));
  o.yaw = lerp(a.yaw, b.yaw, t);
  o.pitch = lerp(a.pitch, b.pitch, t);
  o.sx = lerp(a.sx, b.sx, t);
  o.sy = lerp(a.sy, b.sy, t);
  o.shadow = lerp(a.shadow, b.shadow, t);
  o.fov = lerp(a.fov, b.fov, t);
  return o;
};
const tc = { follow: cam(), reach: cam(), at: cam(), out: cam(), a: mk(), b: mk(), r: mk(), w: cam(), p: cam() };

// Najam 3, Wide. A high three quarter view over the whole hall, the hall about twice the area on screen of the N4 view, filling the right
// two thirds of the frame, so the docks, the lorry, the racks and every moving truck read at once. For k 0.74 to 0.77 a short push in
// to the top beam where the fourth pallet lands, and back out to the N4 view by k 0.79.
const WIDE: Cam = { x: 2, y: 0, z: -2, d: 94, yaw: 52, pitch: -31, sx: 0.12, sy: 0.04, shadow: 56, fov: 28 };
const PUSH: Cam = { x: 1.3, y: 3.0, z: 4.5, d: 34, yaw: 62, pitch: -26, sx: 0.2, sy: -0.03, shadow: 30, fov: 28 };

// Najam 1, Close. The first camera of round 6, 2.7 m up and 15 m behind and beside the X50s, rising with the reach truck's lift to see the
// pallet land on the top beam. The racks stand behind the words here, so the shell lays a panel behind them, see shell.css.
const CLOSE = { z: AZ - 0.5, sx: 0.15, sy: 0, shadow: 20, fov: 28 };
function close(o: Cam, tx: number, ty: number, d: number, yaw: number, pitch: number) {
  return Object.assign(o, CLOSE, { x: tx, y: ty, d, yaw, pitch });
}

// variant is 1 Close, 2 Aisle end, the default, or 3 Wide, see preview.ts
export function najamCam(u: number, out: Cam = cam(), variant = 2): Cam {
  const k = clamp01(u - 12);
  const into = ease(clamp01((k - N_SUB.N3[0]) / 0.048));
  const back = ease(clamp01((k - 0.772) / (N_SUB.N3[1] - 0.772)));
  const hand = ease(clamp01((k - 0.94) / 0.06));
  const f = tc.follow;
  const r = tc.reach;
  x50AAt(k, tc.a);
  x50BAt(k, tc.b);
  const mid = (tc.a.x + tc.b.x) / 2;
  if (variant === 3) {
    mix(HIGH, WIDE, into, tc.w);
    mix(tc.w, PUSH, ease(clamp01((k - 0.738) / 0.024)), tc.p);
    mix(tc.p, HIGH4, ease(clamp01((k - 0.768) / (N_SUB.N3[1] - 0.768))), out);
    return hand > 0 ? mix(out, T_START, hand, out) : out;
  }
  if (variant === 1) {
    // behind and beside the trucks, on the middle of the two X50s, then on the reach truck, its target as high as the forks
    r16BAt(k, tc.r);
    close(f, mid, 0.9, 15, 84, -8);
    close(r, SLOTS[3].x - 0.5, 1.6 + 0.5 * (tc.r.lift - CARRY), 14, 90, -6);
    mix(f, r, ease(clamp01((k - 0.695) / 0.047)), tc.at);
  } else {
    // the follow rests on the middle of the two X50s, a little of their way, and comes in a few metres over the shot, the reach shot is
    // the same place with the top beam in it
    look(f, lerp(35, 32.5, ease(clamp01((k - 0.5) / 0.22))), 5.6, -2 + 0.2 * (mid + 2), 2.1);
    look(r, 32, 5.8, -0.5, 2.34);
    mix(f, r, ease(clamp01((k - 0.695) / 0.047)), tc.at);
  }
  // in from the high view of N2 and out to the high view of N4, each eased at the edge of N3
  mix(tc.at, HIGH4, back, tc.out);
  mix(HIGH, tc.out, into, out);
  return hand > 0 ? mix(out, T_START, hand, out) : out;
}
