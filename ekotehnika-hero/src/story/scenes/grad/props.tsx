// The set pieces of the Grad story, racks that grow, the dock, the pile of pallets, the renewal line,
// the pit stop rig, the seal, the warning and the labels. Each reads the story time itself, so none
// needs to be told what to draw.
import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StoryClock } from '../../clock';
import { C } from '../../../tokens';
import { M } from '../../../r3f/materials';
import { W, slatTexture } from '../../../variants/v4/look';
import { rng } from './util';
import { DOCK, LINE, PILE, PIT_H, STOP, pileItem, pitLift, pitRig, rackGrowth, renewProgress, uOf } from './plan';
import { clamp01, lerp, seg, smooth } from './math';

const unit = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();

type InstProps = { count: number; mat: THREE.Material; geo?: THREE.BufferGeometry; cast?: boolean; receive?: boolean; meshRef: MutableRefObject<THREE.InstancedMesh | null> };
function Inst({ count, mat, geo = unit, cast = true, receive = true, meshRef }: InstProps) {
  return <instancedMesh ref={meshRef} args={[geo, mat, count]} castShadow={cast} receiveShadow={receive} frustumCulled={false} />;
}

function put(m: THREE.InstancedMesh | null, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) {
  if (!m) return;
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, ry, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  m.setMatrixAt(i, dummy.matrix);
}
const done = (m: THREE.InstancedMesh | null) => {
  if (m) m.instanceMatrix.needsUpdate = true;
};

/* ----------------------------------------------------------------- racks of the hall */

const XS = -7.5;
const BW = 2.8;
const BAYS = 8;
const ZC = [-33.2, -26.8, -20.4];
const SIDES = [-0.6, 0.6];
const LV = [0.12, 1.6, 3.08, 4.56, 6.04];
const H0 = 4.4;
const H1 = 7.3;

type Slot = { x: number; z: number; l: number; h: number; tape: boolean };

function buildRacks() {
  const r = rng(11);
  const rows: number[] = [];
  for (const zc of ZC) for (const s of SIDES) rows.push(zc + s);
  const ups: [number, number][] = [];
  const beams: { x: number; z: number; i: number }[] = [];
  const slots: Slot[] = [];
  for (const z of rows) {
    for (let b = 0; b <= BAYS; b++) for (const dz of [-0.5, 0.5]) ups.push([XS + b * BW, z + dz]);
    for (const dz of [-0.5, 0.5]) for (let i = 0; i < 5; i++) beams.push({ x: XS + (BAYS * BW) / 2, z: z + dz, i });
    for (let b = 0; b < BAYS; b++)
      for (let l = 0; l < 5; l++)
        for (const o of [-0.68, 0.68]) {
          if (r() < 0.12) continue;
          slots.push({ x: XS + b * BW + BW / 2 + o, z, l, h: 0.7 + r() * 0.45, tape: r() < 0.35 });
        }
  }
  return { ups, beams, slots };
}

