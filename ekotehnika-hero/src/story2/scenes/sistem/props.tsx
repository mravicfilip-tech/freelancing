// Shared set dressing for the Sistem scene. Low poly trees with a trunk and faceted crown masses in two tones from the
// key light, each set in a kerbed tree pit with a contact shadow, clipped hedges, shrubs in planters, a real lamp post,
// a detailed van with the Ekotehnika livery and real wheels (tyre with tread and sidewall, rim, hub), kerbs with a
// chamfer and a gutter. Everything is white, an LMH grey or black, lit by the scene rig, nothing is a cone or a blob.
// Meshes are merged per kind and instanced. The build in on load lives here too, see introClock.
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBox } from '@react-three/drei';
import { G, K, blobMaterial, clamp01, lam, lerp, lit, poolMaterial, rng, signGeometry } from './kit';
import { INTRO_SKIP, introStart, markIntroStart } from './intro';

// ---- geometry helpers ---------------------------------------------------------------------------------------

// A part and its colour. With a shade colour, every face turned away from the key light takes the shade, so a crown
// reads in two tones from the light and not as one flat grey.
type Part = { geo: THREE.BufferGeometry; color: string; shade?: string };

// The key light comes from the upper left, in front of the side camera (Lights in camera.tsx).
const KEY_DIR = new THREE.Vector3(-5, 13, 10).normalize();

// Bake a part's colour into its vertices, so a whole tree or shrub is one geometry and one draw. Smooth keeps the
// geometry indexed with its own normals, for round parts such as tyres, and every part in the call must be indexed.
function tint(parts: Part[], smooth = false) {
  const geos = parts.map(({ geo, color, shade }) => {
    const g = smooth ? geo.clone() : geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
    if (!smooth) g.computeVertexNormals();
    const c = lit(color);
    const s = shade ? lit(shade) : c;
    const nrm = g.getAttribute('normal');
    const n = g.getAttribute('position').count;
    const a = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const k = shade && v.fromBufferAttribute(nrm, i).dot(KEY_DIR) < 0.18 ? s : c;
      a[i * 3] = k.r;
      a[i * 3 + 1] = k.g;
      a[i * 3 + 2] = k.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  });
  const out = mergeGeometries(geos, false)!;
  geos.forEach((g) => g.dispose());
  return out;
}

// ---- the build in on load ---------------------------------------------------------------------------------------

// On load the street builds in, timed from the first frame and not from the scroll. The road and the kerbs draw along
// from the left, the trees and the modules rise out of the ground one after another, and the forklift drives into its
// place once its model is ready (index.tsx). Nothing fades. A frozen clock (?at=) or reduced motion skips it, so a
// shot always shows the final pose.
// The start is shared with the shell through intro.ts, so the hero text rises with the street.
const SKIP = INTRO_SKIP;

/** Seconds since the scene's first frame, Infinity when the build in is skipped. */
export function introClock() {
  if (SKIP) return Infinity;
  const now = performance.now();
  markIntroStart(now);
  return (now - introStart()) / 1000;
}
/** Every part of the build in has landed by then, in seconds. */
export const INTRO_END = 2.6;
const ROAD_S = 1.3;
const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** The world x the road, the kerbs and the pavement have drawn to at time t. The hero frame spans about x -12 to 14. */
export const introFront = (t: number) => (t >= ROAD_S ? Infinity : lerp(-16, 18, outCubic(t / ROAD_S)));

/** How far a thing standing at world x has risen at time t, 0 under the ground, 1 in place. Left to right, a beat apart. */
export function introRise(t: number, x: number) {
  if (t === Infinity) return 1;
  const delay = 0.25 + 1.05 * clamp01((x + 14) / 30);
  return outCubic((t - delay) / 0.75);
}

let stripTex: THREE.Texture | undefined;
/** A soft contact shadow along the foot of a wall, ink at the plane's -y edge, clear at its +y edge. Lay it flat. */
export function stripShadowMaterial(opacity = 0.34) {
  if (!stripTex) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 64;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 64, 0, 0);
    grd.addColorStop(0, 'rgba(34,34,34,1)');
    grd.addColorStop(0.35, 'rgba(34,34,34,0.45)');
    grd.addColorStop(1, 'rgba(34,34,34,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 64);
    stripTex = new THREE.CanvasTexture(c);
    stripTex.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshBasicMaterial({ map: stripTex, transparent: true, opacity, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
}

/** Lifts its children out of the ground during the build in, by depth metres, for a thing standing at world x. */
export function Rise({ x, depth, children }: { x: number; depth: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const t = introClock();
    g.current.position.y = t > INTRO_END ? 0 : -depth * (1 - introRise(t, x));
  });
  return <group ref={g}>{children}</group>;
}

// A faceted lump, an icosahedron with every vertex pushed in or out by a hash of its place, so the same corner
// always moves the same way and the mass has no gaps.
function lump(radius: number, seed: number, detail = 1, squash = 1) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const p = g.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const h = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719 + seed * 4.1) * 43758.5453;
    const f = 0.9 + (h - Math.floor(h)) * 0.2;
    p.setXYZ(i, v.x * f, v.y * f * squash, v.z * f);
  }
  return g;
}
const at = (g: THREE.BufferGeometry, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0) => {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz)));
  return g;
};

