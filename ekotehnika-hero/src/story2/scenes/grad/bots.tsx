// AT, one order from start to finish in a warehouse. The real C-Matic 10, at its true size, leaves its charger, drives
// under a shelf unit and lifts it, carries it to the pick station and sets it down, where a person takes the box from
// the top shelf. Two more C-Matics move shelf units deeper in the aisle, in step. The only system graphic is a thin
// path line drawn just ahead of the active robot, gone behind it, and a calm highlight on the slot it is bound for.
// The camera is a three quarter view at about 4 m eye height. The ground is the hall's own floor and wall, the wall runs
// edge to edge behind a rack run that starts under column 7, so the text lands on bare wall and bare floor.
// Plan metres from BOTS_Z, x east, z south, the wall at the north. Everything is a function of the story clock.
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { RoundedBox } from '@react-three/drei';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { BOTS_Z, botPhase, lerp, seg, smooth } from './choreo';
import { Inst, type It } from './kit';
import { G, flat, mat } from './look';
import { useTruck, type Truck, type TruckName } from './trucks';

const at3 = (x: number, y: number, z: number): [number, number, number] => [x, y, BOTS_Z + z];

// The floor is the ground colour of the region, so the swap from the rising dark panel can never show.
const FLOOR = C.ink;
const WALL_Z = -9.2;

/* ------------------------------------------------------------------ the layout */

const CH = { x: 0.05, z: -1.75 }; // the charger pad, the robot stands here
const LANE = -1.75; // the front lane
const SLOT_Z = -3.6; // the row of shelf slots
const SLOTS = [1.45, 2.65, 3.85]; // the third is empty
const TARGET = 1; // the shelf the order is for
const PX = 5.0; // the pick bay, the shelf is set down here
const PERSON_X = PX + 1.12;
const BACK = -5.7; // the lane deeper in the aisle

const shelfBase = 0.34; // the legs of a shelf unit, clear of the C-Matic 10

// Keys of the active robot over the phase of AT, [phase, x, z, yaw]. The yaw is the heading, 0 faces +x, pi / 2 faces the wall.
const KEYS: [number, number, number, number][] = [
  [0.0, CH.x, CH.z, 0],
  [0.1, CH.x, CH.z, 0],
  [0.27, SLOTS[TARGET], LANE, 0],
  [0.31, SLOTS[TARGET], LANE, Math.PI / 2],
  [0.38, SLOTS[TARGET], SLOT_Z, Math.PI / 2],
  [0.47, SLOTS[TARGET], SLOT_Z, Math.PI / 2],
  [0.55, SLOTS[TARGET], LANE, Math.PI / 2],
  [0.59, SLOTS[TARGET], LANE, 0],
  [0.78, PX, LANE, 0],
  [0.82, PX, LANE, Math.PI / 2],
  [0.87, PX, SLOT_Z, Math.PI / 2],
  [0.92, PX, SLOT_Z, Math.PI / 2],
  [1.0, PX, LANE, Math.PI / 2],
];
// The legs of the route that are drawn ahead of the robot, [from phase, to phase, end of the leg]
const LEGS: [number, number, [number, number]][] = [
  [0.1, 0.27, [SLOTS[TARGET], LANE]],
  [0.31, 0.38, [SLOTS[TARGET], SLOT_Z]],
  [0.59, 0.78, [PX, LANE]],
  [0.82, 0.87, [PX, SLOT_Z]],
];

const ease = (t: number) => smooth(t);
function robotAt(ph: number) {
  let i = 0;
  while (i < KEYS.length - 2 && ph > KEYS[i + 1][0]) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = ease(seg(ph, a[0], b[0]));
  return { x: lerp(a[1], b[1], t), z: lerp(a[2], b[2], t), yaw: lerp(a[3], b[3], t) };
}

/* ------------------------------------------------------------------ the hall, wall, floor and racks */

const wallMat = mat('#2e2e2e', 0.08, 0.95, false);
const rackUp = mat(G.dark, 0.18);
const rackBeam = mat(G.mid, 0.16);
const rackLoad = mat(G.graphite, 0.12);
const rackLoadB = mat(G.dark, 0.14);
const rackWrap = mat(G.mid, 0.2);
const rackLabel = new THREE.MeshBasicMaterial({ color: G.pale, toneMapped: false });
const unitGeo = new THREE.BoxGeometry(1, 1, 1);

