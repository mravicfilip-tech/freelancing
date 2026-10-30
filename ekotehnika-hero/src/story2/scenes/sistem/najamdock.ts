// The docks of the Najam hall as one plan, in hall metres, the same idea as najamplan.ts for the aisle, every pose a pure function of k of N
// so a frozen clock draws the same picture and scrolling back runs it backwards. Three lorries and three forklifts, in the beats of the
// table in briefs/round6/plan.md.
//   N1  lorry 1 turns in from the yard road, passes dock 1, stops and backs onto it in an arc. The rented forklifts stand at their bays.
//   N2  forklift A drives into the trailer, lifts the first pallet, backs out and sets it in the wall lane. Forklift B follows it in from
//       the far side of the apron and brings the second out to the far corner. Lorry 1 shuts its doors and pulls away.
//   N3  lorry 2 turns in and backs onto dock 3, out of sight of the aisle camera, from the second flight on.
//   N4  forklift C carries a pallet into lorry 2 and sets it down, backs out, the doors close and the lorry pulls away down the yard
//       road, and lorry 3 turns in from the road and starts to back onto dock 4 as T takes the screen.
// The lorries run on past k 1, to 1.1 in T, which is 400px more, so the hall does not stop them mid way as it sinks. No truck runs faster
// than 0.03 m per story px and no lorry faster than 0.05 m per px, see the check in the commit. Kept free of three.
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
// the lanes of the yard road, a lorry drives on the right, so north bound on the east lane and south bound on the west one
const NORTH = 35.75;
const SOUTH = 32.25;
const TURN = 7;

// ---- the lorries ------------------------------------------------------------------------------------------------------

// A lorry's pose, the middle of the trailer's axles A and the heading psi of the trailer, which fix the trailer, and the pivot P, a hitch
// 4.8 m ahead of them on the trailer, which the tractor follows with its own heading theta. The doors fold back at close 0 and are shut at 1.
export type LorryPose = { ax: number; az: number; psi: number; px: number; pz: number; theta: number; close: number; open: number; shown: boolean };
export const mkLorry = (): LorryPose => ({ ax: 0, az: 0, psi: 0, px: 0, pz: 0, theta: 0, close: 0, open: 0, shown: true });

// Turning in. Drives along the road past the dock's row, stops 7 m beyond it, and backs a quarter circle of 7 m radius to face the dock, then
// straight on to the bumpers. lead is how far before the stop it starts. From the south on the north bound lane, or from the north.
function arrival(dock: number, lead: number, south = false) {
  const z0 = Z[dock];
  const ways: Way[] = south
    ? [
        // coming down the road from the north end of the yard on the south bound lane, stops 7 m past the dock and backs north to it
        { x: SOUTH, z: z0 + TURN - lead, th: 90 },
        { x: SOUTH, z: z0 + TURN, th: 90, dir: -1, mo: 1.657 * TURN },
        { x: SOUTH - TURN, z: z0, th: 0, dir: -1, mi: 1.657 * TURN },
        { x: REAR_X + AXLE, z: z0, th: 0 },
      ]
    : [
        { x: NORTH, z: z0 - TURN + lead, th: 270 },
        { x: NORTH, z: z0 - TURN, th: 270, dir: -1, mo: 1.657 * TURN },
        { x: NORTH - TURN, z: z0, th: 0, dir: -1, mi: 1.657 * TURN },
        { x: REAR_X + AXLE, z: z0, th: 0 },
      ];
  return { rt: route(ways), rev: 1 };
}
// Pulling away. Drives straight out from the dock and turns onto the road with a 7 m radius, right onto the south bound lane or left, the north bound
// one, and runs on down the road.
function departure(dock: number, run: number, north = false) {
  const z0 = Z[dock];
  const ways: Way[] = north
    ? [
        { x: REAR_X + AXLE, z: z0, th: 0 },
        { x: NORTH - TURN, z: z0, th: 0, mo: 1.657 * TURN },
        { x: NORTH, z: z0 - TURN, th: 270, mi: 1.657 * TURN },
        { x: NORTH, z: z0 - TURN - run, th: 270 },
      ]
    : [
        { x: REAR_X + AXLE, z: z0, th: 0 },
        { x: SOUTH - TURN, z: z0, th: 0, mo: 1.657 * TURN },
        { x: SOUTH, z: z0 + TURN, th: 90, mi: 1.657 * TURN },
        { x: SOUTH, z: z0 + TURN + run, th: 90 },
      ];
  return { rt: route(ways), rev: 99 };
}

const tmp = { x: 0, z: 0, th: 0, roll: 0 };
const tmp2 = { x: 0, z: 0, th: 0, roll: 0 };

// The pose at a distance s along a route. rev is the leg the lorry reverses from, so the tractor's heading is the way its pivot moves, turned
// round once it backs. The pivot is taken a little ahead in the direction of travel, one sided so the stop between the two legs reads right.
function poseOn(r: { rt: Route; rev: number }, s: number, out: LorryPose) {
  const back = s >= r.rt.at[r.rev] - 1e-9;
  r.rt.pose(s, tmp);
  out.ax = tmp.x;
  out.az = tmp.z;
  out.psi = tmp.th;
  const L = PIVOT - AXLE;
  out.px = tmp.x + Math.cos(tmp.th) * L;
  out.pz = tmp.z + Math.sin(tmp.th) * L;
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
  const h = Math.atan2(pbz - paz, pbx - pax) + (back ? PI : 0);
  out.theta = out.psi + wrap(h - out.psi);
}

