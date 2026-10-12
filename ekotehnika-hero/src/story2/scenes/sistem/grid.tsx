// The rental depot. A floor that runs edge to edge, bays painted on it across the whole width, and fifteen front on
// trucks, five by three, rising out of it row by row with scroll, empty marked bays out to the frame on both sides.
// The trucks are the real Linde models, baked once and instanced. In T the bays fade, the trucks sink back into the
// floor and the same floor takes its warehouse lanes, see robots.tsx.
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

// Bay rows across the depot, the three with trucks and three empty rows, one in front, two behind.
const BAY_ROWS = [10.6, ...ROW_X, -10.2, -15.4];
const BAY_COLS = Array.from({ length: 13 }, (_, i) => i - 6); // 13 bays across, five are taken
const FLOOR = '#f6f6f6';

// The floor, one plane that runs out to the fog, so no edge shows anywhere.
export function Depot({ clock }: SceneProps) {
  const floor = useMemo(() => lam(FLOOR, { emissive: new THREE.Color(FLOOR).multiplyScalar(0.12) }), []);
  void clock;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[NP.x - 60, 0, NP.z]} material={floor} receiveShadow>
      <planeGeometry args={[520, 520]} />
    </mesh>
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
  // Painted bay lines, every bay of every row, a U with a wheel stop at the back. The lines fade as T begins.
  const bayMat = useMemo(() => new THREE.MeshBasicMaterial({ color: G.mid, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), []);
  const stopMat = useMemo(() => lam(G.light, { transparent: true, opacity: 0 }), []);
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
    [8.0, 2.8, -2.4, -7.6, -12.8].forEach((ax) => {
      for (let z = -22; z < 22; z += 1.6) dash.push([NP.x + ax, 0.02, NP.z + z, 0.08, 0.01, 0.8]);
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
    const lineFade = ease(range(u, 11.9, 12.1)) * (1 - ease(range(u, 13.0, 13.45)));
    bayMat.opacity = 0.62 * lineFade;
    stopMat.opacity = lineFade;
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
      <BoxSet items={bay.lines} mat={bayMat} receive={false} />
      <BoxSet items={bay.stops} mat={stopMat} />
      <BoxSet items={bay.dash} mat={bayMat} receive={false} />
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
