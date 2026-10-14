// The excavator of hero 7, built from primitives and posed from p. Two tracks, the turning house, the
// cab with dark glass, and boom, stick and bucket as nested pivots. The side profile follows the
// BullHill mark (public/brand/mark-on-dark.svg), a gooseneck boom that rises, bends and hands over to
// a stick that hangs nearly upright, a bucket with a row of teeth, the cab at the front of the house
// and a rounded counterweight at the back. Greys only, the specimen's own, graphite body, darker
// tracks, steel bucket, and no red.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { E0, HOUSE_Y, L2, MZ, PIV, type Pose } from './world';

// side profile prism, x forward and y up, centred on z, depth is the width of the part
function prism(pts: [number, number][], depth: number, bevel = 0.03) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 5 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// A limb as a ribbon round a centre line, half widths per point and a round cap at each end
function ribbon(line: [number, number][], hw: number[], depth: number, cap = 6) {
  const n = line.length;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l;
    const ny = tx / l;
    left.push([line[i][0] + nx * hw[i], line[i][1] + ny * hw[i]]);
    right.push([line[i][0] - nx * hw[i], line[i][1] - ny * hw[i]]);
  }
  // a round cap, half a turn clockwise from the first point about c
  const arc = (c: [number, number], from: [number, number]) => {
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    const r = Math.hypot(from[0] - c[0], from[1] - c[1]);
    const out: [number, number][] = [];
    for (let k = 1; k < cap; k++) {
      const t = a0 - (Math.PI * k) / cap;
      out.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]);
    }
    return out;
  };
  // left side forward, cap over the tip, right side back, cap over the foot
  const tip = arc(line[n - 1], left[n - 1]);
  const foot = arc(line[0], right[0]);
  const pts: [number, number][] = [...left, ...tip, ...right.reverse(), ...foot];
  return prism(pts, depth, 0.025);
}

// extrusions are not indexed and boxes and cylinders are, so every part is made plain before it is merged
function merge(list: THREE.BufferGeometry[]) {
  return mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)))!;
}

function cyl(r: number, h: number, seg = 12) {
  return new THREE.CylinderGeometry(r, r, h, seg);
}

const mat = (color: string, rough: number, metal: number) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export type MachineRig = {
  root: THREE.Group;
  bucketPivot: THREE.Object3D;
  update(p: Pose): void;
  dispose(): void;
};

