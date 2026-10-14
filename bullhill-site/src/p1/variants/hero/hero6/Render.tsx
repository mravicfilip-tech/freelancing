// The render half of hero 6. Layered ground built from planes on the cut faces, gravel and crumbs
// as instanced stones, clearcoat ducts with fibres at the near end, lit by lights built here and a
// room made of soft boxes, so nothing is fetched at runtime.

import { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DUCTS, FIBRE_OUT, H, L, R, WALL, W, Y, camDir, rng, type DuctSpec, type View, type V3 } from './geometry';
import { TILE_H, TILE_W, ductRough, falloff, makeGround, type Kind } from './textures';

const GREEN = '#37864f';
const ORANGE = '#c9531f';

type Ground = ReturnType<typeof makeGround>;

// ---- the room, soft boxes in a dark box, baked once into a prefiltered cube
function buildEnv(gl: THREE.WebGLRenderer, view: View) {
  const { c, r } = camDir(view);
  const at = (p: V3, ...terms: [V3, number][]): V3 => terms.reduce<V3>((a, [v, s]) => [a[0] + v[0] * s, a[1] + v[1] * s, a[2] + v[2] * s], p);
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 60, 60), new THREE.MeshBasicMaterial({ color: '#070708', side: THREE.BackSide })));
  const panel = (w: number, h: number, col: string, k: number, pos: V3) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos);
    m.lookAt(0, 0.8, 0);
    s.add(m);
  };
  const up: V3 = [0, 1, 0];
  panel(10, 7, '#fff6ec', 6, at([0, 0, 0], [r, -9], [c, 5], [up, 9])); // key, upper left and in front
  panel(16, 16, '#ffffff', 0.9, at([0, 0, 0], [up, 13])); // overhead
  panel(1.6, 11, '#ffffff', 10, at([0, 0, 0], [c, -10], [r, 6], [up, 3])); // rim strip behind right
  panel(1.2, 9, '#ffffff', 3, at([0, 0, 0], [c, 7], [r, 9], [up, 2])); // front right edge strip
  panel(18, 5, '#d00b11', 3.2, at([0, 0, 0], [c, -12], [up, 1.6])); // bull red glow behind
  panel(7, 5, '#d00b11', 1.4, at([0, 0, 0], [r, 10], [c, -6], [up, 0.5])); // and a little to the right
  panel(14, 4, '#ffffff', 0.45, at([0, 0, 0], [c, 11], [r, -3], [up, 2.5])); // soft fill from the front
  // long strips over the bundle, lying along the duct axis, so each tube gets a crisp highlight line
  for (const [z, k, w] of [[3.2, 11, 1.0], [-2.6, 5, 0.8], [0.6, 3, 2.2]] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(16, w), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(0, 7, z);
    m.rotation.x = Math.PI / 2;
    s.add(m);
  }
  const pm = new THREE.PMREMGenerator(gl);
  const rt = pm.fromScene(s, 0.02, 0.1, 100);
  pm.dispose();
  return rt.texture;
}

function Grounds() {
  return useMemo(() => {
    const g: Record<Kind, Ground> = { asphalt: makeGround('asphalt'), gravel: makeGround('gravel'), backfill: makeGround('backfill'), sand: makeGround('sand') };
    return g;
  }, []);
}

function groundMat(g: Ground, rw: number, rh: number, rough: number, bump: number, tint = '#ffffff') {
  const map = g.map.clone();
  const bm = g.bump.clone();
  for (const t of [map, bm]) {
    t.repeat.set(rw / TILE_W, rh / TILE_H);
    t.needsUpdate = true;
  }
  return new THREE.MeshStandardMaterial({ map, bumpMap: bm, bumpScale: bump, roughness: rough, metalness: 0, color: tint });
}

type LayerDef = { id: Kind; y0: number; y1: number; rough: number; bump: number };
const LAYERS: LayerDef[] = [
  { id: 'sand', y0: 0, y1: Y.sand, rough: 1, bump: 1.4 },
  { id: 'backfill', y0: Y.sand, y1: Y.backfill, rough: 0.97, bump: 2.2 },
  { id: 'gravel', y0: Y.backfill, y1: Y.base, rough: 0.92, bump: 2.6 },
  { id: 'asphalt', y0: Y.base, y1: Y.surface, rough: 0.82, bump: 1.6 },
];

