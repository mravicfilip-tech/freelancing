// The V1 scene. A dot globe on a near black ground with a hot red rim, a deep red pool at the lower
// left, glowing arcs out of Vrčin and a scroll driven dive into a dot floor.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject, type RefObject } from 'react';
import * as THREE from 'three';
import { Glow } from '../../r3f/Studio';
import { C } from '../../tokens';
import { clamp01, range, smooth } from '../../scroll/useScrollStory';
import { landDots, ll, VRCIN } from './land';
import { cardAt, easeInOut, expoOut, lerp } from './timeline';

const DEG = Math.PI / 180;
const HIDE = import.meta.env.DEV ? new URLSearchParams(location.search).get('hide') ?? '' : '';
const FOV = 30;

// Raw token values for shaders, so the hues land exactly.
const raw = (hex: string) => new THREE.Color().setHex(parseInt(hex.slice(1), 16), THREE.LinearSRGBColorSpace);
const K = {
  ink: raw(C.ink),
  red: raw(C.lindeRed),
  toned: raw(C.tonedRed),
  p700: raw(C.primary700),
  p900: raw(C.primary900),
  white: raw(C.white),
  light: raw(C.hoverLightGrey),
};

export type Anchor = { lat: number; lon: number };

// Arc ends inside Serbia and Montenegro. They are open country, never a named place.
const ARCS_A: Anchor[] = [
  { lat: 42.72, lon: 19.12 },
  { lat: 43.62, lon: 21.72 },
  { lat: 45.48, lon: 19.92 },
];
const ARCS_B: Anchor[] = [
  { lat: 44.02, lon: 19.48 },
  { lat: 43.48, lon: 20.42 },
  { lat: 44.42, lon: 22.28 },
  { lat: 45.72, lon: 21.02 },
  { lat: 42.42, lon: 19.62 },
];

