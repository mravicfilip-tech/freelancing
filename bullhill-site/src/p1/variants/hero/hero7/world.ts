// Hero 7, the numbers behind the whole story. No three.js import, so the machine, the ground, the spoil,
// the ducts, the house and the camera all read one source, and a frame at ?p= is the same frame every
// time. Units are metres.
//
// The route runs along +x. The house stands at the -x end, the street end is at +x. The machine stands on
// the route line at z 0 and faces back down it, towards -x. It digs the way a real excavator trenches,
// the trench opens in front of it and the machine reverses along the route while it works, so the
// trench grows away from the house and the machine always stands on ground it has not touched. The five
// steps are one continuous shot,
//   1 Mark the route        p 0 to 0.15     the route is drawn, the machine idles
//   2 Dig                   p 0.15 to 0.45  five bucket cycles, plunge, drag, lift, swing, dump, back
//   3 Lay ducts             p 0.45 to 0.6   the machine parks, sand pours, the ducts unroll
//   4 Fibre blown in        p 0.6 to 0.75   a lit tip runs the orange duct to the house, the strands come out
//   5 Backfill and restore  p 0.75 to 1     the machine draws the heap back in, the surface closes, a cut away
// and nothing here is a step function. The machine creeps at a steady pace, every channel of the arm
// is an eased curve and the cycles overlap, so every part of the scene is a smooth function of p alone.
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

// ---- the other places of the story
// the house at the far end of the route, the chamber at its wall, the stakes along the route
export const HOUSE = { x0: -7.4, x1: -2.0, z0: -2.3, z1: 2.3, h: 2.6, ridge: 1.5 };
export const PIT = { x0: -1.5, x1: 0.15, hw: 0.8 };
export const ROUTE_X0 = 12.6; // the street end of the route
export const PINS = [11.4, 8.9, 6.4, 3.9, 1.4];
export const PIN_Z = 1.75;
// the ducts, three on the sand bed and two nested above, the orange one carries the fibre
export const SAND = 0.25; // the sand bed's depth
export const DUCT_R = 0.085;
const DUCT_S = 0.19;
const DUCT_BOT = -D + SAND + DUCT_R;
const DUCT_TOP = DUCT_BOT + DUCT_S * 0.866;
export type DuctSpec = { y: number; z: number; orange: boolean };
export const DUCTS: DuctSpec[] = [
  { y: DUCT_BOT, z: -DUCT_S, orange: false },
  { y: DUCT_BOT, z: 0, orange: false },
  { y: DUCT_BOT, z: DUCT_S, orange: false },
  { y: DUCT_TOP, z: -DUCT_S / 2, orange: false },
  { y: DUCT_TOP, z: DUCT_S / 2, orange: true },
];
export const DUCT_X0 = X_CUT - 0.4; // where the ducts come in from the street
export const DUCT_X1 = PIT.x0 + 0.7; // and where they end, open, in the chamber
export const ORANGE = DUCTS[4];
// the cut away, at the street end, the ground is lowered and the face it leaves shows the courses
export const NOTCH = { x0: 10.0, x1: 12.8, hz: 2.0, depth: 1.6 };

// ---- the backfill, the dig turned round. The machine drives forward, draws a mound in and dumps it in
// the trench, five cycles, and the trench fills behind the bucket from the street end to the house.
export const BF0 = 0.76;
export const BF1 = 0.91;
export const BF_CYCLES = 5;
const XM_END = xmAt(1); // where the dig leaves the machine
const xmBack = (t: number) => XM_END - (XM_END - XM0) * ease(t, RAMP);
const BF_PH = { plunge: [0, 0.1], drag: [0.1, 0.32], lift: [0.3, 0.5], swing: [0.36, 0.6], dump: [0.6, 0.78], back: [0.78, 0.97] } as const;
const F_PICK = 3.6; // the mound is picked where the dig dumped it
const L_PICK = DUMP_L;
const Y_PICK = 0.3;
const Y_HOV = 1.5;
const Y_OVER = 1.7;
const TH_START = 0.3;

