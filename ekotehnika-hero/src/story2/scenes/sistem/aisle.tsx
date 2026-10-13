// The automation aisle, T and AT. A real hall seen from about 4 m, a drive aisle with a charger at one end and a pick station
// at the other, shelf units stored in bays on the right, fixed pallet racks behind them, and C-Matic 10 robots at true scale.
// One order runs across the AT hold, see atplan.ts. In T the najam depot floor leads into this aisle, the walls, racks and units
// rise from the same floor and the lane lines draw on down it. Nothing fades. The only system graphic is a 1px path line drawn
// just ahead of the active robot and gone behind it, and a calm outline on the target bay, both in the info blue.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SceneProps } from '../../clock';
import { ATP } from './route';
import { Truck } from './models';
import { BoxSet, type BoxItem } from './props';
import { labelTexture } from './warehouse';
import { G, K, ease, lam, lit, range, rng, uOf } from './kit';
import { ACTIVE, BAY_B, COLS, FLEET1, FLEET2, LANE_A, LIFT, MOVING, STATION, TARGET, poseOf, toWorld, yawOf, type KF, type UnitPlan } from './atplan';

const INFO = '#468cc4'; // LMH blue, 72 percent tint, the one info colour of the automation floor
const PI = Math.PI;
const UNIT = { s: 1.1, h: 2.0, clear: 0.3 };
const LEVELS = [0.36, 0.76, 1.16, 1.56, 1.96];
const CELLS: [number, number][] = [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]];
const PICK_LEVEL = 2;
const PICK_CELL = 3;
// the cart stands behind the person, clear of the camera's line to them, so the turn to it reads in profile
const CART = { a: 25.0, b: -0.62, top: 0.9 };
const PERSON = { a: 25.0, b: -0.05 };
// The pick, in k. Both hands reach the box on the lowered unit, pull it to the chest, the person turns round to the cart,
// sets the box down and lets go. The arms stay in front of the body the whole time, so no arm passes through the torso,
// and the half turn passes the camera side, so the body never stands between the camera and the arms.
const PICK = { reach: [0.89, 0.92], pull: [0.92, 0.945], turn: [0.945, 0.975], set: [0.975, 0.988], free: [0.988, 1.0] } as const;
const HOLD = new THREE.Vector3(0.36, 1.18, 0);
const SET = new THREE.Vector3(0.5, CART.top + 0.17, 0);
const BOX = { w: 0.46, h: 0.28, d: 0.4 };
const ARM = { up: 0.3, fore: 0.32, shoulder: new THREE.Vector3(0, 1.44, 0.2) };

// Punched upright faces, one slot every 5 cm down the middle of each face, drawn once on a canvas and repeated.
function slotTexture(rows: number) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 16, 32);
  g.fillStyle = '#4d4d4d';
  g.fillRect(6, 9, 4, 14);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, rows);
  t.anisotropy = 4;
  return t;
}
const postMat = lam(G.graphite, { map: slotTexture(35) });
const uprightMat = lam(G.graphite, { map: slotTexture(84) });
const frameMat = lam(G.graphite);
const shelfMat = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.3) });
const clipMat = lam(G.dark);
const cartonMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.35) }));
const tapeMat = lam(G.mid);
const lineMatPale = new THREE.MeshBasicMaterial({ color: G.pale, toneMapped: false });
const lineMatMid = new THREE.MeshBasicMaterial({ color: G.mid, toneMapped: false });
const wallMat = lam(G.pale, { emissive: new THREE.Color().setScalar(0.56) });
const wallBase = lam(G.light, { emissive: new THREE.Color().setScalar(0.46) });
const plinthMat = lam(G.mid);
// Bin and carton labels, the same white plates with a code and a barcode as the A racks, see labelTexture in warehouse.tsx.
const tagMats: THREE.Material[] = [];
const tagMat = (i: number) => (tagMats[i] ??= new THREE.MeshBasicMaterial({ map: labelTexture(['S 06 02', 'S 14 03', 'K 20 41', 'K 31 07', 'P 04 01', 'P 11 03'][i], 53 + i * 5), toneMapped: false }));

// Instanced flat plates. Each item is centre x, y, z, a width and height, and the yaw of the face, 0 faces +z.
type Tag = [number, number, number, number, number, number];
function Tags({ items, mat }: { items: Tag[]; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    items.forEach(([x, y, z, w, h, yaw], i) => ref.current!.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), new THREE.Vector3(w, h, 1))));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} count={items.length} material={mat} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

