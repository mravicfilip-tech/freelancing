// The actors and set pieces of the Grad story, mounted once and moved every frame from the story
// time. All the numbers live in plan.ts, this file only applies them.
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoryClock } from '../../clock';
import { C } from '../../../tokens';
import { Pallet, setPose } from '../../../r3f/Forklift';
import { W } from '../../../variants/v4/look';
import { Forklift, VanModel, DeliveryTruck, OrderPicker, PalletTruck, Person, ReachTruck, setPalletTruck, setPicker, setReach, spin } from './vehicles';
import type { ForkliftApi, PalletTruckApi, PickerApi, ReachApi, TruckApi } from './vehicles';
import { Dock, Label, PitRig, Pile, Racks, RenewLine, Seal, Warn } from './props';
import { Track, clamp01, easeOut, eio, hallY, lerp, newPose, place, seg, smooth } from './math';
import {
  BACKLOG, K1_N, K1_PADS, LINE, PT_V3, STOP, VAN_BAY, VAN_ROUTE, ZONES, renewProgress, routeProgress, sealState, stageIn, stateA, stateB, stateC, stateT,
  truckPhase, uOf, zoneActive, zoneAt,
} from './plan';
import { rng } from './util';

/* ----------------------------------------------------------------- the renewing paint and its scuffs */

const WORN = new THREE.Color(C.tonedTextGrey);
const FRESH = new THREE.Color(C.lindeRed);