function arcCurve(to: Anchor, lift: number) {
  const a = new THREE.Vector3(...ll(VRCIN.lat, VRCIN.lon));
  const b = new THREE.Vector3(...ll(to.lat, to.lon));
  const ang = a.angleTo(b);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const v = new THREE.Vector3().copy(a).lerp(b, t).normalize();
    const h = 1.0016 + Math.sin(Math.PI * t) * (ang * lift + 0.012);
    pts.push(v.multiplyScalar(h));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// Background. Ink, shaded darker toward the globe, with the deep red pool along the lower left.
const bgVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;
const bgFrag = /* glsl */ `
uniform vec3 uInk; uniform vec3 uRed; uniform vec3 uDeep; uniform vec3 uDarkest;
uniform vec2 uRes; uniform float uPool; uniform vec2 uGlobe;
varying vec2 vUv;
void main() {
  vec2 px = vUv * uRes;
  vec2 g = (px - uGlobe) / uRes.y;
  float shade = smoothstep(0.15, 0.95, length((px - vec2(uRes.x * 0.3, uRes.y * 0.55)) / uRes.y));
  vec3 col = mix(uInk * 0.62, uInk * 0.34, shade);
  col = mix(col, uInk * 0.3, smoothstep(0.75, 0.2, length(g)) * 0.6);
  vec2 q = (px - vec2(uRes.x * 0.34, -uRes.y * 0.06)) / vec2(uRes.x * 0.72, uRes.y * 0.36);
  float pool = exp(-dot(q, q) * 1.1);
  vec2 q2 = (px - vec2(uRes.x * 0.56, -uRes.y * 0.03)) / vec2(uRes.x * 0.3, uRes.y * 0.13);
  float core = exp(-dot(q2, q2) * 1.2);
  col = mix(col, uDarkest, clamp(pool * 1.1, 0.0, 1.0) * uPool);
  col = mix(col, uDeep, clamp(pool * pool * 0.9, 0.0, 1.0) * uPool);
  col = mix(col, uRed, clamp(core * 0.75, 0.0, 1.0) * uPool);
  gl_FragColor = vec4(col, 1.0);
}
`;

// Globe body. Near black with a fresnel rim, hot red at the top and left, deep red at the lower left.
const bodyVert = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
const rimWeights = /* glsl */ `
float hotW(vec2 d) { return pow(clamp(dot(normalize(d + 1e-6), normalize(vec2(-0.5, 0.86))) * 0.5 + 0.5, 0.0, 1.0), 2.6); }
float deepW(vec2 d) { return pow(clamp(dot(normalize(d + 1e-6), normalize(vec2(-0.62, -0.78))) * 0.5 + 0.5, 0.0, 1.0), 5.0); }
`;
const bodyFrag = /* glsl */ `
uniform vec3 uInk; uniform vec3 uHot; uniform vec3 uDeep; uniform vec3 uWhite; uniform float uRim;
varying vec3 vN; varying vec3 vV;
${rimWeights}
void main() {
  float f = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  vec3 col = uInk * 0.24;
  float hw = hotW(vN.xy); float dw = deepW(vN.xy);
  float band = smoothstep(0.5, 1.0, f);
  col += uHot * (band * band * 1.4 + pow(f, 1.8) * 0.14) * hw * uRim;
  col += uWhite * pow(f, 10.0) * hw * 0.9 * uRim;
  col += uDeep * (pow(f, 3.0) * 1.0 + pow(f, 1.6) * 0.18) * dw * uRim;
  col = min(col, max(uHot, vec3(1.0, 0.75, 0.75)));
  gl_FragColor = vec4(col, 1.0);
}
`;

// Atmosphere shell. Glow measured by how far the view ray passes outside the globe.
const shellVert = /* glsl */ `
varying vec3 vP;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }
`;
const shellFrag = /* glsl */ `
uniform vec3 uCenter; uniform vec3 uHot; uniform vec3 uDeep; uniform vec3 uWhite; uniform float uRim;
varying vec3 vP;
${rimWeights}
void main() {
  vec3 d = normalize(vP);
  float t = dot(d, uCenter);
  vec3 perp = d * t - uCenter;
  float x = max(length(perp) - 1.0, 0.0);
  vec2 dir = perp.xy;
  float hw = hotW(dir); float dw = deepW(dir);
  float fade = 1.0 - smoothstep(0.22, 0.48, x);
  float core = exp(-x / 0.005);
  float halo = exp(-x / 0.028);
  float wide = exp(-x / 0.11);
  float streak = exp(-pow((x - 0.045) / 0.0035, 2.0)) * pow(hw, 9.0);
  vec3 col = uHot * (halo * 0.7 + wide * 0.16) * hw + mix(uHot, uWhite, 0.55) * core * hw;
  col += uDeep * (halo * 0.45 + wide * 0.3) * dw + uDeep * core * dw * 0.7;
  col += mix(uHot, uWhite, 0.3) * streak * 0.0;
  col = min(col, vec3(1.0));
  gl_FragColor = vec4(col * fade * uRim, 1.0);
}
`;

// Front atmosphere. A fresnel band drawn over the dots, the hot light that sits on the rim.
const atmoFrag = /* glsl */ `
uniform vec3 uHot; uniform vec3 uDeep; uniform vec3 uWhite; uniform float uRim;
varying vec3 vN; varying vec3 vV;
${rimWeights}
void main() {
  float f = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float hw = hotW(vN.xy); float dw = deepW(vN.xy);
  float band = smoothstep(0.32, 1.0, f);
  vec3 col = uHot * (band * band * 0.95) * hw + mix(uHot, uWhite, 0.22) * pow(f, 9.0) * hw * 0.6;
  col += uDeep * (band * band * 0.9) * dw;
  gl_FragColor = vec4(col * uRim, 1.0);
}
`;

// Land dots, flat discs lying on the sphere, one instanced draw.
const dotVert = /* glsl */ `
attribute vec3 aPos; attribute float aRnd;
uniform float uRad; uniform float uSwell; uniform float uTime; uniform vec3 uVrc; uniform float uFine; uniform float uLayer;
varying vec2 vUv; varying float vFacing; varying vec2 vDir; varying float vTw; varying float vMix;
void main() {
  vec3 n = aPos;
  float inner = smoothstep(${Math.cos(11 * DEG).toFixed(6)}, ${Math.cos(8.5 * DEG).toFixed(6)}, dot(n, uVrc)) * uFine;
  vMix = uLayer > 0.5 ? inner : 1.0 - inner;
  vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), n));
  vec3 b = cross(n, t);
  float r = uRad * uSwell * (0.85 + aRnd * 0.3);
  vec3 p = n * 1.0015 + (t * position.x + b * position.y) * r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 vn = normalize(normalMatrix * n);
  vFacing = dot(vn, normalize(-mv.xyz));
  vDir = vn.xy; vUv = position.xy;
  vTw = 0.82 + 0.18 * sin(uTime * 1.7 + aRnd * 60.0);
  gl_Position = projectionMatrix * mv;
}
`;
const dotFrag = /* glsl */ `
uniform vec3 uWhite; uniform vec3 uHot; uniform vec3 uDeep; uniform float uRim; uniform float uFlood;
varying vec2 vUv; varying float vFacing; varying vec2 vDir; varying float vTw; varying float vMix;
${rimWeights}
void main() {
  if (vFacing < 0.0 || vMix < 0.003) discard;
  float d = length(vUv);
  float aa = max(fwidth(d) * 1.3, 0.02);
  float a = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  if (a <= 0.0) discard;
  float f = 1.0 - vFacing;
  vec3 col = uWhite * mix(0.94 * vTw, 1.0, uFlood);
  float keep = 1.0 - uFlood;
  col = mix(col, mix(uHot, uWhite, 0.2), clamp(pow(f, 1.1) * hotW(vDir) * 2.2 * uRim * keep, 0.0, 1.0));
  col = mix(col, mix(uDeep, uWhite, 0.35), clamp(pow(f, 1.2) * deepW(vDir) * 1.1 * uRim * keep, 0.0, 1.0));
  float limb = mix(0.5 + 0.5 * smoothstep(0.0, 0.3, vFacing), 1.0, uFlood);
  gl_FragColor = vec4(col, a * limb * vMix);
}
`;

// Arcs, a tube held at a constant pixel width, with a light head running along it.
const arcVert = /* glsl */ `
uniform float uBase; uniform float uPx; uniform float uTanHalf; uniform float uViewH; uniform float uLift;
varying float vU; varying float vEdge;
void main() {
  vec3 c = position - normal * uBase;
  float len = length(c);
  c = c / len * (1.0016 + (len - 1.0016) * uLift);
  vec4 mvc = modelViewMatrix * vec4(c, 1.0);
  float wpp = (-mvc.z) * 2.0 * uTanHalf / uViewH;
  vec3 p = c + normal * uPx * wpp;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 vn = normalize(normalMatrix * normal);
  vEdge = abs(dot(vn, normalize(-mv.xyz)));
  vU = uv.x;
  gl_Position = projectionMatrix * mv;
}
`;
const arcFrag = /* glsl */ `
uniform float uDraw; uniform float uHead; uniform float uHalo; uniform float uAlpha;
uniform vec3 uHot; uniform vec3 uWhite;
varying float vU; varying float vEdge;
void main() {
  if (vU > uDraw || uAlpha <= 0.0) discard;
  float base = 0.25 + 0.75 * smoothstep(0.0, 1.0, vU / max(uDraw, 0.001));
  float h = exp(-pow((vU - uHead) / 0.05, 2.0));
  vec3 col = uHot * (base * 1.1 + h) + uWhite * h * 1.1 + uWhite * base * 0.2;
  float a = mix(1.0, 0.32 * pow(vEdge, 1.4), uHalo);
  gl_FragColor = vec4(col * a * uAlpha, 1.0);
}
`;

type ArcU = { uDraw: { value: number }; uHead: { value: number }; uAlpha: { value: number }; uViewH: { value: number }; uLift: { value: number } };

function makeArc(to: Anchor, lift: number) {
  const curve = arcCurve(to, lift);
  const geo = new THREE.TubeGeometry(curve, 96, 0.001, 6, false);
  const u = {
    uDraw: { value: 0 },
    uHead: { value: 0 },
    uAlpha: { value: 1 },
    uViewH: { value: 900 },
    uLift: { value: 1 },
    uTanHalf: { value: Math.tan((FOV / 2) * DEG) },
    uBase: { value: 0.001 },
    uHot: { value: K.toned },
    uWhite: { value: K.white },
  };
  const mk = (px: number, haloV: number) =>
    new THREE.ShaderMaterial({
      vertexShader: arcVert,
      fragmentShader: arcFrag,
      uniforms: { ...u, uPx: { value: px }, uHalo: { value: haloV } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  return { geo, core: mk(1.4, 0), halo: mk(6, 1), u: u as ArcU };
}

function Dots({ uniforms, fine }: { uniforms: Record<string, { value: unknown }>; fine?: boolean }) {
  const geo = useMemo(() => {
    const pos = fine ? landDots(0.09, { ...VRCIN, r: 11 }) : landDots(0.75);
    const n = pos.length / 3;
    const base = new THREE.PlaneGeometry(2, 2);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
    const rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) rnd[i] = Math.random();
    g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 1));
    g.instanceCount = n;
    return g;
  }, [fine]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dotVert,
        fragmentShader: dotFrag,
        uniforms,
        transparent: true,
        depthWrite: false,
      }),
    [uniforms],
  );
  return <mesh geometry={geo} material={mat} renderOrder={1} frustumCulled={false} />;
}

