// Hero 7, the numbers behind the dig. No three.js import, so the machine, the ground, the spoil and
// the camera all read one source, and a frame at ?p= is the same frame every time. Units are metres.
//
// The route runs along +x, away from the camera. The trench is cut in the verge at z 0, the road lies
// on the camera side (+z) from ROAD_Z, the machine stands on the far verge at MZ and reaches across to
// the trench. Step 2, Dig, runs p 0.15 to 0.45 as four bucket cycles, each one
//   plunge, drag, lift, swing, dump, swing back, with the machine stepping forward at the end
// and the trench front xf, the seam, the machine, the arm and the spoil are all set from p alone.

import { clamp01, smooth, type V3 } from '../hero6/geometry';

export type { V3 };

// ---- the route
export const X_T0 = 0; // where the trench begins
export const X_END = 34; // the end of the drawn route
export const D = 1.25; // trench depth
export const HALF_W = 0.65; // half the trench width at the floor
export const SHOULDER = 0.32; // how far each lip rounds off
export const ROAD_Z = 1.9; // the kerb, the road runs on towards the camera
export const ROAD_W = 4.6;

// ---- the machine
export const MZ = -4; // its centre line, z
export const A = 1.9; // the first cut sits this far ahead of the machine's centre
export const B = 1.1; // one bite, metres of trench per cycle
export const HOUSE_Y = 0.95; // top of the tracks
export const PIV: V3 = [0.95, 1.0, 0.35]; // the boom foot in the house, forward, up, to the right
export const ARM_OFF = PIV[2];
export const PILE_Z = -1.8; // centre of the spoil ridge
export const DUMP_FWD = 2.65; // the dump point is this far ahead of the machine, at the moment of the dump

// the arm in its own plane, x forward and y up, origin at the boom foot. The boom is a gooseneck, E is
// where the stick hangs from it, the stick runs to the bucket's pin W, the tip is on the bucket.
export const E0: [number, number] = [2.68, 2.64];
export const L1 = Math.hypot(E0[0], E0[1]);
export const L2 = 2.37;
export const TIP0: [number, number] = [0.5, -1.2]; // the bucket's cutting edge from its pin, bucket at rest

// ---- the beat
export const P0 = 0.15; // the beat begins, the machine waits until the first cycle
export const CYC0 = 0.16;
export const P1 = 0.45; // and holds its last frame
export const CYCLES = 4;
export const CP = (P1 - CYC0) / CYCLES;

