// Light weight stand-ins for rows of Linde counterbalance trucks seen from above or far away. A truck is built from
// seventeen boxes (red counterweight, graphite chassis, black overhead guard, mast, carriage, forks, four wheels),
// every box of one material across all trucks goes into one instanced mesh, so forty trucks cost twelve draws.
// Red is on the counterweight and hood only, as on the real truck. Forks point along +x before the yaw.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { G, lam, lit } from './kit';

type P = [x0: number, x1: number, y0: number, y1: number, z0: number, z1: number];
const PARTS: Record<string, P[]> = {
  red: [[-2.64, -1.52, 0.3, 1.12, -0.68, 0.68], [-1.6, -0.3, 0.95, 1.18, -0.54, 0.54]],
  graphite: [[-2.06, 0.38, 0.28, 0.98, -0.62, 0.62], [0.2, 0.6, 0.2, 2.4, -0.5, 0.5]],
  black: [
    // overhead guard, two side rails, front and back bars and four posts
    [-1.58, 0.16, 2.02, 2.1, -0.68, -0.58], [-1.58, 0.16, 2.02, 2.1, 0.58, 0.68],
    [-1.58, -1.46, 2.02, 2.1, -0.68, 0.68], [0.04, 0.16, 2.02, 2.1, -0.68, 0.68],
    [-1.52, -1.44, 0.98, 2.02, -0.64, -0.58], [-1.52, -1.44, 0.98, 2.02, 0.58, 0.64],
    [0.08, 0.16, 0.98, 2.02, -0.64, -0.58], [0.08, 0.16, 0.98, 2.02, 0.58, 0.64],
    // seat and the steering column
    [-1.0, -0.35, 0.98, 1.34, -0.3, 0.3], [-0.15, 0.0, 1.0, 1.5, -0.12, 0.12],
  ],
  grey: Array.from({ length: 7 }, (_, i) => [-1.4 + i * 0.22, -1.34 + i * 0.22, 2.1, 2.12, -0.58, 0.58] as P),
  tyre: [
    [-0.41, 0.41, 0.0, 0.83, 0.52, 0.76], [-0.41, 0.41, 0.0, 0.83, -0.76, -0.52],
    [-2.5, -1.74, 0.0, 0.76, 0.5, 0.74], [-2.5, -1.74, 0.0, 0.76, -0.74, -0.5],
  ],
  carriage: [[0.6, 0.76, 0.12, 1.1, -0.66, 0.66]],
  fork: [[0.76, 1.74, 0.03, 0.1, 0.22, 0.38], [0.76, 1.74, 0.03, 0.1, -0.38, -0.22]],
};

let mats: Record<string, THREE.Material> | undefined;
const getMats = () =>
  (mats ??= {
    red: lam('#a00020'),
    graphite: lam(G.graphite),
    black: lam('#222222'),
    grey: lam(G.mid),
    tyre: lam('#111111'),
    carriage: lam(G.dark),
    fork: lam(G.mid),
  });

export type TruckSpec = { x: number; z: number; yaw: number; s?: number };

export function ProxyTrucks({ items, cast = true }: { items: TruckSpec[]; cast?: boolean }) {
  const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});
  const names = Object.keys(PARTS);
  useLayoutEffect(() => {
    const T = new THREE.Matrix4();
    const Pm = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    names.forEach((name) => {
      const mesh = refs.current[name]!;
      let n = 0;
      items.forEach((t) => {
        e.set(0, t.yaw, 0);
        T.compose(new THREE.Vector3(t.x, 0, t.z), q.setFromEuler(e), new THREE.Vector3(t.s ?? 1, t.s ?? 1, t.s ?? 1));
        PARTS[name].forEach(([x0, x1, y0, y1, z0, z1]) => {
          Pm.compose(new THREE.Vector3((x0 + x1) / 2 + 0.45, (y0 + y1) / 2, (z0 + z1) / 2), new THREE.Quaternion(), new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0));
          mesh.setMatrixAt(n++, new THREE.Matrix4().multiplyMatrices(T, Pm));
        });
      });
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [items, names]);
  const m = useMemo(getMats, []);
  return (
    <group>
      {names.map((name) => (
        <instancedMesh
          key={name + items.length}
          ref={(r) => {
            refs.current[name] = r;
          }}
          args={[undefined, undefined, items.length * PARTS[name].length]}
          material={m[name]}
          castShadow={cast}
          receiveShadow
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
      ))}
    </group>
  );
}

export { lit };
