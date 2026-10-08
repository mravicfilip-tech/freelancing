// The Ekotehnika miniature in Vrčin. A bright soft lit model world seen from high and far with a
// long lens, the way the Emons reel shows its site. Metres, x east, z south, ground at y = 0.
//
// North of the main road, west to east, the depot with its red dock facade, the warehouse with the
// roof cut away, the service workshop and the head office. South of the road the rental fleet
// yard, the service van park and the approved used truck lot, with a road winding off south.
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Forklift, Pallet, setPose, type ForkliftApi } from '../../r3f/Forklift';
import { C } from '../../tokens';
import { W, aoFor, slatTexture } from './look';
import { Fleet, pose, useBaked, type FleetApi, type Placement } from './bake';
import { ShieldModel, SignWord, VanModel } from './models';

const unit = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const ico = new THREE.IcosahedronGeometry(1, 0);
const dode = new THREE.DodecahedronGeometry(1, 0);

// Deterministic random numbers so the layout is the same on every load.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rect = [x0: number, z0: number, x1: number, z1: number];
// x, y, z of the centre, then size, then rotation about y
type It = [number, number, number, number, number, number, number?];

const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpM = new THREE.Matrix4();
const Y = new THREE.Vector3(0, 1, 0);

// Instanced primitives, each item placed by its centre and scaled from a unit shape.
function Inst({ geo = unit, mat, items, cast = true, receive = true }: { geo?: THREE.BufferGeometry; mat: THREE.Material; items: It[]; cast?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach(([x, y, z, sx, sy, sz, r = 0], i) => {
      tmpQ.setFromAxisAngle(Y, r);
      m.setMatrixAt(i, tmpM.compose(tmpV.set(x, y, z), tmpQ, tmpS.set(sx, sy, sz)));
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow={receive} />;
}

// A box from a footprint rect, bottom at y0, height h.
const box = ([x0, z0, x1, z1]: Rect, y0: number, h: number, r = 0): It => [(x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, r];

function Box({ a, y = 0, h, m, cast = true }: { a: Rect; y?: number; h: number; m: THREE.Material; cast?: boolean }) {
  const [x, cy, z, sx, sy, sz] = box(a, y, h);
  return <mesh geometry={unit} material={m} position={[x, cy, z]} scale={[sx, sy, sz]} castShadow={cast} receiveShadow />;
}

// Soft occlusion pools on the ground. Rect footprints with a fixed blur spread.
const decalMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  fog: true,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  uniforms: { ...THREE.UniformsLib.fog, uColor: { value: new THREE.Color(C.ink) }, uOpacity: { value: 0.42 } },
  vertexShader: `
    attribute vec3 aRect;
    varying vec2 vLocal;
    varying vec3 vRect;
    #include <fog_pars_vertex>
    void main() {
      vRect = aRect;
      vLocal = position.xy * vec2(aRect.x + 2.0 * aRect.z, aRect.y + 2.0 * aRect.z);
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vLocal;
    varying vec3 vRect;
    #include <fog_pars_fragment>
    void main() {
      vec2 q = abs(vLocal) - vRect.xy * 0.5;
      float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
      float a = 1.0 - smoothstep(-vRect.z * 0.5, vRect.z, sd);
      gl_FragColor = vec4(uColor, pow(a, 1.6) * uOpacity);
      #include <fog_fragment>
    }`,
});

function Decals({ rects }: { rects: [x0: number, z0: number, x1: number, z1: number, spread: number, opacity?: number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(rects.length * 3), 3);
    rects.forEach(([x0, z0, x1, z1, s], i) => attr.setXYZ(i, x1 - x0, z1 - z0, s));
    g.setAttribute('aRect', attr);
    return g;
  }, [rects]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    rects.forEach(([x0, z0, x1, z1, s], i) => {
      m.setMatrixAt(i, tmpM.compose(tmpV.set((x0 + x1) / 2, 0.035, (z0 + z1) / 2), q, tmpS.set(x1 - x0 + 2 * s, z1 - z0 + 2 * s, 1)));
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [rects]);
  return <instancedMesh ref={ref} args={[geo, decalMat, rects.length]} renderOrder={1} />;
}

/* ---------------------------------------------------------------- layout */

const ROAD_Z = 18;
const ROAD_W = 9;

// footprints
const DEPOT: Rect = [-78, -28, -40, -8];
const OFFICE: Rect = [-40, -26, -29, -5];
const WARE: Rect = [-17, -38, 21, -6];
const SHOP: Rect = [42, -28, 58, -8];
const HQ: Rect = [70, -34, 88, -14];
const HQ_WING: Rect = [70, -14, 80, -3];
const TOWER: Rect = [88, -31, 95, -17];
const FLEET: Rect = [-84, 28, -36, 54];
const VANPARK: Rect = [-28, 28, 6, 46];
const LOT: Rect = [30, 28, 64, 52];

// the winding road heading south out of the site
const windPts = [
  [12, 0.02, 22],
  [12, 0.02, 40],
  [18, 0.02, 60],
  [40, 0.02, 74],
  [62, 0.02, 86],
  [70, 0.02, 108],
  [58, 0.02, 132],
  [30, 0.02, 150],
  [12, 0.02, 176],
  [16, 0.02, 210],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));
const wind = new THREE.CatmullRomCurve3(windPts, false, 'centripetal');

function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, n = 220, y = 0.03) {
  const pos: number[] = [];
  const idx: number[] = [];
  const t = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n);
    curve.getTangentAt(i / n, t);
    side.set(-t.z, 0, t.x).normalize().multiplyScalar(width / 2);
    pos.push(p.x + side.x, y, p.z + side.z, p.x - side.x, y, p.z - side.z);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // the winding order can face down, so force the normals up
  const nrm = g.getAttribute('normal');
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return g;
}

