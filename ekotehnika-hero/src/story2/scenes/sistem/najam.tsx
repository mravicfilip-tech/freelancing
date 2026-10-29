// Najam, N, one working warehouse. A hall in the look of the Prodaja warehouse, light ground and the LMH greys, four dock doors on
// the front wall with a plain white lorry at the first, the staging floor in front of the docks and three aisles of pallet racks
// behind it. The racks, the pallets and the floor are instanced and cheap like warehouse.tsx, the trucks are the real Linde models.
// The hall hangs on the Najam point NP, see najamplan.ts for its metres and for everything that moves in N3. Every pose is a pure
// function of the story clock, so a frozen clock always draws the same picture and scrolling back plays it backwards. In round 6
// only N3 moves, N1, N2 and N4 show the same hall standing still, the trucks where they stand at the start and at the end of N3.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { NP } from './route';
import { SPEC, Truck, type ModelName, type TruckApi } from './models';
import { BoxSet, type BoxItem } from './props';
import { labelTexture } from './warehouse';
import { G, K, ease, lam, lit, range, rng, uOf } from './kit';
import { N_SUB } from '../../timeline';
import { HALL, PALLETS, d12At, h30At, isHeroSlot, levelY, palletAt, r16At, x50At, type Pose } from './najamplan';

// ---- materials --------------------------------------------------------------------------------------------------------

// The greys of the racks of the Prodaja warehouse, one step lighter all through, since the text of N3 and N4 lies over the racks and
// graphite uprights through a title read as strokes of the letters.
const rackGrey = lam(G.mid);
const beamWeb = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.4) });
const beamFlange = lam(G.mid);
const palletBase = lam(G.mid);
const loadMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.3) }));
const wrapShell = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.6), transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false });
const wrapBand = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.7), transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false });
const wallMat = lam(G.pale, { emissive: new THREE.Color().setScalar(0.56) });
const wallBase = lam(G.light, { emissive: new THREE.Color().setScalar(0.46) });
const apron = lam(G.light, { emissive: new THREE.Color().setScalar(0.2) });
const slab = lam(G.white, { emissive: new THREE.Color().setScalar(0.26) });
const doorMat = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.3) });
const line = new THREE.MeshBasicMaterial({ color: G.mid, opacity: 0.62, transparent: true, toneMapped: false, depthWrite: false });
const lineFaint = new THREE.MeshBasicMaterial({ color: G.light, opacity: 0.7, transparent: true, toneMapped: false, depthWrite: false });
const black = lam(G.black);
const trailerWhite = lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) });
const cabGrey = lam(G.light, { emissive: lit(G.light).multiplyScalar(0.4) });
const tyre = lam('#111111');

// Shipping and rack labels, the white plates of the Prodaja racks, built once.
const labelMats: THREE.Material[] = [];
const labelMat = (i: number) => (labelMats[i] ??= new THREE.MeshBasicMaterial({ map: labelTexture(['A 12 03', 'B 07 02', 'C 21 04', 'D 03 01', 'N 01', 'N 02'][i], 71 + i * 7), toneMapped: false }));

