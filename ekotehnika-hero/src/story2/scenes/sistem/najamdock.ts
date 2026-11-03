// The docks of the Najam hall as one plan, in hall metres, the same idea as najamplan.ts for the aisle, every pose a pure function of k of N
// so a frozen clock draws the same picture and scrolling back runs it backwards. Three lorries and three forklifts, in the beats of the
// table in briefs/round6/plan.md.
//   N1  lorry 1 comes in through the north gate of the yard on the south bound lane, drives past dock 1, stops and backs onto it in one
//       smooth arc. The rented forklifts stand at their bays.
//   N2  Istovar, 900px. Forklift A drives into the trailer, lifts the first pallet, backs out and turns right into the first aisle to set it
//       down at its mouth. Forklift B follows it in from the far side of the apron and brings the second out the same way, deeper in the
//       aisle. Both trips in and out of the trailer happen in N2, in front of the camera, and neither pallet is within 10 m of the line the
//       camera takes through the door. Lorry 1 shuts its doors as the second forklift is clear of the trailer, at the end of N2, and pulls away
//       across the first part of the flight in, so the door of dock 1 is an open door when the camera arrives at it and the camera never has
//       a lorry within 6 m.
//   N3  lorry 2 comes in through the north gate and backs onto dock 3, out of sight of the aisle camera, once the camera stands inside.
//   N4  forklift C carries a pallet into lorry 2 and sets it down, backs out, the doors close and the lorry pulls away onto the north bound
//       lane and out of the north gate, and lorry 3 comes down the south bound lane and starts to back onto dock 4 as T takes the screen.
// The lorries drive on the right, so the three of them come in on the south bound lane and the two that leave go out on the north bound one,
// and no lorry ever crosses another's way. No two lorries come within 1.5 m of each other and none within 1.5 m of the barriers, the lamp posts
// and the vans of the yard, see the check in the commit.
// Every k here is a k of the plan, planK in timeline.ts, and Istovar and the flight in play 1.6 times as long in the scroll as their marks
// say. The lorries run on past k 1, to 1.1 in T, so the yard does not stop them mid way as the camera dives. No truck runs faster than 0.03 m per
// story px, except the second forklift of the docks that takes 0.035, and no lorry faster than 0.05 m per px. Kept free of three.
import { planK } from '../../timeline';
import { HALL, X50_FWD, X50_PAL, mk, pace, route, type Pose, type Route, type Way } from './najamplan';

const PI = Math.PI;
const rad = (d: number) => (d * PI) / 180;
const wrap = (a: number) => {
  while (a > PI) a -= 2 * PI;
  while (a < -PI) a += 2 * PI;
  return a;
};
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const Z = HALL.docks;
// the rear of a docked trailer, against the bumpers, and the top of the dock's floor, which is the trailer's bed
export const REAR_X = HALL.dockX + 0.4 + 0.35;
const AXLE = 3.7;
const PIVOT = 8.5;
// the lanes of the yard road, a lorry drives on the right, so north bound on the east lane and south bound on the west one. The road is 8 m wide and
// the lanes 4.5 m apart, so two lorries that pass each other on it have 1.9 m between them
export const NORTH = 36.25;
export const SOUTH = 31.75;
const TURN = 7;

// ---- the lorries ------------------------------------------------------------------------------------------------------

// A lorry's pose, the middle of the trailer's axles A and the heading psi of the trailer, which fix the trailer, and the pivot P, a hitch
// 4.8 m ahead of them on the trailer, which the tractor follows with its own heading theta. The doors fold back at close 0 and are shut at 1.
export type LorryPose = { ax: number; az: number; psi: number; px: number; pz: number; theta: number; close: number; open: number; shown: boolean };
export const mkLorry = (): LorryPose => ({ ax: 0, az: 0, psi: 0, px: 0, pz: 0, theta: 0, close: 0, open: 0, shown: true });

