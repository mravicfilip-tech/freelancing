// Najam, N, one working warehouse. A hall in the look of the Prodaja warehouse, light ground and the LMH greys, a cutaway on a platform
// with four dock doors in its low front wall, a staging floor in front of them and four blocks of pallet racks behind, a paved yard
// outside the docks with a lorry at the first of them, and a car park on the forecourt. The racks, the pallets and the floor are
// instanced and cheap like warehouse.tsx, the trucks are the real Linde models. The hall's walls, floor markings and yard are
// najamhall.tsx, the lorries najamlorry.tsx, and the hall's metres, with everything that moves, najamplan.ts. Every pose is a pure
// function of the story clock, so a frozen clock always draws the same picture and scrolling back plays it backwards.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { NP } from './route';
import { SPEC, Truck, type ModelName, type TruckApi } from './models';
import { BoxSet, type BoxItem } from './props';
import { ease, range, rng, uOf } from './kit';
import { HALL, HALL_Y, PALLETS, X50_PAL, d12At, h30At, isHeroSlot, levelY, palletAt, r16AAt, r16BAt, x50AAt, x50BAt, type Pose } from './najamplan';
import { CHARGING, Hall, PARKED, PARK_Z, Yard, loadedPallet, newSets, PalletSet } from './najamhall';
import { AXLE_X, BED, Lorry, type LorryApi } from './najamlorry';
import { C_FROM, C_IN_TRAILER, DOCK_PALLET_COUNT, LORRY_COUNT, dockAAt, dockBAt, dockCAt, dockPalletAt, kLong, lorryAt, mkLorry } from './najamdock';
import { Load, Plates, beamFlange, beamWeb, labelMat, loadMats, palletBase, rackGrey, wrapBand, wrapShell } from './najamkit';

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

// One truck of the plan, placed every frame from its pose. A reach truck gets its carriage and mast stage, a truck that carries a
// pallet its load, the rest is the real model.
type MoverDef = { name: ModelName; at: (k: number, o: Pose) => Pose; carry?: [number, number]; from?: number };
const MOVERS: MoverDef[] = [
  { name: 'x50', at: x50AAt },
  { name: 'x50', at: x50BAt },
  { name: 'r16', at: r16AAt },
  { name: 'r16', at: r16BAt },
  { name: 'd12', at: d12At, carry: [1.0, 1] },
  { name: 'h30d', at: h30At, carry: [1.1, 2] },
  // the forklifts of the docks, rented ones, see najamdock.ts
  { name: 'x50', at: dockAAt },
  { name: 'x50', at: dockBAt },
  { name: 'x50', at: dockCAt, from: C_FROM },
];

function Mover({ clock, def }: SceneProps & { def: MoverDef }) {
  const g = useRef<THREE.Group>(null);
  const api = useRef<TruckApi | null>(null);
  const carriage = useRef<THREE.Group>(null);
  const stage = useRef<THREE.Group>(null);
  const p = useMemo<Pose>(() => ({ x: 0, z: 0, th: 0, lift: 0, roll: 0, reach: 0 }), []);
  const reach = def.name === 'r16';
  useFrame(() => {
    const k = Math.min(Math.max(uOf(clock) - 12, 0), 1);
    def.at(k, p);
    if (g.current) {
      place(g.current, p);
      g.current.visible = k >= (def.from ?? 0);
    }
    api.current?.set(reach ? 0 : p.lift, p.roll);
    if (!reach) return;
    // the carriage and the upper stage of the mast, in the model's frame which faces -x
    carriage.current?.position.set(-p.reach, p.lift, 0);
    if (stage.current) {
      const top = p.lift + 1.1;
      stage.current.position.set(0, MAST_TOP, 0);
      stage.current.scale.y = Math.max(top - MAST_TOP, 0.001);
      stage.current.visible = top > MAST_TOP + 0.05;
    }
  });
  const load = def.carry ? SPEC[def.name].load! : null;
  return (
    <group ref={g}>
      <Truck name={def.name} apiRef={api}>
        {reach && <ReachCarriage carriage={carriage} stage={stage} />}
        {load && def.carry && (
          <group position={load}>
            <Load h={def.carry[0]} colour={def.carry[1]} />
          </group>
        )}
      </Truck>
    </group>
  );
}

function Movers({ clock }: SceneProps) {
  const pallets = useRef<(THREE.Group | null)[]>([]);
  const q = useMemo(() => ({ x: 0, y: 0, z: 0, th: 0 }), []);
  useFrame(() => {
    const k = Math.min(Math.max(uOf(clock) - 12, 0), 1);
    PALLETS.forEach((_, i) => {
      const g = pallets.current[i];
      if (!g) return;
      palletAt(i, k, q);
      g.position.set(q.x, q.y, q.z);
      g.rotation.y = -q.th;
    });
  });
  return (
    <group>
      {MOVERS.map((def, i) => (
        <Mover key={i} clock={clock} def={def} />
      ))}
      {PALLETS.map((_, i) => (
        <group key={i} ref={(g) => { pallets.current[i] = g; }}>
          <Load h={1.05} colour={i % 3} />
        </group>
      ))}
    </group>
  );
}


