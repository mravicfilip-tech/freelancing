// Everything of hero 7 that is not the ground, the machine or the spoil. The sand that is poured, the five
// ducts that unroll along the trench floor, the lit tip that leaves the street cabinet and runs the orange duct
// to the house wall, the house itself, real and lived in with its windows dark until the end, the cabinet, the
// connection box on the wall and the stakes along the marked line. All of it is set from the pose, so every
// frame at p is the same frame. Each piece is one draw call and is hidden while it has nothing to show, so the
// frame cost stays low.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Bag, box, cylY, prism, sq } from './geo';
import { PALETTE } from '../hero6/acts';
import { rng } from '../hero6/geometry';
import { CAB, D, DUCTS, DUCT_R, DUCT_X0, DUCT_X1, EDGE, FEED_X, HOUSE, LEAD_X, ORANGE, PINS, ROUTE_LEG, SAND, X_CUT, X_T0, type Pose } from './world';

const GREEN = '#37864f';
const ORANGE_HEX = '#c9531f';

// ---- the ducts, open tubes along x from 0 back to -1, scaled in x so they unroll from the street end
function ductGeometry(orange: boolean, alongZ = false) {
  const list: THREE.BufferGeometry[] = [];
  const base = new THREE.Color(orange ? ORANGE_HEX : GREEN);
  const dark = base.clone().multiplyScalar(0.38);
  const add = (g: THREE.BufferGeometry, c: THREE.Color, y: number, z: number) => {
    const o = g.index ? g.toNonIndexed() : g;
    o.translate(0, y, z);
    const n = o.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = c.r;
      a[i * 3 + 1] = c.g;
      a[i * 3 + 2] = c.b;
    }
    o.setAttribute('color', new THREE.BufferAttribute(a, 3));
    list.push(o);
  };
  const wall = 0.02;
  for (const d of DUCTS.filter((q) => q.orange === orange)) {
    const outer = new THREE.CylinderGeometry(DUCT_R, DUCT_R, 1, 24, 1, true);
    outer.rotateZ(Math.PI / 2);
    outer.translate(-0.5, 0, 0);
    add(outer, base, d.y, d.z);
    const inner = new THREE.CylinderGeometry(DUCT_R - wall, DUCT_R - wall, 1, 24, 1, true);
    inner.rotateZ(Math.PI / 2);
    inner.translate(-0.5, 0, 0);
    add(inner, dark, d.y, d.z);
    // the cut ends, a ring of the duct's wall
    for (const x of [0, -1]) {
      const ring = new THREE.RingGeometry(DUCT_R - wall, DUCT_R, 24);
      ring.rotateY(Math.PI / 2);
      ring.translate(x, 0, 0);
      add(ring, base, d.y, d.z);
    }
  }
  const out = mergeGeometries(list)!;
  // the feeder under the road runs along z, the same tubes turned a quarter, from 0 out to +1
  if (alongZ) out.rotateY(Math.PI / 2);
  return out;
}

