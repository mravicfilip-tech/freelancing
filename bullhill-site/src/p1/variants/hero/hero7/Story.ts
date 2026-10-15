// Everything of hero 7 that is not the ground, the machine or the spoil. The sand that is poured, the five
// ducts that unroll along the trench floor, the lit tip that runs the orange duct and the strands that
// come out of it at the chamber, the house at the end of the route with its windows, the chamber's collar
// and the stakes along the route. All of it is set from the pose, so every frame at p is the same frame.
// Each piece is one draw call and is hidden while it has nothing to show, so the frame cost stays low.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Bag, box, cylY, prism, sq, type V3 } from './geo';
import { PALETTE } from '../hero6/acts';
import { rng } from '../hero6/geometry';
import { D, DUCTS, DUCT_R, DUCT_X0, DUCT_X1, EDGE, HOUSE, ORANGE, PINS, PIN_Z, PIT, SAND, X_CUT, X_T0, type Pose } from './world';

const GREEN = '#37864f';
const ORANGE_HEX = '#c9531f';

// ---- the ducts, open tubes along x from 0 back to -1, scaled in x so they unroll from the street end
function ductGeometry(orange: boolean) {
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
  return mergeGeometries(list)!;
}

// ---- the sand that is poured, a curtain of grains that falls and settles on the floor of the trench
const SAND_VERT = /* glsl */ `
attribute vec3 aSeed;
attribute vec3 aCol;
uniform float uSandX;
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
  vA = f > 0.0 ? 1.0 - smoothstep(0.0, 1.0, (x - uSandX - 0.8) / 1.2) * 0.8 : 0.0;
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

// ---- the lit tip and the strands' tips, soft glows added over the scene
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

// ---- the strands, thin tubes with their own distance along them, drawn as far as they have come out
const STRAND_VERT = /* glsl */ `
attribute float aT;
varying float vT;
void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const STRAND_FRAG = /* glsl */ `
uniform float uGrow;
varying float vT;
void main() {
  if (vT > uGrow) discard;
  float head = smoothstep(uGrow - 0.22, uGrow, vT);
  vec3 c = mix(vec3(0.82, 0.83, 0.8), vec3(2.2, 2.0, 1.7), head);
  gl_FragColor = vec4(c, 1.0);
}
`;

const N_STRANDS = 9;
const STRAND_SAMPLES = 48;