// Three tree shapes, each 1 m wide at the crown base and about 3.2 m tall, scaled when placed.
// Trunk with a root flare where it meets the pit, then two or three crown masses. Each mass takes two tones from the
// key light, the lit faces white or pale and the faces turned away one LMH grey down, so the crown has a form.
function treeGeometry(variant: number, mid = false) {
  const flare = at(new THREE.CylinderGeometry(0.12, 0.2, 0.22, 7, 1), 0, 0.11, 0);
  const trunk = at(new THREE.CylinderGeometry(0.07, 0.13, 1.5, 7, 1), 0, 0.75, 0);
  const trunk2 = at(new THREE.CylinderGeometry(0.04, 0.07, 0.8, 5, 1), 0.18, 1.5, 0.05);
  tiltBranch(trunk2, 0.35);
  const parts: Part[] = [
    { geo: flare, color: G.dark, shade: G.graphite },
    { geo: trunk, color: G.dark, shade: G.graphite },
    { geo: trunk2, color: G.dark, shade: G.graphite },
  ];
  // light crowns for the airy outdoor beats, mid toned crowns for the yard seen from above, where white on white is lost.
  // Each entry is the lit tone and the shade tone.
  const L: [string, string][] = mid
    ? [[G.light, G.mid], [G.pale, G.light], [G.light, G.mid]]
    : [[G.white, G.light], [G.pale, G.light], [G.white, G.pale]];
  const crowns: [number, number, number, number, number, number][][] = [
    [[0, 2.2, 0, 0.95, 0.9, 0], [0.5, 1.75, 0.25, 0.7, 0.8, 1], [-0.45, 1.8, -0.2, 0.68, 0.8, 1], [0.05, 2.85, 0.05, 0.55, 0.9, 2]],
    [[0, 2.1, 0, 1.0, 1.0, 2], [-0.5, 1.65, 0.2, 0.7, 0.85, 0], [0.55, 1.8, -0.15, 0.72, 0.85, 1]],
    [[0.0, 2.35, 0.0, 0.78, 1.25, 0], [0.38, 1.75, 0.15, 0.62, 1.1, 1], [-0.35, 1.9, -0.1, 0.6, 1.1, 2], [0.0, 3.0, 0.0, 0.5, 1.2, 2]],
  ];
  crowns[variant % 3].forEach(([x, y, z, r, sy, c], i) => parts.push({ geo: at(lump(r, variant * 7 + i, 1, sy), x, y, z), color: L[c][0], shade: L[c][1] }));
  return tint(parts);
}

// A kerbed tree pit, 1.3 m square. Four kerb stones with a lit top, soil a step down inside them, and a grille ring
// round the trunk. Sits on the ground at the origin, not scaled with the tree.
function pitGeometry() {
  const s = 1.3;
  const w = 0.14;
  const parts: Part[] = [
    { geo: at(new THREE.BoxGeometry(s, 0.13, w), 0, 0.065, s / 2 - w / 2), color: G.pale, shade: G.light },
    { geo: at(new THREE.BoxGeometry(s, 0.13, w), 0, 0.065, -s / 2 + w / 2), color: G.pale, shade: G.light },
    { geo: at(new THREE.BoxGeometry(w, 0.13, s - 2 * w), s / 2 - w / 2, 0.065, 0), color: G.pale, shade: G.light },
    { geo: at(new THREE.BoxGeometry(w, 0.13, s - 2 * w), -s / 2 + w / 2, 0.065, 0), color: G.pale, shade: G.light },
    { geo: at(new THREE.BoxGeometry(s - 2 * w, 0.06, s - 2 * w), 0, 0.03, 0), color: G.mid },
  ];
  // the cast grille, four bars and a ring round the trunk
  for (const a of [0, Math.PI / 2]) {
    const b = new THREE.BoxGeometry(s - 2 * w, 0.025, 0.05);
    b.rotateY(a);
    for (const o of [-0.3, 0.3]) parts.push({ geo: at(b.clone(), a ? o : 0, 0.075, a ? 0 : o), color: G.graphite });
  }
  const ring = new THREE.TorusGeometry(0.24, 0.025, 4, 16);
  ring.rotateX(Math.PI / 2);
  parts.push({ geo: at(ring, 0, 0.08, 0), color: G.graphite });
  return tint(parts);
}
function tiltBranch(g: THREE.BufferGeometry, a: number) {
  g.rotateZ(-a);
}

// A folded low poly leaf standing from the origin, length L, half width w, bent back at the tip.
function leaf(L: number, w: number, fold = 0.07) {
  const g = new THREE.BufferGeometry();
  const v = [
    0, 0, 0, // base
    -w, L * 0.42, fold * 0.2, // left shoulder
    w, L * 0.42, fold * 0.2, // right shoulder
    0, L * 0.45, fold * 1.5, // midrib, raised, so the leaf shows a fold
    0, L, fold * 0.6 + L * 0.12, // tip, bent back
  ];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex([0, 1, 3, 0, 3, 2, 1, 4, 3, 2, 3, 4]);
  return g;
}

