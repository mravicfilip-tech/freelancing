// The choreography of the Grad scene, as pure functions of the story time u (beat plus k, 0 to 14).
// Nothing here holds state, so any still clock draws the same frame the live clock does. Metres, x
// east, z south, yaw 0 faces +x and turns toward -z, like the rest of the miniature.
import { TRUCK } from './vehicles';
import { Track, clamp01, easeIn, easeOut, eio, inside, lerp, newPose, seg, smooth, type Pose } from './math';

// A reduced motion still holds the last beat of a service at rest. Where the story sweeps away to the
// next place in the last moments of a beat, the still keeps the frame just before the sweep.
const STILL_U: Record<number, number> = { 3: 3.7, 6: 6.55, 9: 9.93, 12: 12.6 };
export const uOf = (c: { beat: { current: number }; k: { current: number }; still?: boolean }) => {
  const u = c.beat.current + clamp01(c.k.current);
  return c.still && c.k.current >= 0.999 && STILL_U[c.beat.current] !== undefined ? STILL_U[c.beat.current] : u;
};

// beat indexes, U1 0, N 1 to 3, P 4 to 6, V 7 to 9, S 10 to 12, K1 13
export const B = { U1: 0, N1: 1, N2: 2, N3: 3, P1: 4, P2: 5, P3: 6, V1: 7, V2: 8, V3: 9, S1: 10, S2: 11, S3: 12, K1: 13 } as const;

/* ------------------------------------------------------------------ the sites */

export const DOCK = { x0: -10, x1: 16, z0: -6.0, z1: -3.4, h: 1.1 };
// pallets arrive from the dock edge
// the pile of pallets in front of the dock, a grid of 4 by 3 and a second layer on the first three
export const PILE = Array.from({ length: 12 }, (_, i) => {
  if (i < 9) return { x: -7.9 + (i % 4) * 1.55, z: -1.9 + Math.floor(i / 4) * 1.3, y: 0, h: 0.55 + ((i * 7) % 5) * 0.1 };
  const base = i - 9;
  return { x: -7.9 + base * 1.55, z: -1.9 + 0 * 1.3, y: 0.72 + 0.05, h: 0.5 + base * 0.08 };
});
// arrival order, the nine on the ground then the three stacked ones
export const PILE_CLEAR = [9, 10, 11, 8, 7, 6, 5, 4, 3, 2, 1, 0];

export const GATE_X = -1.6;
export const TRUCK_PARK = { x: 6.5, z: 5.6 };

/* ------------------------------------------------------------------ tracks */

// A, the customer's own forklift, drives in during U1 and stands facing the pile
export const A_IN = new Track([
  [-38, 5.2],
  [-28, 4.6],
  [-20, 2.6],
  [-15.6, -0.8],
  [-12.8, -2.4],
]);
export const A_PARK: Pose = { x: -12.8, y: 0, z: -2.4, yaw: 0, pitch: 0 };
A_IN.at(A_IN.len, A_PARK);
// and goes back to work in the hall during N3
export const A_OUT = new Track([
  [-12.8, -2.4],
  [-13.9, -4.6],
  [-14.5, -6.8],
  [-13.6, -10.4],
  [-13.2, -16],
  [-13.2, -25],
]);

// the delivery truck, in from the west along the road, through the gate and onto the dock yard
export const T_IN = new Track([
  [-36, 20.4],
  [-18, 20.4],
  [-7, 19.6],
  [-2.6, 16.4],
  [-1.5, 11.6],
  [-0.2, 8.2],
  [1.8, 6.3],
  [3.4, 5.6],
  [TRUCK_PARK.x, TRUCK_PARK.z],
]);
export const T_OUT = new Track([
  [TRUCK_PARK.x, TRUCK_PARK.z],
  [13.5, 5.6],
  [20, 6.3],
  [25, 9.4],
  [27.2, 14.4],
  [29.5, 18.6],
  [36, 20.4],
  [70, 20.4],
]);

