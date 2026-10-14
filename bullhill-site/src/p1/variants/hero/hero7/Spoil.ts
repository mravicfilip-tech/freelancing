// The spoil of hero 7, grains on the heap beside the trench in the ground's own colours, and the load in
// the bucket. One points draw call. The heap itself is in the ground's height field, these are its
// grain and the soil in the air. Each point belongs to one dump. It stays in the bucket while the bucket
// is full, falls to its place on the heap while the bucket tips, and rests on the surface the ground
// has grown there, since it reads the same height function. Its place on the heap and its colour are
// seeded, so every frame at p is the same frame.

import * as THREE from 'three';
import { rng } from '../hero6/geometry';
import { PALETTE } from '../hero6/acts';
import { CYCLES, DUMPX, PILE_Z, heapAmp, type Pose } from './world';

const PER = 2600; // grains per dump
const CARRY = 240; // points in the bucket
const RX = 1.9; // the heap's half length and width, as in the ground
const RZ = 1.25;
const HEAP = 0.85;

const VERT = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aCol;
attribute vec3 aMeta;
uniform float uDump[${CYCLES}];
uniform float uHeapX[${CYCLES}];
uniform float uHeapA[${CYCLES}];
uniform float uPileZ;
uniform float uCarry;
uniform mat4 uBucket;
uniform float uPx;
varying vec3 vCol;
varying float vA;
float heapHeight(vec2 q) {
  float h = 0.0;
  for (int i = 0; i < ${CYCLES}; i++) {
    float dx = (q.x - uHeapX[i]) / ${RX.toFixed(2)};
    float dz = (q.y - uPileZ) / ${RZ.toFixed(2)};
    float r2 = dx * dx + dz * dz;
    h += uHeapA[i] * ${HEAP.toFixed(2)} * pow(max(1.0 - r2, 0.0), 1.5);
  }
  return h;
}
void main() {
  vec3 p;
  if (aMeta.x > ${(CYCLES - 0.5).toFixed(1)}) {
    // the load, in the bucket's own frame, so it turns with it
    p = (uBucket * vec4(position, 1.0)).xyz;
    vA = step(aMeta.y, uCarry);
  } else {
    float q = uDump[int(aMeta.x + 0.5)];
    float t = q - aMeta.y * 0.55;
    float f = clamp(t / 0.45, 0.0, 1.0);
    float land = heapHeight(position.xz) + 0.012 + position.y;
    p.xz = mix(aStart.xz, position.xz, smoothstep(0.0, 1.0, f));
    p.y = mix(aStart.y, land, f * f);
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

// the bucket's mouth, in its own frame, the load heaps on the open side, which faces the machine
const mouthX = (y: number) => -0.3 - (-y / 1.2) * 0.04;

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
    const cx = DUMPX[j];
    for (let k = 0; k < PER; k++, i++) {
      const rho = Math.sqrt(r());
      const a = r() * Math.PI * 2;
      const lx = Math.cos(a) * rho * RX * 0.92;
      const lz = Math.sin(a) * rho * RZ * 0.92;
      // y is a small lift over the surface the ground has grown, the shader adds the height there
      pos.set([cx + lx, r() < 0.8 ? r() * 0.02 : 0.02 + r() * 0.05, PILE_Z + lz], i * 3);
      // they leave the bucket's mouth, a little above the point it dumps at
      start.set([cx + (r() - 0.5) * 0.7, 1.6 + r() * 0.4, PILE_Z + (r() - 0.5) * 0.8], i * 3);
      colour(0.5 + 0.35 * (1 - rho * rho) + r() * 0.25, i);
      meta.set([j, r(), r()], i * 3);
    }
  }
  // the load, a dome over the mouth
  for (let k = 0; k < CARRY; k++, i++) {
    const y = -1.12 + r() * 1.06;
    const z = (r() - 0.5) * 0.95;
    const bulge = Math.sqrt(Math.max(0, 1 - (z / 0.5) ** 2)) * (0.06 + 0.3 * Math.sin(Math.PI * ((y + 1.12) / 1.06)));
    pos.set([mouthX(y) - bulge * r() + 0.04, y, z], i * 3);
    colour(0.8 + r() * 0.3, i);
    meta.set([CYCLES, r(), r()], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aMeta', new THREE.BufferAttribute(meta, 3));
  const dump = new Float32Array(CYCLES);
  const heapX = new Float32Array(CYCLES);
  heapX.set(DUMPX);
  const heapA = new Float32Array(CYCLES);
  const u = {
    uDump: { value: dump },
    uHeapX: { value: heapX },
    uHeapA: { value: heapA },
    uPileZ: { value: PILE_Z },
    uCarry: { value: 0 },
    uBucket: { value: bucket.matrixWorld },
    uPx: { value: 2.3 * Math.max(1, dpr) },
  };
  const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: false });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return {
    points,
    set(p) {
      for (let q = 0; q < CYCLES; q++) {
        dump[q] = p.dump[q];
        heapA[q] = heapAmp(p.dump[q]);
      }
      u.uCarry.value = p.carry;
    },
    dispose() {
      g.dispose();
      m.dispose();
    },
  };
}
