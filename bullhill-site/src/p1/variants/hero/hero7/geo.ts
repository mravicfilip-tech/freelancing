// Geometry helpers shared by the machine and the house of hero 7. Everything is built from primitives in
// code. A bag of parts, each baked to a position and a grey, merged into one geometry, side profile
// prisms and ribbons with bevelled edges and creased normals, rounded boxes and cylinders.

import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type V3 = [number, number, number];

// a bag of parts, each one baked to a position and a grey, then merged into one geometry
export class Bag {
  private list: THREE.BufferGeometry[] = [];
  add(g: THREE.BufferGeometry, hex: string, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0]) {
    const out = g.index ? g.toNonIndexed() : g;
    if (out !== g) g.dispose();
    if (r[0]) out.rotateX(r[0]);
    if (r[1]) out.rotateY(r[1]);
    if (r[2]) out.rotateZ(r[2]);
    out.translate(p[0], p[1], p[2]);
    const c = new THREE.Color(hex);
    const n = out.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = c.r;
      a[i * 3 + 1] = c.g;
      a[i * 3 + 2] = c.b;
    }
    out.setAttribute('color', new THREE.BufferAttribute(a, 3));
    this.list.push(out);
    return this;
  }
  // `shade` bakes a little ambient occlusion into the vertex greys, a function of where the vertex is,
  // darker low down and in the crevices, so a flat panel is not one flat grey
  // `dirt` says how much road dust and soil a vertex has taken, 0 to 1, and it is mixed in as a brown. `edge`
  // lifts the vertices on a bevel, the paint worn bright where a corner meets a hand or a branch.
  build(shade?: (x: number, y: number, z: number) => number, opt?: { dirt?: (x: number, y: number, z: number) => number; edge?: number }) {
    const g = mergeGeometries(this.list)!;
    if (shade || opt) {
      const pos = g.attributes.position;
      const col = g.attributes.color;
      const nor = g.attributes.normal;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const k = shade ? shade(x, y, z) : 1;
        let r = col.getX(i) * k;
        let gg = col.getY(i) * k;
        let b = col.getZ(i) * k;
        if (opt?.dirt) {
          const d = opt.dirt(x, y, z);
          r += (0.09 * k - r) * d;
          gg += (0.072 * k - gg) * d;
          b += (0.056 * k - b) * d;
        }
        if (opt?.edge) {
          const m = Math.max(Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i)));
          const f = 1 + opt.edge * Math.min(1, Math.max(0, 0.95 - m) / 0.3);
          r *= f;
          gg *= f;
          b *= f;
        }
        col.setXYZ(i, r, gg, b);
      }
    }
    this.list.forEach((x) => x.dispose());
    this.list = [];
    return g;
  }
}

// a side profile prism, x forward and y up, centred on z, depth is the width of the part. The normals
// are creased, so a curved profile shades smooth and a bevel reads as a rounded edge.
export function prism(pts: [number, number][], depth: number, bevel = 0.03, seg = 2) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return toCreasedNormals(g, 0.7);
}

// A limb as a ribbon round a centre line, half widths per point and a round cap at each end
export function ribbon(line: [number, number][], hw: number[], depth: number, cap = 8, bevel = 0.035) {
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
  const tip = arc(line[n - 1], left[n - 1]);
  const foot = arc(line[0], right[0]);
  return prism([...left, ...tip, ...right.reverse(), ...foot], depth, bevel, 2);
}

export const box = (w: number, h: number, d: number, r = 0.03, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export const sq = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
// a cylinder along z, a pin or a wheel
export const cylZ = (r: number, len: number, seg = 16) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateX(Math.PI / 2);
  return g;
};
// a cylinder along x
export const cylX = (r: number, len: number, seg = 8) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateZ(Math.PI / 2);
  return g;
};
export const cylY = (r: number, len: number, seg = 10) => new THREE.CylinderGeometry(r, r, len, seg);

// a plan shape, x forward and z to the right, standing on y, for the rounded counterweight
export function planSlab(x0: number, x1: number, hw: number, corner: number, y0: number, h: number, bevel: number) {
  const s = new THREE.Shape();
  const cx = x0 + corner;
  s.moveTo(x1, -hw);
  s.lineTo(x1, hw);
  s.lineTo(cx, hw);
  s.absarc(cx, hw - corner, corner, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, -hw + corner);
  s.absarc(cx, -hw + corner, corner, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
  // shape y becomes z, the extrusion becomes up
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  return toCreasedNormals(g, 0.8);
}