// Turning in. Drives down the road past the dock's row, stops one radius beyond it, and backs one quarter circle to face the dock, then
// straight on to the bumpers, so the cab swings out once and comes back once. lead is how far before the stop it starts. From the north on the
// south bound lane, or from the south on the north bound one.
function arrival(dock: number, lead: number, south = false, turn = TURN) {
  const z0 = Z[dock];
  const ways: Way[] = south
    ? [
        // coming down the road from the north gate on the south bound lane, stops a radius past the dock and backs north to it
        { x: SOUTH, z: z0 + turn - lead, th: 90 },
        { x: SOUTH, z: z0 + turn, th: 90, dir: -1, mo: 1.657 * turn },
        { x: SOUTH - turn, z: z0, th: 0, dir: -1, mi: 1.657 * turn },
        { x: REAR_X + AXLE, z: z0, th: 0 },
      ]
    : [
        { x: NORTH, z: z0 - turn + lead, th: 270 },
        { x: NORTH, z: z0 - turn, th: 270, dir: -1, mo: 1.657 * turn },
        { x: NORTH - turn, z: z0, th: 0, dir: -1, mi: 1.657 * turn },
        { x: REAR_X + AXLE, z: z0, th: 0 },
      ];
  return { rt: route(ways), rev: 1 };
}
// Pulling away. Drives straight out from the dock and turns onto the road with a quarter circle, right onto the south bound lane or left, the
// north bound one, and runs on down the road.
function departure(dock: number, run: number, north = false, turn = TURN) {
  const z0 = Z[dock];
  const ways: Way[] = north
    ? [
        { x: REAR_X + AXLE, z: z0, th: 0 },
        { x: NORTH - turn, z: z0, th: 0, mo: 1.657 * turn },
        { x: NORTH, z: z0 - turn, th: 270, mi: 1.657 * turn },
        { x: NORTH, z: z0 - turn - run, th: 270 },
      ]
    : [
        { x: REAR_X + AXLE, z: z0, th: 0 },
        { x: SOUTH - turn, z: z0, th: 0, mo: 1.657 * turn },
        { x: SOUTH, z: z0 + turn, th: 90, mi: 1.657 * turn },
        { x: SOUTH, z: z0 + turn + run, th: 90 },
      ];
  return { rt: route(ways), rev: 99 };
}

const tmp = { x: 0, z: 0, th: 0, roll: 0 };
const tmp2 = { x: 0, z: 0, th: 0, roll: 0 };

// The angle between the tractor and its trailer, as a function of the distance s along a route. The raw angle is the way the pivot moves, turned
// round once the lorry backs. It jumps wherever the bend of the route jumps, 25 degrees at the end of a turn, and 33 at the moment a lorry that was
// driving forward starts to back with the lorry standing still, which read as the cab swinging left and then right. So the angle is a raw one that a
// tractor follows with a lag, 1.2 m of travel while the lorry drives forward, so the cab still leads the trailer round every bend, and 3 m once it
// backs, which turns the jump into one calm swing out and one calm swing back. In reverse only three quarters of it is drawn, a cab that stays closer
// to the trailer's line, since the cab and the trailer are one body at the pivot and the angle only shows how the cab sits.
const LAG = [1.2, 3];
const SWING = [1, 0.75];
type Rt = { rt: Route; rev: number; art?: Float32Array };
const rawAngle = (r: Rt, s: number) => {
  const back = s >= r.rt.at[r.rev] - 1e-9;
  r.rt.pose(s, tmp);
  const psi = tmp.th;
  const L = PIVOT - AXLE;
  const d = 0.2;
  let a = back ? s : Math.max(0, s - d);
  let b = back ? Math.min(r.rt.len, s + d) : s;
  // at the end of the route, or at the start of a forward one, look the other way along it
  if (b - a < 0.05) {
    a = Math.max(0, s - d);
    b = Math.min(r.rt.len, s + d);
  }
  r.rt.pose(a, tmp);
  const pax = tmp.x + Math.cos(tmp.th) * L;
  const paz = tmp.z + Math.sin(tmp.th) * L;
  r.rt.pose(b, tmp2);
  const pbx = tmp2.x + Math.cos(tmp2.th) * L;
  const pbz = tmp2.z + Math.sin(tmp2.th) * L;
  return wrap(Math.atan2(pbz - paz, pbx - pax) + (back ? PI : 0) - psi);
};
const ART_STEP = 0.1;
function articulation(r: Rt, s: number) {
  if (!r.art) {
    const n = Math.ceil(r.rt.len / ART_STEP) + 1;
    const a = new Float32Array(n);
    const rev = r.rt.at[r.rev] ?? Infinity;
    let g = rawAngle(r, 0);
    for (let i = 0; i < n; i++) {
      const raw = rawAngle(r, i * ART_STEP);
      const m = i * ART_STEP < rev - 1e-9 ? 0 : 1;
      g += (raw - g) * (1 - Math.exp(-ART_STEP / LAG[m]));
      a[i] = g * SWING[m];
    }
    r.art = a;
  }
  const f = Math.min(Math.max(s, 0), r.rt.len) / ART_STEP;
  const i = Math.min(Math.floor(f), r.art.length - 2);
  return r.art[i] + (r.art[i + 1] - r.art[i]) * (f - i);
}

