// Small shared pieces of the Grad scene, instanced boxes, soft ground pools and a seeded random.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { decalMaterial } from '../../../variants/v4/look';

export type Rect = [x0: number, z0: number, x1: number, z1: number];
// x, y, z of the centre, then the size, then the rotation about y
export type It = [number, number, number, number, number, number, number?];

export const unit = new THREE.BoxGeometry(1, 1, 1);
export const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
export const cone = new THREE.ConeGeometry(0.5, 1, 7);
export const ico = new THREE.IcosahedronGeometry(1, 0);
export const dode = new THREE.DodecahedronGeometry(1, 0);

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = new THREE.Quaternion();
const v = new THREE.Vector3();
const s = new THREE.Vector3();
const m4 = new THREE.Matrix4();
const Y = new THREE.Vector3(0, 1, 0);

export function Inst({ geo = unit, mat, items, cast = true, receive = true }: { geo?: THREE.BufferGeometry; mat: THREE.Material; items: It[]; cast?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach(([x, y, z, sx, sy, sz, r = 0], i) => {
      q.setFromAxisAngle(Y, r);
      m.setMatrixAt(i, m4.compose(v.set(x, y, z), q, s.set(sx, sy, sz)));
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow={receive} />;
}

export const box = ([x0, z0, x1, z1]: Rect, y0: number, h: number, r = 0): It => [(x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, r];

export function Box({ a, y = 0, h, m, cast = true }: { a: Rect; y?: number; h: number; m: THREE.Material; cast?: boolean }) {
  const [x, cy, z, sx, sy, sz] = box(a, y, h);
  return <mesh geometry={unit} material={m} position={[x, cy, z]} scale={[sx, sy, sz]} castShadow={cast} receiveShadow />;
}

// Soft occlusion pools on the ground, centre and size in metres, with a spread
export type Pool = [cx: number, cz: number, w: number, d: number, y?: number];
export function Pools({ items }: { items: Pool[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    items.forEach(([cx, cz, w, d, y = 0.05], i) => m.setMatrixAt(i, m4.compose(v.set(cx, y, cz), rot, s.set(w, d, 1))));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, decalMaterial(), items.length]} renderOrder={1} />;
}

// A ribbon of constant width along a list of x, z points, flat at height y
export function ribbonGeometry(pts: { x: number; z: number }[], width: number, y: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    const nx = -tz * (width / 2);
    const nz = tx * (width / 2);
    pos.push(pts[i].x + nx, y, pts[i].z + nz, pts[i].x - nx, y, pts[i].z - nz);
    if (i < pts.length - 1) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute('normal');
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}
