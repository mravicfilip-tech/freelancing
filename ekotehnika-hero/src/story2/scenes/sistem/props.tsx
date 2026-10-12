// Shared set dressing for the Sistem scene. Low poly trees with a trunk and faceted crown masses, clipped hedges,
// shrubs in planters, a real lamp post, a detailed van with the Ekotehnika livery, kerbs. Everything is white,
// an LMH grey or black, lit by the scene rig, nothing is a cone or a blob. Meshes are merged per kind and instanced.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBox } from '@react-three/drei';
import { G, K, lam, lit, poolMaterial, rng, signGeometry } from './kit';

// ---- geometry helpers ---------------------------------------------------------------------------------------

type Part = { geo: THREE.BufferGeometry; color: string };

// Bake a part's colour into its vertices, so a whole tree or shrub is one geometry and one draw.
function tint(parts: Part[]) {
  const geos = parts.map(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const c = lit(color);
    const n = g.getAttribute('position').count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = c.r;
      a[i * 3 + 1] = c.g;
      a[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    g.deleteAttribute('uv');
    g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(geos, false)!;
  geos.forEach((g) => g.dispose());
  return out;
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
// Trunk, then two or three crown masses in white and the light greys, the top one the lightest.
function treeGeometry(variant: number, mid = false) {
  const trunk = at(new THREE.CylinderGeometry(0.07, 0.13, 1.5, 6, 1), 0, 0.75, 0);
  const trunk2 = at(new THREE.CylinderGeometry(0.04, 0.07, 0.8, 5, 1), 0.18, 1.5, 0.05);
  tiltBranch(trunk2, 0.35);
  const parts: Part[] = [
    { geo: trunk, color: G.dark },
    { geo: trunk2, color: G.dark },
  ];
  // light crowns for the airy outdoor beats, mid toned crowns for the yard seen from above, where white on white is lost
  const [c0, c1, c2, c3] = mid ? [G.light, G.mid, G.pale, G.light] : [G.pale, G.light, G.light, G.white];
  const crowns: [number, number, number, number, number, string][][] = [
    [[0, 2.2, 0, 0.95, 0.9, c0], [0.5, 1.75, 0.25, 0.7, 0.8, c1], [-0.45, 1.8, -0.2, 0.68, 0.8, c2], [0.05, 2.85, 0.05, 0.55, 0.9, c3]],
    [[0, 2.1, 0, 1.0, 1.0, mid ? G.pale : G.white], [-0.5, 1.65, 0.2, 0.7, 0.85, c0], [0.55, 1.8, -0.15, 0.72, 0.85, c1]],
    [[0.0, 2.35, 0.0, 0.78, 1.25, c0], [0.38, 1.75, 0.15, 0.62, 1.1, c1], [-0.35, 1.9, -0.1, 0.6, 1.1, mid ? G.pale : G.white], [0.0, 3.0, 0.0, 0.5, 1.2, c3]],
  ];
  crowns[variant % 3].forEach(([x, y, z, r, sy, col], i) => parts.push({ geo: at(lump(r, variant * 7 + i, 1, sy), x, y, z), color: col }));
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

// Flat shaded, lifted with a little white so the facets stay close in tone and the crowns read light.
const crownMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.3 });
const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true, toneMapped: false, flatShading: true, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.28 });

export type TreeSpec = { x: number; z: number; h: number; ry?: number; v?: number };