// Footprints that trees and people keep clear of, with a margin.
const blocked: Rect[] = [
  DEPOT, OFFICE, WARE, SHOP, HQ, HQ_WING, TOWER, FLEET, VANPARK, LOT,
  [-100, -27, -82, -3],
  [33, -28, 42, -2],
  [-140, ROAD_Z - ROAD_W / 2 - 2, 170, ROAD_Z + ROAD_W / 2 + 2],
  [-80, -8, -28, 13],
  [-19, -6, 23, 13],
  [31, -8, 60, 13],
  [68, -3, 98, 13],
  [-26, -52, -20, 14],
  [24, -52, 30, 14],
  [61, -52, 67, 14],
  [-110, -49, 110, -41],
  [9, 22, 15, 40],
];
const isBlocked = (x: number, z: number, m = 2.5) => blocked.some(([x0, z0, x1, z1]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
const nearWind = (x: number, z: number) => {
  for (let i = 0; i <= 80; i++) {
    const p = wind.getPointAt(i / 80);
    if (Math.hypot(p.x - x, p.z - z) < 7) return true;
  }
  return false;
};

/* ---------------------------------------------------------------- ground and roads */

function Ground() {
  const g = useMemo(() => {
    const marks: It[] = [];
    const kerbs: It[] = [];
    // main road centre dashes and edge lines
    for (let x = -136; x < 168; x += 7) marks.push([x, 0.06, ROAD_Z, 3.2, 0.02, 0.22]);
    kerbs.push([16, 0.09, ROAD_Z - ROAD_W / 2 - 0.2, 312, 0.18, 0.4], [16, 0.09, ROAD_Z + ROAD_W / 2 + 0.2, 312, 0.18, 0.4]);
    // side roads, north
    for (const x of [-23, 27, 64]) {
      for (let z = -40; z < 12; z += 6) marks.push([x, 0.06, z, 0.2, 0.02, 2.6]);
      kerbs.push([x - 3.2, 0.09, -17, 0.4, 0.18, 62], [x + 3.2, 0.09, -17, 0.4, 0.18, 62]);
    }
    for (let x = -106; x < 108; x += 7) marks.push([x, 0.06, -45, 3, 0.02, 0.2]);
    // parking bays in front of the head office
    for (let x = 69; x < 97; x += 3) marks.push([x, 0.06, 6, 0.14, 0.02, 5]);
    for (let x = 69; x < 97; x += 3) marks.push([x, 0.06, 11.2, 0.14, 0.02, 3]);
    // fleet yard rows
    for (let r = 0; r < 3; r++) for (let c = 0; c <= 8; c++) marks.push([-79 + c * 4.6, 0.06, 33.5 + r * 7, 0.14, 0.02, 5.2]);
    // van park bays
    for (let r = 0; r < 2; r++) for (let c = 0; c <= 6; c++) marks.push([-25 + c * 4.6, 0.06, 33 + r * 9, 0.14, 0.02, 7]);
    // used lot bays
    for (let r = 0; r < 3; r++) for (let c = 0; c <= 5; c++) marks.push([33.5 + c * 5.4, 0.06, 33 + r * 7, 0.14, 0.02, 5.2]);
    // dock apron lines in front of the depot doors
    for (let i = 0; i <= 8; i++) marks.push([-76 + i * 4.4, 0.06, -3, 0.14, 0.02, 9]);
    // winding road dashes
    const t = new THREE.Vector3();
    for (let i = 0; i < 110; i++) {
      const u = (i + 0.5) / 110;
      const p = wind.getPointAt(u);
      wind.getTangentAt(u, t);
      marks.push([p.x, 0.06, p.z, 0.22, 0.02, 2.4, Math.atan2(t.x, t.z)]);
    }
    return { marks, kerbs };
  }, []);
  const windRoad = useMemo(() => ribbon(wind, 7.5), []);
  const windKerb = useMemo(() => ribbon(wind, 8.6, 220, 0.02), []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={W.ground}>
        <planeGeometry args={[2400, 2400]} />
      </mesh>
      {/* yards and lots, a shade off the open ground */}
      {[
        [-82, -8, -26, 13.5] as Rect,
        [-19, -6, 24, 13.5] as Rect,
        [30, -8, 61, 13.5] as Rect,
        [67, -2, 98, 13.5] as Rect,
        FLEET,
        VANPARK,
        LOT,
        [-102, -28, -80, -2] as Rect,
      ].map((a, i) => (
        <Box key={i} a={a} h={0.03} m={W.yard} cast={false} />
      ))}
      <Box a={[-140, ROAD_Z - ROAD_W / 2, 170, ROAD_Z + ROAD_W / 2]} y={0.01} h={0.03} m={W.road} cast={false} />
      {[-23, 27, 64].map((x) => (
        <Box key={x} a={[x - 3, -48, x + 3, ROAD_Z - ROAD_W / 2]} y={0.01} h={0.03} m={W.road} cast={false} />
      ))}
      <Box a={[-110, -48, 110, -42]} y={0.01} h={0.03} m={W.road} cast={false} />
      <mesh geometry={windKerb} material={W.wall} receiveShadow />
      <mesh geometry={windRoad} material={W.road} receiveShadow position-y={0.015} />
      <Inst mat={W.mark} items={g.marks} cast={false} />
      <Inst mat={W.kerb} items={g.kerbs} />
    </group>
  );
}

/* ---------------------------------------------------------------- buildings */

// Window panes on the south and west faces of a block, one row per floor. Some panes read lit,
// like the warm windows of the reel, the rest are dark reflective glass.
function Bands({ a, floors, fh, y0 = 0, inset = 0.25, glassFrom = 0.9, seed = 1 }: { a: Rect; floors: number; fh: number; y0?: number; inset?: number; glassFrom?: number; seed?: number }) {
  const { dark, lit, mull } = useMemo(() => {
    const r = rng(seed);
    const [x0, z0, x1, z1] = a;
    const dark: It[] = [];
    const lit: It[] = [];
    const mull: It[] = [];
    const pw = 1.5;
    for (let f = 0; f < floors; f++) {
      const y = y0 + f * fh + glassFrom;
      const h = fh - glassFrom - 0.3;
      const run = r() < 0.5;
      for (let x = x0 + inset + 0.3; x + pw <= x1 - inset - 0.2; x += pw) {
        (r() < (run ? 0.7 : 0.42) ? lit : dark).push([x + pw / 2, y + h / 2, z1 + 0.02, pw - 0.06, h, 0.1]);
        mull.push([x, y + h / 2, z1 + 0.09, 0.1, h, 0.08]);
      }
      for (let z = z0 + inset + 0.3; z + pw <= z1 - inset - 0.2; z += pw) {
        (r() < (run ? 0.6 : 0.36) ? lit : dark).push([x0 - 0.02, y + h / 2, z + pw / 2, 0.1, h, pw - 0.06]);
        mull.push([x0 - 0.09, y + h / 2, z, 0.08, h, 0.1]);
      }
    }
    return { dark, lit, mull };
  }, [a, floors, fh, y0, inset, glassFrom, seed]);
  return (
    <>
      <Inst mat={W.glass} items={dark} cast={false} />
      <Inst mat={W.glassLit} items={lit} cast={false} />
      <Inst mat={W.wall} items={mull} cast={false} />
    </>
  );
}

function RoofKit({ a, y, seed = 1, n = 5 }: { a: Rect; y: number; seed?: number; n?: number }) {
  const items = useMemo(() => {
    const r = rng(seed);
    const [x0, z0, x1, z1] = a;
    const it: It[] = [];
    for (let i = 0; i < n; i++) {
      const w = 1.6 + r() * 2.2;
      const d = 1.4 + r() * 1.8;
      it.push([x0 + 2 + r() * (x1 - x0 - 4), y + 0.6, z0 + 2 + r() * (z1 - z0 - 4), w, 1.2, d]);
    }
    return it;
  }, [a, y, seed, n]);
  const vents = useMemo(() => items.map(([x, yy, z, w]) => [x + w * 0.2, yy + 0.75, z, 0.9, 0.3, 0.9] as It), [items]);
  return (
    <>
      <Inst mat={W.wallShade} items={items} />
      <Inst geo={cyl} mat={W.steel} items={vents} />
    </>
  );
}

// Rows of raised roof lights, like the reel's sheds.
function Skylights({ a, y, rows = 3, gap = 4 }: { a: Rect; y: number; rows?: number; gap?: number }) {
  const items = useMemo(() => {
    const [x0, z0, x1, z1] = a;
    const it: It[] = [];
    const zc = (z0 + z1) / 2;
    for (let r = 0; r < rows; r++) {
      const z = zc + (r - (rows - 1) / 2) * gap;
      for (let x = x0 + 3; x < x1 - 3; x += 3.4) it.push([x + 1.4, y + 0.25, z, 2.6, 0.5, 1.4]);
    }
    return it;
  }, [a, y, rows, gap]);
  const glass = useMemo(() => items.map(([x, yy, z, w, , d]) => [x, yy + 0.27, z, w - 0.3, 0.05, d - 0.3] as It), [items]);
  return (
    <>
      <Inst mat={W.wall} items={items} />
      <Inst mat={W.glass} items={glass} cast={false} />
    </>
  );
}

// A building block with a parapet roof.
function Block({ a, h, m = W.wall, roof = W.roof, parapet = 0.7 }: { a: Rect; h: number; m?: THREE.Material; roof?: THREE.Material; parapet?: number }) {
  const [x0, z0, x1, z1] = a;
  return (
    <group>
      <Box a={a} h={h} m={m} />
      <Box a={[x0 + 0.4, z0 + 0.4, x1 - 0.4, z1 - 0.4]} y={h} h={0.05} m={roof} cast={false} />
      <Inst
        mat={m}
        items={[
          [(x0 + x1) / 2, h + parapet / 2, z0 + 0.2, x1 - x0, parapet, 0.4],
          [(x0 + x1) / 2, h + parapet / 2, z1 - 0.2, x1 - x0, parapet, 0.4],
          [x0 + 0.2, h + parapet / 2, (z0 + z1) / 2, 0.4, parapet, z1 - z0],
          [x1 - 0.2, h + parapet / 2, (z0 + z1) / 2, 0.4, parapet, z1 - z0],
        ]}
      />
    </group>
  );
}

const doorMat = new THREE.MeshStandardMaterial({ map: slatTexture(), roughness: 0.6, metalness: 0.2 });

function Depot() {
  const [x0, , x1, z1] = DEPOT;
  const doors = useMemo(() => Array.from({ length: 8 }, (_, i) => x0 + 2.6 + i * 4.4 + 1.6), [x0]);
  return (
    <group>
      <Block a={DEPOT} h={9} />
      <RoofKit a={[x0, -28, x1, -20]} y={9} seed={3} n={4} />
      <Skylights a={[x0, -21, x1 - 4, -9]} y={9} rows={3} gap={3.6} />
      {/* red cladding over the dock row */}
      <Box a={[x0 - 0.3, z1 - 0.1, x1 + 0.2, z1 + 0.45]} y={3.9} h={5.9} m={W.red} />
      <SignWord h={2.5} position={[(x0 + x1) / 2 + 0.5, 5.3, z1 + 0.46]} />
      {/* dock doors with dark frames, slatted roller doors, bumpers */}
      {doors.map((x, i) => (
        <group key={x} position={[x, 0, z1]}>
          <mesh geometry={unit} material={W.ink} position={[0, 1.95, 0.12]} scale={[3.5, 3.6, 0.24]} />
          <mesh material={doorMat} position={[0, 1.85, 0.26]} scale={[3.1, i % 3 === 1 ? 1.2 : 3.3, 1]} receiveShadow>
            <planeGeometry args={[1, 1]} />
          </mesh>
          <mesh geometry={unit} material={W.ink} position={[-1.35, 1.2, 0.5]} scale={[0.3, 0.6, 0.4]} castShadow />
          <mesh geometry={unit} material={W.ink} position={[1.35, 1.2, 0.5]} scale={[0.3, 0.6, 0.4]} castShadow />
          <mesh geometry={unit} material={W.lamp} position={[0, 3.95, 0.5]} scale={[0.5, 0.12, 0.2]} />
        </group>
      ))}
      {/* office block at the east end, red entrance portal */}
      <Block a={OFFICE} h={11.2} />
      <Bands a={OFFICE} floors={3} fh={3.6} y0={0.2} />
      <RoofKit a={OFFICE} y={11.2} seed={7} n={3} />
      <Box a={[-37.4, -5.2, -32.6, -2.6]} h={4.2} m={W.red} />
      <Box a={[-36.4, -2.66, -33.6, -2.5]} h={3.1} m={W.ink} cast={false} />
    </group>
  );
}

function Warehouse({ racksRef }: { racksRef?: MutableRefObject<THREE.Group | null> }) {
  const [x0, z0, x1, z1] = WARE;
  const H = 8;
  const rack = useMemo(() => {
    const ups: It[] = [];
    const beams: It[] = [];
    const cartons: It[] = [];
    const pallets: It[] = [];
    const tape: It[] = [];
    const r = rng(11);
    const levels = [0.12, 1.6, 3.08, 4.56];
    const bays = 8;
    const bw = 2.8;
    const xs = -7.5;
    for (const zc of [-33.2, -26.8, -20.4, -14]) {
      for (const side of [-0.6, 0.6]) {
        const z = zc + side;
        for (let b = 0; b <= bays; b++) {
          const x = xs + b * bw;
          ups.push([x, 2.85, z - 0.5, 0.1, 5.7, 0.1], [x, 2.85, z + 0.5, 0.1, 5.7, 0.1]);
        }
        for (const ly of levels.slice(1).concat([5.6])) {
          beams.push([xs + (bays * bw) / 2, ly - 0.08, z - 0.5, bays * bw, 0.14, 0.07], [xs + (bays * bw) / 2, ly - 0.08, z + 0.5, bays * bw, 0.14, 0.07]);
        }
        for (let b = 0; b < bays; b++) {
          for (const ly of levels) {
            for (const o of [-0.68, 0.68]) {
              if (r() < 0.12) continue;
              const x = xs + b * bw + bw / 2 + o;
              const h = 0.7 + r() * 0.45;
              pallets.push([x, ly + 0.07, z, 1.2, 0.14, 0.95]);
              cartons.push([x, ly + 0.14 + h / 2, z, 1.08 - r() * 0.1, h, 0.86]);
              if (r() < 0.35) tape.push([x, ly + 0.14 + h / 2, z, 1.1, h + 0.01, 0.1]);
            }
          }
        }
      }
    }
    // packing area, staged pallets in front of the racks
    for (let i = 0; i < 10; i++) {
      const x = -14.5 + (i % 5) * 1.6;
      const z = -34 + Math.floor(i / 5) * 1.5 + (i > 4 ? 14 : 0);
      if (r() < 0.2) continue;
      const h = 0.6 + r() * 0.8;
      pallets.push([x, 0.27, z, 1.2, 0.14, 0.95]);
      cartons.push([x, 0.34 + h / 2, z, 1.05, h, 0.86]);
    }
    return { ups, beams, cartons, pallets, tape };
  }, []);

  const shell = useMemo(() => {
    const it: It[] = [
      // north and east walls full height, south and west cut down like a model
      [(x0 + x1) / 2, H / 2, z0 + 0.3, x1 - x0, H, 0.6],
      [x1 - 0.3, H / 2, (z0 + z1) / 2, 0.6, H, z1 - z0],
      [(x0 + x1) / 2 + 2.5, 0.75, z1 - 0.3, x1 - x0 - 5, 1.5, 0.6],
      [x0 + 0.3, 0.75, (z0 + z1) / 2, 0.6, 1.5, z1 - z0],
    ];
    return it;
  }, [x0, z0, x1, z1]);

  const truss = useMemo(() => {
    const it: It[] = [];
    for (let x = x0 + 4; x < x1 - 2; x += 7.5) it.push([x, H - 0.1, (z0 + z1) / 2 - 6, 0.16, 0.24, z1 - z0 - 12]);
    return it;
  }, [x0, x1, z0, z1]);
  const pendants = useMemo(() => {
    const it: It[] = [];
    for (let x = x0 + 4; x < x1 - 2; x += 7.5) for (let z = z0 + 5; z < z1 - 12; z += 6.5) it.push([x, H - 1.6, z, 0.05, 2.6, 0.05]);
    return it;
  }, [x0, x1, z0, z1]);
  const heads = useMemo(() => pendants.map(([x, , z]) => [x, H - 2.95, z, 0.7, 0.18, 0.7] as It), [pendants]);
  // sawtooth roof lights along the north wall
  const saw = useMemo(() => {
    const it: It[] = [];
    for (let x = x0 + 1.5; x < x1 - 1; x += 2.6) it.push([x, H + 0.9, z0 + 1.6, 2.4, 0.12, 2.8, 0]);
    return it;
  }, [x0, x1, z0]);

  return (
    <group>
      <Box a={[x0, z0, x1, z1]} h={0.22} m={W.yard} cast={false} />
      <Inst mat={W.wall} items={shell} />
      {/* heavy top edge on the full walls, inner faces a shade darker */}
      <Box a={[x0, z0, x1, z0 + 0.7]} y={H} h={0.5} m={W.wallShade} />
      <Box a={[x1 - 0.7, z0, x1, z1]} y={H} h={0.5} m={W.wallShade} />
      <Box a={[x0 + 0.6, z0 + 0.6, x1 - 0.6, z0 + 0.66]} y={0.2} h={H - 0.4} m={W.wallShade} cast={false} />
      {/* red corner volume at the south west and a red band on the east wall */}
      <Box a={[x0 - 0.5, z0 - 0.5, x0 + 3.5, z0 + 1.4]} h={H + 0.8} m={W.red} />
      <Box a={[x1 - 0.1, z0 + 2, x1 + 0.35, z1 - 2]} y={H - 2.6} h={1.6} m={W.red} />
      {/* skylight teeth on the north edge */}
      <group>
        {saw.map(([x, y, z], i) => (
          <mesh key={i} geometry={unit} material={W.wall} position={[x, y, z]} rotation={[-0.55, 0, 0]} scale={[2.4, 0.14, 3.2]} castShadow receiveShadow />
        ))}
      </group>
      <Inst mat={W.wallShade} items={truss} />
      <Inst mat={W.ink} items={pendants} cast={false} />
      <Inst mat={W.lamp} items={heads} cast={false} />
      <group ref={racksRef}>
        <Inst mat={W.steel} items={rack.ups} />
        <Inst mat={W.red} items={rack.beams} />
        <Inst mat={W.pallet} items={rack.pallets} />
        <Inst mat={W.carton} items={rack.cartons} />
        <Inst mat={W.tape} items={rack.tape} cast={false} />
      </group>
      {/* conveyor line across the packing area */}
      <Box a={[-15.6, -11.2, 13, -10.2]} y={0.22} h={0.75} m={W.wallShade} />
      <Box a={[-15.6, -11.25, 13, -10.15]} y={0.95} h={0.08} m={W.steel} />
      <Box a={[-15.6, -34, -14.6, -12]} y={0.22} h={0.75} m={W.wallShade} />
      <Box a={[-15.65, -34, -14.55, -12]} y={0.95} h={0.08} m={W.steel} />
      {/* packing tables */}
      {[-6, 0, 6].map((x) => (
        <Box key={x} a={[x - 1.2, -8.6, x + 1.2, -7.4]} y={0.22} h={0.9} m={W.carton} />
      ))}
    </group>
  );
}

function Workshop() {
  const [x0, z0, x1, z1] = SHOP;
  const H = 8;
  return (
    <group>
      {/* hall shell, a wide open bay and a closed one on the south face */}
      <Box a={[x0, z0, x1, z0 + 0.5]} h={H} m={W.wall} />
      <Box a={[x0, z0, x0 + 0.5, z1]} h={H} m={W.wall} />
      <Box a={[x1 - 0.5, z0, x1, z1]} h={H} m={W.wall} />
      <Box a={[x0, z1 - 0.5, x0 + 1.2, z1]} h={H} m={W.wall} />
      <Box a={[x0 + 7.2, z1 - 0.5, x0 + 8.8, z1]} h={H} m={W.wall} />
      <Box a={[x1 - 1.2, z1 - 0.5, x1, z1]} h={H} m={W.wall} />
      <Box a={[x0, z1 - 0.5, x1, z1]} y={5.4} h={H - 5.4} m={W.wall} />
      <Box a={[x0, z0, x1, z1]} y={H} h={0.4} m={W.roof} />
      <Box a={[x0 - 0.2, z1 - 0.1, x1 + 0.2, z1 + 0.35]} y={5.6} h={2.4} m={W.red} />
      <Box a={[x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5]} y={0} h={0.1} m={W.wallShade} cast={false} />
      {/* closed roller door on the east bay */}
      <mesh material={doorMat} position={[x0 + 12.1, 2.7, z1 + 0.02]} scale={[5.6, 5.4, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {/* inside, red tool cabinets along the back wall and a ceiling light */}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} a={[x0 + 1 + i * 1.6, z0 + 0.6, x0 + 2.4 + i * 1.6, z0 + 1.4]} h={1.6} m={W.red} />
      ))}
      <Box a={[x0 + 1.5, z0 + 4, x0 + 6, z0 + 14]} y={H - 0.5} h={0.12} m={W.lamp} cast={false} />
      {/* outdoor service canopy to the west of the hall */}
      <Box a={[33, -24, 41.4, -8]} y={6.2} h={0.35} m={W.wall} />
      <Box a={[33, -8.3, 41.4, -7.7]} y={5.6} h={0.9} m={W.red} />
      {[
        [33.3, -23.7],
        [41.1, -23.7],
        [33.3, -8.3],
        [41.1, -8.3],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} a={[x - 0.2, z - 0.2, x + 0.2, z + 0.2]} h={6.2} m={W.steel} />
      ))}
      <RoofKit a={[x0, z0, x1, z0 + 6]} y={H + 0.4} seed={19} n={2} />
      <Skylights a={[x0, z0 + 6, x1, z1 - 2]} y={H + 0.4} rows={3} gap={3.6} />
      {/* white band and lit opening on the fascia */}
      <Box a={[x0 - 0.25, z1 + 0.34, x1 + 0.25, z1 + 0.42]} y={6.5} h={0.22} m={W.wall} cast={false} />
      <Box a={[x0 + 1.3, z1 - 3, x0 + 7.1, z1 - 2.9]} y={0.1} h={5.2} m={W.glassLit} cast={false} />
    </group>
  );
}