// A shrub as a rosette of folded leaves round a low faceted mound, so it reads as a plant and not a stone.
const shrubGeometry = (variant: number) => {
  const r = rng(40 + variant);
  const parts: Part[] = [{ geo: at(lump(0.3, variant, 1, 0.5), 0, 0.08, 0), color: G.mid }];
  const cols = [G.white, G.pale, G.light, G.pale, G.white];
  const n = 18 + variant * 3;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.5;
    const ring = i % 3; // inner leaves stand up, outer ones fan out
    const L = 0.55 + r() * 0.35 - ring * 0.08;
    const g = leaf(L, 0.11 + r() * 0.05);
    g.rotateX(0.35 + ring * 0.38 + r() * 0.16);
    g.rotateY(a);
    g.translate(Math.cos(a) * 0.04, 0.06, Math.sin(a) * 0.04);
    parts.push({ geo: g, color: cols[(i + variant) % cols.length] });
  }
  return tint(parts);
};

// ---- trees --------------------------------------------------------------------------------------------------

// Flat shaded, lifted with a little white so the crowns read light, low enough that the two tones and the rig's shading
// still show.
const crownMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.16 });
const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.28 });
const pitMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.12 });
const treeShadow = blobMaterial(0.3);

export type TreeSpec = { x: number; z: number; h: number; ry?: number; v?: number };

// Trees in three shapes, instanced. Every trunk stands in a kerbed pit (or on the verge it is given, pit false) with a
// soft contact shadow the width of its crown, so no tree floats on the ground. With rise, each tree comes up out of the
// ground during the build in on load.
export function Trees({ items, castShadow = true, mid = false, pit = true, rise = false, ground = 0 }: { items: TreeSpec[]; castShadow?: boolean; mid?: boolean; pit?: boolean; rise?: boolean; ground?: number }) {
  const geos = useMemo(() => [0, 1, 2].map((v) => treeGeometry(v, mid)), [mid]);
  const pitGeo = useMemo(pitGeometry, []);
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const pits = useRef<THREE.InstancedMesh>(null);
  const shadows = useRef<THREE.InstancedMesh>(null);
  const by = useMemo(() => [0, 1, 2].map((v) => items.filter((t, i) => (t.v ?? i) % 3 === v)), [items]);
  const landed = useRef(false);
  const place = (t: number) => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    by.forEach((list, v) => {
      list.forEach((tr, i) => {
        const s = tr.h / 3.2;
        const y = -(tr.h + 0.4) * (1 - introRise(t, tr.x));
        q.setFromEuler(new THREE.Euler(0, tr.ry ?? i * 1.7, 0));
        refs[v].current!.setMatrixAt(i, m.compose(p.set(tr.x, y, tr.z), q, sc.set(s, s * (0.92 + ((i * 37) % 10) / 60), s)));
      });
      refs[v].current!.instanceMatrix.needsUpdate = true;
    });
    items.forEach((tr, i) => {
      const e = introRise(t, tr.x);
      if (pits.current) pits.current.setMatrixAt(i, m.compose(p.set(tr.x, -0.2 * (1 - e), tr.z), q.identity(), sc.set(1, 1, 1)));
      const d = (tr.h / 3.2) * 2.3 * Math.max(e, 0.001);
      if (shadows.current) shadows.current.setMatrixAt(i, m.compose(p.set(tr.x + 0.25, ground + 0.022, tr.z - 0.2), q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), sc.set(d * 1.15, d, 1)));
    });
    if (pits.current) pits.current.instanceMatrix.needsUpdate = true;
    if (shadows.current) shadows.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    landed.current = false;
    place(rise ? 0 : Infinity);
  }, [by, items, rise, ground]);
  useFrame(() => {
    if (!rise || landed.current) return;
    const t = introClock();
    landed.current = t > INTRO_END;
    place(landed.current ? Infinity : t);
  });
  const n = Math.max(items.length, 1);
  return (
    <group>
      {geos.map((g, v) => (
        <instancedMesh key={`${v}${by[v].length}`} ref={refs[v]} args={[g, crownMat, Math.max(by[v].length, 1)]} count={by[v].length} castShadow={castShadow} receiveShadow frustumCulled={false} />
      ))}
      {pit && <instancedMesh key={`p${n}`} ref={pits} args={[pitGeo, pitMat, n]} count={items.length} receiveShadow frustumCulled={false} />}
      <instancedMesh key={`s${n}`} ref={shadows} args={[undefined, treeShadow, n]} count={items.length} renderOrder={1} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}

// ---- hedges and shrubs --------------------------------------------------------------------------------------

// One hedge length, a clipped block 1.6 m long with a faceted, slightly uneven top, centred on the origin.
const hedgeGeometry = (variant: number) => {
  const g = new THREE.BoxGeometry(1.58, 0.66, 0.64, 6, 2, 3);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const h = Math.sin(x * 51.7 + z * 33.1 + variant * 9.3) * 43758.5453;
    const j = h - Math.floor(h) - 0.5;
    if (y > 0.1) p.setY(i, y + j * 0.1);
    p.setX(i, x + j * 0.03);
    p.setZ(i, z + (j * 0.05) * (y > 0 ? 1 : 0.4));
  }
  at(g, 0, 0.33, 0);
  const base = at(new THREE.BoxGeometry(1.6, 0.14, 0.7), 0, 0.07, 0);
  return tint([{ geo: base, color: G.light }, { geo: g, color: G.pale }]);
};

