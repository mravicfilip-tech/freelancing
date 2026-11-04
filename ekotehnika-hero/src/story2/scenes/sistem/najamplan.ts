// The Najam warehouse as one plan, in hall metres. The hall hangs on the Najam point NP, x runs from the racks out to the dock wall
// and z across the hall, so a hall point (x, z) is the world point (NP.x + x, NP.z + z). Everything that moves is laid out here as a
// pure function of k of N, the same idea as atplan.ts for the robots, so a frozen clock always draws the same picture and scrolling
// back plays it backwards. Kept free of three so the shell and a plain node check can read it.
//
// N3 is 800px, k 0.55 to 0.75 of the plan's clock, planK in timeline.ts, and it all happens in the last aisle, the one on the open side of the
// hall, so looking down it from the staging floor the racks stand to the right and the left of the frame is floor and the far wall, which is
// where the text lies.
// Two X50s with a pallet each wait at the mouth of the aisle and rack theirs on the first beam one after the other, a reach truck
// puts a third on the second beam and a second reach truck lifts the fourth to the top beam. A D12 and an H30 cross the cross aisle
// at the end of the hall with a pallet each. No truck runs faster than 0.03 m per story px, no mast lifts faster than 0.015 m per
// story px, see the check in the commit. The four pallets are set down at N_PLAN_PALLETS (timeline.ts), the lit term cell in the shell
// reads the same marks.
import { N_FLIGHT, N_PLAN_PALLETS, N_SUB, planK } from '../../timeline';

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
  // it is the open edge of the hall, where the camera of N3 looks down it. A block there stood behind the page counter and the lede, so
  // that side is floor storage, pallets stacked two high in marked bays. A dock door stands at each of four centres.
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