function HeadOffice() {
  const [x0, z0, x1, z1] = HQ;
  const fh = 3.4;
  const floors = 6;
  const top = floors * fh;
  return (
    <group>
      <Box a={[x0 + 0.4, z0 + 0.4, x1 - 0.4, z1 - 0.4]} h={top} m={W.wallShade} />
      {/* floor slabs read as white bands between the glass */}
      <Inst
        mat={W.wall}
        items={Array.from({ length: floors }, (_, f) => box([x0, z0, x1, z1], f * fh, 0.9))}
      />
      <Bands a={[x0, z0, x1, z1]} floors={floors} fh={fh} inset={0.1} />
      {/* red crown with the name, red stair tower on the east side */}
      <Box a={[x0 - 0.2, z0 - 0.2, x1 + 0.2, z1 + 0.25]} y={top} h={2.8} m={W.red} />
      <SignWord h={1.65} position={[(x0 + x1) / 2, top + 0.55, z1 + 0.26]} />
      <Box a={TOWER} h={top + 4.2} m={W.red} />
      <Box a={[TOWER[0] + 2.6, TOWER[3] - 0.02, TOWER[0] + 4.4, TOWER[3] + 0.05]} y={1} h={top + 1.6} m={W.glass} cast={false} />
      <RoofKit a={[x0 + 1, z0 + 1, x1 - 1, z1 - 3]} y={top + 0.05} seed={23} n={5} />
      <Box a={[x0 + 3, z0 + 3, x0 + 9, z0 + 9]} y={top} h={3.2} m={W.wallShade} />
      {/* low wing with the entrance and its red canopy */}
      <Box a={[HQ_WING[0] + 0.4, HQ_WING[1], HQ_WING[2] - 0.4, HQ_WING[3] - 0.4]} h={3 * fh} m={W.wallShade} />
      <Inst mat={W.wall} items={Array.from({ length: 3 }, (_, f) => box(HQ_WING, f * fh, 0.9))} />
      <Box a={[HQ_WING[0], HQ_WING[1], HQ_WING[2], HQ_WING[3]]} y={3 * fh} h={0.7} m={W.wall} />
      <Bands a={HQ_WING} floors={3} fh={fh} inset={0.1} />
      <Box a={[72, -3.2, 78, 0.6]} y={3.2} h={0.45} m={W.red} />
      {[72.3, 77.7].map((x) => (
        <Box key={x} a={[x - 0.15, 0.2, x + 0.15, 0.5]} h={3.2} m={W.steel} />
      ))}
    </group>
  );
}

