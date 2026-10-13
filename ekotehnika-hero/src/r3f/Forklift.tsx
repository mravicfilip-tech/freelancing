// The shared Linde style counterbalance forklift for every variant, in metres like a 2.5 t truck.
// Forks point along +x, width along z, ground at y = 0. The body is one extruded side profile with
// bevelled edges, so the silhouette reads as a Linde, a big rounded counterweight, a low seat deck
// and a raised cowl, with the guard posts leaning back from the mast.
//
// Pass apiRef to animate without re-rendering. setPose(api, { lift, roll }) moves the forks and
// turns the wheels. api.anchor is where a carried pallet's bottom centre sits.

import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { M } from './materials';

export type ForkliftApi = {
  root: THREE.Group;
  carriage: THREE.Group;
  inner: THREE.Group;
  wheels: { g: THREE.Group; r: number }[];
  anchor: THREE.Object3D;
};

export function setPose(api: ForkliftApi | null, { lift = 0.1, roll = 0 }: { lift?: number; roll?: number }) {
  if (!api) return;
  api.carriage.position.y = lift;
  api.inner.position.y = lift * 0.5;
  for (const w of api.wheels) w.g.rotation.z = -roll / w.r;
}

const W = 1.1;

function bodyGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0.78, 0.3);
  s.lineTo(0.78, 0.78);
  s.quadraticCurveTo(0.8, 1.04, 0.6, 1.15);
  s.lineTo(0.42, 1.17);
  s.lineTo(0.28, 0.98);
  s.lineTo(-0.52, 0.98);
  s.lineTo(-0.64, 1.1);
  s.lineTo(-1.18, 1.13);
  s.quadraticCurveTo(-1.52, 1.12, -1.52, 0.72);
  s.quadraticCurveTo(-1.52, 0.3, -1.28, 0.26);
  s.lineTo(-1.25, 0.3);
  s.absarc(-0.88, 0.3, 0.37, Math.PI, 0, true);
  s.lineTo(0.02, 0.3);
  s.absarc(0.4, 0.34, 0.38, Math.PI, 0, true);
  s.lineTo(0.78, 0.3);
  const g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.045, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, 0, -W / 2);
  return g;
}

// Cuts a mesh at the plane x = cut and returns the part behind it and the part ahead of it, with the
// shape and normals exactly as they were. Used to give the rear shell its own paint.
function splitAtX(src: THREE.BufferGeometry, cut: number) {
  const g = src.index ? src.toNonIndexed() : src;
  const names = ['position', 'normal', 'uv'].filter((n) => g.getAttribute(n));
  const attrs = names.map((n) => g.getAttribute(n));
  const sides = { back: names.map(() => [] as number[]), front: names.map(() => [] as number[]) };
  const vert = (i: number) => attrs.map((a) => Array.from({ length: a.itemSize }, (_, k) => a.getComponent(i, k)));
  const emit = (out: number[][], poly: number[][][]) => {
    for (let i = 1; i < poly.length - 1; i++) for (const v of [poly[0], poly[i], poly[i + 1]]) v.forEach((c, k) => out[k].push(...c));
  };
  for (let t = 0; t < g.getAttribute('position').count; t += 3) {
    const vs = [vert(t), vert(t + 1), vert(t + 2)];
    const d = vs.map((v) => v[0][0] - cut);
    const back: number[][][] = [];
    const front: number[][][] = [];
    for (let i = 0; i < 3; i++) {
      const a = vs[i];
      const b = vs[(i + 1) % 3];
      (d[i] < 0 ? back : front).push(a);
      if (d[i] < 0 !== d[(i + 1) % 3] < 0) {
        const s = d[i] / (d[i] - d[(i + 1) % 3]);
        const m = a.map((c, k) => c.map((x, j) => x + (b[k][j] - x) * s));
        m[0][0] = cut;
        back.push(m);
        front.push(m);
      }
    }
    emit(sides.back, back);
    emit(sides.front, front);
  }
  const build = (arrs: number[][]) => {
    const out = new THREE.BufferGeometry();
    names.forEach((n, k) => out.setAttribute(n, new THREE.Float32BufferAttribute(arrs[k], attrs[k].itemSize)));
    return out;
  };
  return { back: build(sides.back), front: build(sides.front) };
}