// A clipped hedge, lengths of faceted box and lobes laid end to end.
export function Hedge({ x, z, len }: { x: number; z: number; len: number; h?: number; d?: number }) {
  const geos = useMemo(() => [0, 1].map(hedgeGeometry), []);
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const n = Math.max(1, Math.round(len / 1.6));
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const cnt = [0, 0];
    for (let i = 0; i < n; i++) {
      const v = i % 2;
      refs[v].current!.setMatrixAt(cnt[v]++, m.compose(new THREE.Vector3(x + (i + 0.5) * (len / n), 0, z), new THREE.Quaternion(), new THREE.Vector3(len / n / 1.6, 1, 1)));
    }
    refs.forEach((r, v) => {
      r.current!.count = cnt[v];
      r.current!.instanceMatrix.needsUpdate = true;
    });
  }, [x, z, len, n, refs]);
  return (
    <group>
      {geos.map((g, v) => (
        <instancedMesh key={v} ref={refs[v]} args={[g, crownMat, Math.ceil(n / 2) + 1]} castShadow receiveShadow frustumCulled={false} />
      ))}
    </group>
  );
}

// Shrubs in a low planter bed, faceted clusters of two to four lobes.
export function Shrubs({ items }: { items: { x: number; z: number; s: number; v?: number }[] }) {
  const geos = useMemo(() => [0, 1, 2].map(shrubGeometry), []);
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const by = useMemo(() => [0, 1, 2].map((v) => items.filter((t, i) => (t.v ?? i) % 3 === v)), [items]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    by.forEach((list, v) => {
      list.forEach((t, i) => {
        refs[v].current!.setMatrixAt(i, m.compose(new THREE.Vector3(t.x, 0, t.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 2.3, 0)), new THREE.Vector3(t.s, t.s, t.s)));
      });
      refs[v].current!.instanceMatrix.needsUpdate = true;
    });
  }, [by, refs]);
  return (
    <group>
      {geos.map((g, v) => (
        <instancedMesh key={`${v}${by[v].length}`} ref={refs[v]} args={[g, leafMat, Math.max(by[v].length, 1)]} count={by[v].length} castShadow receiveShadow frustumCulled={false} />
      ))}
    </group>
  );
}

// A planter bed with its shrubs, an edged strip of ground.
export function Planter({ x, z, len, d = 1.4, s = 1, seed = 1 }: { x: number; z: number; len: number; d?: number; s?: number; seed?: number }) {
  const items = useMemo(() => {
    const r = rng(seed);
    const n = Math.max(2, Math.round(len / (1.05 * s)));
    return Array.from({ length: n }, (_, i) => ({ x: x + (i + 0.5) * (len / n), z: z + (r() - 0.5) * 0.16, s: s * (0.85 + r() * 0.35), v: i + seed }));
  }, [x, z, len, s, seed]);
  return (
    <group>
      <mesh position={[x + len / 2, 0.08, z]} material={lam(G.light)} receiveShadow castShadow>
        <boxGeometry args={[len + 0.2, 0.16, d]} />
      </mesh>
      <mesh position={[x + len / 2, 0.17, z]} material={lam(G.mid)} receiveShadow>
        <boxGeometry args={[len, 0.02, d - 0.2]} />
      </mesh>
      <Shrubs items={items} />
    </group>
  );
}

// ---- lamp post ----------------------------------------------------------------------------------------------

const warm = '#fff1d6';
const lampLight = new THREE.MeshBasicMaterial({ color: warm, toneMapped: false });
const lampPool = poolMaterial(0.55, warm);
const lampMetal = lam(G.graphite);
const lampJoint = lam(G.dark);
const lampSeam = lam(G.black);
const lampPlate = lam(G.mid);
const lampLens = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.6) });
const footShadow = blobMaterial(0.32);