// Where the four pallets of N3 end up, in the fourth to seventh bays of the aisle, 15 to 25 m from the camera at its dock end. Two X50s fill the first beam of the third and second
// bay, a reach truck the second beam of the next and a second reach truck the top beam of the first, the one nearest the staging floor,
// so the landing at 4.6 m is the closest thing to the camera and the trucks that were busy before stand behind it.
export const SLOTS: Spot[] = [
  { x: slotX(6, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(5, 1), y: levelY(1.5), z: FACE_Z, th: rad(FACE) },
  { x: slotX(4, 1), y: levelY(3.0), z: FACE_Z, th: rad(FACE) },
  { x: slotX(3, 1), y: levelY(4.5), z: FACE_Z, th: rad(FACE) },
];
// Whether a rack place is one of them, so the racks leave it empty for the pallet to land in. z is the row's z, ly the beam height.
export const isHeroSlot = (x: number, z: number, ly: number) => SLOTS.some((s) => Math.abs(s.x - x) < 0.3 && Math.abs(s.z - z) < 0.3 && Math.abs(s.y - levelY(ly)) < 0.05);

// How far in front of the truck's origin the centre of its pallet stands, and how high a pallet's bottom sits over the fork height.
export const X50_FWD = 1.15;
export const X50_PAL = 0.065;
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
export function pace(keys: [number, number][]) {
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
const X50_A = trip({ slot: SLOTS[0], start: SLOTS[0].x + R + 1.5, go: [0.5534, 0.623], lift: [0.5622, 0.6028], set: [0.623, 0.63], out: [0.6365, 0.6568] });
const X50_B = trip({ slot: SLOTS[1], start: SLOTS[0].x + R + 1.5 + 4.7, go: [0.5723, 0.6602], lift: [0.5858, 0.6365], set: [0.6602, 0.667], out: [0.6737, 0.694] });

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
const R16_A = reachTruck({ slot: SLOTS[2], rise: [0.5824, 0.6685], reach: [0.6685, 0.6905], set: [0.6905, 0.7], back: [0.7, 0.7225], settle: 0.75 });
const R16_B = reachTruck({ slot: SLOTS[3], rise: [0.6142, 0.7075], reach: [0.7075, 0.729], set: [0.729, 0.735], back: [0.735, 0.757], settle: 0.757 });

// ---- trucks that cross the end of the hall ----------------------------------------------------------------------------

// A D12 and an H30 cross the cross aisle behind the last bay, each with a pallet on its forks, one from each side, 12 m in all.
const CROSS_D12 = { x: -28.0, z0: 6.0, z1: -6.0, k0: 0.5575, k1: 0.7265 };
const CROSS_H30 = { x: -30.0, z0: -6.0, z1: 5.0, k0: 0.571, k1: 0.7332 };
const crossAt = (c: { z0: number; z1: number; k0: number; k1: number }, k: number) => pace([[c.k0, c.z0], [c.k1, c.z1]])(k);

// ---- the poses --------------------------------------------------------------------------------------------------------

export type Pose = { x: number; z: number; th: number; lift: number; roll: number; reach: number };
export const mk = (): Pose => ({ x: 0, z: 0, th: 0, lift: 0, roll: 0, reach: 0 });

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
  { by: x50AAt, kind: 'x50', drop: N_PLAN_PALLETS[0], to: SLOTS[0] },
  { by: x50BAt, kind: 'x50', drop: N_PLAN_PALLETS[1], to: SLOTS[1] },
  { by: r16AAt, kind: 'r16', drop: N_PLAN_PALLETS[2], to: SLOTS[2] },
  { by: r16BAt, kind: 'r16', drop: N_PLAN_PALLETS[3], to: SLOTS[3] },
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

// The hall floor stands on a platform 1.2 m over the yard, the height of a lorry's bed, so a forklift drives from the hall into a trailer
// on one level. Every metre of height in the plan is over the platform and the camera adds this once at the end.
export const HALL_Y = 1.2;

// The camera of N as one pose in the units of the Rig in camera.tsx, a target in hall metres, an orbit distance, a yaw and pitch in
// degrees, the lens shift as a share of the frame and a field of view. Four holds and three flights between them, see N_FLIGHT.
//   N1  a high three quarter view of the closed building from the dock side, pushing in a little as the lorry comes in through the gate
//   N2  Istovar, in the yard 4 m up and 15 m out from the rear of the trailer at dock 1, looking at the open trailer and the door it stands at,
//       the picture shifted down so the trailer and the forklifts lie under the facts row and the plain facade over the doors fills the
//       word zone. A slow drift toward the door
//   N3  inside the hall at the dock end of the work aisle, 6 m up, looking down it with the picture shifted so the racks and the trucks lie
//       right of the third vertical and the left of the frame is the floor and the long wall of the hall
//   N4  the high view again over the closed building, held a little higher in the frame, which is where T starts
//   Flight 1 straight down from the high view to the yard. Flight 2 on a spline, across the yard in a long curve, through the open door of
//   dock 1 on its axis and along the dock wall inside to the aisle. Flight 3 on a spline, up under the roof light over the dock end, out
//   through it, always looking down at the building, and away to the high view. T runs the same road the other way, tTrack.
export type Cam = { x: number; y: number; z: number; d: number; yaw: number; pitch: number; sx: number; sy: number; shadow: number; fov: number };
const cam = (): Cam => ({ x: 0, y: 0, z: 0, d: 0, yaw: 0, pitch: 0, sx: 0, sy: 0, shadow: 0, fov: 28 });

const HIGH_FAR: Cam = { x: 14, y: 0, z: -2, d: 146, yaw: 50, pitch: -30, sx: 0.0, sy: 0.34, shadow: 70, fov: 28 };
const HIGH: Cam = { x: 14, y: 0, z: -2, d: 136, yaw: 50, pitch: -30, sx: 0.0, sy: 0.34, shadow: 70, fov: 28 };
// N4 keeps the hall a little higher in the frame, in the right two thirds beside the term cards. T starts from this pose.
export const HIGH4: Cam = { x: 3, y: 0, z: -3, d: 118, yaw: 50, pitch: -30, sx: 0.2, sy: -0.06, shadow: 60, fov: 28 };

// A camera from where it stands to what it looks at, both in hall metres over the platform.
function eye(o: Cam, c: [number, number, number], t: [number, number, number], lens: Pick<Cam, 'sx' | 'sy' | 'shadow' | 'fov'>) {
  const dx = c[0] - t[0];
  const dy = c[1] - t[1];
  const dz = c[2] - t[2];
  o.x = t[0];
  o.y = t[1];
  o.z = t[2];
  o.d = Math.hypot(dx, dy, dz);
  o.yaw = (Math.atan2(dx, dz) * 180) / PI;
  o.pitch = -(Math.asin(dy / o.d) * 180) / PI;
  return Object.assign(o, lens);
}
// one lens for N2, the flight in and N3, 35 degrees, so the flight in never changes the lens, and the flight down to N2 brings it in from the 28 of the high view
// Istovar is seen from 15 m, the lorry's cab and trailer 8 m from the camera at the nearest, the forklifts that come out of the door and into the
// trailer 2.2 m high, about 200px in the frame of 900. The target is the rear of the trailer where the forklifts go in and out.
const DOCK_LENS = { sx: 0.24, sy: 0.38, shadow: 30, fov: 35 };
const DOCK_AT: [number, number, number] = [17.2, 1.2, HALL.docks[0] + 0.15];
const DOCK_A = eye(cam(), [28.6, 4.4, 0.6], DOCK_AT, DOCK_LENS);
const DOCK_B = eye(cam(), [26.4, 4.0, -2.6], DOCK_AT, DOCK_LENS);

// Both N3 shots look down the work aisle from inside the hall at its dock end, 6 m up, so the nearest truck is 15 m away, and the picture is shifted right so the aisle and its racks lie right of the third vertical. The camera sits
// at xc, h metres up, and looks at a point of the aisle at height ty.
const SHOT = { z: AZ - 0.3, yaw: 87, sx: 0.2, sy: 0.03, shadow: 30, fov: 35 };
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
  // the distance runs on its logarithm, so a fall from 118 m to 14 m does not spend its last half in a few frames
  o.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t));
  o.yaw = lerp(a.yaw, b.yaw, t);
  o.pitch = lerp(a.pitch, b.pitch, t);
  o.sx = lerp(a.sx, b.sx, t);
  o.sy = lerp(a.sy, b.sy, t);
  o.shadow = lerp(a.shadow, b.shadow, t);
  o.fov = lerp(a.fov, b.fov, t);
  return o;
};
// A flight, the camera and what it looks at each moving along a curve through waypoints, a Catmull Rom spline through the start, the vias and
// the end, so it goes over a wall or through a door and never through one. The orbit of each frame is worked out again from where the camera
// and its target are. With no vias the flight is a straight line.
const RAD = PI / 180;
type V3 = [number, number, number];
type Via = { cam: V3[]; tgt: V3[]; sx?: number[]; sy?: number[]; even?: boolean; cost?: (y: number) => number };
const spline = (pts: V3[], t: number): V3 => {
  const n = pts.length - 1;
  if (n === 1) return [lerp(pts[0][0], pts[1][0], t), lerp(pts[0][1], pts[1][1], t), lerp(pts[0][2], pts[1][2], t)];
  const f = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const u = f - i;
  const p0 = pts[Math.max(i - 1, 0)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(i + 2, n)];
  return [0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u * u + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u * u * u)) as V3;
};
// The flight in, from the yard in front of dock 1 to the mouth of the work aisle, one calm move on one lens. The camera starts where N2 ends,
// 12 m out and 4 m up, glides across the yard toward the door in a long curve that comes onto the axis of the door 6 m before it, goes
// through the doorway on that axis at 2.4 m, the middle of the opening, and runs on 3 m past it before it bends to the wall and rises to the
// 6 m of the aisle shot, while the target sweeps down the staging floor to the aisle, so the view turns 55 degrees in all, over the whole
// flight, and never fast. The glide of the flight takes it from rest to rest, and withinIn holds it back at the start so the lorry of dock 1
// has pulled away before the camera is across the yard. It stays 6 m or more from every lorry, forklift and pallet all through, see the
// check in the commit. The lens shift comes down to nothing for the doorway so the door lies in the middle of the picture, and rises to the
// shift of the aisle shot after it.
// The target and the lens shift have a point for each point of the camera.
const VIA_AISLE: Via = {
  cam: [[23.6, 3.5, -5.6], [20.9, 3.1, -8.6], [18.4, 2.7, -10.9], [15.8, 2.5, -11.55], [12.6, 2.4, -11.5], [11.4, 2.8, -8.8], [12.9, 4.0, -3.4], [13.3, 5.5, 3.4]],
  tgt: [[15.6, 1.4, -11.5], [14.5, 1.5, -11.55], [10.5, 1.4, -11.55], [6.0, 1.3, -11.55], [2.0, 1.3, -10.4], [-2.5, 1.2, -6.6], [-6.5, 1.1, -0.5], [-8.8, 1.0, 4.8]],
  sx: [0.1, 0.05, 0.0, 0.0, 0.0, 0.03, 0.1, 0.17],
  sy: [0.17, 0.1, 0.04, 0.0, 0.0, 0.0, 0.02, 0.03],
};
// The way through the roof light over the dock end, which the third flight takes up and T takes down, in hall metres over the platform. The
// camera rises out of the hall in the middle of the light, and from there the road to the high view leaves in long steps that grow, so the flight
// is paced by the length of its path and not by the spline's own parameter, which would spend a third of it on the last 8 m. The roof is 10.4 m high. The camera looks down at the building all
// the way, 30 to 50 degrees, so the roof, its lights and the yard around it fill the frame and the view never turns to the sky. Out is the way
// up from the aisle shot and the way down is the same points the other way round.
const ROOF_LIGHT = 12.0;
// A stop of the road, where the camera stands and the way it looks, a yaw and a pitch in degrees and the distance to what it looks at, from
// which the target is worked out. Over the roof the camera looks down at 9 to 31 degrees, and not steeply, so the frame always holds
// the roof lights and units across the hall, the building's edges, the yard and the road round it and never a plain stretch of roof, and inside it looks down the hall.
type Stop = { c: V3; yaw: number; pitch: number; d: number; sy: number };
const along = (w: Stop): V3 => [w.c[0] - w.d * Math.sin(w.yaw * RAD) * Math.cos(w.pitch * RAD), w.c[1] + w.d * Math.sin(w.pitch * RAD), w.c[2] - w.d * Math.cos(w.yaw * RAD) * Math.cos(w.pitch * RAD)];
// from the high view in to the roof light, and through it
const ROAD: Stop[] = [
  { c: [60.0, 54.0, 52.0], yaw: 49, pitch: -31, d: 90, sy: -0.06 },
  { c: [41.0, 43.0, 36.0], yaw: 47, pitch: -29, d: 80, sy: -0.05 },
  { c: [26.0, 30.0, 22.0], yaw: 46, pitch: -25, d: 70, sy: -0.04 },
  { c: [16.5, 19.5, 11.5], yaw: 55, pitch: -19, d: 60, sy: -0.02 },
  { c: [ROOF_LIGHT, 13.0, 7.0], yaw: 70, pitch: -11, d: 60, sy: 0.0 },
  { c: [ROOF_LIGHT, 10.2, 7.0], yaw: 80, pitch: -9, d: 45, sy: 0.02 },
];
// and on inside to the dock end of the aisle, T's last two, and the one third flight's first, up from the aisle shot
const T_IN: Stop[] = [
  { c: [11.6, 7.6, 5.0], yaw: 83, pitch: -10, d: 30, sy: 0.03 },
  { c: [10.4, 5.8, 2.6], yaw: 82, pitch: -13, d: 20, sy: 0.03 },
];
const OUT_IN: Stop = { c: [12.3, 8.2, 7.2], yaw: 85, pitch: -16, d: 24, sy: 0.03 };
const viaOf = (ws: Stop[], even = true): Via => ({ cam: ws.map((w) => w.c), tgt: ws.map(along), sx: ws.map(() => 0.2), sy: ws.map((w) => w.sy), even });
// the third flight, up under the roof light over the dock end, through it, over the roof and away to the high view
const VIA_HIGH: Via = viaOf([OUT_IN, ...ROAD.slice().reverse()]);