// B, the rental forklift, rides in the truck and rolls down the ramp to the pile. y is the floor.
const FL = TRUCK.floor;
const RAMP_RUN = Math.sqrt(TRUCK.rampLen * TRUCK.rampLen - FL * FL);
const rearX = TRUCK_PARK.x + TRUCK.rear; // x of the floor's rear edge when parked
const footX = rearX - RAMP_RUN;
export const B_LOCAL = { x: -1.0, y: FL };
export const B_OFF = new Track([
  [TRUCK_PARK.x + B_LOCAL.x, TRUCK_PARK.z, FL],
  [rearX + 0.6, TRUCK_PARK.z, FL],
  [rearX, TRUCK_PARK.z, FL],
  [rearX - RAMP_RUN * 0.5, TRUCK_PARK.z, FL * 0.5],
  [footX, TRUCK_PARK.z, 0],
  [footX - 1.5, TRUCK_PARK.z - 0.2, 0],
  [footX - 2.9, TRUCK_PARK.z - 1.2, 0],
  [footX - 3.2, TRUCK_PARK.z - 2.8, 0],
  [footX - 3.1, TRUCK_PARK.z - 3.5, 0],
]);
export const B_HOME = B_OFF.at(B_OFF.len, newPose());

// C, the truck that is renewed, serviced and kept in work. The renewal line first.
export const LINE = { z: 5.4, xs: [-74, -68, -62, -56, -50, -44, -38], x0: -82, x1: -33 };
export const C_START_X = -91;
export const C_LINE_END = { x: -34.5, z: LINE.z };
export const C_OUT = new Track([
  [C_LINE_END.x, C_LINE_END.z],
  [-27, 5.2],
  [-20.6, 4.2],
  [-14.2, 3.0],
  [-8.4, 1.8],
]);
export const ZONES = { z: 1.5, xs: [-8.4, 0.6, 9.6, 18.6] };
export const C_ZONE: Pose = { x: -8.4, y: 0, z: 1.8, yaw: 0, pitch: 0 };
C_OUT.at(C_OUT.len, C_ZONE);
// into the hall and up to the stop in the front aisle
export const STOP = { x: -3.6, z: -14.4 };
export const C_S1 = new Track([
  [C_ZONE.x, C_ZONE.z],
  [-14.4, -1.8],
  [-14.7, -5.4],
  [-14.2, -8.6],
  [-11.8, -11.8],
  [-8, -13.6],
  [STOP.x, STOP.z],
]);
export const C_S3 = new Track([
  [STOP.x, STOP.z],
  [3, -14.5],
  [10, -14.6],
  [15.5, -14.8],
]);
export const C_PARK_END = { x: 15.5, z: -14.8 };

// the service van, from its bay at the depot to the hall
export const VAN_BAY: Pose = { x: -47.4, y: 0, z: -4.3, yaw: -Math.PI / 2, pitch: 0 };
export const VAN_ROUTE = new Track([
  [-47.4, -4.3],
  [-47.4, 2.6],
  [-45, 8.4],
  [-40, 13.6],
  [-36, 18],
  [-30, 20.4],
  [-12, 20.4],
  [-4, 19.4],
  [-0.6, 15],
  [0.4, 9.4],
  [-1, 3.8],
  [-6, 0.8],
  [-12, -1],
  [-14.6, -4.6],
  [-15.0, -8.0],
  [-15.3, -12.5],
  [-14.2, -16.4],
  [-11.6, -17.2],
]);
export const VAN_PARK = VAN_ROUTE.at(VAN_ROUTE.len, newPose());

/* ------------------------------------------------------------------ per actor state */

const tmp = newPose();

// Fraction of a clip or scroll beat, for readability
export const kOf = (u: number, beat: number) => clamp01(u - beat);
export const inBeat = (u: number, beat: number) => u >= beat && u < beat + 1;

// A
export function stateA(u: number, out: Pose) {
  let vis = true;
  let lift = 0.1;
  let roll = 0;
  if (u < 1) {
    const s = easeOut(u) * A_IN.len;
    A_IN.at(s, out);
    roll = s;
    lift = 0.1;
  } else if (u < 3.5) {
    Object.assign(out, A_PARK);
    roll = A_IN.len;
    // it tries to keep up, a fork lift now and then
    lift = 0.1 + 0.7 * smooth(Math.sin((u - 1) * 5) * 0.5 + 0.5) * smooth(seg(u, 1.05, 1.2)) * (1 - smooth(seg(u, 2.9, 3.0)));
  } else {
    const s = eio(seg(u, 3.5, 3.88)) * A_OUT.len;
    A_OUT.at(s, out);
    roll = A_IN.len + s;
  }
  return { vis, lift, roll };
}