export function Racks({ clock }: { clock: StoryClock }) {
  const d = useMemo(buildRacks, []);
  const up = useRef<THREE.InstancedMesh | null>(null);
  const beam = useRef<THREE.InstancedMesh | null>(null);
  const pal = useRef<THREE.InstancedMesh | null>(null);
  const car = useRef<THREE.InstancedMesh | null>(null);
  const tape = useRef<THREE.InstancedMesh | null>(null);
  const last = useRef(-1);
  const tapes = useMemo(() => d.slots.filter((s) => s.tape), [d]);

  useFrame(() => {
    const g = rackGrowth(uOf(clock));
    if (Math.abs(g - last.current) < 1e-4) return;
    last.current = g;
    const Hh = lerp(H0, H1, g);
    d.ups.forEach(([x, z], i) => put(up.current, i, x, Hh / 2, z, 0.1, Hh, 0.1));
    done(up.current);
    const e3 = smooth((g - 0.08) / 0.45);
    const e4 = smooth((g - 0.5) / 0.45);
    d.beams.forEach((b, i) => {
      const y = b.i === 0 ? 1.52 : b.i === 1 ? 3.0 : b.i === 2 ? lerp(3.0, 4.48, e3) : b.i === 3 ? lerp(3.0, 5.96, e4) : Hh - 0.18;
      put(beam.current, i, b.x, y, b.z, BAYS * BW, 0.14, 0.07);
    });
    done(beam.current);
    // the two upper levels come in as the racks rise, each pallet growing out of its beam
    const grow = (l: number) => (l < 3 ? 1 : l === 3 ? e3 : e4);
    const lvY = (l: number) => (l < 3 ? LV[l] : l === 3 ? lerp(LV[2], LV[3], e3) : lerp(LV[2], LV[4], e4));
    d.slots.forEach((s, i) => {
      const k = Math.max(grow(s.l), 0.001);
      const y = lvY(s.l);
      put(pal.current, i, s.x, y + 0.07 * k, s.z, 1.2 * k, 0.14 * k, 0.95 * k);
      put(car.current, i, s.x, y + 0.14 * k + (s.h * k) / 2, s.z, 1.03 * k, s.h * k, 0.86 * k);
    });
    tapes.forEach((s, i) => {
      const k = Math.max(grow(s.l), 0.001);
      const y = lvY(s.l);
      put(tape.current, i, s.x, y + 0.14 * k + (s.h * k) / 2, s.z, 1.1 * k, s.h * k + 0.01, 0.1 * k);
    });
    done(pal.current);
    done(car.current);
    done(tape.current);
  });

  return (
    <group>
      <Inst count={d.ups.length} mat={W.steel} meshRef={up} />
      <Inst count={d.beams.length} mat={W.ink} meshRef={beam} />
      <Inst count={d.slots.length} mat={W.pallet} meshRef={pal} />
      <Inst count={d.slots.length} mat={W.carton} meshRef={car} />
      <Inst count={tapes.length} mat={W.tape} meshRef={tape} cast={false} />
    </group>
  );
}

/* ----------------------------------------------------------------- the dock in front of the hall */

const doorMat = new THREE.MeshStandardMaterial({ map: slatTexture(), roughness: 0.6, metalness: 0.2 });
const WALL_H = 4.4;

