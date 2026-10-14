// The route of hero 7, one ground mesh and one points draw. Ahead of the seam the ground is the
// schematic, white hairlines, station ticks and a stipple of dots on the page's own black. Behind it the
// same triangles are the render, the specimen's asphalt and soil, lit, with the trench cut into it and
// the spoil heaped beside it. The choice is made per fragment from the world x of the fragment against
// uSeam, so it is one pass and the scene is never drawn twice. The trench and the heap are one height
// field in the vertex shader, cut from the front xf the dig has reached and grown from how far each
// dump has got, so the mesh is built once and p only moves a few uniforms. The ground takes the key
// light's shadow map, the machine's shadow falls on the verge, into the trench and over the heap.

import * as THREE from 'three';
import { rng } from '../hero6/geometry';
import { makeGround } from '../hero6/textures';
import { CYCLES, D, DUMPX, HALF_W, KEY_Y, heapAmp, MZ, PILE_Z, ROAD_W, ROAD_Z, SHOULDER, X_END, X_T0, camDirs, type Pose, type V3 } from './world';

const HEAP_H = 0.85; // the height of a mound
const HEAP_RX = 1.9; // its half length along the route
const HEAP_RZ = 1.25; // and half width

const FIELD_GLSL = /* glsl */ `
uniform float uFront;
uniform float uX0;
uniform float uDepth;
uniform float uHalfW;
uniform float uShoulder;
uniform float uPileZ;
uniform float uHeapX[${CYCLES}];
uniform float uHeapA[${CYCLES}];
float trenchDepth(vec2 q) {
  float wz = 1.0 - smoothstep(uHalfW, uHalfW + uShoulder, abs(q.y));
  float wx = smoothstep(uX0, uX0 + 0.3, q.x) * (1.0 - smoothstep(uFront - 0.4, uFront + 0.2, q.x));
  float amp = clamp((uFront - uX0) / 0.6, 0.0, 1.0);
  return uDepth * wz * wx * amp;
}
// the spoil, one mound a dump, each as tall as its dump has got
float heapHeight(vec2 q) {
  float h = 0.0;
  for (int i = 0; i < ${CYCLES}; i++) {
    float dx = (q.x - uHeapX[i]) / ${HEAP_RX.toFixed(2)};
    float dz = (q.y - uPileZ) / ${HEAP_RZ.toFixed(2)};
    float r2 = dx * dx + dz * dz;
    h += uHeapA[i] * ${HEAP_H.toFixed(2)} * pow(max(1.0 - r2, 0.0), 1.5);
  }
  return h;
}
float field(vec2 q) {
  return heapHeight(q) - trenchDepth(q);
}
`;