function tyreGeometry(r: number, w: number) {
  const pts: THREE.Vector2[] = [];
  const inner = r * 0.6;
  const sh = w * 0.18;
  pts.push(new THREE.Vector2(inner, -w / 2));
  pts.push(new THREE.Vector2(r - sh, -w / 2));
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, -w / 2 + sh + Math.sin(a) * sh));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, w / 2 - sh + Math.sin(a) * sh));
  }
  pts.push(new THREE.Vector2(inner, w / 2));
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

function forkGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(1.15, 0);
  s.lineTo(1.2, 0.035);
  s.lineTo(0.06, 0.05);
  s.lineTo(0.06, 0.62);
  s.lineTo(0, 0.62);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1 });
  g.translate(0, 0, -0.06);
  return g;
}

function Wheel({ r, w, x, z, register }: { r: number; w: number; x: number; z: number; register: (g: THREE.Group, r: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  const tyre = useMemo(() => tyreGeometry(r, w), [r, w]);
  useLayoutEffect(() => {
    if (ref.current) register(ref.current, r);
  }, [r, register]);
  const lugs = 22;
  return (
    <group ref={ref} position={[x, r, z]}>
      <mesh geometry={tyre} material={M.rubber} castShadow receiveShadow />
      {Array.from({ length: lugs }, (_, i) => {
        const a = (i / lugs) * Math.PI * 2;
        return (
          <mesh key={i} material={M.rubber} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]} castShadow>
            <boxGeometry args={[0.03, 0.07, w * 0.86]} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steel} castShadow>
        <cylinderGeometry args={[r * 0.6, r * 0.6, w * 0.92, 28]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, (z > 0 ? 1 : -1) * w * 0.47]} material={M.steelLight}>
        <cylinderGeometry args={[r * 0.26, r * 0.3, 0.04, 20]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, (z > 0 ? 1 : -1) * w * 0.47]} rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
            <cylinderGeometry args={[0.018, 0.018, 0.05, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

type Props = {
  apiRef?: MutableRefObject<ForkliftApi | null>;
  paint?: THREE.Material;
  lift?: number;
  children?: ReactNode;
} & ThreeElements['group'];

export function Forklift({ apiRef, paint = M.paint, lift = 0.1, children, ...group }: Props) {
  const root = useRef<THREE.Group>(null);
  const carriage = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const wheels = useRef<{ g: THREE.Group; r: number }[]>([]);
  // Red only behind the cab, the rear shell and counterweight. The cowl ahead of it is grey.
  const { back: shell, front: cowl } = useMemo(() => splitAtX(bodyGeometry(), -0.01), []);
  const fork = useMemo(forkGeometry, []);
  const register = useMemo(() => (g: THREE.Group, r: number) => {
    if (!wheels.current.some((w) => w.g === g)) wheels.current.push({ g, r });
  }, []);

  useLayoutEffect(() => {
    if (!apiRef || !root.current || !carriage.current || !inner.current || !anchor.current) return;
    apiRef.current = { root: root.current, carriage: carriage.current, inner: inner.current, wheels: wheels.current, anchor: anchor.current };
    setPose(apiRef.current, { lift });
  }, [apiRef, lift]);

  return (
    <group ref={root} {...group}>
      {/* body, chassis skirt, counterweight bumper */}
      <mesh geometry={shell} material={paint} castShadow receiveShadow />
      <mesh geometry={cowl} material={M.cowl} castShadow receiveShadow />
      <RoundedBox args={[2.1, 0.2, 1.06]} radius={0.05} position={[-0.32, 0.24, 0]} material={M.black} castShadow />
      <RoundedBox args={[0.3, 0.24, 1.0]} radius={0.06} position={[-1.42, 0.3, 0]} material={M.black} castShadow />
      {/* side step and the white plate on the cowl */}
      <RoundedBox args={[0.42, 0.06, 0.18]} radius={0.02} position={[-0.1, 0.42, 0.62]} material={M.black} />
      <RoundedBox args={[0.3, 0.1, 0.02]} radius={0.01} position={[-1.0, 0.82, 0.6]} material={M.white} />
      <RoundedBox args={[0.3, 0.1, 0.02]} radius={0.01} position={[-1.0, 0.82, -0.6]} material={M.white} />
      {/* side panel insert under the cab, where the badge sits, with its light stripe */}
      {[0.6, -0.6].map((z) => (
        <group key={z}>
          <RoundedBox args={[0.44, 0.3, 0.03]} radius={0.015} position={[-0.27, 0.62, z]} material={M.cowl} />
          <RoundedBox args={[0.44, 0.022, 0.034]} radius={0.008} position={[-0.27, 0.8, z]} material={M.stripe} />
        </group>
      ))}
      {/* rear light strip */}
      <mesh position={[-1.555, 0.78, 0]} material={M.beacon}>
        <boxGeometry args={[0.02, 0.06, 0.7]} />
      </mesh>

      {/* seat and steering */}
      <RoundedBox args={[0.5, 0.14, 0.52]} radius={0.05} position={[-0.32, 1.06, 0]} material={M.black} castShadow />
      <RoundedBox args={[0.12, 0.62, 0.5]} radius={0.05} position={[-0.6, 1.36, 0]} rotation={[0, 0, 0.12]} material={M.black} castShadow />
      <RoundedBox args={[0.28, 0.08, 0.08]} radius={0.03} position={[-0.32, 1.2, 0.3]} material={M.black} />
      <mesh position={[0.3, 1.32, 0]} rotation={[0, 0, 0.5]} material={M.black}>
        <cylinderGeometry args={[0.035, 0.045, 0.42, 12]} />
      </mesh>
      <mesh position={[0.2, 1.52, 0]} rotation={[0, Math.PI / 2, 0.55]} material={M.black} castShadow>
        <torusGeometry args={[0.17, 0.022, 10, 32]} />
      </mesh>
      <RoundedBox args={[0.1, 0.16, 0.12]} radius={0.03} position={[0.05, 1.18, -0.38]} material={M.black} />

      {/* overhead guard, rear posts upright, front posts leaning back from the cowl */}
      {[-0.5, 0.5].map((z) => (
        <group key={z}>
          <mesh position={[-0.66, 1.62, z]} material={M.black} castShadow>
            <boxGeometry args={[0.07, 1.22, 0.07]} />
          </mesh>
          <mesh position={[0.5, 1.67, z]} rotation={[0, 0, 0.12]} material={M.black} castShadow>
            <boxGeometry args={[0.07, 1.06, 0.07]} />
          </mesh>
          <RoundedBox args={[1.38, 0.07, 0.08]} radius={0.025} position={[-0.1, 2.22, z]} material={M.black} castShadow />
        </group>
      ))}
      {[-0.78, -0.4, -0.02, 0.36].map((x) => (
        <mesh key={x} position={[x, 2.235, 0]} material={M.black} castShadow>
          <boxGeometry args={[0.05, 0.03, 1.02]} />
        </mesh>
      ))}
      <mesh position={[-0.55, 2.31, 0.42]} material={M.beacon}>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 16]} />
      </mesh>
      {/* work lights on the front posts */}
      {[-0.46, 0.46].map((z) => (
        <group key={z} position={[0.56, 2.08, z]}>
          <RoundedBox args={[0.09, 0.09, 0.09]} radius={0.02} material={M.black} />
          <mesh position={[0.046, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={M.lamp}>
            <circleGeometry args={[0.032, 16]} />
          </mesh>
        </group>
      ))}

      {/* tilt cylinders */}
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} position={[0.74, 0.84, z]} rotation={[0, 0, -1.25]} material={M.steelLight}>
          <cylinderGeometry args={[0.035, 0.035, 0.42, 12]} />
        </mesh>
      ))}

      {/* wheels */}
      <Wheel r={0.38} w={0.3} x={0.4} z={0.5} register={register} />
      <Wheel r={0.38} w={0.3} x={0.4} z={-0.5} register={register} />
      <Wheel r={0.3} w={0.24} x={-0.88} z={0.46} register={register} />
      <Wheel r={0.3} w={0.24} x={-0.88} z={-0.46} register={register} />

      {/* mast, outer channels, cross members, lift cylinder */}
      {[-0.36, 0.36].map((z) => (
        <mesh key={z} position={[0.94, 1.27, z]} material={M.black} castShadow>
          <boxGeometry args={[0.11, 2.42, 0.1]} />
        </mesh>
      ))}
      {[0.2, 1.3, 2.42].map((y) => (
        <mesh key={y} position={[0.94, y, 0]} material={M.steel} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.78]} />
        </mesh>
      ))}
      <group ref={inner}>
        {[-0.28, 0.28].map((z) => (
          <mesh key={z} position={[1.02, 1.24, z]} material={M.steel} castShadow>
            <boxGeometry args={[0.08, 2.3, 0.08]} />
          </mesh>
        ))}
        <mesh position={[1.02, 2.36, 0]} material={M.steel}>
          <boxGeometry args={[0.08, 0.08, 0.64]} />
        </mesh>
        <mesh position={[0.99, 1.2, 0]} material={M.steelLight}>
          <cylinderGeometry args={[0.045, 0.045, 2.0, 12]} />
        </mesh>
        {[-0.14, 0.14].map((z) => (
          <mesh key={z} position={[1.075, 1.3, z]} material={M.black}>
            <boxGeometry args={[0.02, 2.1, 0.035]} />
          </mesh>
        ))}
      </group>

      {/* carriage, backrest, forks, and whatever rides on them */}
      <group ref={carriage}>
        <mesh position={[1.12, 0.33, 0]} material={M.black} castShadow>
          <boxGeometry args={[0.07, 0.42, 0.9]} />
        </mesh>
        {[-0.38, -0.19, 0, 0.19, 0.38].map((z) => (
          <mesh key={z} position={[1.12, 0.9, z]} material={M.black} castShadow>
            <boxGeometry args={[0.035, 0.7, 0.035]} />
          </mesh>
        ))}
        <mesh position={[1.12, 1.25, 0]} material={M.black}>
          <boxGeometry args={[0.04, 0.04, 0.82]} />
        </mesh>
        {[-0.28, 0.28].map((z) => (
          <mesh key={z} geometry={fork} position={[1.16, 0.0, z]} material={M.fork} castShadow />
        ))}
        <object3D ref={anchor} position={[1.74, 0.05, 0]} />
        {children}
      </group>
    </group>
  );
}