function Kiosk({ a }: { a: Rect }) {
  const [x0, z0, x1, z1] = a;
  return (
    <group>
      <Box a={a} h={3.2} m={W.wall} />
      <Box a={[x0 - 0.3, z0 - 0.3, x1 + 0.3, z1 + 0.3]} y={3.2} h={0.5} m={W.red} />
      <Box a={[x0 + 0.6, z1, x1 - 0.6, z1 + 0.06]} y={1} h={1.5} m={W.glass} cast={false} />
    </group>
  );
}

/* ---------------------------------------------------------------- trees, lamps, people, walls */

function Scatter() {
  const data = useMemo(() => {
    const r = rng(5);
    const dark: It[] = [];
    const light: It[] = [];
    const trunks: It[] = [];
    const add = (x: number, z: number, s = 1) => {
      const h = (2.6 + r() * 1.8) * s;
      const w = (1.4 + r() * 0.8) * s;
      const tgt = r() < 0.62 ? dark : light;
      tgt.push([x, h, z, w, h * 0.62, w, r() * 6]);
      trunks.push([x, h * 0.32, z, 0.22 * s, h * 0.64, 0.22 * s]);
    };
    // rows along the main road
    for (let x = -132; x < 166; x += 8.5) {
      for (const z of [ROAD_Z - ROAD_W / 2 - 3.2, ROAD_Z + ROAD_W / 2 + 3.2]) {
        const jx = x + (r() - 0.5) * 2;
        if (!isBlocked(jx, z, 0.6) && r() < 0.8) add(jx, z, 0.9);
      }
    }
    // a planted strip along the yards by the road, broken at the gates, and lawn islands
    for (let x = -80; x < 98; x += 5.5) {
      const gate = [-60, -40, -23, 0, 27, 46, 64, 82].some((g) => Math.abs(g - x) < 5);
      if (!gate && r() < 0.85) add(x + (r() - 0.5) * 1.5, 10.6 + (r() - 0.5) * 1.2, 0.8 + r() * 0.3);
    }
    for (const [x, z] of [[-31, 4], [-34, 6.5], [-28.5, 7], [-82, -6], [-84, 0], [-83, 8], [23, 4], [31, 2], [30.5, 8], [66, 2]]) add(x, z, 0.95);
    for (let z = -24; z < -4; z += 4.2) add(-27, z, 0.8);
    for (let x = 68; x < 99; x += 4.6) add(x, 1, 0.85);
    for (let z = -36; z < -2; z += 4.4) add(97.5, z, 0.9);
    // clusters across the open land
    let tries = 0;
    while (dark.length + light.length < 520 && tries < 9000) {
      tries++;
      const cx = -170 + r() * 360;
      const cz = -110 + r() * 300;
      if (isBlocked(cx, cz, 3) || nearWind(cx, cz)) continue;
      const n = 2 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const x = cx + (r() - 0.5) * 9;
        const z = cz + (r() - 0.5) * 9;
        if (!isBlocked(x, z, 2) && !nearWind(x, z)) add(x, z, 0.8 + r() * 0.5);
      }
    }
    // the winding road gets a loose avenue
    for (let i = 4; i < 70; i++) {
      const p = wind.getPointAt(i / 70);
      const t = wind.getTangentAt(i / 70);
      const s = i % 2 ? 1 : -1;
      const x = p.x - t.z * 6.5 * s;
      const z = p.z + t.x * 6.5 * s;
      if (!isBlocked(x, z, 1) && r() < 0.7) add(x, z, 0.85);
    }
    // lamp posts along the road and in the yards
    const poles: It[] = [];
    const arms: It[] = [];
    const heads: It[] = [];
    const lamp = (x: number, z: number, dir: number) => {
      poles.push([x, 2.6, z, 0.12, 5.2, 0.12]);
      arms.push([x, 5.15, z + dir * 0.5, 0.1, 0.1, 1.1]);
      heads.push([x, 5.08, z + dir * 1.0, 0.3, 0.08, 0.5]);
    };
    for (let x = -126; x < 160; x += 15) {
      lamp(x, ROAD_Z - ROAD_W / 2 - 0.9, 1);
      lamp(x + 7.5, ROAD_Z + ROAD_W / 2 + 0.9, -1);
    }
    for (const [x, z] of [[-84, 40], [-36, 40], [30, 38], [64, 38], [-28, 37], [6, 37]]) lamp(x, z, 0);
    // people, small and dark like the reel
    const people: It[] = [];
    const heads2: It[] = [];
    const spots: [number, number][] = [
      [-66, -1], [-65.2, -0.6], [-52, 4], [-35.4, -1.4], [-34.6, -0.9], [-30, 6], [-10, -3], [2, -9], [8, -16.8], [-4, -10],
      [36, -12], [38.5, -14], [48, -3], [52, -4.2], [74.5, 1.4], [75.2, 2.2], [84, 8], [90, 4], [-60, 31], [-48, 44],
      [-20, 31], [40, 31], [48, 46], [56, 33], [15, 9], [-43, 9], [62, -6], [26, -30], [-24, -38], [92, 10],
    ];
    for (const [x, z] of spots) {
      people.push([x, 0.62, z, 0.36, 1.1, 0.3]);
      heads2.push([x, 1.38, z, 0.26, 0.26, 0.26]);
    }
    // low white walls around the south lots, with gaps for the gates
    const walls: It[] = [];
    const ring = ([x0, z0, x1, z1]: Rect, gapX: number) => {
      walls.push([(x0 + gapX - 4) / 2, 0.45, z0, gapX - 4 - x0, 0.9, 0.35]);
      walls.push([(gapX + 4 + x1) / 2, 0.45, z0, x1 - gapX - 4, 0.9, 0.35]);
      walls.push([(x0 + x1) / 2, 0.45, z1, x1 - x0, 0.9, 0.35]);
      walls.push([x0, 0.45, (z0 + z1) / 2, 0.35, 0.9, z1 - z0]);
      walls.push([x1, 0.45, (z0 + z1) / 2, 0.35, 0.9, z1 - z0]);
    };
    ring(FLEET, -60);
    ring(LOT, 47);
    ring(VANPARK, -11);
    // pallet stacks in the depot and warehouse yards
    const stacks: It[] = [];
    const stackTop: It[] = [];
    for (let i = 0; i < 14; i++) {
      const x = -81 + (i % 7) * 1.5;
      const z = 5 + Math.floor(i / 7) * 1.3;
      const n = 2 + Math.floor(r() * 5);
      stacks.push([x, n * 0.075, z, 1.2, n * 0.15, 1.0]);
    }
    for (let i = 0; i < 6; i++) {
      const x = 14 + (i % 3) * 1.6;
      const z = 3 + Math.floor(i / 3) * 1.3;
      const h = 0.8 + r() * 0.5;
      stacks.push([x, 0.07, z, 1.2, 0.14, 1]);
      stackTop.push([x, 0.14 + h / 2, z, 1.05, h, 0.86]);
    }
    return { dark, light, trunks, poles, arms, heads, people, heads2, walls, stacks, stackTop };
  }, []);
  return (
    <group>
      <Inst geo={ico} mat={W.tree} items={data.dark} />
      <Inst geo={dode} mat={W.treeLight} items={data.light} />
      <Inst geo={cyl} mat={W.trunk} items={data.trunks} />
      <Inst geo={cyl} mat={W.door} items={data.poles} />
      <Inst mat={W.door} items={data.arms} cast={false} />
      <Inst mat={W.lamp} items={data.heads} cast={false} />
      <Inst geo={cyl} mat={W.person} items={data.people} />
      <Inst geo={ico} mat={W.person} items={data.heads2} />
      <Inst mat={W.wall} items={data.walls} />
      <Inst mat={W.pallet} items={data.stacks} />
      <Inst mat={W.carton} items={data.stackTop} />
    </group>
  );
}

