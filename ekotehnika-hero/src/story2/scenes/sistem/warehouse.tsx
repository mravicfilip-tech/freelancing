// The warehouse as a lit model. A roof that gives way, racks of light that rise from a clean floor, aisles with
// ceiling strips, and three indoor trucks at work. The same building is the roof in Z, the cutaway in P and
// the aisle in A and B.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { Truck, type TruckApi } from './models';
import type { SceneProps } from '../../clock';
import { track } from '../../../story/scenes/sistem/tracks';
import { AISLES, WH } from './route';
import { K, ease, poolMaterial, range, rng, softTexture, uOf } from './kit';

const BAY = 2.7;
const BAYS = 17;
const RACK_X0 = 120.2;
const LEVELS = [0, 1.5, 3.0, 4.5];
// Row centres across the building, back to front. Rows at z above the middle aisle belong to the near side.
const ROWS = [-21.95, -17.65, -16.55, -12.25, -11.15, -6.85];
const NEAR = (z: number) => z > AISLES[1];

const BEAM = new THREE.MeshBasicMaterial({ color: '#b4bec2', toneMapped: false });
const PALETTE = ['#2c363a', '#344045', '#283236', '#3d4a4f', '#303c40', '#46545a'];

function Row({ z, index, group }: { z: number; index: number; group: (g: THREE.Group | null) => void }) {
  const up = useRef<THREE.InstancedMesh>(null);
  const beam = useRef<THREE.InstancedMesh>(null);
  const load = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(100 + index);
    const loads: { x: number; y: number; h: number; c: THREE.Color }[] = [];
    for (let b = 0; b < BAYS; b++)
      for (const ly of LEVELS)
        for (const side of [-0.6, 0.6]) {
          if (r() < 0.14) continue;
          const h = 0.9 + r() * 0.4;
          loads.push({ x: RACK_X0 + b * BAY + BAY / 2 + side, y: ly + 0.15 + h / 2 + (ly === 0 ? 0.02 : 0.12), h, c: new THREE.Color(PALETTE[Math.floor(r() * PALETTE.length)]) });
        }
    return loads;
  }, [index]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let b = 0; b <= BAYS; b++)
      for (const dz of [-0.5, 0.5]) up.current!.setMatrixAt(i++, m.makeTranslation(RACK_X0 + b * BAY, 3.3, dz));
    up.current!.instanceMatrix.needsUpdate = true;
    i = 0;
    for (let b = 0; b < BAYS; b++)
      for (const ly of LEVELS.slice(1).concat([6.0]))
        for (const dz of [-0.5, 0.5]) beam.current!.setMatrixAt(i++, m.makeTranslation(RACK_X0 + b * BAY + BAY / 2, ly, dz));
    beam.current!.instanceMatrix.needsUpdate = true;
    data.forEach((d, j) => {
      load.current!.setMatrixAt(j, m.compose(new THREE.Vector3(d.x, d.y, 0), new THREE.Quaternion(), new THREE.Vector3(1, d.h, 1)));
      load.current!.setColorAt(j, d.c);
    });
    load.current!.instanceMatrix.needsUpdate = true;
    if (load.current!.instanceColor) load.current!.instanceColor.needsUpdate = true;
  }, [data]);
  return (
    <group ref={group} position={[0, 0, z]}>
      <instancedMesh ref={up} args={[undefined, undefined, (BAYS + 1) * 2]} material={K.metalGrey} castShadow>
        <boxGeometry args={[0.1, 6.6, 0.1]} />
      </instancedMesh>
      <instancedMesh ref={beam} args={[undefined, undefined, BAYS * 5 * 2]} material={BEAM}>
        <boxGeometry args={[BAY - 0.12, 0.1, 0.06]} />
      </instancedMesh>
      <instancedMesh ref={load} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 1, 0.92]} />
        <meshStandardMaterial roughness={0.85} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}

