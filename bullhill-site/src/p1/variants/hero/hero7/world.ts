// Hero 7, the numbers behind the dig. No three.js import, so the machine, the ground, the spoil and
// the camera all read one source, and a frame at ?p= is the same frame every time. Units are metres.
//
// The route runs along +x, away from the camera. The machine stands on the route line at z 0 and
// faces back down it, towards -x and the camera. It digs the way a real excavator trenches, the trench
// opens in front of it and the machine reverses along the route while it works, so the trench grows
// away from the camera and the machine always stands on ground it has not touched. Step 2, Dig, runs
// p 0.15 to 0.45 as five bucket cycles,
//   plunge, drag, lift, swing, dump, swing back
// and nothing here is a step function. The machine creeps at a steady pace, every channel of the arm
// is an eased curve and the cycles overlap, so the machine, the arm, the trench front, the seam, the
// spoil and the camera are all smooth functions of p alone.
//
// Local frame of the machine, f is forward of the swing axis, l is to its right, y is up. The machine
// faces -x, so world x is xm - f and world z is -l.

import { clamp01, smooth, type V3 } from '../hero6/geometry';

export type { V3 };

// ---- the route
export const X_T0 = 0; // where the trench begins, the end nearest the camera
export const X_END = 34; // the end of the drawn route
export const D = 1.25; // trench depth
export const HALF_W = 0.8; // half the trench width at the floor
export const SHOULDER = 0.25; // how far each lip rounds off
export const ROAD_Z = 4.2; // the kerb, a wide verge, the road runs on towards the camera
export const ROAD_W = 4.6;

// ---- the machine
export const MZ = 0; // its centre line, z
export const HOUSE_Y = 0.95; // top of the tracks
export const PIV: V3 = [0.95, 1.0, 0.35]; // the boom foot in the house, forward, up, to the right
export const ARM_OFF = PIV[2];
export const SEAM_BEHIND = 3.1; // the seam rides this far behind the swing axis, so the tracks stand on render

// the arm in its own plane, x forward and y up, origin at the boom foot. The boom is a gooseneck, E is
// where the stick hangs from it, the stick runs to the bucket's pin W, the tip is on the bucket.
export const E0: [number, number] = [2.68, 2.64];
export const L1 = Math.hypot(E0[0], E0[1]);
export const L2 = 2.37;
// the bucket's cutting edge from its pin at theta 0. The mouth faces the machine, so the tip is on the
// machine side of the pin and curling swings it in and up.
export const TIP0: [number, number] = [-0.5, -1.2];

// ---- the beat
export const P0 = 0.15; // the beat begins, the machine waits until the first cycle
export const CYC0 = 0.16;
export const P1 = 0.45; // and holds its last frame
export const CYCLES = 5;
export const F_FAR = 4.6; // how far ahead of the swing axis a bite begins
export const S_TOTAL = 10.4; // how far the machine reverses across the beat
const RUN_IN = 1.4; // the first bite begins this far in from the start of the trench, so the bucket comes down inside it
export const XM0 = X_T0 + RUN_IN + F_FAR; // where the machine waits
export const DUMP_F = 3.6; // the dump point, forward of the swing axis
export const DUMP_L = 2.6; // and to its right, which is the far side of the trench
export const PILE_Z = -DUMP_L; // the spoil ridge, world z
const LEAD = 0.25; // how far inside the open trench the bucket comes down
const Y_ENTRY = 0.6; // the bucket hovers this high over the cut before it plunges
const Y_CARRY = 2.0;
const TH_DIG = 0.12; // the bucket's attitude going in
const TH_CURL = -0.8; // and curled full
const TH_DUMP = 0.55; // and tipped out
const FLOOR = -D + 0.03;

