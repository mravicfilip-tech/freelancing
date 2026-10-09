// The particle truck. Each form is sampled over its surface, points are sorted along x so a reform
// runs through the truck like a wave instead of a shuffle, and one shader mixes four forms by weight.
// It scatters wherever uScatter is up, and around uCutX when uBand is up, which is how a worn truck
// is rebuilt ring by ring.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { M } from '../../../r3f/materials';
import { C } from '../../../tokens';
import * as S from '../../../variants/v5/shaders';

export const FORMS = 4;

function sampleForm(root: THREE.Object3D, n: number) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const parts: { s: MeshSurfaceSampler; m: THREE.Matrix4; red: boolean; area: number }[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh) return;
    const s = new MeshSurfaceSampler(mesh).build();
    const d = (s as unknown as { distribution: Float32Array | null }).distribution;
    const area = d ? d[d.length - 1] : 0;
    if (!area) return;
    parts.push({ s, m: new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld), red: mesh.userData.red === true || mesh.material === M.paint, area });
  });
  const total = parts.reduce((a, b) => a + b.area, 0);
  const pts: { x: number; y: number; z: number; red: number }[] = [];
  const v = new THREE.Vector3();
  parts.forEach((p, i) => {
    const want = i === parts.length - 1 ? n - pts.length : Math.round((p.area / total) * n);
    for (let j = 0; j < want && pts.length < n; j++) {
      p.s.sample(v);
      v.applyMatrix4(p.m);
      pts.push({ x: v.x, y: v.y, z: v.z, red: p.red ? 1 : 0 });
    }
  });
  while (pts.length < n) pts.push({ ...pts[pts.length % Math.max(1, pts.length)] });
  const keyed = pts.map((p) => ({ p, k: p.x + (Math.random() - 0.5) * 0.35 }));
  keyed.sort((a, b) => a.k - b.k);
  return keyed.map((e) => e.p);
}

const vert = /* glsl */ `
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec4 aRed;
attribute vec3 aRand;
uniform vec4 uW;
uniform float uScatter;
uniform float uBand;
uniform float uCutX;
uniform float uTime;
uniform float uSize;
uniform float uDpr;
uniform vec3 uRedCol;
varying vec3 vCol;
varying float vA;
void main() {
  vec3 p = position * uW.x + aP1 * uW.y + aP2 * uW.z + aP3 * uW.w;
  float red = dot(aRed, uW);
  // mixing two forms leaves the points halfway between them, so lift the in between into a spread
  float mixAmt = 1.0 - max(max(uW.x, uW.y), max(uW.z, uW.w));
  float near = exp(-pow((p.x - uCutX) / 0.55, 2.0)) * uBand;
  float amp = max(max(uScatter, near), mixAmt * 2.2);
  vec3 dir = normalize(aRand * 2.0 - 1.0 + vec3(0.1, 0.55, 0.0));
  p += dir * amp * (0.25 + aRand.x * aRand.x * 1.9);
  p.y += amp * aRand.y * 0.7;
  p += amp * vec3(sin(uTime * 1.3 + aRand.x * 23.0), sin(uTime * 1.1 + aRand.y * 19.0) * 0.6, cos(uTime * 1.2 + aRand.z * 17.0)) * 0.16;
  p.y = max(p.y, 0.03);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.7 + 0.3 * sin(uTime * (1.0 + aRand.y * 2.0) + aRand.z * 40.0);
  gl_PointSize = uSize * uDpr * (0.5 + aRand.y * 0.9) * (1.0 + amp * 0.6) / -mv.z;
  vCol = mix(vec3(0.9, 0.91, 0.94), uRedCol, red);
  vA = (0.5 + 0.5 * aRand.z) * mix(1.0, tw, min(1.0, amp));
}
`;

export function buildCloud(roots: THREE.Object3D[], n: number, dpr: number) {
  const forms = roots.map((r) => sampleForm(r, n));
  const geo = new THREE.BufferGeometry();
  const attr = (get: (i: number) => number[], size: number) => {
    const a = new Float32Array(n * size);
    for (let i = 0; i < n; i++) a.set(get(i), i * size);
    return new THREE.BufferAttribute(a, size);
  };
  geo.setAttribute('position', attr((i) => [forms[0][i].x, forms[0][i].y, forms[0][i].z], 3));
  for (let f = 1; f < FORMS; f++) {
    const src = forms[Math.min(f, forms.length - 1)];
    geo.setAttribute(`aP${f}`, attr((i) => [src[i].x, src[i].y, src[i].z], 3));
  }
  geo.setAttribute('aRed', attr((i) => forms.map((f) => f[i].red).concat([0, 0, 0, 0]).slice(0, 4), 4));
  geo.setAttribute('aRand', attr(() => [Math.random(), Math.random(), Math.random()], 3));
  geo.computeBoundingSphere();
  geo.boundingSphere!.radius = 30;
  const red = new THREE.Color().setStyle(C.tonedRed, THREE.NoColorSpace);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: S.pointFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uW: { value: new THREE.Vector4(1, 0, 0, 0) },
      uScatter: { value: 0 },
      uBand: { value: 0 },
      uCutX: { value: -99 },
      uTime: { value: 0 },
      uSize: { value: 30 },
      uDpr: { value: dpr },
      uOpacity: { value: 0 },
      uRedCol: { value: new THREE.Vector3(red.r * 1.1, red.g * 1.1, red.b * 1.1) },
    },
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