// A real street light. A bolted base plate, a plinth with its access hatch, collars at the joints, a tapered pole, the
// curved arm and a flat luminaire with a framed lens, and a soft contact shadow where it stands.
export function LampPost({ x, z, h = 5.6, rot = 0 }: { x: number; z: number; h?: number; rot?: number }) {
  const arm = useMemo(() => {
    const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.1, 0.62, 0), new THREE.Vector3(0.95, 0.62, 0));
    return new THREE.TubeGeometry(c, 14, 0.045, 8, false);
  }, []);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.12, 0.022, -0.08]} material={footShadow} renderOrder={1}>
        <planeGeometry args={[1.1, 1.0]} />
      </mesh>
      {/* base plate and its four bolts */}
      <mesh position={[0, 0.02, 0]} material={lampPlate} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.04, 0.52]} />
      </mesh>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => (
        <mesh key={`${a}${b}`} position={[a * 0.19, 0.06, b * 0.19]} material={lampJoint} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 6]} />
        </mesh>
      ))}
      {/* the plinth with an access hatch facing the road */}
      <mesh position={[0, 0.36, 0]} material={lampMetal} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.64, 12]} />
      </mesh>
      <mesh position={[0, 0.36, 0.152]} material={lampSeam}>
        <boxGeometry args={[0.15, 0.36, 0.01]} />
      </mesh>
      <mesh position={[0, 0.36, 0.156]} material={lampMetal}>
        <boxGeometry args={[0.13, 0.34, 0.01]} />
      </mesh>
      <mesh position={[0, 0.46, 0.163]} material={lampJoint}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 8]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={lampJoint} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 12]} />
      </mesh>
      {/* the pole, a collar at the joint near the top */}
      <mesh position={[0, 0.72 + (h - 0.72) / 2, 0]} material={lampMetal} castShadow>
        <cylinderGeometry args={[0.06, 0.1, h - 0.72, 12]} />
      </mesh>
      <mesh position={[0, h * 0.62, 0]} material={lampJoint}>
        <cylinderGeometry args={[0.092, 0.092, 0.06, 12]} />
      </mesh>
      <mesh position={[0, h - 0.04, 0]} geometry={arm} material={lampMetal} castShadow />
      <group position={[0.95, h + 0.58, 0]}>
        <RoundedBox args={[0.9, 0.1, 0.34]} radius={0.04} smoothness={2} position={[0.1, 0, 0]} material={lampMetal} castShadow />
        {/* a fin along the top and the end cap */}
        <mesh position={[0.1, 0.07, 0]} material={lampJoint} castShadow>
          <boxGeometry args={[0.7, 0.04, 0.06]} />
        </mesh>
        <mesh position={[-0.37, 0, 0]} material={lampJoint}>
          <boxGeometry args={[0.04, 0.12, 0.3]} />
        </mesh>
        {/* the lens in its frame */}
        <mesh position={[0.1, -0.052, 0]} material={lampSeam}>
          <boxGeometry args={[0.8, 0.012, 0.28]} />
        </mesh>
        <mesh position={[0.1, -0.06, 0]} material={lampLens}>
          <boxGeometry args={[0.76, 0.012, 0.24]} />
        </mesh>
        <mesh position={[0.1, -0.068, 0]} material={lampLight}>
          <boxGeometry args={[0.66, 0.006, 0.16]} />
        </mesh>
      </group>
      {/* the light on the ground, soft and warm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.05, 0.035, 0]} material={lampPool}>
        <planeGeometry args={[7.5, 5]} />
      </mesh>
    </group>
  );
}

// ---- kerb ---------------------------------------------------------------------------------------------------

// One kerb stone with its road side to +z. A profile with a chamfer on the road edge, a gutter strip on the road at its
// foot and a dark joint line where stone meets gutter, all one geometry. Length along x, centred, sitting on y = 0.
function kerbGeometry(len: number, w: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, 0.12);
  s.lineTo(w / 2 - 0.045, 0.165);
  s.lineTo(-w / 2, 0.165);
  s.closePath();
  const stone = new THREE.ExtrudeGeometry(s, { depth: len - 0.035, bevelEnabled: false });
  // the shape lies in x y and extrudes along z, so turn it to run along x with its road face to +z
  stone.rotateY(-Math.PI / 2);
  stone.translate(-(len - 0.035) / 2, 0, 0);
  const gutter = at(new THREE.BoxGeometry(len, 0.008, 0.22), 0, 0.03, w / 2 + 0.11);
  const joint = at(new THREE.BoxGeometry(len, 0.01, 0.035), 0, 0.032, w / 2 + 0.0175);
  return tint([
    { geo: stone, color: G.pale, shade: G.light },
    { geo: gutter, color: G.light },
    { geo: joint, color: G.mid },
  ]);
}
const kerbMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.1 });

// A straight kerb stone run with a joint every 2 m. The road side is worked out from z, a kerb north of the road
// (z < 0) faces +z. With draw, the run draws along from the left during the build in on load.
export function Kerb({ x0, x1, z, w = 0.2, draw = false }: { x0: number; x1: number; z: number; w?: number; draw?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = Math.floor((x1 - x0) / 2);
  const len = (x1 - x0) / n;
  const geo = useMemo(() => kerbGeometry(len, w), [len, w]);
  const landed = useRef(false);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, z < 0 ? 0 : Math.PI, 0));
    for (let i = 0; i < n; i++) ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x0 + (i + 0.5) * len, 0, z), q, new THREE.Vector3(1, 1, 1)));
    ref.current!.instanceMatrix.needsUpdate = true;
    landed.current = false;
  }, [x0, len, n, z]);
  useFrame(() => {
    if (!ref.current || landed.current) return;
    const f = draw ? introFront(introClock()) : Infinity;
    landed.current = f === Infinity;
    ref.current.count = landed.current ? n : Math.max(0, Math.min(n, Math.floor((f - x0) / len)));
  });
  return <instancedMesh ref={ref} args={[geo, kerbMat, n]} receiveShadow castShadow frustumCulled={false} />;
}

// ---- wheel --------------------------------------------------------------------------------------------------

// The scene lifts its flat parts with emissive white, which would grey the tread too, so the wheel parts are lifted by
// gain instead. Black stays black and the greys come up to read like the rest of the set.
const tyreMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) });
const rimMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, color: new THREE.Color(1.9, 1.9, 1.9) });
const wheelCache = new Map<string, { tyre: THREE.BufferGeometry; rim: THREE.BufferGeometry }>();

// A road wheel, radius R and width W, its axis along y and its outer face to +y. The tyre is a turned profile with
// rounded shoulders, a sidewall with a raised lettering band and a tread of staggered blocks across the crown. The rim
// is a barrel, a lip, a dished face with six holes, a centre boss, five wheel nuts and a hub cap.
function wheelGeometry(R: number, W: number) {
  const key = `${R}|${W}`;
  const hit = wheelCache.get(key);
  if (hit) return hit;
  const prof = [
    [0.62, -0.4], [0.74, -0.5], [0.88, -0.5], [0.96, -0.44], [1, -0.32], [1, 0.32], [0.96, 0.44], [0.88, 0.5], [0.74, 0.5], [0.62, 0.4],
  ].map(([r, y]) => new THREE.Vector2(r * R, y * W));
  const body = new THREE.LatheGeometry(prof, 40);
  const tyre: Part[] = [{ geo: body, color: G.graphite }];
  for (const side of [1, -1]) {
    const band = new THREE.TorusGeometry(0.8 * R, 0.012, 4, 40);
    band.rotateX(Math.PI / 2);
    tyre.push({ geo: at(band, 0, side * 0.5 * W, 0), color: G.dark });
  }
  const lugs = 30;
  for (let i = 0; i < lugs; i++) {
    for (const side of [1, -1]) {
      const a = ((i + (side > 0 ? 0 : 0.5)) / lugs) * Math.PI * 2;
      const b = new THREE.BoxGeometry(0.045, 0.3 * W, 0.022);
      b.translate(0, side * 0.17 * W, R + 0.006);
      b.rotateY(a);
      tyre.push({ geo: b, color: G.black });
    }
  }
  const rim: Part[] = [
    { geo: new THREE.CylinderGeometry(0.62 * R, 0.62 * R, 0.8 * W, 32, 1, true), color: G.mid },
    { geo: at(new THREE.CylinderGeometry(0.6 * R, 0.6 * R, 0.03, 32), 0, -0.3 * W, 0), color: G.mid },
    { geo: at(new THREE.CylinderGeometry(0.6 * R, 0.6 * R, 0.02, 32), 0, 0.3 * W, 0), color: G.light },
    { geo: at(new THREE.CylinderGeometry(0.22 * R, 0.25 * R, 0.07, 20), 0, 0.33 * W, 0), color: G.pale },
    { geo: at(new THREE.CylinderGeometry(0.08 * R, 0.08 * R, 0.03, 12), 0, 0.33 * W + 0.045, 0), color: G.graphite },
  ];
  const lip = new THREE.TorusGeometry(0.635 * R, 0.022, 6, 40);
  lip.rotateX(Math.PI / 2);
  rim.push({ geo: at(lip, 0, 0.42 * W, 0), color: G.pale });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    rim.push({ geo: at(new THREE.CylinderGeometry(0.085 * R, 0.085 * R, 0.022, 10), Math.cos(a) * 0.42 * R, 0.3 * W + 0.002, Math.sin(a) * 0.42 * R), color: G.black });
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    rim.push({ geo: at(new THREE.CylinderGeometry(0.035 * R, 0.035 * R, 0.03, 6), Math.cos(a) * 0.15 * R, 0.33 * W + 0.04, Math.sin(a) * 0.15 * R), color: G.graphite });
  }
  const out = { tyre: tint(tyre, true), rim: tint(rim, true) };
  wheelCache.set(key, out);
  return out;
}

/** A wheel standing on the ground at x, z, turned so its outer face looks away from the vehicle's centre line. */
export function Wheel({ x, z, r = 0.36, w = 0.24 }: { x: number; z: number; r?: number; w?: number }) {
  const g = useMemo(() => wheelGeometry(r, w), [r, w]);
  return (
    <group position={[x, r, z]} rotation={[z > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}>
      <mesh geometry={g.tyre} material={tyreMat} castShadow receiveShadow />
      <mesh geometry={g.rim} material={rimMat} castShadow />
    </group>
  );
}

// ---- van ----------------------------------------------------------------------------------------------------

const vanBody = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.55) });
const vanPale = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.55) });
const vanGraphite = lam(G.graphite);
const vanGlass = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.4) });
const vanGlassHi = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.5) });
const vanDark = lam(G.black);
const vanSeam = lam(G.mid);
const vanLens = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.7) });
const plateMat = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.8) });
const lightMat = new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false });
const vanShadow = blobMaterial(0.36);