/* ---------------------------------------------------------------- vehicles */

// Fork tyres have tiny tread lugs that vanish at this scale, leave them out of the bake.
const skipLugs = (m: THREE.Mesh) => {
  const g = m.geometry as THREE.BoxGeometry;
  return g.type === 'BoxGeometry' && g.parameters?.width === 0.03 && g.parameters?.height === 0.07;
};

const fleetYard: Placement[] = (() => {
  const out: Placement[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if (!(r === 1 && c === 5) && !(r === 2 && c === 2)) out.push([-76.7 + c * 4.6, 0, 33.5 + r * 7, -Math.PI / 2]);
  return out;
})();
const lotYard: Placement[] = (() => {
  const out: Placement[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) if (!(r === 2 && c === 3)) out.push([36.2 + c * 5.4, 0, 33 + r * 7, -Math.PI / 2]);
  return out;
})();
const shieldItems: Placement[] = lotYard.map(([x, , z]) => [x, 3.4, z + 0.6, 0]);
const parkedVans: Placement[] = (() => {
  const out: Placement[] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) if (!(r === 1 && c === 4)) out.push([-22.7 + c * 4.6, 0, 33 + r * 9, -Math.PI / 2]);
  // docked at the depot, nose out
  for (const i of [1, 3, 4, 6]) out.push([-78 + 2.6 + i * 4.4 + 1.6, 0, -4.3, -Math.PI / 2]);
  // the van row west of the depot
  for (let i = 0; i < 5; i++) out.push([-97 + i * 3.4, 0, -14, -Math.PI / 2 + 0.0]);
  // at the workshop and the head office
  out.push([35.5, 0, -16, -Math.PI / 2], [39, 0, -2.6, 0.15], [86, 0, 6, -Math.PI / 2], [92, 0, 6, -Math.PI / 2]);
  return out;
})();
const stillForks: Placement[] = [
  [-52, 0, -1, 0.5],
  [-70, 0, 6, -0.4],
  [-8, 0, 2, 1.2],
  [37, 0, -13, 0.2],
  [16, 0, -9, Math.PI],
  [45.5, 0.1, -12, -Math.PI / 2],
  [49.5, 0, -4.5, -0.3],
  [53.5, 0, -4.2, -0.5],
  [36.5, 0, -2, 0.9],
];