// The parameter of a spline at a share of its cost, from a table of 240 steps built once for each flight and its two ends. A metre of the path costs
// three times as much under 7 m of height, the hall and the roof light, as it does over 13 m, so the camera takes its time through the roof and
// then climbs away over the rest, and the share of the scroll it gets in the roof is about a sixth of the flight.
const cost = (y: number) => 1 + 2 * clamp01((13 - y) / 6);
const lengths = new Map<string, number[]>();
const evenT = (key: string, pts: V3[], f: number, price = cost) => {
  let tab = lengths.get(key);
  if (!tab) {
    tab = [0];
    let prev = spline(pts, 0);
    for (let i = 1; i <= 240; i++) {
      const q = spline(pts, i / 240);
      tab.push(tab[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]) * price((q[1] + prev[1]) / 2));
      prev = q;
    }
    lengths.set(key, tab);
  }
  const want = clamp01(f) * tab[240];
  let i = 0;
  while (i < 239 && tab[i + 1] < want) i++;
  return (i + (tab[i + 1] > tab[i] ? (want - tab[i]) / (tab[i + 1] - tab[i]) : 0)) / 240;
};
function fly(a: Cam, b: Cam, t: number, o: Cam, via?: Via) {
  const pos = (c: Cam): V3 => [c.x + c.d * Math.sin(c.yaw * RAD) * Math.cos(c.pitch * RAD), c.y - c.d * Math.sin(c.pitch * RAD), c.z + c.d * Math.cos(c.yaw * RAD) * Math.cos(c.pitch * RAD)];
  const cams = [pos(a), ...(via?.cam ?? []), pos(b)];
  // at the two ends the path is its first and last point whatever the pace, and the first point of the third flight moves with the story before it
  if (via?.even && t > 0 && t < 1) t = evenT(cams.map((c) => c.map((v) => v.toFixed(2)).join()).join('|'), cams, t, via.cost);
  const [px, py, pz] = spline(cams, t);
  const [tx, ty, tz] = spline([[a.x, a.y, a.z], ...(via?.tgt ?? []), [b.x, b.y, b.z]], t);
  const dx = px - tx;
  const dy = py - ty;
  const dz = pz - tz;
  const d = Math.hypot(dx, dy, dz);
  o.x = tx;
  o.y = ty;
  o.z = tz;
  o.d = d;
  o.yaw = Math.atan2(dx, dz) / RAD;
  o.pitch = -Math.asin(dy / d) / RAD;
  o.sx = via?.sx ? spline([[a.sx, 0, 0], ...via.sx.map((v) => [v, 0, 0] as V3), [b.sx, 0, 0]], t)[0] : lerp(a.sx, b.sx, t);
  o.sy = via?.sy ? spline([[a.sy, 0, 0], ...via.sy.map((v) => [v, 0, 0] as V3), [b.sy, 0, 0]], t)[0] : lerp(a.sy, b.sy, t);
  o.shadow = lerp(a.shadow, b.shadow, t);
  o.fov = lerp(a.fov, b.fov, t);
  return o;
}
const tc = { follow: cam(), reach: cam(), at: cam(), n1: cam(), n2: cam(), s2: cam(), a: mk(), b: mk() };