const VERT = /* glsl */ `
#include <common>
#include <shadowmap_pars_vertex>
${FIELD_GLSL}
varying vec3 vW;
varying vec3 vN;
varying float vD;
varying float vH;
void main() {
  vec3 p = position;
  float h = field(p.xz);
  p.y = h;
  float e = 0.05;
  float hx = field(p.xz + vec2(e, 0.0)) - field(p.xz - vec2(e, 0.0));
  float hz = field(p.xz + vec2(0.0, e)) - field(p.xz - vec2(0.0, e));
  vN = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
  vW = p;
  vD = trenchDepth(p.xz);
  vH = heapHeight(p.xz);
  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  #include <shadowmap_vertex>
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <shadowmap_pars_fragment>
uniform sampler2D uSoil;
uniform sampler2D uAsph;
uniform float uSeam;
uniform float uFront;
uniform float uDpr;
uniform float uRoadZ;
uniform float uRoadW;
uniform float uAoDepth;
uniform float uHalfW;
uniform float uShoulder;
uniform float uX0;
uniform vec2 uMach;
uniform vec3 uKey;
uniform vec3 uRim;
varying vec3 vW;
varying vec3 vN;
varying float vD;
varying float vH;

float ln(float c, float v, float fw) {
  float w = max(1.0, uDpr) * fw;
  return 1.0 - smoothstep(0.35 * w, 0.9 * w + 1e-5, abs(c - v));
}
// the swatch twice, at two scales turned against each other, so its tile does not show, and pulled a
// little towards its mean so the big blotches stay quiet
vec3 swatch(vec2 uv) {
  vec3 a = texture2D(uSoil, uv).rgb;
  vec2 v = vec2(uv.x * 0.8 - uv.y * 0.6, uv.x * 0.6 + uv.y * 0.8) * 0.37 + vec2(0.31, 0.17);
  vec3 b = texture2D(uSoil, v).rgb;
  // a third turn at a third scale, so three tiles average and no one tile's blotch is left to read
  vec2 w = vec2(uv.x * 0.6 + uv.y * 0.8, uv.y * 0.6 - uv.x * 0.8) * 1.7 + vec2(0.57, 0.83);
  vec3 d = texture2D(uSoil, w).rgb;
  vec3 c = a * 0.4 + b * 0.3 + d * 0.3;
  return mix(vec3(dot(c, vec3(0.333))), c, 0.7) * 0.85;
}
vec3 soilAt(vec3 w, vec3 n) {
  vec3 b = pow(abs(n), vec3(6.0));
  b /= (b.x + b.y + b.z);
  return swatch(vec2(w.z / 2.6, w.y / 1.3)) * b.x + swatch(vec2(w.x / 2.6, w.z / 1.3)) * b.y + swatch(vec2(w.x / 2.6, w.y / 1.3)) * b.z;
}

void main() {
  float fwx = fwidth(vW.x);
  float fwz = fwidth(vW.z);
  float dist = length(vW.xz - cameraPosition.xz);
  float far = 1.0 - smoothstep(60.0, 120.0, dist);
  float sl = (1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, abs(vW.x - uSeam))) * (1.0 - smoothstep(22.0, 55.0, dist));

  if (vW.x < uSeam) {
    // the render
    vec3 n = normalize(vN);
    float road = smoothstep(uRoadZ - 0.02, uRoadZ + 0.02, vW.z);
    float kerb = 1.0 - smoothstep(0.0, 0.03, abs(vW.z - uRoadZ + 0.07) - 0.07);
    vec3 soil = soilAt(vW, n);
    vec3 asph = texture2D(uAsph, vec2(vW.x / 2.6, vW.z / 1.3)).rgb;
    float inside = smoothstep(0.03, 0.25, vD);
    vec3 alb = mix(soil * vec3(0.78, 0.76, 0.74), asph * 1.25, road);
    alb = mix(alb, vec3(0.2, 0.2, 0.21), kerb);
    // the walls and floor of the cut, darker the deeper, the soil under the verge's top layer. The spoil is
    // fresh, a touch lighter on top and darker where it meets the verge.
    float ao = mix(1.0, 0.1, smoothstep(0.12, uAoDepth * 0.95, vD));
    float heap = smoothstep(0.02, 0.2, vH);
    // the cut shows its layers, a dark topsoil over the paler subsoil, so the walls read against the verge
    float layer = smoothstep(-0.22, -0.4, vW.y) * (1.0 - smoothstep(-0.55, -0.95, vW.y));
    alb = mix(alb, soil * vec3(1.5, 1.34, 1.12), layer * inside);
    alb *= mix(1.0, 0.7, inside) * ao;
    alb *= mix(1.0, 0.78 + 0.4 * smoothstep(0.0, 0.8, vH), heap);
    float sh = 1.0;
#if defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 )
    sh = getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
#endif
    // the near lip shades the cut. The key comes in over it, so the far wall is dark and the sun only
    // reaches the part of the floor nearest the near wall.
    float lipW = uHalfW + 0.5 * uShoulder;
    float lipSh = smoothstep(0.0, 0.18, vD - max(lipW - vW.z, 0.0) * (uKey.y / max(uKey.z, 0.05)));
    sh = min(sh, 1.0 - lipSh * smoothstep(0.1, 0.3, vD));
    // the shadow never takes the key quite away, the sky is still there
    sh = 0.2 + 0.8 * sh;
    float ndl = max(dot(n, uKey), 0.0);
    float ndr = max(dot(n, uRim), 0.0);
    vec3 col = alb * (vec3(0.2, 0.2, 0.22) * mix(1.0, 0.8, 1.0 - sh) * mix(1.0, 0.45, inside) + vec3(1.0, 0.94, 0.88) * 1.7 * ndl * sh + vec3(0.8) * 0.5 * ndr);
    // a little bounce inside the cut, off the lit floor and the soil round it
    col += alb * vec3(0.5, 0.42, 0.36) * 0.1 * inside * (1.0 - ao);
    // a low red bounce from the glow behind the route, grazing the surface
    col += vec3(0.82, 0.04, 0.07) * 0.035 * (1.0 - n.y * 0.6) * alb.r * 6.0;
    // the machine's contact shade, a rounded box under the tracks
    vec2 q = abs(vW.xz - uMach) - vec2(1.9, 1.15);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    col *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.8, sd));
    // the ground falls off round the machine, so the eye stays on it and the far verge sinks into the page
    col *= mix(1.0, 0.3, smoothstep(9.0, 40.0, length(vW.xz - uMach)));
    // the road's centre line, long dashes in a pale grey
    float rline = ln(vW.z, uRoadZ + uRoadW * 0.5, fwz) * step(fract(vW.x / 3.2), 0.5) * road;
    col = mix(col, vec3(0.62), rline * 0.6);
    // a faint lift where the render begins, so the seam reads as an edge being drawn
    col += vec3(0.06) * exp(-(uSeam - vW.x) / 0.5);
    // the route, marked out on the ground in white paint where the trench is still to be cut
    float marked = step(uFront + 0.35, vW.x) * step(uX0, vW.x) * (1.0 - road);
    float paint = ln(vW.z, -uHalfW, fwz) + ln(vW.z, uHalfW, fwz) + ln(vW.z, 0.0, fwz) * step(fract(vW.x / 0.7), 0.58);
    col = mix(col, vec3(0.92), clamp(paint, 0.0, 1.0) * 0.5 * marked);
#ifdef TONE_MAPPING
    col = toneMapping(col);
#endif
    col = linearToOutputTexel(vec4(col, 1.0)).rgb;
    col = mix(col, vec3(1.0), sl * 0.95);
    gl_FragColor = vec4(col, far);
  } else {
    // the plan, hairlines only, the page's black shows through
    float a = 0.0;
    // the trench's two edges and the route line down its middle, dashed
    a = max(a, 0.95 * ln(vW.z, -uHalfW, fwz));
    a = max(a, 0.95 * ln(vW.z, uHalfW, fwz));
    float dash = step(fract(vW.x / 0.7), 0.58);
    a = max(a, 0.9 * ln(vW.z, 0.0, fwz) * dash);
    // stations, a tick across the route every two metres and a longer one every ten
    float st = abs(mod(vW.x + 1.0, 2.0) - 1.0);
    float tk = 1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, st);
    float st10 = abs(mod(vW.x + 5.0, 10.0) - 5.0);
    float tk10 = 1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, st10);
    a = max(a, 0.8 * tk * step(abs(vW.z), 1.15));
    a = max(a, 0.8 * tk10 * step(abs(vW.z), 2.3));
    // the road's kerb and far edge, and two lines under the road as dashed hairlines
    a = max(a, 0.95 * ln(vW.z, uRoadZ, fwz));
    a = max(a, 0.95 * ln(vW.z, uRoadZ + uRoadW, fwz));
    float d2 = step(fract(vW.x / 0.5), 0.5);
    a = max(a, 0.45 * ln(vW.z, uRoadZ + 1.3, fwz) * d2);
    a = max(a, 0.45 * ln(vW.z, uRoadZ + 2.7, fwz) * d2);
    // and on the far verge, the boundary of the plot and a service line, long dashes
    float d3 = step(fract(vW.x / 1.6), 0.7);
    a = max(a, 0.4 * ln(vW.z, -5.2, fwz) * d3);
    a = max(a, 0.28 * ln(vW.z, -9.6, fwz));
    a = max(a, 0.22 * ln(vW.z, -15.0, fwz) * step(fract(vW.x / 3.0), 0.8));
    a = max(a, 0.18 * ln(vW.z, -22.0, fwz));
    a = max(a, sl * 0.95);
    a = max(a, 0.22 * exp(-(vW.x - uSeam) / 0.35) * step(uSeam, vW.x));
    a *= far;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0), a);
  }
}
`;

