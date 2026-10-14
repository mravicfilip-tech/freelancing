// The five steps in the live scene (hero6/acts.ts holds the timeline). Three pieces.
//   the cut     the faces of the ground inside the trench dissolve in small cells as their points
//               leave, and come back as the points land. A shader patch on the specimen's own
//               materials, so at rest every material draws exactly what it drew before.
//   the ducts   the duct groups slide along x, and a band of light runs through them
//   the points  the ground in the trench as points in its own colours, and the fibre light coming
//               out of the open ends. Their own scene, drawn over the whole canvas after both halves.
// Everything is set from p alone, so a frame at ?p= is the same frame every time.

import * as THREE from 'three';
import { DUCTS, H, L, R, Y } from './geometry';
import { BED, COURSES, FLOOR, NEAR_END, SLIDE, TZ, courseAt, cutAt, ductOut, fibreAlpha, lightAt, sampleGround } from './acts';

// Counts, set by the frame budget. One draw call each, a few lines of vertex work per point.
export const GROUND_POINTS = 9000;
export const LIGHT_POINTS = 140; // per duct

export type DigRig = {
  u: {
    uDigCut: { value: THREE.Vector4 }; // sand haunch, backfill, base, surface
    uDigTape: { value: number };
    uDigBed: { value: number };
    uLightHead: { value: number };
    uLightGlow: { value: number };
  };
  ducts: (THREE.Object3D | null)[];
  fibre: THREE.Object3D | null;
  trench: THREE.Object3D | null;
  floor: THREE.Object3D | null; // the trench floor, it rises with the bed
  wallTape: THREE.Object3D | null; // the tape line on the trench's far wall, back only with the tape
  fade: ((a: number) => void) | null; // the fibre strands, set by the render
};

export function makeRig(): DigRig {
  return {
    u: { uDigCut: { value: new THREE.Vector4() }, uDigTape: { value: 0 }, uDigBed: { value: 0 }, uLightHead: { value: 0 }, uLightGlow: { value: 0 } },
    ducts: DUCTS.map(() => null),
    fibre: null,
    trench: null,
    floor: null,
    wallTape: null,
    fade: null,
  };
}

const f = (n: number) => n.toFixed(4);
const DUCT_X = DUCTS.map((d) => (-L / 2 - d.far + L / 2 + d.near) / 2);
const HEAD0 = -L / 2 - 0.8;
const HEAD1 = L / 2 + 1.9;

// Sets the specimen for p. Returns true while any act is under way, so the scene draws the points.
export function applyRig(rig: DigRig, p: number) {
  const c = rig.u.uDigCut.value;
  c.set(cutAt(p, 'sand'), cutAt(p, 'backfill'), cutAt(p, 'base'), cutAt(p, 'surface'));
  rig.u.uDigTape.value = cutAt(p, 'tape');
  rig.u.uDigBed.value = cutAt(p, 'bed');
  if (rig.wallTape) rig.wallTape.visible = rig.u.uDigTape.value < 0.35;
  if (rig.floor) rig.floor.position.y = FLOOR + (BED - FLOOR) * (1 - rig.u.uDigBed.value);
  rig.ducts.forEach((g, i) => {
    if (g) g.position.x = DUCT_X[i] - SLIDE * ductOut(p, i);
  });
  const fi = DUCTS.findIndex((d) => d.fibre);
  if (rig.fibre) rig.fibre.position.x = -SLIDE * ductOut(p, fi);
  const fa = fibreAlpha(p);
  if (rig.fibre) rig.fibre.visible = fa > 0.003;
  rig.fade?.(fa);
  const lt = lightAt(p);
  rig.u.uLightHead.value = lt.head;
  rig.u.uLightGlow.value = lt.glow;
  if (rig.trench) rig.trench.visible = c.x + c.y + c.z + c.w + rig.u.uDigTape.value + rig.u.uDigBed.value > 0;
  return p > 0 && p < 1;
}

