// The world of the Sistem scene, in metres. Ground y = 0, forks point +x, the side camera looks from +z.
// Places along +x, the outdoor site and its road, the warehouse, the blueprint stage, the rental platform
// and the robot floor. A truck's position along the road is a function of the scroll position alone.
import * as THREE from 'three';
import { track } from '../../../story/scenes/sistem/tracks';

export const WH = { x0: 118, x1: 170, z0: -23, z1: -5, eave: 9, peak: 10.6 };
export const AISLES = [-19.8, -14.4, -9.0];
export const WH_C = new THREE.Vector3((WH.x0 + WH.x1) / 2, 0, (WH.z0 + WH.z1) / 2);
export const BP = new THREE.Vector3(260, 0, -14.4);
export const NP = new THREE.Vector3(360, 0, 0);
export const ATP = new THREE.Vector3(360, -9, 0);

// The road, a polyline with rounded corners. It runs along +x, jogs toward -z and runs on to the warehouse door.
const WAY: [number, number][] = [
  [-90, 0],
  [84, 0],
  [84, AISLES[1]],
  [WH.x0 + 2, AISLES[1]],
];
const R_CORNER = 6.5;

export type RoutePt = { x: number; z: number; yaw: number; s: number };

function buildRoute(): RoutePt[] {
  const P = WAY.map(([x, z]) => new THREE.Vector2(x, z));
  const out: THREE.Vector2[] = [];
  out.push(P[0].clone());
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i].clone().sub(P[i - 1]).normalize();
    const b = P[i + 1].clone().sub(P[i]).normalize();
    const th = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
    const t = R_CORNER * Math.tan(th / 2);
    const tin = P[i].clone().addScaledVector(a, -t);
    const tout = P[i].clone().addScaledVector(b, t);
    const n = b.clone().addScaledVector(a, -a.dot(b)).normalize();
    const c = tin.clone().addScaledVector(n, R_CORNER);
    const a0 = Math.atan2(tin.y - c.y, tin.x - c.x);
    let da = Math.atan2(tout.y - c.y, tout.x - c.x) - a0;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    out.push(tin);
    for (let j = 1; j < 24; j++) out.push(new THREE.Vector2(c.x + Math.cos(a0 + (da * j) / 24) * R_CORNER, c.y + Math.sin(a0 + (da * j) / 24) * R_CORNER));
    out.push(tout);
  }
  out.push(P[P.length - 1].clone());
  // resample every 0.25 m
  const pts: RoutePt[] = [];
  let s = 0;
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    const len = a.distanceTo(b);
    const n = Math.max(1, Math.ceil(len / 0.25));
    const yaw = Math.atan2(-(b.y - a.y), b.x - a.x);
    for (let j = 0; j < n; j++) {
      pts.push({ x: a.x + ((b.x - a.x) * j) / n, z: a.y + ((b.y - a.y) * j) / n, yaw, s: s + (len * j) / n });
    }
    s += len;
  }
  const l = out[out.length - 1];
  pts.push({ x: l.x, z: l.y, yaw: pts[pts.length - 1].yaw, s });
  return pts;
}

export const ROUTE = buildRoute();
export const ROUTE_LEN = ROUTE[ROUTE.length - 1].s;

export function routeAt(s: number): RoutePt {
  const q = THREE.MathUtils.clamp(s, 0, ROUTE_LEN);
  let lo = 0;
  let hi = ROUTE.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ROUTE[m].s <= q) lo = m;
    else hi = m;
  }
  const a = ROUTE[lo];
  const b = ROUTE[hi];
  const t = b.s - a.s > 1e-9 ? (q - a.s) / (b.s - a.s) : 0;
  let dy = b.yaw - a.yaw;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + dy * t, s: q };
}

// Arc length at which the truck centre has x = X on the last straight, where it parks before the door.
const sAtX = (X: number) => ROUTE.find((p) => p.s > ROUTE_LEN - 60 && p.x >= X && Math.abs(p.z - AISLES[1]) < 0.01)?.s ?? ROUTE_LEN;
export const S_START = 90;
export const S_END = sAtX(WH.x0 - 5);

// The outdoor truck along the road, by scroll position in pixels. It rests at the hero and at the building.
export const truckS = track([
  [0, S_START],
  [500, S_START],
  [1000, S_START + 19],
  [1500, S_START + 38],
  [2300, S_START + 38],
  [2600, S_START + 53],
  [2900, S_START + 68],
  [3500, S_START + 80],
  [4700, S_END],
  [12000, S_END],
]);

// Where the building stands along the road.
export const BUILDING_X = 34;