// phases inside one cycle, as shares of it
const PH = { plunge: [0, 0.07], drag: [0.07, 0.27], lift: [0.27, 0.4], swing: [0.4, 0.6], dump: [0.6, 0.74], back: [0.74, 1], step: [0.78, 0.99] } as const;
const seg = (u: number, [a, b]: readonly [number, number]) => clamp01((u - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pose = {
  k: number; // the cycle, 0 to 4
  u: number; // how far through it, 0 to 1
  xm: number; // the machine
  xf: number; // the trench front
  seam: number; // where the plan turns into the render
  tip: V3; // the cutting edge, world
  psi: number; // house yaw, radians, 0 along +x, positive towards the camera side
  boom: number; // boom rotation about its foot
  stick: number; // stick, absolute angle in the arm plane
  bucket: number; // bucket, absolute angle in the arm plane
  dump: number[]; // how far each cycle's dump has got, 0 to 1
  carry: number; // how full the bucket is, 0 to 1
  fw: number; // where E and W sit in the arm plane, for the rods
  ex: number;
  ey: number;
  wx: number;
  wy: number;
};

export function makePose(): Pose {
  return { k: 0, u: 0, xm: -A, xf: X_T0, seam: X_T0, tip: [0, 0, 0], psi: 0, boom: 0, stick: 0, bucket: 0, dump: [0, 0, 0, 0], carry: 0, fw: 0, ex: 0, ey: 0, wx: 0, wy: 0 };
}

// the dump point of cycle k, world x. The machine has not stepped yet when it dumps.
export const dumpX = (k: number) => k * B - A + DUMP_FWD;

// Where the cutting edge is in cycle k at u, and how the bucket is curled there. x, z, y, theta.
const T = [0, 0, 0, 0];
function tipAt(k: number, u: number) {
  const xk = k * B + X_T0;
  const nx = xk + B;
  const dx = dumpX(k);
  const floor = -D + 0.03;
  const cutX = xk + 0.05;
  if (u < PH.plunge[1]) {
    const e = smooth(seg(u, PH.plunge));
    T[0] = cutX;
    T[1] = 0;
    T[2] = lerp(0.05, floor, e);
    T[3] = lerp(0, 0.12, e);
  } else if (u < PH.drag[1]) {
    const c = smooth(seg(u, PH.drag));
    T[0] = cutX + B * c;
    T[1] = 0;
    T[2] = floor + 0.12 * c;
    T[3] = lerp(0.12, -0.8, c);
  } else if (u < PH.lift[1]) {
    const e = smooth(seg(u, PH.lift));
    T[0] = lerp(cutX + B, nx - 0.15, e);
    T[1] = lerp(0, -0.5, e);
    T[2] = lerp(floor + 0.12, 1.8, e);
    T[3] = -0.8;
  } else if (u < PH.swing[1]) {
    const e = smooth(seg(u, PH.swing));
    T[0] = lerp(nx - 0.15, dx, e);
    T[1] = lerp(-0.5, PILE_Z, e);
    T[2] = lerp(1.8, 2.0, e);
    T[3] = -0.8;
  } else if (u < PH.dump[1]) {
    const e = smooth(seg(u, PH.dump));
    T[0] = dx;
    T[1] = PILE_Z;
    T[2] = 2.0 + 0.1 * Math.sin(Math.PI * e);
    T[3] = lerp(-0.8, 0.55, e);
  } else {
    const e = smooth(seg(u, PH.back));
    T[0] = lerp(dx, nx + 0.05, e);
    T[1] = lerp(PILE_Z, 0, e);
    // clear the ridge and the lip first, then come down on the next cut
    T[2] = lerp(2.0, 0.05, smooth(clamp01((e - 0.3) / 0.7)));
    T[3] = lerp(0.55, 0, e);
  }
}

// how far the trench has been cut, metres from X_T0, by cycle k at u
function cutLen(k: number, u: number) {
  if (k >= CYCLES) return CYCLES * B;
  return k * B + B * smooth(seg(u, PH.drag));
}

// the time inside the beat, as the cycle and how far through it
function cycleAt(p: number, out: Pose) {
  const t = Math.max(0, (p - CYC0) / CP);
  if (t >= CYCLES) {
    out.k = CYCLES;
    out.u = 0;
  } else {
    out.k = Math.floor(t);
    out.u = t - out.k;
  }
}

// The machine steps at the end of each cycle, the cut of the next begins B ahead.
function machineX(k: number, u: number) {
  if (k >= CYCLES) return -A + CYCLES * B;
  return -A + k * B + B * smooth(seg(u, PH.step));
}

const clampTo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The whole pose at p. Nothing is allocated.
export function solve(p: number, out: Pose): Pose {
  cycleAt(p, out);
  const { k, u } = out;
  out.xm = machineX(k, u);
  out.xf = X_T0 + cutLen(k, u);
  out.seam = out.xf + 0.5;
  for (let i = 0; i < CYCLES; i++) out.dump[i] = k > i ? 1 : k === i ? smooth(seg(u, [0.62, 0.82])) : 0;
  out.carry = k >= CYCLES ? 0 : smooth(seg(u, [0.12, 0.27])) * (1 - smooth(seg(u, [0.62, 0.7])));
  // the cycle k at CYCLES is the held end, its tip is the cut start of a cycle that does not run
  tipAt(k, u);
  out.tip[0] = T[0];
  out.tip[1] = T[1];
  out.tip[2] = T[2];
  const th = T[3];

  // the house turns to the tip, and the arm plane is offset by ARM_OFF from the swing axis
  const dx = T[0] - out.xm;
  const dz = T[1] - MZ;
  const r = Math.hypot(dx, dz);
  const al = Math.atan2(dz, dx);
  out.psi = al - Math.asin(clampTo(ARM_OFF / r, -1, 1));
  const fx = Math.sqrt(Math.max(0.01, r * r - ARM_OFF * ARM_OFF)) - PIV[0];
  const fy = T[2] - (HOUSE_Y + PIV[1]);

  // the pin W, then the elbow by two circles, boom length L1 round the foot and stick length L2 round W
  const c = Math.cos(th);
  const s = Math.sin(th);
  let wx = fx - (TIP0[0] * c - TIP0[1] * s);
  let wy = fy - (TIP0[0] * s + TIP0[1] * c);
  let d = Math.hypot(wx, wy);
  const lo = Math.abs(L1 - L2) + 0.05;
  const hi = L1 + L2 - 0.05;
  if (d > hi || d < lo) {
    const f = clampTo(d, lo, hi) / d;
    wx *= f;
    wy *= f;
    d = Math.hypot(wx, wy);
  }
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ex = (a * wx - h * wy) / d;
  const ey = (a * wy + h * wx) / d;
  out.boom = Math.atan2(ey, ex) - Math.atan2(E0[1], E0[0]);
  out.stick = Math.atan2(wy - ey, wx - ex);
  out.bucket = th;
  out.ex = ex;
  out.ey = ey;
  out.wx = wx;
  out.wy = wy;
  out.fw = fx;
  return out;
}

// ---- the camera. It tracks beside the machine on a line that moves with the average of its steps, so
// the shot is smooth where the machine steps, and pushes in a little over the beat.
export const CAM = { az: 44, el: 21, fov: 20, dist0: 36, dist1: 34 };

export type CamPose = { px: number; py: number; pz: number; tx: number; ty: number; tz: number };
export function makeCam(): CamPose {
  return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };
}

// the machine's average advance, 0 to CYCLES * B, eased a little at both ends
function advance(p: number) {
  const t = clamp01((p - CYC0) / (P1 - CYC0));
  return CYCLES * B * (0.65 * t + 0.35 * smooth(t));
}

export function camAt(p: number, out: CamPose): CamPose {
  const az = (CAM.az * Math.PI) / 180;
  const el = (CAM.el * Math.PI) / 180;
  const push = smooth(clamp01((p - P0) / (P1 - P0)));
  const dist = lerp(CAM.dist0, CAM.dist1, push);
  out.tx = -A + advance(p) + 1.0;
  out.ty = 0.9;
  out.tz = -1.6;
  out.px = out.tx - dist * Math.cos(az) * Math.cos(el);
  out.py = out.ty + dist * Math.sin(el);
  out.pz = out.tz + dist * Math.sin(az) * Math.cos(el);
  return out;
}

// the camera's horizontal direction and right vector, for the lights
export function camDirs() {
  const az = (CAM.az * Math.PI) / 180;
  const c: V3 = [-Math.cos(az), 0, Math.sin(az)];
  const r: V3 = [Math.sin(az), 0, Math.cos(az)];
  return { c, r };
}