// ---- the sand that is poured, a curtain of grains that falls and settles on the floor of the trench
const SAND_VERT = /* glsl */ `
attribute vec3 aSeed;
attribute vec3 aCol;
uniform float uSandX;
uniform float uFade;
uniform float uPx;
varying vec3 vCol;
varying float vA;
void main() {
  float x = position.x;
  float lvl = ${SAND.toFixed(3)} * smoothstep(uSandX - 0.3, uSandX + 1.0, x);
  // the grain starts falling when the front is 0.7 short of it and has landed 0.8 past it
  float f = clamp((x - uSandX + 0.7 + aSeed.x * 0.5) / 1.5, 0.0, 1.0);
  float land = ${(-D).toFixed(3)} + lvl + 0.012;
  float y = mix(1.5 + aSeed.y * 0.6, land, f * f);
  float xs = x + (1.0 - f) * (aSeed.z - 0.5) * 0.5;
  vA = (f > 0.0 ? 1.0 - smoothstep(0.0, 1.0, (x - uSandX - 0.8) / 1.2) * 0.8 : 0.0) * uFade;
  vCol = aCol;
  gl_Position = projectionMatrix * viewMatrix * vec4(xs, y, position.z, 1.0);
  gl_PointSize = vA > 0.01 ? uPx * (0.9 + aSeed.z * 0.7) : 0.0;
}
`;
const DOT_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vCol, vA * smoothstep(0.5, 0.32, r));
}
`;

// ---- the lit tip, the cabinet's light and the connection box, soft glows added over the scene
const GLOW_VERT = /* glsl */ `
attribute float aA;
attribute float aS;
varying float vA;
void main() {
  vA = aA;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aA > 0.01 ? aS : 0.0;
}
`;
const GLOW_FRAG = /* glsl */ `
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float a = exp(-r * r * 5.0);
  gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * 1.4, a * vA);
}
`;

export type StoryRig = {
  group: THREE.Group;
  // set from the pose and the route's draw, the metres drawn in from the cabinet
  update(p: Pose, routeS: number): void;
  setScreen(dpr: number): void;
  dispose(): void;
};

export function buildStory(dpr: number): StoryRig {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geos.push(g), g);
  const keepM = <M extends THREE.Material>(m: M) => (mats.push(m), m);

  // ---- ducts
  const glowU = { tip: { value: 99 }, glow: { value: 0 } };
  const ductMat = (orange: boolean, glowing = true) => {
    const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide });
    if (orange && glowing) {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTipX = glowU.tip;
        sh.uniforms.uGlow = glowU.glow;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWx;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWx = (modelMatrix * vec4(transformed, 1.0)).x;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vWx;\nuniform float uTipX;\nuniform float uGlow;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat lit = smoothstep(uTipX - 0.1, uTipX + 0.25, vWx) * (0.4 + 0.9 * exp(-max(vWx - uTipX, 0.0) / 1.4));\ntotalEmissiveRadiance += vec3(1.0, 0.46, 0.14) * lit * uGlow * 0.6;');
      };
    }
    return keepM(m);
  };
  const green = new THREE.Mesh(keep(ductGeometry(false)), ductMat(false));
  const orange = new THREE.Mesh(keep(ductGeometry(true)), ductMat(true));
  for (const m of [green, orange]) {
    m.position.set(DUCT_X0, 0, 0);
    m.frustumCulled = false;
    m.visible = false;
    group.add(m);
  }

  // the operator's own feeder to the cabinet crosses under the road, and the cut edge shows its ducts, short stubs
  // standing out of the face, the same tubes with open bores, plain, no glow. They grow out of the face as the cut
  // finishes.
  const stubs = [new THREE.Mesh(keep(ductGeometry(false, true)), ductMat(false, false)), new THREE.Mesh(keep(ductGeometry(true, true)), ductMat(true, false))];
  for (const m of stubs) {
    m.position.set(FEED_X, 0, EDGE.z);
    m.scale.z = 0.001;
    m.frustumCulled = false;
    m.visible = false;
    group.add(m);
  }

  // ---- the sand
  const sandG = (() => {
    const r = rng(53);
    const n = 9000;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const pal = PALETTE.sand.map((h) => new THREE.Color(h));
    for (let i = 0; i < n; i++) {
      pos.set([X_T0 - 1.2 + r() * (X_CUT + 1.8 - X_T0), 0, (r() - 0.5) * 1.5], i * 3);
      seed.set([r(), r(), r()], i * 3);
      const c = pal[Math.floor(r() * pal.length)];
      const k = 0.85 + r() * 0.3;
      col.set([c.r * k, c.g * k, c.b * k], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    return keep(g);
  })();
  const sandU = { uSandX: { value: 99 }, uFade: { value: 1 }, uPx: { value: 2.2 * Math.max(1, dpr) } };
  const sand = new THREE.Points(sandG, keepM(new THREE.ShaderMaterial({ vertexShader: SAND_VERT, fragmentShader: DOT_FRAG, uniforms: sandU, transparent: true, depthWrite: false })));
  sand.frustumCulled = false;
  sand.renderOrder = 2;
  sand.visible = false;
  group.add(sand);

  // ---- the glows, the lit tip, the light on the cabinet and the connection box on the house wall
  const nGlow = 3;
  const glowPos = new Float32Array(nGlow * 3);
  const glowA = new Float32Array(nGlow);
  const glowS = new Float32Array(nGlow);
  const glowG = new THREE.BufferGeometry();
  glowG.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  glowG.setAttribute('aA', new THREE.BufferAttribute(glowA, 1));
  glowG.setAttribute('aS', new THREE.BufferAttribute(glowS, 1));
  keep(glowG);
  const glow = new THREE.Points(glowG, keepM(new THREE.ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  glow.frustumCulled = false;
  glow.renderOrder = 3;
  glow.visible = false;
  group.add(glow);
  const pxK = { v: Math.max(1, dpr) };

  // ---- the house, real from the first frame, a lived in house in the greys of the specimen. Walls, a plinth, a
  // gable roof, a chimney, window frames and a door with a little porch, a hedge, a path and a bin, one mesh. The
  // glass is another, dark until the end, then lit warm by its emissive.
  const wallW = HOUSE.x1 - HOUSE.x0;
  const wallD = HOUSE.z1 - HOUSE.z0;
  const cx = (HOUSE.x0 + HOUSE.x1) / 2;
  const body = new Bag();
  const glass = new Bag();
  body.add(box(wallW + 0.16, 0.3, wallD + 0.16, 0.04), '#55555b', [cx, 0.15, 0]);
  body.add(box(wallW, HOUSE.h, wallD, 0.05), '#9b9ba1', [cx, 0.3 + HOUSE.h / 2 - 0.2, 0]);
  const roof = prism([[-wallD / 2 - 0.35, 0], [wallD / 2 + 0.35, 0], [0.02, HOUSE.ridge], [-0.02, HOUSE.ridge]], wallW + 0.7, 0.05, 1);
  roof.rotateY(Math.PI / 2);
  body.add(roof, '#3d3d43', [cx, HOUSE.h + 0.1, 0]);
  body.add(box(0.5, 1.1, 0.5, 0.03), '#6d6d73', [HOUSE.x0 + 1.3, HOUSE.h + 0.9, -0.7]);
  body.add(cylY(0.11, 0.22, 10), '#4a4a50', [HOUSE.x0 + 1.3, HOUSE.h + 1.55, -0.7]);
  // a frame, a pane proud of it, and a sill under it, on a wall that faces dir along its axis
  const win = (x: number, y: number, z: number, onX: boolean, dir: number) => {
    if (onX) {
      body.add(box(0.12, 1.4, 1.2, 0.02, 1), '#d0d0d4', [x + dir * 0.03, y, z]);
      glass.add(sq(0.02, 1.14, 0.94), '#1c1e24', [x + dir * 0.1, y, z]);
      body.add(box(0.2, 0.06, 1.3, 0.01, 1), '#b8b8bd', [x + dir * 0.06, y - 0.72, z]);
    } else {
      body.add(box(1.2, 1.4, 0.12, 0.02, 1), '#d0d0d4', [x, y, z + dir * 0.03]);
      glass.add(sq(0.94, 1.14, 0.02), '#1c1e24', [x, y, z + dir * 0.1]);
      body.add(box(1.3, 0.06, 0.2, 0.01, 1), '#b8b8bd', [x, y - 0.72, z + dir * 0.06]);
    }
  };
  const zf = HOUSE.z1;
  const xf = HOUSE.x1;
  win(HOUSE.x0 + 1.15, 1.55, zf, false, 1);
  win(HOUSE.x1 - 1.15, 1.55, zf, false, 1);
  win(xf, 1.55, -0.95, true, 1);
  win(xf, 1.55, 0.95, true, 1);
  win(HOUSE.x0 + 1.15, 1.55, HOUSE.z0, false, -1);
  win(HOUSE.x1 - 1.15, 1.55, HOUSE.z0, false, -1);
  // window boxes with a little green under the two windows on the road side
  for (const x of [HOUSE.x0 + 1.15, HOUSE.x1 - 1.15]) {
    body.add(box(1.2, 0.18, 0.22, 0.02, 1), '#4a4a50', [x, 0.9, zf + 0.2]);
    body.add(box(1.1, 0.16, 0.16, 0.06, 2), '#3d5f39', [x, 1.05, zf + 0.2]);
  }
  // the door with a porch roof over it and a step, and a lamp that is off
  body.add(box(1.0, 2.0, 0.08, 0.02, 1), '#2b2b30', [cx, 1.3, zf + 0.02]);
  body.add(box(0.06, 0.06, 0.1, 0.01, 1), '#cfcfd3', [cx + 0.34, 1.3, zf + 0.08]);
  body.add(box(1.4, 0.1, 0.5, 0.02, 1), '#6a6a70', [cx, 0.35, zf + 0.3]);
  body.add(box(1.7, 0.1, 0.8, 0.02, 1), '#3d3d43', [cx, 2.5, zf + 0.4]);
  body.add(box(0.08, 0.08, 0.08, 0.01, 1), '#cfcfd3', [cx + 0.7, 2.0, zf + 0.12]);
  // a hedge along the road side of the plot with a gap for the path, the path itself and a bin by the gable
  const hz = zf + 0.75;
  for (const [x0, x1] of [[HOUSE.x0 - 0.2, cx - 0.75], [cx + 0.75, HOUSE.x1 + 0.4]]) {
    const n = Math.max(1, Math.round((x1 - x0) / 0.6));
    for (let i = 0; i < n; i++) body.add(box((x1 - x0) / n + 0.06, 0.6 + 0.08 * ((i * 7) % 3), 0.5, 0.18, 2), i % 2 ? '#35532f' : '#3d5f39', [x0 + ((i + 0.5) * (x1 - x0)) / n, 0.3, hz]);
  }
  for (let i = 0; i < 4; i++) body.add(box(0.7, 0.04, 0.34, 0.01, 1), '#8f8f95', [cx + 0.04 * ((i % 2) * 2 - 1), 0.02, zf + 0.75 + i * 0.4]);
  body.add(box(0.5, 0.9, 0.55, 0.04, 1), '#2f4a33', [xf - 0.5, 0.45, HOUSE.z0 - 0.5]);
  body.add(box(0.56, 0.08, 0.6, 0.02, 1), '#24392a', [xf - 0.5, 0.94, HOUSE.z0 - 0.5]);
  // a downpipe at the corner, the way a house looks lived in
  body.add(cylY(0.04, 2.4, 8), '#6d6d73', [xf + 0.05, 1.3, HOUSE.z1 - 0.2]);
  // the connection box on the gable wall, where the duct goes in. Its lens is a pane of its own that lights.
  body.add(box(0.1, 0.42, 0.34, 0.02, 1), '#c4c4c9', [xf + 0.05, 1.05, 0]);
  const lens = new Bag();
  lens.add(sq(0.02, 0.1, 0.2), '#fff2dc', [xf + 0.11, 1.05, 0]);
  const houseBody = new THREE.Mesh(keep(body.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.05 })));
  const houseGlass = new THREE.Mesh(keep(glass.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.3, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0 })));
  const boxLens = new THREE.Mesh(keep(lens.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0, emissive: new THREE.Color('#ffb870'), emissiveIntensity: 0 })));
  houseBody.receiveShadow = true;
  houseBody.castShadow = true;
  group.add(houseBody, houseGlass, boxLens);
  // the conduit up the gable wall from the duct to the box, lit orange as the tip climbs it
  const riserM = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.05, 0.05, 1.95, 12, 1, true)), keepM(new THREE.MeshStandardMaterial({ color: ORANGE_HEX, roughness: 0.5, metalness: 0, emissive: new THREE.Color('#ff6a18'), emissiveIntensity: 0, side: THREE.DoubleSide })));
  riserM.position.set(xf + 0.07, -0.95 + 0.975, 0);
  group.add(riserM);

  // ---- the street cabinet at the road edge, the operator's, in the specimen's greys. A plinth, a body, two doors
  // facing the road with louvres and a lock, a cap, and a light that comes on when the tip leaves it.
  const cab = new Bag();
  const cw = CAB.x1 - CAB.x0;
  const cd = CAB.z1 - CAB.z0;
  const ccx = (CAB.x0 + CAB.x1) / 2;
  const ccz = (CAB.z0 + CAB.z1) / 2;
  cab.add(box(cw + 0.12, 0.16, cd + 0.12, 0.02, 1), '#4a4a50', [ccx, 0.08, ccz]);
  cab.add(box(cw, CAB.h - 0.2, cd, 0.03, 1), '#8f9096', [ccx, 0.16 + (CAB.h - 0.2) / 2, ccz]);
  cab.add(box(cw + 0.1, 0.1, cd + 0.1, 0.03, 1), '#6c6d73', [ccx, CAB.h - 0.04, ccz]);
  const fz = CAB.z1 + 0.012;
  for (const dx of [-0.245, 0.245]) cab.add(box(0.47, CAB.h - 0.42, 0.03, 0.01, 1), '#9fa0a6', [ccx + dx, 0.22 + (CAB.h - 0.42) / 2, fz]);
  cab.add(box(0.012, CAB.h - 0.42, 0.045, 0.002, 1), '#4a4a50', [ccx, 0.22 + (CAB.h - 0.42) / 2, fz + 0.004]);
  for (let i = 0; i < 6; i++) for (const dx of [-0.245, 0.245]) cab.add(box(0.36, 0.014, 0.04, 0.002, 1), '#55565c', [ccx + dx, CAB.h - 0.42 + 0.02 - i * 0.045, fz + 0.012]);
  cab.add(box(0.05, 0.12, 0.05, 0.01, 1), '#cfcfd3', [ccx + 0.06, 0.8, fz + 0.03]);
  cab.add(box(0.2, 0.11, 0.012, 0.002, 1), '#2b2b30', [ccx - 0.245, 0.62, fz + 0.016]);
  cab.add(box(0.15, 0.02, 0.014, 0.002, 1), '#b5b6bb', [ccx - 0.245, 0.64, fz + 0.02]);
  cab.add(box(0.15, 0.02, 0.014, 0.002, 1), '#b5b6bb', [ccx - 0.245, 0.6, fz + 0.02]);
  const cabM = new THREE.Mesh(keep(cab.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 })));
  cabM.castShadow = true;
  cabM.receiveShadow = true;
  group.add(cabM);
  const led = new Bag();
  led.add(sq(0.06, 0.04, 0.012), '#fff2dc', [ccx + 0.38, CAB.h - 0.3, fz + 0.03]);
  const ledM = new THREE.Mesh(keep(led.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: new THREE.Color('#ffb870'), emissiveIntensity: 0 })));
  group.add(ledM);

  // ---- the stakes along the route, a thin pole and a flag, each one pops up as the route is drawn past it
  const pinB = new Bag();
  pinB.add(cylY(0.012, 0.8, 8), '#eeeef2', [0, 0.4, 0]);
  pinB.add(box(0.2, 0.12, 0.01, 0.003, 1), '#f4f4f6', [0.11, 0.74, 0]);
  pinB.add(cylY(0.04, 0.02, 12), '#d8d8dc', [0, 0.01, 0]);
  const pins = new THREE.InstancedMesh(keep(pinB.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 })), PINS.length);
  pins.frustumCulled = false;
  pins.visible = false;
  group.add(pins);
  const _m = new THREE.Matrix4();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  let lastPins = '';
  const outBack = (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  const sm = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  return {
    group,
    update(p, routeS) {
      // ducts
      const len = DUCT_X0 - p.ductX;
      const ductOn = len > 0.02 && p.fillX > X_T0 - 0.35;
      green.visible = orange.visible = ductOn;
      green.scale.x = orange.scale.x = Math.max(0.001, len);
      glowU.tip.value = p.tipX;
      // the orange duct is lit behind the tip once the tip is in the trench
      glowU.glow.value = sm(ROUTE_LEG, ROUTE_LEG + 0.4, p.tipS);
      // the sand
      sand.visible = p.sandOn > 0.002;
      sandU.uFade.value = p.sandOn;
      sandU.uSandX.value = p.sandX;
      // the lit tip on the lead along the ground, down into the trench, along the duct and up the conduit, the
      // light on the cabinet and the connection box on the wall
      const dive = sm(ROUTE_LEG, ROUTE_LEG + 0.9, p.tipS);
      const onLead = p.tipS <= ROUTE_LEG;
      glowPos[0] = onLead ? LEAD_X : Math.max(DUCT_X1, p.tipX);
      glowPos[1] = (1 - dive) * 0.04 + dive * ORANGE.y + p.riser * (1.05 - ORANGE.y) * dive;
      glowPos[2] = onLead ? ROUTE_LEG - p.tipS : ORANGE.z * dive * (1 - p.riser);
      if (p.riser > 0) glowPos[0] = DUCT_X1 + (HOUSE.x1 + 0.07 - DUCT_X1) * sm(0, 0.3, p.riser);
      glowA[0] = p.tipOn * 0.95;
      glowS[0] = 26 * pxK.v;
      glowPos[3] = CAB.x0 + 0.88;
      glowPos[4] = CAB.h - 0.3;
      glowPos[5] = CAB.z1 + 0.05;
      glowA[1] = p.led * 0.8;
      glowS[1] = 22 * pxK.v;
      glowPos[6] = HOUSE.x1 + 0.14;
      glowPos[7] = 1.05;
      glowPos[8] = 0;
      glowA[2] = p.box * 0.9;
      glowS[2] = 34 * pxK.v;
      glow.visible = glowA[0] > 0.01 || glowA[1] > 0.01 || glowA[2] > 0.01;
      (glowG.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (glowG.attributes.aA as THREE.BufferAttribute).needsUpdate = true;
      (glowG.attributes.aS as THREE.BufferAttribute).needsUpdate = true;
      // the windows light warm, the box on the wall, the light on the cabinet, the conduit as the tip climbs it
      (houseGlass.material as THREE.MeshStandardMaterial).emissiveIntensity = p.windows * 2.2;
      (boxLens.material as THREE.MeshStandardMaterial).emissiveIntensity = p.box * 2.6;
      (ledM.material as THREE.MeshStandardMaterial).emissiveIntensity = p.led * 2.4;
      (riserM.material as THREE.MeshStandardMaterial).emissiveIntensity = p.riser * 2;
      // the stubs at the cut edge
      const so = Math.min(1, Math.max(0, (p.notch - 0.75) / 0.25));
      const sg = so * so * (3 - 2 * so);
      for (const m of stubs) {
        m.visible = sg > 0.001;
        m.scale.z = Math.max(0.001, 0.28 * sg);
      }
      // the stakes along the marked line, each pops up as the route is drawn past it and goes with the plan
      const key = `${routeS.toFixed(3)}|${p.plan.toFixed(3)}`;
      if (key !== lastPins) {
        lastPins = key;
        let any = false;
        for (let i = 0; i < PINS.length; i++) {
          const t = Math.min(1, Math.max(0, (routeS - PINS[i].s + 0.25) / 0.7));
          const s = (t <= 0 ? 0 : outBack(t)) * p.plan;
          any = any || s > 0.01;
          _p.set(PINS[i].x, 0, PINS[i].z);
          _s.set(1, Math.max(0.0001, s), 1);
          _m.compose(_p, _q.identity(), _s);
          pins.setMatrixAt(i, _m);
        }
        pins.instanceMatrix.needsUpdate = true;
        pins.visible = any;
      }
    },
    setScreen(d) {
      pxK.v = Math.max(1, d);
      sandU.uPx.value = 2.2 * Math.max(1, d);
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      pins.dispose();
    },
  };
}