function Strips() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const o: [number, number][] = [];
    for (const z of AISLES) for (let x = 124; x < 168; x += 6) o.push([x, z]);
    return o;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    items.forEach(([x, z], i) => ref.current!.setMatrixAt(i, m.makeTranslation(x, 8.3, z)));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  const tex = softTexture();
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={K.glow}>
        <boxGeometry args={[3.6, 0.07, 0.22]} />
      </instancedMesh>
      {items.map(([x, z], i) => (
        <sprite key={i} position={[x, 8.0, z]} scale={[5, 5, 1]}>
          <spriteMaterial map={tex} color={C.lightGrey} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

function roofGeo(zEave: number, zRidge: number) {
  const g = new THREE.BufferGeometry();
  const x0 = WH.x0 - 0.3;
  const x1 = WH.x1 + 0.3;
  const pos = [x0, WH.eave, zEave, x1, WH.eave, zEave, x1, WH.peak, zRidge, x0, WH.peak, zRidge];
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex(zEave > zRidge ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  g.computeVertexNormals();
  return g;
}

function ribTexture(base: string, rib: string) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 64, 8);
  g.fillStyle = rib;
  for (let i = 0; i < 4; i++) g.fillRect(i * 16, 0, 4, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(56, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Roof({ matsRef }: { matsRef: React.MutableRefObject<THREE.Material[]> }) {
  const zc = (WH.z0 + WH.z1) / 2;
  const mats = useMemo(() => {
    const light = new THREE.MeshStandardMaterial({ map: ribTexture('#3a4346', '#4d5a5e'), roughness: 0.7, metalness: 0.2, transparent: true });
    const dark = new THREE.MeshStandardMaterial({ map: ribTexture('#1d2325', '#262e31'), roughness: 0.75, metalness: 0.2, transparent: true });
    const sky = new THREE.MeshStandardMaterial({ color: '#4a565a', emissive: '#7b878b', emissiveIntensity: 0.3, roughness: 0.4, transparent: true });
    const vent = new THREE.MeshStandardMaterial({ color: '#5c696e', roughness: 0.4, metalness: 0.6, transparent: true });
    const line = new THREE.LineBasicMaterial({ color: C.lightGrey, transparent: true, opacity: 0.75, toneMapped: false });
    return { light, dark, sky, vent, line };
  }, []);
  useLayoutEffect(() => {
    matsRef.current = [mats.light, mats.dark, mats.sky, mats.vent, mats.line];
  }, [mats, matsRef]);
  const near = useMemo(() => roofGeo(WH.z1, zc), [zc]);
  const far = useMemo(() => roofGeo(WH.z0, zc), [zc]);
  const outline = useMemo(() => {
    const pts = [
      [WH.x0, WH.eave, WH.z1], [WH.x1, WH.eave, WH.z1], [WH.x1, WH.eave, WH.z0], [WH.x0, WH.eave, WH.z0], [WH.x0, WH.eave, WH.z1],
    ].map((p) => new THREE.Vector3(...(p as [number, number, number])));
    const ridge = [new THREE.Vector3(WH.x0, WH.peak, zc), new THREE.Vector3(WH.x1, WH.peak, zc)];
    return [new THREE.BufferGeometry().setFromPoints(pts), new THREE.BufferGeometry().setFromPoints(ridge)];
  }, [zc]);
  const skylights = useMemo(() => {
    const o: number[] = [];
    for (let i = 0; i < 6; i++) o.push(WH.x0 + 5 + i * 8.6);
    return o;
  }, []);
  const vents = useMemo(() => Array.from({ length: 6 }, (_, i) => WH.x0 + 8 + i * 8.6), []);
  const slope = (WH.peak - WH.eave) / (zc - WH.z1);
  return (
    <group>
      <mesh geometry={near} material={mats.light} />
      <mesh geometry={far} material={mats.dark} />
      {skylights.map((x) => (
        <mesh key={x} position={[x, WH.eave + (-8 - WH.z1) * slope + 0.04, -8]} rotation={[Math.atan(slope) * -1, 0, 0]} material={mats.sky}>
          <boxGeometry args={[3.6, 0.04, 1.5]} />
        </mesh>
      ))}
      {vents.map((x) => (
        <mesh key={x} position={[x, WH.peak + 0.25, zc - 1.2]} material={mats.vent}>
          <cylinderGeometry args={[0.55, 0.65, 0.5, 20]} />
        </mesh>
      ))}
      <lineLoop geometry={outline[0]} material={mats.line} />
      <lineSegments geometry={outline[1]} material={mats.line} />
    </group>
  );
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
          <lineSegments material={new THREE.LineBasicMaterial({ color: C.lightGrey, transparent: true, opacity: 0.5, toneMapped: false })}>
            <edgesGeometry args={[new THREE.BoxGeometry(p.w, p.h, p.d)]} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function Floor() {
  const pool = useMemo(() => poolMaterial(0.3, C.lightGrey), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(WH.x0 + WH.x1) / 2, 0.012, (WH.z0 + WH.z1) / 2]} receiveShadow>
        <planeGeometry args={[WH.x1 - WH.x0, WH.z1 - WH.z0]} />
        <meshLambertMaterial color="#0a0c0d" />
      </mesh>
      {AISLES.map((z) =>
        [-1.55, 1.55].map((dz) => (
          <mesh key={`${z}${dz}`} position={[(WH.x0 + WH.x1) / 2, 0.03, z + dz]} material={K.glowSoft}>
            <boxGeometry args={[WH.x1 - WH.x0 - 0.5, 0.01, 0.07]} />
          </mesh>
        )),
      )}
      {/* a soft pool in the middle of the clean floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WH.x0 + 18, 0.04, AISLES[1]]} material={pool}>
        <planeGeometry args={[40, 20]} />
      </mesh>
      {/* a pool of light at the door end, where the day comes in */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WH.x0 + 6, 0.04, AISLES[1]]} material={pool}>
        <planeGeometry args={[18, 9]} />
      </mesh>
    </group>
  );
}

function Door() {
  const tex = softTexture();
  return (
    <group>
      <mesh position={[WH.x0 + 0.2, 2.4, AISLES[1]]} rotation={[0, Math.PI / 2, 0]} material={K.glow}>
        <planeGeometry args={[4.4, 4.8]} />
      </mesh>
      <sprite position={[WH.x0 + 1.2, 2.6, AISLES[1]]} scale={[16, 12, 1]}>
        <spriteMaterial map={tex} color={C.white} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

// Indoor trucks along the aisles. Positions by scroll pixels, forward travel by arc length.
const T1X = track([[0, 124], [5300, 124], [6400, 129], [7000, 138], [7600, 150], [8000, 151.5], [12000, 151.5]]);
const T2X = track([[0, 158], [5300, 158], [6400, 152], [7600, 140], [8000, 136], [12000, 136]]);
const T3X = track([[0, 126], [5300, 126], [6400, 134], [7600, 148], [8000, 152], [12000, 152]]);
const T4X = track([[0, 130], [5300, 130], [6400, 133], [8000, 142], [12000, 142]]);
const T5X = track([[0, 160], [5300, 160], [6400, 156], [8000, 146], [12000, 146]]);

export default function Warehouse({ clock }: SceneProps) {
  const roofMats = useRef<THREE.Material[]>([]);
  const roof = useRef<THREE.Group>(null);
  const walls = useRef<THREE.Group | null>(null);
  const rows = useRef<(THREE.Group | null)[]>([]);
  const lights = useRef<THREE.PointLight[]>([]);
  const inner = useRef<THREE.Group>(null);
  const strips = useRef<THREE.Group>(null);
  const trucks = useRef<THREE.Group>(null);
  const apiRefs = useMemo(() => Array.from({ length: 5 }, () => ({ current: null as TruckApi | null })), []);
  const gs = useRef<(THREE.Group | null)[]>([]);
  const lampPts = useMemo(() => [[126, -14.4], [140, -14.4], [154, -14.4], [166, -14.4], [132, -19.8], [152, -19.8], [132, -9], [152, -9], [124, -14.4]] as [number, number][], []);

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    // roof gives way at the start of P
    const roofOp = 1 - ease(range(u, 7.0, 7.32));
    roofMats.current.forEach((m) => {
      const a = m as THREE.Material & { opacity: number };
      a.opacity = m.type === 'LineBasicMaterial' ? 0.75 * roofOp : roofOp;
      m.visible = roofOp > 0.003;
    });
    if (roof.current) {
      roof.current.visible = roofOp > 0.003;
      roof.current.position.y = ease(range(u, 7.0, 7.32)) * 1.5;
    }
    if (inner.current) inner.current.visible = u > 7.45 && u < 10.4;
    if (strips.current) strips.current.visible = u >= 8.25;
    if (trucks.current) trucks.current.visible = u > 7.4 && u < 10.4;
    // walls and racks rise from the clean floor in the second half of P
    const wallRise = ease(range(u, 7.5, 7.75));
    if (walls.current) walls.current.scale.y = Math.max(wallRise, 0.001);
    const nearDown = ease(range(u, 8.0, 8.18)) * (1 - ease(range(u, 8.7, 8.9)));
    ROWS.forEach((z, i) => {
      const g = rows.current[i];
      if (!g) return;
      const rise = ease(range(u, 7.52 + i * 0.04, 7.78 + i * 0.04));
      const s = Math.max(rise * (NEAR(z) ? 1 - nearDown : 1), 0.001);
      g.scale.y = s;
      g.visible = s > 0.002;
    });
    const lit = ease(range(u, 7.5, 8.0));
    lights.current.forEach((l) => (l.intensity = lit * 14));
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
      <Floor />
      <group ref={roof}>
        <Roof matsRef={roofMats} />
      </group>
      <group ref={inner}>
        <Walls groupRef={walls} />
        <Door />
        <group ref={strips}>
          <Strips />
        </group>
        {ROWS.map((z, i) => (
          <Row key={z} z={z} index={i} group={(g) => (rows.current[i] = g)} />
        ))}
        {lampPts.map(([x, z], i) => (
          <pointLight key={i} ref={(l) => { if (l) lights.current[i] = l; }} position={[x, 6.4, z]} intensity={0} distance={22} decay={2} color={C.white} />
        ))}
        <group ref={trucks}>
          <group ref={(g) => { gs.current[0] = g; }}>
            <Truck name="r16" apiRef={apiRefs[0]} />
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