// ---- the cut, a patch for any built in material on the block's cut faces. Fragments inside the
// trench, |z| under TZ and above the floor, are dropped in cells once their course's cut passes the
// cell's own threshold, upper cells first. Instanced stones go whole, by their centre.
const DIG_COMMON = /* glsl */ `
varying vec3 vDigW;
varying vec3 vDigC;
`;
const DIG_VERT = /* glsl */ `
#ifdef USE_INSTANCING
  vDigW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  vDigC = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
  vDigW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vDigC = vec3(1e5);
#endif
`;
const DIG_FRAG = /* glsl */ `
{
  bool digInst = vDigC.x < 9e4;
  vec3 dq = digInst ? vDigC : vDigW;
  if (abs(dq.z) < ${f(TZ)} && dq.y > ${f(FLOOR)}) {
    float y0 = ${f(FLOOR)};
    float y1 = ${f(BED)};
    float cut = uDigBed;
    if (dq.y > ${f(Y.tape - Y.tapeT / 2)} && dq.y < ${f(Y.tape + Y.tapeT / 2)}) { y0 = ${f(Y.tape - Y.tapeT / 2)}; y1 = ${f(Y.tape + Y.tapeT / 2)}; cut = uDigTape; }
    else if (dq.y >= ${f(Y.base)}) { y0 = ${f(Y.base)}; y1 = ${f(H)}; cut = uDigCut.w; }
    else if (dq.y >= ${f(Y.backfill)}) { y0 = ${f(Y.backfill)}; y1 = ${f(Y.base)}; cut = uDigCut.z; }
    else if (dq.y >= ${f(Y.sand)}) { y0 = ${f(Y.sand)}; y1 = ${f(Y.backfill)}; cut = uDigCut.y; }
    else if (dq.y >= ${f(BED)}) { y0 = ${f(BED)}; y1 = ${f(Y.sand)}; cut = uDigCut.x; }
    if (cut > 0.0) {
      vec3 cell = digInst ? floor(vDigC * 97.0) : floor(vDigW * 42.0);
      float n = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float top = clamp((y1 - dq.y) / max(0.001, y1 - y0), 0.0, 1.0);
#ifdef DIG_EARLY
      cut = min(1.0, cut * 4.0);
#endif
      if (cut >= 1.0 || 0.72 * n + 0.28 * top < cut) discard;
    }
  }
}
`;

// early, for the dark bores, which go at the first touch of the cut and come back last
export function patchCut(m: THREE.Material, rig: DigRig, early = false) {
  if (early) m.defines = { ...m.defines, DIG_EARLY: '' };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDigCut = rig.u.uDigCut;
    sh.uniforms.uDigTape = rig.u.uDigTape;
    sh.uniforms.uDigBed = rig.u.uDigBed;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${DIG_COMMON}`).replace('#include <project_vertex>', `#include <project_vertex>\n${DIG_VERT}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${DIG_COMMON}\nuniform vec4 uDigCut;\nuniform float uDigTape;\nuniform float uDigBed;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${DIG_FRAG}`);
  };
  m.customProgramCacheKey = () => (early ? 'h6cut-early' : 'h6cut');
  return m;
}

