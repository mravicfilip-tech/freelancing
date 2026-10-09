// The servis stage. The forklift as a white line blueprint on dark ground. It stays where it is, only its
// wheels turn. The lines come from the real model's hard edges, drawn on as the beat opens.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { C } from '../../../tokens';
import type { SceneProps } from '../../clock';
import { useGLTF } from '@react-three/drei';
import { bakeEdges } from './bake';
import { SPEC, modelUrl } from './models';
import { BP } from './route';
import { ease, range, poolMaterial, uOf } from './kit';

function seg(points: number[], mat: LineMaterial) {
  const g = new LineSegmentsGeometry();
  g.setPositions(new Float32Array(points));
  const l = new LineSegments2(g, mat);
  l.frustumCulled = false;
  return l;
}

export default function Blueprint({ clock }: SceneProps) {
  const gltf = useGLTF(modelUrl('x50')) as unknown as { scene: THREE.Group };
  const edges = useMemo(() => bakeEdges(gltf.scene, 'x50'), [gltf]);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const wheelGroups = useRef<THREE.Group[]>([]);
  const mat = useMemo(() => new LineMaterial({ color: 0xffffff, linewidth: 1.5, transparent: true, opacity: 0.92, toneMapped: false }), []);
  const matWheel = useMemo(() => new LineMaterial({ color: 0xffffff, linewidth: 1.5, transparent: true, opacity: 0.92, toneMapped: false }), []);
  const body = useMemo(() => seg(edges.body, mat), [edges, mat]);
  const wheels = useMemo(() => edges.wheels.map((w) => ({ r: w.r, pos: w.pos, scale: w.scale, line: seg(w.pts, matWheel) })), [edges, matWheel]);
  const grid = useMemo(() => {
    const pts: number[] = [];
    for (let i = -30; i <= 30; i += 2) pts.push(i, 0, -30, i, 0, 30, -30, 0, i, 30, 0, i);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const rings = useMemo(() => {
    return [2.6, 4.2, 6.5].map((r) => {
      const p: THREE.Vector3[] = [];
      for (let i = 0; i < 96; i++) p.push(new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2) * r, 0, Math.sin((i / 96) * Math.PI * 2) * r));
      return new THREE.BufferGeometry().setFromPoints(p);
    });
  }, []);
  const pool = useMemo(() => poolMaterial(0.35, C.lightGrey), []);
  const gridMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.white, transparent: true, opacity: 0.045, toneMapped: false }), []);
  const ringMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.white, transparent: true, opacity: 0.16, toneMapped: false }), []);

  useEffect(() => {
    mat.resolution.set(size.width * dpr, size.height * dpr);
    matWheel.resolution.set(size.width * dpr, size.height * dpr);
    mat.linewidth = matWheel.linewidth = 1.5 * dpr;
  }, [size, dpr, mat, matWheel]);

  useFrame(() => {
    const u = uOf(clock);
    const pos = clock.pos.current;
    const draw = ease(range(u, 10.0, 10.55));
    const total = body.geometry.attributes.instanceStart?.count ?? 0;
    (body.geometry as LineSegmentsGeometry & { instanceCount: number }).instanceCount = Math.max(0, Math.floor(total * draw));
    const roll = (pos - 8000) * 0.011;
    wheelGroups.current.forEach((g, i) => {
      if (g) g.rotation.z = roll / wheels[i].r;
    });
    mat.opacity = matWheel.opacity = 0.92 * Math.min(1, draw * 3);
    gridMat.opacity = 0.05 * ease(range(u, 10.0, 10.4));
    ringMat.opacity = 0.15 * ease(range(u, 10.1, 10.6));
  });

  return (
    <group position={[BP.x, 0, BP.z]}>
      <lineSegments geometry={grid} material={gridMat} position={[0, 0.01, 0]} />
      {rings.map((g, i) => (
        <lineLoop key={i} geometry={g} material={ringMat} position={[0.2, 0.012, 0]} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.02, 0]} material={pool}>
        <planeGeometry args={[14, 9]} />
      </mesh>
      <group position={[0, SPEC.x50.ground, 0]} rotation={[0, SPEC.x50.yaw, 0]}>
        <primitive object={body} />
        {wheels.map((w, i) => (
          <group key={i} position={w.pos} scale={w.scale} ref={(g) => { if (g) wheelGroups.current[i] = g; }}>
            <primitive object={w.line} />
          </group>
        ))}
      </group>
    </group>
  );
}
