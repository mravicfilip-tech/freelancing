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
import { CYCLES, D, DUCTS, DUCT_R, DUMPX, EDGE, HALF_W, HOUSE, KEY_Y, MZ, PILE_Z, PIT, ROAD_W, ROAD_Z, ROUTE_X0, SAND, SHOULDER, X_CUT, X_END, X_T0, camDirs, type Pose, type V3 } from './world';
import { clamp01 } from '../hero6/geometry';

const HEAP_H = 0.85; // the height of a mound
const HEAP_RX = 1.9; // its half length along the route
const HEAP_RZ = 1.25; // and half width

// a colour in the working space, as the three numbers a shader wants
const lin = (hex: string) => {
  const c = new THREE.Color(hex);
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
};
const f2 = (v: number) => v.toFixed(3);

const FIELD_GLSL = /* glsl */ `
uniform float uFront;
uniform float uX0;
uniform float uDepth;
uniform float uHalfW;
uniform float uShoulder;
uniform float uPileZ;
uniform float uSandX;
uniform float uFillX;
uniform float uPit;
uniform float uNotch;
uniform float uHeapX[${CYCLES}];
uniform float uHeapA[${CYCLES}];
float sandAt(float x) {
  return ${f2(SAND)} * smoothstep(uSandX - 0.3, uSandX + 1.0, x);
}
float fillAt(float x) {
  return smoothstep(uFillX - 0.35, uFillX + 0.35, x);
}
// a rounded box on the ground, 1 inside it
float boxM(vec2 q, float x0, float x1, float hz, float e) {
  return smoothstep(x0 - e, x0 + e, q.x) * (1.0 - smoothstep(x1 - e, x1 + e, q.x)) * (1.0 - smoothstep(hz - e, hz + e, abs(q.y)));
}
float pitM(vec2 q) {
  return boxM(q, ${f2(PIT.x0)}, ${f2(PIT.x1)}, ${f2(PIT.hw)}, 0.07) * uPit;
}
// the ground beyond the front edge sinks away, a hard step so the face it leaves is a clean cut
float edgeM(vec2 q) {
  return step(${EDGE.x.toFixed(4)}, q.x) * uNotch;
}
// how deep the trench is at q, as cut, then with the sand bed raising its floor and the backfill filling it
float trenchDepth(vec2 q) {
  float wz = 1.0 - smoothstep(uHalfW, uHalfW + uShoulder, abs(q.y));
  float wx = smoothstep(uX0, uX0 + 0.3, q.x) * (1.0 - smoothstep(uFront - 0.4, uFront + 0.2, q.x));
  float amp = clamp((uFront - uX0) / 0.6, 0.0, 1.0);
  float d = uDepth * wz * wx * amp;
  d = max(d, uDepth * pitM(q));
  d = max(0.0, d - sandAt(q.x) * smoothstep(0.0, 0.6, d));
  return d * (1.0 - fillAt(q.x));
}
// the spoil, one mound a dump, each as tall as its dump has got and as much as the backfill has left
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
float fieldS(vec2 q) {
  return heapHeight(q) - trenchDepth(q);
}
float field(vec2 q) {
  return fieldS(q) - edgeM(q) * ${f2(EDGE.depth)};
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
varying float vSand;
varying float vPit;
varying float vNotch;
void main() {
  vec3 p = position;
  float h = field(p.xz);
  p.y = h;
  float e = 0.05;
  float hx = fieldS(p.xz + vec2(e, 0.0)) - fieldS(p.xz - vec2(e, 0.0));
  float hz = fieldS(p.xz + vec2(0.0, e)) - fieldS(p.xz - vec2(0.0, e));
  vN = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
  vW = p;
  vD = trenchDepth(p.xz);
  vH = heapHeight(p.xz);
  vSand = sandAt(p.x) * (1.0 - fillAt(p.x));
  vPit = pitM(p.xz);
  vNotch = edgeM(p.xz);
  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  #include <shadowmap_vertex>
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

// the courses of the cut away, the hero 6 palette, a colour for each, and the five ducts as circles
const DUCT_GLSL = DUCTS.map((d) => `vec3(${f2(d.z)}, ${f2(d.y)}, ${d.orange ? '1.0' : '0.0'})`).join(', ');
const COURSES_GLSL = /* glsl */ `
const vec3 DUCTS[${DUCTS.length}] = vec3[${DUCTS.length}](${DUCT_GLSL});
// the native ground, a dark topsoil over the paler subsoil
vec3 nativeCol(float y, float k) {
  vec3 top = ${lin('#2c241d')};
  vec3 sub = ${lin('#5d4f40')};
  vec3 deep = ${lin('#463e35')};
  vec3 c = mix(top, sub, smoothstep(-0.2, -0.45, y));
  c = mix(c, deep, smoothstep(-1.1, -1.6, y));
  return c * (0.85 + 0.3 * k);
}
// the trench's courses from the surface down, as in hero 6, surface, base, backfill, tape, sand haunch,
// the ducts and the sand bed, in the plane z and y across the route
vec3 sectionCol(float z, float y, float k) {
  float inT = (1.0 - smoothstep(uHalfW - 0.01, uHalfW + 0.03, abs(z))) * smoothstep(-uDepth - 0.02, -uDepth + 0.01, y);
  vec3 c = ${lin('#6e6559')} * (0.9 + 0.2 * k);
  c = mix(c, ${lin('#8f897d')}, smoothstep(-0.32, -0.3, y));
  c = mix(c, ${lin('#2b2b2e')}, smoothstep(-0.12, -0.1, y));
  c = mix(c, ${lin('#b7ae9f')}, (1.0 - smoothstep(-0.6, -0.58, y)));
  float tape = (1.0 - smoothstep(0.008, 0.016, abs(y + 0.45))) * (1.0 - smoothstep(0.5, 0.56, abs(z)));
  c = mix(c, ${lin('#d00b11')}, tape);
  for (int i = 0; i < ${DUCTS.length}; i++) {
    vec3 d = DUCTS[i];
    float r = length(vec2(z - d.x, y - d.y));
    vec3 dc = d.z > 0.5 ? ${lin('#c9531f')} : ${lin('#37864f')};
    c = mix(c, dc, 1.0 - smoothstep(${f2(DUCT_R)} - 0.004, ${f2(DUCT_R)}, r));
    c = mix(c, dc * 0.55, 1.0 - smoothstep(${f2(DUCT_R - 0.02)} - 0.004, ${f2(DUCT_R - 0.02)}, r));
  }
  return mix(nativeCol(y, k), c, inT);
}
// the face of the slab, the road's own courses under the kerb, the route's courses where the trench was and
// the native ground between
vec3 faceCol(float z, float y, float k) {
  vec3 r = mix(${lin('#2b2b2e')}, ${lin('#8f897d')}, 1.0 - smoothstep(-0.13, -0.11, y));
  r = mix(r, nativeCol(y, k), 1.0 - smoothstep(-0.45, -0.43, y));
  return mix(sectionCol(z, y, k), r, smoothstep(uRoadZ - 0.02, uRoadZ + 0.02, z));
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
uniform float uDepth;
uniform float uHalfW;
uniform float uShoulder;
uniform float uX0;
uniform float uRouteX;
uniform float uHouseRev;
uniform float uRestore;
uniform float uNotch;
uniform float uFillX;
uniform float uVig;
uniform vec2 uRes;
uniform vec2 uMach;
uniform vec3 uKey;
uniform vec3 uRim;
varying vec3 vW;
varying vec3 vN;
varying float vD;
varying float vH;
varying float vSand;
varying float vPit;
varying float vNotch;
${COURSES_GLSL}

float ln(float c, float v, float fw) {
  float w = max(1.0, uDpr) * fw;
  return 1.0 - smoothstep(0.35 * w, 0.9 * w + 1e-5, abs(c - v));
}
// the outline of a rectangle on the ground
float rectLn(vec2 w, float x0, float x1, float z0, float z1, float fwx, float fwz) {
  float inx = step(x0 - 0.03, w.x) * step(w.x, x1 + 0.03);
  float inz = step(z0 - 0.03, w.y) * step(w.y, z1 + 0.03);
  return max(max(ln(w.y, z0, fwz), ln(w.y, z1, fwz)) * inx, max(ln(w.x, x0, fwx), ln(w.x, x1, fwx)) * inz);
}
// the swatch three times, at three scales turned against each other, so its tile does not show, and pulled a
// little towards its mean so the big blotches stay quiet
vec3 swatch(vec2 uv) {
  vec3 a = texture2D(uSoil, uv).rgb;
  vec2 v = vec2(uv.x * 0.8 - uv.y * 0.6, uv.x * 0.6 + uv.y * 0.8) * 0.37 + vec2(0.31, 0.17);
  vec3 b = texture2D(uSoil, v).rgb;
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
// a soft fade at the four edges, for the stills, so the ground melts into the page
float vignette() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float v = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x) * smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
  return mix(1.0, v, uVig);
}