// A shelf unit, 1.1 m square and 2 m tall on four punched uprights with base plates, room under it for the robot, five
// shelves on clipped beams, cartons with a label on each outer face and a bin label on the beam under each cell.
function unitSets(seed: number, pick: boolean) {
  const r = rng(seed);
  const frame: BoxItem[] = [];
  const posts: BoxItem[] = [];
  const clips: BoxItem[] = [];
  const cartons: BoxItem[][] = [[], [], []];
  const tape: BoxItem[] = [];
  const bins: Tag[] = [];
  const tags: Tag[] = [];
  const e = UNIT.s / 2 - 0.035;
  const S = UNIT.s / 2;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      posts.push([sx * e, (UNIT.h + UNIT.clear - 0.04) / 2, sz * e, 0.05, UNIT.h - UNIT.clear + 0.04, 0.05]);
      frame.push([sx * e, UNIT.clear / 2, sz * e, 0.07, UNIT.clear, 0.07]);
      // the base plate under each leg and a beam clip where each shelf meets the upright
      clips.push([sx * e, 0.006, sz * e, 0.13, 0.012, 0.13]);
      LEVELS.forEach((y) => clips.push([sx * e, y + 0.03, sz * e, 0.075, 0.1, 0.075]));
    }
  // base frame under the first shelf, so the unit reads as one lifted piece
  frame.push([0, UNIT.clear - 0.02, 0, UNIT.s, 0.04, 0.06], [0, UNIT.clear - 0.02, 0, 0.06, 0.04, UNIT.s]);
  LEVELS.forEach((y, li) => {
    frame.push([0, y, 0, UNIT.s, 0.03, UNIT.s]);
    // a beam on all four sides, a web and a darker lip
    frame.push([0, y + 0.035, S - 0.01, UNIT.s, 0.04, 0.02], [0, y + 0.035, -S + 0.01, UNIT.s, 0.04, 0.02]);
    frame.push([S - 0.01, y + 0.035, 0, 0.02, 0.04, UNIT.s], [-S + 0.01, y + 0.035, 0, 0.02, 0.04, UNIT.s]);
    clips.push([0, y + 0.058, S - 0.006, UNIT.s - 0.08, 0.008, 0.022], [0, y + 0.058, -S + 0.006, UNIT.s - 0.08, 0.008, 0.022]);
    if (li === LEVELS.length - 1) return;
    // a bin label on the beam under each cell, on the two faces the cells open to
    for (const cx of [-0.26, 0.26]) {
      bins.push([cx, y + 0.035, S + 0.002, 0.15, 0.05, 0]);
      bins.push([cx, y + 0.035, -S - 0.002, 0.15, 0.05, PI]);
    }
    CELLS.forEach(([cx, cz], ci) => {
      if (pick && li === PICK_LEVEL && ci === PICK_CELL) return;
      if (r() < 0.14) return;
      const h = 0.2 + r() * 0.13;
      const w = 0.4 + r() * 0.08;
      const d = 0.4 + r() * 0.08;
      const yc = y + 0.015 + h / 2;
      cartons[Math.floor(r() * 3)].push([cx, yc, cz, w, h, d]);
      tape.push([cx, y + 0.015 + h + 0.003, cz, 0.07, 0.006, d + 0.01]);
      // a shipping label on the two outer faces of the carton
      const sz = Math.sign(cz);
      const sx = Math.sign(cx);
      tags.push([cx - sx * 0.08, yc + h * 0.12, cz + sz * (d / 2 + 0.002), 0.15, 0.05, sz > 0 ? 0 : PI]);
      tags.push([cx + sx * (w / 2 + 0.002), yc + h * 0.12, cz - sz * 0.08, 0.15, 0.05, sx > 0 ? PI / 2 : -PI / 2]);
    });
  });
  return { frame, posts, clips, cartons, tape, bins, tags };
}

function Unit({ seed, pick = false, groupRef }: { seed: number; pick?: boolean; groupRef: (g: THREE.Group | null) => void }) {
  const d = useMemo(() => unitSets(seed, pick), [seed, pick]);
  return (
    <group ref={groupRef}>
      <BoxSet items={d.posts} mat={postMat} cast />
      <BoxSet items={d.frame} mat={shelfMat} cast />
      <BoxSet items={d.clips} mat={clipMat} />
      {d.cartons.map((c, i) => (
        <BoxSet key={i} items={c} mat={cartonMats[i]} cast />
      ))}
      <BoxSet items={d.tape} mat={tapeMat} />
      <Tags items={d.bins} mat={tagMat(seed % 2)} />
      <Tags items={d.tags} mat={tagMat(2 + (seed % 2))} />
    </group>
  );
}