// Instanced flat plates, each item a centre x, y, z and a width and height, all turned the same way about the y axis. yaw 0 faces +z.
function Plates({ items, yaw, mat }: { items: [number, number, number, number, number][]; yaw: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    items.forEach(([x, y, z, w, h], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, 1))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items, yaw]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

// ---- the racks --------------------------------------------------------------------------------------------------------

const BAY = HALL.bay;
const BAYS = HALL.bays;
const X0 = HALL.rackX0;
const BEAMS = [1.5, 3.0, 4.5, 6.0];

type RowSets = {
  up: BoxItem[];
  guard: BoxItem[];
  brace: BoxItem[];
  web: BoxItem[];
  flange: BoxItem[];
  base: BoxItem[];
  shell: BoxItem[];
  bands: BoxItem[];
  loads: BoxItem[][];
  rackLabels: [number, number, number, number, number][][];
  loadLabels: [number, number, number, number, number][][];
};

// One row of a rack block, a run of ten bays with uprights, beams and pallets on four levels. zc is the row's centre, face is +1 when
// the row looks toward +z and -1 when it looks toward -z, where its aisle is. The four places the story fills are left empty.
function rackRow(zc: number, face: 1 | -1, seed: number): RowSets {
  const r = rng(seed);
  const o: RowSets = { up: [], guard: [], brace: [], web: [], flange: [], base: [], shell: [], bands: [], loads: [[], [], []], rackLabels: [[], []], loadLabels: [[], []] };
  for (let b = 0; b <= BAYS; b++) {
    const x = X0 - b * BAY;
    for (const dz of [-0.5, 0.5]) {
      o.up.push([x, 3.3, zc + dz, 0.1, 6.6, 0.1]);
      // a guard on the foot of each upright, on the aisle side only
      if (dz * face > 0) o.guard.push([x, 0.22, zc + dz + dz * 0.12, 0.16, 0.44, 0.1]);
    }
    // the ladder bracing between the two uprights of a frame
    for (const y of [0.45, 2.1, 3.9, 5.7]) o.brace.push([x, y, zc, 0.035, 0.05, 0.9]);
  }
  for (let b = 0; b < BAYS; b++) {
    const cx = X0 - b * BAY - BAY / 2;
    for (const ly of BEAMS)
      for (const dz of [-0.5, 0.5]) {
        o.web.push([cx, ly, zc + dz, BAY - 0.12, 0.14, 0.04]);
        o.flange.push([cx, ly + 0.085, zc + dz + (dz > 0 ? -0.03 : 0.03), BAY - 0.12, 0.03, 0.1]);
      }
    // a rack label on the three lower beams, on the aisle face
    for (const ly of [1.5, 3.0, 4.5]) o.rackLabels[(b + Math.round(ly)) % 2].push([cx, ly, zc + face * 0.525, 0.38, 0.12]);
  }
  for (let b = 0; b < BAYS; b++)
    for (const ly of HALL.levels)
      for (const side of [-0.65, 0.65]) {
        const x = X0 - b * BAY - BAY / 2 + side;
        // the random draw is taken first, so the places the story fills do not shift every other pallet
        const skip = r() < 0.14;
        const h = 0.9 + r() * 0.4;
        const colour = Math.floor(r() * 3);
        if (skip || isHeroSlot(x, zc, ly)) continue;
        const y0 = levelY(ly);
        o.base.push([x, y0 + 0.07, zc, 1.2, 0.14, 0.82]);
        const yc = y0 + 0.14 + h / 2;
        o.loads[colour].push([x, yc, zc, 1.08, h, 0.88]);
        o.shell.push([x, yc, zc, 1.13, h + 0.03, 0.93]);
        o.bands.push([x, y0 + 0.14 + h * 0.3, zc, 1.15, 0.07, 0.95], [x, y0 + 0.14 + h * 0.68, zc, 1.15, 0.07, 0.95]);
        o.loadLabels[(b + (side > 0 ? 1 : 0) + Math.round(ly)) % 2].push([x - 0.2, yc + h * 0.1, zc + face * 0.47, 0.34, 0.12]);
      }
  return o;
}

function Racks() {
  const rows = useMemo(() => {
    const out: { sets: RowSets; face: 1 | -1 }[] = [];
    HALL.blocks.forEach((bz, i) => {
      out.push({ sets: rackRow(bz + 0.55, 1, 300 + i * 2), face: 1 });
      out.push({ sets: rackRow(bz - 0.55, -1, 301 + i * 2), face: -1 });
    });
    return out;
  }, []);
  // the rows of one face share their sets, so the whole hall is a dozen draws and not a hundred
  const all = useMemo(() => {
    const cat = <T,>(pick: (s: RowSets) => T[]) => rows.flatMap((r) => pick(r.sets));
    const faceOf = (f: 1 | -1, pick: (s: RowSets) => [number, number, number, number, number][]) => rows.filter((r) => r.face === f).flatMap((r) => pick(r.sets));
    return {
      up: cat((s) => s.up),
      guard: cat((s) => s.guard),
      brace: cat((s) => s.brace),
      web: cat((s) => s.web),
      flange: cat((s) => s.flange),
      base: cat((s) => s.base),
      shell: cat((s) => s.shell),
      bands: cat((s) => s.bands),
      loads: [0, 1, 2].map((i) => cat((s) => s.loads[i])),
      rackLabels: [1, -1].map((f) => [0, 1].map((v) => faceOf(f as 1 | -1, (s) => s.rackLabels[v]))),
      loadLabels: [1, -1].map((f) => [0, 1].map((v) => faceOf(f as 1 | -1, (s) => s.loadLabels[v]))),
    };
  }, [rows]);
  return (
    <group>
      <BoxSet items={all.up} mat={rackGrey} cast />
      <BoxSet items={all.guard} mat={beamWeb} cast />
      <BoxSet items={all.brace} mat={rackGrey} />
      <BoxSet items={all.web} mat={beamWeb} cast />
      <BoxSet items={all.flange} mat={beamFlange} />
      <BoxSet items={all.base} mat={palletBase} cast />
      {all.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={all.shell} mat={wrapShell} receive={false} />
      <BoxSet items={all.bands} mat={wrapBand} receive={false} />
      {[0, 1].map((fi) =>
        [0, 1].map((v) => (
          <group key={`${fi}${v}`}>
            <Plates items={all.rackLabels[fi][v]} yaw={fi === 0 ? 0 : Math.PI} mat={labelMat(v)} />
            <Plates items={all.loadLabels[fi][v]} yaw={fi === 0 ? 0 : Math.PI} mat={labelMat(v + 2)} />
          </group>
        )),
      )}
    </group>
  );
}

// ---- the hall ---------------------------------------------------------------------------------------------------------

const DOOR_W = 3.6;
const DOOR_H = 3.9;
const WALL_T = 0.4;
const DOCK_H = 4.8;
const SIDE_H = 9;
const BACK_X = HALL.backX;
const FRONT_Z = 15.6;

// The rented trucks that wait at their bays along the far wall, facing the docks. Model, x, heading in radians.
const PARK_Z = -14.4;
const PARKED: [ModelName, number, number][] = [
  ['x50', 10.2, 0],
  ['h30d', 4.0, 0],
  ['x50', -2.2, 0],
  ['n20', -8.4, 0],
];

function Hall({ dock }: { dock: React.RefObject<THREE.Group | null> }) {
  const d = useMemo(() => {
    const wall: BoxItem[] = [];
    const lintel: BoxItem[] = [];
    const band: BoxItem[] = [];
    const door: BoxItem[] = [];
    const groove: BoxItem[] = [];
    const bumper: BoxItem[] = [];
    const lev: BoxItem[] = [];
    const frame: BoxItem[] = [];
    const wx = HALL.dockX + WALL_T / 2;
    // the dock wall, a pier between every two doors and a lintel over each, it stands low so the staging floor behind it is open
    const edges = [HALL.sideZ, ...HALL.docks.flatMap((z) => [z - DOOR_W / 2, z + DOOR_W / 2]), FRONT_Z];
    for (let i = 0; i < edges.length; i += 2) wall.push([wx, DOCK_H / 2, (edges[i] + edges[i + 1]) / 2, WALL_T, DOCK_H, edges[i + 1] - edges[i]]);
    band.push([HALL.dockX - 0.05, 0.4, (HALL.sideZ + FRONT_Z) / 2, 0.1, 0.8, FRONT_Z - HALL.sideZ]);
    HALL.docks.forEach((z, i) => {
      lintel.push([wx, (DOOR_H + DOCK_H) / 2, z, WALL_T, DOCK_H - DOOR_H, DOOR_W]);
      // the door frame, two posts and a head, in the dark rack grey
      frame.push([HALL.dockX + 0.2, DOOR_H / 2, z - DOOR_W / 2 - 0.06, 0.5, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H / 2, z + DOOR_W / 2 + 0.06, 0.5, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H + 0.06, z, 0.5, 0.12, DOOR_W + 0.24]);
      // the first door is rolled up for the lorry, the others are shut sectional doors with their joints
      if (i > 0) {
        door.push([HALL.dockX + 0.2, DOOR_H / 2, z, 0.1, DOOR_H, DOOR_W]);
        for (let g = 1; g < 6; g++) groove.push([HALL.dockX + 0.26, (DOOR_H / 6) * g, z, 0.03, 0.04, DOOR_W - 0.1]);
      } else door.push([HALL.dockX + 0.2, DOOR_H + 0.1, z, 0.1, 0.2, DOOR_W]);
      // bumpers on the outside of the wall and a dock leveller on the floor inside
      for (const s of [-1.35, 1.35]) bumper.push([HALL.dockX + WALL_T + 0.15, 1.2, z + s, 0.3, 0.5, 0.3]);
      lev.push([HALL.dockX - 1.2, 0.04, z, 2.4, 0.08, 2.4]);
    });
    // the far side wall of the hall with a base band and a pilaster every 6 m, plain like the walls of the automation aisle
    const side: BoxItem[] = [[(HALL.dockX + BACK_X) / 2, SIDE_H / 2, HALL.sideZ - 0.1, HALL.dockX - BACK_X, SIDE_H, 0.2]];
    const sideBand: BoxItem[] = [[(HALL.dockX + BACK_X) / 2, 0.6, HALL.sideZ + 0.04, HALL.dockX - BACK_X - 0.4, 1.2, 0.1]];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) sideBand.push([x, SIDE_H / 2, HALL.sideZ + 0.04, 0.3, SIDE_H, 0.14]);
    // the yard, a pale slab outside the dock wall with the lorry bays painted on it
    const yard: BoxItem[] = [[HALL.dockX + WALL_T + 10.8, -0.0, (HALL.sideZ + FRONT_Z) / 2, 21.6, 0.04, FRONT_Z - HALL.sideZ + 1.6]];
    const bayLines: BoxItem[] = [];
    for (const z of [HALL.sideZ, ...[0, 1, 2].map((i) => (HALL.docks[i] + HALL.docks[i + 1]) / 2), FRONT_Z]) bayLines.push([HALL.dockX + WALL_T + 8.5, 0.04, z, 17, 0.01, 0.1]);
    // the floor, slab joints every 6 m, the edge of the staging floor, a bay in front of every dock and the cross aisles
    const floor: BoxItem[] = [[(HALL.dockX + BACK_X) / 2, 0.005, (HALL.sideZ + FRONT_Z) / 2, HALL.dockX - BACK_X, 0.02, FRONT_Z - HALL.sideZ]];
    const joints: BoxItem[] = [];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) joints.push([x, 0.02, (HALL.sideZ + FRONT_Z) / 2, 0.04, 0.01, FRONT_Z - HALL.sideZ]);
    for (let z = HALL.sideZ + 4; z < FRONT_Z; z += 6) joints.push([(HALL.dockX + BACK_X) / 2, 0.02, z, HALL.dockX - BACK_X, 0.01, 0.04]);
    const marks: BoxItem[] = [];
    const rect = (x0: number, x1: number, z0: number, z1: number) => {
      marks.push([(x0 + x1) / 2, 0.03, z0, x1 - x0, 0.01, 0.1], [(x0 + x1) / 2, 0.03, z1, x1 - x0, 0.01, 0.1], [x0, 0.03, (z0 + z1) / 2, 0.1, 0.01, z1 - z0], [x1, 0.03, (z0 + z1) / 2, 0.1, 0.01, z1 - z0]);
    };
    HALL.docks.forEach((z) => rect(8.6, HALL.dockX - 0.4, z - 3.2, z + 3.2));
    // a bay for each of the rented trucks that stand along the far wall
    PARKED.forEach(([, x]) => rect(x - 2.9, x + 2.9, PARK_Z - 1.2, PARK_Z + 1.2));
    // the edge of the staging floor where the racks begin and the walking lane along it
    marks.push([X0 + 3.4, 0.03, (HALL.sideZ + FRONT_Z) / 2, 0.1, 0.01, FRONT_Z - HALL.sideZ], [X0 + 4.4, 0.03, (HALL.sideZ + FRONT_Z) / 2, 0.1, 0.01, FRONT_Z - HALL.sideZ]);
    // the cross aisle behind the last bay
    const back = X0 - BAYS * BAY;
    marks.push([back - 0.9, 0.03, (HALL.sideZ + FRONT_Z) / 2, 0.1, 0.01, FRONT_Z - HALL.sideZ], [back - 5.4, 0.03, (HALL.sideZ + FRONT_Z) / 2, 0.1, 0.01, FRONT_Z - HALL.sideZ]);
    // the floor pallets of the staging floor. Goods unloaded at the first dock stand in two lanes in front of it, two more blocks wait
    // in front of the third and fourth for the lorries that come after.
    const base: BoxItem[] = [];
    const loads: BoxItem[][] = [[], [], []];
    const shell: BoxItem[] = [];
    const bands: BoxItem[] = [];
    const r = rng(77);
    const stack = (x: number, z: number) => {
      const h = 0.9 + r() * 0.4;
      base.push([x, 0.07, z, 1.2, 0.14, 0.82]);
      loads[Math.floor(r() * 3)].push([x, 0.14 + h / 2, z, 1.08, h, 0.88]);
      shell.push([x, 0.14 + h / 2, z, 1.13, h + 0.03, 0.93]);
      bands.push([x, 0.14 + h * 0.3, z, 1.15, 0.07, 0.95], [x, 0.14 + h * 0.68, z, 1.15, 0.07, 0.95]);
    };
    [10.1, 11.5].forEach((x) => [-1.9, 0, 1.9].forEach((dz) => stack(x, HALL.docks[0] + dz)));
    [10.5, 11.9].forEach((x) => [-1.0, 1.0].forEach((dz) => stack(x, HALL.docks[2] + dz)));
    stack(11.2, HALL.docks[3] - 0.9);
    return { wall, lintel, band, door, groove, bumper, lev, frame, side, sideBand, yard, bayLines, floor, joints, marks, base, loads, shell, bands };
  }, []);
  return (
    <group>
      {/* the dock wall stands for the high views and sinks into the floor while the camera is low in the yard, outside it, in N3 */}
      <group ref={dock}>
        <BoxSet items={d.wall} mat={wallMat} cast />
        <BoxSet items={d.lintel} mat={wallMat} cast />
        <BoxSet items={d.band} mat={wallBase} />
        <BoxSet items={d.frame} mat={rackGrey} />
        <BoxSet items={d.door} mat={doorMat} />
        <BoxSet items={d.groove} mat={beamFlange} receive={false} />
        <BoxSet items={d.bumper} mat={black} />
        <BoxSet items={d.lev} mat={beamWeb} />
      </group>
      <BoxSet items={d.side} mat={wallMat} />
      <BoxSet items={d.sideBand} mat={wallBase} />
      <BoxSet items={d.yard} mat={apron} />
      <BoxSet items={d.bayLines} mat={line} receive={false} />
      <BoxSet items={d.floor} mat={slab} />
      <BoxSet items={d.joints} mat={lineFaint} receive={false} />
      <BoxSet items={d.marks} mat={line} receive={false} />
      <BoxSet items={d.base} mat={palletBase} cast />
      {d.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={d.shell} mat={wrapShell} receive={false} />
      <BoxSet items={d.bands} mat={wrapBand} receive={false} />
    </group>
  );
}

// ---- the lorry --------------------------------------------------------------------------------------------------------

// A lorry with a plain white box trailer and no brand on it. The trailer's rear stands against the bumpers of the first dock with
// its doors folded back on its sides, the tractor is a cab over in light grey. Built from boxes and wheels, local x runs away from
// the dock, the trailer's rear at 0.
function Wheel({ x, z, r, w }: { x: number; z: number; r: number; w: number }) {
  return (
    <group position={[x, r, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={tyre} castShadow>
        <cylinderGeometry args={[r, r, w, 20]} />
      </mesh>
      <mesh material={beamWeb} position={[0, z > 0 ? w / 2 + 0.005 : -w / 2 - 0.005, 0]}>
        <cylinderGeometry args={[r * 0.58, r * 0.58, 0.02, 16]} />
      </mesh>
      <mesh material={beamFlange} position={[0, z > 0 ? w / 2 + 0.02 : -w / 2 - 0.02, 0]}>
        <cylinderGeometry args={[r * 0.2, r * 0.2, 0.03, 12]} />
      </mesh>
    </group>
  );
}

function Lorry() {
  const ribs = useMemo(() => {
    const out: BoxItem[] = [];
    for (let x = 0.9; x < 9.6; x += 1.35) for (const s of [-1, 1]) out.push([x, 2.6, s * 1.31, 0.06, 2.65, 0.03]);
    return out;
  }, []);
  const TOP = 3.95;
  return (
    <group>
      {/* the trailer box with its roof rail and lower rail, the chassis under it and the rear frame */}
      <mesh position={[4.9, (1.2 + TOP) / 2, 0]} material={trailerWhite} castShadow receiveShadow>
        <boxGeometry args={[9.8, TOP - 1.2, 2.6]} />
      </mesh>
      <BoxSet items={ribs} mat={beamFlange} receive={false} />
      <BoxSet items={[[4.9, TOP + 0.04, 0, 9.9, 0.08, 2.64], [4.9, 1.22, 0, 9.9, 0.08, 2.64], [4.9, 1.0, 0, 9.6, 0.22, 1.2]]} mat={rackGrey} cast />
      <BoxSet items={[[0.02, 2.6, -1.3, 0.1, 2.75, 0.1], [0.02, 2.6, 1.3, 0.1, 2.75, 0.1], [0.02, TOP, 0, 0.1, 0.1, 2.7], [0.02, 1.24, 0, 0.1, 0.1, 2.7]]} mat={rackGrey} />
      {/* the rear doors, folded back against the sides */}
      <BoxSet items={[[0.65, 2.55, -1.36, 1.3, 2.6, 0.05], [0.65, 2.55, 1.36, 1.3, 2.6, 0.05]]} mat={trailerWhite} cast />
      {/* the rear underrun bar, the landing legs, the mudflaps and the side lights */}
      <BoxSet items={[[0.35, 0.55, 0, 0.12, 0.14, 2.3], [0.35, 0.8, -1.05, 0.1, 0.5, 0.1], [0.35, 0.8, 1.05, 0.1, 0.5, 0.1], [6.6, 0.6, -1.0, 0.14, 1.2, 0.14], [6.6, 0.6, 1.0, 0.14, 1.2, 0.14], [5.9, 0.55, -1.12, 0.05, 0.6, 0.55], [5.9, 0.55, 1.12, 0.05, 0.6, 0.55]]} mat={black} cast />
      <BoxSet items={[[0.04, 1.4, -1.0, 0.04, 0.1, 0.22], [0.04, 1.4, 1.0, 0.04, 0.1, 0.22], [3, 1.35, -1.33, 0.2, 0.06, 0.04], [3, 1.35, 1.33, 0.2, 0.06, 0.04], [7.5, 1.35, -1.33, 0.2, 0.06, 0.04], [7.5, 1.35, 1.33, 0.2, 0.06, 0.04]]} mat={beamWeb} />
      {[2.4, 3.7, 5.0].flatMap((x) => [-1.12, 1.12].map((z) => <Wheel key={`${x}${z}`} x={x} z={z} r={0.5} w={0.36} />))}
      {/* the tractor, chassis, fifth wheel, tanks and a cab over, its fifth wheel under the front of the trailer */}
      <group position={[-3.8, 0, 0]}>
      <BoxSet items={[[13.7, 0.95, 0, 6.2, 0.3, 1.0], [12.3, 1.3, 0, 1.4, 0.12, 1.5], [17.0, 0.55, 0, 0.3, 0.4, 2.3]]} mat={rackGrey} cast />
      <mesh position={[15.5, 2.6, 0]} material={cabGrey} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.8, 2.5]} />
      </mesh>
      <BoxSet items={[[16.0, 4.15, 0, 1.9, 0.5, 2.3]]} mat={cabGrey} cast />
      <BoxSet items={[[16.92, 2.95, 0, 0.04, 1.1, 2.2], [15.6, 3.0, -1.26, 1.6, 0.9, 0.03], [15.6, 3.0, 1.26, 1.6, 0.9, 0.03]]} mat={K.vanGlass} />
      <BoxSet items={[[16.94, 1.7, -0.85, 0.05, 0.22, 0.4], [16.94, 1.7, 0.85, 0.05, 0.22, 0.4], [16.94, 1.7, 0, 0.05, 0.5, 0.9]]} mat={beamFlange} />
      <BoxSet items={[[15.0, 1.1, -1.25, 1.2, 0.12, 0.3], [15.0, 1.1, 1.25, 1.2, 0.12, 0.3], [12.9, 0.85, -1.2, 1.5, 0.7, 0.4], [12.9, 0.85, 1.2, 1.5, 0.7, 0.4]]} mat={beamWeb} cast />
      <BoxSet items={[[14.1, 3.2, -1.3, 0.12, 0.3, 0.12], [14.1, 3.2, 1.3, 0.12, 0.3, 0.12], [14.2, 4.2, 1.18, 0.1, 1.5, 0.1]]} mat={black} />
      {[11.0, 12.3].flatMap((x) => [-1.0, 1.0].map((z) => <Wheel key={`${x}${z}`} x={x} z={z} r={0.5} w={0.36} />))}
      {[16.0].flatMap((x) => [-1.05, 1.05].map((z) => <Wheel key={`${x}${z}`} x={x} z={z} r={0.5} w={0.36} />))}
      </group>
    </group>
  );
}

// ---- the pallets and the trucks ---------------------------------------------------------------------------------------

// A loaded pallet in the frame of a truck's forks, x along the forks and z across them, its bottom at the origin. The same loads as
// the racks, a dark base, a wrapped white or grey load with two bands and a label plate on each aisle face.
function Load({ h = 1.05, colour = 0 }: { h?: number; colour?: number }) {
  return (
    <group>
      <mesh position={[0, 0.07, 0]} material={palletBase} castShadow>
        <boxGeometry args={[0.82, 0.14, 1.2]} />
      </mesh>
      <mesh position={[0, 0.14 + h / 2, 0]} material={loadMats[colour]} castShadow>
        <boxGeometry args={[0.88, h, 1.08]} />
      </mesh>
      <mesh position={[0, 0.14 + h / 2, 0]} material={wrapShell}>
        <boxGeometry args={[0.93, h + 0.03, 1.13]} />
      </mesh>
      {[0.3, 0.68].map((f) => (
        <mesh key={f} position={[0, 0.14 + h * f, 0]} material={wrapBand}>
          <boxGeometry args={[0.95, 0.07, 1.15]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.445, 0.14 + h * 0.6, -s * 0.2]} rotation={[0, (s * Math.PI) / 2, 0]} material={labelMat(s > 0 ? 0 : 1)}>
          <planeGeometry args={[0.34, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

// the pose of a truck from its plan, in the hall's metres, a heading th faces +x at 0
const place = (g: THREE.Group, p: Pose) => {
  g.position.set(p.x, 0, p.z);
  g.rotation.y = -p.th;
};

// The carriage of the reach truck, a backrest and two tines on the front of its mast, and the upper stage of the mast that rises
// with it to the top beam, since the model's mast stands 3 m. In the frame of the model, which faces -x.
const MAST_TOP = 2.95;
function ReachCarriage({ carriage, stage }: { carriage: React.RefObject<THREE.Group | null>; stage: React.RefObject<THREE.Group | null> }) {
  return (
    <>
      <group ref={carriage}>
        <mesh position={[-0.2, 0.5, 0]} material={rackGrey} castShadow>
          <boxGeometry args={[0.07, 1.1, 0.9]} />
        </mesh>
        {[-0.28, 0.28].map((z) => (
          <mesh key={z} position={[-0.74, 0.025, z]} material={beamFlange} castShadow>
            <boxGeometry args={[1.1, 0.05, 0.1]} />
          </mesh>
        ))}
        <mesh position={[-0.2, 0.08, 0]} material={beamFlange}>
          <boxGeometry args={[0.1, 0.14, 0.8]} />
        </mesh>
      </group>
      <group ref={stage}>
        {[-0.3, 0.3].map((z) => (
          <mesh key={z} position={[-0.13, 0.5, z]} material={rackGrey} castShadow>
            <boxGeometry args={[0.12, 1, 0.1]} />
          </mesh>
        ))}
        <mesh position={[-0.13, 1.0, 0]} material={rackGrey}>
          <boxGeometry args={[0.12, 0.08, 0.7]} />
        </mesh>
      </group>
    </>
  );
}

function Movers({ clock }: SceneProps) {
  const x50 = useRef<THREE.Group>(null);
  const r16 = useRef<THREE.Group>(null);
  const d12 = useRef<THREE.Group>(null);
  const h30 = useRef<THREE.Group>(null);
  const x50Api = useRef<TruckApi | null>(null);
  const r16Api = useRef<TruckApi | null>(null);
  const d12Api = useRef<TruckApi | null>(null);
  const h30Api = useRef<TruckApi | null>(null);
  const carriage = useRef<THREE.Group>(null);
  const stage = useRef<THREE.Group>(null);
  const pallets = useRef<(THREE.Group | null)[]>([]);
  const p = useMemo<Pose>(() => ({ x: 0, z: 0, th: 0, lift: 0, roll: 0, reach: 0 }), []);
  const q = useMemo(() => ({ x: 0, y: 0, z: 0, th: 0 }), []);
  useFrame(() => {
    const k = Math.min(Math.max(uOf(clock) - 12, 0), 1);
    if (x50.current) {
      x50At(k, p);
      place(x50.current, p);
      x50Api.current?.set(p.lift, p.roll);
    }
    if (r16.current) {
      r16At(k, p);
      place(r16.current, p);
      r16Api.current?.set(0, 0);
      // the carriage and the upper stage of the mast, in the model's frame which faces -x
      carriage.current?.position.set(-p.reach, p.lift, 0);
      if (stage.current) {
        const top = p.lift + 1.1;
        const h = Math.max(top - MAST_TOP, 0.001);
        stage.current.position.set(0, MAST_TOP, 0);
        stage.current.scale.y = h;
        stage.current.visible = top > MAST_TOP + 0.05;
      }
    }
    if (d12.current) {
      d12At(k, p);
      place(d12.current, p);
      d12Api.current?.set(0, p.roll);
    }
    if (h30.current) {
      h30At(k, p);
      place(h30.current, p);
      h30Api.current?.set(0, p.roll);
    }
    PALLETS.forEach((_, i) => {
      const g = pallets.current[i];
      if (!g) return;
      palletAt(i, k, q);
      g.position.set(q.x, q.y, q.z);
      g.rotation.y = -q.th;
    });
  });
  // a pallet on the forks of a truck that carries one, in the frame of the model
  const carry = (name: ModelName, h: number, colour: number) => {
    const load = SPEC[name].load!;
    return (
      <group position={load}>
        <Load h={h} colour={colour} />
      </group>
    );
  };
  return (
    <group>
      <group ref={x50}>
        <Truck name="x50" apiRef={x50Api} />
      </group>
      <group ref={r16}>
        <Truck name="r16" apiRef={r16Api}>
          <ReachCarriage carriage={carriage} stage={stage} />
        </Truck>
      </group>
      <group ref={d12}>
        <Truck name="d12" apiRef={d12Api}>
          {carry('d12', 1.0, 1)}
        </Truck>
      </group>
      <group ref={h30}>
        <Truck name="h30d" apiRef={h30Api}>
          {carry('h30d', 1.1, 2)}
        </Truck>
      </group>
      {PALLETS.map((_, i) => (
        <group key={i} ref={(g) => { pallets.current[i] = g; }}>
          <Load h={1.05} colour={i % 3} />
        </group>
      ))}
    </group>
  );
}

export default function Najam({ clock }: SceneProps) {
  const dock = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = Math.min(Math.max(uOf(clock) - 12, 0), 1);
    // the wall sinks as the camera comes down to the follow, 0.5 to 0.535, and stands again as it goes back up, 0.776 to 0.79
    const down = ease(range(k, N_SUB.N3[0], 0.535)) * (1 - ease(range(k, 0.776, N_SUB.N3[1])));
    if (dock.current) {
      dock.current.scale.y = Math.max(1 - down, 0.001);
      dock.current.visible = down < 0.998;
    }
  });
  return (
    <group position={[NP.x, 0, NP.z]}>
      <Hall dock={dock} />
      <Racks />
      <group position={[HALL.dockX + WALL_T + 0.35, 0, HALL.docks[0]]}>
        <Lorry />
      </group>
      <Movers clock={clock} />
      {PARKED.map(([name, x, th], i) => (
        <group key={i} position={[x, 0, PARK_Z]} rotation={[0, -th, 0]}>
          <Truck name={name} />
        </group>
      ))}
    </group>
  );
}