// phases inside one cycle, as shares of it. Neighbouring phases overlap on purpose, so the arm never
// comes to rest at a junction.
const PH = { plunge: [0, 0.09], drag: [0.09, 0.31], lift: [0.3, 0.5], swing: [0.34, 0.58], dump: [0.6, 0.77], back: [0.76, 0.97] } as const;
const U_DUMP = 0.68; // the moment the load leaves, for where the spoil lands
const seg = (u: number, [a, b]: readonly [number, number]) => clamp01((u - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clampTo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---- the machine's way along the route. A steady speed with a smooth ramp at each end, so it starts and
// stops without a jerk, the integral of a speed that is smoothstep up, flat, smoothstep down.
function ease(t: number, r: number) {
  const v = 1 / (1 - r);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < r) {
    const x = t / r;
    return v * r * (x * x * x - (x * x * x * x) / 2);
  }
  if (t > 1 - r) {
    const y = (1 - t) / r;
    return 1 - v * r * (y * y * y - (y * y * y * y) / 2);
  }
  return v * (t - r / 2);
}
const RAMP = 0.12;
const RAMP_CAM = 0.34;

// the machine's x at a time inside the beat, t 0 to 1
const xmAt = (t: number) => XM0 + S_TOTAL * ease(t, RAMP);

// the bites, fixed by where the machine stands at the start of each cycle
const XMK: number[] = [];
const XK: number[] = [];
for (let k = 0; k <= CYCLES; k++) {
  XMK.push(xmAt(k / CYCLES));
  XK.push(XMK[k] - F_FAR);
}
export const BITE = (k: number) => XK[k + 1] - XK[k];
export const DUMPX: number[] = [];
for (let k = 0; k < CYCLES; k++) DUMPX.push(xmAt((k + U_DUMP) / CYCLES) - DUMP_F);
export const X_CUT = XK[CYCLES]; // where the trench ends when the beat is done

// how tall a mound is when its dump has got q of the way, shared by the ground and the points so the
// grains always lie on the heap
export const heapAmp = (q: number) => smooth(clamp01((q - 0.2) / 0.8));

export type Pose = {
  k: number; // the cycle, 0 to CYCLES
  u: number; // how far through it, 0 to 1
  xm: number; // the machine
  xf: number; // the trench front
  seam: number; // where the plan turns into the render
  tip: V3; // the cutting edge, world
  psi: number; // house yaw, radians, 0 along its facing, positive to its right
  boom: number; // boom rotation about its foot
  stick: number; // stick, absolute angle in the arm plane
  bucket: number; // bucket, absolute angle in the arm plane
  dump: number[]; // how far each cycle's dump has got, 0 to 1
  carry: number; // how full the bucket is, 0 to 1
  ex: number; // where E and W sit in the arm plane, for the rods
  ey: number;
  wx: number;
  wy: number;
};

export function makePose(): Pose {
  return { k: 0, u: 0, xm: XM0, xf: X_T0, seam: XM0 + SEAM_BEHIND, tip: [0, 0, 0], psi: 0, boom: 0, stick: 0, bucket: 0, dump: new Array(CYCLES).fill(0), carry: 0, ex: 0, ey: 0, wx: 0, wy: 0 };
}

// the tip, local, f l y and the bucket's angle, into T
const T = [0, 0, 0, 0];
function tipAt(k: number, u: number, xm: number) {
  const kk = Math.min(k, CYCLES - 1);
  const xk = XK[kk];
  const bk = XK[kk + 1] - xk;
  // the cycle at its very end is the next one's start, so the held end pose reads the same
  const sd = smooth(seg(u, PH.drag));
  const sl = smooth(seg(u, PH.lift));
  const ss = smooth(seg(u, PH.swing));
  const sp = smooth(seg(u, PH.dump));
  const sb = smooth(seg(u, PH.back));

  // forward. In the dig the tip is a fixed place on the ground, so f follows the creeping machine.
  const tipX = xk - LEAD * (1 - sd) + bk * sd;
  const fDig = xm - tipX;
  const fEnd = xmAt((kk + PH.drag[1]) / CYCLES) - (xk + bk);
  const fNext = xm - (xk + bk - LEAD);
  const fCarry = lerp(fEnd, DUMP_F, smooth(seg(u, [0.31, 0.56])));
  T[0] = u < PH.drag[1] ? fDig : u < PH.back[0] ? fCarry : lerp(DUMP_F, fNext, sb);

  // across, out to the spoil and back
  T[1] = DUMP_L * (ss - sb);

  // up. Down into the cut, along the floor, up with the load, over the heap, then down to the next cut
  const floorY = FLOOR + 0.12 * sd;
  if (u < PH.drag[0]) T[2] = lerp(Y_ENTRY, FLOOR, smooth(seg(u, PH.plunge)));
  else if (u < PH.lift[0]) T[2] = floorY;
  else if (u < PH.back[0]) T[2] = lerp(floorY, Y_CARRY, sl) + 0.1 * Math.sin(Math.PI * sp);
  else T[2] = lerp(Y_CARRY, Y_ENTRY, sb);

  // the bucket, curled in the drag, tipped out over the heap, and back to its digging attitude
  if (u < PH.drag[0]) T[3] = TH_DIG;
  else if (u < PH.dump[0]) T[3] = lerp(TH_DIG, TH_CURL, sd);
  else if (u < PH.back[0]) T[3] = lerp(TH_CURL, TH_DUMP, sp);
  else T[3] = lerp(TH_DUMP, TH_DIG, sb);
}

// the cycle and how far through it
function cycleAt(p: number, out: Pose) {
  const t = clamp01((p - CYC0) / (P1 - CYC0)) * CYCLES;
  if (t >= CYCLES) {
    out.k = CYCLES;
    out.u = 0;
  } else {
    out.k = Math.floor(t);
    out.u = t - out.k;
  }
  return t / CYCLES;
}

// The whole pose at p. Nothing is allocated.
export function solve(p: number, out: Pose): Pose {
  const tc = cycleAt(p, out);
  const { k, u } = out;
  out.xm = xmAt(tc);
  out.seam = out.xm + SEAM_BEHIND;
  // the trench front, the cut so far
  // the first plunge opens the start of the trench under the bucket, the rest of the front is the drag
  if (k >= CYCLES) out.xf = X_CUT;
  else out.xf = (k === 0 ? lerp(X_T0, XK[0], smooth(seg(u, PH.plunge))) : XK[k]) + BITE(k) * smooth(seg(u, PH.drag));
  for (let i = 0; i < CYCLES; i++) out.dump[i] = k > i ? 1 : k === i ? smooth(seg(u, [0.62, 0.8])) : 0;
  out.carry = k >= CYCLES ? 0 : smooth(seg(u, [0.14, 0.3])) * (1 - smooth(seg(u, [0.64, 0.74])));

  // the held end of the beat is the start of a cycle that does not run, with the machine where it stopped
  if (k >= CYCLES) {
    const xk = XK[CYCLES];
    T[0] = out.xm - (xk - LEAD);
    T[1] = 0;
    T[2] = Y_ENTRY;
    T[3] = TH_DIG;
  } else {
    tipAt(k, u, out.xm);
  }
  const f = T[0];
  const l = T[1];
  out.tip[0] = out.xm - f;
  out.tip[1] = MZ - l;
  out.tip[2] = T[2];
  const th = T[3];

  // the house turns to the tip, and the arm plane is offset by ARM_OFF from the swing axis
  const r = Math.hypot(f, l);
  out.psi = Math.atan2(l, f) - Math.asin(clampTo(ARM_OFF / r, -1, 1));
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
    const g = clampTo(d, lo, hi) / d;
    wx *= g;
    wy *= g;
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
  return out;
}

// ---- the camera. It travels with the machine along the route on a dolly that eases in and out, lower
// and closer than hero 6's, three quarter, and pushes in a little over the beat. The machine faces the
// camera's side, the route runs away to the upper right and the plan fills the upper part of the frame.
export const CAM = { az: 80, el: 22, fov: 27, dist0: 29, dist1: 26, ahead: -0.8, ty: 1.15, tz: -0.3, follow: 0.82 };

export type CamPose = { px: number; py: number; pz: number; tx: number; ty: number; tz: number };
export function makeCam(): CamPose {
  return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };
}

