// The ground of hero 7, one ground mesh. It is the render everywhere, the specimen's asphalt and soil, lit, with
// the trench cut into it and the spoil heaped beside it. The plan is only an overlay on it, the route the crew
// builds and what lies under the verge, white hairlines and a marked line, so ahead of the machine the trench
// is hairlines and behind it the same ground is cut, real. The trench and the heap are one height field in
// the vertex shader, cut from the front xf the dig has reached and grown from how far each dump has got, so
// the mesh is built once and p only moves a few uniforms. The ground takes the key light's shadow map, the
// machine's shadow falls on the verge, into the trench and over the heap, and so do the house and the cabinet.
// At the end the ground beyond the cut edge on the road side sinks away and leaves a clean face of hero 6's
// courses.

import * as THREE from 'three';
import { groundMaps } from './groundTextures';
import { CYCLES, D, DUCTS, DUMPX, EDGE, FEED_X, HALF_W, KEY_Y, LEAD_X, MZ, PILE_Z, ROAD_W, ROAD_Z, ROUTE_LEG, ROUTE_LEN, SAND, SHOULDER, X_CUT, X_T0, HOUSE, camDirs, type Pose, type V3 } from './world';

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
uniform float uNotch;
uniform float uHeapX[${CYCLES}];
uniform float uHeapA[${CYCLES}];
float sandAt(float x) {
  return ${f2(SAND)} * smoothstep(uSandX - 0.3, uSandX + 1.0, x);
}
float fillAt(float x) {
  return smoothstep(uFillX - 0.35, uFillX + 0.35, x);
}
// the ground beyond the cut edge sinks away, a hard step so the face it leaves is a clean cut
float edgeM(vec2 q) {
  return step(${EDGE.z.toFixed(4)}, q.y) * uNotch;
}
// how deep the trench is at q, as cut, then with the sand bed raising its floor and the backfill filling it
float trenchDepth(vec2 q) {
  float wz = 1.0 - smoothstep(uHalfW, uHalfW + uShoulder, abs(q.y));
  float wx = smoothstep(uX0, uX0 + 0.3, q.x) * (1.0 - smoothstep(uFront - 0.4, uFront + 0.2, q.x));
  float amp = clamp((uFront - uX0) / 0.6, 0.0, 1.0);
  float d = uDepth * wz * wx * amp;
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
  vNotch = edgeM(p.xz);
  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  #include <shadowmap_vertex>
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

// the courses of the cut face, hero 6's own four textures in its proportions, scaled to the 1.25 deep trench.
// Surface, base gravel, backfill and the sand bed from the top, the red warning tape in the backfill over the
// operator's feeder, whose ducts are real stubs drawn by the story, not painted here.
const COURSES_GLSL = /* glsl */ `
vec3 faceAlb(float x, float y) {
  vec2 uv = vec2(x / 2.6, y / 1.3);
  vec3 c = texture2D(uSand, uv).rgb * 0.85;
  c = mix(c, texture2D(uSoil, uv).rgb * 2.0, smoothstep(-0.596, -0.588, y));
  c = mix(c, texture2D(uGravel, uv).rgb * 1.9, smoothstep(-0.293, -0.285, y));
  c = mix(c, texture2D(uAsph, uv).rgb * 1.6, smoothstep(-0.122, -0.114, y));
  float tape = (1.0 - smoothstep(0.009, 0.015, abs(y + 0.447))) * (1.0 - smoothstep(0.5, 0.56, abs(x - ${FEED_X.toFixed(3)})));
  c = mix(c, ${lin('#d00b11')}, tape);
  // a contact shade under each course edge, so the strata read as separate courses
  float sh = 1.0;
  sh *= 1.0 - 0.45 * exp(-max(-0.118 - y, 0.0) / 0.03) * step(y, -0.118);
  sh *= 1.0 - 0.4 * exp(-max(-0.289 - y, 0.0) / 0.03) * step(y, -0.289);
  sh *= 1.0 - 0.4 * exp(-max(-0.592 - y, 0.0) / 0.04) * step(y, -0.592);
  return c * sh;
}
`;

// ---- the plan. Only the route is plan, and what lies under the verge. The distances are written so a line is
// one pixel wide at any size.
// the planned ducts drawn as their two outer lines, the bundle's width, so the plan stays a few lines and not a ladder
const DUCT_ZS = Array.from(new Set(DUCTS.filter((d) => Math.abs(d.z) > 0.2).map((d) => d.z.toFixed(3))));
const DUCT_Z = DUCT_ZS.join(', ');
const PLAN_GLSL = /* glsl */ `
const float DZ[${DUCT_ZS.length}] = float[${DUCT_ZS.length}](${DUCT_Z});
float hair(float d) {
  float w = max(1.0, uDpr) * fwidth(d) + 1e-5;
  return 1.0 - smoothstep(0.35 * w, 0.95 * w, abs(d));
}
float segD(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
`;

const FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <shadowmap_pars_fragment>
uniform sampler2D uSoil;
uniform sampler2D uAsph;
uniform sampler2D uGravel;
uniform sampler2D uSand;
uniform float uFront;
uniform float uDpr;
uniform float uRoadZ;
uniform float uRoadW;
uniform float uAoDepth;
uniform float uDepth;
uniform float uHalfW;
uniform float uShoulder;
uniform float uX0;
uniform float uRouteS;
uniform float uPlan;
uniform float uTipS;
uniform float uTipOn;
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
varying float vNotch;
${COURSES_GLSL}
${PLAN_GLSL}

float ln(float c, float v, float fw) {
  float w = max(1.0, uDpr) * fw;
  return 1.0 - smoothstep(0.35 * w, 0.9 * w + 1e-5, abs(c - v));
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
  float far = (1.0 - smoothstep(90.0, 160.0, dist)) * vignette();
  // beyond the cut edge the ground sinks to the foot of the face and goes dark, so the slab ends in its face
  float beyond = step(${(EDGE.z + 0.004).toFixed(4)}, vW.z);
  if (far < 0.004) discard;

  vec3 n = normalize(vN);
  float road = smoothstep(uRoadZ - 0.02, uRoadZ + 0.02, vW.z);
  float kerb = 1.0 - smoothstep(0.0, 0.03, abs(vW.z - uRoadZ + 0.07) - 0.07);
  vec3 soil = soilAt(vW, n);
  vec3 asph = texture2D(uAsph, vec2(vW.x / 2.6, vW.z / 1.3)).rgb;
  float inside = smoothstep(0.03, 0.25, vD);
  vec3 alb = mix(soil * vec3(0.78, 0.76, 0.74), asph * 1.25, road);
  alb = mix(alb, vec3(0.2, 0.2, 0.21), kerb);
  // the verge is grassed, its own soil with a green in it. Where the trench was filled the soil shows bare until
  // the surface is put back, and then the grass is back with the rest.
  float stripW = uHalfW + 0.3;
  float strip = (1.0 - smoothstep(stripW - 0.18, stripW + 0.22, abs(vW.z))) * smoothstep(uFillX - 0.45, uFillX + 0.45, vW.x) * smoothstep(${f2(X_T0 - 0.4)}, ${f2(X_T0 - 0.1)}, vW.x) * (1.0 - smoothstep(${f2(X_CUT)}, ${f2(X_CUT + 0.45)}, vW.x)) * (1.0 - road);
  float lawn = (1.0 - road) * (0.2 + 0.14 * dot(swatch(vec2(vW.x / 5.0 + 0.3, vW.z / 5.0 + 0.7)), vec3(0.333)) / 0.35);
  lawn *= 1.0 - strip * (1.0 - smoothstep(0.0, 1.0, uRestore)) * 0.95;
  vec3 grass = vec3(0.2, 0.235, 0.115) * (0.5 + 1.6 * dot(soil, vec3(0.333)));
  vec3 fine = swatch(vec2(vW.x / 0.9 + 0.37, vW.z / 0.9 + 0.11));
  alb = mix(alb, mix(alb, grass, lawn), (1.0 - road) * (1.0 - kerb));
  alb = mix(alb, fine * vec3(0.7, 0.66, 0.6), strip * (1.0 - smoothstep(0.0, 1.0, uRestore)) * 0.55);
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
  col *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.8, sd)) * step(uNotch, 0.5);
  // the ground falls off with distance from the work, so the eye stays on it and the far plot sinks into the page
  col *= mix(1.0, 0.34, smoothstep(16.0, 70.0, length(vW.xz - vec2(3.0, 0.0))));
  col *= 1.0 - 0.6 * beyond * smoothstep(0.0, 0.6, uNotch);
  // the cut edge. The slab ends in a clean cut and the face looks at the road, the courses of hero 6 along
  // its whole length. It is the vertical sliver the ground steps down by.
  float wall = step(0.001, uNotch) * smoothstep(0.3, 0.6, 1.0 - abs(gn.y)) * step(${(EDGE.z - 0.003).toFixed(4)}, vW.z);
  if (wall > 0.0) {
    vec3 face = faceAlb(vW.x, vW.y);
    // lit by the key, which looks straight at it. A little darker the deeper it goes.
    face *= (0.3 + 0.9 * max(uKey.z, 0.0)) * (0.8 + 0.2 * smoothstep(-1.25, 0.0, vW.y));
    // the cut lip is a little bright where the light takes the edge, and the foot of the face is dark
    float bot = vW.y + uNotch * ${f2(EDGE.depth)};
    face *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.07, bot));
    face = mix(face, face * 1.4 + 0.03, 1.0 - smoothstep(0.0, 0.025, -vW.y));
    col = mix(col, face, wall);
  }
  // the road's centre line, long dashes in a pale grey
  float rline = ln(vW.z, uRoadZ + uRoadW * 0.5, fwz) * step(fract(vW.x / 3.2), 0.5) * road;
  col = mix(col, vec3(0.62), rline * 0.6);

  // ---- the plan, the route and what lies under the verge, white hairlines seen through the real ground.
  // The route runs from the cabinet along z to the corner and then along x to the house wall, s metres from the
  // cabinet. It is drawn in at load, front uRouteS, and ahead of the dig it is hairlines, behind it real.
  float onB = step(${f2(HOUSE.x1 - 0.04)}, vW.x) * step(vW.x, ${f2(LEAD_X + HALF_W)}) * step(${f2(-HALF_W)}, vW.z);
  float onA = step(${f2(LEAD_X - HALF_W)}, vW.x) * step(vW.x, ${f2(LEAD_X + HALF_W)}) * step(vW.z, ${f2(ROUTE_LEG)}) * step(${f2(-HALF_W)}, vW.z);
  float sB = ${f2(ROUTE_LEG)} + (${f2(LEAD_X)} - vW.x);
  float sA = ${f2(ROUTE_LEG)} - vW.z;
  float s = mix(sB, sA, onA * step(${f2(LEAD_X - HALF_W)}, vW.x));
  float drawn = 1.0 - smoothstep(uRouteS - 0.5, uRouteS, s);
  float undug = step(uFront + 0.2, vW.x);
  float rb = onB * undug * (1.0 - road);
  float ra = onA * (1.0 - road);
  float pa = 0.0;
  // the trench's edges and its ducts, along x and along z
  float eb = hair(vW.z - ${f2(HALF_W)}) + hair(vW.z + ${f2(HALF_W)});
  float ea = hair(vW.x - ${f2(LEAD_X + HALF_W)}) + hair(vW.x - ${f2(LEAD_X - HALF_W)});
  float db = 0.0;
  float da = 0.0;
  for (int i = 0; i < DZ.length(); i++) {
    db = max(db, hair(vW.z - DZ[i]));
    da = max(da, hair(vW.x - ${f2(LEAD_X)} - DZ[i]));
  }
  pa = max(pa, 0.9 * min(eb, 1.0) * rb);
  pa = max(pa, 0.9 * min(ea, 1.0) * ra);
  pa = max(pa, 0.45 * db * rb);
  pa = max(pa, 0.45 * da * ra);
  // stations, a tick across the route every two metres
  float st = abs(mod(vW.x + 1.0, 2.0) - 1.0);
  float tk = 1.0 - smoothstep(0.6 * max(1.0, uDpr) * fwx, 1.5 * max(1.0, uDpr) * fwx + 1e-5, st);
  pa = max(pa, 0.8 * tk * step(abs(vW.z), 1.15) * rb);
  // the marked line, white paint dashes down the middle, along x and along z
  float dashB = step(fract(sB / 0.7), 0.58);
  float dashA = step(fract(sA / 0.7), 0.58);
  float paint = max(ln(vW.z, 0.0, fwz) * dashB * rb, ln(vW.x, ${f2(LEAD_X)}, fwx) * dashA * ra);
  // the lit tip runs the lead, the hairlines it has been along stay warm
  float lit = (1.0 - smoothstep(uTipS - 0.05, uTipS + 0.05, s)) * smoothstep(0.0, 0.12, uTipS);
  float glow = exp(-abs(s - uTipS) / 0.3) * uTipOn;
  // the existing cables under the verge, dashed, the operator's own
  float c1 = hair(vW.z + 2.2) * step(fract(vW.x / 0.6), 0.55) * step(-12.0, vW.x) * step(vW.x, 22.0);
  float c2 = hair(vW.x - ${f2(FEED_X + 0.0)}) * step(fract(vW.z / 0.6), 0.55) * step(${f2(2.9)}, vW.z) * step(vW.z, ${f2(EDGE.z)});
  float dg = segD(vW.xz, vec2(0.8, -6.5), vec2(6.8, 6.5));
  float c3 = hair(dg) * step(fract((vW.x + vW.z) / 0.6), 0.55) * step(vW.z, 4.0);
  float cables = max(c1, max(c2, c3)) * 0.38 * smoothstep(0.1, 0.55, uRouteS / ${f2(ROUTE_LEN)});
  float line = max(pa * drawn, cables) * uPlan;
  vec3 hairC = mix(vec3(0.96), vec3(1.0, 0.62, 0.28), clamp(lit * 0.7 + glow, 0.0, 1.0) * (ra + rb));
  col = mix(col, hairC, clamp(line + glow * 0.8 * ra, 0.0, 1.0));
  col = mix(col, vec3(0.92), paint * 0.55 * drawn * uPlan);