// The fixed pallet racks behind the storage block, two runs back to back, built like the A racks. Punched uprights on base
// plates with ladder bracing, beams with a web, a flange and a clip at each end, pallets with wrapped loads, and a label on
// each beam and each load on the aisle face.
const wrapShell = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.6), transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false });
const wrapBand = new THREE.MeshLambertMaterial({ color: lit(G.white), emissive: lit(G.white).multiplyScalar(0.7), transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false });
const beamWeb = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.4) });
const beamFlange = lam(G.dark);
const palletMat = lam(G.dark);
const loadMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.3) }));
const RACK = { bay: 2.7, h: 4.2, half: 0.45, beams: [1.5, 3.0, 4.2] };

function PalletRack({ x0, x1, z }: { x0: number; x1: number; z: number }) {
  const d = useMemo(() => {
    const r = rng(Math.round(x0 * 7 + z));
    const up: BoxItem[] = [];
    const plate: BoxItem[] = [];
    const brace: BoxItem[] = [];
    const web: BoxItem[] = [];
    const flange: BoxItem[] = [];
    const base: BoxItem[] = [];
    const shell: BoxItem[] = [];
    const bands: BoxItem[] = [];
    const loads: BoxItem[][] = [[], [], []];
    const beamTags: Tag[][] = [[], []];
    const loadTags: Tag[][] = [[], []];
    for (let row = 0; row < 2; row++) {
      const zz = z + row * 1.3;
      // the aisle face of the run, the one the camera sees
      const face = row === 1 ? 1 : -1;
      for (let x = x0; x <= x1 + 0.01; x += RACK.bay) {
        for (const dz of [-RACK.half, RACK.half]) {
          up.push([x, RACK.h / 2, zz + dz, 0.1, RACK.h, 0.1]);
          plate.push([x, 0.012, zz + dz, 0.24, 0.024, 0.24]);
        }
        for (const y of [0.4, 1.9, 3.6]) brace.push([x, y, zz, 0.035, 0.05, 2 * RACK.half - 0.1]);
        if (x + RACK.bay > x1 + 0.01) continue;
        const cx = x + RACK.bay / 2;
        RACK.beams.forEach((y, bi) => {
          for (const dz of [-RACK.half, RACK.half]) {
            web.push([cx, y, zz + dz, RACK.bay - 0.12, 0.14, 0.04]);
            flange.push([cx, y + 0.085, zz + dz - Math.sign(dz) * 0.03, RACK.bay - 0.12, 0.03, 0.1]);
            // the clip that hooks the beam into the upright's slots
            plate.push([x + 0.09, y, zz + dz, 0.07, 0.2, 0.06], [x + RACK.bay - 0.09, y, zz + dz, 0.07, 0.2, 0.06]);
          }
          if (y < RACK.h) beamTags[(Math.round(x * 3) + bi) & 1].push([cx, y, zz + face * (RACK.half + 0.025), 0.38, 0.12, face > 0 ? 0 : PI]);
        });
        [0, 1.5, 3.0].forEach((ly) => {
          for (const side of [-0.65, 0.65]) {
            if (r() < 0.2) continue;
            const room = ly === 3.0 ? 0.95 : 1.2;
            const h = room - 0.3 + r() * 0.3;
            const lx = cx + side;
            const y0 = ly === 0 ? 0 : ly + 0.1;
            base.push([lx, y0 + 0.07, zz, 1.2, 0.14, 0.8]);
            const yc = y0 + 0.14 + h / 2;
            loads[Math.floor(r() * 3)].push([lx, yc, zz, 1.08, h, 0.76]);
            shell.push([lx, yc, zz, 1.13, h + 0.03, 0.81]);
            bands.push([lx, y0 + 0.14 + h * 0.3, zz, 1.15, 0.07, 0.83], [lx, y0 + 0.14 + h * 0.68, zz, 1.15, 0.07, 0.83]);
            loadTags[r() < 0.5 ? 0 : 1].push([lx - 0.2, yc + h * 0.1, zz + face * 0.41, 0.34, 0.12, face > 0 ? 0 : PI]);
          }
        });
      }
    }
    return { up, plate, brace, web, flange, base, shell, bands, loads, beamTags, loadTags };
  }, [x0, x1, z]);
  return (
    <group>
      <BoxSet items={d.up} mat={uprightMat} cast />
      <BoxSet items={d.plate} mat={beamFlange} />
      <BoxSet items={d.brace} mat={frameMat} />
      <BoxSet items={d.web} mat={beamWeb} cast />
      <BoxSet items={d.flange} mat={beamFlange} />
      <BoxSet items={d.base} mat={palletMat} cast />
      {d.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={d.shell} mat={wrapShell} receive={false} />
      <BoxSet items={d.bands} mat={wrapBand} receive={false} />
      {[0, 1].map((v) => (
        <group key={v}>
          <Tags items={d.beamTags[v]} mat={tagMat(4 + v)} />
          <Tags items={d.loadTags[v]} mat={tagMat(2 + v)} />
        </group>
      ))}
    </group>
  );
}

// 1px lines on the floor along the aisle, built in aisle metres and drawn on down the hall in T.
function floorLines() {
  const pale: BoxItem[] = [];
  const mid: BoxItem[] = [];
  const Y = 0.014;
  const L = (a0: number, a1: number, b0: number, b1: number, list: BoxItem[]) => {
    const [x, , z] = toWorld((a0 + a1) / 2, (b0 + b1) / 2);
    list.push([x - ATP.x, Y, z - ATP.z, a1 - a0, 0.008, b1 - b0]);
  };
  // slab joints every 5 m, along and across
  for (let a = -10; a <= 30; a += 5) L(a - 0.01, a + 0.01, -17, 11, pale);
  for (let b = -15; b <= 10; b += 5) L(-12, 31.5, b - 0.01, b + 0.01, pale);
  // the drive aisle edges, solid
  L(-12, 31.5, 2.35, 2.45, mid);
  // the charger plate and the pick station zone, outlines
  const box = (a: number, b: number, w: number, d: number) => {
    L(a - w / 2, a + w / 2, b - d / 2 - 0.04, b - d / 2 + 0.04, mid);
    L(a - w / 2, a + w / 2, b + d / 2 - 0.04, b + d / 2 + 0.04, mid);
    L(a - w / 2 - 0.04, a - w / 2 + 0.04, b - d / 2, b + d / 2, mid);
    L(a + w / 2 - 0.04, a + w / 2 + 0.04, b - d / 2, b + d / 2, mid);
  };
  box(1.35, LANE_A, 1.5, 1.4);
  box(STATION.a + 0.8, STATION.b - 0.65, 3.4, 3.2);
  // the bays, a mark where each shelf unit stands
  COLS.forEach((a) => {
    box(a, BAY_B, 1.3, 1.3);
    box(a, BAY_B + 1.3, 1.3, 1.3);
  });
  return { pale, mid };
}

// Two arms, each an upper arm, a forearm and a hand, posed every frame from a shoulder and a hand target in the person's
// own frame. The person faces +x, the right side is +z.
type ArmRig = { up: THREE.Mesh | null; fore: THREE.Mesh | null; hand: THREE.Mesh | null };
const Y = new THREE.Vector3(0, 1, 0);
const ik = { d: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Vector3(), h: new THREE.Vector3(), m: new THREE.Vector3() };
function bone(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  ik.m.subVectors(b, a);
  const len = ik.m.length();
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(Y, ik.m.divideScalar(Math.max(len, 1e-5)));
  mesh.scale.set(1, Math.max(len, 1e-3), 1);
}
// Two bone reach. The elbow bends back and down, the hand stops at full stretch when the target is further than the arm.
function poseArm(rig: ArmRig, s: THREE.Vector3, t: THREE.Vector3) {
  if (!rig.up || !rig.fore || !rig.hand) return;
  const L1 = ARM.up;
  const L2 = ARM.fore;
  ik.d.subVectors(t, s);
  const dist = Math.min(Math.max(ik.d.length(), 0.05), L1 + L2 - 1e-4);
  ik.d.normalize();
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  ik.p.set(-1, -1, 0).addScaledVector(ik.d, -ik.d.dot(ik.p.set(-1, -1, 0)));
  if (ik.p.lengthSq() < 1e-6) ik.p.set(-1, 0, 0);
  ik.p.normalize();
  ik.e.copy(s).addScaledVector(ik.d, a).addScaledVector(ik.p, h);
  ik.h.copy(s).addScaledVector(ik.d, dist);
  bone(rig.up, s, ik.e);
  bone(rig.fore, ik.e, ik.h);
  rig.hand.position.copy(ik.h).addScaledVector(ik.d, 0.04);
  rig.hand.quaternion.copy(rig.fore.quaternion);
}

function Person({ groupRef, arms }: { groupRef: (g: THREE.Group | null) => void; arms: ArmRig[] }) {
  const skin = useMemo(() => lam(G.light), []);
  const dark = useMemo(() => lam(G.graphite), []);
  const vest = useMemo(() => lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.3) }), []);
  const white = useMemo(() => lam(G.white, { emissive: lit(G.white).multiplyScalar(0.4) }), []);
  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.45, 0.1]} material={dark} castShadow>
        <boxGeometry args={[0.16, 0.9, 0.17]} />
      </mesh>
      <mesh position={[0, 0.45, -0.1]} material={dark} castShadow>
        <boxGeometry args={[0.16, 0.9, 0.17]} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={vest} castShadow>
        <boxGeometry args={[0.25, 0.62, 0.42]} />
      </mesh>
      <mesh position={[0, 1.66, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.115, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.57, 0]} material={white} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.16]} />
      </mesh>
      {arms.map((rig, i) => (
        <group key={i}>
          <mesh ref={(m) => { rig.up = m; }} material={vest} castShadow>
            <boxGeometry args={[0.1, 1, 0.1]} />
          </mesh>
          <mesh ref={(m) => { rig.fore = m; }} material={vest} castShadow>
            <boxGeometry args={[0.09, 1, 0.09]} />
          </mesh>
          <mesh ref={(m) => { rig.hand = m; }} material={skin} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Aisle({ clock }: SceneProps) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const lines = useMemo(floorLines, []);
  const linesRef = useRef<THREE.Group>(null);
  const wallsRef = useRef<THREE.Group>(null);
  const racksRef = useRef<THREE.Group>(null);
  const fixedRef = useRef<THREE.Group>(null);
  const robotRefs = useRef<(THREE.Group | null)[]>([]);
  const unitRefs = useRef<(THREE.Group | null)[]>([]);
  const staticRefs = useRef<(THREE.Group | null)[]>([]);
  const personRef = useRef<THREE.Group | null>(null);
  const arms = useMemo<ArmRig[]>(() => [0, 1].map(() => ({ up: null, fore: null, hand: null })), []);
  const boxRef = useRef<THREE.Group>(null);
  const hl = useRef<THREE.Group>(null);
  const hlFill = useRef<THREE.Mesh>(null);

  // static units, the front row and the back row of the storage block, less the bays whose unit moves
  const statics = useMemo(() => {
    const out: { a: number; b: number; seed: number }[] = [];
    COLS.forEach((a, i) => {
      if (![0, 6, 7].includes(i)) out.push({ a, b: BAY_B, seed: 20 + i });
      out.push({ a, b: BAY_B + 1.3, seed: 40 + i });
    });
    return out;
  }, []);

  const pathMat = useMemo(() => new LineMaterial({ color: new THREE.Color(INFO).getHex(), linewidth: 1, transparent: true, opacity: 1, toneMapped: false, depthWrite: false }), []);
  const hlMat = useMemo(() => new LineMaterial({ color: new THREE.Color(INFO).getHex(), linewidth: 1, transparent: true, opacity: 1, toneMapped: false, depthWrite: false }), []);
  const NSEG = 64;
  const path = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(NSEG * 6));
    const l = new LineSegments2(g, pathMat);
    l.frustumCulled = false;
    return l;
  }, [pathMat]);
  const hlLine = useMemo(() => {
    const g = new LineSegmentsGeometry();
    const h = 0.66;
    const c: [number, number][] = [[-h, -h], [h, -h], [h, h], [-h, h]];
    const p: number[] = [];
    for (let i = 0; i < 4; i++) p.push(c[i][0], 0, c[i][1], c[(i + 1) % 4][0], 0, c[(i + 1) % 4][1]);
    g.setPositions(new Float32Array(p));
    const l = new LineSegments2(g, hlMat);
    l.frustumCulled = false;
    return l;
  }, [hlMat]);

  const pickPos = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), w: new THREE.Vector3(), c: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion(), r: new THREE.Quaternion(), flip: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), PI) }), []);

  useLayoutEffect(() => {
    robotRefs.current.forEach((r) => r?.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).receiveShadow = true) : null)));
  }, []);

  const bots: KF[][] = [ACTIVE, FLEET1, FLEET2];

  useFrame(() => {
    const u = uOf(clock);
    const k = Math.min(Math.max(u - 14, 0), 1);
    pathMat.resolution.set(size.width * dpr, size.height * dpr);
    hlMat.resolution.set(size.width * dpr, size.height * dpr);
    pathMat.linewidth = hlMat.linewidth = Math.max(1, size.height / 900) * dpr;

    // T, the najam floor leads into the aisle, the lane lines draw on down the hall, the walls, racks and units rise from the floor
    const draw = ease(range(u, 13.15, 13.75));
    if (linesRef.current) {
      linesRef.current.scale.x = Math.max(draw, 0.001);
      linesRef.current.visible = draw > 0.002;
    }
    const wall = ease(range(u, 13.1, 13.7));
    if (wallsRef.current) {
      wallsRef.current.scale.y = Math.max(wall, 0.001);
      wallsRef.current.visible = wall > 0.002;
    }
    const rk = ease(range(u, 13.2, 13.8));
    if (racksRef.current) {
      racksRef.current.scale.y = Math.max(rk, 0.001);
      racksRef.current.visible = rk > 0.002;
    }
    const fx = ease(range(u, 13.5, 13.9));
    if (fixedRef.current) {
      fixedRef.current.scale.y = Math.max(fx, 0.001);
      fixedRef.current.visible = fx > 0.002;
    }
    // units rise nearest first
    statics.forEach((s, i) => {
      const g = staticRefs.current[i];
      if (!g) return;
      const r = ease(range(u, 13.3 + s.a * 0.012, 13.55 + s.a * 0.012));
      g.scale.y = Math.max(r, 0.001);
      g.visible = r > 0.002;
    });
    const grow = ease(range(u, 13.7, 13.95));

    // the robots
    const poses = bots.map((kf) => poseOf(kf, k));
    poses.forEach((p, i) => {
      const g = robotRefs.current[i];
      if (!g) return;
      const [x, , z] = toWorld(p.a, p.b);
      g.position.set(x, 0, z);
      g.rotation.y = yawOf(p.h);
      g.scale.setScalar(Math.max(grow, 0.001));
      g.visible = grow > 0.002;
    });
    // the units, in their bay until their robot has them, then riding it
    MOVING.forEach((m: UnitPlan, i) => {
      const g = unitRefs.current[i];
      if (!g) return;
      const rp = poses[i];
      const h0 = poseOf(m.robot, Math.max(m.from, 0)).h;
      const riding = k >= m.from;
      const a = riding ? rp.a : m.slot[0];
      const b = riding ? rp.b : m.slot[1];
      const h = riding ? rp.h - h0 : 0;
      const [x, , z] = toWorld(a, b);
      g.position.set(x, riding ? rp.lift : 0, z);
      g.rotation.y = yawOf(h);
      const r = ease(range(u, 13.4 + m.slot[0] * 0.012, 13.65 + m.slot[0] * 0.012));
      g.scale.y = Math.max(r, 0.001);
      g.visible = r > 0.002;
    });

    // the path, drawn from the active robot along the next 5 m of its route, and nothing behind it
    {
      const geo = path.geometry as LineSegmentsGeometry & { attributes: { instanceStart: THREE.InterleavedBufferAttribute } };
      const arr = geo.attributes.instanceStart.data.array as Float32Array;
      const pts: [number, number][] = [];
      const t1 = Math.min(k + 0.3, 1);
      for (let i = 0; i <= 90; i++) {
        const p = poseOf(ACTIVE, k + ((t1 - k) * i) / 90);
        pts.push([p.a, p.b]);
      }
      // trim to 5 m along the route
      let acc = 0;
      const keep: [number, number][] = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (d < 1e-5) continue;
        if (acc + d > 5) {
          const t = (5 - acc) / d;
          keep.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
          break;
        }
        acc += d;
        keep.push(pts[i]);
      }
      // the line starts at the robot's front edge, so it reads as running ahead of it
      const on = ease(range(u, 14.0, 14.04)) * (k < 0.92 ? 1 : 0);
      for (let i = 0; i < NSEG; i++) {
        const s = Math.min(i, keep.length - 2);
        const p = keep[Math.max(s, 0)];
        const q = keep[Math.min(s + 1, keep.length - 1)];
        const live = on > 0.5 && i < keep.length - 1 && keep.length > 1;
        const [px, , pz] = toWorld(p[0], p[1], 0.03);
        const [qx, , qz] = toWorld(q[0], q[1], 0.03);
        const o = i * 6;
        arr[o] = live ? px : 0;
        arr[o + 1] = live ? 0.03 : -20;
        arr[o + 2] = live ? pz : 0;
        arr[o + 3] = live ? qx : 0;
        arr[o + 4] = live ? 0.03 : -20;
        arr[o + 5] = live ? qz : 0;
      }
      geo.attributes.instanceStart.data.needsUpdate = true;
      path.visible = on > 0.5;
    }
    // the target bay, outlined and lightly tinted until its unit is lifted
    if (hl.current) {
      const s = ease(range(u, 14.0, 14.08)) * (1 - ease(range(k, 0.5, 0.58)));
      const [x, , z] = toWorld(TARGET.a, TARGET.b, 0.02);
      hl.current.position.set(x, 0.02, z);
      hl.current.scale.setScalar(Math.max(s, 0.001));
      hl.current.visible = s > 0.002;
    }

    // the person takes the box off the lowered unit with both hands, turns to the cart and sets it down, see PICK
    const pg = personRef.current;
    const box = boxRef.current;
    const au = unitRefs.current[0];
    if (pg && box && au) {
      const rise = ease(range(u, 13.85, 13.98));
      const reach = ease(range(k, ...PICK.reach));
      const pull = ease(range(k, ...PICK.pull));
      const turn = ease(range(k, ...PICK.turn));
      const set = ease(range(k, ...PICK.set));
      const free = ease(range(k, ...PICK.free));
      pg.scale.y = Math.max(rise, 0.001);
      pg.visible = rise > 0.002;
      pg.rotation.y = -turn * PI;
      pg.updateMatrixWorld(true);
      au.updateMatrixWorld(true);
      // where the box sits on the unit, in the unit's own frame, then in the world
      pickPos.set(CELLS[PICK_CELL][0], LEVELS[PICK_LEVEL] + 0.015 + BOX.h / 2, CELLS[PICK_CELL][1]);
      const onUnit = au.localToWorld(tmp.v.copy(pickPos));
      // the box in the person's frame, on the unit, pulled to the chest, then down onto the cart
      const inHands = tmp.c.copy(HOLD).lerp(SET, set);
      const held = pg.localToWorld(tmp.w.copy(inHands));
      box.position.copy(onUnit).lerp(held, pull);
      tmp.q.copy(au.getWorldQuaternion(tmp.q));
      tmp.r.copy(pg.getWorldQuaternion(tmp.r)).multiply(tmp.flip);
      box.quaternion.copy(tmp.q).slerp(tmp.r, pull);
      box.visible = rise > 0.002 && (au.visible || pull > 0);
      // the hands hold the two sides of the box on its near half, or hang
      const local = pg.worldToLocal(tmp.t.copy(box.position));
      [1, -1].forEach((side, i) => {
        const s = tmp.s.copy(ARM.shoulder);
        s.z *= side;
        const rest = tmp.w.set(s.x + 0.04, s.y - 0.64, s.z + side * 0.03);
        const grip = tmp.v.set(local.x - 0.12, local.y, local.z + side * (BOX.d / 2 + 0.045));
        const t = rest.lerp(grip, reach * (1 - free));
        poseArm(arms[i], s, t);
      });
    }
  });

  const [pa, pb] = [PERSON.a, PERSON.b];
  const [px, , pz] = toWorld(pa, pb);
  const [cx, , cz] = toWorld(CART.a, CART.b);
  const [chx, , chz] = toWorld(1.7, 2.1);
  const [sx, , sz] = toWorld(STATION.a + 1.6, 2.2);

  return (
    <group>
      {/* floor lines, drawn on down the hall */}
      <group ref={linesRef} position={[ATP.x, 0, ATP.z]}>
        <group>
          <BoxSet items={lines.pale} mat={lineMatPale} receive={false} />
          <BoxSet items={lines.mid} mat={lineMatMid} receive={false} />
        </group>
      </group>

      {/* walls, a plain hall with a base band and a pilaster every 6 m */}
      <group ref={wallsRef}>
        <Walls />
      </group>

      {/* fixed pallet racks behind the storage block */}
      <group ref={racksRef}>
        <group position={[ATP.x, 0, ATP.z]}>
          <PalletRack x0={-30.6} x1={13.5} z={-7.4} />
        </group>
      </group>

      {/* the charger, the pick station fittings and the cart */}
      <group ref={fixedRef} position={[ATP.x, 0, ATP.z]}>
        <BoxSet items={[[chx - ATP.x, 0.45, chz - ATP.z, 0.5, 0.9, 0.26], [chx - ATP.x, 0.97, chz - ATP.z, 0.5, 0.12, 0.26]]} mat={plinthMat} cast />
        <BoxSet items={[[chx - ATP.x, 0.62, chz - ATP.z - 0.16, 0.34, 0.5, 0.02]]} mat={cartonMats[0]} />
        <BoxSet items={[[sx - ATP.x, 0.65, sz - ATP.z, 0.12, 1.3, 0.12], [sx - ATP.x, 1.34, sz - ATP.z, 0.1, 0.4, 0.5]]} mat={frameMat} cast />
        <BoxSet items={[[cx - ATP.x, CART.top / 2, cz - ATP.z, 0.7, CART.top, 0.7]]} mat={plinthMat} cast />
        <BoxSet items={[[cx - ATP.x, CART.top + 0.01, cz - ATP.z, 0.78, 0.04, 0.78]]} mat={cartonMats[2]} cast />
      </group>

      {/* the shelf units that stay in their bays */}
      {statics.map((s, i) => {
        const [x, , z] = toWorld(s.a, s.b);
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, PI, 0]}>
            <Unit seed={s.seed} groupRef={(g) => { staticRefs.current[i] = g; }} />
          </group>
        );
      })}

      {/* the units that ride a robot */}
      {MOVING.map((m, i) => (
        <group key={i}>
          <Unit seed={m.seed} pick={i === 0} groupRef={(g) => { unitRefs.current[i] = g; }} />
        </group>
      ))}
      <group ref={boxRef}>
        <mesh material={cartonMats[0]} castShadow>
          <boxGeometry args={[BOX.w, BOX.h, BOX.d]} />
        </mesh>
        <Tags items={[[0.08, 0.03, BOX.d / 2 + 0.002, 0.15, 0.05, 0], [-0.08, 0.03, -BOX.d / 2 - 0.002, 0.15, 0.05, PI]]} mat={tagMat(2)} />
      </group>

      {/* the person at the pick station, facing the unit */}
      <group position={[px, 0, pz]} rotation={[0, yawOf(PI / 2), 0]}>
        <Person groupRef={(g) => { personRef.current = g; }} arms={arms} />
      </group>

      {/* the robots, true scale */}
      {bots.map((_, i) => (
        <group key={i} ref={(g) => { robotRefs.current[i] = g; }}>
          <Truck name="cmatic10" />
        </group>
      ))}
      <primitive object={path} />
      <group ref={hl}>
        <primitive object={hlLine} />
        <mesh ref={hlFill} rotation={[-PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <planeGeometry args={[1.32, 1.32]} />
          <meshBasicMaterial color={INFO} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// A plain hall. The left wall and the wall behind the racks, each with a darker base band and pilasters. The end wall belongs to the
// depot floor, see grid.tsx, so it already stands in N.
function Walls() {
  const set = useMemo(() => {
    const wall: BoxItem[] = [];
    const band: BoxItem[] = [];
    const pil: BoxItem[] = [];
    const H = 16;
    const W = (a0: number, a1: number, b0: number, b1: number, list: BoxItem[], y0: number, h: number) => {
      const [x, , z] = toWorld((a0 + a1) / 2, (b0 + b1) / 2);
      list.push([x - ATP.x, y0 + h / 2, z - ATP.z, a1 - a0, h, b1 - b0]);
    };
    W(-14, 31.7, -17.2, -17, wall, 0, H);
    W(-14, 31.7, 10.9, 11.1, wall, 0, H);
    W(-14, 31.5, -17.0, -16.9, band, 0, 1.2);
    W(-14, 31.5, 10.8, 10.9, band, 0, 1.2);
    for (let a = -12; a <= 30; a += 6) {
      W(a - 0.15, a + 0.15, -17.0, -16.88, pil, 0, H);
      W(a - 0.15, a + 0.15, 10.78, 10.9, pil, 0, H);
    }
    return { wall, band, pil };
  }, []);
  return (
    <group position={[ATP.x, 0, ATP.z]}>
      <BoxSet items={set.wall} mat={wallMat} />
      <BoxSet items={set.band} mat={wallBase} />
      <BoxSet items={set.pil} mat={wallBase} />
    </group>
  );
}

export { K, LIFT };