export function camAt(p: number, out: CamPose): CamPose {
  const az = (CAM.az * Math.PI) / 180;
  const el = (CAM.el * Math.PI) / 180;
  const t = clamp01((p - P0) / (P1 - P0));
  const push = smooth(t);
  const dist = lerp(CAM.dist0, CAM.dist1, push);
  // the dolly follows the machine with its own, longer ease
  // it follows a little slower than the machine reverses, so the machine and the seam drift across the frame
  out.tx = XM0 + CAM.follow * S_TOTAL * ease(t, RAMP_CAM) + CAM.ahead;
  out.ty = CAM.ty;
  out.tz = CAM.tz;
  out.px = out.tx - dist * Math.cos(az) * Math.cos(el);
  out.py = out.ty + dist * Math.sin(el);
  out.pz = out.tz + dist * Math.sin(az) * Math.cos(el);
  return out;
}

// the key's height over the machine, the lights and the ground's shading read it
export const KEY_Y = 5.6;

// the camera's horizontal direction and right vector, for the lights
export function camDirs() {
  const az = (CAM.az * Math.PI) / 180;
  const c: V3 = [-Math.cos(az), 0, Math.sin(az)];
  const r: V3 = [Math.sin(az), 0, Math.cos(az)];
  return { c, r };
}