// the story's windows in p
export const WIN = {
  park: [0.455, 0.5],
  sand: [0.468, 0.55],
  duct: [0.525, 0.6],
  pit: [0.63, 0.67],
  house: [0.64, 0.7],
  tip: [0.605, 0.68],
  strand: [0.67, 0.725],
  pre: [0.735, 0.76],
  post: [0.91, 0.95],
  restore: [0.9, 0.965],
  notch: [0.925, 0.985],
  windows: [0.94, 0.99],
} as const;
const win = (p: number, w: readonly [number, number]) => smooth(clamp01((p - w[0]) / (w[1] - w[0])));

export type Pose = {
  k: number; // the cycle, 0 to CYCLES
  u: number; // how far through it, 0 to 1
  xm: number; // the machine
  xf: number; // the trench front, the cut so far
  seam: number; // where the plan turns into the render
  tip: V3; // the cutting edge, world
  psi: number; // house yaw, radians, 0 along its facing, positive to its right
  boom: number; // boom rotation about its foot
  stick: number; // stick, absolute angle in the arm plane
  bucket: number; // bucket, absolute angle in the arm plane
  dump: number[]; // how far each cycle's dump has got, 0 to 1
  heap: number[]; // how tall each mound stands, 0 to 1, grown by its dump and drawn down by the backfill
  carry: number; // how full the bucket is, 0 to 1
  fall: number; // the load leaving the bucket over the trench, 0 to 1
  ex: number; // where E and W sit in the arm plane, for the rods
  ey: number;
  wx: number;
  wy: number;
  sandX: number; // the sand bed is poured at and beyond this x, towards the street
  sandOn: number; // the pour is in the air
  ductX: number; // the ducts run from the street to this x
  tipX: number; // the lit tip
  tipOn: number; // how bright the tip is
  strand: number; // how far the strands have come out
  houseX: number; // the house is rendered at and beyond this x, towards the street end of its own width
  pit: number; // the chamber at the house is open, 0 to 1
  windows: number; // the windows are lit, 0 to 1
  fillX: number; // the trench is filled at and beyond this x
  restore: number; // the surface is finished, 0 to 1
  notch: number; // the cut away is open, 0 to 1
};