type LorryPlan = {
  arrive: { rt: Route; rev: number };
  arriveS: (k: number) => number;
  leave: { rt: Route; rev: number };
  leaveS: (k: number) => number;
  // k the doors start to shut and the k they are shut
  shut: [number, number];
  // the near side of the trailer draws back like a curtain, from k0 to k1, and closes again from k2 to k3
  curtain: [number, number, number, number];
  // the k the lorry is first drawn, and the k it is gone
  from: number;
  to: number;
};

function lorryPlan(dock: number, p: { south?: boolean; north?: boolean; curtain?: [number, number, number, number]; lead: number; go: [number, number]; stop: number; back: [number, number]; shut: [number, number]; away: [number, number]; run: number; far: number; from?: number }): LorryPlan {
  const arrive = arrival(dock, p.lead, p.south);
  const leave = departure(dock, p.run, p.north);
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

// Lorry 1 comes in with the story and goes after N2, lorry 2 backs onto dock 3 in N2 and N3 and loads in N4, lorry 3 starts for dock 4 in N3
// and backs on as T opens. The stops between the legs are a hold of 40px or so.
const LORRIES: LorryPlan[] = [
  lorryPlan(0, { lead: 10, go: [0, 0.08], stop: 0.085, back: [0.085, 0.25], north: true, curtain: [0.2, 0.27, 0.52, 0.56], shut: [0.55, 0.58], away: [0.57, 0.9], run: 24, far: 45.3 }),
  lorryPlan(2, { lead: 10, go: [0.44, 0.52], stop: 0.53, back: [0.53, 0.72], shut: [0.935, 0.95], away: [0.955, 1.1], run: 14, far: 17, from: 0.44 }),
  lorryPlan(0, { south: true, lead: 34, go: [0.62, 0.88], stop: 0.9, back: [0.9, 1.1], shut: [2, 2], away: [2, 2.1], run: 4, far: 1, from: 0.62 }),
];
export const LORRY_COUNT = LORRIES.length;
// the k of N for a position u of the story, which runs on past 1 through T, 400px for a tenth, so the lorries do not stop as the hall sinks
export const kLong = (u: number) => (u < 13 ? clamp01(u - 12) : 1 + Math.min(u - 13, 1) * 0.1);

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
// first leg and so on, 0 for the start and -1 for the end of the whole route. A turn is a quarter circle of 2.2 m.
const R = 2.2;
const BEND = 1.657 * R;
type Dock = { rt: Route; s: (k: number) => number; lift: (k: number) => number };

function dockTrip(ways: Way[], s: [number, number][], lift: [number, number][]): Dock {
  const rt = route(ways);
  const at = (leg: number) => (leg < 0 ? rt.len : rt.at[leg]);
  return { rt, s: pace(s.map(([k, leg]) => [k, at(leg)] as [number, number])), lift: pace(lift) };
}

// Forklift A waits on the apron at the first door. In to the first pallet of the trailer, lifts it, backs out to the middle of the apron,
// turns right onto the wall lane and sets the pallet down on the middle place of the lane between the first two doors.
const A_END = { x: 13.2, z: (Z[0] + Z[1]) / 2 };
export const A_MARKS = { lift: [0.255, 0.268], set: [0.348, 0.358] } as const;
const A = dockTrip(
  [
    { x: 10.6, z: Z[0], th: 0 },
    { x: REAR_X + 0.9 - X50_FWD, z: Z[0], th: 0, dir: -1 },
    { x: 11.0, z: Z[0], th: 0, mo: BEND },
    { x: A_END.x, z: Z[0] + R, th: 90, mi: BEND },
    { x: A_END.x, z: A_END.z - X50_FWD, th: 90 },
  ],
  [[0, 0], [0.215, 0], [0.255, 1], [0.268, 1], [0.304, 2], [0.348, -1]],
  [[0, 0], [A_MARKS.lift[0], 0], [A_MARKS.lift[1], CARRY], [A_MARKS.set[0], CARRY], [A_MARKS.set[1], 0]],
);

// Forklift B waits at its bay in the corner by the far wall. Round an S curve onto the door's line once A has left it, in to the second pallet,
// lifts it, backs out and turns left to the far corner of the wall, where it sets the pallet down. It finishes in the second flight.
export const B_MARKS = { lift: [0.418, 0.43], set: [0.522, 0.532] } as const;
const B = dockTrip(
  [
    { x: 9.2, z: -14.5, th: 0 },
    { x: 13.0, z: Z[0], th: 0 },
    { x: REAR_X + 1.9 - X50_FWD, z: Z[0], th: 0, dir: -1 },
    { x: 11.0, z: Z[0], th: 0, mo: BEND },
    { x: 13.2, z: Z[0] - R, th: 270, mi: BEND },
  ],
  [[0, 0], [0.34, 0], [0.418, 2], [0.43, 2], [0.486, 3], [0.522, -1]],
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
  { by: dockAAt, rest: { x: REAR_X + 0.9, z: Z[0] }, lift: A_MARKS.lift[0], set: A_MARKS.set[1], to: { x: A_END.x, z: A_END.z, th: rad(90) } },
  { by: dockBAt, rest: { x: REAR_X + 1.9, z: Z[0] }, lift: B_MARKS.lift[0], set: B_MARKS.set[1], to: { x: 13.2, z: Z[0] - R - X50_FWD, th: rad(270) } },
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