export type StoryRig = {
  group: THREE.Group;
  // set from the pose and the route's draw, the front's x
  update(p: Pose, routeX: number): void;
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

  // the ends of the ducts where the route crosses the front edge, short stubs standing out of the cut face, the
  // same tubes with open bores, plain, no glow. They grow out of the face as the cut finishes.
  const stubs = [new THREE.Mesh(keep(ductGeometry(false)), ductMat(false, false)), new THREE.Mesh(keep(ductGeometry(true)), ductMat(true, false))];
  for (const m of stubs) {
    m.position.set(EDGE.x + 0.28, 0, 0);
    m.scale.x = 0.001;
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
  const sandU = { uSandX: { value: 99 }, uPx: { value: 2.2 * Math.max(1, dpr) } };
  const sand = new THREE.Points(sandG, keepM(new THREE.ShaderMaterial({ vertexShader: SAND_VERT, fragmentShader: DOT_FRAG, uniforms: sandU, transparent: true, depthWrite: false })));
  sand.frustumCulled = false;
  sand.renderOrder = 2;
  sand.visible = false;
  group.add(sand);

  // ---- the strands, out of the mouth of the orange duct into the chamber
  const paths: Float32Array[] = [];
  const strandG = (() => {
    const r = rng(41);
    const list: THREE.BufferGeometry[] = [];
    const x0 = DUCT_X1;
    for (let i = 0; i < N_STRANDS; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * (DUCT_R - 0.035);
      const oy = Math.sin(a) * rad;
      const oz = Math.cos(a) * rad;
      const fan = (r() - 0.5) * 0.5;
      const side = (r() - 0.5) * 0.5;
      const reach = 0.5 + r() * 0.35;
      const lift = 0.3 + r() * 0.3;
      const pts = [
        new THREE.Vector3(x0 + 1.1, ORANGE.y + oy, ORANGE.z + oz),
        new THREE.Vector3(x0 + 0.25, ORANGE.y + oy * 0.9, ORANGE.z + oz * 0.9),
        new THREE.Vector3(x0 - 0.12, ORANGE.y + oy * 0.8 + 0.03, ORANGE.z + oz * 0.8 + side * 0.08),
        new THREE.Vector3(x0 - reach * 0.55, ORANGE.y + lift * 0.45, ORANGE.z + side * 0.5),
        new THREE.Vector3(x0 - reach, ORANGE.y + lift, ORANGE.z + side + fan * 0.3),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
      const tube = new THREE.TubeGeometry(curve, 40, 0.017, 5, false);
      const nv = tube.attributes.position.count;
      const aT = new Float32Array(nv);
      const per = 5 + 1;
      for (let v = 0; v < nv; v++) aT[v] = Math.floor(v / per) / 40;
      tube.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
      tube.deleteAttribute('normal');
      tube.deleteAttribute('uv');
      list.push(tube);
      const sp = curve.getSpacedPoints(STRAND_SAMPLES);
      const arr = new Float32Array((STRAND_SAMPLES + 1) * 3);
      sp.forEach((v, k) => arr.set([v.x, v.y, v.z], k * 3));
      paths.push(arr);
    }
    return keep(mergeGeometries(list)!);
  })();
  const strandU = { uGrow: { value: 0 } };
  const strands = new THREE.Mesh(strandG, keepM(new THREE.ShaderMaterial({ vertexShader: STRAND_VERT, fragmentShader: STRAND_FRAG, uniforms: strandU, side: THREE.DoubleSide })));
  strands.frustumCulled = false;
  strands.visible = false;
  group.add(strands);

  // ---- the glows, the lit tip and the tip of every strand
  const nGlow = 1 + N_STRANDS;
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

  // ---- the house, a simple clean house in the greys of the specimen. Walls, a plinth, a gable roof, a
  // chimney, window frames and a door, one mesh. The glass is another, and lit by its emissive.
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
  // windows on the street side and the long side, a frame and a pane each
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
  // the door on the long side
  body.add(box(1.0, 2.0, 0.08, 0.02, 1), '#2b2b30', [cx, 1.3, zf + 0.02]);
  body.add(box(0.06, 0.06, 0.1, 0.01, 1), '#cfcfd3', [cx + 0.34, 1.3, zf + 0.08]);
  body.add(box(1.4, 0.1, 0.5, 0.02, 1), '#6a6a70', [cx, 0.35, zf + 0.3]);
  // the pipe up the wall at the chamber end, where the duct goes in
  body.add(cylY(0.07, 1.0, 10), ORANGE_HEX, [xf + 0.06, 0.35, 0]);
  const houseBody = new THREE.Mesh(keep(body.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.05 })));
  const houseGlass = new THREE.Mesh(keep(glass.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.3, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0 })));
  houseBody.receiveShadow = true;
  const planeIn = new THREE.Plane(new THREE.Vector3(1, 0, 0), 99);
  (houseBody.material as THREE.Material).clippingPlanes = [planeIn];
  (houseGlass.material as THREE.Material).clippingPlanes = [planeIn];
  // the house as a drawing, its edges, until the route reaches it
  const wire = (() => {
    const { x0, x1, z0, z1 } = HOUSE;
    const yb = 0.1;
    const yt = HOUSE.h + 0.1;
    const yr = yt + HOUSE.ridge;
    const e = 0.35;
    const v: number[] = [];
    const seg = (a: V3, b: V3) => v.push(...a, ...b);
    // the walls, the floor and the eaves, the corners between them
    const c = (y: number): V3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
    for (const y of [yb, yt]) {
      const q = c(y);
      for (let i = 0; i < 4; i++) seg(q[i], q[(i + 1) % 4]);
    }
    for (let i = 0; i < 4; i++) seg(c(yb)[i], c(yt)[i]);
    // the roof, the ridge, the eaves with their overhang and the two gables
    seg([x0 - e, yr, 0], [x1 + e, yr, 0]);
    seg([x0 - e, yt, z0 - e], [x1 + e, yt, z0 - e]);
    seg([x0 - e, yt, z1 + e], [x1 + e, yt, z1 + e]);
    for (const x of [x0 - e, x1 + e]) {
      seg([x, yt, z0 - e], [x, yr, 0]);
      seg([x, yt, z1 + e], [x, yr, 0]);
      seg([x, yt, z0 - e], [x, yt, z1 + e]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  })();
  const edges = new THREE.LineSegments(keep(wire), keepM(new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })));
  const planeOut = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -99);
  (edges.material as THREE.Material).clippingPlanes = [planeOut];
  houseBody.visible = false;
  houseGlass.visible = false;
  edges.visible = false;
  group.add(houseBody, houseGlass, edges);

  // ---- the chamber's collar, a low concrete frame round the pit
  const collar = new Bag();
  const pw = PIT.x1 - PIT.x0;
  const pcx = (PIT.x0 + PIT.x1) / 2;
  collar.add(box(pw + 0.3, 0.1, 0.16, 0.03, 1), '#6e6e73', [pcx, 0.05, PIT.hw + 0.05]);
  collar.add(box(pw + 0.3, 0.1, 0.16, 0.03, 1), '#6e6e73', [pcx, 0.05, -PIT.hw - 0.05]);
  collar.add(box(0.16, 0.1, PIT.hw * 2 + 0.3, 0.03, 1), '#6e6e73', [PIT.x0 - 0.05, 0.05, 0]);
  collar.add(box(0.16, 0.1, PIT.hw * 2 + 0.3, 0.03, 1), '#6e6e73', [PIT.x1 + 0.05, 0.05, 0]);
  const collarM = new THREE.Mesh(keep(collar.build()), keepM(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 })));
  collarM.visible = false;
  collarM.receiveShadow = true;
  group.add(collarM);
  // the cover, lowered on the chamber once the surface is back, a slab on the collar
  const lidM = new THREE.Mesh(keep(box(pw + 0.3, 0.04, PIT.hw * 2 + 0.3, 0.012, 1)), keepM(new THREE.MeshStandardMaterial({ color: '#5e5e64', roughness: 0.8, metalness: 0.05 })));
  lidM.position.x = pcx;
  lidM.visible = false;
  lidM.receiveShadow = true;
  group.add(lidM);

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
    update(p, routeX) {
      // ducts
      const len = DUCT_X0 - p.ductX;
      const ductOn = len > 0.02 && p.fillX > X_T0 - 0.35;
      green.visible = orange.visible = ductOn;
      green.scale.x = orange.scale.x = Math.max(0.001, len);
      glowU.tip.value = p.tipX;
      glowU.glow.value = p.tipOn > 0 || p.tipX <= DUCT_X1 + 0.01 ? 1 : 0;
      // the sand
      sand.visible = p.sandOn > 0;
      sandU.uSandX.value = p.sandX;
      // the strands and the glows
      const open = p.lid < 0.55;
      strands.visible = p.strand > 0.001 && open;
      strandU.uGrow.value = p.strand;
      glow.visible = (p.tipOn > 0.01 || p.strand > 0.001) && open;
      glowPos[0] = p.tipX;
      glowPos[1] = ORANGE.y;
      glowPos[2] = ORANGE.z;
      glowA[0] = p.tipOn * (1 - p.strand * 0.6);
      glowS[0] = 26 * pxK.v;
      for (let i = 0; i < N_STRANDS; i++) {
        const path = paths[i];
        const f = Math.min(p.strand, 1) * STRAND_SAMPLES;
        const k = Math.min(STRAND_SAMPLES - 1, Math.floor(f));
        const w = f - k;
        for (let c = 0; c < 3; c++) glowPos[(1 + i) * 3 + c] = path[k * 3 + c] * (1 - w) + path[(k + 1) * 3 + c] * w;
        glowA[1 + i] = p.strand > 0.02 ? 0.85 * sm(0, 0.15, p.strand) : 0;
        glowS[1 + i] = 16 * pxK.v;
      }
      (glowG.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (glowG.attributes.aA as THREE.BufferAttribute).needsUpdate = true;
      (glowG.attributes.aS as THREE.BufferAttribute).needsUpdate = true;
      // the house, rendered from the street side as the route reaches it, the drawing wiped away as it comes
      const rev = p.houseX < HOUSE.x1 + 0.099;
      houseBody.visible = houseGlass.visible = rev;
      planeIn.constant = -p.houseX;
      planeOut.constant = p.houseX;
      edges.visible = p.houseX > HOUSE.x0 - 0.19 && routeX < HOUSE.x1 + 0.4;
      (houseGlass.material as THREE.MeshStandardMaterial).emissiveIntensity = p.windows * 2.2;
      // the stubs at the front edge
      const so = Math.min(1, Math.max(0, (p.notch - 0.75) / 0.25));
      const sg = so * so * (3 - 2 * so);
      for (const m of stubs) {
        m.visible = sg > 0.001;
        m.scale.x = Math.max(0.001, 0.28 * sg);
      }
      // the chamber's collar
      collarM.visible = p.pit > 0.02;
      collarM.scale.y = 0.2 + 0.8 * p.pit * (1 - 0.9 * p.lid);
      lidM.visible = p.lid > 0.001;
      lidM.position.y = 0.048 + 0.6 * (1 - p.lid) * (1 - p.lid);
      // the stakes
      const key = routeX.toFixed(3);
      if (key !== lastPins) {
        lastPins = key;
        let any = false;
        for (let i = 0; i < PINS.length; i++) {
          const t = Math.min(1, Math.max(0, (PINS[i] + 0.25 - routeX) / 0.7));
          const s = t <= 0 ? 0 : outBack(t);
          any = any || s > 0.01;
          _p.set(PINS[i], 0, PIN_Z);
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