function Layers({ ground }: { ground: Record<Kind, Ground> }) {
  const mats = useMemo(() => {
    return LAYERS.map((l) => {
      const hgt = l.y1 - l.y0;
      return {
        l,
        front: groundMat(ground[l.id], L, hgt, l.rough, l.bump),
        end: groundMat(ground[l.id], W, hgt, l.rough, l.bump),
      };
    });
  }, [ground]);
  const top = useMemo(() => groundMat(ground.asphalt, L, W, 0.62, 1.8), [ground]);
  const tape = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d4632f', roughness: 0.55, metalness: 0 }), []);
  const shade = useMemo(() => falloff('edge'), []);
  const shadeMat = useMemo(() => new THREE.MeshBasicMaterial({ map: shade, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [shade]);
  return (
    <group>
      {mats.map(({ l, front, end }) => {
        const hgt = l.y1 - l.y0;
        const ym = (l.y0 + l.y1) / 2;
        return (
          <group key={l.id}>
            <mesh position={[0, ym, W / 2]} material={front} receiveShadow>
              <planeGeometry args={[L, hgt]} />
            </mesh>
            <mesh position={[L / 2, ym, 0]} rotation-y={Math.PI / 2} material={end} receiveShadow>
              <planeGeometry args={[W, hgt]} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, H, 0]} rotation-x={-Math.PI / 2} material={top} receiveShadow>
        <planeGeometry args={[L, W]} />
      </mesh>
      {/* the warning tape, a thin strip standing a hair proud of the cut faces */}
      <mesh position={[0, Y.tape, W / 2 + 0.003]} material={tape} receiveShadow>
        <planeGeometry args={[L, Y.tapeT]} />
      </mesh>
      <mesh position={[L / 2 + 0.003, Y.tape, 0]} rotation-y={Math.PI / 2} material={tape} receiveShadow>
        <planeGeometry args={[W, Y.tapeT]} />
      </mesh>
      {/* contact shade under each layer edge so the strata read as separate courses */}
      {[Y.sand, Y.backfill, Y.base].map((y) => (
        <group key={y}>
          <mesh position={[0, y - 0.04, W / 2 + 0.002]} material={shadeMat}>
            <planeGeometry args={[L, 0.08]} />
          </mesh>
          <mesh position={[L / 2 + 0.002, y - 0.04, 0]} rotation-y={Math.PI / 2} material={shadeMat}>
            <planeGeometry args={[W, 0.08]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, Y.tape - Y.tapeT / 2 - 0.03, W / 2 + 0.002]} material={shadeMat}>
        <planeGeometry args={[L, 0.06]} />
      </mesh>
      <mesh position={[L / 2 + 0.002, Y.tape - Y.tapeT / 2 - 0.03, 0]} rotation-y={Math.PI / 2} material={shadeMat}>
        <planeGeometry args={[W, 0.06]} />
      </mesh>
      {/* an inset solid that only casts shadow, so the floor gets the block's shadow */}
      <mesh position={[0, H / 2, 0]} castShadow>
        <boxGeometry args={[L - 0.04, H - 0.04, W - 0.04]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---- stones and crumbs, instanced, half sunk into the cut faces
function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  const r = rng(99);
  const seen = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let k = seen.get(key);
    if (k === undefined) {
      k = 0.72 + r() * 0.38;
      seen.set(key, k);
    }
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * (0.8 + (k - 0.72) * 0.3), p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

type ScatterSpec = { y0: number; y1: number; front: number; end: number; rMin: number; rMax: number; colors: string[]; rough: number; seed: number; sink: number };

function Scatter({ spec }: { spec: ScatterSpec }) {
  const geo = useMemo(() => rockGeometry(), []);
  const meshes = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: spec.rough, metalness: 0 });
    const r = rng(spec.seed);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const make = (n: number, uMax: number) => {
      const m = new THREE.InstancedMesh(geo, mat, n);
      m.castShadow = true;
      m.receiveShadow = true;
      for (let i = 0; i < n; i++) {
        const rad = spec.rMin + Math.pow(r(), 1.6) * (spec.rMax - spec.rMin);
        const v0 = spec.y0 + Math.min(rad * 0.9, (spec.y1 - spec.y0) / 2);
        const v1 = spec.y1 - Math.min(rad * 0.9, (spec.y1 - spec.y0) / 2);
        d.position.set((r() - 0.5) * 2 * (uMax - rad), v0 + r() * (v1 - v0), -rad * spec.sink + (r() - 0.5) * rad * 0.2);
        d.rotation.set((r() - 0.5) * 0.9, (r() - 0.5) * 0.9, r() * Math.PI * 2);
        d.scale.set(rad * (0.85 + r() * 0.5), rad * (0.7 + r() * 0.45), rad * (0.55 + r() * 0.25));
        // the long axis lies along the face, the short one points out of it
        d.rotation.order = 'ZXY';
        d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
        col.set(spec.colors[Math.floor(r() * spec.colors.length)]);
        col.multiplyScalar(0.8 + r() * 0.4);
        m.setColorAt(i, col);
      }
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      return m;
    };
    return { front: make(spec.front, L / 2), end: make(spec.end, W / 2) };
  }, [geo, spec]);
  return (
    <group>
      <group position={[0, 0, W / 2]}>
        <primitive object={meshes.front} />
      </group>
      <group position={[L / 2, 0, 0]} rotation-y={Math.PI / 2}>
        <primitive object={meshes.end} />
      </group>
    </group>
  );
}

const SCATTER: ScatterSpec[] = [
  { y0: Y.backfill, y1: Y.base, front: 1500, end: 560, rMin: 0.026, rMax: 0.068, colors: ['#8f897d', '#a39c8f', '#716c63', '#b5ae9f', '#5e5a52', '#938a79'], rough: 0.86, seed: 3, sink: 0.55 },
  { y0: Y.sand, y1: Y.backfill, front: 3600, end: 1300, rMin: 0.008, rMax: 0.034, colors: ['#6e6559', '#85796b', '#4a4137', '#9a9183', '#5b5247'], rough: 0.97, seed: 4, sink: 0.62 },
  { y0: 0.02, y1: Y.sand, front: 2600, end: 900, rMin: 0.005, rMax: 0.016, colors: ['#b7ae9f', '#9d9586', '#cfc7b8', '#8a8274'], rough: 1, seed: 5, sink: 0.5 },
  { y0: Y.base, y1: Y.surface, front: 520, end: 180, rMin: 0.006, rMax: 0.016, colors: ['#3a3a3e', '#56565b', '#242426', '#707075'], rough: 0.8, seed: 6, sink: 0.7 },
];

// ---- ducts
function Duct({ spec, mats }: { spec: DuctSpec; mats: { outer: THREE.Material; inner: THREE.Material; rim: THREE.Material } }) {
  const x0 = -L / 2 - spec.far;
  const x1 = L / 2 + spec.near;
  const len = x1 - x0;
  const cx = (x0 + x1) / 2;
  return (
    <group position={[cx, spec.y, spec.z]}>
      <group rotation-z={Math.PI / 2}>
        <mesh material={mats.outer} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, len, 96, 1, true]} />
        </mesh>
        <mesh material={mats.inner}>
          <cylinderGeometry args={[R - WALL, R - WALL, len, 64, 1, true]} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (len / 2), 0, 0]} rotation-y={s * (Math.PI / 2)} material={mats.rim} castShadow>
          <ringGeometry args={[R - WALL, R, 96]} />
        </mesh>
      ))}
    </group>
  );
}