// A thin box laid on a surface, for panel lines, frames and seals.
const Bar = ({ p, s, m }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material }) => (
  <mesh position={p} material={m}>
    <boxGeometry args={s} />
  </mesh>
);

// A number plate without text, a white plate in a graphite border, facing +x.
const Plate = ({ x, y }: { x: number; y: number }) => (
  <group position={[x, y, 0]}>
    <Bar p={[0, 0, 0]} s={[0.012, 0.13, 0.54]} m={vanGraphite} />
    <Bar p={[0.008, 0, 0]} s={[0.01, 0.105, 0.51]} m={plateMat} />
  </group>
);

// The Ekotehnika van. Cargo box and cab with panel lines, a sliding door on its rail, cab doors, glass in black rubber
// seals with a lighter band, wipers, a slatted grille, framed head and tail lamps, plates without text, mirrors on arms,
// wheel arch lips, sill skirts, real wheels and a soft contact shadow. A graphite livery band with the wordmark in
// Daxline caps on both sides. About 5.3 m long, 2.3 m high, facing +x.
export function Van({ x, z, yaw = 0, scale = 1 }: { x: number; z: number; yaw?: number; scale?: number }) {
  const word = useMemo(() => {
    const g = signGeometry('EKOTEHNIKA', 0.3, 0.02);
    g.computeBoundingBox();
    return g;
  }, []);
  const arch = useMemo(() => new THREE.TorusGeometry(0.44, 0.045, 6, 18, Math.PI), []);
  const ww = word.boundingBox!.max.x;
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, 0.028, 0]} material={vanShadow} renderOrder={1}>
        <planeGeometry args={[6.1, 2.9]} />
      </mesh>
      {/* chassis and floor */}
      <mesh position={[0, 0.5, 0]} material={vanDark} castShadow>
        <boxGeometry args={[5.0, 0.2, 1.7]} />
      </mesh>
      {/* cargo box */}
      <RoundedBox args={[3.3, 1.85, 2.0]} radius={0.1} smoothness={3} position={[-0.95, 1.52, 0]} material={vanBody} castShadow receiveShadow />
      {/* cab, lower body and the roof line */}
      <RoundedBox args={[1.9, 1.05, 2.0]} radius={0.14} smoothness={3} position={[1.55, 1.07, 0]} material={vanBody} castShadow receiveShadow />
      <RoundedBox args={[1.3, 0.78, 1.96]} radius={0.16} smoothness={3} position={[1.25, 1.84, 0]} material={vanBody} castShadow />
      {/* bonnet, grille with its slats and a plain badge, the bumper with a step */}
      <RoundedBox args={[0.35, 0.34, 1.96]} radius={0.08} smoothness={2} position={[2.52, 0.78, 0]} material={vanPale} castShadow />
      <Bar p={[2.7, 0.8, 0]} s={[0.02, 0.22, 1.0]} m={vanGraphite} />
      {[0.73, 0.8, 0.87].map((y) => (
        <Bar key={y} p={[2.712, y, 0]} s={[0.012, 0.018, 0.94]} m={vanSeam} />
      ))}
      <mesh position={[2.72, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} material={vanPale}>
        <cylinderGeometry args={[0.055, 0.055, 0.015, 16]} />
      </mesh>
      <RoundedBox args={[0.2, 0.2, 2.02]} radius={0.06} smoothness={2} position={[2.64, 0.5, 0]} material={vanGraphite} castShadow />
      <Plate x={2.745} y={0.5} />
      {/* head lamps, a graphite surround, a pale lens and the lit element */}
      {[0.72, -0.72].map((s) => (
        <group key={s} position={[2.69, 0.98, s]}>
          <Bar p={[0, 0, 0]} s={[0.04, 0.2, 0.42]} m={vanGraphite} />
          <Bar p={[0.015, 0, 0]} s={[0.03, 0.15, 0.36]} m={vanLens} />
          <Bar p={[0.032, 0, s > 0 ? 0.06 : -0.06]} s={[0.01, 0.08, 0.14]} m={lightMat} />
        </group>
      ))}
      {/* windscreen in a black seal, a lighter band high on the glass, two wipers */}
      <mesh position={[1.86, 1.86, 0]} rotation={[0, 0, -0.5]} material={vanDark}>
        <boxGeometry args={[0.04, 0.7, 1.86]} />
      </mesh>
      <mesh position={[1.875, 1.86, 0]} rotation={[0, 0, -0.5]} material={vanGlass}>
        <boxGeometry args={[0.04, 0.62, 1.76]} />
      </mesh>
      <mesh position={[1.82, 2.0, 0]} rotation={[0, 0, -0.5]} material={vanGlassHi}>
        <boxGeometry args={[0.042, 0.14, 1.7]} />
      </mesh>
      {[0.35, -0.45].map((s) => (
        <mesh key={s} position={[2.03, 1.6, s]} rotation={[0.25, 0, -0.5]} material={vanGraphite}>
          <boxGeometry args={[0.02, 0.025, 0.7]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0, s * 1.0]}>
          {/* cab side window in a black seal, with a lighter band */}
          <Bar p={[1.4, 1.88, s * 0.005]} s={[1.04, 0.62, 0.02]} m={vanDark} />
          <Bar p={[1.42, 1.88, s * 0.016]} s={[0.92, 0.5, 0.01]} m={vanGlass} />
          <Bar p={[1.42, 2.04, s * 0.022]} s={[0.92, 0.1, 0.01]} m={vanGlassHi} />
          <Bar p={[1.62, 1.88, s * 0.024]} s={[0.035, 0.5, 0.01]} m={vanDark} />
          {/* cab door, its shut lines and the handle */}
          <Bar p={[1.1, 1.3, s * 0.012]} s={[0.012, 1.6, 0.01]} m={vanSeam} />
          <Bar p={[1.98, 1.0, s * 0.012]} s={[0.012, 0.9, 0.01]} m={vanSeam} />
          <Bar p={[1.54, 0.58, s * 0.012]} s={[0.88, 0.012, 0.01]} m={vanSeam} />
          <Bar p={[1.25, 1.42, s * 0.02]} s={[0.2, 0.045, 0.03]} m={vanGraphite} />
          {/* mirror on its arm, the glass to the rear */}
          <Bar p={[2.0, 1.72, s * 0.1]} s={[0.06, 0.04, 0.2]} m={vanGraphite} />
          <mesh position={[2.0, 1.78, s * 0.24]} material={vanGraphite} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.16]} />
          </mesh>
          <Bar p={[1.945, 1.78, s * 0.24]} s={[0.01, 0.22, 0.12]} m={vanGlassHi} />
          {/* sliding door, its shut lines, the rail on the rear quarter and the handle */}
          <Bar p={[-0.25, 1.48, s * 0.012]} s={[0.012, 1.7, 0.01]} m={vanSeam} />
          <Bar p={[0.62, 1.48, s * 0.012]} s={[0.012, 1.7, 0.01]} m={vanSeam} />
          <Bar p={[0.185, 2.33, s * 0.012]} s={[0.87, 0.012, 0.01]} m={vanSeam} />
          <Bar p={[-1.3, 1.66, s * 0.016]} s={[2.1, 0.035, 0.018]} m={vanGraphite} />
          <Bar p={[0.48, 1.4, s * 0.02]} s={[0.18, 0.045, 0.03]} m={vanGraphite} />
          {/* panel seams on the cargo box, a fuel flap and a side marker lamp */}
          <Bar p={[-1.75, 1.75, s * 0.012]} s={[0.012, 1.1, 0.01]} m={vanSeam} />
          <mesh position={[-2.0, 1.42, s * 0.012]} rotation={[Math.PI / 2, 0, 0]} material={vanSeam}>
            <cylinderGeometry args={[0.08, 0.08, 0.01, 16]} />
          </mesh>
          <Bar p={[-0.9, 0.72, s * 0.02]} s={[0.1, 0.05, 0.02]} m={vanLens} />
          {/* sill skirt between the wheels */}
          <Bar p={[0.0, 0.64, s * 0.0]} s={[2.1, 0.14, 0.04]} m={vanGraphite} />
          {/* wheel wells and the arch lips round them */}
          {[-1.65, 1.6].map((ax) => (
            <group key={ax}>
              <mesh position={[ax, 0.52, s * -0.01]} rotation={[Math.PI / 2, 0, 0]} material={vanDark}>
                <cylinderGeometry args={[0.45, 0.45, 0.01, 20]} />
              </mesh>
              <mesh geometry={arch} position={[ax, 0.38, s * 0.012]} material={vanGraphite} castShadow />
            </group>
          ))}
          {/* livery, a graphite band low on the cargo box, a thin line above it and the wordmark */}
          <mesh position={[-1.42, 0.98, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[2.34, 0.34, 0.012]} />
          </mesh>
          <mesh position={[-0.95, 1.22, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[3.28, 0.025, 0.012]} />
          </mesh>
        </group>
      ))}
      {/* the wordmark, both sides */}
      <mesh geometry={word} material={vanGraphite} position={[-0.95 - (ww * 0.9) / 2, 1.95, 1.011]} scale={[0.9, 0.9, 1]} />
      <mesh geometry={word} material={vanGraphite} position={[-0.95 + (ww * 0.9) / 2, 1.95, -1.011]} rotation={[0, Math.PI, 0]} scale={[0.9, 0.9, 1]} />
      {/* rear doors with their centre seam, hinges and handle, the bumper, the plate and the roof rail */}
      <Bar p={[-2.6, 1.52, 0]} s={[0.012, 1.7, 0.02]} m={vanSeam} />
      {[0.95, 2.1].flatMap((y) => [0.9, -0.9].map((zz) => <Bar key={`${y}${zz}`} p={[-2.605, y, zz]} s={[0.03, 0.14, 0.06]} m={vanGraphite} />))}
      <Bar p={[-2.61, 1.45, 0.12]} s={[0.03, 0.05, 0.16]} m={vanGraphite} />
      <RoundedBox args={[0.16, 0.18, 2.02]} radius={0.05} smoothness={2} position={[-2.58, 0.52, 0]} material={vanGraphite} castShadow />
      <group rotation={[0, Math.PI, 0]}>
        <Plate x={2.62} y={0.78} />
      </group>
      <mesh position={[-0.95, 2.47, 0]} material={vanPale}>
        <boxGeometry args={[3.0, 0.04, 1.5]} />
      </mesh>
      {/* tail lamps, tall clusters in a graphite frame */}
      {[0.84, -0.84].map((s) => (
        <group key={s} position={[-2.61, 1.05, s]}>
          <Bar p={[0, 0, 0]} s={[0.03, 0.46, 0.16]} m={vanGraphite} />
          <Bar p={[-0.012, 0.06, 0]} s={[0.02, 0.24, 0.12]} m={vanLens} />
          <Bar p={[-0.012, -0.14, 0]} s={[0.02, 0.1, 0.12]} m={vanGlassHi} />
        </group>
      ))}
      {/* wheels */}
      {/* set out so the rim face stands proud of the dark wheel well behind it */}
      {[-1.65, 1.6].flatMap((ax) => [0.93, -0.93].map((az) => <Wheel key={`${ax}${az}`} x={ax} z={az} />))}
    </group>
  );
}

export { K };

// ---- instanced boxes ----------------------------------------------------------------------------------------

export type BoxItem = [x: number, y: number, z: number, w: number, h: number, d: number];

// Many boxes of one material in one draw. Each item is centre x, y, z then width, height, depth.
export function BoxSet({ items, mat, cast = false, receive = true }: { items: BoxItem[]; mat: THREE.Material; cast?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    items.forEach(([x, y, z, w, h, d], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, d))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} castShadow={cast} receiveShadow={receive} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}