// The truck
export const truckPhase = (u: number) => ({
  rampOpen: smooth(seg(u, 2.46, 2.58)) * (1 - smooth(seg(u, 3.58, 3.72))),
});
export function stateT(u: number, out: Pose) {
  if (u < 2 || u > 4.05) return { vis: false, roll: 0 };
  if (u < 2.5) {
    const s = easeOut(seg(u, 2.0, 2.5)) * T_IN.len;
    T_IN.at(s, out);
    return { vis: true, roll: s };
  }
  if (u < 3.72) {
    T_IN.at(T_IN.len, out);
    return { vis: true, roll: T_IN.len };
  }
  const s = easeIn(seg(u, 3.72, 4.02)) * T_OUT.len;
  T_OUT.at(s, out);
  return { vis: true, roll: T_IN.len + s };
}

// B, position along its own track, 0 inside the truck
export function sB(u: number) {
  if (u < 2.56) return 0;
  if (u < 3.0) return eio(seg(u, 2.56, 2.97)) * B_OFF.len;
  if (u < 3.46) return B_OFF.len;
  if (u < 3.62) return (1 - eio(seg(u, 3.46, 3.6))) * B_OFF.len;
  return 0;
}
export function stateB(u: number, truck: Pose, out: Pose) {
  const vis = u >= 2 && u <= 4.05;
  const s = sB(u);
  let lift = 0.1;
  let load = false;
  if (s <= 0.001) {
    inside(truck, B_LOCAL.x, B_LOCAL.y, 0, Math.PI, out);
  } else {
    B_OFF.at(s, out);
  }
  // working the pile, forks up and down with a pallet while the pile shrinks
  if (u >= 3.0 && u < 3.46) {
    const w = (u - 3.0) / 0.42;
    const ph = (w * 4) % 1;
    const up = Math.sin(ph * Math.PI);
    lift = 0.1 + up * 1.0;
    load = ph > 0.18 && ph < 0.84;
  }
  return { vis, lift, load, roll: s };
}

// How many of the pile are shown, with the arrival and clearing of each
export function pileItem(u: number, i: number) {
  const n1 = 3;
  let vis = 1;
  let hop = 0; // 0 on the ground, up to 1 mid hop from the dock
  if (u < 2) {
    const t0 = i < n1 ? 0.62 + i * 0.1 : 1 + ((i < 9 ? i : i - 0.5) - n1 + 0.2) / 9.6; // arrival time
    const f = (u - t0) / 0.07;
    if (f < 0) vis = 0;
    else if (f < 1) hop = 1 - f;
  } else if (u >= 3.0) {
    const j = PILE_CLEAR.indexOf(i);
    const t = (u - 3.0) / 0.42;
    const f = (t * 12 - j) / 1;
    if (f >= 1) vis = 0;
    else if (f > 0) {
      vis = 1 - smooth(f);
      hop = -smooth(f); // rises as it goes
    }
  }
  return { vis, hop };
}

// P line, the renewal progress and the fork's place on it
export const lineX = (k: number) => lerp(-80, C_LINE_END.x, k);
export function renewProgress(u: number) {
  if (u < 5) return 0;
  if (u >= 6) return 1;
  const k = u - 5;
  let r = 0;
  const kx = LINE.xs.map((x) => (x - -80) / (C_LINE_END.x - -80));
  for (const kk of kx) r += smooth((k - (kk - 0.045)) / 0.09) / 7;
  return r;
}
export function stateC(u: number, out: Pose) {
  let vis = true;
  let roll = 0;
  let lift = 0.1;
  let move = 0; // metres rolled
  if (u < 3.9) vis = false;
  if (u < 5) {
    // P1, rolls in from behind the panel
    const k = seg(u, 4, 5);
    const x = lerp(C_START_X, -80, easeOut(k * 0.96 + 0.04) * 1);
    Object.assign(out, { x, y: 0, z: LINE.z, yaw: 0, pitch: 0 });
    move = x - C_START_X;
  } else if (u < 6) {
    const k = u - 5;
    const x = lineX(k);
    Object.assign(out, { x, y: 0, z: LINE.z, yaw: 0, pitch: 0 });
    move = x - C_START_X;
  } else if (u < 6.5) {
    Object.assign(out, { x: C_LINE_END.x, y: 0, z: LINE.z, yaw: 0, pitch: 0 });
    move = C_LINE_END.x - C_START_X;
  } else if (u < 7.02) {
    const s = eio(seg(u, 6.5, 7.0)) * C_OUT.len;
    C_OUT.at(s, out);
    move = C_LINE_END.x - C_START_X + s;
  } else if (u < 10) {
    Object.assign(out, C_ZONE);
    move = C_LINE_END.x - C_START_X + C_OUT.len;
  } else if (u < 10.5) {
    const s = easeOut(seg(u, 10.0, 10.5)) * C_S1.len;
    C_S1.at(s, out);
    move = C_LINE_END.x - C_START_X + C_OUT.len + s;
  } else if (u < 12.66) {
    Object.assign(out, { x: STOP.x, y: 0, z: STOP.z, yaw: 0, pitch: 0 });
    C_S1.at(C_S1.len, out);
    move = C_LINE_END.x - C_START_X + C_OUT.len + C_S1.len;
  } else {
    const s = easeIn(seg(u, 12.7, 13.0)) * C_S3.len;
    C_S3.at(s, out);
    move = C_LINE_END.x - C_START_X + C_OUT.len + C_S1.len + s;
  }
  roll = move;
  // the pit stop lift raises it a little
  const pit = pitLift(u);
  out.y += pit;
  lift = 0.1 + 0.04 * Math.sin(u * 3) * (u >= 12 && u < 12.66 ? 1 : 0);
  return { vis, roll, lift };
}