// A flight eases at both ends, smoother than the smoothstep of the rest of the scene so it leaves and arrives without a jolt.
const glide = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const within = (k: number, w: readonly [number, number]) => glide(clamp01((k - w[0]) / (w[1] - w[0])));
// the flight in leaves slowly, so the camera is still across the yard while the lorry pulls away, and arrives at the door at the middle of the
// scroll, the glide of the whole flight with its first half stretched by the power
const withinIn = (k: number, w: readonly [number, number]) => glide(Math.pow(clamp01((k - w[0]) / (w[1] - w[0])), 1.15));

// The hall's camera at k of N, hall metres in x and z and y over the platform. The poses are made of the holds and blended by the flights
// in order, so a frozen clock always draws the same frame and scrolling back flies the same way. The flights and the first two holds run on
// the story's k, the poses of N3 follow the trucks of the plan and run on pk, the plan's clock, see planK in timeline.ts.
export function najamCam(u: number, out: Cam = cam()): Cam {
  const k = clamp01(u - 12);
  const pk = planK(k);
  // N1 and the first flight, from the high view down to the dock
  mix(HIGH_FAR, HIGH, ease(clamp01(k / N_SUB.N1[1])), tc.n1);
  mix(DOCK_A, DOCK_B, ease(clamp01((k - N_SUB.N2[0]) / (N_SUB.N2[1] - N_SUB.N2[0]))), tc.n2);
  fly(tc.n1, tc.n2, within(k, N_FLIGHT.dock), tc.s2);
  // N3 and the second flight, the follow rests on the middle of the two X50s, a little of their way, and comes in a few metres over the
  // shot, the reach shot is the same place with the top beam in it
  const f = tc.follow;
  const r = tc.reach;
  x50AAt(pk, tc.a);
  x50BAt(pk, tc.b);
  const mid = (tc.a.x + tc.b.x) / 2;
  look(f, lerp(13.3, 12.6, ease(clamp01((pk - 0.552) / 0.148))), 6.0, -10.1 + 0.2 * (mid + 10.1), 1.0);
  look(r, 12.4, 6.2, -8.6, 1.5);
  mix(f, r, ease(clamp01((pk - 0.69) / 0.032)), tc.at);
  fly(tc.s2, tc.at, withinIn(k, N_FLIGHT.aisle), tc.s2, VIA_AISLE);
  // the third flight, up to the high view of N4
  fly(tc.s2, HIGH4, within(k, N_FLIGHT.high), out, VIA_HIGH);
  out.y += HALL_Y;
  return out;
}

