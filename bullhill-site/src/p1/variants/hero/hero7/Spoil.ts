// The spoil of hero 7, a heap of points beside the trench in the ground's own colours, and the load
// in the bucket. One points draw call. Each point belongs to one dump, 0 to 3. It stays in the bucket
// while the bucket is full, falls to its place on the ridge while the bucket tips, and rests there. Its
// place on the ridge and its colour are seeded, so every frame at p is the same frame.

import * as THREE from 'three';
import { rng } from '../hero6/geometry';
import { PALETTE } from '../hero6/acts';
import { CYCLES, PILE_Z, dumpX, type Pose } from './world';

const PER = 2100; // points per dump
const CARRY = 170; // points in the bucket
const RX = 1.15;
const RZ = 0.8;
const HEAP = 0.8;

const VERT = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aCol;
attribute vec3 aMeta;
uniform vec4 uDump;
uniform float uCarry;
uniform mat4 uBucket;
uniform float uPx;
varying vec3 vCol;
varying float vA;
void main() {
  vec3 p;
  if (aMeta.x > 3.5) {
    // the load, in the bucket's own frame, so it turns with it
    p = (uBucket * vec4(position, 1.0)).xyz;
    vA = step(aMeta.y, uCarry);
  } else {
    float q = aMeta.x < 0.5 ? uDump.x : aMeta.x < 1.5 ? uDump.y : aMeta.x < 2.5 ? uDump.z : uDump.w;
    float t = q - aMeta.y * 0.55;
    float f = clamp(t / 0.45, 0.0, 1.0);
    p.xz = mix(aStart.xz, position.xz, smoothstep(0.0, 1.0, f));
    p.y = mix(aStart.y, position.y, f * f);
    vA = t > 0.0 ? 1.0 : 0.0;
  }
  vCol = aCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = vA > 0.5 ? uPx * (0.85 + aMeta.z * 0.6) : 0.0;
}
`;
const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vCol, vA * smoothstep(0.5, 0.32, r));
}
`;

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export type SpoilRig = {
  points: THREE.Points;
  set(p: Pose): void;
  dispose(): void;
};

// the bucket's mouth, in its own frame, the load heaps on the open side
const mouthX = (y: number) => 0.22 + ((0.08 - y) / 0.93) * 0.18;

export function buildSpoil(dpr: number, bucket: THREE.Object3D): SpoilRig {
  const r = rng(29);
  const n = PER * CYCLES + CARRY;
  const pos = new Float32Array(n * 3);
  const start = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const meta = new Float32Array(n * 3);
  // the ground's own colours, mostly the verge soil, a little of the base course and the sand
  const mix = [...PALETTE.backfill, ...PALETTE.backfill, ...PALETTE.backfill, ...PALETTE.base, ...PALETTE.sand];
  const colour = (shade: number, i: number) => {
    const c = rgb(mix[Math.floor(r() * mix.length)]);
    col.set(c.map((v) => v * shade), i * 3);
  };
  let i = 0;
  for (let j = 0; j < CYCLES; j++) {
    const cx = dumpX(j) - 0.1;
    for (let k = 0; k < PER; k++, i++) {
      const rho = Math.sqrt(r());
      const a = r() * Math.PI * 2;
      const lx = Math.cos(a) * rho * RX;
      const lz = Math.sin(a) * rho * RZ;
      const h = HEAP * Math.pow(Math.max(0, 1 - rho * rho), 1.15);
      // most points lie on the surface, a few inside it
      const y = r() < 0.75 ? h * (0.88 + r() * 0.12) : h * r();
      pos.set([cx + lx, y + 0.01, PILE_Z + lz], i * 3);
      // they leave the bucket's mouth, a little above the point it dumps at
      start.set([dumpX(j) - 0.15 + (r() - 0.5) * 0.5, 1.55 + r() * 0.35, PILE_Z + (r() - 0.5) * 0.7], i * 3);
      colour(0.42 + 0.45 * (y / HEAP) + r() * 0.2, i);
      meta.set([j, r(), r()], i * 3);
    }
  }
  // the load, a dome over the mouth
  for (let k = 0; k < CARRY; k++, i++) {
    const y = -0.95 + r() * 0.95;
    const z = (r() - 0.5) * 0.95;
    const bulge = Math.sqrt(Math.max(0, 1 - (z / 0.55) ** 2)) * (0.1 + 0.28 * Math.sin(Math.PI * ((y + 0.95) / 0.95)));
    pos.set([mouthX(y) + 0.02 + bulge * r(), y, z], i * 3);
    colour(0.8 + r() * 0.3, i);
    meta.set([4, r(), r()], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aMeta', new THREE.BufferAttribute(meta, 3));
  const u = {
    uDump: { value: new THREE.Vector4() },
    uCarry: { value: 0 },
    uBucket: { value: bucket.matrixWorld },
    uPx: { value: 2.7 * Math.max(1, dpr) },
  };
  const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: false });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return {
    points,
    set(p) {
      u.uDump.value.set(p.dump[0], p.dump[1], p.dump[2], p.dump[3]);
      u.uCarry.value = p.carry;
    },
    dispose() {
      g.dispose();
      m.dispose();
    },
  };
}
