// The warehouse as a lit model. A roof that gives way, racks of light that rise from a clean floor, aisles with
// ceiling strips, and three indoor trucks at work. The same building is the roof in Z, the cutaway in P and
// the aisle in A and B.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { Truck, SPEC, modelUrl, type TruckApi } from './models';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { bakeEdges } from './bake';
import type { SceneProps } from '../../clock';
import { track } from '../../../story/scenes/sistem/tracks';
import { AISLES, WH } from './route';
import { G, K, ease, lam, lerp, lit, range, rng, uOf } from './kit';
import { BoxSet, type BoxItem } from './props';
import { Roof, roofMaterials, type RoofSlopes, type RoofSpec } from './roof';

const BAY = 2.7;
const BAYS = 17;
const RACK_X0 = 120.2;
const LEVELS = [0, 1.5, 3.0, 4.5];
// Row centres across the building, back to front. Rows at z above the middle aisle belong to the near side.
const ROWS = [-21.95, -17.65, -16.55, -12.25, -11.15, -6.85];
const NEAR = (z: number) => z > AISLES[1];

const labelMats: THREE.Material[] = [];
// Shipping and rack labels, a white plate with a code and a barcode, drawn once on a canvas.
export function labelTexture(code: string, seed: number) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 192, 64);
  g.strokeStyle = '#a1a1a1';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 189, 61);
  g.fillStyle = '#222222';
  g.font = '600 26px "Daxline Pro", Arial, sans-serif';
  g.textBaseline = 'top';
  g.fillText(code, 10, 8);
  const r = rng(seed);
  let x = 10;
  while (x < 178) {
    const w = 2 + Math.floor(r() * 4);
    g.fillRect(x, 38, w, 20);
    x += w + 1 + Math.floor(r() * 3);
  }
  g.fillStyle = '#6b6b6b';
  g.fillRect(120, 12, 60, 4);
  g.fillRect(120, 22, 40, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const labelMat = (i: number) => (labelMats[i] ??= new THREE.MeshBasicMaterial({ map: labelTexture(['A 12 03', 'B 07 02', 'C 21 04', 'D 03 01'][i], 31 + i * 7), toneMapped: false }));

// Instanced flat plates. Each item is centre x, y, z and a width, height, with the plate facing +z or -z.
function Plates({ items, face, mat }: { items: [number, number, number, number, number][]; face: 1 | -1; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, face > 0 ? 0 : Math.PI, 0));
    items.forEach(([x, y, z, w, h], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, 1))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items, face]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

const rackGrey = lam(G.graphite);
const beamWeb = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.4) });
const beamFlange = lam(G.dark);
const wrapShell = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.6), transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false });
const wrapBand = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.7), transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false });
const palletBase = lam(G.dark);
const loadMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.3) }));