// The lorries, three of them, each a trailer and a tractor placed every frame from najamdock.ts. The trailer carries the pallets that are
// still in it, the third lorry's carries none, and the second one the pallet the forklift sets down in N4, which stands in the trailer from
// that moment so it goes with it when the lorry pulls away.
const IN_TRAILER: number[][] = [[2.9, 3.9, 4.9, 5.9], [2.9, 3.9, 4.9, 5.9, 6.9, 7.9, 8.9], []];
function Lorries({ clock }: SceneProps) {
  const apis = useRef<(LorryApi | null)[]>([]);
  const last = useRef<THREE.Group>(null);
  const p = useMemo(() => mkLorry(), []);
  const sets = useMemo(
    () =>
      IN_TRAILER.map((xs, i) => {
        const r = rng(910 + i);
        const s = newSets();
        xs.forEach((x) => loadedPallet(s, r, x, 0, true, BED + X50_PAL));
        return s;
      }),
    [],
  );
  useFrame(() => {
    const k = kLong(uOf(clock));
    for (let i = 0; i < LORRY_COUNT; i++) {
      const a = apis.current[i];
      if (!a) continue;
      lorryAt(i, k, p);
      a.trailer.visible = a.tractor.visible = p.shown;
      a.trailer.position.set(p.ax - Math.cos(p.psi) * AXLE_X, 0, p.az - Math.sin(p.psi) * AXLE_X);
      a.trailer.rotation.y = -p.psi;
      a.tractor.position.set(p.px, 0, p.pz);
      a.tractor.rotation.y = -p.theta;
      a.curtain.scale.x = Math.max(1 - 0.9 * p.open, 0.001);
      a.doorA.rotation.y = (-Math.PI / 2) * p.close;
      a.doorB.rotation.y = (Math.PI / 2) * p.close;
    }
    if (last.current) last.current.visible = k >= C_IN_TRAILER.from;
  });
  return (
    <group>
      {sets.map((s, i) => (
        <Lorry
          key={i}
          apiRef={{
            get current() {
              return apis.current[i] ?? null;
            },
            set current(v) {
              apis.current[i] = v;
            },
          }}
        >
          <PalletSet s={s} />
          {i === 1 && (
            <group ref={last} position={[C_IN_TRAILER.x, BED + X50_PAL, 0]}>
              <Load h={1.05} colour={2} />
            </group>
          )}
        </Lorry>
      ))}
    </group>
  );
}

// The three pallets the forklifts of the docks move, from the trailer of lorry 1 to the wall lane and the corner, and the one on the forks
// of the third forklift until it is set down in lorry 2.
function DockLoads({ clock }: SceneProps) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const q = useMemo(() => ({ x: 0, y: 0, z: 0, th: 0, shown: true }), []);
  useFrame(() => {
    const k = Math.min(Math.max(uOf(clock) - 12, 0), 1);
    for (let i = 0; i < DOCK_PALLET_COUNT; i++) {
      const g = refs.current[i];
      if (!g) continue;
      dockPalletAt(i, k, q);
      g.visible = q.shown;
      g.position.set(q.x, q.y, q.z);
      g.rotation.y = -q.th;
    }
  });
  return (
    <group>
      {Array.from({ length: DOCK_PALLET_COUNT }, (_, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <Load h={1.05} colour={(i + 1) % 3} />
        </group>
      ))}
    </group>
  );
}

export default function Najam({ clock }: SceneProps) {
  const hall = useRef<THREE.Group>(null);
  const doors = useRef<(THREE.Group | null)[]>([]);
  const roofHatch = useRef<THREE.Group>(null);
  const roof = useRef<THREE.Group>(null);
  useFrame(() => {
    const u = uOf(clock);
    const k = Math.min(Math.max(u - 12, 0), 1);
    // the dock doors roll up into their heads, door 1 as the camera of the first flight arrives, door 3 for the second lorry
    const open = [ease(range(k, 0.2, 0.27)), 0, ease(range(k, 0.62, 0.7)), 0];
    open.forEach((o, i) => {
      const g = doors.current[i];
      if (g) g.scale.y = Math.max(1 - 0.96 * o, 0.04);
    });
    // the roof light over the dock end draws aside in the third flight, 0.74 to 0.78, for the camera to rise through, and closes behind it
    if (roofHatch.current) roofHatch.current.scale.x = Math.max(1 - ease(range(k, 0.735, 0.775)) * (1 - ease(range(k, 0.86, 0.9))), 0.001);
    // T, the roof draws in on itself like an iris while the camera dives, then the whole hall sinks as the walls and racks of the aisle rise
    const iris = ease(range(u, 13.0, 13.3));
    if (roof.current) {
      roof.current.scale.set(Math.max(1 - iris, 0.001), 1, Math.max(1 - iris, 0.001));
      roof.current.visible = iris < 0.998;
    }
    const gone = ease(range(u, 13.2, 13.6));
    if (hall.current) {
      hall.current.scale.y = Math.max(1 - gone, 0.001);
      hall.current.visible = gone < 0.998;
    }
  });
  return (
    <group position={[NP.x, 0, NP.z]}>
      <group ref={hall}>
        <Yard />
        <Lorries clock={clock} />
        <group position={[0, HALL_Y, 0]}>
          <Hall doors={doors} roofHatch={roofHatch} roof={roof} />
          <Racks />
          <Movers clock={clock} />
          <DockLoads clock={clock} />
          {PARKED.map(([name, x, th], i) => (
            <group key={i} position={[x, 0, PARK_Z]} rotation={[0, -th, 0]}>
              <Truck name={name} />
            </group>
          ))}
          {CHARGING.map(([name, x, z, th], i) => (
            <group key={i} position={[x, 0, z]} rotation={[0, -th, 0]}>
              <Truck name={name} />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