#ifdef TONE_MAPPING
  col = toneMapping(col);
#endif
  col = linearToOutputTexel(vec4(col, 1.0)).rgb;
  gl_FragColor = vec4(col, far);
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
  const xs = axis([[-70, -12, 2.4], [-12, -4, 0.4], [-4, 12, 0.12], [12, 20, 0.4], [20, 80, 2]]);
  const zs = axis([[-150, -40, 10], [-40, -12, 3], [-12, -4.2, 0.8], [-4.2, -1.3, 0.1], [-1.3, 1.3, 0.06], [1.3, 3.7, 0.1], [3.7, 12, 1], [12, 42, 5]]);
  // two rows a hair apart at the cut edge, so the step the ground takes there is a vertical face
  zs.push(EDGE.z - 0.001, EDGE.z + 0.001);
  zs.sort((a, b) => a - b);
  for (let i = zs.length - 1; i > 0; i--) if (zs[i] - zs[i - 1] < 0.0005) zs.splice(i, 1);
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
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(10, 0, 0), 200);
  return g;
}

export type GroundRig = {
  // settles once the ground tiles are painted
  ready: Promise<void>;
  group: THREE.Group;
  mesh: THREE.Mesh;
  set(p: Pose): void;
  // the route's draw, metres from the cabinet that have been drawn in
  setRoute(s: number): void;
  // the soft edge for the stills, with the size of the canvas in pixels
  setVignette(on: boolean, w: number, h: number): void;
  setScreen(dpr: number): void;
  dispose(): void;
};

