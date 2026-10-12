// The rental depot, one hall. A floor that runs edge to edge, bays painted on it across the whole width out to the frame on
// both sides, and fifteen front on trucks, five by three, rising out of it row by row with scroll. The floor ends at the
// hall's end wall, which is also the end wall of the automation aisle, so the text above the floor sits on a real wall.
// The trucks are the real Linde models, baked once and instanced. In T the bays draw back onto the aisle line, the trucks
// sink into the floor and the same floor takes its warehouse lanes, see aisle.tsx.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { bakeStatic } from './bake';
import { modelUrl, type ModelName } from './models';
import { NP } from './route';
import { BoxSet, type BoxItem } from './props';
import { G, K, blobMaterial, ease, lam, lerp, range, uOf } from './kit';

const COLS = 5;
const ROWS = 3;
const ROW_X = [5.4, 0.2, -5.0];
const COL_Z = (c: number) => (c - 2) * 3.15;
const ROW_START = [0.05, 0.3, 0.55];
// Which model stands in each of the fifteen bays, row by row from the front.
const MIX: ModelName[] = ['x50', 'h30d', 'x50', 'r16', 'x50', 'h30d', 'x50', 'd12', 'x50', 'h30d', 'x50', 'r16', 'x50', 'h30d', 'x50'];
const KINDS: ModelName[] = ['x50', 'h30d', 'r16', 'd12'];

// Bay rows across the depot, the three with trucks and three empty rows, one in front, two behind. The bays run out past
// both edges of the frame, so the floor is one piece edge to edge.
const BAY_ROWS = [10.6, ...ROW_X, -10.2, -15.4, -20.6, -25.8];
const BAY_COLS = Array.from({ length: 27 }, (_, i) => i - 13); // 27 bays across, five are taken
const FLOOR = '#f6f6f6';
// The end wall of the hall, 31.7 m behind the middle truck row, 16 m high and wider than any frame. Plain, with the same
// base band as the walls of the automation aisle, so title, lede and spec row sit on empty wall.
export const WALL_A = 31.7;
const WALL_H = 16;
const wallMat = lam(G.pale, { emissive: new THREE.Color().setScalar(0.56) });
const wallBase = lam(G.light, { emissive: new THREE.Color().setScalar(0.46) });

// The floor, one plane that runs out to the fog, so no edge shows anywhere.
export function Depot({ clock }: SceneProps) {
  const floor = useMemo(() => lam(FLOOR, { emissive: new THREE.Color(FLOOR).multiplyScalar(0.12) }), []);
  void clock;
  const wall = useMemo(() => {
    const x = NP.x - WALL_A;
    const w: BoxItem[] = [[x - 0.1, WALL_H / 2, NP.z, 0.2, WALL_H, 160]];
    const band: BoxItem[] = [[x + 0.04, 0.4, NP.z, 0.1, 0.8, 160]];
    return { w, band };
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[NP.x - 60, 0, NP.z]} material={floor} receiveShadow>
        <planeGeometry args={[520, 520]} />
      </mesh>
      <BoxSet items={wall.w} mat={wallMat} />
      <BoxSet items={wall.band} mat={wallBase} />
    </group>
  );
}

