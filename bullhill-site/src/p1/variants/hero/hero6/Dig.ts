// The five steps in the live scene (hero6/acts.ts holds the timeline). Three pieces.
//   the cut     the faces of the ground inside the trench dissolve in small cells as their points
//               leave, and come back as the points land. A shader patch on the specimen's own
//               materials, so at rest every material draws exactly what it drew before.
//   the ducts   the duct groups slide along x, and a band of light follows the fibre tip through the
//               orange duct, the strands themselves are set in Render.tsx
//   the points  the ground in the trench as points in its own colours. Their own scene, drawn over the
//               whole canvas after both halves.
// Everything is set from p alone, so a frame at ?p= is the same frame every time.

import * as THREE from 'three';
import { DUCTS, H, L, R, Y } from './geometry';
import { BED, COURSES, FLOOR, SLIDE, TZ, courseAt, cutAt, ductOut, fibreAlpha, lightAt, sampleGround } from './acts';

// Counts, set by the frame budget. One draw call each, a few lines of vertex work per point.
export const GROUND_POINTS = 9000;

export type DigRig = {
  u: {
    uDigCut: { value: THREE.Vector4 }; // sand haunch, backfill, base, surface
    uDigTape: { value: number };
    uDigBed: { value: number };
    uLightHead: { value: number }; // world x of the fibre tip
    uLightGlow: { value: number };
  };
  ducts: (THREE.Object3D | null)[];
  fibre: THREE.Object3D | null;
  trench: THREE.Object3D | null;
  floor: THREE.Object3D | null; // the trench floor, it rises with the bed
  wallTape: THREE.Object3D | null; // the tape line on the trench's far wall, back only with the tape
  fade: ((a: number) => void) | null; // the fibre strands, set by the render
  run: ((p: number) => void) | null; // how far each strand has been blown, set by the render
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
    run: null,
  };
}

const f = (n: number) => n.toFixed(4);
// the fibre duct, and where its light line sits round the wall, 30 degrees above the side facing the
// camera, and how thick it is
const FD = DUCTS.find((d) => d.fibre)!;
const LINE_AT = (30 * Math.PI) / 180;
const LINE_W = 0.009;
const DUCT_X = DUCTS.map((d) => (-L / 2 - d.far + L / 2 + d.near) / 2);

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
  rig.run?.(p);
  const lt = lightAt(p);
  rig.u.uLightHead.value = lt.x;
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

// ---- the light in the orange duct, a thin line on the outer wall that follows the fibre tip from the
// far end to the near one. At rest uLightGlow is 0 and the duct draws as before.
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
          // a thin line along the wall behind the tip, on the side that faces the camera, and a small
          // bright point at the tip. a is the distance round the wall from that line, in world units.
          float a = abs(atan(vDigW.y - ${f(FD.y)}, vDigW.z - ${f(FD.z)}) - ${f(LINE_AT)}) * ${f(R)};
          float dx = vDigW.x - uLightHead;
          float line = (1.0 - smoothstep(${f(LINE_W * 0.5)}, ${f(LINE_W)}, a)) * (1.0 - smoothstep(-0.02, 0.02, dx)) * 1.0;
          float tipPt = exp(-(dx * dx + a * a) / 0.0016) * 1.6;
          totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * (line + tipPt) * uLightGlow * 1.3;
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

  // set the points for p, and say whether there is anything to draw. Without dust the ground's points
  // stay hidden, for the stills, where the 2D layer plays the ground.
  const update = (p: number, dust = true) => {
    const ks = COURSES.map((c) => courseAt(p, c));
    // COURSES is bed, sand, backfill, tape, base, surface
    gu.uBed.value.set(ks[0].lift, ks[0].fall);
    gu.uLift.value.set(ks[1].lift, ks[2].lift, ks[4].lift, ks[5].lift);
    gu.uFall.value.set(ks[1].fall, ks[2].fall, ks[4].fall, ks[5].fall);
    gu.uTape.value.set(ks[3].lift, ks[3].fall);
    gu.uP.value = p;
    ground.visible = dust && ks.some((k) => k.lift > 0 && k.fall < 1);
    return ground.visible;
  };
  return { scene, update, counts: { ground: n } };
}