export function makePose(): Pose {
  return {
    k: 0, u: 0, xm: XM0, xf: X_T0, seam: XM0 + SEAM_BEHIND, tip: [0, 0, 0], psi: 0, boom: 0, stick: 0, bucket: 0,
    dump: new Array(CYCLES).fill(0), heap: new Array(CYCLES).fill(0), carry: 0, fall: 0, ex: 0, ey: 0, wx: 0, wy: 0,
    sandX: 14, sandOn: 0, ductX: DUCT_X0, tipX: DUCT_X0 + 1, tipOn: 0, strand: 0, houseX: HOUSE.x1 + 0.1, pit: 0, windows: 0, fillX: X_CUT + 0.45, restore: 0, notch: 0,
  };
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

// One backfill cycle. The bucket comes down on the mound, drags it in, lifts, swings over the trench,
// tips it out and swings back. The dump is over the middle of the bite the cycle fills.
function backAt(k: number, u: number) {
  const j = BF_CYCLES - 1 - k;
  const xt = (XK[j] + XK[j + 1]) / 2;
  const fD = clampTo(xmBack((k + 0.7) / BF_CYCLES) - xt, 3.3, 5);
  const spl = smooth(seg(u, BF_PH.plunge));
  const sd = smooth(seg(u, BF_PH.drag));
  const sl = smooth(seg(u, BF_PH.lift));
  const ss = smooth(seg(u, BF_PH.swing));
  const sp = smooth(seg(u, BF_PH.dump));
  const sb = smooth(seg(u, BF_PH.back));
  T[0] = u < BF_PH.drag[1] ? lerp(F_PICK, F_PICK - 0.9, sd) : u < BF_PH.back[0] ? lerp(F_PICK - 0.9, fD, smooth(seg(u, [0.34, 0.6]))) : lerp(fD, F_PICK, sb);
  T[1] = L_PICK * (1 - ss + sb);
  if (u < BF_PH.drag[0]) T[2] = lerp(Y_HOV, Y_PICK, spl);
  else if (u < BF_PH.lift[0]) T[2] = Y_PICK + 0.1 * sd;
  else if (u < BF_PH.back[0]) T[2] = lerp(Y_PICK + 0.1, Y_OVER, sl) - 0.2 * Math.sin(Math.PI * sp);
  else T[2] = lerp(Y_OVER, Y_HOV, sb);
  if (u < BF_PH.drag[0]) T[3] = lerp(TH_START, TH_DIG, spl);
  else if (u < BF_PH.dump[0]) T[3] = lerp(TH_DIG, TH_CURL, sd);
  else if (u < BF_PH.back[0]) T[3] = lerp(TH_CURL, TH_DUMP, sp);
  else T[3] = lerp(TH_DUMP, TH_START, sb);
}

// the arm folded for travel, the bucket tucked in, and the two states it comes from and goes back to
const PARK = [2.8, 0, 1.5, -0.7];
const START = [F_PICK, L_PICK, Y_HOV, TH_START];
const blend = (a: number[], b: number[], t: number) => {
  for (let i = 0; i < 4; i++) T[i] = lerp(a[i], b[i], t);
};

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

const HELD = [XM_END - (XK[CYCLES] - LEAD), 0, Y_ENTRY, TH_DIG];

// The whole pose at p. Nothing is allocated.
export function solve(p: number, out: Pose): Pose {
  const tc = cycleAt(p, out);
  const { k, u } = out;
  const digging = p <= P1;
  let bk = -1;
  let bu = 0;
  if (p >= BF0 && p < BF1) {
    const t = ((p - BF0) / (BF1 - BF0)) * BF_CYCLES;
    bk = Math.min(BF_CYCLES - 1, Math.floor(t));
    bu = t - bk;
  }
  // the machine, reversing in the dig, still while it lays and blows, driving forward in the backfill
  if (digging) out.xm = xmAt(tc);
  else if (p < BF0) out.xm = XM_END;
  else if (p < BF1) out.xm = xmBack((p - BF0) / (BF1 - BF0));
  else out.xm = XM0;
  // the seam rides the machine in the dig and holds where it stopped, so the render keeps the ground
  out.seam = (digging ? out.xm : XM_END) + SEAM_BEHIND;

  // the trench front, the cut so far. The first plunge opens the start of the trench under the bucket.
  if (k >= CYCLES) out.xf = X_CUT;
  else out.xf = (k === 0 ? lerp(X_T0, XK[0], smooth(seg(u, PH.plunge))) : XK[k]) + BITE(k) * smooth(seg(u, PH.drag));
  for (let i = 0; i < CYCLES; i++) out.dump[i] = k > i ? 1 : k === i ? smooth(seg(u, [0.62, 0.8])) : 0;
  out.carry = k >= CYCLES ? 0 : smooth(seg(u, [0.14, 0.3])) * (1 - smooth(seg(u, [0.64, 0.74])));
  out.fall = 0;

  // the backfill draws each mound down and fills a bite
  let fillX = X_CUT + 0.45;
  for (let i = 0; i < CYCLES; i++) {
    let drawn = 0;
    if (p >= BF1) drawn = 1;
    else if (bk >= 0) {
      const kb = BF_CYCLES - 1 - i;
      drawn = bk > kb ? 1 : bk === kb ? smooth(seg(bu, [0.1, 0.36])) : 0;
    }
    out.heap[i] = heapAmp(out.dump[i]) * (1 - drawn);
  }
  if (p >= BF1) fillX = X_T0 - 0.4;
  else if (bk >= 0) {
    const j = BF_CYCLES - 1 - bk;
    const a = bk === 0 ? X_CUT + 0.45 : XK[j + 1];
    const b = j === 0 ? X_T0 - 0.4 : XK[j];
    fillX = lerp(a, b, smooth(seg(bu, [0.62, 0.88])));
    out.carry = smooth(seg(bu, [0.14, 0.32])) * (1 - smooth(seg(bu, [0.84, 0.88])));
    out.fall = smooth(seg(bu, [0.62, 0.84]));
  }
  out.fillX = fillX;

  // the arm
  if (digging) {
    // the held end of the dig is the start of a cycle that does not run, with the machine where it stopped
    if (k >= CYCLES) {
      T[0] = out.xm - (XK[CYCLES] - LEAD);
      T[1] = 0;
      T[2] = Y_ENTRY;
      T[3] = TH_DIG;
    } else {
      tipAt(k, u, out.xm);
    }
  } else if (p < BF0) {
    if (p < WIN.pre[0]) blend(HELD, PARK, win(p, WIN.park));
    else blend(PARK, START, win(p, WIN.pre));
  } else if (p < BF1) {
    backAt(bk, bu);
  } else {
    blend(START, PARK, win(p, WIN.post));
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

  // ---- the rest of the story
  const sw = win(p, WIN.sand);
  out.sandX = p < WIN.sand[0] ? 14 : lerp(X_CUT + 0.6, X_T0 - 1.4, sw);
  out.sandOn = p > WIN.sand[0] - 0.004 && p < WIN.sand[1] + 0.05 ? 1 : 0;
  out.ductX = lerp(DUCT_X0, DUCT_X1, win(p, WIN.duct));
  const tw = win(p, WIN.tip);
  out.tipX = lerp(DUCT_X0 + 0.2, DUCT_X1, tw);
  out.tipOn = smooth(clamp01((p - WIN.tip[0] + 0.004) / 0.008)) * (1 - win(p, [WIN.strand[1], WIN.strand[1] + 0.04]) * 0.55);
  out.strand = win(p, WIN.strand);
  out.houseX = lerp(HOUSE.x1 + 0.1, HOUSE.x0 - 0.2, win(p, WIN.house));
  out.pit = win(p, WIN.pit);
  out.windows = win(p, WIN.windows);
  out.restore = win(p, WIN.restore);
  out.notch = win(p, WIN.notch);
  return out;
}

// ---- the camera. One continuous shot. It begins wide enough to hold the house and the whole route,
// settles into the dig's framing, tracks along with the machine and pushes in a little during the dig,
// rises to look into the trench for the ducts, pans along the route to the house, comes back along the
// route and pulls away, and turns to take the whole restored route from the street end with the cut away
// in front. Between the keys every channel is a cubic through them with the speed carried across, so
// the dolly never stops at a key and never jumps.
export const CAM = { az: 80, el: 22, fov: 27, dist0: 29, dist1: 26, ahead: -0.8, ty: 1.15, tz: -0.3, follow: 0.82 };

export type CamPose = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number };
export function makeCam(): CamPose {
  return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: CAM.fov };
}
export type View = 'wide' | 'tall';