// One rack run along the wall, bays of 2.7 m, four levels, wrapped loads on pallets, a label plate on every beam.
function rackItems(x0: number, x1: number, seed: number) {
  const ups: It[] = [];
  const beams: It[] = [];
  const load: It[] = [];
  const loadB: It[] = [];
  const wrap: It[] = [];
  const label: It[] = [];
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const bays = Math.round((x1 - x0) / 2.7);
  const zf = WALL_Z + 1.55;
  const zb = WALL_Z + 0.4;
  for (let i = 0; i <= bays; i++) for (const zz of [zf, zb]) ups.push([x0 + i * 2.7, 1.9, zz, 0.1, 3.8, 0.1]);
  for (let i = 0; i < bays; i++) {
    const xc = x0 + i * 2.7 + 1.35;
    for (const by of [0.15, 1.4, 2.65]) {
      beams.push([xc, by + 1.1, zf, 2.7, 0.12, 0.08]);
      label.push([xc - 0.9, by + 1.1, zf + 0.05, 0.32, 0.1, 0.01]);
    }
    for (const ly of [0.15, 1.4, 2.65]) {
      for (const dx of [-0.65, 0.65]) {
        if (rnd() < 0.2) continue;
        const h = 0.7 + rnd() * 0.3;
        (rnd() < 0.5 ? load : loadB).push([xc + dx, ly + 0.14 + h / 2, (zf + zb) / 2, 1.0, h, 0.95]);
        // a band of stretch wrap round the load
        wrap.push([xc + dx, ly + 0.14 + h * 0.55, (zf + zb) / 2, 1.04, 0.05, 0.99]);
      }
    }
  }
  return { ups, beams, load, loadB, wrap, label };
}

function Racks({ x0, x1, seed }: { x0: number; x1: number; seed: number }) {
  const r = useMemo(() => rackItems(x0, x1, seed), [x0, x1, seed]);
  return (
    <>
      <Inst mat={rackUp} items={r.ups} />
      <Inst mat={rackBeam} items={r.beams} />
      <Inst mat={rackLoad} items={r.load} />
      <Inst mat={rackLoadB} items={r.loadB} />
      <Inst mat={rackWrap} items={r.wrap} cast={false} />
      <Inst geo={unitGeo} mat={rackLabel} items={r.label} cast={false} receive={false} />
    </>
  );
}

/* ------------------------------------------------------------------ shelf unit, charger, pick station, person */

const shelfMat = mat(G.mid, 0.2, 0.6);
const deckMat = mat(G.light, 0.2, 0.7);
const boxMat = mat(G.pale, 0.15);
const boxTape = mat(G.dark, 0.2);
const targetBox = mat(G.white, 0.3);

// A mobile shelf unit, four legs, four decks, boxes on two of them. 1.0 by 0.7 and 1.75 tall on legs that clear the robot.
function Shelf({ gref, box }: { gref: (g: THREE.Group | null) => void; box?: (g: THREE.Group | null) => void }) {
  return (
    <group ref={gref}>
      {[-0.46, 0.46].flatMap((x) => [-0.31, 0.31].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.875, z]} material={shelfMat} castShadow>
          <boxGeometry args={[0.04, 1.75, 0.04]} />
        </mesh>
      )))}
      {[shelfBase, 0.86, 1.38, 1.74].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={deckMat} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.03, 0.7]} />
        </mesh>
      ))}
      {[[-0.22, 0.86, 0], [0.24, 0.86, 0.04], [-0.2, 1.38, 0.02], [0.2, 1.38, -0.03]].map(([x, y, z], i) => (
        <group key={i} position={[x, y + 0.015 + 0.14, z]}>
          <mesh material={boxMat} castShadow>
            <boxGeometry args={[0.36, 0.28, 0.4]} />
          </mesh>
          <mesh position={[0, 0.141, 0]} material={boxTape}>
            <boxGeometry args={[0.08, 0.004, 0.41]} />
          </mesh>
        </group>
      ))}
      {/* the box of the order, on the top shelf, the one the person takes */}
      <group ref={box} position={[0.1, 1.74 + 0.015 + 0.16, 0]}>
        <mesh material={targetBox} castShadow>
          <boxGeometry args={[0.42, 0.32, 0.4]} />
        </mesh>
        <mesh position={[0, 0.161, 0]} material={boxTape}>
          <boxGeometry args={[0.09, 0.004, 0.41]} />
        </mesh>
      </group>
    </group>
  );
}