// The pose at a distance s along a route. The trailer's axle and heading come from the route and the tractor stands at the pivot, a hitch 4.8 m
// ahead of the axles, turned by the angle above.
function poseOn(r: Rt, s: number, out: LorryPose) {
  r.rt.pose(s, tmp);
  out.ax = tmp.x;
  out.az = tmp.z;
  out.psi = tmp.th;
  const L = PIVOT - AXLE;
  out.px = tmp.x + Math.cos(tmp.th) * L;
  out.pz = tmp.z + Math.sin(tmp.th) * L;
  out.theta = out.psi + articulation(r, s);
}

type LorryPlan = {
  arrive: Rt;
  arriveS: (k: number) => number;
  leave: Rt;
  leaveS: (k: number) => number;
  // k the doors start to shut and the k they are shut
  shut: [number, number];
  // the near side of the trailer draws back like a curtain, from k0 to k1, and closes again from k2 to k3
  curtain: [number, number, number, number];
  // the k the lorry is first drawn, and the k it is gone
  from: number;
  to: number;
};

function lorryPlan(dock: number, p: { south?: boolean; north?: boolean; turn?: number; out?: number; curtain?: [number, number, number, number]; lead: number; go: [number, number]; stop: number; back: [number, number]; shut: [number, number]; away: [number, number]; run: number; far: number; from?: number }): LorryPlan {
  const arrive = arrival(dock, p.lead, p.south, p.turn);
  const leave = departure(dock, p.run, p.north, p.out ?? p.turn);
  const at = arrive.rt.at;
  return {
    arrive,
    arriveS: pace([[0, 0], [p.go[0], 0], [p.go[1], at[1]], [p.back[0], at[1]], [p.back[1], arrive.rt.len]]),
    leave,
    leaveS: pace([[0, 0], [p.away[0], 0], [p.away[1], p.far]]),
    shut: p.shut,
    curtain: p.curtain ?? [9, 9, 9, 9],
    from: p.from ?? 0,
    to: p.away[1],
  };
}

// Lorry 1 comes in through the north gate with the story, shuts its doors as the unloading ends and pulls away across the first half of the
// flight in, lorry 2 comes in and backs onto dock 3 in N3 and loads in N4 and leaves by the north gate, lorry 3 comes in through the north gate and
// goes down the road to the stop beside dock 4 at the end of N4 and backs on as T opens. The stops between the legs are a hold of 40px or so. Lorry 1
// runs 34 m of its way out, at 0.05 m per px at the most, which clears the door of dock 1 by 15 m while the camera is still in the yard.
const LORRIES: LorryPlan[] = [
  lorryPlan(0, { south: true, north: true, turn: 8, out: 8, lead: 26, go: [0, 0.13], stop: 0.135, back: [0.135, 0.25], curtain: [0.2, 0.27, 0.416, 0.428], shut: [0.416, 0.428], away: [0.423, 0.5], run: 24, far: 34 }),
  lorryPlan(2, { south: true, north: true, out: 8, lead: 26, go: [0.55, 0.62], stop: 0.625, back: [0.625, 0.76], shut: [0.935, 0.95], away: [0.955, 1.1], run: 20, far: 40, from: 0.55 }),
  lorryPlan(3, { south: true, lead: 34, go: [0.72, 0.9], stop: 0.905, back: [0.905, 1.1], shut: [2, 2], away: [2, 2.1], run: 4, far: 1, from: 0.72 }),
];
export const LORRY_COUNT = LORRIES.length;
// the k of N for a position u of the story, which runs on past 1 through T, 400px for a tenth, so the lorries do not stop as the hall sinks
export const kLong = (u: number) => (u < 13 ? planK(clamp01(u - 12)) : 1 + Math.min(u - 13, 1) * 0.1);