const parkedForks: Placement[] = [...fleetYard, ...lotYard, ...stillForks];

type Mover = { curve: THREE.Curve<THREE.Vector3>; speed: number; off: number; lane?: number };

const loop = (pts: [number, number][]) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal', 0.3);

const forkMovers: Mover[] = [
  { curve: loop([[-11, -17.2], [14, -17.2], [17.5, -20], [14, -23.6], [-11, -23.6], [-13, -20.4]]), speed: 0.018, off: 0 },
  { curve: loop([[-11, -29.8], [14, -29.8], [17.5, -27], [14, -23.8], [-11, -23.8], [-13, -26.8]]), speed: 0.014, off: 0.5 },
  { curve: loop([[-12, -9], [12, -9], [16, -6.5], [12, 2], [-12, 2], [-14, -3]]), speed: 0.012, off: 0.2 },
  { curve: loop([[-75, 2], [-46, 2], [-44, 8], [-60, 10], [-77, 8]]), speed: 0.012, off: 0.6 },
  { curve: loop([[-80, 46.5], [-42, 46.5], [-39, 49.5], [-42, 51.5], [-80, 51.5], [-82, 49]]), speed: 0.012, off: 0.1 },
  { curve: loop([[34, -2], [56, -2], [58, 4], [44, 6], [33, 4]]), speed: 0.016, off: 0.35 },
];