// A flat red disc with a pulsing ring, lying on the globe at Vrčin.
function Marker({ groupRef, ringRef }: { groupRef: RefObject<THREE.Group | null>; ringRef: RefObject<THREE.Mesh | null> }) {
  const q = useMemo(() => {
    const n = new THREE.Vector3(...ll(VRCIN.lat, VRCIN.lon));
    return { pos: n.clone().multiplyScalar(1.0022), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n) };
  }, []);
  return (
    <group position={q.pos} quaternion={q.quat}>
      <group ref={groupRef}>
        <mesh renderOrder={5}>
          <circleGeometry args={[0.0042, 28]} />
          <meshBasicMaterial color={C.tonedRed} toneMapped={false} transparent depthWrite={false} />
        </mesh>
        <mesh renderOrder={5}>
          <circleGeometry args={[0.0018, 20]} />
          <meshBasicMaterial color={C.white} toneMapped={false} transparent depthWrite={false} />
        </mesh>
        <mesh ref={ringRef} renderOrder={5}>
          <ringGeometry args={[0.0042, 0.0052, 40]} />
          <meshBasicMaterial color={C.tonedRed} toneMapped={false} transparent depthWrite={false} />
        </mesh>
        <Glow colour={C.tonedRed} size={0.075} opacity={0.85} position={[0, 0, 0.002]} />
      </group>
    </group>
  );
}