function Row({ z, index, group }: { z: number; index: number; group: (g: THREE.Group | null) => void }) {
  const d = useMemo(() => {
    const r = rng(100 + index);
    const up: BoxItem[] = [];
    const plate: BoxItem[] = [];
    const guard: BoxItem[] = [];
    const brace: BoxItem[] = [];
    const web: BoxItem[] = [];
    const flange: BoxItem[] = [];
    const base: BoxItem[] = [];
    const shell: BoxItem[] = [];
    const bands: BoxItem[] = [];
    const loads: BoxItem[][] = [[], [], []];
    const rackLabels: [number, number, number, number, number][][][] = [[[], []], [[], []]];
    const loadLabels: [number, number, number, number, number][][][] = [[[], []], [[], []]];
    for (let b = 0; b <= BAYS; b++) {
      const x = RACK_X0 + b * BAY;
      for (const dz of [-0.5, 0.5]) {
        up.push([x, 3.3, dz, 0.1, 6.6, 0.1]);
        plate.push([x, 0.012, dz, 0.26, 0.024, 0.26]);
        guard.push([x, 0.22, dz + dz * 0.12, 0.16, 0.44, 0.1]);
      }
      // the frame between the two uprights, ladder bracing
      for (const y of [0.45, 2.1, 3.9, 5.7]) brace.push([x, y, 0, 0.035, 0.05, 0.9]);
    }
    for (let b = 0; b < BAYS; b++) {
      const cx = RACK_X0 + b * BAY + BAY / 2;
      for (const ly of LEVELS.slice(1).concat([6.0]))
        for (const dz of [-0.5, 0.5]) {
          web.push([cx, ly, dz, BAY - 0.12, 0.14, 0.04]);
          flange.push([cx, ly + 0.085, dz + (dz > 0 ? -0.03 : 0.03), BAY - 0.12, 0.03, 0.1]);
        }
      // a rack label on the lower three beams, on both aisle faces
      for (const ly of [1.5, 3.0, 4.5]) {
        const v = (b + Math.round(ly)) % 2;
        rackLabels[v][0].push([cx, ly - 0.0, 0.525, 0.38, 0.12]);
        rackLabels[v][1].push([cx, ly - 0.0, -0.525, 0.38, 0.12]);
      }
    }
    for (let b = 0; b < BAYS; b++)
      for (const ly of LEVELS)
        for (const side of [-0.6, 0.6]) {
          if (r() < 0.14) continue;
          const h = 0.9 + r() * 0.4;
          const x = RACK_X0 + b * BAY + BAY / 2 + side;
          const y0 = ly + (ly === 0 ? 0.0 : 0.1);
          base.push([x, y0 + 0.07, 0, 1.2, 0.14, 0.82]);
          const yc = y0 + 0.14 + h / 2;
          loads[Math.floor(r() * 3)].push([x, yc, 0, 1.08, h, 0.88]);
          shell.push([x, yc, 0, 1.13, h + 0.03, 0.93]);
          bands.push([x, y0 + 0.14 + h * 0.3, 0, 1.15, 0.07, 0.95], [x, y0 + 0.14 + h * 0.68, 0, 1.15, 0.07, 0.95]);
          const v = (b + side * 2 + ly) % 2 < 1 ? 0 : 1;
          loadLabels[Math.abs(v)][0].push([x - 0.2, yc + h * 0.1, 0.47, 0.34, 0.12]);
          loadLabels[Math.abs(v)][1].push([x + 0.2, yc + h * 0.1, -0.47, 0.34, 0.12]);
        }
    return { up, plate, guard, brace, web, flange, base, shell, bands, loads, rackLabels, loadLabels };
  }, [index]);
  return (
    <group ref={group} position={[0, 0, z]}>
      <BoxSet items={d.up} mat={rackGrey} cast />
      <BoxSet items={d.plate} mat={beamFlange} receive={false} />
      <BoxSet items={d.guard} mat={beamWeb} cast />
      <BoxSet items={d.brace} mat={rackGrey} />
      <BoxSet items={d.web} mat={beamWeb} cast />
      <BoxSet items={d.flange} mat={beamFlange} />
      <BoxSet items={d.base} mat={palletBase} cast />
      {d.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={d.shell} mat={wrapShell} receive={false} />
      <BoxSet items={d.bands} mat={wrapBand} receive={false} />
      {[0, 1].map((v) => (
        <group key={v}>
          <Plates items={d.rackLabels[v][0]} face={1} mat={labelMat(v)} />
          <Plates items={d.rackLabels[v][1]} face={-1} mat={labelMat(v)} />
          <Plates items={d.loadLabels[v][0]} face={1} mat={labelMat(v + 2)} />
          <Plates items={d.loadLabels[v][1]} face={-1} mat={labelMat(v + 2)} />
        </group>
      ))}
    </group>
  );
}

const ROOF: RoofSpec = {
  x0: WH.x0 - 0.3,
  x1: WH.x1 + 0.3,
  z0: WH.z0,
  z1: WH.z1,
  eave: WH.eave,
  peak: WH.peak,
  sky: 4.9,
  skyPhase: 2.4,
  vents: [
    ...Array.from({ length: 6 }, (_, i) => ({ side: 1 as const, x: WH.x0 + 8 + i * 8.6, s: 1.5 })),
    ...Array.from({ length: 6 }, (_, i) => ({ side: -1 as const, x: WH.x0 + 12.3 + i * 8.6, s: 1.5 })),
  ],
  units: [
    { side: 1, x: 146, s: 4.4 },
    { side: -1, x: 131, s: 4.6 },
    { side: 1, x: 162, s: 4.4 },
  ],
};

// The roof is solid. At the start of P its two pitches slide apart down their slopes and out of the frame, so the floor
// under them is open to the sky, nothing fades.
function WarehouseRoof({ slopes }: { slopes: RoofSlopes }) {
  const mats = useMemo(() => roofMaterials(false), []);
  return <Roof spec={ROOF} mats={mats} slopes={slopes} outline={false} />;
}

function Walls({ groupRef }: { groupRef: React.MutableRefObject<THREE.Group | null> }) {
  const t = 0.4;
  const parts: { x: number; z: number; w: number; d: number; y0: number; h: number }[] = [
    { x: WH.x0 - t / 2 + 0.2, z: (WH.z0 + AISLES[1] - 2.2) / 2, w: t, d: AISLES[1] - 2.2 - WH.z0, y0: 0, h: WH.eave },
    { x: WH.x0 - t / 2 + 0.2, z: (WH.z1 + AISLES[1] + 2.2) / 2, w: t, d: WH.z1 - AISLES[1] - 2.2, y0: 0, h: WH.eave },
    { x: WH.x0 - t / 2 + 0.2, z: AISLES[1], w: t, d: 4.4, y0: 4.8, h: WH.eave - 4.8 },
    { x: (WH.x0 + WH.x1) / 2, z: WH.z0 - t / 2 + 0.2, w: WH.x1 - WH.x0, d: t, y0: 0, h: WH.eave },
  ];
  return (
    <group ref={groupRef}>
      {parts.map((p, i) => (
        <group key={i} position={[p.x, p.y0 + p.h / 2, p.z]}>
          <mesh material={K.silhouette} castShadow receiveShadow>
            <boxGeometry args={[p.w, p.h, p.d]} />
          </mesh>
          <lineSegments material={new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.5, toneMapped: false })}>
            <edgesGeometry args={[new THREE.BoxGeometry(p.w, p.h, p.d)]} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function Floor({ clock }: SceneProps) {
  const lane = useMemo(() => new THREE.MeshBasicMaterial({ color: G.mid, toneMapped: false }), []);
  // Nothing of the warehouse shows in P, the cut out is the only object. The floor runs out past any frame, so the roof's
  // opening shows a floor and never an edge, and the lane lines draw on along the aisles as A begins.
  const lanes = useRef<THREE.Group>(null);
  useFrame(() => {
    const d = ease(range(uOf(clock), 8.0, 8.4));
    if (lanes.current) {
      lanes.current.scale.x = Math.max(d, 0.001);
      lanes.current.visible = d > 0.002;
    }
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(WH.x0 + WH.x1) / 2, 0.012, (WH.z0 + WH.z1) / 2]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshLambertMaterial color={lit(C.white)} toneMapped={false} />
      </mesh>
      <group ref={lanes} position={[(WH.x0 + WH.x1) / 2, 0, 0]}>
        {AISLES.map((z) =>
          [-1.55, 1.55].map((dz) => (
            <mesh key={`${z}${dz}`} position={[0, 0.03, z + dz]} material={lane}>
              <boxGeometry args={[WH.x1 - WH.x0 - 0.5, 0.01, 0.07]} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

function Door() {
  return (
    <mesh position={[WH.x0 + 0.2, 2.4, AISLES[1]]} rotation={[0, Math.PI / 2, 0]} material={K.white}>
      <planeGeometry args={[4.4, 4.8]} />
    </mesh>
  );
}

// Indoor trucks along the aisles. Positions by scroll pixels, forward travel by arc length.
const T1X = track([[0, 124], [5300, 124], [6400, 129], [7000, 138], [7600, 150], [8000, 151.5], [12000, 151.5]]);
const T2X = track([[0, 158], [5300, 158], [6400, 152], [7600, 140], [8000, 136], [12000, 136]]);
const T3X = track([[0, 126], [5300, 126], [6400, 134], [7600, 148], [8000, 152], [12000, 152]]);
const T4X = track([[0, 130], [5300, 130], [6400, 133], [8000, 142], [12000, 142]]);
const T5X = track([[0, 160], [5300, 160], [6400, 156], [8000, 146], [12000, 146]]);

// The T02 move. One truck of the warehouse is drawn again as a precise wireframe on top of its lit self, the half from
// the mast back to the front. A clip plane sweeps the wireframe in from the front and sweeps it back out the same way as the
// camera drops into the aisle for A, so the lines are drawn and erased, never faded. Lines are 1px fat lines from the hard edges of the real model.
function WireTruck({ clock, name, x }: SceneProps & { name: 'r16'; x: (pos: number) => number }) {
  const gltf = useGLTF(modelUrl(name)) as unknown as { scene: THREE.Group };
  const spec = SPEC[name];
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), []);
  const edges = useMemo(() => bakeEdges(gltf.scene, name, 70), [gltf, name]);
  // a 1px line in the info blue of the automation floor, which reads over the red body, the dark mast and the pale rack alike
  const mat = useMemo(() => new LineMaterial({ color: 0x468cc4, linewidth: 1, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, depthTest: false, clippingPlanes: [plane] }), [plane]);
  const matWheel = mat;
  const mk = (pts: number[], m: LineMaterial) => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(pts));
    const l = new LineSegments2(g, m);
    l.frustumCulled = false;
    return l;
  };
  const body = useMemo(() => mk(edges.body, mat), [edges, mat]);
  // the truck's reach along the world x axis, from the model's own edges once it is turned to face +x
  const reach = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < edges.body.length; i += 3) {
      const wx = Math.cos(spec.yaw) * edges.body[i] + Math.sin(spec.yaw) * edges.body[i + 2];
      lo = Math.min(lo, wx);
      hi = Math.max(hi, wx);
    }
    return { lo, hi };
  }, [edges, spec.yaw]);
  const wheels = useMemo(() => edges.wheels.map((w) => ({ ...w, line: mk(w.pts, matWheel) })), [edges, matWheel]);
  const root = useRef<THREE.Group>(null);
  const wg = useRef<THREE.Group[]>([]);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  useFrame(() => {
    const u = uOf(clock);
    const on = u > 8.0 && u < 8.95;
    if (root.current) root.current.visible = on;
    if (!on) return;
    mat.resolution.set(size.width * dpr, size.height * dpr);
    mat.linewidth = Math.max(1, size.height / 900) * dpr;
    mat.opacity = 1;
    // the clip plane in world space, sweeping from the nose to the middle of the truck
    const sweep = ease(range(u, 8.12, 8.5)) * (1 - ease(range(u, 8.6, 8.9)));
    const cut = x(clock.pos.current) + lerp(reach.hi + 0.1, reach.lo + (reach.hi - reach.lo) * 0.36, sweep);
    plane.constant = -cut;
    const roll = x(clock.pos.current);
    wheels.forEach((_w, i) => {
      const g = wg.current[i];
      if (g) g.rotation.z = (spec.spin * roll) / spec.wheels[i].r;
    });
  });
  return (
    <group ref={root} visible={false} renderOrder={5}>
      <group position={[0, spec.ground, 0]} rotation={[0, spec.yaw, 0]}>
        <primitive object={body} />
        {wheels.map((w, i) => (
          <group key={i} position={w.pos} scale={w.scale} ref={(g) => { if (g) wg.current[i] = g; }}>
            <primitive object={w.line} />
          </group>
        ))}
      </group>
    </group>
  );
}

export default function Warehouse({ clock }: SceneProps) {
  const roofNear = useRef<THREE.Group>(null);
  const roofFar = useRef<THREE.Group>(null);
  const walls = useRef<THREE.Group | null>(null);
  const rows = useRef<(THREE.Group | null)[]>([]);
  const inner = useRef<THREE.Group>(null);
  const trucks = useRef<THREE.Group>(null);
  const apiRefs = useMemo(() => Array.from({ length: 5 }, () => ({ current: null as TruckApi | null })), []);
  const gs = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    // The roof gives way at the start of P. Each pitch slides ten metres down its slope, a hard edged move, and is gone.
    const slide = ease(range(u, 6.78, 7.0));
    const gone = slide >= 1;
    if (roofNear.current) {
      roofNear.current.visible = !gone;
      roofNear.current.position.z = slide * 10;
    }
    if (roofFar.current) {
      roofFar.current.visible = !gone;
      roofFar.current.position.z = -slide * 10;
    }
    // The interior waits for A. P shows the cut out and nothing of the building, the walls, racks and trucks rise
    // from the clean floor as the camera drops toward the aisle.
    if (inner.current) inner.current.visible = u > 8.001 && u < 10.4;
    if (trucks.current) {
      trucks.current.visible = u > 8.001 && u < 10.4;
      trucks.current.scale.y = Math.max(ease(range(u, 8.05, 8.3)), 0.001);
    }
    const wallRise = ease(range(u, 8.0, 8.25));
    if (walls.current) walls.current.scale.y = Math.max(wallRise, 0.001);
    ROWS.forEach((z, i) => {
      const g = rows.current[i];
      if (!g) return;
      // the near side rows stay down while the camera runs the aisle, so the view into the racks is open
      const rise = NEAR(z) ? ease(range(u, 8.7, 8.9)) : ease(range(u, 8.02 + i * 0.04, 8.28 + i * 0.04));
      const s = Math.max(rise, 0.001);
      g.scale.y = s;
      g.visible = s > 0.002;
    });
    const place = (i: number, x: number, z: number, yaw: number, lift: number, roll: number) => {
      const g = gs.current[i];
      if (!g) return;
      g.position.set(x, 0, z);
      g.rotation.y = yaw;
      apiRefs[i].current?.set(lift, roll);
    };
    const x1 = T1X(pos);
    const x2 = T2X(pos);
    const x3 = T3X(pos);
    const x4 = T4X(pos);
    const x5 = T5X(pos);
    place(0, x1, AISLES[1], 0, 0, x1);
    place(1, x2, AISLES[0], Math.PI, 0, 158 - x2);
    place(2, x3, AISLES[2], 0, 0, x3);
    place(3, x4, AISLES[0], 0, 0, x4);
    place(4, x5, AISLES[2], Math.PI, 0, 160 - x5);
  });

  return (
    <group>
      <Floor clock={clock} />
      <WarehouseRoof slopes={{ near: roofNear, far: roofFar }} />
      <group ref={inner}>
        <Walls groupRef={walls} />
        <Door />
        {ROWS.map((z, i) => (
          <Row key={z} z={z} index={i} group={(g) => (rows.current[i] = g)} />
        ))}
        <group ref={trucks}>
          <group ref={(g) => { gs.current[0] = g; }}>
            <Truck name="r16" apiRef={apiRefs[0]} />
            <WireTruck clock={clock} name="r16" x={T1X} />
          </group>
          <group ref={(g) => { gs.current[1] = g; }}>
            <Truck name="n20" load apiRef={apiRefs[1]} />
          </group>
          <group ref={(g) => { gs.current[2] = g; }}>
            <Truck name="d12" load apiRef={apiRefs[2]} />
          </group>
          <group ref={(g) => { gs.current[3] = g; }}>
            <Truck name="mt15c" apiRef={apiRefs[3]} />
          </group>
          <group ref={(g) => { gs.current[4] = g; }}>
            <Truck name="r16" load apiRef={apiRefs[4]} />
          </group>
        </group>
      </group>
    </group>
  );
}