const sh = (t: number) => ease(clamp01(t));
export function lorryAt(i: number, k: number, out: LorryPose = mkLorry()): LorryPose {
  const L = LORRIES[i];
  out.shown = k >= L.from && k < L.to;
  out.close = sh((k - L.shut[0]) / (L.shut[1] - L.shut[0]));
  out.open = sh((k - L.curtain[0]) / (L.curtain[1] - L.curtain[0])) * (1 - sh((k - L.curtain[2]) / (L.curtain[3] - L.curtain[2])));
  const away = k >= L.shut[1] && L.shut[1] < 2;
  if (away) poseOn(L.leave, L.leaveS(k), out);
  else poseOn(L.arrive, L.arriveS(k), out);
  return out;
}

// ---- the forklifts ----------------------------------------------------------------------------------------------------

const CARRY = 0.15;
// A drive in, a lift, a back out, a turn and a set down, as one route with the fork height beside it. The route is its way points, s the
// distance along it and lift the fork height, both against k. The keys of s are written as the leg a stop is at the end of, 1 for the
// first leg and so on, 0 for the start and -1 for the end of the whole route. A turn is a quarter circle of 1.9 m.
type Dock = { rt: Route; s: (k: number) => number; lift: (k: number) => number };

function dockTrip(ways: Way[], s: [number, number][], lift: [number, number][]): Dock {
  const rt = route(ways);
  const at = (leg: number) => (leg < 0 ? rt.len : rt.at[leg]);
  return { rt, s: pace(s.map(([k, leg]) => [k, at(leg)] as [number, number])), lift: pace(lift) };
}

// Forklift A waits on the apron at the first door. In to the first pallet of the trailer, lifts it, backs out to the middle of the apron,
// turns right through half a circle of 1.925 m onto the line of the first aisle and drives in along it, to set the pallet down 23 m from the
// door. Forklift B does the same with the second, 6 m short of it. They are 10 m or more from the camera that goes through the door and
// along the wall, since the door is the one frame of the flight where a forklift would fill the picture, and both are in the aisle, which the
// aisle camera of N3, on the other side of the hall, never sees.
const U = 1.925;
const BU = 1.657 * U;
const PUT_X = [-12, -6];
export const A_MARKS = { lift: [0.31, 0.318], set: [0.5, 0.51] } as const;
const A = dockTrip(
  [
    { x: 10.6, z: Z[0], th: 0 },
    { x: REAR_X + 0.9 - X50_FWD, z: Z[0], th: 0, dir: -1 },
    { x: 11.0, z: Z[0], th: 0, mo: BU },
    { x: 11.0 + U, z: Z[0] + U, th: 90, mi: BU, mo: BU },
    { x: 11.0, z: Z[0] + 2 * U, th: 180, mi: BU },
    { x: PUT_X[0] + X50_FWD, z: Z[0] + 2 * U, th: 180 },
  ],
  [[0, 0], [0.285, 0], [0.31, 1], [0.318, 1], [0.345, 2], [0.5, -1]],
  [[0, 0], [A_MARKS.lift[0], 0], [A_MARKS.lift[1], CARRY], [A_MARKS.set[0], CARRY], [A_MARKS.set[1], 0]],
);

// Forklift B waits at its bay in the corner by the far wall. Round an S curve onto the door's line once A has left it, in to the second pallet,
// lifts it, backs out, and takes the same way into the aisle as A, to set the pallet down deeper in. It is out of the trailer when the doors
// shut and finishes as the flight in ends.
export const B_MARKS = { lift: [0.385, 0.397], set: [0.51, 0.52] } as const;
const B = dockTrip(
  [
    { x: 9.2, z: -14.5, th: 0 },
    { x: 13.0, z: Z[0], th: 0 },
    { x: REAR_X + 1.9 - X50_FWD, z: Z[0], th: 0, dir: -1 },
    { x: 11.0, z: Z[0], th: 0, mo: BU },
    { x: 11.0 + U, z: Z[0] + U, th: 90, mi: BU, mo: BU },
    { x: 11.0, z: Z[0] + 2 * U, th: 180, mi: BU },
    { x: PUT_X[1] + X50_FWD, z: Z[0] + 2 * U, th: 180 },
  ],
  [[0, 0], [0.335, 0], [0.385, 2], [0.397, 2], [0.42, 3], [0.51, -1]],
  [[0, 0], [B_MARKS.lift[0], 0], [B_MARKS.lift[1], CARRY], [B_MARKS.set[0], CARRY], [B_MARKS.set[1], 0]],
);

