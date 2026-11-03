// What the preloader puts into the story's own scene, round 8, see loader.ts for the idea. Everything here is built from the site's parts, the
// real Linde models through Truck, the carton and pallet of the hero (r3f/Forklift.tsx) with the EKOTEHNIKA wordmark of wordmark.tsx, the
// labelled loads, racks and plates of the Najam kit (najamkit.tsx) and the one light, environment and ground of the story. It reads the
// numbers of loader.ts each frame, and nothing in it is scaled, squashed or sunk, a part is either somewhere out of frame or on its place.
//   Utovar  LoaderCargo, eight cartons of half the hero carton's size each way settle onto the hero pallet as the loading passes eight marks. Together
//           they fill exactly the volume of the hero's carton, and the wordmark is printed across them in the two halves the hero prints it in,
//           so when the load is taped and the hero's own carton takes its place the swap shows nothing but the seams
//   Regal   Bay, one bay of racks with labelled loads on the bare ground behind the hero's camera, and the reach truck with a pallet that
//           rises the height of the rack as the loading goes
//   Kutija  PalletStand and BinLabel, the hero's carton alone on its pallet, turning with the mouse, with its bin label printed live
// Hero (index.tsx) calls heroPre and heroPost each frame, which is the one place the X50 is told what the loader wants of it.
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { M } from '../../../r3f/materials';
import { Pallet } from '../../../r3f/Forklift';
import { Truck, preloadRest, type TruckApi } from './models';
import { MARK_H, MARK_W, useWordmark } from './wordmark';
import { BoxSet, type BoxItem } from './props';
import { Load, Plates, beamFlange, beamWeb, labelMat, rackGrey } from './najamkit';
import { BAY, STAGES, isFirst, loader, onFirst, onStage, setStage } from './loader';
import { carried } from './loadercam';
import { blobMaterial, ease, range, rng } from './kit';
import { routeAt, truckS } from './route';

const PI = Math.PI;

// ---- the first set and the later groups ---------------------------------------------------------------------------------------------

// The scene mounts its later groups (the warehouse, the blueprint, the rental floor and the aisle) one after the other once the first set is
// in, so the loader's own first frames are not held by their geometry, and the models of the rest start loading at the same moment. Each
// mounts in a transition, so React builds it in slices between the loader's frames, and the next waits until the last has landed. Returns how
// many the scene may mount. With no preloader, everything at once.
const STAGE_MS = 250;
export function useStaged() {
  const [n, setN] = useState(loader.stage);
  useEffect(() => onStage(() => startTransition(() => setN(loader.stage))), []);
  useEffect(() => {
    loader.mounted = n;
  }, [n]);
  useEffect(() => {
    let id = 0;
    const go = () => {
      preloadRest();
      id = window.setInterval(() => {
        if (loader.mounted >= loader.stage) setStage(loader.stage + 1);
        if (loader.stage >= STAGES) window.clearInterval(id);
      }, STAGE_MS);
    };
    if (loader.stage >= STAGES) return;
    if (isFirst()) go();
    const off = onFirst(go);
    return () => {
      off();
      window.clearInterval(id);
    };
    // started once, the interval reads the numbers from the loader and not from this render
  }, []);
  return n;
}

// Mounted after the Environment in the world. The environment suspends everything beside it until its map is in, so this component's effect
// running is the proof that the first of the first set is in.
export function EnvReady() {
  useEffect(() => {
    loader.env = true;
  }, []);
  return null;
}

// ---- the X50 ------------------------------------------------------------------------------------------------------------------------