// ---- the light in the ducts, a bright band on the outer wall running from the far end to the near
// one. At rest uLightGlow is 0 and the duct draws as before.
export function patchGlow(m: THREE.Material, rig: DigRig) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLightHead = rig.u.uLightHead;
    sh.uniforms.uLightGlow = rig.u.uLightGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${DIG_COMMON}`).replace('#include <project_vertex>', `#include <project_vertex>\n${DIG_VERT}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${DIG_COMMON}\nuniform float uLightHead;\nuniform float uLightGlow;`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float hx = mix(${f(HEAD0)}, ${f(HEAD1)}, uLightHead) - (vDigW.z + 0.6) * 0.3;
          float d = (vDigW.x - hx) / 0.24;
          float band = exp(-d * d) + 0.06 * smoothstep(-6.0, 0.0, d) * step(d, 0.0);
          totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * band * uLightGlow * 1.3;
        }`,
      );
  };
  m.customProgramCacheKey = () => 'h6glow';
  return m;
}

// ---- the points
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const GROUND_VERT = /* glsl */ `
attribute vec3 aCloud;
attribute vec3 aColor;
attribute vec3 aMeta;
uniform vec4 uLift;
uniform vec4 uFall;
uniform vec2 uTape;
uniform vec2 uBed;
uniform float uP;
uniform float uPx;
varying vec3 vCol;
varying float vA;
float sm(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
void main() {
  float ci = aMeta.x;
  // course order, bed, sand, backfill, tape, base, surface
  float li = ci < 0.5 ? uBed.x : ci < 1.5 ? uLift.x : ci < 2.5 ? uLift.y : ci < 3.5 ? uTape.x : ci < 4.5 ? uLift.z : uLift.w;
  float fa = ci < 0.5 ? uBed.y : ci < 1.5 ? uFall.x : ci < 2.5 ? uFall.y : ci < 3.5 ? uTape.y : ci < 4.5 ? uFall.z : uFall.w;
  float d = aMeta.y * 0.4;
  float k = sm((li - d) / 0.6) * (1.0 - sm((fa - d) / 0.6));
  float w = uP * 6.283 + aMeta.z * 6.283;
  vec3 p = position + (aCloud - position) * k;
  p += vec3(sin(w) * 0.05 * k, sin(3.14159 * k) * 0.12 + cos(w * 0.7) * 0.025 * k, 0.0);
  vA = sm(k / 0.12);
  vCol = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = vA > 0.001 ? uPx * (0.8 + aMeta.z * 0.7) : 0.0;
}
`;
const GROUND_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vCol, vA * smoothstep(0.5, 0.32, r));
}
`;
const LIGHT_VERT = /* glsl */ `
attribute vec3 aEnd;
attribute vec3 aRnd;
uniform float uStream;
uniform float uPx;
varying float vA;
void main() {
  float t = (uStream - aRnd.x * 0.6) / 0.4;
  float on = step(0.0, t) * step(t, 1.0);
  t = clamp(t, 0.0, 1.0);
  float a = aRnd.y * 6.2832;
  float reach = 0.25 + aRnd.z * 0.75;
  float rad = ${f(R * 0.55)} * sqrt(fract(aRnd.y * 7.31)) + t * (0.03 + aRnd.z * 0.08);
  vec3 p = vec3(aEnd.x + t * reach, aEnd.y + sin(a) * rad - t * t * 0.03, aEnd.z + cos(a) * rad);
  vA = on * sin(3.14159 * t);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = on > 0.5 ? uPx * (1.1 + aRnd.z * 1.2) : 0.0;
}
`;
const LIGHT_FRAG = /* glsl */ `
varying float vA;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  if (r > 0.5) discard;
  gl_FragColor = vec4(1.0, 0.98, 0.94, vA * smoothstep(0.5, 0.1, r));
}
`;

export function buildDig(dpr: number) {
  const scene = new THREE.Scene();

  const grains = sampleGround(GROUND_POINTS);
  const n = grains.length;
  const pos = new Float32Array(n * 3);
  const cloud = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const meta = new Float32Array(n * 3);
  grains.forEach((g, i) => {
    pos.set(g.home, i * 3);
    cloud.set(g.cloud, i * 3);
    // a little darker than the swatch, the points sit in the same light as the render
    col.set(rgb(g.color).map((v) => v * 0.92), i * 3);
    meta.set([g.course, g.r, g.s], i * 3);
  });
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  gg.setAttribute('aCloud', new THREE.BufferAttribute(cloud, 3));
  gg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  gg.setAttribute('aMeta', new THREE.BufferAttribute(meta, 3));
  const gu = {
    uLift: { value: new THREE.Vector4() },
    uFall: { value: new THREE.Vector4() },
    uTape: { value: new THREE.Vector2() },
    uBed: { value: new THREE.Vector2() },
    uP: { value: 0 },
    uPx: { value: 2.4 * dpr },
  };
  const ground = new THREE.Points(gg, new THREE.ShaderMaterial({ vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, uniforms: gu, transparent: true, depthWrite: false }));
  ground.frustumCulled = false;
  scene.add(ground);

  const m = DUCTS.length * LIGHT_POINTS;
  const end = new Float32Array(m * 3);
  const rnd = new Float32Array(m * 3);
  let s = 11;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  DUCTS.forEach((d, i) => {
    for (let k = 0; k < LIGHT_POINTS; k++) {
      const j = i * LIGHT_POINTS + k;
      end.set([NEAR_END[i], d.y, d.z], j * 3);
      rnd.set([r(), r(), r()], j * 3);
    }
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(m * 3), 3));
  lg.setAttribute('aEnd', new THREE.BufferAttribute(end, 3));
  lg.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 3));
  const lu = { uStream: { value: 0 }, uPx: { value: 2.2 * dpr } };
  const light = new THREE.Points(lg, new THREE.ShaderMaterial({ vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG, uniforms: lu, transparent: true, depthWrite: false }));
  light.frustumCulled = false;
  scene.add(light);

  // set the points for p, and say whether there is anything to draw. Without dust the ground's points
  // stay hidden and only the light is drawn, for the stills, where the 2D layer plays the ground.
  const update = (p: number, dust = true) => {
    const ks = COURSES.map((c) => courseAt(p, c));
    // COURSES is bed, sand, backfill, tape, base, surface
    gu.uBed.value.set(ks[0].lift, ks[0].fall);
    gu.uLift.value.set(ks[1].lift, ks[2].lift, ks[4].lift, ks[5].lift);
    gu.uFall.value.set(ks[1].fall, ks[2].fall, ks[4].fall, ks[5].fall);
    gu.uTape.value.set(ks[3].lift, ks[3].fall);
    gu.uP.value = p;
    const st = lightAt(p).stream;
    lu.uStream.value = st;
    ground.visible = dust && ks.some((k) => k.lift > 0 && k.fall < 1);
    light.visible = st > 0 && st < 1;
    return ground.visible || light.visible;
  };
  return { scene, update, counts: { ground: n, light: m } };
}