function Scuffs({ gref }: { gref: MutableRefObject<THREE.Group | null> }) {
  const items = useMemo(() => {
    const r = rng(41);
    const out: { p: [number, number, number]; s: [number, number]; rot: number; dark: boolean }[] = [];
    for (const z of [0.6, -0.6])
      for (let i = 0; i < 9; i++) {
        const dark = r() < 0.6;
        out.push({ p: [-1.45 + r() * 1.3, 0.42 + r() * 0.66, z], s: [0.1 + r() * 0.34, dark ? 0.03 + r() * 0.1 : 0.012], rot: (r() - 0.5) * 0.8, dark });
      }
    return out;
  }, []);
  return (
    <group ref={gref}>
      {items.map((it, i) => (
        <mesh key={i} position={it.p} rotation={[0, it.p[2] > 0 ? 0 : Math.PI, it.rot]} renderOrder={2}>
          <planeGeometry args={it.s} />
          <meshBasicMaterial color={it.dark ? C.ink : C.shadeGrey} transparent opacity={it.dark ? 0.45 : 0.8} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- light streaks behind a fast truck */

function Streaks({ gref, len = 4, off = 1.8 }: { gref: MutableRefObject<THREE.Group | null>; len?: number; off?: number }) {
  const lines: [number, number, number][] = [
    [0, 0.5, 0.0],
    [-0.4, 1.0, 0.5],
    [-0.9, 0.35, -0.55],
    [-0.2, 1.6, -0.2],
  ];
  return (
    <group ref={gref} visible={false}>
      {lines.map(([dx, y, z], i) => (
        <mesh key={i} position={[-(off + len / 2) + dx, y, z]} renderOrder={6}>
          <planeGeometry args={[len - i * 0.5, 0.05]} />
          <meshBasicMaterial color={C.white} transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- the route of the van */

function ribbon(track: Track, width: number, n = 160, y = 0.1) {
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    track.curve.getPointAt(f, p);
    track.curve.getTangentAt(f, t);
    const sx = (-t.z * width) / 2;
    const sz = (t.x * width) / 2;
    const l = Math.hypot(t.x, t.z) || 1;
    pos.push(p.x + sx / l, y, p.z + sz / l, p.x - sx / l, y, p.z - sz / l);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
const ROUTE_N = 200;

function Route({ clock }: { clock: StoryClock }) {
  const done = useRef<THREE.Mesh>(null);
  const all = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const geos = useMemo(() => ({ line: ribbon(VAN_ROUTE, 2.6, ROUTE_N, 0.12), wide: ribbon(VAN_ROUTE, 6.4, ROUTE_N, 0.11), faint: ribbon(VAN_ROUTE, 1.2, ROUTE_N, 0.1) }), []);
  useFrame(() => {
    const u = uOf(clock);
    const p = routeProgress(u);
    const show = smooth(seg(u, 10.9, 11.1)) * (1 - smooth(seg(u, 12.0, 12.5)));
    const n = Math.floor(p * ROUTE_N);
    geos.line.setDrawRange(0, n * 6);
    geos.wide.setDrawRange(0, n * 6);
    if (done.current) done.current.visible = show > 0.01 && n > 0;
    if (halo.current) halo.current.visible = show > 0.01 && n > 0;
    if (all.current) {
      all.current.visible = show > 0.01;
      (all.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * show;
    }
  });
  return (
    <group>
      <mesh ref={all} geometry={geos.faint} renderOrder={3}>
        <meshBasicMaterial color={C.tonedTextGrey} transparent opacity={0.5} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={halo} geometry={geos.wide} renderOrder={4}>
        <meshBasicMaterial color={C.white} transparent opacity={0.8} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={done} geometry={geos.line} renderOrder={5}>
        <meshBasicMaterial color={C.ink} transparent opacity={1} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------- the stage of the four zones */

const zx = ZONES.xs;
const zz = ZONES.z;
const padGeo = new THREE.CircleGeometry(3.7, 48);
const padRing = new THREE.RingGeometry(3.62, 3.72, 64);

function MiniRack({ x, z, bays = 1, levels = 3, rot = 0, h = 4.5, fill = [0, 1] }: { x: number; z: number; bays?: number; levels?: number; rot?: number; h?: number; fill?: number[] }) {
  const lv = [0.12, 1.6, 3.08];
  const len = bays * 2.8;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {[-len / 2, ...Array.from({ length: bays }, (_, i) => -len / 2 + (i + 1) * 2.8)].map((px) =>
        [-0.5, 0.5].map((pz) => <mesh key={`${px}${pz}`} geometry={box} material={W.steel} position={[px, h / 2, pz]} scale={[0.1, h, 0.1]} castShadow />),
      )}
      {lv.slice(1, levels).concat([h - 0.1]).map((y) =>
        [-0.5, 0.5].map((pz) => <mesh key={`${y}${pz}`} geometry={box} material={W.ink} position={[0, y - 0.08, pz]} scale={[len, 0.14, 0.07]} castShadow />),
      )}
      {lv.slice(0, levels).map((y, l) =>
        fill.includes(l)
          ? Array.from({ length: bays * 2 }, (_, i) => {
              const px = -len / 2 + 0.7 + i * 1.4;
              return (
                <group key={`${l}${i}`} position={[px, y, 0]}>
                  <mesh geometry={box} material={W.pallet} position={[0, 0.07, 0]} scale={[1.2, 0.14, 0.95]} castShadow />
                  <mesh geometry={box} material={W.carton} position={[0, 0.14 + 0.38, 0]} scale={[1.05, 0.76, 0.86]} castShadow />
                </group>
              );
            })
          : null,
      )}
    </group>
  );
}
const box = new THREE.BoxGeometry(1, 1, 1);

function ZoneStage({ clock }: { clock: StoryClock }) {
  const group = useRef<THREE.Group>(null);
  const pads = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const u = uOf(clock);
    const s = stageIn(u);
    const g = group.current;
    if (g) {
      g.visible = s > 0.002;
      g.scale.set(1, Math.max(s, 0.0001), 1);
    }
    const z = zoneAt(u);
    pads.current.forEach((p, i) => {
      if (!p) return;
      const a = zoneActive(i, z);
      p.scale.setScalar(0.9 + 0.1 * a);
      const ring = p.children[1] as THREE.Mesh;
      const disc = p.children[0] as THREE.Mesh;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.7 * a;
      (disc.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.4 * a;
    });
  });
  const zoneLabels = ['Dvorište', 'Regali', 'Utovar', 'Prolaz'];
  return (
    <group ref={group} visible={false}>
      <mesh geometry={box} material={W.road} position={[1.5, 0.05, zz + 1.5]} scale={[40, 0.1, 8.6]} receiveShadow />
      <mesh geometry={box} material={W.ink} position={[1.5, 0.05, zz + 5.82]} scale={[40, 0.1, 0.06]} />
      {zx.map((x, i) => (
        <group
          key={x}
          position={[x, 0.11, zz + 0.3]}
          ref={(g) => {
            pads.current[i] = g;
          }}
        >
          <mesh geometry={padGeo} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <meshBasicMaterial color={C.white} transparent opacity={0.6} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh geometry={padRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={2}>
            <meshBasicMaterial color={C.ink} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* zone 1, a pair of pallets and a stack in the yard */}
      {[0, 1].map((i) => (
        <group key={i} position={[zx[0] + 3.4 + i * 1.5, 0.1, zz + 1.6]}>
          <mesh geometry={box} material={W.pallet} position={[0, 0.07, 0]} scale={[1.2, 0.14, 1]} castShadow />
          <mesh geometry={box} material={W.carton} position={[0, 0.52, 0]} scale={[1.05, 0.76, 0.86]} castShadow />
        </group>
      ))}
      {/* zone 2, a rack bay for the reach truck */}
      <MiniRack x={zx[1] + 3.6} z={zz + 0.3} rot={Math.PI / 2} fill={[0, 1]} />
      {/* zone 3, a dock edge for the pallet truck */}
      <group position={[zx[2] + 3.9, 0.1, zz + 0.3]}>
        <mesh geometry={box} material={W.wall} position={[0, 0.55, 0]} scale={[3.2, 1.1, 2.8]} castShadow receiveShadow />
        <mesh geometry={box} material={W.ink} position={[-1.6, 0.9, 0]} scale={[0.14, 0.24, 2.8]} />
        <mesh geometry={box} material={W.carton} position={[0.6, 1.5, 0]} scale={[1.05, 0.76, 0.86]} castShadow />
      </group>
      {/* zone 4, an aisle between two rack rows for the order picker */}
      <MiniRack x={zx[3] + 0.1} z={zz + 0.3} rot={Math.PI / 2} bays={2} fill={[0, 1, 2]} />
      <MiniRack x={zx[3] + 3.5} z={zz + 0.3} rot={Math.PI / 2} bays={2} fill={[0, 1, 2]} />
      {zx.map((x, i) => (
        <Label
          key={x}
          clock={clock}
          position={[x + (i === 3 ? 1.6 : 1.2), 5.2, zz + 0.3]}
          text={zoneLabels[i]}
          state={(u) => {
            const a = zoneActive(i, zoneAt(u));
            return { vis: stageIn(u) > 0.7 ? 1 : 0, on: a > 0.5 ? 1 : 0 };
          }}
        />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- the whole story */

export function Story({ clock }: { clock: StoryClock }) {
  const pose = useMemo(() => newPose(), []);
  const pose2 = useMemo(() => newPose(), []);
  const tp = useMemo(() => newPose(), []);

  const gA = useRef<THREE.Group>(null);
  const aApi = useRef<ForkliftApi | null>(null);
  const gB = useRef<THREE.Group>(null);
  const bApi = useRef<ForkliftApi | null>(null);
  const bLoad = useRef<THREE.Group>(null);
  const gT = useRef<THREE.Group>(null);
  const tApi = useRef<TruckApi | null>(null);
  const tStreak = useRef<THREE.Group | null>(null);
  const gC = useRef<THREE.Group>(null);
  const cApi = useRef<ForkliftApi | null>(null);
  const cLoad = useRef<THREE.Group>(null);
  const cScuff = useRef<THREE.Group | null>(null);
  const cStreak = useRef<THREE.Group | null>(null);
  const gV = useRef<THREE.Group>(null);
  const gR = useRef<THREE.Group>(null);
  const rApi = useRef<ReachApi | null>(null);
  const rLoad = useRef<THREE.Group>(null);
  const gP = useRef<THREE.Group>(null);
  const pApi = useRef<PalletTruckApi | null>(null);
  const gO = useRef<THREE.Group>(null);
  const oApi = useRef<PickerApi | null>(null);
  const pSeal = useRef<THREE.Group | null>(null);
  const flash = useRef<THREE.Mesh>(null);
  const warn = useRef<THREE.Group | null>(null);
  const warnRing = useRef<THREE.Mesh | null>(null);
  const m1 = useRef<THREE.Group | null>(null);
  const m2 = useRef<THREE.Group | null>(null);
  // K1 figures
  const k1 = useRef<(THREE.Group | null)[]>([]);
  const k1Fork1 = useRef<ForkliftApi | null>(null);
  const k1Fork2 = useRef<ForkliftApi | null>(null);
  const k1Reach = useRef<ReachApi | null>(null);
  const k1Seal = useRef<THREE.Group | null>(null);
  const k1Pads = useRef<(THREE.Mesh | null)[]>([]);
  const gP3 = useRef<THREE.Group>(null);
  const pApi3 = useRef<PalletTruckApi | null>(null);

  const paintC = useMemo(() => new THREE.MeshPhysicalMaterial({ color: C.tonedTextGrey, roughness: 0.85, metalness: 0.05, clearcoat: 0, clearcoatRoughness: 0.5 }), []);
  const walk1 = useMemo(() => new Track([[-10.4, -16.2], [-8.8, -15.2], [-7.2, -14.6]]), []);
  const walk2 = useMemo(() => new Track([[-10.2, -16.4], [-7.4, -16.9], [-3.2, -16.8]]), []);

  useLayoutEffect(() => {
    // the carried pallets start hidden
    [bLoad, cLoad, rLoad].forEach((r) => {
      if (r.current) r.current.visible = false;
    });
  }, []);

  useFrame(() => {
    const u = uOf(clock);

    /* A, the customer's forklift */
    {
      const s = stateA(u, pose);
      pose.y += hallY(pose.x, pose.z);
      place(gA.current, pose);
      if (gA.current) gA.current.visible = s.vis;
      setPose(aApi.current, { lift: s.lift, roll: s.roll });
    }

    /* the delivery truck and B inside and out */
    {
      const t = stateT(u, tp);
      place(gT.current, tp);
      if (gT.current) gT.current.visible = t.vis;
      const ph = truckPhase(u);
      if (tApi.current) {
        tApi.current.ramp.rotation.z = lerp(-Math.PI / 2, 0.218, ph.rampOpen);
        spin(tApi.current.wheels, t.roll);
      }
      if (tStreak.current) {
        const sp = u < 2.5 ? 1 - seg(u, 2.2, 2.48) : seg(u, 3.78, 3.95);
        tStreak.current.visible = t.vis && sp > 0.02 && (u < 2.5 || u > 3.7);
        tStreak.current.scale.set(1 + sp, 1, 1);
      }
      const b = stateB(u, tp, pose2);
      place(gB.current, pose2);
      if (gB.current) gB.current.visible = b.vis;
      setPose(bApi.current, { lift: b.lift, roll: b.roll });
      if (bLoad.current) bLoad.current.visible = b.load;
    }

    /* C, renewed, serviced, kept in work */
    {
      const c = stateC(u, pose);
      pose.y += hallY(pose.x, pose.z);
      place(gC.current, pose);
      if (gC.current) gC.current.visible = c.vis;
      const p = renewProgress(u);
      paintC.color.copy(WORN).lerp(FRESH, p);
      paintC.roughness = lerp(0.85, 0.32, p);
      paintC.clearcoat = lerp(0, 0.7, p);
      paintC.metalness = lerp(0.05, 0.08, p);
      if (cScuff.current) {
        cScuff.current.visible = p < 0.99;
        cScuff.current.scale.set(1, 1, 1);
        cScuff.current.children.forEach((m, i) => {
          const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial;
          const gone = clamp01(p * 7 - (i % 7) * 0.9 - 0.2);
          mat.opacity = (m.userData.o ??= mat.opacity) * (1 - gone);
        });
      }
      let ld = c.lift;
      let carry = false;
      if (u >= 7.8 && u < 8.55) {
        const w = seg(u, 7.9, 8.5);
        ld = 0.1 + 1.2 * Math.sin(w * Math.PI);
        carry = w > 0.04 && w < 0.96;
      }
      setPose(cApi.current, { lift: ld, roll: c.roll });
      if (cLoad.current) cLoad.current.visible = carry;
      if (cStreak.current) {
        const sp = 1 - seg(u, 10.1, 10.48);
        cStreak.current.visible = u > 10 && u < 10.5 && sp > 0.02;
        cStreak.current.scale.set(0.6 + sp, 1, 1);
      }
    }

    /* the seal that stamps C in P3 */
    {
      const s = sealState(u);
      const g = pSeal.current;
      if (g) {
        g.visible = s.vis && s.s > 0.01;
        g.position.set(pose.x - 0.2, pose.y + s.y + 0.9, pose.z);
        g.scale.setScalar(Math.max(0.001, s.s));
      }
      const f = flash.current;
      if (f) {
        f.visible = s.flash > 0;
        f.position.set(pose.x - 0.9, 1.0, pose.z);
        f.scale.setScalar(0.6 + s.flash * 3.2);
        (f.material as THREE.MeshBasicMaterial).opacity = (1 - s.flash) * 0.85;
      }
    }

    /* the warning over the stopped truck in S1 and S2 */
    {
      const on = smooth(seg(u, 10.5, 10.66)) * (1 - smooth(seg(u, 11.55, 11.8)));
      const g = warn.current;
      if (g) {
        g.visible = on > 0.01;
        g.position.set(STOP.x, 3.7 + Math.sin(u * 9) * 0.06, STOP.z);
        g.scale.setScalar(Math.max(0.001, on));
      }
      const r = warnRing.current;
      if (r) {
        r.visible = on > 0.01;
        r.position.set(STOP.x, 0.12, STOP.z);
        const ph = (u * 2.2) % 1;
        r.scale.setScalar(2.2 + ph * 2.8);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.4 * on;
      }
    }

    /* the service van */
    {
      const gv = gV.current;
      if (gv) {
        const p = routeProgress(u);
        if (p <= 0) place(gv, VAN_BAY);
        else {
          VAN_ROUTE.at(p * VAN_ROUTE.len, pose);
          pose.y += hallY(pose.x, pose.z);
          place(gv, pose);
        }
        gv.visible = true;
      }
    }

    /* the mechanics */
    {
      const w1 = seg(u, 11.9, 12.1);
      const w2 = seg(u, 12.82, 13.0);
      const vis = u > 11.88 && u < 13.02;
      const place1 = (g: THREE.Group | null, tr: Track, side: number) => {
        if (!g) return;
        g.visible = vis;
        const walkIn = easeOut(w1);
        const walkOut = eio(w2);
        const s = tr.len * (walkIn * (1 - walkOut));
        tr.at(s, pose);
        // at work they face the truck, a lean in and out
        const work = smooth(seg(u, 12.08, 12.2)) * (1 - smooth(seg(u, 12.78, 12.84)));
        const sway = Math.sin(u * 14 + side) * 0.12 * work;
        g.position.set(pose.x + (side > 0 ? sway : 0), hallY(pose.x, pose.z), pose.z + (side < 0 ? sway : 0));
        g.rotation.y = lerp(pose.yaw, side > 0 ? Math.PI / 2 : -Math.PI / 2, work);
      };
      place1(m1.current, walk1, 1);
      place1(m2.current, walk2, -1);
    }

    /* zone vehicles */
    {
      const z = zoneAt(u);
      const st = stageIn(u);
      // reach truck at zone 2
      const a1 = zoneActive(1, z);
      const gr = gR.current;
      if (gr) {
        gr.visible = st > 0.002;
        const lift = 0.15 + 3.0 * smooth(seg(u, 8.36, 8.62)) * (1 - smooth(seg(u, 8.7, 8.78)) * 0.0);
        const reach = 0.8 * smooth(seg(u, 8.5, 8.62)) * (1 - smooth(seg(u, 8.62, 8.74)));
        gr.position.set(zx[1] - 0.2 + 0.0 * a1, 0.11 * st, zz + 0.3);
        gr.rotation.y = 0;
        setReach(rApi.current, { lift, reach, roll: u * 2 });
        if (rLoad.current) rLoad.current.visible = u > 8.3 && u < 8.74;
      }
      // pallet truck
      const gp = gP.current;
      if (gp) {
        gp.visible = st > 0.002;
        const a2 = zoneActive(2, z);
        gp.position.set(zx[2] - 0.6 + 1.0 * smooth(seg(u, 8.6, 8.78)), 0.11 * st, zz + 0.3);
        gp.rotation.set(0, 0, 0);
        setPalletTruck(pApi.current, { lift: 0.03 + 0.05 * a2, roll: u * 2 });
      }
      const g3 = gP3.current;
      if (g3) {
        g3.visible = u > 8.9 && u < 10.1;
        const s3 = eio(seg(u, 9.25, 9.96)) * PT_V3.len;
        PT_V3.at(s3, pose);
        place(g3, pose);
        setPalletTruck(pApi3.current, { lift: 0.04 + 0.1 * smooth(seg(u, 9.3, 9.4)) * (1 - smooth(seg(u, 9.9, 9.97))), roll: s3 });
      }
      // order picker at zone 4
      const go = gO.current;
      if (go) {
        go.visible = st > 0.002;
        const lift = 0.2 + 2.6 * smooth(seg(u, 8.76, 8.98));
        go.position.set(zx[3] + 1.8, 0.11 * st, zz + 2.9 - 1.8 * smooth(seg(u, 8.7, 8.95)));
        go.rotation.set(0, Math.PI / 2, 0);
        setPicker(oApi.current, { lift, roll: u * 2 });
      }
    }

    /* K1, four figures grow on their pads, one tag at a time */
    {
      const n = K1_N(u);
      const on = u >= 13 ? 1 : 0;
      K1_PADS.forEach((_pad, i) => {
        const g = k1.current[i];
        if (!g) return;
        const appear = smooth(seg(u, 12.7, 12.95)) * (i < n ? 1 : 0);
        const t = i === 0 ? appear : on * smooth((clamp01(u - 13) - (i === 1 ? 0.2 : i === 2 ? 0.5 : 0.8) + 0.06) / 0.12);
        g.visible = t > 0.01;
        g.scale.setScalar(Math.max(0.001, t) * 3.2);
        const pd = k1Pads.current[i];
        if (pd) pd.visible = t > 0.01;
      });
      setPose(k1Fork1.current, { lift: 0.1 });
      setPose(k1Fork2.current, { lift: 0.1 });
      setReach(k1Reach.current, { lift: 0.15 });
      if (k1Seal.current) k1Seal.current.position.y = 3.4 + Math.sin(u * 5) * 0.08;
    }
  }, -1);

  const labelsLine = LINE.xs;

  return (
    <group>
      {/* hall and dock */}
      <Racks clock={clock} />
      <Dock />
      <Pile clock={clock} />
      <Pile
        clock={clock}
        items={BACKLOG}
        from={[0, 1.2, -13]}
        state={(u, i) => {
          const s = smooth(seg(u, 9.8 + i * 0.02, 10.0 + i * 0.02)) * (1 - smooth(seg(u, 11.6 + i * 0.02, 11.9 + i * 0.02)));
          return { vis: s, hop: 0 };
        }}
      />
      <RenewLine clock={clock} />
      <ZoneStage clock={clock} />
      <PitRig clock={clock} />
      <Route clock={clock} />

      {/* actors */}
      <group ref={gA} visible={false}>
        <Forklift apiRef={aApi} lift={0.1} />
      </group>
      <group ref={gT} visible={false}>
        <DeliveryTruck apiRef={tApi} />
        <Streaks gref={tStreak} len={5} off={4} />
      </group>
      <group ref={gB} visible={false}>
        <Forklift apiRef={bApi} lift={0.1}>
          <group ref={bLoad} visible={false}>
            <Pallet position={[1.74, 0.05, 0]} />
          </group>
        </Forklift>
      </group>
      <group ref={gC} visible={false}>
        <Forklift apiRef={cApi} paint={paintC} lift={0.1}>
          <group ref={cLoad} visible={false}>
            <Pallet position={[1.74, 0.05, 0]} />
          </group>
        </Forklift>
        <Scuffs gref={cScuff} />
        <Streaks gref={cStreak} len={4} />
      </group>
      <group ref={gV}>
        <VanModel />
      </group>
      <group ref={m1} visible={false}>
        <Person />
      </group>
      <group ref={m2} visible={false}>
        <Person />
      </group>
      <group ref={gR} visible={false}>
        <ReachTruck apiRef={rApi}>
          <group ref={rLoad} visible={false}>
            <Pallet position={[0.7, 0.03, 0]} />
          </group>
        </ReachTruck>
      </group>
      <group ref={gP} visible={false}>
        <PalletTruck apiRef={pApi}>
          <Pallet position={[0.85, 0.1, 0]} />
        </PalletTruck>
      </group>
      <group ref={gP3} visible={false}>
        <PalletTruck apiRef={pApi3}>
          <Pallet position={[0.85, 0.1, 0]} />
        </PalletTruck>
      </group>
      <group ref={gO} visible={false}>
        <OrderPicker apiRef={oApi} />
      </group>

      <Seal gref={pSeal} />
      <mesh ref={flash} rotation={[0, Math.PI / 2, 0]} visible={false} renderOrder={8}>
        <ringGeometry args={[0.8, 1, 40]} />
        <meshBasicMaterial color={C.white} transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <Warn gref={warn} ring={warnRing} />

      {/* labels of the line, one disc per station */}
      {labelsLine.map((x, i) => (
        <Label
          key={x}
          clock={clock}
          kind="disc"
          position={[x, 5.7, LINE.z]}
          text={String(i + 1)}
          state={(u) => {
            const vis = smooth(seg(u, 4.7, 5.0)) * (1 - smooth(seg(u, 6.9, 7.05)));
            const on = renewProgress(u) * 7 > i + 0.5 ? 1 : 0;
            return { vis: u < 4.6 ? 0 : vis, on };
          }}
        />
      ))}
      {/* pins of the route */}
      <Label clock={clock} position={[VAN_BAY.x, 6.6, VAN_BAY.z]} text="Vrčin" leader={0} state={(u) => ({ vis: smooth(seg(u, 10.95, 11.1)) * (1 - smooth(seg(u, 11.85, 11.98))), on: 1 })} />
      <Label clock={clock} position={[-12.6, 8.2, -9]} text="Vaše skladište" state={(u) => ({ vis: smooth(seg(u, 10.95, 11.1)) * (1 - smooth(seg(u, 11.85, 11.98))), on: 1 })} />

      {/* K1 figures */}
      {K1_PADS.map((pad, i) => (
        <group key={pad.id} position={[pad.x, 0, pad.z]}>
          <mesh ref={(m) => { k1Pads.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]} visible={false} renderOrder={2}>
            <circleGeometry args={[6.6, 48]} />
            <meshBasicMaterial color={C.white} transparent opacity={0.75} depthWrite={false} toneMapped={false} />
          </mesh>
          <group ref={(g) => { k1.current[i] = g; }} visible={false}>
            {i === 0 && <Forklift apiRef={k1Fork1} lift={0.1} />}
            {i === 1 && <ReachTruck apiRef={k1Reach} />}
            {i === 2 && (
              <>
                <Forklift apiRef={k1Fork2} lift={0.1} />
                <Seal gref={k1Seal} />
              </>
            )}
            {i === 3 && <VanModel />}
          </group>
          <Label
            clock={clock}
            position={[0, 14.5, 0]}
            text={pad.label}
            leader={44}
            state={(u) => {
              const t = clamp01(u - 13);
              const gate = i === 0 ? 0 : i === 1 ? 0.2 : i === 2 ? 0.5 : 0.8;
              return { vis: u >= 13 ? smooth((t - gate + 0.06) / 0.12) : 0, on: 1 };
            }}
          />
        </group>
      ))}

    </group>
  );
}