// Forklift C waits on the apron at the third door with a pallet on its forks, goes in, sets it down at the second place of the trailer and
// backs out, so the doors can close. It starts as the third flight ends and is out of the trailer by the middle of N4.
export const C_MARKS = { set: [0.885, 0.893] } as const;
// forklift C stands at the third door from the end of N3, the aisle camera of N3 would catch it at the edge of its frame before that
export const C_FROM = 0.76;
const C = dockTrip(
  [
    { x: 10.6, z: Z[2], th: 0 },
    { x: REAR_X + 1.9 - X50_FWD, z: Z[2], th: 0, dir: -1 },
    { x: 11.0, z: Z[2], th: 0 },
  ],
  [[0, 0], [0.835, 0], [0.885, 1], [0.893, 1], [0.94, -1]],
  [[0, CARRY], [C_MARKS.set[0], CARRY], [C_MARKS.set[1], 0]],
);

const tp = { x: 0, z: 0, th: 0, roll: 0 };
const dockOf = (T: Dock) => (k: number, out: Pose = mk()): Pose => {
  T.rt.pose(T.s(k), tp);
  out.x = tp.x;
  out.z = tp.z;
  out.th = tp.th;
  out.roll = tp.roll;
  out.lift = T.lift(k);
  out.reach = 0;
  return out;
};
export const dockAAt = dockOf(A);
export const dockBAt = dockOf(B);
export const dockCAt = dockOf(C);

// ---- the pallets of the docks -----------------------------------------------------------------------------------------

// The pallets the forklifts move. Each rests where it stands in the trailer until its truck lifts it, rides on the forks, and is set down
// at its place, the lane or the trailer of the next lorry. The third has been on the forks of its truck since the start, so it has no
// resting place, and it is hidden once it is set down in the trailer, where lorry 2 carries a pallet of its own at the same place.
export type DockPallet = { x: number; y: number; z: number; th: number; shown: boolean };
type Mover = { by: (k: number, o: Pose) => Pose; rest?: { x: number; z: number }; lift: number; set: number; to: { x: number; z: number; th: number }; hide?: boolean };
const DOCK_PALLETS: Mover[] = [
  { by: dockAAt, rest: { x: REAR_X + 0.9, z: Z[0] }, lift: A_MARKS.lift[0], set: A_MARKS.set[1], to: { x: PUT_X[0], z: Z[0] + 2 * U, th: rad(180) } },
  { by: dockBAt, rest: { x: REAR_X + 1.9, z: Z[0] }, lift: B_MARKS.lift[0], set: B_MARKS.set[1], to: { x: PUT_X[1], z: Z[0] + 2 * U, th: rad(180) } },
  { by: dockCAt, lift: -1, set: C_MARKS.set[1], to: { x: REAR_X + 1.9, z: Z[2], th: 0 }, hide: true },
];
export const DOCK_PALLET_COUNT = DOCK_PALLETS.length;
// where the third pallet stands in the trailer of lorry 2, in the trailer's own frame, and from when
export const C_IN_TRAILER = { x: 1.9, from: C_MARKS.set[1] };
const dp = mk();
export function dockPalletAt(i: number, k: number, out: DockPallet = { x: 0, y: 0, z: 0, th: 0, shown: true }): DockPallet {
  const p = DOCK_PALLETS[i];
  out.shown = true;
  if (k >= p.set) {
    out.x = p.to.x;
    out.y = 0;
    out.z = p.to.z;
    out.th = p.to.th;
    out.shown = !p.hide;
    return out;
  }
  if (p.rest && k < p.lift) {
    out.x = p.rest.x;
    out.y = X50_PAL;
    out.z = p.rest.z;
    out.th = 0;
    return out;
  }
  if (p.hide) out.shown = k >= C_FROM;
  p.by(k, dp);
  out.x = dp.x + Math.cos(dp.th) * X50_FWD;
  out.z = dp.z + Math.sin(dp.th) * X50_FWD;
  out.y = dp.lift + X50_PAL;
  out.th = dp.th;
  return out;
}