export function Dock() {
  const { x0, x1, z0, z1, h } = DOCK;
  const cx = (x0 + x1) / 2;
  const doors = [-6.5, -1.5, 3.5, 8.5, 13.5];
  const wz = z0 + 0.2;
  const pz = (z0 + 0.4 + z1) / 2;
  return (
    <group>
      {/* the platform, a dark lip and bumpers on its edge */}
      <mesh geometry={unit} material={W.wall} position={[cx, h / 2, pz]} scale={[x1 - x0, h, z1 - z0 - 0.4]} castShadow receiveShadow />
      <mesh geometry={unit} material={W.roof} position={[cx, h + 0.02, pz]} scale={[x1 - x0 - 0.1, 0.04, z1 - z0 - 0.5]} receiveShadow />
      <mesh geometry={unit} material={W.ink} position={[cx, h - 0.04, z1 + 0.04]} scale={[x1 - x0, 0.12, 0.1]} />
      {doors.map((x) => (
        <mesh key={x} geometry={unit} material={W.ink} position={[x, 0.55, z1 + 0.1]} scale={[0.5, 0.5, 0.22]} castShadow />
      ))}
      {/* the dock wall with its roller doors, a grey band above like the depot */}
      <mesh geometry={unit} material={W.wall} position={[cx, WALL_H / 2, wz]} scale={[x1 - x0, WALL_H, 0.4]} castShadow receiveShadow />
      <mesh geometry={unit} material={W.clad} position={[cx, WALL_H - 0.5, wz + 0.24]} scale={[x1 - x0 + 0.2, 1.0, 0.12]} castShadow />
      {doors.map((x) => (
        <group key={x} position={[x, 0, wz + 0.2]}>
          <mesh geometry={unit} material={W.ink} position={[0, h + 1.5, 0.02]} scale={[3.5, 3.0, 0.16]} />
          <mesh material={doorMat} position={[0, h + 1.45, 0.12]} scale={[3.1, 2.7, 1]} receiveShadow>
            <planeGeometry args={[1, 1]} />
          </mesh>
          <mesh geometry={unit} material={W.lamp} position={[0, h + 3.2, 0.12]} scale={[0.5, 0.1, 0.12]} />
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- pallets, as a pile that arrives and clears */

type PileItem = { x: number; z: number; y: number; h: number };

export function Pile({ clock, items = PILE, state = pileItem, from }: { clock: StoryClock; items?: PileItem[]; state?: (u: number, i: number) => { vis: number; hop: number }; from?: [number, number, number] }) {
  const pal = useRef<THREE.InstancedMesh | null>(null);
  const car = useRef<THREE.InstancedMesh | null>(null);
  const tape = useRef<THREE.InstancedMesh | null>(null);
  const org = from ?? [0, DOCK.h + 0.3, DOCK.z1 + 0.5];
  useFrame(() => {
    const u = uOf(clock);
    items.forEach((it, i) => {
      const { vis, hop } = state(u, i);
      const s = Math.max(vis, 0.0001);
      let x = it.x;
      let z = it.z;
      let y = it.y;
      if (hop > 0) {
        // arriving, a hop from the dock edge down to the slot
        const t = 1 - hop;
        x = lerp(it.x, it.x, t);
        z = lerp(org[2], it.z, easeHop(t));
        y = lerp(org[1], it.y, easeHop(t)) + Math.sin(t * Math.PI) * 0.9;
      } else if (hop < 0) {
        y = it.y - hop * 1.4;
      }
      put(pal.current, i, x, y + 0.07 * s, z, 1.2 * s, 0.14 * s, 1.0 * s);
      put(car.current, i, x, y + 0.14 * s + (it.h * s) / 2, z, 1.05 * s, it.h * s, 0.86 * s);
      put(tape.current, i, x, y + 0.14 * s + (it.h * s) / 2, z, 1.07 * s, it.h * s + 0.01, 0.1 * s);
    });
    done(pal.current);
    done(car.current);
    done(tape.current);
  });
  return (
    <group>
      <Inst count={items.length} mat={W.pallet} meshRef={pal} />
      <Inst count={items.length} mat={W.carton} meshRef={car} />
      <Inst count={items.length} mat={W.tape} meshRef={tape} cast={false} />
    </group>
  );
}
const easeHop = (t: number) => 1 - Math.pow(1 - clamp01(t), 2);

/* ----------------------------------------------------------------- the renewal line */

const gantryGeo = new THREE.CylinderGeometry(1.5, 2.6, 4.3, 24, 1, true);
const discGeo = new THREE.CircleGeometry(2.6, 28);

export function RenewLine({ clock }: { clock: StoryClock }) {
  const { xs, z, x0, x1 } = LINE;
  const lights = useRef<(THREE.Mesh | null)[]>([]);
  const pools = useRef<(THREE.Mesh | null)[]>([]);
  const heads = useRef<(THREE.Mesh | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const chev = useMemo(() => {
    const it: number[] = [];
    for (let x = x0 + 1; x < x1; x += 2.2) it.push(x);
    return it;
  }, [x0, x1]);
  const chevs = useRef<THREE.InstancedMesh | null>(null);
  useLayoutEffect(() => {
    chev.forEach((x, i) => put(chevs.current, i, x, 0.085, z, 0.7, 0.012, 0.22));
    done(chevs.current);
  }, [chev, z]);
  const coneMat = useMemo(() => new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), []);
  const poolMat = useMemo(() => new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }), []);
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 1.2 }), []);

  useFrame(() => {
    const u = uOf(clock);
    const g = group.current;
    // the line stands up after P1 starts and is put away once P3 is done
    const on = smooth(seg(u, 3.8, 4.1)) * (1 - smooth(seg(u, 7.0, 7.3)));
    if (g) {
      g.scale.set(1, Math.max(on, 0.0001), 1);
      g.visible = on > 0.001;
    }
    const fx = u < 4 ? -999 : u < 5 ? -80 : u < 6 ? lerp(-80, -34.5, u - 5) : -34.5;
    xs.forEach((x, i) => {
      const near = clamp01(1 - Math.abs(fx - x) / 4);
      const p = renewProgress(u);
      const doneI = p * 7 > i + 0.5 ? 0.12 : 0;
      const mat = lights.current[i];
      if (mat) (mat.material as THREE.MeshBasicMaterial).opacity = 0.1 + near * 0.3 + doneI * 0.3;
      const pool = pools.current[i];
      if (pool) (pool.material as THREE.MeshBasicMaterial).opacity = 0.25 + near * 0.6;
      const head = heads.current[i];
      if (head) (head.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + near * 3;
    });
  });

  return (
    <group ref={group}>
      {/* the belt the truck rides, ink with light chevrons */}
      <mesh geometry={unit} material={M.black} position={[(x0 + x1) / 2, 0.04, z]} scale={[x1 - x0, 0.08, 3.1]} castShadow receiveShadow />
      <mesh geometry={unit} material={M.steel} position={[(x0 + x1) / 2, 0.085, z + 1.56]} scale={[x1 - x0, 0.03, 0.08]} />
      <mesh geometry={unit} material={M.steel} position={[(x0 + x1) / 2, 0.085, z - 1.56]} scale={[x1 - x0, 0.03, 0.08]} />
      <Inst count={chev.length} mat={M.steelLight} meshRef={chevs} cast={false} receive={false} />
      {xs.map((x, i) => (
        <group key={x} position={[x, 0, z]}>
          {/* gantry, two posts and a beam with its lamp head */}
          {[2.1, -2.1].map((dz) => (
            <mesh key={dz} geometry={unit} material={W.ink} position={[0, 2.2, dz]} scale={[0.22, 4.4, 0.22]} castShadow />
          ))}
          <mesh geometry={unit} material={W.clad} position={[0, 4.5, 0]} scale={[0.5, 0.36, 4.7]} castShadow />
          <mesh geometry={unit} material={W.ink} position={[0, 4.28, 0]} scale={[0.9, 0.12, 1.2]} castShadow />
          <mesh
            ref={(m) => {
              heads.current[i] = m;
            }}
            geometry={unit}
            material={lampMat.clone()}
            position={[0, 4.16, 0]}
            scale={[0.6, 0.06, 0.8]}
          />
          <mesh
            ref={(m) => {
              lights.current[i] = m;
            }}
            geometry={gantryGeo}
            material={coneMat.clone()}
            position={[0, 2.12, 0]}
            renderOrder={3}
          />
          <mesh
            ref={(m) => {
              pools.current[i] = m;
            }}
            geometry={discGeo}
            material={poolMat.clone()}
            position={[0, 0.095, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={2}
          />
        </group>
      ))}
      {/* two long rails tie the gantries into one hall */}
      {[2.1, -2.1].map((dz) => (
        <mesh key={dz} geometry={unit} material={W.clad} position={[(xs[0] + xs[6]) / 2, 4.62, z + dz]} scale={[xs[6] - xs[0], 0.12, 0.14]} castShadow />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- the pit stop rig */

const checkShape = (() => {
  const t = new THREE.Shape();
  t.moveTo(-0.2, 0.02);
  t.lineTo(-0.06, -0.14);
  t.lineTo(0.22, 0.18);
  t.lineTo(0.16, 0.24);
  t.lineTo(-0.06, -0.02);
  t.lineTo(-0.14, 0.08);
  return new THREE.ExtrudeGeometry(t, { depth: 0.04, bevelEnabled: false });
})();
const ringGeo = new THREE.RingGeometry(0.44, 0.5, 40);
const faceGeo = new THREE.CircleGeometry(0.44, 40);

// A round check, white with a grey ring while open, ink with a white tick once done
export function CheckDisc({ get, scale = 1 }: { get: () => number; scale?: number }) {
  const ink = useRef<THREE.Mesh>(null);
  const tick = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    // eases toward done, a small pop as it lands
    const g = body.current;
    if (!g) return;
    const cur = (g.userData.v ?? 0) as number;
    const nv = cur + (get() - cur) * Math.min(1, dt * 10 + 0.02);
    g.userData.v = nv;
    if (ink.current) (ink.current.material as THREE.MeshBasicMaterial).opacity = nv;
    if (tick.current) tick.current.scale.setScalar(Math.max(0.001, nv) * 1.4);
    g.scale.setScalar(scale * (1 + Math.sin(nv * Math.PI) * 0.22));
  });
  return (
    <Billboard>
      <group ref={body}>
        <mesh geometry={faceGeo} renderOrder={20}>
          <meshBasicMaterial color={C.white} transparent opacity={0.96} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh geometry={ringGeo} renderOrder={21}>
          <meshBasicMaterial color={C.tonedTextGrey} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh ref={ink} geometry={faceGeo} renderOrder={22}>
          <meshBasicMaterial color={C.ink} transparent opacity={0} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh ref={tick} geometry={checkGeo} position={[0, -0.02, 0]} renderOrder={23}>
          <meshBasicMaterial color={C.white} depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  );
}
const checkGeo = checkShape;

export function PitRig({ clock }: { clock: StoryClock }) {
  const group = useRef<THREE.Group>(null);
  const deck = useRef<THREE.Group>(null);
  const arms = useRef<THREE.Group>(null);
  const discs = [-2.9, -1.6, 0, 1.6, 2.9];
  const ys = [3.1, 4.2, 4.7, 4.2, 3.1];
  const refs = useRef<number[]>([0, 0, 0, 0, 0]);
  const discGroups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const u = uOf(clock);
    const rig = pitRig(u);
    const g = group.current;
    if (g) {
      g.visible = rig > 0.001;
      g.scale.set(1, Math.max(rig, 0.0001), 1);
    }
    const lift = pitLift(u);
    if (deck.current) deck.current.position.y = 0.3 + lift;
    if (arms.current) arms.current.scale.y = Math.max(lift, 0.02) / PIT_H;
    // ticks, five of them, as the check moves on
    const k = seg(u, 12, 13);
    const n = Math.round(Math.min(1, k * 1.5) * 5);
    for (let i = 0; i < 5; i++) refs.current[i] = i < n ? 1 : 0;
    discGroups.current.forEach((dg) => {
      if (dg) dg.visible = rig > 0.5 && k < 0.98;
    });
  });
  return (
    <group ref={group} position={[STOP.x, 0.22, STOP.z]}>
      <mesh geometry={unit} material={W.ink} position={[0, 0.12, 0]} scale={[5.4, 0.24, 2.7]} castShadow receiveShadow />
      <group ref={arms} position={[0, 0.24, 0]}>
        {[0.9, -0.9].map((dz) => (
          <group key={dz}>
            <mesh geometry={unit} material={W.steel} position={[0, PIT_H / 2, dz]} rotation={[0, 0, 0.55]} scale={[0.14, PIT_H * 1.7, 0.14]} castShadow />
            <mesh geometry={unit} material={W.steel} position={[0, PIT_H / 2, dz]} rotation={[0, 0, -0.55]} scale={[0.14, PIT_H * 1.7, 0.14]} castShadow />
          </group>
        ))}
      </group>
      <group ref={deck} position={[0, 0.3, 0]}>
        <mesh geometry={unit} material={W.clad} position={[0, 0, 0]} scale={[5.0, 0.16, 2.4]} castShadow receiveShadow />
        <mesh geometry={unit} material={M.steelLight} position={[0, 0.09, 1.16]} scale={[5.0, 0.03, 0.05]} />
        <mesh geometry={unit} material={M.steelLight} position={[0, 0.09, -1.16]} scale={[5.0, 0.03, 0.05]} />
      </group>
      {/* four light posts at the corners */}
      {[
        [-2.8, 1.5],
        [2.8, 1.5],
        [-2.8, -1.5],
        [2.8, -1.5],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh geometry={unit} material={W.ink} position={[0, 1.7, 0]} scale={[0.14, 3.4, 0.14]} castShadow />
          <mesh geometry={unit} material={W.lamp} position={[0, 3.45, 0]} scale={[0.34, 0.14, 0.34]} />
        </group>
      ))}
      {discs.map((dx, i) => (
        <group
          key={dx}
          position={[dx, ys[i] + 0.4, 0.6]}
          ref={(g) => {
            discGroups.current[i] = g;
          }}
        >
          <CheckDisc get={() => refs.current[i]} />
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- the seal, the warning, labels */

const sealShape = (() => {
  const s = new THREE.Shape();
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.5 * (1 + 0.07 * Math.cos(a * 14));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
})();
const sealGeo = new THREE.ExtrudeGeometry(sealShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.02, bevelSegments: 1 });
sealGeo.translate(0, 0, -0.05);
const tailShape = (() => {
  const t = new THREE.Shape();
  t.moveTo(0, 0);
  t.lineTo(0.34, 0);
  t.lineTo(0.34, -0.7);
  t.lineTo(0.17, -0.56);
  t.lineTo(0, -0.7);
  return t;
})();
const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.04, bevelEnabled: false });

// An Approved rosette, ink with a white tick and two grey tails, facing the camera
export function Seal({ gref }: { gref: MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={gref}>
      <Billboard>
        <group scale={1.9}>
          <mesh geometry={tailGeo} material={M.steel} position={[-0.36, -0.34, -0.06]} rotation={[0, 0, 0.18]} renderOrder={4} />
          <mesh geometry={tailGeo} material={M.steelLight} position={[0.02, -0.34, -0.06]} rotation={[0, 0, -0.18]} renderOrder={4} />
          <mesh geometry={sealGeo} material={M.black} castShadow renderOrder={5} />
          <mesh geometry={ringGeo} position={[0, 0, 0.075]} scale={1.0} material={M.stripe} renderOrder={6} />
          <mesh geometry={checkGeo} position={[0, -0.04, 0.06]} scale={1.5} material={M.white} renderOrder={7} />
        </group>
      </Billboard>
    </group>
  );
}

const warnShape = (() => {
  const s = new THREE.Shape();
  const r = 0.09;
  const a: [number, number] = [0, 0.82];
  const b: [number, number] = [-0.86, -0.64];
  const c: [number, number] = [0.86, -0.64];
  s.moveTo(a[0], a[1] - r * 1.4);
  s.quadraticCurveTo(a[0], a[1], a[0] - 0.1, a[1] - 0.12);
  s.lineTo(b[0] + 0.1, b[1] + 0.2);
  s.quadraticCurveTo(b[0], b[1], b[0] + 0.14, b[1]);
  s.lineTo(c[0] - 0.14, c[1]);
  s.quadraticCurveTo(c[0], c[1], c[0] - 0.1, c[1] + 0.2);
  s.lineTo(a[0] + 0.1, a[1] - 0.12);
  s.quadraticCurveTo(a[0], a[1], a[0], a[1] - r * 1.4);
  return s;
})();
const warnGeo = new THREE.ExtrudeGeometry(warnShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 2 });
warnGeo.translate(0, 0, -0.05);
const dotGeo = new THREE.CircleGeometry(0.075, 20);

// The warning triangle that hangs over the stopped truck, with a pulsing ring on the floor
export function Warn({ gref, ring }: { gref: MutableRefObject<THREE.Group | null>; ring: MutableRefObject<THREE.Mesh | null> }) {
  return (
    <>
      <group ref={gref}>
        <Billboard>
          <group scale={1.15}>
            <mesh geometry={warnGeo} material={M.black} castShadow renderOrder={5} />
            <mesh position={[0, 0.1, 0.09]} renderOrder={6} material={M.white}>
              <boxGeometry args={[0.11, 0.5, 0.02]} />
            </mesh>
            <mesh geometry={dotGeo} position={[0, -0.34, 0.09]} material={M.white} renderOrder={6} />
          </group>
        </Billboard>
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} renderOrder={3} visible={false}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial color={C.ink} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

const pillStyle: React.CSSProperties = {
  fontFamily: 'Geist, system-ui, sans-serif',
  fontSize: 15,
  fontWeight: 500,
  lineHeight: '20px',
  letterSpacing: 0,
  color: C.ink,
  background: C.white,
  borderRadius: 999,
  padding: '6px 14px',
  whiteSpace: 'nowrap',
  boxShadow: '0 0 0 1px rgba(34,34,34,0.14), 0 8px 22px rgba(34,34,34,0.14)',
  pointerEvents: 'none',
  userSelect: 'none',
  willChange: 'opacity, transform',
};
const discStyle: React.CSSProperties = { ...pillStyle, width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 600, lineHeight: '32px' };

export type LabelState = { vis: number; on: number };

// A DOM label pinned to a point in the scene. state reads the story time and returns how visible
// it is and whether it is the active one. kind pill is a name tag, disc a numbered round marker.
export function Label({ position, text, kind = 'pill', state, clock, lift = 0, leader = 0, children }: {
  position: [number, number, number];
  text?: ReactNode;
  kind?: 'pill' | 'disc';
  state: (u: number) => LabelState;
  clock: StoryClock;
  lift?: number;
  leader?: number;
  children?: ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const last = useRef('');
  useFrame(() => {
    const e = el.current;
    if (!e) return;
    const { vis, on } = state(uOf(clock));
    const key = `${vis.toFixed(3)}${on.toFixed(2)}`;
    if (key === last.current) return;
    last.current = key;
    e.style.opacity = String(clamp01(vis));
    e.style.transform = `translateY(${(1 - clamp01(vis)) * 8}px) scale(${0.9 + 0.1 * clamp01(vis)})`;
    e.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
    e.style.background = on > 0.5 ? C.ink : C.white;
    e.style.color = on > 0.5 ? C.white : C.ink;
  });
  return (
    <group position={position}>
      <Html center zIndexRange={[20, 0]} position={[0, lift, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'relative' }}>
          <div ref={el} style={kind === 'disc' ? discStyle : pillStyle}>
            {text}
            {children}
          </div>
          {leader > 0 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '100%',
                height: leader,
                width: 0,
                borderLeft: `2px dotted ${C.tonedTextGrey}`,
                transform: 'translateX(-1px)',
              }}
            />
          )}
        </div>
      </Html>
    </group>
  );
}
