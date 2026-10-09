// The automation floor. A dark floor with dotted paths drawn on it and low red edged robots, the kind Linde
// calls C-Matic, carrying cartons out along the paths and bringing them back. Paths are laid out in screen
// metres, right and down from the middle of the frame, then mapped onto the floor seen from above.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Truck, type TruckApi } from './models';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { SceneProps } from '../../clock';
import { ATP } from './route';
import { K, ease, lerp, poolMaterial, range, uOf } from './kit';

type V = [number, number];
const CHAINS: V[][] = [
  [[-4.5, -6.2], [-10.4, 3.9], [-15.6, 13.2]],
  [[13.2, -4.2], [7.6, 5.4], [2.4, 13.6]],
  [[21.5, -1.5], [17.0, 6.3], [12.8, 13.0]],
  [[-20.5, -3.5], [-23.0, 2.4]],
  [[-3.5, 7.0], [-7.8, 14.2]],
];
type Seg = { a: V; b: V; len: number; yaw: number; dots: number; off: number };
const SEGS: Seg[] = CHAINS.flatMap((ch, ci) =>
  ch.slice(0, -1).map((a, i) => {
    const b = ch[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, len, yaw: Math.atan2((b[0] - a[0]) / len, (b[1] - a[1]) / len), dots: Math.floor(len / 0.8), off: (ci * 2 + i) * 0.17 };
  }),
);

const toWorld = (sx: number, sy: number, y: number): [number, number, number] => [ATP.x + sy, y, ATP.z - sx];
// Real Linde C-Matic models, scaled up so they read from above. Every second one is the HP with forks.
const ROBOT_SCALE = 3.2;
const KIND = (i: number): 'cmatic10' | 'cmatichp' => (i % 2 === 0 ? 'cmatic10' : 'cmatichp');

function Robot({ i, g, api }: { i: number; g: (o: THREE.Group | null) => void; api: { current: TruckApi | null } }) {
  return (
    <group ref={g}>
      <Truck name={KIND(i)} apiRef={api} scale={ROBOT_SCALE}>
        <group position={[0, 0.25, 0]}>
          <RoundedBox args={[0.62, 0.38, 0.5]} radius={0.02} position={[0, 0.19, 0]} material={K.carton} castShadow />
          <mesh position={[0, 0.385, 0]} material={K.tape}>
            <boxGeometry args={[0.63, 0.01, 0.09]} />
          </mesh>
        </group>
      </Truck>
    </group>
  );
}

export default function Robots({ clock }: SceneProps) {
  const robots = useRef<(THREE.Group | null)[]>([]);
  const apis = useMemo(() => SEGS.map(() => ({ current: null as TruckApi | null })), []);
  const dots = useRef<THREE.InstancedMesh>(null);
  const floor = useRef<THREE.Mesh>(null);
  const pads = useRef<THREE.Group>(null);
  const total = useMemo(() => SEGS.reduce((n, s) => n + s.dots, 0), []);
  const pool = useMemo(() => poolMaterial(0.12, C.lightGrey), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const ringGeo = useMemo(() => {
    const p: THREE.Vector3[] = [];
    for (let i = 0; i < 48; i++) p.push(new THREE.Vector3(Math.cos((i / 48) * Math.PI * 2) * 1.6, 0, Math.sin((i / 48) * Math.PI * 2) * 1.6));
    return new THREE.BufferGeometry().setFromPoints(p);
  }, []);
  const nodes = useMemo(() => CHAINS.flat(), []);

  useLayoutEffect(() => {
    robots.current.forEach((r) => r?.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).receiveShadow = true) : null)));
  }, []);

  useFrame(() => {
    const u = uOf(clock);
    const on = u >= 13.0;
    if (floor.current) {
      floor.current.position.y = ATP.y + lerp(-12, 0, ease(range(u, 13.15, 13.7)));
      floor.current.visible = on;
    }
    if (pads.current) pads.current.visible = u > 13.6;
    if (!on) {
      robots.current.forEach((r) => r && (r.visible = false));
      if (dots.current) dots.current.visible = false;
      return;
    }
    if (dots.current) dots.current.visible = u > 13.55;
    // dotted paths draw on
    let n = 0;
    SEGS.forEach((s, si) => {
      const dp = ease(range(u, 13.55 + si * 0.045, 13.95 + si * 0.045));
      for (let j = 0; j < s.dots; j++) {
        const t = (j + 0.5) / s.dots;
        const vis = t <= dp ? 1 : 0;
        const sx = lerp(s.a[0], s.b[0], t);
        const sy = lerp(s.a[1], s.b[1], t);
        const [x, y, z] = toWorld(sx, sy, ATP.y + 0.03);
        m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(vis, vis, vis));
        dots.current?.setMatrixAt(n++, m4);
      }
    });
    if (dots.current) dots.current.instanceMatrix.needsUpdate = true;
    // robots out and back
    const tau = Math.max(0, u - 14);
    SEGS.forEach((s, i) => {
      const r = robots.current[i];
      if (!r) return;
      const c = (((tau * 2.0 + s.off) % 1) + 1) % 1;
      let t: number;
      let yaw = s.yaw;
      if (c < 0.4) t = ease(c / 0.4);
      else if (c < 0.5) {
        t = 1;
        yaw = s.yaw + Math.PI * ease((c - 0.4) / 0.1);
      } else if (c < 0.9) {
        t = 1 - ease((c - 0.5) / 0.4);
        yaw = s.yaw + Math.PI;
      } else {
        t = 0;
        yaw = s.yaw + Math.PI + Math.PI * ease((c - 0.9) / 0.1);
      }
      const sx = lerp(s.a[0], s.b[0], t);
      const sy = lerp(s.a[1], s.b[1], t);
      const [x, y, z] = toWorld(sx, sy, ATP.y);
      r.position.set(x, y, z);
      r.rotation.y = yaw;
      const cyc = Math.floor(tau * 2.0 + s.off);
      apis[i].current?.set(0, cyc * 2 * s.len + (c < 0.5 ? t * s.len : s.len + (1 - t) * s.len));
      const grow = ease(range(u, 13.85 + i * 0.02, 14.05 + i * 0.02));
      r.scale.setScalar(Math.max(grow, 0.001));
      r.visible = grow > 0.002;
    });
  });

  return (
    <group>
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} position={[ATP.x, ATP.y - 12, ATP.z]} receiveShadow visible={false}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0b0d0e" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ATP.x, ATP.y + 0.015, ATP.z]} material={pool}>
        <planeGeometry args={[70, 48]} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined, undefined, total]} material={K.glow} frustumCulled={false} visible={false}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 12]} />
      </instancedMesh>
      <group ref={pads} visible={false}>
        {nodes.map(([sx, sy], i) => {
          const [x, y, z] = toWorld(sx, sy, ATP.y + 0.02);
          return (
            <group key={i} position={[x, y, z]}>
              <lineLoop geometry={ringGeo}>
                <lineBasicMaterial color={C.white} transparent opacity={0.4} toneMapped={false} />
              </lineLoop>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.5, 32]} />
                <meshStandardMaterial color="#14181a" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>
      {SEGS.map((_, i) => (
        <Robot key={i} i={i} api={apis[i]} g={(o) => (robots.current[i] = o)} />
      ))}
    </group>
  );
}
