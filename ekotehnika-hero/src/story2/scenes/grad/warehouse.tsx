// The warehouse at the end of the S path, in the city style. From outside it is a long hall with a corrugated
// gable roof. In P the roof slides away, the model grows from a clean floor and indoor forklifts go to work.
// Aisles run along x, the main aisle at z = -9, and the camera in A runs down it at a truck coming toward it.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { W } from '../../../variants/v4/look';
import { useTruck } from './trucks';
import { Person } from '../../../story/scenes/grad/vehicles';
import { Box, Inst, Pools, cyl, rng, unit, type It, type Pool } from './kit';
import { AISLE_Z, WH, indoorX, nearRacks, propsGrow, racksGrow, roofSlide, seg, smooth, wallsGrow, lerp } from './choreo';

const FLOOR = 0.22;
const HALF = 14;
const RISE = WH.ridge - WH.wall;
const THETA = Math.atan2(RISE, HALF);
const SLOPE = Math.hypot(HALF, RISE) + 0.45;

const roofMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.78, side: THREE.DoubleSide });
const roofMatN = new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.78, side: THREE.DoubleSide });
// racks and pallets are pale with a little light of their own, so no dark slab can sit under the nav
const rackMat = new THREE.MeshStandardMaterial({ color: C.shadeGrey, emissive: C.white, emissiveIntensity: 0.4, roughness: 0.8 });
const floorMat = new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.95 });

// A corrugated sheet, ribs across the slope
function roofGeometry() {
  const len = WH.x1 - WH.x0 + 1;
  const cols = Math.round(len / 0.05);
  const g = new THREE.PlaneGeometry(len, SLOPE, cols, 1);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setY(i, 0.045 * Math.sin((p.getX(i) / 0.3) * Math.PI * 2));
  g.computeVertexNormals();
  return g;
}

let hazard: THREE.CanvasTexture | null = null;
function hazardTexture() {
  if (hazard) return hazard;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = C.white;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = C.shadeGrey;
  for (let i = -2; i < 4; i++) {
    g.beginPath();
    g.moveTo(i * 32, 64);
    g.lineTo(i * 32 + 16, 64);
    g.lineTo(i * 32 + 16 + 64, 0);
    g.lineTo(i * 32 + 64, 0);
    g.fill();
  }
  hazard = new THREE.CanvasTexture(c);
  hazard.wrapS = hazard.wrapT = THREE.RepeatWrapping;
  hazard.repeat.set(22, 1);
  hazard.colorSpace = THREE.SRGBColorSpace;
  return hazard;
}
let hazardMat: THREE.MeshStandardMaterial | null = null;
const hazardMaterial = () => (hazardMat ??= new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.8 }));

/* ------------------------------------------------------------------ racks */

const BAY = 2.8;
const BAYS = 12;
const RX0 = WH.x0 + 3.2;
const LEVELS = [0.05, 1.57, 3.05, 4.53];

type Block = { ups: It[]; beams: It[]; pallets: It[]; cartons: It[]; tape: It[]; shade: It[] };
function makeBlock(zc: number, seed: number): Block {
  const r = rng(seed);
  const b: Block = { ups: [], beams: [], pallets: [], cartons: [], tape: [], shade: [] };
  for (const dz of [-0.55, 0.55]) {
    const z = zc + dz;
    for (let i = 0; i <= BAYS; i++) for (const o of [-0.5, 0.5]) b.ups.push([RX0 + i * BAY, 3.0, z + o, 0.1, 6.0, 0.1]);
    for (const by of [1.5, 2.98, 4.46, 5.94]) for (const o of [-0.5, 0.5]) b.beams.push([RX0 + (BAYS * BAY) / 2, by, z + o, BAYS * BAY, 0.14, 0.07]);
    for (let i = 0; i < BAYS; i++) {
      for (const ly of LEVELS) {
        for (const o of [-0.68, 0.68]) {
          if (r() < 0.13) continue;
          const x = RX0 + i * BAY + BAY / 2 + o;
          const h = 0.7 + r() * 0.4;
          b.pallets.push([x, ly + 0.07, z, 1.2, 0.14, 0.95]);
          (r() < 0.3 ? b.shade : b.cartons).push([x, ly + 0.14 + h / 2, z, 1.08 - r() * 0.08, h, 0.86]);
          if (r() < 0.35) b.tape.push([x, ly + 0.14 + h / 2, z, 1.1, h + 0.01, 0.1]);
        }
      }
    }
  }
  return b;
}

