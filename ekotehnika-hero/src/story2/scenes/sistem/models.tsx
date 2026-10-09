// The real Linde models from public/models/linde, wrapped so every truck faces +x on the ground at y = 0, with
// its wheels turned from a rolled distance and, where it has one, its fork carriage lifted. Geometry and
// materials are shared between clones. The trucks keep their own Linde materials, only the roughness and the
// environment are tuned for the dark studio.
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Pallet } from '../../../r3f/Forklift';

export type ModelName = 'x50' | 'h30d' | 'r16' | 'n20' | 'mt15c' | 'd12' | 'cmatic10' | 'cmatichp';

export type Spec = {
  /** turn that puts the forks (or the front) toward +x */
  yaw: number;
  /** height of the model origin above the ground */
  ground: number;
  /** +1 when the model's own front is -x, -1 when it is +x, the sign of the wheel spin */
  spin: 1 | -1;
  wheels: { node: string; r: number }[];
  /** node that carries the load up and down */
  fork?: string;
  /** where a pallet's base sits on the forks, in the model's own frame */
  load?: [number, number, number];
  hide?: string[];
};

const PI = Math.PI;
export const SPEC: Record<ModelName, Spec> = {
  x50: {
    yaw: PI, ground: 0.425, spin: 1,
    wheels: [{ node: 'fl_wheel', r: 0.41 }, { node: 'fr_wheel', r: 0.41 }, { node: 'bl_wheel', r: 0.38 }, { node: 'br_wheel', r: 0.38 }],
    fork: 'gabel', load: [-1.15, -0.36, 0],
  },
  h30d: {
    yaw: PI, ground: 0.34, spin: 1,
    wheels: [{ node: 'fl_wheel', r: 0.34 }, { node: 'fr_wheel', r: 0.34 }, { node: 'bl_wheel', r: 0.3 }, { node: 'br_wheel', r: 0.3 }],
    load: [-1.1, -0.3, 0],
  },
  r16: {
    yaw: PI, ground: 0, spin: 1,
    wheels: [{ node: 'wheel_1', r: 0.14 }, { node: 'wheel_2', r: 0.18 }, { node: 'wheel_3', r: 0.14 }],
    load: [-0.75, 0.1, 0],
  },
  n20: { yaw: PI, ground: 0, spin: 1, wheels: [], load: [-1.2, 0.1, 0] },
  mt15c: { yaw: 0, ground: 0, spin: -1, wheels: [] },
  d12: { yaw: PI, ground: 0, spin: 1, wheels: [], load: [-1.1, 0.1, 0] },
  cmatic10: { yaw: PI, ground: 0, spin: 1, wheels: [], hide: ['quicktron_logo'] },
  cmatichp: {
    yaw: 0, ground: 0, spin: -1,
    wheels: [{ node: 'C_matic_wheels1', r: 0.073 }, { node: 'C_matic_wheels2', r: 0.073 }, { node: 'C_matic_wheels3', r: 0.08 }, { node: 'C_matic_wheels4', r: 0.08 }],
  },
};

export const modelUrl = (n: ModelName) => `/models/linde/${n}.glb`;
(Object.keys(SPEC) as ModelName[]).forEach((n) => useGLTF.preload(modelUrl(n)));

const tuned = new WeakSet<THREE.Object3D>();
function tune(root: THREE.Object3D) {
  if (tuned.has(root)) return;
  tuned.add(root);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mat) => {
      const s = mat as THREE.MeshStandardMaterial;
      if (!s.isMeshStandardMaterial) return;
      s.envMapIntensity = 1.5;
      s.roughness = Math.min(Math.max(s.roughness, 0.4), 0.7);
      s.metalness = Math.min(s.metalness, 0.3);
    });
  });
}

// A scene ready to place, a clone with its logos hidden and its moving nodes found.
export function prepare(gltfScene: THREE.Object3D, name: ModelName) {
  const spec = SPEC[name];
  tune(gltfScene);
  const scene = gltfScene.clone(true);
  spec.hide?.forEach((n) => {
    const o = scene.getObjectByName(n);
    if (o) o.visible = false;
  });
  scene.updateMatrixWorld(true);
  return scene;
}

export type TruckApi = { set: (lift: number, roll: number) => void; root: THREE.Group };

type Props = { name: ModelName; apiRef?: MutableRefObject<TruckApi | null>; load?: boolean } & ThreeElements['group'];

export function Truck({ name, apiRef, load = false, children, ...group }: Props) {
  const gltf = useGLTF(modelUrl(name)) as unknown as { scene: THREE.Group };
  const spec = SPEC[name];
  const root = useRef<THREE.Group>(null);
  const loadRef = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const scene = prepare(gltf.scene, name);
    const wheels = spec.wheels.map((w) => ({ obj: scene.getObjectByName(w.node), r: w.r })).filter((w): w is { obj: THREE.Object3D; r: number } => !!w.obj);
    const fork = spec.fork ? scene.getObjectByName(spec.fork) : undefined;
    return { scene, wheels, fork, forkY: fork?.position.y ?? 0 };
  }, [gltf, name, spec]);

  useLayoutEffect(() => {
    if (!apiRef) return;
    const { wheels, fork, forkY } = built;
    apiRef.current = {
      root: root.current!,
      set(lift, roll) {
        for (const w of wheels) w.obj.rotation.z = (spec.spin * roll) / w.r;
        if (fork) fork.position.y = forkY + lift;
        if (loadRef.current && spec.load) loadRef.current.position.y = spec.load[1] + lift;
      },
    };
    apiRef.current.set(0, 0);
  }, [apiRef, built, spec]);

  return (
    <group ref={root} {...group}>
      <group position={[0, spec.ground, 0]} rotation={[0, spec.yaw, 0]}>
        <primitive object={built.scene} />
        {load && spec.load && (
          <group ref={loadRef} position={spec.load}>
            <Pallet />
          </group>
        )}
        {children}
      </group>
    </group>
  );
}
