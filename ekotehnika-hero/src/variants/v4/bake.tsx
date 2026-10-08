// Turns a mounted model into a few instanced meshes, one per material. The shared Forklift is a
// hundred and more meshes, so a yard full of them is baked once and drawn as instances. Moving
// instances get new matrices every frame through the fleet api.
import { useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Part = { geometry: THREE.BufferGeometry; material: THREE.Material };

const cache = new Map<string, Part[]>();

// Rebuilds round shapes with fewer segments. A baked fleet is seen small, so a tyre does not need
// forty sides. The rebuilt shape is moved and turned to sit where the original sat.
function lighten(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = (src as THREE.BufferGeometry & { parameters?: Record<string, unknown> }).parameters as Record<string, never> | undefined;
  if (!p) return src;
  let g: THREE.BufferGeometry | null = null;
  switch (src.type) {
    case 'CylinderGeometry':
      g = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, Math.min(p.radialSegments, 10), 1, p.openEnded);
      break;
    case 'TorusGeometry':
      g = new THREE.TorusGeometry(p.radius, p.tube, 4, 14);
      break;
    case 'LatheGeometry':
      g = new THREE.LatheGeometry(p.points, Math.min(p.segments, 14));
      break;
    case 'SphereGeometry':
      g = new THREE.SphereGeometry(p.radius, 10, 6);
      break;
    case 'ExtrudeGeometry': {
      const o = p.options as THREE.ExtrudeGeometryOptions;
      g = new THREE.ExtrudeGeometry(p.shapes, { ...o, curveSegments: Math.min(o.curveSegments ?? 12, 6), bevelSegments: Math.min(o.bevelSegments ?? 3, 1) });
      break;
    }
  }
  if (!g) return src;
  src.computeBoundingBox();
  g.computeBoundingBox();
  const a = src.boundingBox!.getSize(new THREE.Vector3());
  const b = g.boundingBox!.getSize(new THREE.Vector3());
  // the forklift turns its tyres after building them, so turn the rebuilt one the same way
  if (Math.abs(a.y - b.y) > 0.02 && Math.abs(a.y - b.z) < 0.02) {
    g.rotateX(Math.PI / 2);
    g.computeBoundingBox();
  }
  const ca = src.boundingBox!.getCenter(new THREE.Vector3());
  const cb = g.boundingBox!.getCenter(new THREE.Vector3());
  g.translate(ca.x - cb.x, ca.y - cb.y, ca.z - cb.z);
  return g;
}

function bake(root: THREE.Object3D, mapMaterial: (m: THREE.Material) => THREE.Material, skip?: (m: THREE.Mesh) => boolean): Part[] {
  root.updateWorldMatrix(true, true);
  const inv = root.matrixWorld.clone().invert();
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    if (skip?.(mesh)) return;
    const lite = lighten(mesh.geometry);
    const g = lite.index ? lite.toNonIndexed() : lite === mesh.geometry ? lite.clone() : lite;
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.morphAttributes = {};
    g.clearGroups();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld));
    const mat = mapMaterial(mesh.material);
    const list = groups.get(mat) ?? [];
    list.push(g);
    groups.set(mat, list);
  });
  return [...groups].map(([material, gs]) => ({ material, geometry: mergeGeometries(gs, false)! }));
}

// Mounts children once, hidden, bakes them, then unmounts them.
export function useBaked(key: string, model: ReactNode, mapMaterial: (m: THREE.Material) => THREE.Material = (m) => m, skip?: (m: THREE.Mesh) => boolean) {
  const [parts, setParts] = useState<Part[] | null>(() => cache.get(key) ?? null);
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (parts || !ref.current) return;
    const p = bake(ref.current, mapMaterial, skip);
    cache.set(key, p);
    setParts(p);
  });
  const source = parts ? null : (
    <group ref={ref} visible={false}>
      {model}
    </group>
  );
  return { parts, source };
}

export type FleetApi = {
  set: (i: number, m: THREE.Matrix4) => void;
  commit: () => void;
};

const tmp = new THREE.Matrix4();
const q = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);
const sc = new THREE.Vector3(1, 1, 1);
const v = new THREE.Vector3();

export function pose(x: number, y: number, z: number, ry: number, s = 1, out = tmp) {
  q.setFromAxisAngle(up, ry);
  sc.set(s, s, s);
  return out.compose(v.set(x, y, z), q, sc);
}

export type Placement = [x: number, y: number, z: number, ry: number, s?: number];

// Draws the baked parts at each placement. Pass apiRef to move them later.
export function Fleet({
  parts,
  items,
  apiRef,
  shadows = true,
}: {
  parts: Part[] | null;
  items: Placement[];
  apiRef?: MutableRefObject<FleetApi | null>;
  shadows?: boolean;
}) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const count = items.length;
  useLayoutEffect(() => {
    if (!parts) return;
    meshes.current.forEach((m) => {
      if (!m) return;
      items.forEach((it, i) => m.setMatrixAt(i, pose(it[0], it[1], it[2], it[3], it[4] ?? 1)));
      m.instanceMatrix.needsUpdate = true;
    });
    if (apiRef)
      apiRef.current = {
        set: (i, mat) => meshes.current.forEach((m) => m?.setMatrixAt(i, mat)),
        commit: () =>
          meshes.current.forEach((m) => {
            if (m) m.instanceMatrix.needsUpdate = true;
          }),
      };
  }, [parts, items, apiRef]);
  const list = useMemo(() => parts ?? [], [parts]);
  return (
    <>
      {list.map((p, i) => (
        <instancedMesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          args={[p.geometry, p.material, count]}
          castShadow={shadows}
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}