export default function Grid({ clock }: SceneProps) {
  const gltfs = KINDS.map((n) => useGLTF(modelUrl(n)) as unknown as { scene: THREE.Group });
  const kinds = useMemo(
    () =>
      KINDS.map((name, ki) => ({
        name,
        slots: MIX.map((m, i) => (m === name ? i : -1)).filter((i) => i >= 0),
        baked: bakeStatic(gltfs[ki].scene, name),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gltfs[0], gltfs[1], gltfs[2], gltfs[3]],
  );
  const meshes = useRef<THREE.InstancedMesh[][]>([]);
  const blobs = useRef<THREE.Mesh[]>([]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const blobMat = useMemo(() => blobMaterial(0), []);
  // Painted bay lines, every bay of every row, a U with a wheel stop at the back. They spread out from the aisle line as N
  // opens and close back onto it as T begins, so the floor is never faded, only drawn and drawn in.
  const bays = useRef<THREE.Group>(null);
  const bayMat = useMemo(() => new THREE.MeshBasicMaterial({ color: G.mid, opacity: 0.62, transparent: true, toneMapped: false, depthWrite: false }), []);
  const stopMat = useMemo(() => lam(G.light), []);
  const bay = useMemo(() => {
    const lines: BoxItem[] = [];
    const stops: BoxItem[] = [];
    BAY_ROWS.forEach((rx) =>
      BAY_COLS.forEach((c) => {
        const z = COL_Z(c + 2);
        lines.push([NP.x + rx - 0.45, 0.02, NP.z + z - 1.1, 4.7, 0.01, 0.08], [NP.x + rx - 0.45, 0.02, NP.z + z + 1.1, 4.7, 0.01, 0.08], [NP.x + rx - 2.75, 0.02, NP.z + z, 0.1, 0.01, 2.28]);
        stops.push([NP.x + rx - 2.45, 0.06, NP.z + z, 0.16, 0.12, 1.5]);
      }),
    );
    // the drive aisle between the rows, a dashed centre line
    const dash: BoxItem[] = [];
    [8.0, 2.8, -2.4, -7.6, -12.8, -18.0, -23.2].forEach((ax) => {
      for (let z = -40; z < 40; z += 1.6) dash.push([NP.x + ax, 0.02, NP.z + z, 0.08, 0.01, 0.8]);
    });
    return { lines, stops, dash };
  }, []);

  useLayoutEffect(() => {
    meshes.current.flat().forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
  }, []);

  useFrame(() => {
    const u = uOf(clock);
    const k = u - 12;
    const sink = (r: number) => ease(range(u, 13.0 + (2 - r) * 0.06, 13.0 + (2 - r) * 0.06 + 0.25));
    const spread = ease(range(u, 11.9, 12.1)) * (1 - ease(range(u, 13.0, 13.45)));
    if (bays.current) {
      bays.current.scale.z = Math.max(spread, 0.001);
      bays.current.visible = spread > 0.002;
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const a = ROW_START[r] + c * 0.022;
        const rise = ease(range(k, a, a + 0.15));
        const y = lerp(-3.6, 0, rise) - 3.6 * sink(r) * (u >= 13 ? 1 : 0);
        m4.makeTranslation(NP.x + ROW_X[r], y, NP.z + COL_Z(c));
        kinds.forEach((kd, ki) => {
          const j = kd.slots.indexOf(i);
          if (j >= 0) meshes.current[ki]?.forEach((m) => m.setMatrixAt(j, m4));
        });
        const blob = blobs.current[i];
        if (blob) {
          const sunk = u >= 13 ? sink(r) : 0;
          (blob.material as THREE.MeshBasicMaterial).opacity = 0.36 * rise * (1 - sunk);
        }
      }
    meshes.current.flat().forEach((m) => (m.instanceMatrix.needsUpdate = true));
  });

  return (
    <group>
      <group ref={bays} position={[0, 0, NP.z]}>
        <group position={[0, 0, -NP.z]}>
          <BoxSet items={bay.lines} mat={bayMat} receive={false} />
          <BoxSet items={bay.stops} mat={stopMat} />
          <BoxSet items={bay.dash} mat={bayMat} receive={false} />
        </group>
      </group>
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        return (
          <mesh key={i} ref={(m) => { if (m) blobs.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]} position={[NP.x + ROW_X[r] - 0.3, 0.03, NP.z + COL_Z(c)]} material={blobMat.clone()}>
            <planeGeometry args={[5.4, 2.8]} />
          </mesh>
        );
      })}
      {kinds.map((kd, ki) =>
        kd.baked.map((b, bi) => (
          <instancedMesh
            key={`${kd.name}${bi}`}
            ref={(m) => {
              if (!m) return;
              (meshes.current[ki] ??= [])[bi] = m;
            }}
            args={[b.geo, b.mat, kd.slots.length]}
            frustumCulled={false}
          />
        )),
      )}
    </group>
  );
}

export { K };
