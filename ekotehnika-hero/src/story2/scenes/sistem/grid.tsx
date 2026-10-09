// The rental platform. A lit slab in the dark, bays drawn on it, and fifteen front on trucks, five by three,
// rising out of it row by row with scroll. The trucks are the real Linde models, baked once and instanced.
// In T the trucks sink back and the slab drops away.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../../tokens';
import type { SceneProps } from '../../clock';
import { bakeStatic } from './bake';
import { modelUrl, type ModelName } from './models';
import { NP } from './route';
import { ease, lerp, poolMaterial, range, softTexture, uOf } from './kit';

const COLS = 5;
const ROWS = 3;
const ROW_X = [5.4, 0.2, -5.0];
const COL_Z = (c: number) => (c - 2) * 3.15;
const ROW_START = [0.05, 0.3, 0.55];
// Which model stands in each of the fifteen bays, row by row from the front.
const MIX: ModelName[] = ['x50', 'h30d', 'x50', 'r16', 'x50', 'h30d', 'x50', 'd12', 'x50', 'h30d', 'x50', 'r16', 'x50', 'h30d', 'x50'];
const KINDS: ModelName[] = ['x50', 'h30d', 'r16', 'd12'];

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
  const slab = useRef<THREE.Group>(null);
  const slots = useRef<THREE.LineLoop[]>([]);
  const rings = useRef<THREE.Sprite[]>([]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const pool = useMemo(() => poolMaterial(0.55, C.lightGrey), []);
  const slotMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.white, transparent: true, opacity: 0, toneMapped: false }), []);
  const slotGeo = useMemo(() => {
    const p = [new THREE.Vector3(-2.7, 0, -1.0), new THREE.Vector3(1.9, 0, -1.0), new THREE.Vector3(1.9, 0, 1.0), new THREE.Vector3(-2.7, 0, 1.0)];
    return new THREE.BufferGeometry().setFromPoints(p);
  }, []);
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(25, 0.5, 21)), []);
  const tex = softTexture();

  useLayoutEffect(() => {
    meshes.current.flat().forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
  }, []);

  useFrame(() => {
    const u = uOf(clock);
    const k = u - 12;
    const slabY = -11 * ease(range(u, 13.2, 13.75));
    const sink = (r: number) => ease(range(u, 13.0 + (2 - r) * 0.06, 13.0 + (2 - r) * 0.06 + 0.25));
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const a = ROW_START[r] + c * 0.022;
        const rise = ease(range(k, a, a + 0.15));
        const y = lerp(-3.6, 0, rise) - 3.6 * sink(r) * (u >= 13 ? 1 : 0) + slabY;
        m4.makeTranslation(NP.x + ROW_X[r], y, NP.z + COL_Z(c));
        kinds.forEach((kd, ki) => {
          const j = kd.slots.indexOf(i);
          if (j >= 0) meshes.current[ki]?.forEach((m) => m.setMatrixAt(j, m4));
        });
        const slot = slots.current[i];
        if (slot) (slot.material as THREE.LineBasicMaterial).opacity = 0.55 * ease(range(k, 0.0, 0.1)) * (1 - ease(range(u, 13.0, 13.25)));
        const ring = rings.current[i];
        if (ring) {
          const pulse = Math.sin(Math.PI * range(k, a, a + 0.22));
          ring.visible = pulse > 0.01 && u < 13;
          (ring.material as THREE.SpriteMaterial).opacity = 0.8 * pulse;
        }
      }
    meshes.current.flat().forEach((m) => (m.instanceMatrix.needsUpdate = true));
    if (slab.current) slab.current.position.y = slabY;
  });

  return (
    <group>
      <group ref={slab}>
        <mesh position={[NP.x, -0.25, NP.z]} receiveShadow>
          <boxGeometry args={[25, 0.5, 21]} />
          <meshStandardMaterial color="#20272a" roughness={0.55} metalness={0.2} />
        </mesh>
        <lineSegments geometry={slabEdges} position={[NP.x, -0.25, NP.z]}>
          <lineBasicMaterial color={C.lightGrey} transparent opacity={0.45} toneMapped={false} />
        </lineSegments>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[NP.x, 0.02, NP.z]} material={pool}>
          <planeGeometry args={[34, 26]} />
        </mesh>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          return (
            <group key={i} position={[NP.x + ROW_X[r], 0.03, NP.z + COL_Z(c)]}>
              <lineLoop ref={(l) => { if (l) slots.current[i] = l; }} geometry={slotGeo} material={slotMat.clone()} />
              <sprite ref={(s) => { if (s) rings.current[i] = s; }} position={[0.5, 0.2, 0]} scale={[5, 3, 1]} visible={false}>
                <spriteMaterial map={tex} color={C.lightGrey} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </sprite>
            </group>
          );
        })}
      </group>
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