export function Trees({ items, castShadow = true, mid = false }: { items: TreeSpec[]; castShadow?: boolean; mid?: boolean }) {
  const geos = useMemo(() => [0, 1, 2].map((v) => treeGeometry(v, mid)), [mid]);
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const by = useMemo(() => [0, 1, 2].map((v) => items.filter((t, i) => (t.v ?? i) % 3 === v)), [items]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    by.forEach((list, v) => {
      list.forEach((t, i) => {
        const s = t.h / 3.2;
        refs[v].current!.setMatrixAt(i, m.compose(new THREE.Vector3(t.x, 0, t.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t.ry ?? i * 1.7, 0)), new THREE.Vector3(s, s * (0.92 + ((i * 37) % 10) / 60), s)));
      });
      refs[v].current!.instanceMatrix.needsUpdate = true;
    });
  }, [by, refs]);
  return (
    <group>
      {geos.map((g, v) => (
        <instancedMesh key={`${v}${by[v].length}`} ref={refs[v]} args={[g, crownMat, Math.max(by[v].length, 1)]} count={by[v].length} castShadow={castShadow} receiveShadow frustumCulled={false} />
      ))}
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
export function LampPost({ x, z, h = 5.6, rot = 0 }: { x: number; z: number; h?: number; rot?: number }) {
  const arm = useMemo(() => {
    const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.1, 0.62, 0), new THREE.Vector3(0.95, 0.62, 0));
    return new THREE.TubeGeometry(c, 14, 0.045, 8, false);
  }, []);
  const metal = useMemo(() => lam(G.graphite), []);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.08, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.16, 8]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 8]} />
      </mesh>
      <mesh position={[0, 0.9 + (h - 1) / 2, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.06, 0.1, h - 1, 8]} />
      </mesh>
      <mesh position={[0, h - 0.04, 0]} geometry={arm} material={metal} castShadow />
      <group position={[0.95, h + 0.58, 0]}>
        <RoundedBox args={[0.9, 0.1, 0.34]} radius={0.04} smoothness={2} position={[0.1, 0, 0]} material={metal} castShadow />
        <mesh position={[0.1, -0.06, 0]} material={lampLight}>
          <boxGeometry args={[0.76, 0.02, 0.24]} />
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

// A straight kerb stone run, one long low box with a lighter top and a joint line every 2 m.
export function Kerb({ x0, x1, z, w = 0.2 }: { x0: number; x1: number; z: number; w?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = Math.floor((x1 - x0) / 2);
  const len = (x1 - x0) / n;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) ref.current!.setMatrixAt(i, m.makeTranslation(x0 + (i + 0.5) * len, 0.08, z));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [x0, len, n, z]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} material={lam(G.pale)} receiveShadow castShadow frustumCulled={false}>
      <boxGeometry args={[len - 0.03, 0.16, w]} />
    </instancedMesh>
  );
}

// ---- van ----------------------------------------------------------------------------------------------------

const vanBody = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.55) });
const vanPale = lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.55) });
const vanGraphite = lam(G.graphite);
const vanGlass = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.4) });
const vanDark = lam(G.black);
const rimMat = lam(G.light);
const lightMat = new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false });

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={vanDark} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.24, 24]} />
      </mesh>
      <mesh position={[0, z > 0 ? 0.125 : -0.125, 0]} material={rimMat}>
        <cylinderGeometry args={[0.21, 0.21, 0.02, 20]} />
      </mesh>
      <mesh position={[0, z > 0 ? 0.14 : -0.14, 0]} material={vanGraphite}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
      </mesh>
    </group>
  );
}