// p, then tx ty tz, azimuth and elevation in degrees, distance
type Key = [number, number, number, number, number, number, number];
const DIG0: Key = [P0, XM0 + CAM.ahead, CAM.ty, CAM.tz, CAM.az, CAM.el, CAM.dist0];
const DIG1: Key = [P1, XM0 + CAM.follow * S_TOTAL + CAM.ahead, CAM.ty, CAM.tz, CAM.az, CAM.el, CAM.dist1];
const KEYS_A: Key[] = [
  [0, 3.4, 1.0, -0.3, 82, 24, 37],
  DIG0,
];
const KEYS_B: Key[] = [
  DIG1,
  [0.53, 9.6, 0.1, -0.2, 78, 36, 24],
  [0.6, 8.0, 0, -0.1, 78, 41, 22.5],
  [0.655, 4.0, 0.1, -0.1, 80, 40, 21.5],
  [0.705, 0.2, 0.5, -0.2, 84, 36, 23],
  [0.785, 7.5, 0.5, -0.3, 92, 30, 30],
  [0.9, 6.0, 0.4, -0.3, 100, 29, 31],
  [1, 6.2, 1.0, -0.4, 122, 28, 27],
];
// the phone's framing, a tall box with the machine and the route big in the middle of it, at the end of
// each step. Between the keys the same cubic.
const KEYS_TALL: Key[] = [
  [0, 5.0, 0.8, -0.4, 52, 21, 24],
  [0.15, 5.0, 0.8, -0.4, 52, 21, 24],
  [0.45, 11.5, 0.8, -0.4, 52, 21, 22],
  [0.6, 9.2, 0, 0.4, 62, 40, 25],
  [0.75, 2.5, 0.3, 0, 66, 34, 24],
  [1, 2.6, 0.2, -0.5, 112, 30, 27],
];

