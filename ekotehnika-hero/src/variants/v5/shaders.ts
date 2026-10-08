// Shader sources for variant 5. Colours arrive as uniforms or attributes in sRGB token values and
// are written out as is, so the hues stay the tokens.

const noise = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;

// The sky behind the opening shot. A full screen quad drawn first, horizon at uHorizon in NDC.
export const skyVert = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const skyFrag = /* glsl */ `
uniform float uHorizon;
uniform float uSky;
uniform vec3 uInk;
uniform vec3 uRed;
uniform vec3 uToned;
uniform vec3 uDeep;
uniform vec3 uWhite;
varying vec2 vNdc;
void main() {
  float h = vNdc.y - uHorizon;
  float sun = exp(-pow((vNdc.x - 0.55) * 1.1, 2.0));
  vec3 top = uInk * 0.32;
  vec3 col = top;
  if (h > 0.0) {
    col = mix(uWhite, uToned, smoothstep(0.0, 0.07 + sun * 0.05, h));
    col = mix(col, uRed, smoothstep(0.06, 0.26, h));
    col = mix(col, uDeep * 0.75, smoothstep(0.22, 0.62, h));
    col = mix(col, top, smoothstep(0.55, 1.25, h));
    col *= 0.72 + 0.28 * sun;
  } else {
    float g = exp(h * 26.0);
    col = mix(uInk * 0.16, uToned * 0.55, g * (0.4 + 0.6 * sun));
  }
  vec3 night = uInk * 0.14;
  gl_FragColor = vec4(mix(night, col, uSky), 1.0);
}
`;

// Forklift edges. Lines left of the sweep are discarded, lines near it flare.
export const lineVert = /* glsl */ `
attribute vec3 color;
varying vec3 vCol;
varying float vX;
varying float vY;
void main() {
  vCol = color;
  vX = position.x;
  vY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const lineFrag = /* glsl */ `