// The Ekotehnika van. Cargo box and cab, glass with frames, wheel arches, mirrors and lights, a graphite livery band
// with the wordmark in Daxline caps on both sides. About 5.3 m long, 2.3 m high, facing +x.
export function Van({ x, z, yaw = 0, scale = 1 }: { x: number; z: number; yaw?: number; scale?: number }) {
  const word = useMemo(() => {
    const g = signGeometry('EKOTEHNIKA', 0.3, 0.02);
    g.computeBoundingBox();
    return g;
  }, []);
  const ww = word.boundingBox!.max.x;
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={scale}>
      {/* chassis and floor */}
      <mesh position={[0, 0.5, 0]} material={vanDark} castShadow>
        <boxGeometry args={[5.0, 0.2, 1.7]} />
      </mesh>
      {/* cargo box */}
      <RoundedBox args={[3.3, 1.85, 2.0]} radius={0.1} smoothness={3} position={[-0.95, 1.52, 0]} material={vanBody} castShadow receiveShadow />
      {/* cab, lower body and the roof line */}
      <RoundedBox args={[1.9, 1.05, 2.0]} radius={0.14} smoothness={3} position={[1.55, 1.07, 0]} material={vanBody} castShadow receiveShadow />
      <RoundedBox args={[1.3, 0.78, 1.96]} radius={0.16} smoothness={3} position={[1.25, 1.84, 0]} material={vanBody} castShadow />
      {/* bonnet and bumper */}
      <RoundedBox args={[0.35, 0.34, 1.96]} radius={0.08} smoothness={2} position={[2.52, 0.78, 0]} material={vanPale} castShadow />
      <RoundedBox args={[0.2, 0.2, 2.02]} radius={0.06} smoothness={2} position={[2.64, 0.5, 0]} material={vanGraphite} castShadow />
      {/* glass, windscreen and the two side windows, each in a pale frame */}
      <mesh position={[1.86, 1.86, 0]} rotation={[0, 0, -0.5]} material={vanGlass}>
        <boxGeometry args={[0.05, 0.62, 1.78]} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0, s * 1.0]}>
          <mesh position={[1.4, 1.88, s * 0.005]} material={vanPale}>
            <boxGeometry args={[1.02, 0.6, 0.02]} />
          </mesh>
          <mesh position={[1.42, 1.88, s * 0.016]} material={vanGlass}>
            <boxGeometry args={[0.92, 0.5, 0.01]} />
          </mesh>
          <mesh position={[1.42, 1.88, s * 0.022]} material={vanPale}>
            <boxGeometry args={[0.04, 0.5, 0.01]} />
          </mesh>
          {/* door line, handle and mirror */}
          <mesh position={[1.1, 1.0, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[0.012, 0.9, 0.01]} />
          </mesh>
          <mesh position={[1.95, 1.0, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[0.012, 0.9, 0.01]} />
          </mesh>
          <mesh position={[1.2, 1.35, s * 0.02]} material={vanGraphite}>
            <boxGeometry args={[0.2, 0.04, 0.03]} />
          </mesh>
          <mesh position={[2.0, 1.78, s * 1.1]} material={vanGraphite} castShadow>
            <boxGeometry args={[0.1, 0.26, 0.1]} />
          </mesh>
          {/* wheel arches */}
          {[-1.65, 1.6].map((ax) => (
            <mesh key={ax} position={[ax + (ax > 0 ? 0.1 : -0.1), 0.52, s * 0.0]} rotation={[Math.PI / 2, 0, 0]} material={vanDark}>
              <cylinderGeometry args={[0.43, 0.43, 0.03, 20]} />
            </mesh>
          ))}
          {/* livery, a graphite band low on the cargo box, a thin line above it and the wordmark */}
          <mesh position={[-0.95, 0.98, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[3.28, 0.34, 0.012]} />
          </mesh>
          <mesh position={[-0.95, 1.22, s * 0.012]} material={vanGraphite}>
            <boxGeometry args={[3.28, 0.025, 0.012]} />
          </mesh>
        </group>
      ))}
      {/* the wordmark, both sides */}
      <mesh geometry={word} material={vanGraphite} position={[-0.95 - (ww * 0.9) / 2, 1.95, 1.011]} scale={[0.9, 0.9, 1]} />
      <mesh geometry={word} material={vanGraphite} position={[-0.95 + (ww * 0.9) / 2, 1.95, -1.011]} rotation={[0, Math.PI, 0]} scale={[0.9, 0.9, 1]} />
      {/* rear doors and roof rail */}
      <mesh position={[-2.6, 1.52, 0]} material={vanGraphite}>
        <boxGeometry args={[0.012, 1.7, 0.02]} />
      </mesh>
      <mesh position={[-0.95, 2.47, 0]} material={vanPale}>
        <boxGeometry args={[3.0, 0.04, 1.5]} />
      </mesh>
      {/* head and tail lights */}
      {[0.7, -0.7].map((s) => (
        <mesh key={s} position={[2.82, 0.84, s]} material={lightMat}>
          <boxGeometry args={[0.04, 0.16, 0.34]} />
        </mesh>
      ))}
      {[0.8, -0.8].map((s) => (
        <mesh key={s} position={[-2.61, 0.95, s]} material={vanGraphite}>
          <boxGeometry args={[0.03, 0.4, 0.14]} />
        </mesh>
      ))}
      {/* wheels */}
      {[-1.65, 1.6].flatMap((ax) => [0.88, -0.88].map((az) => <Wheel key={`${ax}${az}`} x={ax} z={az} />))}
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
