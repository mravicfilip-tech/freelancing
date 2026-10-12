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
import { Racking } from './yard';
import { G, K, ease, lam, lit, range, rng, uOf } from './kit';
import { ACTIVE, BAY_B, COLS, FLEET1, FLEET2, LANE_A, LIFT, MOVING, STATION, TARGET, poseOf, toWorld, yawOf, type KF, type UnitPlan } from './atplan';

const INFO = '#468cc4'; // LMH blue, 72 percent tint, the one info colour of the automation floor
const PI = Math.PI;
const UNIT = { s: 1.1, h: 2.0, clear: 0.3 };
const LEVELS = [0.36, 0.76, 1.16, 1.56, 1.96];
const CELLS: [number, number][] = [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]];
const PICK_LEVEL = 2;
const PICK_CELL = 3;
const CART = { a: 26.5, b: -0.05, top: 0.9 };
const PERSON = { a: 25.2, b: -0.05 };

const frameMat = lam(G.graphite);
const shelfMat = lam(G.mid, { emissive: lit(G.mid).multiplyScalar(0.3) });
const cartonMats = [G.white, G.pale, G.light].map((c) => lam(c, { emissive: lit(c).multiplyScalar(0.35) }));
const tapeMat = lam(G.mid);
const lineMatPale = new THREE.MeshBasicMaterial({ color: G.pale, toneMapped: false });
const lineMatMid = new THREE.MeshBasicMaterial({ color: G.mid, toneMapped: false });
const wallMat = lam(G.pale, { emissive: new THREE.Color().setScalar(0.56) });
const wallBase = lam(G.light, { emissive: new THREE.Color().setScalar(0.46) });
const plinthMat = lam(G.mid);

// A shelf unit, 1.1 m square and 2 m tall on four legs with room under it for the robot, five shelves of cartons.
function unitSets(seed: number, pick: boolean) {
  const r = rng(seed);
  const frame: BoxItem[] = [];
  const posts: BoxItem[] = [];
  const cartons: BoxItem[][] = [[], [], []];
  const tape: BoxItem[] = [];
  const e = UNIT.s / 2 - 0.035;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      posts.push([sx * e, (UNIT.h + UNIT.clear - 0.04) / 2, sz * e, 0.05, UNIT.h - UNIT.clear + 0.04, 0.05]);
      posts.push([sx * e, UNIT.clear / 2, sz * e, 0.07, UNIT.clear, 0.07]);
    }
  // base frame under the first shelf, so the unit reads as one lifted piece
  frame.push([0, UNIT.clear - 0.02, 0, UNIT.s, 0.04, 0.06], [0, UNIT.clear - 0.02, 0, 0.06, 0.04, UNIT.s]);
  LEVELS.forEach((y, li) => {
    frame.push([0, y, 0, UNIT.s, 0.03, UNIT.s]);
    frame.push([0, y + 0.035, UNIT.s / 2 - 0.01, UNIT.s, 0.04, 0.02], [0, y + 0.035, -UNIT.s / 2 + 0.01, UNIT.s, 0.04, 0.02]);
    if (li === LEVELS.length - 1) return;
    CELLS.forEach(([cx, cz], ci) => {
      if (pick && li === PICK_LEVEL && ci === PICK_CELL) return;
      if (r() < 0.14) return;
      const h = 0.2 + r() * 0.13;
      const w = 0.4 + r() * 0.08;
      const d = 0.4 + r() * 0.08;
      cartons[Math.floor(r() * 3)].push([cx, y + 0.015 + h / 2, cz, w, h, d]);
      tape.push([cx, y + 0.015 + h + 0.003, cz, 0.07, 0.006, d + 0.01]);
    });
  });
  return { frame, posts, cartons, tape };
}