uniform float uSweep;
uniform float uOpacity;
uniform float uTime;
varying vec3 vCol;
varying float vX;
varying float vY;
void main() {
  if (vX < uSweep) discard;
  float flare = 1.0 + 3.5 * exp(-pow((vX - uSweep) * 4.0, 2.0));
  float scan = 0.82 + 0.18 * sin(vY * 14.0 - uTime * 2.2);
  gl_FragColor = vec4(vCol * flare * scan, uOpacity);
}
`;

// The particle forklift. Sampled on the surface, it scatters, swirls and settles onto the grid lines.
export const pointVert = /* glsl */ `
attribute vec3 color;
attribute vec3 aRand;
attribute vec3 aTarget;
uniform float uTime;
uniform float uScatter;
uniform float uSwirl;
uniform float uSettle;
uniform float uSize;
uniform float uDpr;
varying vec3 vCol;
varying float vA;
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
void main() {
  vec3 p = position;
  vec3 dir = normalize(aRand * 2.0 - 1.0 + vec3(0.25, 0.45, 0.0));
  // The cloud comes apart from the fork tips back to the counterweight, like the scan before it.
  float front = clamp((position.x + 1.8) / 4.4, 0.0, 1.0);
  float delay = (1.0 - front) * 0.55 + aRand.y * 0.15;
  float sc = smoothstep(delay, delay + 0.3, uScatter);
  vec3 s = p + dir * sc * (0.5 + aRand.x * aRand.x * 6.5);
  s.y += sc * aRand.y * 1.6;
  s += sc * vec3(sin(uTime * 0.31 + aRand.x * 23.0), sin(uTime * 0.27 + aRand.y * 19.0) * 0.6, cos(uTime * 0.29 + aRand.z * 17.0)) * 0.35;
  float ang = (uSwirl * (1.2 + aRand.z * 2.6) + (aRand.x - 0.5) * 0.9 + uTime * 0.04) * sc;
  s = rotY(s, ang);
  s.y = max(s.y, 0.04);
  float st = smoothstep(aRand.x * 0.55, aRand.x * 0.55 + 0.45, uSettle);
  vec3 f = mix(s, aTarget, st);
  vec4 mv = modelViewMatrix * vec4(f, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.65 + 0.35 * sin(uTime * (1.0 + aRand.y * 2.0) + aRand.z * 40.0);
  gl_PointSize = uSize * uDpr * (0.45 + aRand.y * 0.9) / -mv.z;
  vCol = color;
  vA = (0.45 + 0.55 * aRand.z) * mix(1.0, tw, sc);
}
`;

export const pointFrag = /* glsl */ `
uniform float uOpacity;
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vCol, a * vA * uOpacity);
}
`;

// The receding floor of rounded square tiles, lit by a soft red sweep.
export const tileVert = /* glsl */ `
attribute float aPhase;
varying vec2 vUv;
varying vec3 vW;
varying float vPhase;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vPhase = aPhase;
  vec4 mv = viewMatrix * w;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const tileFrag = /* glsl */ `
uniform float uReveal;
uniform float uOpacity;
uniform float uTime;
uniform vec2 uSweep;
uniform float uSweepOn;
uniform vec3 uRed;
uniform vec3 uFace;
varying vec2 vUv;
varying vec3 vW;
varying float vPhase;
varying float vDepth;
float sdRB(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 q = vUv - 0.5;
  float d = sdRB(q, vec2(0.44), 0.1);
  float aa = fwidth(d) * 1.2;
  float fill = 1.0 - smoothstep(-aa, aa, d);
  float line = 1.0 - smoothstep(0.0, aa * 1.6, abs(d + 0.006));
  vec2 n = normalize(q + 1e-4);
  float lit = 0.18 + 0.82 * pow(clamp(dot(n, normalize(vec2(-0.55, 0.83))), 0.0, 1.0), 1.5);
  float r = length(vW.xz - vec2(0.0, -0.6));
  float rev = 1.0 - smoothstep(uReveal * 30.0 - 5.0, uReveal * 30.0, r + vPhase * 3.0);
  float fog = exp(-max(vDepth - 5.0, 0.0) * 0.075);
  float sw = exp(-pow(distance(vW.xz, uSweep) / 2.6, 2.0)) * uSweepOn;
  float pulse = smoothstep(0.93, 1.0, sin(uTime * 0.5 + vPhase * 31.0) * 0.5 + 0.5);
  vec3 face = uFace * (0.3 + 0.1 * vPhase + 0.35 * pulse) + uRed * sw * 0.16;
  vec3 edge = vec3(0.46) * lit + uRed * sw * 0.7;
  vec3 col = mix(vec3(0.016), face, fill) + edge * line;
  float a = rev * fog * uOpacity;
  gl_FragColor = vec4(col, a);
}
`;

// Soft smoke beams. vUv.x runs tail to head, vUv.y across.
export const beamVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const beamFrag = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uGrow;
uniform float uSeed;
uniform vec3 uColor;
varying vec2 vUv;
${noise}
void main() {
  float t = vUv.x;
  if (t > uGrow) discard;
  float tt = t / max(uGrow, 0.001);
  float a = vUv.y * 2.0 - 1.0;
  float n = fbm(vec2(t * 3.2 - uTime * 0.18 + uSeed, a * 1.4 + uTime * 0.06 + uSeed));
  float bend = (n - 0.5) * 0.6 * (1.0 - tt);
  float core = exp(-pow(a - bend, 2.0) * mix(1.6, 4.0, tt));
  float wisp = smoothstep(0.25, 0.85, fbm(vec2(t * 7.0 - uTime * 0.35 + uSeed * 3.0, a * 3.0)));
  float body = core * mix(0.2, 1.0, n) * mix(0.55, 1.0, wisp) * smoothstep(0.0, 0.6, tt) * mix(0.18, 0.95, tt * tt);
  float tip = exp(-pow((tt - 1.0) * 14.0, 2.0)) * exp(-a * a * 5.0);
  float alpha = (body * 0.7 + tip * 1.2) * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// The vertical scan sheet that turns the solid truck into lines.
export const sheetFrag = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 e = min(vUv, 1.0 - vUv);
  float edge = exp(-e.x * 90.0) + exp(-e.y * 90.0);
  float fall = smoothstep(0.0, 0.3, vUv.y);
  float a = (0.06 + edge * 0.8) * fall * uOpacity;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;