// T, the dive from the high view of N4 down to the pose the automation aisle starts from, end, in hall metres like the rest. It is the third flight's
// road the other way round, down to the roof light over the dock end, in through it and down to the dock end of the aisle, on one lens, one
// calm move paced along its length and eased at both ends, so it is a flight of the whole of T and not a few frames. The hall stands all the
// way and the camera only moves, see najam.tsx for the roof light that draws aside and the inside that is swapped while the roof is shut.
const VIA_T: Via = viaOf([...ROAD, ...T_IN]);
export function najamT(t: number, end: Cam, out: Cam = cam()): Cam {
  fly(HIGH4, end, glide(clamp01(t)), out, VIA_T);
  out.y += HALL_Y;
  return out;
}

// T on a tall screen. A phone's frame is narrow, so the road above, which looks across the roof at 9 to 31 degrees, fills it with plain roof and then
// plain floor, and so does a camera that looks straight down at the white roof. This road of its own comes in over the yard to the dock end and looks
// at the roof light over it across the dock face, so the lorries, the doors and the roof's edge stay in the frame until the camera is over the
// parapet. The hatch opens while it comes, hinged on its west edge on a tall screen (najam.tsx), so the opening faces the camera, and the camera
// swoops over the parapet and down through the light at 50 degrees, half a metre or more from either edge of it, and looks down the hall at once, so
// the racks are in the frame a metre under the roof. The view turns from 50 to 80 degrees one way only. Each stop is where the camera is and the
// point it looks at, hall metres. The lens is fov0 at the start and end's at the end, the lens shift is the shell's, see camera.tsx.
const aim = (c: V3, g: V3): Stop => ({ c, yaw: Math.atan2(c[0] - g[0], c[2] - g[2]) / RAD, pitch: -Math.atan2(c[1] - g[1], Math.hypot(c[0] - g[0], c[2] - g[2])) / RAD, d: Math.hypot(c[0] - g[0], c[1] - g[1], c[2] - g[2]), sy: 0 });
const T_TALL: Stop[] = [
  aim([54, 46, 34], [8, 8, 0]),
  aim([36, 30, 14], [12, 10.4, 1]),
  aim([24, 18, 4.5], [12, 10.4, 1]),
  aim([15.0, 13.5, 1.5], [8.71, 5.84, 0.16]),
  aim([12.3, 10.3, 1.2], [4.98, 3.61, -0.09]),
  aim([11.0, 7.4, 1.0], [2.3, 2.71, -0.54]),
];
const VIA_T_TALL: Via = { ...viaOf(T_TALL), sx: T_TALL.map(() => 0), sy: T_TALL.map(() => 0) };
const tallFrom = cam();
export function najamTTall(t: number, fov0: number, end: Cam, out: Cam = cam()): Cam {
  Object.assign(tallFrom, HIGH4, { sx: 0, sy: 0, fov: fov0 });
  fly(tallFrom, end, glide(clamp01(t)), out, VIA_T_TALL);
  out.y += HALL_Y;
  return out;
}

// How far inside the hall a point is, 1 in it and 0 out of it, in hall metres with y over the platform. It runs from the faces of the shell out
// to reach metres beyond them, 3 m by default, so a camera that comes in at the door or the roof light is in the hall's air from its threshold and a
// camera 3 m out is not. The haze of the story reads it with a reach of 12 m, so it is gone before the camera is at the door, and the world's fog
// with 3. There is none inside.
export const hallInside = (x: number, y: number, z: number, reach = 3) => {
  const d = Math.min(HALL.dockX + 0.4 - x, x - (HALL.backX - 0.3), 15.9 - z, z - (HALL.sideZ - 0.3), 10.4 - y);
  return clamp01((d + reach) / reach);
};