/** Where the X50 stands in the hero, metres along the road. */
export const HERO_X = routeAt(truckS(0)).x;
/** The hero's carried pallet stands this far ahead of the truck's origin, metres. */
const AHEAD = 1.15;
/** The hero's fork lift at rest and the lowest the pallet's base goes while the forks carry it, the model's own 6.5 cm between fork blade and floor. */
const REST = 0.12;
const BLADE = 0.065;
/** Utovar, the load is taped and swapped for the hero's carton, the forks go up, and the lift they go to. */
const U_SWAP = 0.3;
const U_LIFT = [0.3, 0.8] as const;
const LIFTED = 0.5;
/** Kutija, the truck drives in over A, the forks go under and lift over B, and it drives on to its hero place over C. The pallet stands DRIVE_ON ahead of the place. */
const K_ARRIVE = [0, 1.4] as const;
const K_LIFT = [1.3, 1.75] as const;
const K_DRIVE = [1.75, 2.7] as const;
const APPROACH = 16;
const DRIVE_ON = 3.2;
const STAND_X = HERO_X + AHEAD - DRIVE_ON;

export type HeroIo = { back: number; lift: number };

/** What the loader wants of the hero truck before it is placed, how far back along the road it stands and how high its forks are. Returns false when the hero is the hero. */
export function heroPre(io: HeroIo) {
  if (!loader.live) return false;
  const f = loader.full;
  const go = loader.go;
  if (loader.version === 1) {
    io.back = 0;
    io.lift = REST + (LIFTED - REST) * ease(range(f, U_LIFT[0], U_LIFT[1])) * (1 - go);
    return true;
  }
  if (loader.version === 2) {
    io.back = 0;
    io.lift = REST;
    return true;
  }
  const a = 1 - range(f, K_ARRIVE[0], K_ARRIVE[1]);
  io.back = APPROACH * a * a * a + DRIVE_ON * (1 - ease(range(f, K_DRIVE[0], K_DRIVE[1])));
  const up = ease(range(f, K_LIFT[0], K_LIFT[1]));
  io.lift = f < K_LIFT[1] ? LIFTED * up : LIFTED + (REST - LIFTED) * ease(range(f, K_DRIVE[0], K_DRIVE[1]));
  return true;
}

let dirty = false;

/** After the truck is placed, which of its own carton and pallet shows, where the pallet's base is, and where the camera should look. */
export function heroPost(api: TruckApi | null, marks: THREE.Group | null, cartonMarks: THREE.Group | null, truckX: number, lift: number) {
  if (!api || !api.load) return;
  if (!loader.live) {
    if (dirty) {
      dirty = false;
      api.load.visible = true;
      if (api.carton) api.carton.visible = true;
      if (cartonMarks) cartonMarks.visible = true;
    }
    return;
  }
  dirty = true;
  const f = loader.full;
  carried.x = truckX + AHEAD;
  carried.lift = lift;
  if (loader.version === 1) {
    // the hero's carton waits until the eight cartons are taped, then takes their place
    const swapped = f >= U_SWAP;
    if (api.carton) api.carton.visible = swapped;
    if (cartonMarks) cartonMarks.visible = swapped;
  } else if (loader.version === 3) {
    // the truck's own pallet and carton wait until the forks are under the standing one, which then goes. Until the forks have lifted the pallet
    // by the blade's clearance its base is on the road, and it takes the hero's height as the truck drives on
    const picked = f >= K_LIFT[0];
    api.load.visible = picked;
    if (cartonMarks) cartonMarks.visible = picked;
    const base = Math.max(0, lift) + BLADE * ease(range(f, K_DRIVE[0], K_DRIVE[1]));
    const local = base - 0.425;
    api.load.position.y = local;
    if (marks) marks.position.y = local;
    if (!picked) {
      carried.x = STAND_X;
      carried.lift = REST;
    }
  }
}

/** The hero's own pallet is carried by the truck in V1 and V3, V3 also has its own standing one, until the truck takes it. */
export const standsAt = () => loader.version === 3 && loader.full < K_LIFT[0];

// ---- Utovar -------------------------------------------------------------------------------------------------------------------------

