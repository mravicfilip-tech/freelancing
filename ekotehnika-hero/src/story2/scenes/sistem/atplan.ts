// The automation floor as one plan. Everything is laid out in aisle metres, a along the aisle away from the first camera,
// b across it to the right of the frame. One order runs across the AT hold, k 0 to 1. The C-Matic 10 leaves its charger
// (0 to 0.3), drives under a shelf unit, lifts it and carries it out (0.3 to 0.6), and brings it to the pick station where
// a person takes the box (0.6 to 1). Two more C-Matics work the same aisle in sync. Every pose is a pure function of k.
import * as THREE from 'three';
import { ATP } from './route';
import { ease } from './kit';

// A keyframe is [k, ...values]. Between two keys the values ease in and out, so a robot starts and stops like one.
export type KF = number[];
const PI = Math.PI;

export function sampleKF(kfs: KF[], k: number, out: number[] = []): number[] {
  const n = kfs.length;
  if (k <= kfs[0][0]) return kfs[0].slice(1);
  if (k >= kfs[n - 1][0]) return kfs[n - 1].slice(1);
  let i = 0;
  while (i < n - 2 && k > kfs[i + 1][0]) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const t = ease((k - a[0]) / (b[0] - a[0]));
  for (let j = 1; j < a.length; j++) out[j - 1] = a[j] + (b[j] - a[j]) * t;
  out.length = a.length - 1;
  return out;
}

// Robot routes, [k, a, b, heading, lift]. Heading 0 looks along +a, PI / 2 looks along +b.
export const LANE_A = 1.0;
export const LANE_B = -1.0;
export const BAY_B = 3.1;
export const COLS = [6.7, 8.3, 9.9, 11.5, 13.1, 14.7, 16.3, 17.9];
// the target is the first bay of the front row, so no unit stands between the camera and the lift
export const TARGET = { a: COLS[0], b: BAY_B };
export const STATION = { a: 24.9, b: LANE_A };
export const LIFT = 0.14;

export const ACTIVE: KF[] = [
  [0.0, 1.7, LANE_A, 0, 0],
  [0.06, 1.7, LANE_A, 0, 0],
  [0.28, TARGET.a, LANE_A, 0, 0],
  [0.34, TARGET.a, LANE_A, PI / 2, 0],
  [0.44, TARGET.a, BAY_B, PI / 2, 0],
  [0.5, TARGET.a, BAY_B, PI / 2, LIFT],
  [0.58, TARGET.a, LANE_A, PI / 2, LIFT],
  [0.64, TARGET.a, LANE_A, 0, LIFT],
  [0.86, STATION.a, STATION.b, 0, LIFT],
  [0.92, STATION.a, STATION.b, 0, 0],
  [1.0, STATION.a, STATION.b, 0, 0],
];
// the second robot lifts the unit at the seventh bay and runs it down the aisle to a second station near the far wall
export const FLEET1: KF[] = [
  [0.0, COLS[6], BAY_B, PI / 2, 0],
  [0.1, COLS[6], BAY_B, PI / 2, LIFT],
  [0.18, COLS[6], LANE_A, PI / 2, LIFT],
  [0.24, COLS[6], LANE_A, 0, LIFT],
  [0.62, 29.2, LANE_A, 0, LIFT],
  [0.7, 29.2, LANE_A, 0, 0],
  [1.0, 29.2, LANE_A, 0, 0],
];
// the third comes back empty on the far lane and goes under the eighth bay
export const FLEET2: KF[] = [
  [0.0, 29.0, LANE_B, PI, 0],
  [0.5, COLS[7], LANE_B, PI, 0],
  [0.58, COLS[7], LANE_B, PI / 2, 0],
  [0.72, COLS[7], BAY_B, PI / 2, 0],
  [0.8, COLS[7], BAY_B, PI / 2, LIFT],
  [0.92, COLS[7], LANE_A, PI / 2, LIFT],
  [1.0, COLS[7], LANE_A, PI / 2, LIFT],
];
// The lifted units. A unit sits in its bay until its robot lifts it, then it rides the robot, turning with it.
export type UnitPlan = { slot: [number, number]; robot: KF[]; from: number; seed: number };
export const MOVING: UnitPlan[] = [
  { slot: [TARGET.a, TARGET.b], robot: ACTIVE, from: 0.44, seed: 7 },
  { slot: [COLS[6], BAY_B], robot: FLEET1, from: 0.0, seed: 11 },
  { slot: [COLS[7], BAY_B], robot: FLEET2, from: 0.72, seed: 13 },
];

export type Pose = { a: number; b: number; h: number; lift: number };
export function poseOf(kfs: KF[], k: number): Pose {
  const v = sampleKF(kfs, k);
  return { a: v[0], b: v[1], h: v[2], lift: v[3] };
}

// The camera follows the active robot. Along the aisle it stays on it, across the aisle it follows a little over half of the move
// into the bay, so the view does not sway on the turns.
export const focusAt = (k: number) => {
  const p = poseOf(ACTIVE, k);
  return { a: p.a, b: LANE_A + 0.55 * (p.b - LANE_A) };
};

// The world, aisle metres to world metres. A heading h in the plan is a world yaw of PI - h.
export const toWorld = (a: number, b: number, y = 0): [number, number, number] => [ATP.x - a, y, ATP.z - b];
export const yawOf = (h: number) => PI - h;
export const v3 = (a: number, b: number, y = 0) => new THREE.Vector3(...toWorld(a, b, y));
