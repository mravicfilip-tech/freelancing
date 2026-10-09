// Small helpers shared by the Grad scene. Story time u runs 0 to 14, the beat index plus k.
import * as THREE from 'three';

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
// ease in and out, cubic
export const eio = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 2);
// how far u is through the span a to b, 0 to 1
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));

// A path on the ground, optionally with height. Position by distance, heading from the tangent.
export type Pt = [x: number, z: number] | [x: number, z: number, y: number];

export class Track {
  curve: THREE.CatmullRomCurve3;
  len: number;
  private p = new THREE.Vector3();
  private t = new THREE.Vector3();
  constructor(pts: Pt[], tension = 0.5) {
    this.curve = new THREE.CatmullRomCurve3(
      pts.map((q) => new THREE.Vector3(q[0], q[2] ?? 0, q[1])),
      false,
      'centripetal',
      tension,
    );
    this.curve.arcLengthDivisions = 400;
    this.len = this.curve.getLength();
  }
  // s is metres from the start, clamped
  at(s: number, out: Pose) {
    const f = clamp01(s / this.len);
    this.curve.getPointAt(f, this.p);
    this.curve.getTangentAt(f, this.t);
    out.x = this.p.x;
    out.y = this.p.y;
    out.z = this.p.z;
    out.yaw = Math.atan2(-this.t.z, this.t.x);
    const h = Math.hypot(this.t.x, this.t.z);
    out.pitch = Math.atan2(this.t.y, h);
    return out;
  }
  // distance at a fraction of the way along
  frac(f: number) {
    return this.len * clamp01(f);
  }
}

export type Pose = { x: number; y: number; z: number; yaw: number; pitch: number };
export const newPose = (): Pose => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0 });

// yaw 0 faces +x, rotating about y turns +x toward -z
export const headingOf = (dx: number, dz: number) => Math.atan2(-dz, dx);

export function place(g: THREE.Object3D | null | undefined, p: Pose) {
  if (!g) return;
  g.position.set(p.x, p.y, p.z);
  g.rotation.order = 'YXZ';
  g.rotation.set(0, p.yaw, p.pitch);
}

// A pose seen from inside a parent pose, a point at (lx, ly) in the parent's frame
export function inside(parent: Pose, lx: number, ly: number, lz: number, yawOff: number, out: Pose) {
  const c = Math.cos(parent.yaw);
  const s = Math.sin(parent.yaw);
  // yaw turns +x toward -z, so local x goes to (cos, -sin) in x and z
  out.x = parent.x + lx * c + lz * s;
  out.z = parent.z - lx * s + lz * c;
  out.y = parent.y + ly;
  out.yaw = parent.yaw + yawOff;
  out.pitch = 0;
  return out;
}

// Smallest turn between two headings
export const turnTo = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

// The floor of the hall stands 0.22 above the yard, so anything that drives in through the gap rises
export const hallY = (x: number, z: number) => (x > -16.5 && x < 20.5 ? 0.22 * smooth((-5.7 - z) / 1.0) : 0);