// Eight cartons, half the hero carton's size each way, two layers of a two by two. Each is [side along the carton's x, layer, side along its z],
// the cartons the camera sees are the ones at z -1, since the hero truck's frame is turned half way round. They land one at a time, the
// bottom layer first, back row before front, so the wordmark's two halves are the last two.
const CARTON: [number, number, number] = [0.54, 0.39, 0.43];
const ORDER: [number, number, number][] = [[-1, 0, 1], [1, 0, 1], [-1, 0, -1], [1, 0, -1], [-1, 1, 1], [1, 1, 1], [-1, 1, -1], [1, 1, -1]];
/** The share of the loading at which carton i lands. The last is in before the loading is done, so the stack is whole when the forks start. */
const threshold = (i: number) => 0.06 + i * 0.105;
/** How high above its place a carton starts, metres, how long it falls, and how long it settles after. */
const DROP = 1.6;
const FALL_S = 0.5;
const SETTLE_S = 0.35;

// One half of the wordmark's plane, the u range of the texture it shows, so two cartons side by side print the file across them.
function halfPlane(u0: number, u1: number) {
  const g = new THREE.PlaneGeometry(MARK_W / 2, MARK_H);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  return g;
}

function Cartons({ tex }: { tex: THREE.Texture | null }) {
  const stack = useRef<THREE.Group>(null);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const tape = useRef<THREE.Mesh>(null);
  const landed = useRef<number[]>(ORDER.map(() => -1));
  const halves = useMemo(() => [halfPlane(0, 0.5), halfPlane(0.5, 1)], []);
  const print = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  useEffect(() => {
    print.map = tex;
    print.needsUpdate = true;
  }, [tex, print]);
  useFrame(() => {
    if (stack.current) stack.current.visible = loader.live && loader.full < U_SWAP;
    ORDER.forEach(([, ly], i) => {
      const g = refs.current[i];
      if (!g) return;
      if (landed.current[i] < 0 && loader.p >= threshold(i)) landed.current[i] = loader.t;
      const t0 = landed.current[i];
      g.visible = t0 >= 0;
      if (t0 < 0) return;
      const q = loader.t - t0;
      const e = Math.min(1, q / FALL_S);
      // a fall under gravity, then one small bounce that dies out
      let y = DROP * (1 - e * e);
      if (q > FALL_S) {
        const b = Math.min(1, (q - FALL_S) / SETTLE_S);
        y = 0.035 * Math.sin(PI * b) * (1 - b);
      }
      g.position.y = 0.14 + CARTON[1] / 2 + ly * CARTON[1] + y;
    });
    // taped once the last has settled
    if (tape.current) tape.current.visible = landed.current[7] >= 0 && loader.t - landed.current[7] > FALL_S + SETTLE_S;
  });
  return (
    <group ref={stack}>
      {ORDER.map(([sx, ly, sz], i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} position={[sx * 0.27, 0.14 + CARTON[1] / 2 + ly * CARTON[1] + DROP, sz * 0.215]} visible={false}>
          <RoundedBox args={[CARTON[0] - 0.006, CARTON[1] - 0.006, CARTON[2] - 0.006]} radius={0.012} smoothness={2} material={M.card} castShadow receiveShadow />
          {/* the top layer prints the wordmark, the bottom one carries labelled plates like the racks' loads */}
          {ly === 1 ? (
            <mesh geometry={halves[sx * sz < 0 ? 0 : 1]} material={print} position={[-sx * 0.095, 0.075, sz * 0.2195]} rotation={[0, sz < 0 ? PI : 0, 0]} />
          ) : (
            <mesh material={labelMat(2 + ((i + (sx > 0 ? 1 : 0)) % 4))} position={[0, 0.02, sz * 0.2175]} rotation={[0, sz < 0 ? PI : 0, 0]}>
              <planeGeometry args={[0.3, 0.1]} />
            </mesh>
          )}
        </group>
      ))}
      {/* the same tape the hero's carton has, put on when the stack is whole */}
      <mesh ref={tape} position={[0, 0.14 + 0.39, 0]} material={M.tape} visible={false}>
        <boxGeometry args={[1.1, 0.79, 0.1]} />
      </mesh>
    </group>
  );
}