export function buildMachine(): MachineRig {
  const graphite = mat('#3f3f44', 0.48, 0.35);
  const track = mat('#232326', 0.82, 0.1);
  const rollerMat = mat('#3a3a3e', 0.6, 0.4);
  const steel = mat('#b9b9bf', 0.34, 0.8);
  const rod = mat('#c4c4c8', 0.28, 0.9);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0b0b0c', roughness: 0.12, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  const geos: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geos.push(g), g);

  const root = new THREE.Group();
  root.position.set(0, 0, MZ);

  // ---- tracks, a trapezoid shoe with a sprocket and rollers on its outer face, and the frame between
  const shoe = prism([[-1.75, 0.2], [-1.55, 0], [1.55, 0], [1.8, 0.2], [1.45, 0.95], [-1.45, 0.95]], 0.55, 0.05);
  const under: THREE.BufferGeometry[] = [];
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const g = shoe.clone();
    g.translate(0, 0, s * 0.9);
    under.push(g);
    for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) {
      const r = cyl(0.17, 0.06, 14);
      r.rotateX(Math.PI / 2);
      r.translate(x, 0.3, s * 1.2);
      parts.push(r);
    }
    for (const x of [-1.45, 1.5]) {
      const r = cyl(0.34, 0.08, 16);
      r.rotateX(Math.PI / 2);
      r.translate(x, 0.55, s * 1.21);
      parts.push(r);
    }
  }
  const frame = new THREE.BoxGeometry(3, 0.5, 1.5);
  frame.translate(0, 0.5, 0);
  under.push(frame);
  const ring = cyl(1.05, 0.14, 24);
  ring.translate(0, HOUSE_Y - 0.07, 0);
  under.push(ring);
  shoe.dispose();
  const tracks = new THREE.Mesh(keep(merge(under)), track);
  const rollers = new THREE.Mesh(keep(merge(parts)), rollerMat);
  root.add(tracks, rollers);

  // ---- the house, deck at the front, the engine hood and its rounded counterweight at the back
  const house = new THREE.Group();
  house.position.y = HOUSE_Y;
  root.add(house);
  const hull = prism([[-1.62, 0], [1.55, 0], [1.55, 0.55], [0.2, 0.55], [0.2, 1.0], [-1.3, 1.05], [-1.62, 0.92], [-1.72, 0.5]], 2.3, 0.06);
  const stack = cyl(0.09, 0.55, 10);
  stack.translate(-1.15, 1.3, -0.7);
  const body = new THREE.Mesh(keep(merge([hull, stack])), graphite);
  house.add(body);
  // the cab at the front left, the boom hangs on the right of it
  const cab = new THREE.Mesh(keep(prism([[-0.15, 0.55], [1.45, 0.55], [1.5, 1.7], [1.35, 1.98], [0, 2.02], [-0.15, 1.9]], 1.0, 0.04)), graphite);
  cab.position.z = -0.62;
  house.add(cab);
  const win: THREE.BufferGeometry[] = [];
  const front = new THREE.BoxGeometry(0.06, 1.0, 0.82);
  front.translate(1.49, 1.25, -0.62);
  win.push(front);
  for (const z of [-0.1, -1.14]) {
    const w = new THREE.BoxGeometry(1.15, 0.95, 0.05);
    w.translate(0.6, 1.3, z);
    win.push(w);
  }
  house.add(new THREE.Mesh(keep(merge(win)), glass));

  // ---- the arm, the boom foot sits on the house, every joint a pivot
  const armBase = new THREE.Group();
  armBase.position.set(PIV[0], PIV[1], PIV[2]);
  house.add(armBase);

  const boomG = ribbon([[0, 0], [0.28, 0.95], [0.55, 1.75], [1.05, 2.18], [1.85, 2.48], [E0[0], E0[1]]], [0.5, 0.47, 0.43, 0.38, 0.33, 0.28], 0.5);
  const boom = new THREE.Group();
  armBase.add(boom);
  boom.add(new THREE.Mesh(keep(boomG), graphite));

  const stickG = ribbon([[0, 0], [L2 * 0.5, 0], [L2, 0]], [0.28, 0.24, 0.2], 0.4);
  const stick = new THREE.Group();
  stick.position.set(E0[0], E0[1], 0);
  boom.add(stick);
  stick.add(new THREE.Mesh(keep(stickG), graphite));

  // the bucket, a scoop in profile, 1.1 across, with teeth along its edge
  const bucketG = prism([[-0.3, 0.1], [-0.34, -0.35], [-0.2, -0.8], [0.1, -1.1], [0.45, -1.2], [0.55, -1.08], [0.4, -0.85], [0.3, -0.3], [0.22, 0.08]], 1.1, 0.03);
  const teeth: THREE.BufferGeometry[] = [bucketG];
  for (let i = 0; i < 5; i++) {
    const t = prism([[0.4, -1.1], [0.58, -1.12], [0.66, -1.26], [0.44, -1.24]], 0.1, 0);
    t.translate(0, 0, -0.44 + i * 0.22);
    teeth.push(t);
  }
  const bucket = new THREE.Group();
  bucket.position.set(L2, 0, 0);
  stick.add(bucket);
  bucket.add(new THREE.Mesh(keep(merge(teeth)), steel));

  // the two rods, one from the house to the boom and one from the boom to the stick. A unit length
  // cylinder standing on y, moved and turned in the arm plane each frame.
  const rodG = keep(cyl(0.07, 1, 8));
  rodG.translate(0, 0.5, 0);
  const rodA = new THREE.Mesh(rodG, rod);
  const rodB = new THREE.Mesh(rodG, rod);
  armBase.add(rodA, rodB);

  const place = (m: THREE.Mesh, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    m.position.set(ax, ay, 0.34);
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    m.scale.set(1, Math.hypot(dx, dy), 1);
  };

  return {
    root,
    bucketPivot: bucket,
    update(p: Pose) {
      root.position.x = p.xm;
      house.rotation.y = -p.psi;
      boom.rotation.z = p.boom;
      stick.rotation.z = p.stick - p.boom;
      bucket.rotation.z = p.bucket - p.stick;
      const cb = Math.cos(p.boom);
      const sb = Math.sin(p.boom);
      // the lower rod from the house, up under the boom, the upper one from the top of the boom to the stick
      const bx = 0.55 * cb - 0.9 * sb;
      const by = 0.55 * sb + 0.9 * cb;
      place(rodA, -0.5, -0.55, bx, by);
      const ux = 1.4 * cb - 2.82 * sb;
      const uy = 1.4 * sb + 2.82 * cb;
      const cs = Math.cos(p.stick);
      const ss = Math.sin(p.stick);
      const sx = p.ex + 0.55 * cs - 0.34 * ss;
      const sy = p.ey + 0.55 * ss + 0.34 * cs;
      place(rodB, ux, uy, sx, sy);
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      [graphite, track, rollerMat, steel, rod, glass].forEach((m) => m.dispose());
    },
  };
}