function Ducts({ env }: { env: THREE.Texture }) {
  const rough = useMemo(() => ductRough(), []);
  const mats = useMemo(() => {
    const mk = (color: string) => {
      const map = rough.clone();
      map.repeat.set(1, 6);
      map.needsUpdate = true;
      return {
        outer: new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, roughnessMap: map, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035, ior: 1.46, envMap: env, envMapIntensity: 1.25, side: THREE.FrontSide }),
        inner: new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.38), roughness: 0.55, metalness: 0, side: THREE.BackSide }),
        rim: new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide }),
      };
    };
    return { green: mk(GREEN), orange: mk(ORANGE) };
  }, [rough, env]);
  const ring = useMemo(() => falloff('ring'), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ map: ring, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [ring]);
  const bore = useMemo(() => new THREE.MeshBasicMaterial({ color: '#030303' }), []);
  return (
    <group>
      {DUCTS.map((d) => (
        <group key={d.id}>
          <Duct spec={d} mats={mats[d.color]} />
          {/* the dark bore where the duct runs on into the ground, and a soft shade round it on the face */}
          <mesh position={[L / 2 + 0.004, d.y, d.z]} rotation-y={Math.PI / 2} material={bore}>
            <circleGeometry args={[R - WALL, 64]} />
          </mesh>
          <mesh position={[L / 2 + 0.0025, d.y, d.z]} rotation-y={Math.PI / 2} material={ringMat}>
            <planeGeometry args={[(R + 0.11) * 2, (R + 0.11) * 2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---- fibres, thin strands out of the orange duct with a lit tip each
function Fibres() {
  const parts = useMemo(() => {
    const d = DUCTS.find((x) => x.fibre)!;
    const r = rng(41);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#f1f2ef', roughness: 0.24, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.15, emissive: '#ffffff', emissiveIntensity: 0.1 });
    const tipMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(2.2), toneMapped: false });
    const glowTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d')!;
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const glow = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
    const end = L / 2 + d.near;
    const n = 15;
    const out: { tube: THREE.TubeGeometry; tip: V3 }[] = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * (R - WALL - 0.02);
      const oy = Math.sin(a) * rad;
      const oz = Math.cos(a) * rad;
      const reach = FIBRE_OUT * (0.55 + r() * 0.5);
      const fan = (r() - 0.3) * 0.2;
      const side = (r() - 0.5) * 0.22;
      const droop = -0.05 - r() * 0.1;
      const pts = [
        new THREE.Vector3(L / 2 + 0.02, d.y + oy, d.z + oz),
        new THREE.Vector3(end - 0.25, d.y + oy * 0.9, d.z + oz * 0.9),
        new THREE.Vector3(end + 0.02, d.y + oy * 0.8 + fan * 0.12, d.z + oz * 0.8 + side * 0.12),
        new THREE.Vector3(end + reach * 0.55, d.y + oy * 0.6 + fan * 0.55 + droop * 0.4, d.z + oz * 0.6 + side * 0.6),
        new THREE.Vector3(end + reach, d.y + oy * 0.5 + fan + droop, d.z + oz * 0.5 + side),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
      out.push({ tube: new THREE.TubeGeometry(curve, 36, 0.0042, 6, false), tip: [pts[4].x, pts[4].y, pts[4].z] });
    }
    return { out, mat, tipMat, glow, tipGeo: new THREE.SphereGeometry(0.0072, 12, 8) };
  }, []);
  return (
    <group>
      {parts.out.map((f, i) => (
        <group key={i}>
          <mesh geometry={f.tube} material={parts.mat} castShadow />
          <mesh geometry={parts.tipGeo} material={parts.tipMat} position={f.tip} />
          <sprite material={parts.glow} position={f.tip} scale={[0.05, 0.05, 0.05]} />
        </group>
      ))}
    </group>
  );
}

function Lights({ view }: { view: View }) {
  const { c, r } = camDir(view);
  const key: V3 = [-r[0] * 7 + c[0] * 4, 9, -r[2] * 7 + c[2] * 4];
  const rim: V3 = [-c[0] * 8 + r[0] * 4, 4, -c[2] * 8 + r[2] * 4];
  const red: V3 = [-c[0] * 5.5 - r[0] * 1, 1.1, -c[2] * 5.5 - r[2] * 1];
  const redR: V3 = [-c[0] * 3 + r[0] * 6, 1.6, -c[2] * 3 + r[2] * 6];
  return (
    <>
      <directionalLight position={key} intensity={2.6} color="#fff1e2" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6.5} shadow-camera-right={6.5} shadow-camera-top={6.5} shadow-camera-bottom={-6.5} shadow-camera-near={1} shadow-camera-far={30} shadow-bias={-0.0006} shadow-normalBias={0.015} shadow-radius={4} />
      <directionalLight position={rim} intensity={1.7} color="#ffffff" />
      <pointLight position={red} intensity={70} distance={0} decay={2} color="#d00b11" />
      <pointLight position={redR} intensity={45} distance={0} decay={2} color="#d00b11" />
    </>
  );
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <shadowMaterial opacity={0.55} transparent />
    </mesh>
  );
}

export function Specimen({ view }: { view: View }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const ground = Grounds();
  const env = useMemo(() => buildEnv(gl, view), [gl, view]);
  useLayoutEffect(() => {
    scene.environment = env;
    scene.environmentIntensity = 0.75;
    return () => {
      scene.environment = null;
    };
  }, [scene, env]);
  return (
    <>
      <Lights view={view} />
      <Floor />
      <Layers ground={ground} />
      {SCATTER.map((s) => (
        <Scatter key={s.seed} spec={s} />
      ))}
      <Ducts env={env} />
      <Fibres />
    </>
  );
}