void main() {
  float fwx = fwidth(vW.x);
  float fwz = fwidth(vW.z);
  // the slope of the surface as drawn, read from the face itself, for the wall of the cut
  vec3 gn = normalize(cross(dFdx(vW), dFdy(vW)));
  if (dot(gn, cameraPosition - vW) < 0.0) gn = -gn;
  float dist = length(vW.xz - cameraPosition.xz);
  float far = (1.0 - smoothstep(60.0, 120.0, dist)) * vignette();
  float sl = (1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, abs(vW.x - uSeam))) * (1.0 - smoothstep(22.0, 55.0, dist));
  // the route is drawn from the street end to the house, so it shows from its front on towards the street,
  // and the house outline and the chamber's come with it
  float rv = smoothstep(uRouteX - 0.1, uRouteX + 0.3, vW.x) * (1.0 - smoothstep(${f2(ROUTE_X0)} - 0.05, ${f2(ROUTE_X0)} + 0.05, vW.x));
  float onRoute = rv * smoothstep(${f2(HOUSE.x1)} - 0.3, ${f2(HOUSE.x1)}, vW.x);
  float glint = exp(-abs(vW.x - uRouteX) / 0.3) * step(uRouteX, ${f2(ROUTE_X0)}) * step(${f2(HOUSE.x0)} - 0.5, uRouteX);
  float foot = max(rectLn(vW.xz, ${f2(HOUSE.x0)}, ${f2(HOUSE.x1)}, ${f2(HOUSE.z0)}, ${f2(HOUSE.z1)}, fwx, fwz), rectLn(vW.xz, ${f2(PIT.x0)}, ${f2(PIT.x1)}, ${f2(-PIT.hw)}, ${f2(PIT.hw)}, fwx, fwz));
  float footV = smoothstep(uRouteX - 0.1, uRouteX + 0.3, vW.x) * (1.0 - uHouseRev);

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
    // the finished surface where the trench was, a little paler and finer, the reinstated verge
    // the surface put back, the verge's own soil raked fine and a touch darker, its edge feathered into the
    // ground round it so it does not read as a path
    float stripW = uHalfW + 0.25;
    float strip = (1.0 - smoothstep(stripW - 0.18, stripW + 0.22, abs(vW.z))) * smoothstep(uFillX - 0.45, uFillX + 0.45, vW.x) * uRestore * (1.0 - road);
    vec3 fine = swatch(vec2(vW.x / 1.1 + 0.37, vW.z / 1.1 + 0.11));
    vec3 patchC = mix(soil, fine, 0.7) * vec3(0.86, 0.88, 0.84);
    alb = mix(alb, patchC * vec3(0.78, 0.76, 0.74), strip * 0.9);
    // the walls and floor of the cut, darker the deeper, the soil under the verge's top layer. The spoil is
    // fresh, a touch lighter on top and darker where it meets the verge.
    float ao = mix(1.0, 0.1, smoothstep(0.12, uAoDepth * 0.95, vD));
    float heap = smoothstep(0.02, 0.2, vH);
    // the cut shows its layers, a dark topsoil over the paler subsoil, so the walls read against the verge
    float layer = smoothstep(-0.22, -0.4, vW.y) * (1.0 - smoothstep(-0.55, -0.95, vW.y));
    alb = mix(alb, soil * vec3(1.5, 1.34, 1.12), layer * inside);
    // the sand bed on the floor of the cut, and up the foot of its walls
    float sandM = (1.0 - smoothstep(-uDepth + vSand + 0.03, -uDepth + vSand + 0.09, vW.y)) * smoothstep(0.004, 0.03, vSand) * smoothstep(0.2, 0.5, vD);
    alb = mix(alb, vec3(0.62, 0.56, 0.47) * (0.55 + 1.3 * dot(soil, vec3(0.333))), sandM);
    alb *= mix(1.0, 0.7, inside * (1.0 - sandM * 0.5)) * mix(ao, mix(1.0, ao, 0.55), sandM);
    alb *= mix(1.0, 0.78 + 0.4 * smoothstep(0.0, 0.8, vH), heap);
    // the chamber at the house, poured concrete
    alb = mix(alb, vec3(0.34, 0.34, 0.36) * (0.8 + 0.4 * dot(soil, vec3(0.333))), smoothstep(0.02, 0.2, vPit));
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
    // the front edge. The slab ends in a clean cut and the face looks at the street, flat lit like a diagram,
    // the courses of the road and of the route across it. It is the vertical sliver the ground steps down by.
    float wall = step(0.001, uNotch) * smoothstep(0.3, 0.6, 1.0 - abs(gn.y)) * step(${f2(EDGE.x - 0.003)}, vW.x);
    if (wall > 0.0) {
      float k = dot(swatch(vec2(vW.z / 1.1, vW.y / 1.1)), vec3(0.333)) * 1.6;
      vec3 face = faceCol(vW.z, vW.y, k) * (0.82 + 0.2 * smoothstep(-1.9, 0.0, vW.y));
      // the cut lip is a little bright where the sun takes the edge, and the foot of the face is dark
      float bot = vW.y + uNotch * ${f2(EDGE.depth)};
      face *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.09, bot));
      face = mix(face, face * 1.35 + 0.03, 1.0 - smoothstep(0.0, 0.03, -vW.y));
      col = mix(col, face, wall);
    }
    // the road's centre line, long dashes in a pale grey
    float rline = ln(vW.z, uRoadZ + uRoadW * 0.5, fwz) * step(fract(vW.x / 3.2), 0.5) * road;
    col = mix(col, vec3(0.62), rline * 0.6);
    // a faint lift where the render begins, so the seam reads as an edge being drawn
    col += vec3(0.06) * exp(-(uSeam - vW.x) / 0.5) * (1.0 - step(0.001, uNotch));
    // the route, marked out on the ground in white paint where the trench is still to be cut, and the
    // outline of the house and its chamber until the house is rendered
    float marked = step(uFront + 0.35, vW.x) * step(uX0, vW.x) * (1.0 - road) * (1.0 - step(${f2(X_CUT - 0.01)}, uFront) * smoothstep(${f2(X_CUT)} + 0.1, ${f2(X_CUT)} + 0.3, vW.x));
    float paint = ln(vW.z, -uHalfW, fwz) + ln(vW.z, uHalfW, fwz) + ln(vW.z, 0.0, fwz) * step(fract(vW.x / 0.7), 0.58);
    col = mix(col, vec3(0.92), clamp(paint, 0.0, 1.0) * 0.5 * marked * onRoute * (1.0 - wall));
    col = mix(col, vec3(0.95), foot * 0.6 * footV * (1.0 - wall));
    col += vec3(0.5) * glint * 0.35 * step(abs(vW.z), 1.0);