const chargerBody = mat(G.graphite, 0.18, 0.55);
const lightBar = new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false });
const lightBarDim = flat(G.mid);
const benchTop = mat(G.dark, 0.2, 0.6);
const benchLeg = mat(G.graphite, 0.18, 0.6);
const personLeg = mat(G.graphite, 0.18);
const personTorso = mat(G.light, 0.25);
const personHead = mat(G.pale, 0.25);
const personArm = mat(G.mid, 0.2);
const hatchMat = flat(G.white, 0.2);
const outlineMat = flat(G.white, 0.34);
const hlMat = new THREE.MeshBasicMaterial({ color: G.white, transparent: true, opacity: 0.16, toneMapped: false, depthWrite: false });

export function BotsStage({ clock }: { clock: StoryClock }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const active = useRef<{ g: THREE.Group; t: Truck } | null>(null);
  const bg = useRef<({ g: THREE.Group; t: Truck } | null)[]>([null, null]);
  const shelves = useRef<(THREE.Group | null)[]>([]); // 0 the order, 1 the one beside it, 2 and 3 carried deeper in the aisle
  const orderBox = useRef<THREE.Group | null>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const hlA = useRef<THREE.Mesh>(null);
  const hlB = useRef<THREE.Mesh>(null);
  const racks = useRef<THREE.Group>(null);
  const pathMat = useMemo(() => new LineMaterial({ color: 0xffffff, linewidth: 1, transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false, depthTest: false }), []);
  const pathLine = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array([0, 0, 0, 0, 0, 0]));
    const l = new LineSegments2(g, pathMat);
    l.frustumCulled = false;
    l.renderOrder = 8;
    l.visible = false;
    return l;
  }, [pathMat]);
  const slab = useMemo(() => flat(FLOOR), []);
  const shadow = useMemo(() => new THREE.ShadowMaterial({ opacity: 0.55, depthWrite: false }), []);
  const v = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  // floor markings, the slots of the row, the pick bay and the charger pad, thin and white at a low level
  const marks = useMemo(() => {
    const o: It[] = [];
    const rect = (cx: number, cz: number, w: number, d: number) => {
      const t = 0.035;
      o.push([cx, 0.012, cz - d / 2, w, 0.004, t], [cx, 0.012, cz + d / 2, w, 0.004, t], [cx - w / 2, 0.012, cz, t, 0.004, d], [cx + w / 2, 0.012, cz, t, 0.004, d]);
    };
    SLOTS.forEach((x) => rect(x, SLOT_Z, 1.2, 0.9));
    rect(PX, SLOT_Z, 1.2, 0.9);
    rect(CH.x, CH.z, 1.0, 0.9);
    const h: It[] = [];
    for (let i = 0; i < 7; i++) h.push([PX + 0.95 + i * 0.2, 0.012, SLOT_Z, 0.05, 0.004, 1.5]);
    return { o, h };
  }, []);

  useFrame(() => {
    const k = Math.max(1, size.height / 1000) * dpr;
    pathMat.resolution.set(size.width * dpr, size.height * dpr);
    pathMat.linewidth = k;
    const pos = clock.pos.current;
    const ph = botPhase(pos);
    const a = active.current;
    const r = robotAt(ph);
    const liftT = ease(seg(ph, 0.38, 0.47)) - ease(seg(ph, 0.87, 0.92));
    const carrying = ph > 0.38 && ph < 0.87;
    if (a) {
      a.g.position.set(...at3(r.x, 0, r.z));
      a.g.rotation.set(0, r.yaw, 0);
      a.t.roll(ph * 14);
    }
    const sh = shelves.current;
    // shelf 0, the order, in its slot, then on the robot, then in the pick bay
    const s0 = sh[0];
    if (s0) {
      const x = ph < 0.38 ? SLOTS[TARGET] : carrying ? r.x : PX;
      const z = ph < 0.38 ? SLOT_Z : carrying ? r.z : SLOT_Z;
      s0.position.set(...at3(x, liftT * 0.14, z));
    }
    // the neighbour, standing in its slot
    sh[1]?.position.set(...at3(SLOTS[0], 0, SLOT_Z));
    // two more robots work deeper in the aisle, each moves a shelf unit along its lane and back, in step
    bg.current.forEach((b, i) => {
      if (!b) return;
      const x0 = i === 0 ? 2.2 : 6.2;
      const x1 = i === 0 ? 4.6 : 8.4;
      const c = (((ph * 2.2 + (i === 0 ? 0.0 : 0.35)) % 1) + 1) % 1;
      const u = c < 0.42 ? ease(c / 0.42) : c < 0.5 ? 1 : c < 0.92 ? 1 - ease((c - 0.5) / 0.42) : 0;
      const x = lerp(x0, x1, u);
      b.g.position.set(...at3(x, 0, BACK));
      b.g.rotation.set(0, c < 0.46 ? 0 : Math.PI, 0);
      b.t.roll(x * 2.4);
      const s = sh[2 + i];
      if (s) s.position.set(...at3(x, 0.14, BACK));
    });
    // the highlight on the slot the robot is bound for, then on the bay it brings the shelf to
    if (hlA.current) hlA.current.visible = ph > 0.02 && ph < 0.4;
    if (hlB.current) hlB.current.visible = ph > 0.5 && ph < 0.9;
    // the path line, just ahead of the robot on the leg it is driving, gone behind it
    let drawn = false;
    for (const [p0, p1, to] of LEGS) {
      if (ph > p0 && ph < p1) {
        (pathLine.geometry as LineSegmentsGeometry).setPositions(new Float32Array([...at3(r.x, 0.03, r.z), ...at3(to[0], 0.03, to[1])]));
        drawn = true;
      }
    }
    pathLine.visible = drawn;
    // the person, arms reach for the box, take it, and carry it at the chest
    const reach = ease(seg(ph, 0.88, 0.935));
    const take = ease(seg(ph, 0.935, 0.975));
    const armA = lerp(0.1, 1.5, reach) - lerp(0, 0.6, take);
    if (armL.current) armL.current.rotation.z = armA;
    if (armR.current) armR.current.rotation.z = armA;
    const ob = orderBox.current;
    if (ob && s0) {
      if (ph < 0.935) {
        s0.add(ob);
        ob.position.set(0.1, 1.74 + 0.015 + 0.16, 0);
      } else {
        // the box leaves the shelf and goes to the chest of the person
        s0.parent?.add(ob);
        v.a.set(...at3(PX + 0.1, 1.74 + 0.015 + 0.16, SLOT_Z));
        v.b.set(...at3(PERSON_X - 0.42, 1.12, SLOT_Z));
        ob.position.copy(v.a.lerp(v.b, take));
      }
    }
    // the racks rise from the floor as the hall comes up, a plain rise
    const rise = smooth(seg(pos, 10850, 11010));
    if (racks.current) {
      racks.current.scale.y = Math.max(rise, 0.001);
      racks.current.visible = rise > 0.003;
    }
  });

  const botKinds: TruckName[] = ['cmatic10', 'cmatic10', 'cmatichp'];
  return (
    <group>
      {/* the floor, and the hall's wall behind everything, edge to edge */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.004, BOTS_Z]} material={slab}>
        <planeGeometry args={[400, 400]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, BOTS_Z - 4]} material={shadow} receiveShadow>
        <planeGeometry args={[60, 30]} />
      </mesh>
      <mesh position={at3(0, 6, WALL_Z - 0.5)} material={wallMat} receiveShadow>
        <boxGeometry args={[200, 12, 1]} />
      </mesh>
      <group ref={racks} position={at3(0, 0, 0)}>
        <Racks x0={2.4} x1={21.0} seed={11} />
      </group>
      <Inst geo={unitGeo} mat={outlineMat} items={marks.o.map(([x, y, z, ...r]) => [x, y, BOTS_Z + z, ...r] as It)} cast={false} receive={false} />
      <Inst geo={unitGeo} mat={hatchMat} items={marks.h.map(([x, y, z, ...r]) => [x, y, BOTS_Z + z, ...r] as It)} cast={false} receive={false} />

      {/* the charger, a graphite unit with a white light bar */}
      <group position={at3(CH.x - 0.78, 0, CH.z)}>
        <RoundedBox args={[0.42, 1.0, 0.8]} radius={0.04} position={[0, 0.5, 0]} material={chargerBody} castShadow />
        <mesh position={[0.22, 0.82, 0]} material={lightBar}>
          <boxGeometry args={[0.02, 0.05, 0.5]} />
        </mesh>
        <mesh position={[0.22, 0.2, 0]} material={lightBarDim}>
          <boxGeometry args={[0.02, 0.04, 0.5]} />
        </mesh>
        {/* the light bar and the charge contacts on the face that the camera sees */}
        <mesh position={[0, 0.78, 0.41]} material={lightBar}>
          <boxGeometry args={[0.3, 0.05, 0.02]} />
        </mesh>
        <mesh position={[0, 0.2, 0.41]} material={lightBarDim}>
          <boxGeometry args={[0.3, 0.04, 0.02]} />
        </mesh>
      </group>

      {/* the pick station, a bench with a light bar, the person stands at it */}
      <group position={at3(PERSON_X + 0.95, 0, SLOT_Z)}>
        <mesh position={[0, 0.9, 0]} material={benchTop} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.06, 1.2]} />
        </mesh>
        {[-0.5, 0.5].map((z) => (
          <mesh key={z} position={[0, 0.45, z]} material={benchLeg} castShadow>
            <boxGeometry args={[0.5, 0.9, 0.06]} />
          </mesh>
        ))}
        <mesh position={[-0.2, 1.3, 0]} material={lightBar}>
          <boxGeometry args={[0.03, 0.05, 0.7]} />
        </mesh>
        <mesh position={[-0.2, 1.1, 0]} material={benchLeg}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
        </mesh>
      </group>
      <group position={at3(PERSON_X, 0, SLOT_Z)} rotation={[0, Math.PI, 0]}>
        {[-0.1, 0.1].map((z) => (
          <mesh key={z} position={[0, 0.45, z]} material={personLeg} castShadow>
            <boxGeometry args={[0.14, 0.9, 0.14]} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, 0]} material={personTorso} castShadow>
          <boxGeometry args={[0.24, 0.6, 0.44]} />
        </mesh>
        <mesh position={[0, 1.62, 0]} material={personHead} castShadow>
          <icosahedronGeometry args={[0.13, 0]} />
        </mesh>
        {([[armL, -0.27], [armR, 0.27]] as [RefObject<THREE.Group | null>, number][]).map(([r, z], i) => (
          <group key={i} ref={r} position={[0, 1.44, z]}>
            <mesh position={[0, -0.3, 0]} material={personArm} castShadow>
              <boxGeometry args={[0.1, 0.62, 0.1]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* shelf units, the order, one beside it and two that the robots carry deeper in the aisle */}
      {[0, 1, 2, 3].map((i) => (
        <Shelf
          key={i}
          gref={(g) => {
            shelves.current[i] = g;
          }}
          box={i === 0 ? (g) => { orderBox.current = g; } : undefined}
        />
      ))}

      <mesh ref={hlA} position={at3(SLOTS[TARGET], 0.016, SLOT_Z)} rotation-x={-Math.PI / 2} material={hlMat} visible={false}>
        <planeGeometry args={[1.2, 0.9]} />
      </mesh>
      <mesh ref={hlB} position={at3(PX, 0.016, SLOT_Z)} rotation-x={-Math.PI / 2} material={hlMat} visible={false}>
        <planeGeometry args={[1.2, 0.9]} />
      </mesh>

      <primitive object={pathLine} />
      {botKinds.map((name, i) => (
        <Bot
          key={i}
          name={name}
          reg={(g, t) => {
            if (i === 0) active.current = { g, t };
            else bg.current[i - 1] = { g, t };
          }}
        />
      ))}
    </group>
  );
}

function Bot({ name, reg }: { name: TruckName; reg: (g: THREE.Group, t: Truck) => void }) {
  const t = useTruck(name);
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.add(t.root);
    reg(g, t);
    return () => {
      t.root.removeFromParent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  return <group ref={ref} />;
}