export type SceneProps = {
  progress: MutableRefObject<number>;
  reduced: boolean;
  start: number;
  tagEls: MutableRefObject<(HTMLElement | null)[]>;
  tags: Anchor[];
};

const v3 = new THREE.Vector3();
const vUp = new THREE.Vector3();

function Scene({ progress, reduced, start, tagEls, tags }: SceneProps) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const earth = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const bgU = useMemo(
    () => ({
      uInk: { value: K.ink },
      uRed: { value: K.red },
      uDeep: { value: K.p700 },
      uDarkest: { value: K.p900 },
      uRes: { value: new THREE.Vector2(1440, 900) },
      uPool: { value: 1 },
      uGlobe: { value: new THREE.Vector2(1300, 410) },
    }),
    [],
  );
  const bodyU = useMemo(() => ({ uInk: { value: K.ink }, uHot: { value: K.toned }, uDeep: { value: K.red }, uWhite: { value: K.white }, uRim: { value: 1 } }), []);
  const shellU = useMemo(
    () => ({ uCenter: { value: new THREE.Vector3() }, uHot: { value: K.toned }, uDeep: { value: K.red }, uWhite: { value: K.white }, uRim: { value: 1 } }),
    [],
  );
  const dotU = useMemo(
    () => ({
      uRad: { value: 0.0029 },
      uSwell: { value: 1 },
      uTime: { value: 0 },
      uWhite: { value: K.white },
      uHot: { value: K.toned },
      uDeep: { value: K.red },
      uRim: { value: 1 },
      uFlood: { value: 0 },
      uVrc: { value: new THREE.Vector3(...ll(VRCIN.lat, VRCIN.lon)) },
      uFine: { value: 0 },
      uLayer: { value: 0 },
    }),
    [],
  );
  const fineU = useMemo(
    () => ({
      uRad: { value: 0.00034 },
      uSwell: { value: 1 },
      uTime: { value: 0 },
      uWhite: { value: K.white },
      uHot: { value: K.toned },
      uDeep: { value: K.red },
      uRim: { value: 1 },
      uFlood: { value: 0 },
      uVrc: { value: new THREE.Vector3(...ll(VRCIN.lat, VRCIN.lon)) },
      uFine: { value: 0 },
      uLayer: { value: 1 },
    }),
    [],
  );
  // Materials are built here so the uniform objects stay shared with the frame loop.
  const mats = useMemo(
    () => ({
      bg: new THREE.ShaderMaterial({ vertexShader: bgVert, fragmentShader: bgFrag, uniforms: bgU, depthTest: false, depthWrite: false }),
      body: new THREE.ShaderMaterial({ vertexShader: bodyVert, fragmentShader: bodyFrag, uniforms: bodyU }),
      atmo: new THREE.ShaderMaterial({
        vertexShader: bodyVert,
        fragmentShader: atmoFrag,
        uniforms: shellU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      shell: new THREE.ShaderMaterial({
        vertexShader: shellVert,
        fragmentShader: shellFrag,
        uniforms: shellU,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    }),
    [bgU, bodyU, shellU],
  );
  const arcAll = useMemo(
    () => [
      ...ARCS_A.map((a, i) => ({ to: a, lift: 0.55 + (i % 2) * 0.2, set: 0, i })),
      ...ARCS_B.map((a, i) => ({ to: a, lift: 0.45 + (i % 3) * 0.15, set: 1, i })),
    ],
    [],
  );
  const arcs = useMemo(() => arcAll.map((a) => makeArc(a.to, a.lift)), [arcAll]);
  const tagVecs = useMemo(() => tags.map((t) => new THREE.Vector3(...ll(t.lat, t.lon, 1.002))), [tags]);
  const vrcinN = useMemo(() => new THREE.Vector3(...ll(VRCIN.lat, VRCIN.lon)), []);

  useFrame(() => {
    const W = size.width;
    const H = size.height;
    const s = W / 1440;
    const now = performance.now();
    const t = reduced ? 30 : (now - start) / 1000;
    const p = reduced ? 0 : progress.current;
    const intro = reduced ? 1 : expoOut(clamp01((t - 0.15) / 2.6));

    // Globe placement in the hero, matched to the reel frame at 0.3s.
    const R = 480 * s;
    const cx = 1290 * s;
    const cy = 470 * s + (1 - intro) * 90 * s;
    const tanHalf = Math.tan((FOV / 2) * DEG);
    const alpha = Math.atan((R / (H / 2)) * tanHalf);
    const D0 = 1 / Math.sin(alpha);

    // Chapters.
    const dive = smooth(range(p, 0.025, 0.33));
    const floor = easeInOut(range(p, 0.22, 0.37));
    const card = easeInOut(range(p, 0.42, 0.47));
    const c = cardAt(p, W, H);

    // Orientation. The hero faces the eastern Mediterranean with Serbia in the upper left quarter.
    const idle = reduced ? 0 : Math.sin(t * 0.12) * 2.2;
    const heroLat = 12;
    const heroLon = 34 + (1 - intro) * 34 + idle;
    const lat = lerp(heroLat, VRCIN.lat, dive);
    const lon = lerp(heroLon, VRCIN.lon, dive);
    // Drift on the card so the dot floor stays alive.
    const drift = card * (reduced ? 0 : Math.sin(t * 0.21) * 0.5);
    earth.current!.rotation.set(lat * DEG + drift * DEG, -(lon + drift * 0.8) * DEG, 0, 'XYZ');

    // Camera distance and tilt. Dive in, skim the floor, then rise for the card.
    let D = lerp(D0, 1.16, dive);
    D = lerp(D, 1.05, floor);
    D = lerp(D, 1.22, card);
    const gamma = lerp(lerp(0, 13, floor), 5.5, card) * DEG;
    const m = Math.max(floor, card);
    const roll = (Math.sin(dive * Math.PI) * -7 + card * (reduced ? 0 : Math.sin(t * 0.3) * 1.5)) * DEG;
    cam.position.set(0, -m * 0.02, D);
    v3.set(0, Math.sin(gamma), Math.cos(gamma)).multiplyScalar(m);
    vUp.set(Math.sin(roll), Math.cos(roll), 0).lerp(new THREE.Vector3(0, 0, 1), m).normalize();
    cam.up.copy(vUp);
    cam.lookAt(v3);
    cam.near = 0.004;
    cam.far = 20;

    // View offset. The globe centre sits right of the page centre in the hero, the card centre later.
    let ox = lerp(W / 2 - cx, 0, dive);
    let oy = lerp(H / 2 - cy, 0, dive);
    ox = lerp(ox, W / 2 - (c.x + c.w / 2), card);
    oy = lerp(oy, H / 2 - (c.y + c.h / 2), card);
    cam.setViewOffset(W, H, ox, oy, W, H);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    // Uniforms.
    const swell = lerp(1, 4.2, easeInOut(range(p, 0.27, 0.41))) * (1 - card) + card * 1.25;
    dotU.uSwell.value = swell * (1 + (1 - dive) * 0.2);
    dotU.uTime.value = t;
    const fade = 1 - easeInOut(range(p, 0.335, 0.385)) * (1 - card);
    dotU.uFlood.value = easeInOut(range(p, 0.26, 0.34)) * (1 - card);
    dotU.uRim.value = 1 - dive * 0.35;
    dotU.uFine.value = easeInOut(range(p, 0.21, 0.29));
    for (const k of ['uSwell', 'uTime', 'uFlood', 'uRim', 'uFine'] as const) fineU[k].value = dotU[k].value;
    fineU.uSwell.value = lerp(1, 3.3, easeInOut(range(p, 0.27, 0.4))) * (1 - card) + card * 1.15;
    bodyU.uRim.value = (1 - dive * 0.3) * fade;
    shellU.uRim.value = (1 - dive * 0.25) * (0.35 + 0.65 * intro) * fade;
    bgU.uPool.value = (1 - easeInOut(range(p, 0.03, 0.2))) * (0.4 + 0.6 * intro);
    bgU.uRes.value.set(W, H);
    bgU.uGlobe.value.set(cx, H - cy);
    // Globe centre in view space for the shell.
    shellU.uCenter.value.set(0, 0, 0).applyMatrix4(earth.current!.matrixWorld).applyMatrix4(cam.matrixWorldInverse);

    // Arcs. The first set draws in on load, the second set is drawn by the scroll.
    arcs.forEach(({ u }, k) => {
      const a = arcAll[k];
      const draw = a.set === 0 ? clamp01((t - 0.9 - a.i * 0.28) / 1.3) : easeInOut(range(p, 0.1 + a.i * 0.035, 0.24 + a.i * 0.035));
      const d = reduced ? 1 : a.set === 0 ? expoOut(draw) : draw;
      u.uDraw.value = d;
      const loop = ((t * 0.32 + k * 0.37) % 1.25) - 0.1;
      u.uHead.value = d < 1 ? d : reduced ? 0.8 : loop;
      u.uAlpha.value = 1 - easeInOut(range(p, 0.36, 0.4)) * (1 - card);
      u.uViewH.value = H;
      u.uLift.value = lerp(0.45, 1.6, easeInOut(range(p, 0.08, 0.3)));
    });

    // Marker. The pulse ring grows and fades, the marker keeps a readable size near the floor.
    const camDist = cam.position.distanceTo(v3.copy(vrcinN).applyMatrix4(earth.current!.matrixWorld));
    const ms = Math.min(1, Math.max(0.12, camDist / 2.4));
    marker.current?.scale.setScalar(ms * (0.6 + 0.4 * intro));
    const pulse = reduced ? 0.5 : (t * 0.7) % 1;
    if (ring.current) {
      ring.current.scale.setScalar(1 + pulse * 2.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.9;
    }

    // Tags in the DOM follow their anchors.
    const tagFade = intro * (1 - easeInOut(range(p, 0.3, 0.36)));
    tagVecs.forEach((tv, i) => {
      const el = tagEls.current[i];
      if (!el) return;
      v3.copy(tv).applyMatrix4(earth.current!.matrixWorld);
      const facing = v3.clone().normalize().dot(cam.position.clone().sub(v3).normalize());
      v3.project(cam);
      const x = (v3.x * 0.5 + 0.5) * W;
      const y = (-v3.y * 0.5 + 0.5) * H;
      const show = tagFade * clamp01((facing - 0.05) * 6) * clamp01((t - 1.6 - i * 0.2) * 2.5);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = show.toFixed(3);
      el.style.visibility = show > 0.01 ? 'visible' : 'hidden';
    });
  });

  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false} material={mats.bg}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <group ref={earth}>
        <mesh renderOrder={0} material={mats.body}>
          <sphereGeometry args={[0.998, 96, 64]} />
        </mesh>
        {!HIDE.includes('d') && <Dots uniforms={dotU} />}
        {!HIDE.includes('f') && <Dots uniforms={fineU} fine />}
        {!HIDE.includes('a') && arcs.map((a, k) => (
          <group key={k}>
            <mesh geometry={a.geo} material={a.halo} renderOrder={3} frustumCulled={false} />
            <mesh geometry={a.geo} material={a.core} renderOrder={4} frustumCulled={false} />
          </group>
        ))}
        {!HIDE.includes('m') && <Marker groupRef={marker} ringRef={ring} />}
      </group>
      <mesh renderOrder={2} material={mats.atmo}>
        <sphereGeometry args={[1.004, 96, 64]} />
      </mesh>
      <mesh renderOrder={2} material={mats.shell}>
        <sphereGeometry args={[1.5, 96, 64]} />
      </mesh>
    </>
  );
}

export function Globe(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      flat
      frameloop={props.reduced ? 'demand' : 'always'}
      camera={{ fov: FOV, position: [0, 0, 3.6], near: 0.004, far: 20 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