const vanMovers: Mover[] = [
  { curve: new THREE.LineCurve3(new THREE.Vector3(-150, 0, ROAD_Z + 2.2), new THREE.Vector3(180, 0, ROAD_Z + 2.2)), speed: 0.011, off: 0.1 },
  { curve: new THREE.LineCurve3(new THREE.Vector3(-150, 0, ROAD_Z + 2.2), new THREE.Vector3(180, 0, ROAD_Z + 2.2)), speed: 0.011, off: 0.62 },
  { curve: new THREE.LineCurve3(new THREE.Vector3(180, 0, ROAD_Z - 2.2), new THREE.Vector3(-150, 0, ROAD_Z - 2.2)), speed: 0.012, off: 0.3 },
  { curve: new THREE.LineCurve3(new THREE.Vector3(180, 0, ROAD_Z - 2.2), new THREE.Vector3(-150, 0, ROAD_Z - 2.2)), speed: 0.012, off: 0.85 },
  { curve: wind, speed: 0.012, off: 0.15, lane: 1.9 },
  { curve: wind, speed: -0.01, off: 0.7, lane: 1.9 },
];

const pt = new THREE.Vector3();
const tg = new THREE.Vector3();
const mOut = new THREE.Matrix4();

function drive(api: FleetApi | null, movers: Mover[], t: number, lane = 0) {
  if (!api) return;
  movers.forEach((mv, i) => {
    let u = (mv.off + t * mv.speed) % 1;
    if (u < 0) u += 1;
    mv.curve.getPointAt(u, pt);
    mv.curve.getTangentAt(u, tg);
    if (mv.speed < 0) tg.negate();
    // lane pushes a vehicle to its right hand side of a centre line
    const ln = mv.lane ?? lane;
    api.set(i, pose(pt.x - tg.z * ln, 0, pt.z + tg.x * ln, Math.atan2(-tg.z, tg.x), 1, mOut));
  });
  api.commit();
}

