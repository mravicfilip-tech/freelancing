// The trucks the shared kit and variant 4 do not have, built the same way as the shared Linde
// forklift, in metres, nose along +x, wheels on y = 0, red only on the rear shell and counterweight,
// charcoal frame, a grey side panel. The delivery truck carries the Ekotehnika name in white on grey.
import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { M } from '../../../r3f/materials';
import { Forklift, type ForkliftApi } from '../../../r3f/Forklift';
import { W, vanSideTexture } from '../../../variants/v4/look';
import { VanModel } from '../../../variants/v4/models';

const box = new THREE.BoxGeometry(1, 1, 1);

// A box mesh from a centre and a size, so the models read like a parts list
function B({ p, s, m, cast = true, r }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; cast?: boolean; r?: [number, number, number] }) {
  return <mesh geometry={box} material={m} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow />;
}

function Tyre({ r, w, p, m = M.rubber, hub = true, roll }: { r: number; w: number; p: [number, number, number]; m?: THREE.Material; hub?: boolean; roll?: (g: THREE.Group) => void }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (ref.current && roll) roll(ref.current);
  }, [roll]);
  return (
    <group ref={ref} position={p}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, w, 16]} />
      </mesh>
      {hub && (
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steelLight}>
          <cylinderGeometry args={[r * 0.55, r * 0.55, w * 1.02, 12]} />
        </mesh>
      )}
    </group>
  );
}

export type Rolling = { g: THREE.Group; r: number }[];
export const spin = (w: Rolling, dist: number) => w.forEach(({ g, r }) => (g.rotation.z = -dist / r));

/* ----------------------------------------------------------------- delivery truck */

export type TruckApi = { root: THREE.Group; ramp: THREE.Group; wheels: Rolling };
// Box floor top is 1.06 above the ground. Origin at the middle of the floor, the cab ahead (+x),
// the ramp hinged at the rear edge and folding up as a tail gate.
export const TRUCK = { floor: 1.06, rear: -3.7, rampLen: 4.9 };