export function buildGround(dpr: number): GroundRig {
  // painted in a worker, the scene shows once they are in, see groundTextures.ts
  const tiles = groundMaps();
  const soil = { map: tiles.maps.backfill };
  const asph = { map: tiles.maps.asphalt };
  const gravel = { map: tiles.maps.gravel };
  const sand = { map: tiles.maps.sand };
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
    uDpr: { value: dpr },
    uRoadZ: { value: ROAD_Z },
    uRoadW: { value: ROAD_W },
    uPileZ: { value: PILE_Z },
    uSandX: { value: 14 },
    uFillX: { value: X_CUT + 0.45 },
    uNotch: { value: 0 },
    uRouteS: { value: -1 },
    uPlan: { value: 1 },
    uTipS: { value: 0 },
    uTipOn: { value: 0 },
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
    uGravel: { value: gravel.map },
    uSand: { value: sand.map },
  };
  const geo = gridGeometry();
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: true, lights: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  return {
    ready: tiles.ready,
    group,
    mesh,
    set(p) {
      u.uFront.value = p.xf;
      u.uMach.value.set(p.xm + p.drv, MZ);
      // a mound grows as its dump goes and is drawn down again by the backfill
      for (let i = 0; i < CYCLES; i++) heapA[i] = p.heap[i];
      u.uSandX.value = p.sandX;
      u.uFillX.value = p.fillX;
      u.uNotch.value = p.notch;
      u.uPlan.value = p.plan;
      u.uTipS.value = p.tipS;
      u.uTipOn.value = p.tipOn;
      u.uRestore.value = p.restore;
    },
    setRoute(s) {
      u.uRouteS.value = s;
    },
    setVignette(on, w, h) {
      u.uVig.value = on ? 1 : 0;
      u.uRes.value.set(w, h);
    },
    setScreen(d) {
      u.uDpr.value = d;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      tiles.dispose();
    },
  };
}