#ifdef TONE_MAPPING
    col = toneMapping(col);
#endif
    col = linearToOutputTexel(vec4(col, 1.0)).rgb;
    col = mix(col, vec3(1.0), sl * 0.95 * (1.0 - wall));
    gl_FragColor = vec4(col, far);
  } else {
    // the plan, hairlines only, the page's black shows through
    float a = 0.0;
    // the trench's two edges and the route line down its middle, dashed, drawn from the street to the house
    a = max(a, 0.95 * ln(vW.z, -uHalfW, fwz) * onRoute);
    a = max(a, 0.95 * ln(vW.z, uHalfW, fwz) * onRoute);
    float dash = step(fract(vW.x / 0.7), 0.58);
    a = max(a, 0.9 * ln(vW.z, 0.0, fwz) * dash * onRoute);
    // stations, a tick across the route every two metres and a longer one every ten
    float st = abs(mod(vW.x + 1.0, 2.0) - 1.0);
    float tk = 1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, st);
    float st10 = abs(mod(vW.x + 5.0, 10.0) - 5.0);
    float tk10 = 1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, st10);
    a = max(a, 0.8 * tk * step(abs(vW.z), 1.15) * onRoute);
    a = max(a, 0.8 * tk10 * step(abs(vW.z), 2.3) * onRoute);
    a = max(a, 0.9 * foot * footV);
    a = max(a, 0.8 * glint * step(abs(vW.z), 1.1));
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
  const xs = axis([[-40, -9, 1.7], [-9, 17, 0.12], [17, 66, 1.6]]);
  // two columns a hair apart at the front edge, so the step the ground takes there is a vertical face
  xs.push(EDGE.x - 0.001, EDGE.x + 0.001);
  xs.sort((a, b) => a - b);
  for (let i = xs.length - 1; i > 0; i--) if (xs[i] - xs[i - 1] < 0.0005) xs.splice(i, 1);
  const zs = axis([[-150, -40, 10], [-40, -12, 3], [-12, -4.2, 0.8], [-4.2, -1.3, 0.1], [-1.3, 1.3, 0.06], [1.3, 3.7, 0.1], [3.7, 12, 1], [12, 42, 5]]);
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
uniform float uSink;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position - vec3(0.0, uSink, 0.0), 1.0);
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
  // the route's draw, the front's x, from the street end to the house
  setRoute(x: number): void;
  // the soft edge for the stills, with the size of the canvas in pixels
  setVignette(on: boolean, w: number, h: number): void;
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
    uSandX: { value: 14 },
    uFillX: { value: X_CUT + 0.45 },
    uPit: { value: 0 },
    uNotch: { value: 0 },
    uRouteX: { value: ROUTE_X0 + 1 },
    uHouseRev: { value: 0 },
    uRestore: { value: 0 },
    uVig: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
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
  const du = { uSeam: u.uSeam, uSink: { value: 0 }, uPx: { value: 2 * Math.max(1, dpr) }, uMap: { value: tex }, uOpacity: { value: 0.75 } };
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
      // a mound grows as its dump goes and is drawn down again by the backfill
      for (let i = 0; i < CYCLES; i++) heapA[i] = p.heap[i];
      u.uSandX.value = p.sandX;
      u.uFillX.value = p.fillX;
      u.uPit.value = p.pit;
      u.uNotch.value = p.notch;
      du.uSink.value = p.notch * EDGE.depth;
      u.uRestore.value = p.restore;
      u.uHouseRev.value = clamp01((HOUSE.x1 + 0.1 - p.houseX) / (HOUSE.x1 - HOUSE.x0 + 0.3));
    },
    setRoute(x) {
      u.uRouteX.value = x;
    },
    setVignette(on, w, h) {
      u.uVig.value = on ? 1 : 0;
      u.uRes.value.set(w, h);
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