export function DeliveryTruck({ apiRef, children }: { apiRef: MutableRefObject<TruckApi | null>; children?: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const ramp = useRef<THREE.Group>(null);
  const wheels = useRef<Rolling>([]);
  const reg = (r: number) => (g: THREE.Group) => {
    if (!wheels.current.some((w) => w.g === g)) wheels.current.push({ g, r });
  };
  useLayoutEffect(() => {
    if (root.current && ramp.current) apiRef.current = { root: root.current, ramp: ramp.current, wheels: wheels.current };
  }, [apiRef]);
  const decal = useMemo(() => new THREE.MeshStandardMaterial({ map: vanSideTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }), []);
  const F = TRUCK.floor;
  const stakes = [-3.3, -1.65, 0, 1.65, 3.3];
  return (
    <group ref={root}>
      {/* chassis rails and the underrun bar */}
      <B p={[0.9, 0.62, 0.62]} s={[9.2, 0.22, 0.16]} m={M.black} />
      <B p={[0.9, 0.62, -0.62]} s={[9.2, 0.22, 0.16]} m={M.black} />
      <B p={[-3.85, 0.5, 0]} s={[0.12, 0.12, 2.2]} m={M.black} />
      {/* floor and the bulkhead behind the cab */}
      <B p={[0, F - 0.08, 0]} s={[7.5, 0.16, 2.5]} m={W.clad} />
      <B p={[3.58, F + 1.2, 0]} s={[0.14, 2.4, 2.5]} m={W.wall} />
      {/* side boards in grey with the company name, open above them like a flatbed cutaway */}
      {[1, -1].map((s) => (
        <group key={s}>
          <B p={[0, F + 0.3, s * 1.2]} s={[7.5, 0.6, 0.1]} m={M.cowl} />
          <B p={[0, F + 0.62, s * 1.2]} s={[7.5, 0.06, 0.14]} m={M.stripe} />
          <mesh position={[-0.2, F + 0.3, s * 1.256]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={decal}>
            <planeGeometry args={[4.5, 0.46]} />
          </mesh>
          {stakes.map((x) => (
            <B key={x} p={[x, F + 1.1, s * 1.2]} s={[0.07, 1.1, 0.07]} m={M.black} />
          ))}
          <B p={[0, F + 1.62, s * 1.2]} s={[7.1, 0.06, 0.07]} m={M.black} />
        </group>
      ))}
      {/* rear frame of the cutaway */}
      {[1, -1].map((s) => (
        <B key={s} p={[-3.6, F + 1.2, s * 1.2]} s={[0.1, 2.4, 0.1]} m={M.black} />
      ))}
      <B p={[-3.6, F + 2.38, 0]} s={[0.1, 0.1, 2.5]} m={M.black} />
      {/* cab, white with a dark window, grey bumper */}
      <RoundedBox args={[2.3, 1.9, 2.4]} radius={0.16} smoothness={3} position={[4.8, F + 0.55, 0]} material={W.wall} castShadow receiveShadow />
      <RoundedBox args={[0.9, 0.95, 2.44]} radius={0.12} smoothness={2} position={[5.45, F + 0.8, 0]} material={M.glass} />
      <RoundedBox args={[0.78, 0.9, 2.46]} radius={0.1} smoothness={2} position={[4.6, F + 0.82, 0]} material={M.glass} />
      <RoundedBox args={[0.34, 0.5, 2.5]} radius={0.1} smoothness={2} position={[6.02, F - 0.55, 0]} material={M.black} />
      <RoundedBox args={[0.12, 0.34, 2.46]} radius={0.05} position={[5.98, F + 0.1, 0]} material={W.clad} />
      {[0.8, -0.8].map((z) => (
        <mesh key={z} position={[5.98, F - 0.12, z]} material={M.lamp}>
          <boxGeometry args={[0.06, 0.16, 0.4]} />
        </mesh>
      ))}
      <RoundedBox args={[2.3, 0.14, 2.42]} radius={0.05} position={[4.8, F + 1.52, 0]} material={W.clad} />
      {/* wheels, a twin rear axle and the front axle, arches above them */}
      {[
        [-2.4, 0.5],
        [-1.0, 0.5],
        [4.9, 0.5],
      ].map(([x, r]) =>
        [1, -1].map((s) => <Tyre key={`${x}${s}`} r={r} w={0.36} p={[x, r, s * 1.12]} roll={reg(r)} />),
      )}
      {[-2.4, -1.0, 4.9].map((x) => (
        <B key={x} p={[x, 1.02, 0]} s={[1.05, 0.08, 2.1]} m={M.black} cast={false} />
      ))}
      {/* the ramp, hinged at the rear floor edge */}
      <group ref={ramp} position={[TRUCK.rear, F, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <B p={[-TRUCK.rampLen / 2, -0.03, 0]} s={[TRUCK.rampLen, 0.07, 1.5]} m={M.black} />
        <B p={[-TRUCK.rampLen / 2, 0.005, 0]} s={[TRUCK.rampLen, 0.012, 1.5]} m={M.steel} cast={false} />
        {[0.72, -0.72].map((z) => (
          <B key={z} p={[-TRUCK.rampLen / 2, 0.04, z]} s={[TRUCK.rampLen, 0.08, 0.06]} m={M.steelLight} cast={false} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <B key={i} p={[-0.3 - i * 0.4, 0.04, 0]} s={[0.04, 0.025, 1.3]} m={M.steelLight} cast={false} />
        ))}
      </group>
      {children}
    </group>
  );
}

/* ----------------------------------------------------------------- reach truck */

export type ReachApi = { root: THREE.Group; carriage: THREE.Group; inner: THREE.Group; wheels: Rolling; anchor: THREE.Object3D };
export function setReach(a: ReachApi | null, { lift = 0.15, reach = 0, roll = 0 }: { lift?: number; reach?: number; roll?: number }) {
  if (!a) return;
  a.carriage.position.set(0.62 + reach, lift, 0);
  a.inner.position.y = lift * 0.5;
  spin(a.wheels, roll);
}

export function ReachTruck({ apiRef, paint = M.paint, children }: { apiRef: MutableRefObject<ReachApi | null>; paint?: THREE.Material; children?: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const carriage = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const wheels = useRef<Rolling>([]);
  const reg = (r: number) => (g: THREE.Group) => {
    if (!wheels.current.some((w) => w.g === g)) wheels.current.push({ g, r });
  };
  useLayoutEffect(() => {
    if (root.current && carriage.current && inner.current && anchor.current) {
      apiRef.current = { root: root.current, carriage: carriage.current, inner: inner.current, wheels: wheels.current, anchor: anchor.current };
      setReach(apiRef.current, {});
    }
  }, [apiRef]);
  const MAST = 4.3;
  return (
    <group ref={root}>
      {/* rear shell, the one red part, with its grey side insert and stripe */}
      <RoundedBox args={[0.98, 0.98, 1.04]} radius={0.12} smoothness={3} position={[-0.95, 0.72, 0]} material={paint} castShadow receiveShadow />
      <B p={[-1.45, 0.9, 0]} s={[0.04, 0.06, 0.7]} m={M.beacon} cast={false} />
      {[0.53, -0.53].map((z) => (
        <group key={z}>
          <RoundedBox args={[0.5, 0.3, 0.03]} radius={0.015} position={[-0.9, 0.62, z]} material={M.cowl} />
          <RoundedBox args={[0.5, 0.022, 0.034]} radius={0.008} position={[-0.9, 0.8, z]} material={M.stripe} />
        </group>
      ))}
      {/* chassis, operator floor, stabiliser legs under the load */}
      <B p={[-0.1, 0.3, 0]} s={[1.7, 0.16, 0.96]} m={M.black} />
      <B p={[-0.1, 0.4, 0]} s={[1.5, 0.03, 0.9]} m={M.steel} cast={false} />
      {[0.55, -0.55].map((z) => (
        <group key={z}>
          <B p={[0.85, 0.2, z]} s={[1.9, 0.18, 0.15]} m={M.black} />
          <B p={[0.85, 0.3, z]} s={[1.9, 0.02, 0.15]} m={M.steel} cast={false} />
          <Tyre r={0.1} w={0.12} p={[1.74, 0.1, z]} hub={false} roll={reg(0.1)} />
        </group>
      ))}
      <Tyre r={0.24} w={0.24} p={[-0.95, 0.24, 0]} roll={reg(0.24)} />
      {/* seat and the armrest control */}
      <RoundedBox args={[0.42, 0.12, 0.46]} radius={0.04} position={[-0.3, 0.62, 0]} material={M.black} castShadow />
      <RoundedBox args={[0.1, 0.52, 0.46]} radius={0.04} position={[-0.5, 0.95, 0]} rotation={[0, 0, 0.1]} material={M.black} castShadow />
      <RoundedBox args={[0.3, 0.08, 0.1]} radius={0.03} position={[-0.1, 0.9, 0.32]} material={M.black} />
      <mesh position={[0.05, 1.05, 0.32]} rotation={[0, 0, 0.3]} material={M.black}>
        <cylinderGeometry args={[0.025, 0.03, 0.28, 8]} />
      </mesh>
      {/* overhead guard */}
      {[0.46, -0.46].map((z) => (
        <group key={z}>
          <B p={[-0.62, 1.25, z]} s={[0.06, 1.9, 0.06]} m={M.black} />
          <B p={[0.3, 1.2, z]} s={[0.06, 1.8, 0.06]} m={M.black} />
          <B p={[-0.16, 2.18, z]} s={[1.0, 0.07, 0.08]} m={M.black} />
        </group>
      ))}
      {[-0.5, -0.2, 0.1].map((x) => (
        <B key={x} p={[x, 2.2, 0]} s={[0.05, 0.03, 0.92]} m={M.black} cast={false} />
      ))}
      {/* the mast, fixed outer channels and an inner stage that rises with the carriage */}
      {[0.32, -0.32].map((z) => (
        <B key={z} p={[0.5, MAST / 2 + 0.15, z]} s={[0.11, MAST, 0.1]} m={M.black} />
      ))}
      {[0.3, 1.6, 2.9, MAST + 0.1].map((y) => (
        <B key={y} p={[0.5, y, 0]} s={[0.1, 0.1, 0.74]} m={M.steel} />
      ))}
      <group ref={inner}>
        {[0.26, -0.26].map((z) => (
          <B key={z} p={[0.6, 2.0, z]} s={[0.08, 3.9, 0.07]} m={M.steel} />
        ))}
        <B p={[0.6, 3.9, 0]} s={[0.08, 0.08, 0.6]} m={M.steel} />
      </group>
      {/* reach carriage, a slide arm and the fork heel */}
      <group ref={carriage} position={[0.62, 0.15, 0]}>
        {[0.2, -0.2].map((z) => (
          <B key={z} p={[-0.06, 0.45, z]} s={[0.24, 0.04, 0.05]} m={M.steelLight} />
        ))}
        <B p={[0.04, 0.52, 0]} s={[0.07, 0.95, 0.8]} m={M.black} />
        {[-0.3, -0.15, 0, 0.15, 0.3].map((z) => (
          <B key={z} p={[0.09, 0.78, z]} s={[0.03, 0.5, 0.03]} m={M.black} cast={false} />
        ))}
        {[0.3, -0.3].map((z) => (
          <B key={z} p={[0.6, 0.0, z]} s={[1.15, 0.045, 0.12]} m={M.fork} />
        ))}
        <object3D ref={anchor} position={[0.7, 0.03, 0]} />
        {children}
      </group>
    </group>
  );
}

/* ----------------------------------------------------------------- electric pallet truck */

export type PalletTruckApi = { root: THREE.Group; blades: THREE.Group; wheels: Rolling; anchor: THREE.Object3D };
export function setPalletTruck(a: PalletTruckApi | null, { lift = 0.02, roll = 0 }: { lift?: number; roll?: number }) {
  if (!a) return;
  a.blades.position.y = lift;
  spin(a.wheels, roll);
}

// An MT15 C style truck, a low red power unit at the heel of two blades, the tiller rising behind it.
export function PalletTruck({ apiRef, paint = M.paint, children }: { apiRef: MutableRefObject<PalletTruckApi | null>; paint?: THREE.Material; children?: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const blades = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const wheels = useRef<Rolling>([]);
  const reg = (r: number) => (g: THREE.Group) => {
    if (!wheels.current.some((w) => w.g === g)) wheels.current.push({ g, r });
  };
  useLayoutEffect(() => {
    if (root.current && blades.current && anchor.current) {
      apiRef.current = { root: root.current, blades: blades.current, wheels: wheels.current, anchor: anchor.current };
      setPalletTruck(apiRef.current, {});
    }
  }, [apiRef]);
  return (
    <group ref={root}>
      {/* power unit, red shell with a grey panel and an ink cap */}
      <RoundedBox args={[0.58, 0.62, 0.66]} radius={0.1} smoothness={3} position={[-0.12, 0.45, 0]} material={paint} castShadow receiveShadow />
      <RoundedBox args={[0.62, 0.07, 0.7]} radius={0.03} position={[-0.12, 0.8, 0]} material={M.black} castShadow />
      {[0.34, -0.34].map((z) => (
        <RoundedBox key={z} args={[0.34, 0.24, 0.025]} radius={0.012} position={[-0.02, 0.5, z]} material={M.cowl} />
      ))}
      <B p={[-0.12, 0.17, 0]} s={[0.6, 0.08, 0.66]} m={M.black} />
      <Tyre r={0.125} w={0.14} p={[-0.1, 0.125, 0]} roll={reg(0.125)} />
      {/* tiller, an angled arm with a grip bar and two buttons */}
      <group position={[-0.34, 0.75, 0]} rotation={[0, 0, 0.95]}>
        <B p={[0, 0.5, 0]} s={[0.05, 1.0, 0.05]} m={M.black} />
      </group>
      <group position={[-0.34 - Math.sin(0.95) * 1.0, 0.75 + Math.cos(0.95) * 1.0, 0]}>
        <RoundedBox args={[0.1, 0.1, 0.36]} radius={0.04} material={M.black} castShadow />
        <B p={[0.04, 0.02, 0.12]} s={[0.04, 0.03, 0.04]} m={M.white} cast={false} />
        <B p={[0.04, 0.02, -0.12]} s={[0.04, 0.03, 0.04]} m={M.stripe} cast={false} />
      </group>
      {/* the two blades with a load wheel at each tip */}
      <group ref={blades}>
        {[0.27, -0.27].map((z) => (
          <group key={z}>
            <B p={[0.78, 0.075, z]} s={[1.15, 0.07, 0.16]} m={M.fork} />
            <B p={[1.39, 0.045, z]} s={[0.1, 0.045, 0.15]} m={M.fork} />
          </group>
        ))}
        <B p={[0.22, 0.1, 0]} s={[0.1, 0.1, 0.7]} m={M.steel} />
        <object3D ref={anchor} position={[0.8, 0.11, 0]} />
        {children}
      </group>
      {[0.27, -0.27].map((z) => (
        <Tyre key={z} r={0.045} w={0.08} p={[1.3, 0.045, z]} hub={false} roll={reg(0.045)} />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- order picker */

export type PickerApi = { root: THREE.Group; cab: THREE.Group; wheels: Rolling; anchor: THREE.Object3D };
export function setPicker(a: PickerApi | null, { lift = 0.2, roll = 0 }: { lift?: number; roll?: number }) {
  if (!a) return;
  a.cab.position.y = lift;
  spin(a.wheels, roll);
}

// A man up order picker, the operator's cab rises with the forks on one mast.
export function OrderPicker({ apiRef, paint = M.paint, children }: { apiRef: MutableRefObject<PickerApi | null>; paint?: THREE.Material; children?: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const cab = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const wheels = useRef<Rolling>([]);
  const reg = (r: number) => (g: THREE.Group) => {
    if (!wheels.current.some((w) => w.g === g)) wheels.current.push({ g, r });
  };
  useLayoutEffect(() => {
    if (root.current && cab.current && anchor.current) {
      apiRef.current = { root: root.current, cab: cab.current, wheels: wheels.current, anchor: anchor.current };
      setPicker(apiRef.current, {});
    }
  }, [apiRef]);
  const MAST = 4.6;
  return (
    <group ref={root}>
      <RoundedBox args={[1.0, 1.05, 1.1]} radius={0.12} smoothness={3} position={[-1.05, 0.78, 0]} material={paint} castShadow receiveShadow />
      {[0.56, -0.56].map((z) => (
        <group key={z}>
          <RoundedBox args={[0.5, 0.3, 0.03]} radius={0.015} position={[-1.0, 0.62, z]} material={M.cowl} />
          <RoundedBox args={[0.5, 0.022, 0.034]} radius={0.008} position={[-1.0, 0.8, z]} material={M.stripe} />
        </group>
      ))}
      <B p={[-1.57, 0.95, 0]} s={[0.04, 0.06, 0.7]} m={M.beacon} cast={false} />
      <Tyre r={0.24} w={0.24} p={[-1.0, 0.24, 0]} roll={reg(0.24)} />
      {[0.52, -0.52].map((z) => (
        <group key={z}>
          <B p={[0.55, 0.19, z]} s={[2.4, 0.16, 0.15]} m={M.black} />
          <B p={[0.55, 0.28, z]} s={[2.4, 0.02, 0.15]} m={M.steel} cast={false} />
          <Tyre r={0.1} w={0.12} p={[1.68, 0.1, z]} hub={false} roll={reg(0.1)} />
        </group>
      ))}
      {/* mast */}
      {[0.3, -0.3].map((z) => (
        <B key={z} p={[0.1, MAST / 2 + 0.2, z]} s={[0.1, MAST, 0.09]} m={M.black} />
      ))}
      {[0.3, 1.5, 2.7, 3.9, MAST + 0.15].map((y) => (
        <B key={y} p={[0.1, y, 0]} s={[0.09, 0.09, 0.7]} m={M.steel} />
      ))}
      {/* the cab and the forks rise together */}
      <group ref={cab}>
        <B p={[-0.5, 0.3, 0]} s={[1.05, 0.08, 0.98]} m={M.black} />
        <B p={[-0.5, 0.345, 0]} s={[0.95, 0.012, 0.88]} m={M.steel} cast={false} />
        {[0.48, -0.48].map((z) => (
          <group key={z}>
            <B p={[-0.98, 0.9, z]} s={[0.05, 1.2, 0.05]} m={M.black} />
            <B p={[0.0, 0.9, z]} s={[0.05, 1.2, 0.05]} m={M.black} />
            <B p={[-0.5, 1.0, z]} s={[1.0, 0.05, 0.05]} m={M.black} />
            <B p={[-0.5, 0.62, z]} s={[1.0, 0.04, 0.04]} m={M.black} />
            <B p={[-0.5, 1.5, z]} s={[1.0, 0.07, 0.07]} m={M.black} />
            <B p={[-0.98, 1.55, z]} s={[0.05, 0.9, 0.05]} m={M.black} />
            <B p={[0.0, 1.55, z]} s={[0.05, 0.9, 0.05]} m={M.black} />
          </group>
        ))}
        <B p={[-0.5, 2.0, 0]} s={[1.05, 0.06, 1.05]} m={M.black} cast={false} />
        {[-0.8, -0.5, -0.2].map((x) => (
          <B key={x} p={[x, 1.96, 0]} s={[0.05, 0.03, 0.96]} m={M.steel} cast={false} />
        ))}
        <RoundedBox args={[0.2, 0.3, 0.3]} radius={0.05} position={[-0.1, 1.0, 0.0]} material={M.black} />
        {/* carriage and forks at the front of the cab */}
        <B p={[0.22, 0.35, 0]} s={[0.08, 0.6, 0.86]} m={M.black} />
        {[0.3, -0.3].map((z) => (
          <B key={z} p={[1.05, 0.06, z]} s={[1.6, 0.05, 0.12]} m={M.fork} />
        ))}
        <object3D ref={anchor} position={[1.1, 0.09, 0]} />
        {children}
      </group>
    </group>
  );
}

/* ----------------------------------------------------------------- people */

const skin = new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.7 });
const vest = new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.7 });
// A small figure in the miniature's style, an ink body, a grey vest and a light head
export function Person({ gref }: { gref?: MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={gref}>
      <mesh position={[0, 0.5, 0]} material={M.black} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={vest} castShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.55, 8]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} material={skin} castShadow>
        <icosahedronGeometry args={[0.16, 0]} />
      </mesh>
    </group>
  );
}

export { Forklift, VanModel };
export type { ForkliftApi };