function RackBlock({ block, gref }: { block: Block; gref: (g: THREE.Group | null) => void }) {
  return (
    <group ref={gref}>
      <Inst mat={rackMat} items={block.ups} />
      <Inst mat={rackMat} items={block.beams} />
      <Inst mat={rackMat} items={block.pallets} />
      <Inst mat={W.carton} items={block.cartons} />
      <Inst mat={W.cartonShade} items={block.shade} />
      <Inst mat={rackMat} items={block.tape} cast={false} />
    </group>
  );
}

/* ------------------------------------------------------------------ the whole hall */

export function Warehouse({ clock }: { clock: StoryClock }) {
  const roofGeo = useMemo(roofGeometry, []);
  const blocks = useMemo(
    () => ({
      s1: makeBlock(-6.2, 21),
      s2: makeBlock(-0.6, 22),
      n1: makeBlock(-11.8, 23),
      n2: makeBlock(-17.4, 24),
    }),
    [],
  );
  const refs = useRef({
    roofS: null as THREE.Group | null,
    roofN: null as THREE.Group | null,
    far: null as THREE.Group | null,
    nearX: null as THREE.Group | null,
    nearZ: null as THREE.Group | null,
    s1: null as THREE.Group | null,
    s2: null as THREE.Group | null,
    n1: null as THREE.Group | null,
    n2: null as THREE.Group | null,
    props: null as THREE.Group | null,
    marks: null as THREE.Group | null,
  }).current;
  const heroG = useRef<THREE.Group>(null);
  const hero = useTruck('r16');
  // the trucks of the cross aisles and the rack aisles, one of each kind
  const amb = [useTruck('n20'), useTruck('mt15c'), useTruck('d12'), useTruck('r16')];
  const ambG = useRef<(THREE.Group | null)[]>([]);
  const people = useRef<(THREE.Group | null)[]>([]);
  useLayoutEffect(() => {
    heroG.current?.add(hero.root);
    amb.forEach((t, i) => ambG.current[i]?.add(t.root));
    return () => {
      hero.root.removeFromParent();
      amb.forEach((t) => t.root.removeFromParent());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, amb[0], amb[1], amb[2], amb[3]]);

  const items = useMemo(() => {
    const r = rng(9);
    // pallets of cartons in the cross aisles
    const pallets: It[] = [];
    const cartons: It[] = [];
    for (let i = 0; i < 7; i++) {
      const x = 176 + i * 4.6 + r();
      const z = 2.6 + (i % 2) * 0.1;
      const h = 0.6 + r() * 0.9;
      pallets.push([x, 0.07, z, 1.2, 0.14, 0.95]);
      cartons.push([x, 0.14 + h / 2, z, 1.05, h, 0.86]);
      if (i % 3 === 0) {
        pallets.push([x, 0.14 + h + 0.07, z, 1.2, 0.14, 0.95]);
        cartons.push([x, 0.14 + h + 0.14 + 0.35, z, 1.0, 0.7, 0.84]);
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = WH.x0 + 1.8 + (i % 2) * 1.4;
      const z = -21.6 + i * 0.9;
      const h = 0.7 + r() * 0.5;
      pallets.push([x, 0.07, z, 0.95, 0.14, 1.2]);
      cartons.push([x, 0.14 + h / 2, z, 0.86, h, 1.05]);
    }
    // floor lines along the aisles
    const lines: It[] = [];
    for (const zc of [-9, -3.4, -14.6]) for (const o of [-1.55, 1.55]) lines.push([RX0 + (BAYS * BAY) / 2, 0.01, zc + o, BAYS * BAY + 6, 0.012, 0.1]);
    lines.push([WH.cx, 0.01, 3.4, 36, 0.012, 0.1], [WH.cx, 0.01, -20.4, 36, 0.012, 0.1]);
    // the door posts and the ceiling lights
    return { pallets, cartons, lines };
  }, []);

  const pools = useMemo<Pool[]>(() => [[WH.cx, WH.cz, WH.x1 - WH.x0 + 8, WH.z1 - WH.z0 + 8, 0.06]], []);

  useFrame(() => {
    const pos = clock.pos.current;
    // roof
    const slide = roofSlide(pos);
    if (refs.roofS && refs.roofN) {
      refs.roofS.position.set(WH.cx, WH.ridge + slide * 3, WH.cz + slide * 21);
      refs.roofN.position.set(WH.cx, WH.ridge + slide * 3, WH.cz - slide * 21);
      refs.roofS.visible = refs.roofN.visible = slide < 0.995;
    }
    // walls, whole before the roof leaves, flat while the floor is clean, then grown
    const vis = pos < 5750 ? 1 - slide : wallsGrow(pos);
    const cut = pos < 5750 ? lerp(1, 0.16, slide) : 0.16;
    const farY = Math.max(0.0001, vis);
    if (refs.far) {
      refs.far.scale.y = farY;
      refs.far.visible = vis > 0.004;
    }
    for (const w of [refs.nearX, refs.nearZ]) {
      if (!w) continue;
      w.scale.y = Math.max(0.0001, vis * cut);
      w.visible = vis > 0.004;
    }
    // racks and props
    const rg = Math.max(0.0001, racksGrow(pos));
    const near = rg * nearRacks(pos);
    for (const b of [refs.n1, refs.n2]) {
      if (!b) continue;
      b.scale.y = rg;
      b.visible = rg > 0.002;
    }
    const ns = Math.max(0.0001, near);
    for (const b of [refs.s1, refs.s2]) {
      if (!b) continue;
      b.scale.y = ns;
      b.visible = near > 0.002;
    }
    const pg = propsGrow(pos);
    if (refs.props) {
      refs.props.scale.y = Math.max(0.0001, pg);
      refs.props.visible = pg > 0.002;
    }
    if (refs.marks) {
      refs.marks.scale.y = Math.max(0.0001, pg);
      refs.marks.visible = pg > 0.002;
    }
    // the hero truck in the main aisle, a Linde R16 heading east
    if (heroG.current) {
      heroG.current.visible = pg > 0.002;
      const x = indoorX(pos);
      heroG.current.position.set(x, FLOOR, AISLE_Z);
      heroG.current.scale.setScalar(Math.max(0.001, smooth(seg(pos, 6150, 6350))));
      hero.roll(x);
    }
    // four more work the aisles
    const sc = Math.max(0.001, smooth(seg(pos, 6200, 6380))) * 1.15;
    const run = (i: number, z: number, dir: number, per: number, ph: number, lo: number, hi: number) => {
      const g = ambG.current[i];
      if (!g) return;
      const t = ((((pos + ph) / per) % 1) + 1) % 1;
      const x = dir > 0 ? lerp(lo, hi, t) : lerp(hi, lo, t);
      g.position.set(x, FLOOR, z);
      g.rotation.y = dir > 0 ? 0 : Math.PI;
      g.scale.setScalar(sc);
      g.visible = sc > 0.002;
      amb[i].roll(x);
    };
    run(0, 2.9, 1, 900, 0, WH.x0 + 4, WH.x1 - 4);
    run(1, -20.6, -1, 1100, 360, WH.x0 + 4, WH.x1 - 4);
    run(2, -3.4, 1, 1000, 520, RX0 + 1, RX0 + BAYS * BAY - 1);
    run(3, -14.6, -1, 1000, 140, RX0 + 1, RX0 + BAYS * BAY - 1);
    people.current.forEach((p, i) => {
      if (!p) return;
      p.scale.setScalar(Math.max(0.001, smooth(seg(pos, 6200 + i * 40, 6380))));
    });
  });

  const reg = (k: keyof typeof refs) => (g: THREE.Group | null) => {
    (refs as Record<string, THREE.Group | null>)[k] = g;
  };
  const H = WH.wall;
  const [x0, z0, x1, z1] = [WH.x0, WH.z0, WH.x1, WH.z1];
  const T = 0.5;
  const DOOR = [-11.5, -6.5] as const;

  return (
    <group>
      <Pools items={pools} />
      {/* the floor */}
      <Box a={[x0, z0, x1, z1]} h={FLOOR} m={floorMat} cast={false} />

      {/* walls, far ones whole, near ones cut down like a model */}
      <group position={[0, FLOOR, 0]}>
        <group ref={reg('far')}>
          {/* the gable end, west, with the roll up door the path leads to */}
          <Box a={[x0, z0, x0 + T, DOOR[0]]} h={H} m={W.wall} />
          <Box a={[x0, DOOR[1], x0 + T, z1]} h={H} m={W.wall} />
          <Box a={[x0, DOOR[0], x0 + T, DOOR[1]]} y={5.2} h={H - 5.2} m={W.wall} />
          {[DOOR[0] - 0.2, DOOR[1] + 0.2].map((z) => (
            <mesh key={z} geometry={unit} material={W.ink} position={[x0 + 0.1, 2.6, z]} scale={[0.5, 5.2, 0.4]} castShadow />
          ))}
          <mesh geometry={unit} material={W.ink} position={[x0 + 0.1, 5.3, (DOOR[0] + DOOR[1]) / 2]} scale={[0.5, 0.3, DOOR[1] - DOOR[0] + 0.8]} castShadow />
          <mesh position={[x0 + T + 0.02, 6.15, (DOOR[0] + DOOR[1]) / 2]} rotation={[0, Math.PI / 2, 0]} material={hazardMaterial()}>
            <planeGeometry args={[DOOR[1] - DOOR[0] + 0.8, 0.55]} />
          </mesh>
          {/* the north wall, with an ink band */}
          <Box a={[x0, z0 - T, x1, z0]} h={H} m={W.wall} />
          <Box a={[x0 + T, z0, x1 - T, z0 + 0.06]} y={0.2} h={H - 0.4} m={W.wallShade} cast={false} />
          <Box a={[x0, z0 - T - 0.05, x1, z0 - T]} y={H - 1.6} h={0.5} m={W.ink} cast={false} />
        </group>
        <group ref={reg('nearX')}>
          <Box a={[x1 - T, z0, x1, z1]} h={H} m={W.wall} />
        </group>
        <group ref={reg('nearZ')}>
          <Box a={[x0, z1, x1, z1 + T]} h={H} m={W.wall} />
        </group>

        {/* racks */}
        <RackBlock block={blocks.n1} gref={reg('n1')} />
        <RackBlock block={blocks.n2} gref={reg('n2')} />
        <RackBlock block={blocks.s1} gref={reg('s1')} />
        <RackBlock block={blocks.s2} gref={reg('s2')} />

        {/* loose pallets, floor lines */}
        <group ref={reg('props')}>
          <Inst mat={W.pallet} items={items.pallets} />
          <Inst mat={W.carton} items={items.cartons} />
        </group>
        <group ref={reg('marks')}>
          <Inst mat={W.mark} items={items.lines} cast={false} />
        </group>

        {/* the hero truck of the main aisle */}
        {[[183, 4.2, 0.3], [187, 3.5, 2.2], [196, 3.9, 4.0]].map(([x, z, ry], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]} ref={(g) => { people.current[i] = g; }}>
            <Person />
          </group>
        ))}
      </group>

      {/* the trucks are outside the scaled groups, each sets its own y */}
      <group ref={heroG} />
      {[0, 1, 2, 3].map((i) => (
        <group key={i} ref={(g) => { ambG.current[i] = g; }} />
      ))}

      {/* the roof, two corrugated halves */}
      <group ref={reg('roofS')} rotation={[THETA, 0, 0]}>
        <mesh geometry={roofGeo} material={roofMat} position={[0, 0.0, SLOPE / 2 - 0.05]} castShadow receiveShadow />
        <Vents sign={1} />
      </group>
      <group ref={reg('roofN')} rotation={[-THETA, 0, 0]}>
        <mesh geometry={roofGeo} material={roofMatN} position={[0, 0.0, -SLOPE / 2 + 0.05]} castShadow receiveShadow />
        <Vents sign={-1} />
      </group>
    </group>
  );
}

// Round vents along the ridge, two rows a side
function Vents({ sign }: { sign: number }) {
  const items = useMemo<It[]>(() => {
    const o: It[] = [];
    for (let i = 0; i < 5; i++) o.push([WH.x0 + 4 + i * 8, 0.28, sign * 1.15, 0.7, 0.46, 0.7]);
    return o;
  }, [sign]);
  return <Inst geo={cyl} mat={W.steel} items={items} />;
}