// A pallet with one taped carton, bottom at the origin. Slatted like a real Euro pallet.
export function Pallet({ wrap = true, ...group }: { wrap?: boolean } & ThreeElements['group']) {
  return (
    <group {...group}>
      {[-0.42, 0, 0.42].map((z) => (
        <mesh key={`b${z}`} position={[0, 0.02, z]} material={M.pallet} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.04, 0.12]} />
        </mesh>
      ))}
      {[-0.5, 0, 0.5].map((x) =>
        [-0.36, 0, 0.36].map((z) => (
          <mesh key={`k${x}${z}`} position={[x, 0.07, z]} material={M.pallet} castShadow>
            <boxGeometry args={[0.14, 0.07, 0.12]} />
          </mesh>
        )),
      )}
      {[-0.52, -0.26, 0, 0.26, 0.52].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.125, 0]} material={M.pallet} castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.03, 0.95]} />
        </mesh>
      ))}
      {wrap && (
        <group position={[0, 0.14, 0]}>
          <RoundedBox args={[1.08, 0.78, 0.86]} radius={0.025} position={[0, 0.39, 0]} material={M.card} castShadow receiveShadow />
          <mesh position={[0, 0.39, 0]} material={M.tape}>
            <boxGeometry args={[1.1, 0.79, 0.1]} />
          </mesh>
          <mesh position={[0.26, 0.42, 0.432]} material={M.white}>
            <boxGeometry args={[0.3, 0.2, 0.004]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