function Unit({ seed, pick = false, groupRef }: { seed: number; pick?: boolean; groupRef: (g: THREE.Group | null) => void }) {
  const d = useMemo(() => unitSets(seed, pick), [seed, pick]);
  return (
    <group ref={groupRef}>
      <BoxSet items={d.posts} mat={frameMat} cast />
      <BoxSet items={d.frame} mat={shelfMat} cast />
      {d.cartons.map((c, i) => (
        <BoxSet key={i} items={c} mat={cartonMats[i]} cast />
      ))}
      <BoxSet items={d.tape} mat={tapeMat} />
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
  box(STATION.a + 0.8, STATION.b - 0.5, 3.4, 2.9);
  // the bays, a mark where each shelf unit stands
  COLS.forEach((a) => {
    box(a, BAY_B, 1.3, 1.3);
    box(a, BAY_B + 1.3, 1.3, 1.3);
  });
  return { pale, mid };
}

function Person({ groupRef, armRef }: { groupRef: (g: THREE.Group | null) => void; armRef: (g: THREE.Group | null) => void }) {
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
      {/* left arm hangs, the right arm aims at the box */}
      <mesh position={[0, 1.16, -0.27]} material={vest} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
      </mesh>
      <group ref={armRef} position={[0, 1.44, 0.26]}>
        <mesh position={[0, 0, 0.32]} material={vest} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.66]} />
        </mesh>
        <mesh position={[0, 0, 0.68]} material={skin} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
      </group>
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
  const armRef = useRef<THREE.Group | null>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const hl = useRef<THREE.Group>(null);
  const hlFill = useRef<THREE.Mesh>(null);

  // static units, the front row and the back row of the storage block, less the bays whose unit moves
  const statics = useMemo(() => {
    const out: { a: number; b: number; seed: number }[] = [];
    COLS.forEach((a, i) => {
      if (![2, 6, 7].includes(i)) out.push({ a, b: BAY_B, seed: 20 + i });
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
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() }), []);

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

    // the path, drawn from the active robot along the next 8 m of its route, and nothing behind it
    {
      const geo = path.geometry as LineSegmentsGeometry & { attributes: { instanceStart: THREE.InterleavedBufferAttribute } };
      const arr = geo.attributes.instanceStart.data.array as Float32Array;
      const pts: [number, number][] = [];
      const t1 = Math.min(k + 0.3, 1);
      for (let i = 0; i <= 90; i++) {
        const p = poseOf(ACTIVE, k + ((t1 - k) * i) / 90);
        pts.push([p.a, p.b]);
      }
      // trim to 8 m along the route
      let acc = 0;
      const keep: [number, number][] = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (d < 1e-5) continue;
        if (acc + d > 8) {
          const t = (8 - acc) / d;
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

    // the person takes the box off the unit and sets it on the cart, k 0.92 to 1
    const pg = personRef.current;
    const arm = armRef.current;
    const box = boxRef.current;
    const au = unitRefs.current[0];
    if (pg && arm && box && au) {
      const rise = ease(range(u, 13.85, 13.98));
      pg.scale.y = Math.max(rise, 0.001);
      pg.visible = rise > 0.002;
      pg.updateMatrixWorld(true);
      au.updateMatrixWorld(true);
      // where the box sits on the unit, in the unit's own frame
      const lx = CELLS[PICK_CELL][0];
      const lz = CELLS[PICK_CELL][1];
      pickPos.set(lx, LEVELS[PICK_LEVEL] + 0.015 + 0.14, lz);
      const onUnit = au.localToWorld(tmp.v.copy(pickPos));
      const [cx, , cz] = toWorld(CART.a, CART.b);
      const reach = ease(range(k, 0.92, 0.95));
      const carry = ease(range(k, 0.95, 1.0));
      const lift = Math.sin(carry * PI) * 0.18;
      tmp.w.set(cx, CART.top + 0.14, cz);
      box.position.copy(onUnit).lerp(tmp.w, carry);
      box.position.y += lift;
      box.quaternion.copy(au.getWorldQuaternion(tmp.q));
      if (carry > 0.001) box.rotation.set(0, 0, 0);
      box.visible = rise > 0.002 && (au.visible || carry > 0);
      // the right arm aims at the box, or hangs
      const shoulder = arm.getWorldPosition(tmp.v);
      const target = tmp.w.copy(box.position);
      const rest = new THREE.Vector3(shoulder.x, shoulder.y - 1, shoulder.z);
      const aim = rest.clone().lerp(target, reach);
      arm.lookAt(aim);
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
          <Racking x0={-30.6} x1={13.5} z={-7.4} />
        </group>
      </group>

      {/* the charger, the pick station fittings and the cart */}
      <group ref={fixedRef} position={[ATP.x, 0, ATP.z]}>
        <BoxSet items={[[chx - ATP.x, 0.5, chz - ATP.z, 0.6, 1.0, 0.3], [chx - ATP.x, 1.08, chz - ATP.z, 0.6, 0.16, 0.3]]} mat={frameMat} cast />
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
      <mesh ref={boxRef} material={cartonMats[0]} castShadow>
        <boxGeometry args={[0.46, 0.28, 0.4]} />
      </mesh>

      {/* the person at the pick station, facing the unit */}
      <group position={[px, 0, pz]} rotation={[0, yawOf(PI / 2), 0]}>
        <Person groupRef={(g) => { personRef.current = g; }} armRef={(g) => { armRef.current = g; }} />
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

// A plain hall. The left wall, the far wall and the wall behind the racks, each with a darker base band and pilasters.
function Walls() {
  const set = useMemo(() => {
    const wall: BoxItem[] = [];
    const band: BoxItem[] = [];
    const pil: BoxItem[] = [];
    const H = 9;
    const W = (a0: number, a1: number, b0: number, b1: number, list: BoxItem[], y0: number, h: number) => {
      const [x, , z] = toWorld((a0 + a1) / 2, (b0 + b1) / 2);
      list.push([x - ATP.x, y0 + h / 2, z - ATP.z, a1 - a0, h, b1 - b0]);
    };
    W(-14, 31.7, -17.2, -17, wall, 0, H);
    W(-14, 31.7, 10.9, 11.1, wall, 0, H);
    W(31.5, 31.7, -17.2, 11.1, wall, 0, H);
    W(-14, 31.5, -17.0, -16.9, band, 0, 1.2);
    W(-14, 31.5, 10.8, 10.9, band, 0, 1.2);
    W(31.4, 31.5, -17.2, 11.1, band, 0, 1.2);
    for (let a = -12; a <= 30; a += 6) {
      W(a - 0.15, a + 0.15, -17.0, -16.88, pil, 0, H);
      W(a - 0.15, a + 0.15, 10.78, 10.9, pil, 0, H);
    }
    for (let b = -15; b <= 9; b += 6) W(31.28, 31.4, b - 0.15, b + 0.15, pil, 0, H);
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
