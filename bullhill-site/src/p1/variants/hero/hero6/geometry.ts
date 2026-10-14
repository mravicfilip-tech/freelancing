// Hero 6, the numbers behind the specimen. No three.js import here, so the page can place its
// labels from the same camera before the three.js chunk has loaded, and the stills script and the
// live scene read one source. Units are arbitrary, the block is 5.2 long, 1.9 wide, 1.7 deep.

export type V3 = [number, number, number];
export type View = 'wide' | 'mid' | 'tall';
export type LayerId = 'surface' | 'base' | 'tape' | 'backfill' | 'ducts' | 'sand';

export const L = 4.6; // along x, the duct axis
export const W = 2.0; // along z
export const H = 1.9; // along y
export const Y = { sand: 1.0, backfill: 1.46, base: 1.72, surface: 1.9, tape: 1.22, tapeT: 0.026 };
export const R = 0.19; // duct outer radius
export const WALL = 0.024;
const S = 0.395; // duct pitch
const BOT = R + 0.16;
const TOP = BOT + S * 0.866;

export type DuctSpec = { id: string; y: number; z: number; color: 'green' | 'orange'; near: number; far: number; fibre?: boolean };
// Five ducts, three on the sand and two nested above. The orange one carries the fibres.
export const DUCTS: DuctSpec[] = [
  { id: 'b1', y: BOT, z: -S, color: 'green', near: 1.2, far: 0.6 },
  { id: 'b2', y: BOT, z: 0, color: 'green', near: 1.4, far: 0.7 },
  { id: 'b3', y: BOT, z: S, color: 'green', near: 1.3, far: 0.64 },
  { id: 't1', y: TOP, z: -S / 2, color: 'green', near: 1.5, far: 0.6 },
  { id: 't2', y: TOP, z: S / 2, color: 'orange', near: 1.65, far: 0.66, fibre: true },
];
export const FIBRE_OUT = 0.7; // how far the strands reach past the end of their duct

export type ViewSpec = { aspect: number; az: number; el: number; fov: number; fit: { x0: number; x1: number; y0: number; y1: number }; nominal: [number, number] };
// wide is the desktop stage, mid the tablet one, tall the phone still. fit is the rectangle, as fractions of
// the stage, that the specimen's extreme points are fitted to. The left margin leaves room for tags.
export const VIEWS: Record<View, ViewSpec> = {
  wide: { aspect: 2.2, az: 44, el: 15, fov: 11, fit: { x0: 0.1, x1: 0.985, y0: 0.06, y1: 0.94 }, nominal: [1376, 625] },
  mid: { aspect: 1.5, az: 56, el: 20, fov: 11, fit: { x0: 0.2, x1: 0.985, y0: 0.06, y1: 0.94 }, nominal: [720, 480] },
  tall: { aspect: 1, az: 68, el: 22, fov: 12, fit: { x0: 0.37, x1: 0.985, y0: 0.06, y1: 0.94 }, nominal: [600, 600] },
};

export type Cam = { pos: V3; target: V3; fov: number };

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const madd = (a: V3, b: V3, s: number): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

// Same maths as THREE.PerspectiveCamera.lookAt with up = +y. Returns the point as fractions of the
// stage, x to the right and y down, so 0.5, 0.5 is the middle.
export function project(cam: Cam, aspect: number, p: V3): [number, number] {
  const f = norm(sub(cam.target, cam.pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const v = sub(p, cam.pos);
  const d = dot(v, f);
  const t = Math.tan((cam.fov * Math.PI) / 360);
  return [(dot(v, r) / (d * t * aspect) + 1) / 2, (1 - dot(v, u) / (d * t)) / 2];
}

// The points that must stay in frame, block corners, duct ends and the reach of the fibres.
function extremes(): V3[] {
  const out: V3[] = [];
  for (const x of [-L / 2, L / 2]) for (const y of [0, H]) for (const z of [-W / 2, W / 2]) out.push([x, y, z]);
  for (const d of DUCTS) {
    for (const x of [-L / 2 - d.far, L / 2 + d.near + (d.fibre ? FIBRE_OUT : 0)]) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        out.push([x, d.y + Math.sin(a) * R, d.z + Math.cos(a) * R]);
      }
    }
  }
  return out;
}