// the short lift of the pit stop, 0 to 0.8 m
export const PIT_H = 0.8;
export function pitLift(u: number) {
  return PIT_H * smooth(seg(u, 11.78, 12.0)) * (1 - smooth(seg(u, 12.62, 12.7)));
}
// how far the pit rig has come out of the floor
export const pitRig = (u: number) => smooth(seg(u, 11.5, 11.8)) * (1 - smooth(seg(u, 12.68, 12.8)));

// the seal over C in P3, high above, falls on the shell, then floats over the cab
export function sealState(u: number) {
  if (u < 6 || u > 7.3) return { vis: false, y: 0, s: 0, flash: 0 };
  const k = u - 6;
  const drop = seg(k, 0, 0.26);
  const settle = smooth(seg(k, 0.3, 0.5));
  const y = k < 0.26 ? lerp(7, 1.5, easeIn(drop)) : lerp(1.5, 3.4, settle);
  const s = k < 0.26 ? lerp(1.2, 0.9, drop) : lerp(0.9, 1, settle);
  const flash = seg(k, 0.25, 0.45);
  const away = 1 - smooth(seg(u, 7.0, 7.25));
  return { vis: true, y, s: s * away, flash: flash > 0 && flash < 1 ? flash : 0 };
}

// racks, the growth of the hall in V1
export const rackGrowth = (u: number) => smooth(seg(u, 7.0, 7.8));

// the V2 stage
export const stageIn = (u: number) => smooth(seg(u, 7.62, 7.92)) * (1 - smooth(seg(u, 9.05, 9.3)));
// which zone the camera is in as a real number 0 to 3, k of V2
export function zoneAt(u: number) {
  const k = seg(u, 8, 9);
  if (k < 0.5) return k * 2 * 1;
  return 1 + (k - 0.5) * 4 > 3 ? 3 : 1 + (k - 0.5) * 4;
}
export const zoneActive = (i: number, z: number) => clamp01(1 - Math.abs(z - i) * 1.4);

// V3 dock run
export const PT_V3 = new Track([
  [-7, -2.7],
  [-2, -2.7],
  [4, -2.6],
  [11.5, -2.6],
]);

// S1 pile that backs up behind the stopped truck
export const BACKLOG = Array.from({ length: 8 }, (_, i) => ({ x: 4.5 + (i % 4) * 1.55, z: -13.4 - Math.floor(i / 4) * 1.4 - (i === 3 ? 0.1 : 0), y: 0.22, h: 0.55 + ((i * 3) % 4) * 0.12 }));

// route pins and the progress of the van on its route
export const routeProgress = (u: number) => eio(seg(u, 11.1, 11.9));

// K1
export const K1_N = (u: number) => 1 + Math.round(clamp01(u - 13) * 3);
export const K1_PADS = [
  { id: 'najam', label: 'Najam', x: -12, z: 5.2 },
  { id: 'novi', label: 'Novi', x: 2, z: 5.2 },
  { id: 'polovni', label: 'Polovni', x: 16, z: 5.2 },
  { id: 'servis', label: 'Servis', x: 30, z: 5.2 },
];

export { tmp };