// ---- the grid, fine where the trench is cut and the spoil lies, coarse elsewhere
function axis(spans: [number, number, number][]) {
  const out: number[] = [];
  for (const [a, b, s] of spans) {
    const n = Math.max(1, Math.round((b - a) / s));
    for (let i = 0; i < n; i++) out.push(a + ((b - a) * i) / n);
  }
  out.push(spans[spans.length - 1][1]);
  return out;
}

function gridGeometry() {
  const xs = axis([[-36, -2, 1.7], [-2, 17, 0.12], [17, 66, 1.6]]);
  const zs = axis([[-150, -40, 10], [-40, -12, 3], [-12, -4.2, 0.8], [-4.2, -1.3, 0.1], [-1.3, 1.3, 0.06], [1.3, 3.5, 0.3], [3.5, 12, 1], [12, 42, 5]]);
  const nx = xs.length;
  const nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) pos.set([xs[i], 0, zs[j]], (j * nx + i) * 3);
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let k = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      // wound so the face looks up
      idx.set([a, c, b, b, c, d], k);
      k += 6;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(10, 0, 0), 160);
  return g;
}

// ---- the stipple, dots on the ground ahead of the seam, in one points draw. A soft disc sprite, a
// constant size in pixels, the way hero 6's schematic draws its dots.
const DOT_VERT = /* glsl */ `
attribute float aS;
uniform float uSeam;
uniform float uPx;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = length(position.xz - cameraPosition.xz);
  vA = smoothstep(uSeam + 0.05, uSeam + 0.4, position.x) * (1.0 - smoothstep(60.0, 115.0, d));
  gl_PointSize = vA > 0.002 ? uPx * (0.8 + aS * 0.5) : 0.0;
}
`;
const DOT_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
varying float vA;
void main() {
  float a = texture2D(uMap, gl_PointCoord).a * vA * uOpacity;
  if (a < 0.05) discard;
  gl_FragColor = vec4(1.0, 1.0, 1.0, a);
}
`;

function dotPositions() {
  const r = rng(71);
  const pts: number[] = [];
  const sizes: number[] = [];
  const field = (x0: number, x1: number, z0: number, z1: number, step: number) => {
    for (let z = z0; z < z1; z += step) {
      for (let x = x0; x < x1; x += step) {
        pts.push(x + (r() - 0.5) * step * 0.9, 0.012, z + (r() - 0.5) * step * 0.9);
        sizes.push(r());
      }
    }
  };
  // thick over the trench's corridor, thinner on the verge and the road, and a wide sparse field out
  // to the far verge so the plan fills the upper part of the frame
  field(X_T0, X_END, -HALF_W - 0.5, HALF_W + 0.5, 0.15);
  field(X_T0, X_END, -4.5, -HALF_W - 0.5, 0.42);
  field(X_T0, X_END, HALF_W + 0.5, ROAD_Z, 0.35);
  field(X_T0, X_END, ROAD_Z, ROAD_Z + ROAD_W, 0.42);
  field(X_T0, X_END, ROAD_Z + ROAD_W, 9.5, 0.6);
  field(X_T0, X_END, -14, -4.5, 0.8);
  field(X_T0, X_END, -34, -14, 1.6);
  return { pts: new Float32Array(pts), sizes: new Float32Array(sizes) };
}

export type GroundRig = {
  group: THREE.Group;
  mesh: THREE.Mesh;
  set(p: Pose): void;
  setScreen(dpr: number): void;
  dispose(): void;
};

export function buildGround(dpr: number): GroundRig {
  const soil = makeGround('backfill');
  const asph = makeGround('asphalt');
  const { c, r } = camDirs();
  // the key from the upper left and in front of the camera, the rim from behind and to the right
  const norm = (v: V3): V3 => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const key = norm([-r[0] * 3 + c[0] * 8, KEY_Y, -r[2] * 3 + c[2] * 8]);
  const rim = norm([-c[0] * 8 + r[0] * 4, 4, -c[2] * 8 + r[2] * 4]);

  const heapX = new Float32Array(CYCLES);
  heapX.set(DUMPX);
  const heapA = new Float32Array(CYCLES);
  const u = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
    uFront: { value: X_T0 },
    uX0: { value: X_T0 },
    uDepth: { value: D },
    uHalfW: { value: HALF_W },
    uShoulder: { value: SHOULDER },
    uAoDepth: { value: D },
    uSeam: { value: X_T0 },
    uDpr: { value: dpr },
    uRoadZ: { value: ROAD_Z },
    uRoadW: { value: ROAD_W },
    uPileZ: { value: PILE_Z },
    uHeapX: { value: heapX },
    uHeapA: { value: heapA },
    uMach: { value: new THREE.Vector2(0, MZ) },
    uKey: { value: new THREE.Vector3(...key) },
    uRim: { value: new THREE.Vector3(...rim) },
    uSoil: { value: soil.map },
    uAsph: { value: asph.map },
  };
  const geo = gridGeometry();
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: true, lights: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  mesh.receiveShadow = true;

  // the stipple
  const dots = dotPositions();
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dots.pts, 3));
  dg.setAttribute('aS', new THREE.BufferAttribute(dots.sizes, 1));
  const tex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const x = cv.getContext('2d')!;
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(cv);
  })();
  const du = { uSeam: u.uSeam, uPx: { value: 2 * Math.max(1, dpr) }, uMap: { value: tex }, uOpacity: { value: 0.75 } };
  const dmat = new THREE.ShaderMaterial({ vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, uniforms: du, transparent: true, depthWrite: false });
  const points = new THREE.Points(dg, dmat);
  points.frustumCulled = false;
  points.renderOrder = 1;

  const group = new THREE.Group();
  group.add(mesh, points);
  return {
    group,
    mesh,
    set(p) {
      u.uSeam.value = p.seam;
      u.uFront.value = p.xf;
      u.uMach.value.x = p.xm;
      // a mound grows as its dump goes, after the first of the soil has left the bucket
      for (let i = 0; i < CYCLES; i++) {
        heapA[i] = heapAmp(p.dump[i]);
      }
    },
    setScreen(d) {
      u.uDpr.value = d;
      du.uPx.value = 2 * Math.max(1, d);
    },
    dispose() {
      geo.dispose();
      dg.dispose();
      mat.dispose();
      dmat.dispose();
      tex.dispose();
      for (const t of [soil.map, soil.bump, asph.map, asph.bump]) t.dispose();
    },
  };
}