export function fitCam(view: View): Cam {
  const v = VIEWS[view];
  const az = (v.az * Math.PI) / 180;
  const el = (v.el * Math.PI) / 180;
  const dir: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  const t = Math.tan((v.fov * Math.PI) / 360);
  const pts = extremes();
  const want = { cx: (v.fit.x0 + v.fit.x1) / 2, cy: (v.fit.y0 + v.fit.y1) / 2, w: v.fit.x1 - v.fit.x0, h: v.fit.y1 - v.fit.y0 };
  let target: V3 = [0, H * 0.4, 0];
  let D = 24;
  let cam: Cam = { pos: madd(target, dir, D), target, fov: v.fov };
  for (let i = 0; i < 80; i++) {
    cam = { pos: madd(target, dir, D), target, fov: v.fov };
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      const [fx, fy] = project(cam, v.aspect, p);
      x0 = Math.min(x0, fx);
      x1 = Math.max(x1, fx);
      y0 = Math.min(y0, fy);
      y1 = Math.max(y1, fy);
    }
    const f = norm(sub(target, cam.pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const dnx = 2 * (want.cx - (x0 + x1) / 2);
    const dny = -2 * (want.cy - (y0 + y1) / 2);
    target = madd(madd(target, r, -dnx * D * t * v.aspect), u, -dny * D * t);
    D *= Math.max((x1 - x0) / want.w, (y1 - y0) / want.h);
  }
  return { pos: madd(target, dir, D), target, fov: v.fov };
}

export const CAMS: Record<View, Cam> = { wide: fitCam('wide'), mid: fitCam('mid'), tall: fitCam('tall') };

// The exact part each label names, in world space. All on the cut long face near its left end, so
// every leader runs in from the left across nothing but black. The duct anchor sits where a duct's
// lower front line meets one of its rings, seen through the schematic.
export const RING_STEP = L / 10;
export const RING_X = Array.from({ length: 9 }, (_, k) => -L / 2 + RING_STEP * (k + 1));
const AX = RING_X[0];
const FRONT = DUCTS.find((d) => d.id === 'b3')!;
export const ANCHORS: Record<LayerId, V3> = {
  surface: [AX, (Y.base + Y.surface) / 2, W / 2],
  base: [AX, (Y.backfill + Y.base) / 2, W / 2],
  tape: [AX, Y.tape, W / 2],
  backfill: [AX, (Y.sand + Y.tape) / 2 + 0.02, W / 2],
  ducts: [AX, FRONT.y, FRONT.z + R],
  sand: [AX, 0.1, W / 2],
};

// Seeded random, so the still and the live scene draw the same specks.
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The camera azimuth as a world direction, for the lights.
export function camDir(view: View): { c: V3; r: V3 } {
  const az = (VIEWS[view].az * Math.PI) / 180;
  const c: V3 = [Math.sin(az), 0, Math.cos(az)];
  return { c, r: [Math.cos(az), 0, -Math.sin(az)] };
}

// ---------- beat 4, the scroll out ----------
// p runs 0 to 1 across the pin. e is p eased, and drives the seam and the camera together.
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (p: number) => {
  const t = clamp01(p);
  return t * t * (3 - 2 * t);
};
// the seam runs from 0.5 to 0.15 of the stage width, smoothstep on p, the same ends and curve as the phone stills
export const DOLLY = { closer: 0.12, deg: 4, seam0: 0.5, seam1: 0.15 };

// The camera at ease e. 12 percent closer along the line of sight, 4 degrees round the block towards
// the near cut end, then trucked and raised until the right end and the foot of the specimen sit
// where they did, so the duct ends grow in frame and stay clear of the card. The lens is the same.
// The top of the block rises past the stage, so the canvas has OVERSCAN of the stage height spare
// above and below it, and the camera renders the stage's own rectangle inside that, so nothing
// at rest changes.
export const OVERSCAN = 0.1;

function dollyAt(view: View, e: number, truck: number, ped: number): Cam {
  const b = CAMS[view];
  const off = sub(b.pos, b.target);
  const a = (DOLLY.deg * Math.PI * e) / 180;
  const k = 1 - DOLLY.closer * e;
  const o: V3 = [(off[0] * Math.cos(a) + off[2] * Math.sin(a)) * k, off[1] * k, (off[2] * Math.cos(a) - off[0] * Math.sin(a)) * k];
  const f = norm([-o[0], -o[1], -o[2]]);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const target = madd(madd(b.target, r, truck), u, ped);
  return { pos: [target[0] + o[0], target[1] + o[1], target[2] + o[2]], target, fov: b.fov };
}

function extent(cam: Cam, aspect: number) {
  let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of extremes()) {
    const [fx, fy] = project(cam, aspect, p);
    x0 = Math.min(x0, fx);
    x1 = Math.max(x1, fx);
    y1 = Math.max(y1, fy);
  }
  return { x0, x1, y1 };
}