// ---- Kutija -------------------------------------------------------------------------------------------------------------------------

// The carton's own bin label, the white plate of the racks' loads printed live. The percent in the site's type (Daxline Pro with the Geist
// figures its digits face gives it), the barcode line under it filling from the left as the loading goes, ink for what is loaded and the pale
// grey of the plate's own bars for what is not. Painted when the whole percent changes, so a frame costs nothing.
const LABEL_W = 496;
const LABEL_H = 288;
let labelCanvas: HTMLCanvasElement | null = null;
let labelTex: THREE.CanvasTexture | null = null;
let labelMaterial: THREE.MeshBasicMaterial | null = null;
let painted = -1;
const bars = (() => {
  const r = rng(77);
  const out: [number, number][] = [];
  let x = 24;
  while (x < LABEL_W - 24 - 6) {
    const w = 3 + Math.floor(r() * 5);
    out.push([x, w]);
    x += w + 2 + Math.floor(r() * 4);
  }
  return out;
})();

function binMaterial() {
  if (!labelMaterial) {
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = LABEL_W;
    labelCanvas.height = LABEL_H;
    labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    labelTex.anisotropy = 8;
    labelMaterial = new THREE.MeshBasicMaterial({ map: labelTex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  }
  return labelMaterial;
}

function paintBin(share: number) {
  const pct = Math.round(Math.min(1, Math.max(0, share)) * 100);
  if (pct === painted || !labelCanvas || !labelTex) return;
  painted = pct;
  const g = labelCanvas.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, LABEL_W, LABEL_H);
  g.strokeStyle = '#a1a1a1';
  g.lineWidth = 4;
  g.strokeRect(2, 2, LABEL_W - 4, LABEL_H - 4);
  g.fillStyle = '#222222';
  g.textBaseline = 'alphabetic';
  g.font = '500 30px "Daxline Pro", Arial, sans-serif';
  g.fillText('EKOTEHNIKA', 24, 52);
  g.fillStyle = '#6b6b6b';
  g.font = '500 30px "Daxline Pro", Arial, sans-serif';
  g.textAlign = 'right';
  g.fillText('A 01 03', LABEL_W - 24, 52);
  g.textAlign = 'left';
  g.fillStyle = '#d2d2d2';
  g.fillRect(24, 68, LABEL_W - 48, 3);
  g.fillStyle = '#222222';
  g.font = '500 132px "Daxline Pro", Arial, sans-serif';
  g.fillText(String(pct), 24, 188);
  const w = g.measureText(String(pct)).width;
  g.fillStyle = '#6b6b6b';
  g.font = '500 60px "Daxline Pro", Arial, sans-serif';
  g.fillText('%', 24 + w + 8, 188);
  const edge = 24 + (LABEL_W - 48) * (pct / 100);
  for (const [x, bw] of bars) {
    g.fillStyle = x + bw <= edge ? '#222222' : '#d2d2d2';
    g.fillRect(x, 208, bw, 58);
  }
  labelTex.needsUpdate = true;
}

/** The label on the carton's camera side, in the pallet's own frame. */
function BinLabel() {
  const mat = useMemo(binMaterial, []);
  return (
    <mesh material={mat} position={[0, 0.395, -0.4345]} rotation={[0, PI, 0]}>
      <planeGeometry args={[0.62, (0.62 * LABEL_H) / LABEL_W]} />
    </mesh>
  );
}

// The part of the loader that rides on the hero truck's own pallet, in the pallet's frame, see Hero in index.tsx.
export function LoaderCargo({ tex }: { tex: THREE.Texture | null }) {
  const label = useRef<THREE.Group>(null);
  useFrame(() => {
    // the label on the truck's own carton shows from the frame the forks are under the standing one, and goes when the camera is well on its way
    if (label.current) label.current.visible = loader.live && loader.version === 3 && loader.full >= K_LIFT[0] && loader.go < 0.6;
    if (loader.version === 3) paintBin(loader.p);
  });
  if (loader.version === 1) return <Cartons tex={tex} />;
  if (loader.version === 3)
    return (
      <group ref={label}>
        <BinLabel />
      </group>
    );
  return null;
}

// Kutija's standing pallet, the hero's pallet and carton on the road where the X50 will pick it up, turned by the mouse. It is the one the
// camera is on until the forks are under it, and it goes the frame the truck's own pallet takes over, at the same place and the same height.
function PalletStand() {
  const tex = useWordmark();
  const g = useRef<THREE.Group>(null);
  const blob = useMemo(() => blobMaterial(0.34), []);
  useFrame(() => {
    if (!g.current) return;
    g.current.visible = standsAt();
    g.current.rotation.y = PI + loader.mx * 0.4;
    carried.x = STAND_X;
    carried.lift = REST;
    paintBin(loader.p);
  });
  return (
    <group ref={g} position={[STAND_X, 0, 0]} rotation={[0, PI, 0]}>
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.03, 0]} material={blob} renderOrder={1}>
        <planeGeometry args={[2.2, 1.8]} />
      </mesh>
      <Pallet />
      {tex && (
        <>
          <mesh position={[0, 0.8, 0.4345]}>
            <planeGeometry args={[MARK_W, MARK_H]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          <mesh position={[0, 0.8, -0.4345]} rotation={[0, PI, 0]}>
            <planeGeometry args={[MARK_W, MARK_H]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        </>
      )}
      <BinLabel />
    </group>
  );
}

// ---- Regal --------------------------------------------------------------------------------------------------------------------------

// One bay of racks, two pallets wide, built from the hall's own parts, its beams, uprights, label plates and loaded pallets. The beams stand
// 0.75 m apart so each of the four is a quarter of the lift, and every slot but the last holds a labelled load. The reach truck's pallet rises
// from the floor to the top beam as the loading goes, and is pushed into the last slot when it is done.
const BEAMS = [0.75, 1.5, 2.25, 3.0];
const LEVELS = [0, ...BEAMS];
const FRAMES = [-2.7, 0, 2.7];
const SLOTS = [-1.95, -0.75, 0.75, 1.95];
/** The slot the truck fills, the right hand one of the right bay, and the top level. */
const COLUMN = 1.95;
const LIFT_TOP = 3.0;
/** The truck stands this far in front of the rack's face (z 0.5) with its forks pointing at it, and how far it reaches and drives when the loading is done. */
const TRUCK_Z = 2.2;
const DRIVE_IN = 0.8;
const REACH = 0.55;
const R_PUSH = [0, 0.6] as const;

function Rack() {
  const d = useMemo(() => {
    const up: BoxItem[] = [];
    const plate: BoxItem[] = [];
    const brace: BoxItem[] = [];
    const web: BoxItem[] = [];
    const flange: BoxItem[] = [];
    const labels: [number, number, number, number, number][] = [];
    for (const x of FRAMES)
      for (const dz of [-0.5, 0.5]) {
        up.push([x, 2.0, dz, 0.1, 4.0, 0.1]);
        plate.push([x, 0.012, dz, 0.26, 0.024, 0.26]);
        for (const y of [0.4, 1.2, 2.0, 2.8, 3.6]) brace.push([x, y, 0, 0.035, 0.05, 1.0]);
      }
    for (const cx of [-1.35, 1.35])
      for (const ly of [...BEAMS, 3.75]) {
        for (const dz of [-0.5, 0.5]) {
          web.push([cx, ly, dz, 2.58, 0.14, 0.04]);
          flange.push([cx, ly + 0.085, dz + (dz > 0 ? -0.03 : 0.03), 2.58, 0.03, 0.1]);
        }
        if (ly < 3.75) labels.push([cx, ly - 0.0, 0.525, 0.38, 0.12]);
      }
    return { up, plate, brace, web, flange, labels };
  }, []);
  return (
    <group>
      <BoxSet items={d.up} mat={rackGrey} cast />
      <BoxSet items={d.plate} mat={beamFlange} receive={false} />
      <BoxSet items={d.brace} mat={rackGrey} />
      <BoxSet items={d.web} mat={beamWeb} cast />
      <BoxSet items={d.flange} mat={beamFlange} />
      <Plates items={d.labels} yaw={0} mat={labelMat(0)} />
    </group>
  );
}

function Loads() {
  const slots = useMemo(() => {
    const r = rng(41);
    const out: { x: number; y: number; h: number; c: number }[] = [];
    LEVELS.forEach((ly, li) => {
      for (const x of SLOTS) {
        // the last slot, top level of the truck's column, is the one the truck fills
        if (x === COLUMN && ly === LIFT_TOP) continue;
        out.push({ x, y: ly + (li === 0 ? 0 : 0.1), h: 0.3 + r() * 0.13, c: Math.floor(r() * 3) });
      }
    });
    return out;
  }, []);
  return (
    <>
      {slots.map((s, i) => (
        <group key={i} position={[s.x, s.y, 0]} rotation={[0, PI / 2, 0]}>
          <Load h={s.h} colour={s.c} />
        </group>
      ))}
    </>
  );
}

function Bay() {
  const api = useRef<TruckApi | null>(null);
  const truck = useRef<THREE.Group>(null);
  const carriage = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!truck.current) return;
    const f = loader.full;
    const push = ease(range(f, R_PUSH[0], R_PUSH[1]));
    // the truck drives to the rack and the carriage reaches the last of the way, forks and pallet in the truck's own frame, forks along -x
    const drive = DRIVE_IN * push;
    truck.current.position.z = TRUCK_Z - drive;
    api.current?.set(0, drive);
    // the pallet's base rises with the loading, the carriage under it
    const lift = LIFT_TOP * Math.min(1, loader.p);
    if (carriage.current) carriage.current.position.set(-REACH * push, lift + 0.1, 0);
  });
  return (
    <group position={[BAY.x, 0, BAY.z]}>
      {/* the bay stands on the story's own ground, with no slab of its own, so no edge of one is in the hero's frame when the camera lands */}
      <Rack />
      <Loads />
      <group ref={truck} position={[COLUMN, 0, TRUCK_Z]} rotation={[0, PI / 2, 0]}>
        <Truck name="r16" apiRef={api}>
          {/* the carriage that lifts, two forks and a backrest on the mast's front, then the pallet with a labelled load, in the truck's own frame */}
          <group ref={carriage}>
            {[-0.3, 0.3].map((z) => (
              <mesh key={z} position={[-0.7, -0.03, z]} material={rackGrey} castShadow>
                <boxGeometry args={[1.1, 0.05, 0.12]} />
              </mesh>
            ))}
            <mesh position={[-0.14, 0.25, 0]} material={rackGrey} castShadow>
              <boxGeometry args={[0.05, 0.5, 0.8]} />
            </mesh>
            <group position={[-0.7, -0.005, 0]}>
              <Load h={0.42} colour={1} />
            </group>
          </group>
        </Truck>
      </group>
    </group>
  );
}

// ---- the stage ----------------------------------------------------------------------------------------------------------------------

/** Mounted in the world while a preloader plays, the parts of the version that are not on the hero truck. */
export default function LoaderStage() {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    if (root.current) root.current.visible = loader.live;
  });
  if (!loader.version) return null;
  return (
    <group ref={root}>
      {loader.version === 2 && <Bay />}
      {loader.version === 3 && <PalletStand />}
    </group>
  );
}