function Vehicles({ reduced }: { reduced: boolean }) {
  const fork = useBaked('v4-fork', <Forklift />, aoFor, skipLugs);
  const loaded = useBaked(
    'v4-fork-loaded',
    <Forklift lift={0.35} apiRef={{ current: null }}>
      <Pallet position={[1.74, 0.05, 0]} />
    </Forklift>,
    aoFor,
    skipLugs,
  );
  const van = useBaked('v4-van', <VanModel />, (m) => m);
  const shield = useBaked('v4-shield', <ShieldModel />, (m) => m);

  const forkApi = useRef<FleetApi | null>(null);
  const vanApi = useRef<FleetApi | null>(null);
  const shieldApi = useRef<FleetApi | null>(null);
  const hero = useRef<ForkliftApi | null>(null);
  const lift = useRef<THREE.Group>(null);
  const liftFork = useRef<ForkliftApi | null>(null);

  const forkItems = useMemo<Placement[]>(() => forkMovers.map(() => [0, -50, 0, 0]), []);
  const vanItems = useMemo<Placement[]>(() => vanMovers.map(() => [0, -50, 0, 0]), []);

  useFrame(({ clock }) => {
    const t = reduced ? 8 : clock.elapsedTime;
    drive(forkApi.current, forkMovers, t);
    drive(vanApi.current, vanMovers, t, 0);
    if (shieldApi.current) {
      shieldItems.forEach(([x, y, z], i) => shieldApi.current!.set(i, pose(x, y + Math.sin(t * 1.4 + i) * 0.18, z, t * 0.8 + i * 0.4, 1.25, mOut)));
      shieldApi.current.commit();
    }
    // the warehouse hero truck lifts a pallet up to the top beam and back
    const k = (Math.sin(t * 0.55) + 1) / 2;
    setPose(hero.current, { lift: 0.1 + k * k * (3 - 2 * k) * 4.4 });
    // the workshop lift raises a truck for service
    const l = (Math.sin(t * 0.4 - 1) + 1) / 2;
    if (lift.current) lift.current.position.y = 0.3 + l * l * (3 - 2 * l) * 1.5;
    setPose(liftFork.current, { lift: 0.1 });
  });

  return (
    <group>
      {fork.source}
      {loaded.source}
      {van.source}
      {shield.source}
      <Fleet parts={fork.parts} items={parkedForks} />
      <Fleet parts={loaded.parts} items={forkItems} apiRef={forkApi} />
      <Fleet parts={van.parts} items={parkedVans} />
      <Fleet parts={van.parts} items={vanItems} apiRef={vanApi} />
      <Fleet parts={shield.parts} items={shieldItems} apiRef={shieldApi} shadows={false} />
      {/* the hero truck in the warehouse at the end of an aisle */}
      <Forklift apiRef={hero} position={[-10.6, 0.22, -17.6]} rotation={[0, Math.PI, 0]} lift={0.1}>
        <Pallet position={[1.74, 0.05, 0]} />
      </Forklift>
      {/* the workshop scissor lift with a truck on it */}
      <group position={[37.2, 0, -19]}>
        <mesh geometry={unit} material={W.ink} position={[0, 0.1, 0]} scale={[4.4, 0.2, 2.2]} receiveShadow />
        <group ref={lift}>
          <mesh geometry={unit} material={W.red} position={[0, 0, 0]} scale={[4.4, 0.18, 2.2]} castShadow receiveShadow />
          <Forklift apiRef={liftFork} position={[0.2, 0.09, 0]} rotation={[0, -0.0, 0]} />
        </group>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- the world */

export function World({ reduced }: { reduced: boolean }) {
  const decals = useMemo(
    () =>
      [
        [...DEPOT, 3.2],
        [...OFFICE, 3.2],
        [...WARE, 2.2],
        [...SHOP, 3],
        [33, -24, 41.4, -8, 2, 0.16],
        [...HQ, 4.5],
        [...HQ_WING, 3],
        [...TOWER, 4],
        [-37.4, -5.2, -32.6, -2.6, 1.2],
        [5, 1, 9, 2, 1],
      ] as [number, number, number, number, number][],
    [],
  );
  const vehicleDecals = useMemo(() => {
    const out: [number, number, number, number, number][] = [];
    for (const [x, , z] of [...fleetYard, ...lotYard]) out.push([x - 0.7, z - 1.9, x + 0.7, z + 1.6, 0.9]);
    for (const [x, , z, r] of parkedVans) {
      const along = Math.abs(Math.cos(r)) > 0.5;
      out.push(along ? [x - 3, z - 1.1, x + 3.2, z + 1.1, 1] : [x - 1.1, z - 3.2, x + 1.1, z + 3, 1]);
    }
    return out;
  }, []);
  return (
    <group>
      <Ground />
      <Decals rects={decals} />
      <Decals rects={vehicleDecals} />
      <Depot />
      <Warehouse />
      <Workshop />
      <HeadOffice />
      <Kiosk a={[-41, 30, -37, 34]} />
      <Kiosk a={[57.5, 45, 62.5, 50]} />
      <Scatter />
      <Vehicles reduced={reduced} />
    </group>
  );
}