function solveDolly(view: View) {
  const v = VIEWS[view];
  const t = Math.tan((v.fov * Math.PI) / 360);
  let truck = 0;
  let ped = 0;
  for (let i = 0; i < 40; i++) {
    const cam = dollyAt(view, 1, truck, ped);
    const d = Math.hypot(...sub(cam.pos, cam.target));
    const ex = extent(cam, v.aspect);
    truck += (ex.x1 - v.fit.x1) * 2 * d * t * v.aspect;
    ped -= (ex.y1 - v.fit.y1) * 2 * d * t;
  }
  return { truck, ped };
}

const SOLVED: Record<View, { truck: number; ped: number }> = { wide: solveDolly('wide'), mid: solveDolly('mid'), tall: solveDolly('tall') };

export function dollyCam(view: View, e: number): Cam {
  const s = SOLVED[view];
  return e <= 0 ? CAMS[view] : dollyAt(view, e, s.truck * e, s.ped * e);
}

// The seam as a fraction of the canvas width, 0 all render, 1 all schematic.
// On phones the block sits in the right of its box and runs off the screen, so the seam starts at
// the middle of the block, 0.6 of the box, and not at 0.5.
export const SEAM0_TALL = 0.6;
export function seamAt(view: View, e: number): number {
  const s0 = view === 'tall' ? SEAM0_TALL : DOLLY.seam0;
  return s0 + (DOLLY.seam1 - s0) * e;
}

// Beat 3, the idle drift. Turns the camera round its target by yaw degrees about the vertical and
// pitch degrees about its own right axis, the same distance and lens. Zero returns the camera itself.
export function driftCam(cam: Cam, yaw: number, pitch: number): Cam {
  if (!yaw && !pitch) return cam;
  const off = sub(cam.pos, cam.target);
  const a = (yaw * Math.PI) / 180;
  const o: V3 = [off[0] * Math.cos(a) + off[2] * Math.sin(a), off[1], off[2] * Math.cos(a) - off[0] * Math.sin(a)];
  const f = norm([-o[0], -o[1], -o[2]]);
  const r = norm(cross(f, [0, 1, 0]));
  const b = (pitch * Math.PI) / 180;
  const rxo = cross(r, o);
  const q: V3 = [o[0] * Math.cos(b) + rxo[0] * Math.sin(b), o[1] * Math.cos(b) + rxo[1] * Math.sin(b), o[2] * Math.cos(b) + rxo[2] * Math.sin(b)];
  return { pos: [cam.target[0] + q[0], cam.target[1] + q[1], cam.target[2] + q[2]], target: cam.target, fov: cam.fov };
}