// tangents, zero at the two ends of a run and the slope across the neighbours between
function cubic(keys: Key[], p: number, out: number[], zeroEnds = true) {
  const n = keys.length;
  let i = 0;
  while (i < n - 2 && p > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const h = b[0] - a[0];
  const t = clamp01((p - a[0]) / h);
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  for (let c = 1; c < 7; c++) {
    out[c - 1] = h00 * a[c] + h10 * h * slope(keys, i, c, zeroEnds) + h01 * b[c] + h11 * h * slope(keys, i + 1, c, zeroEnds);
  }
}
// The speed at key i of channel c. Zero at the two ends and wherever the channel turns round, the harmonic
// mean of the slopes either side elsewhere, so the curve never swings past a key it is heading for.
function slope(keys: Key[], i: number, c: number, zeroEnds: boolean) {
  const n = keys.length;
  if (i === 0 || i === n - 1) {
    if (zeroEnds) return 0;
    const j = i === 0 ? 0 : n - 2;
    return (keys[j + 1][c] - keys[j][c]) / (keys[j + 1][0] - keys[j][0]);
  }
  const s0 = (keys[i][c] - keys[i - 1][c]) / (keys[i][0] - keys[i - 1][0]);
  const s1 = (keys[i + 1][c] - keys[i][c]) / (keys[i + 1][0] - keys[i][0]);
  return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
}
const _c = [0, 0, 0, 0, 0, 0];
// how much further back the camera stands when the stage is narrower than the desktop's, so the same
// stretch of route is in frame on a tablet
const REF_ASPECT = 1.8;

export function camAt(p: number, out: CamPose, view: View = 'wide', aspect = REF_ASPECT): CamPose {
  if (view === 'tall') {
    cubic(KEYS_TALL, p, _c);
  } else if (p < P0) {
    cubic(KEYS_A, p, _c);
  } else if (p <= P1) {
    // the dig. The dolly follows the machine with its own, longer ease, a little slower than the machine
    // reverses, so the machine and the seam drift across the frame, and pushes in
    const t = clamp01((p - P0) / (P1 - P0));
    _c[0] = XM0 + CAM.follow * S_TOTAL * ease(t, RAMP_CAM) + CAM.ahead;
    _c[1] = CAM.ty;
    _c[2] = CAM.tz;
    _c[3] = CAM.az;
    _c[4] = CAM.el;
    _c[5] = lerp(CAM.dist0, CAM.dist1, smooth(t));
  } else {
    cubic(KEYS_B, p, _c);
  }
  const az = (_c[3] * Math.PI) / 180;
  const el = (_c[4] * Math.PI) / 180;
  const k = view === 'tall' ? 1 : Math.min(1.9, Math.max(1, REF_ASPECT / aspect));
  const dist = _c[5] * k;
  out.tx = _c[0];
  out.ty = _c[1];
  out.tz = _c[2];
  out.px = out.tx - dist * Math.cos(az) * Math.cos(el);
  out.py = out.ty + dist * Math.sin(el);
  out.pz = out.tz + dist * Math.sin(az) * Math.cos(el);
  out.fov = view === 'tall' ? 30 : CAM.fov;
  return out;
}

// the key's height over the machine, the lights and the ground's shading read it
export const KEY_Y = 5.6;
const LIGHT_AZ = 80;

// the horizontal direction from the scene to the light's side and its right vector, fixed, so the
// lighting does not change as the camera turns
export function camDirs() {
  const az = (LIGHT_AZ * Math.PI) / 180;
  const c: V3 = [-Math.cos(az), 0, Math.sin(az)];
  const r: V3 = [Math.sin(az), 0, Math.cos(az)];
  return { c, r };
}
