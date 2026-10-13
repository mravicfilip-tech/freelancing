// Turns the real models into cheaper forms. A merged static truck per material for instanced rows, and the
// hard edges of every part for the blueprint, split so the wheels keep turning.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { prepare, SPEC, type ModelName } from './models';

export type Baked = { mat: THREE.Material; geo: THREE.BufferGeometry }[];

// The glTF files are quantised, so copy positions and normals into plain floats before any transform.
function plain(src: THREE.BufferGeometry) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  const out = new THREE.BufferGeometry();
  for (const n of ['position', 'normal'] as const) {
    const a = g.getAttribute(n);
    if (!a) continue;
    const arr = new Float32Array(a.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    out.setAttribute(n, new THREE.BufferAttribute(arr, 3));
  }
  if (!out.getAttribute('normal')) out.computeVertexNormals();
  g.dispose();
  return out;
}

// A model baked in the pose it stands in, facing +x with its wheels on the ground.
export function bakeStatic(gltfScene: THREE.Object3D, name: ModelName): Baked {
  const spec = SPEC[name];
  const scene = prepare(gltfScene, name);
  const base = new THREE.Matrix4().compose(new THREE.Vector3(0, spec.ground, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spec.yaw, 0)), new THREE.Vector3(1, 1, 1));
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    let p: THREE.Object3D | null = m;
    while (p) {
      if (p.visible === false) return;
      p = p.parent;
    }
    const g = plain(m.geometry);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(base, m.matrixWorld));
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
    const list = groups.get(mat) ?? [];
    list.push(g);
    groups.set(mat, list);
  });
  const out: Baked = [];
  groups.forEach((gs, mat) => {
    const geo = mergeGeometries(gs, false);
    if (geo) out.push({ mat, geo });
  });
  return out;
}

export type EdgeSet = { body: number[]; wheels: { r: number; pos: THREE.Vector3; scale: THREE.Vector3; pts: number[] }[] };

export function bakeEdges(gltfScene: THREE.Object3D, name: ModelName, angle = 28): EdgeSet {
  const spec = SPEC[name];
  const scene = prepare(gltfScene, name);
  const wheelNodes = spec.wheels.map((w) => ({ obj: scene.getObjectByName(w.node), r: w.r })).filter((w): w is { obj: THREE.Object3D; r: number } => !!w.obj);
  const set: EdgeSet = { body: [], wheels: wheelNodes.map((w) => ({ r: w.r, pos: w.obj.position.clone(), scale: w.obj.scale.clone(), pts: [] as number[] })) };
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    let p: THREE.Object3D | null = m;
    while (p) {
      if (p.visible === false) return;
      p = p.parent;
    }
    let wi = -1;
    wheelNodes.forEach((w, i) => {
      let q: THREE.Object3D | null = m;
      while (q) {
        if (q === w.obj) wi = i;
        q = q.parent;
      }
    });
    // A wheel's lines live in its own frame without the node scale, the blueprint puts the scale back.
    const frame = wi >= 0 ? new THREE.Matrix4().copy(wheelNodes[wi].obj.matrixWorld).invert() : new THREE.Matrix4();
    const mat = new THREE.Matrix4().multiplyMatrices(frame, m.matrixWorld);
    const edges = new THREE.EdgesGeometry(plain(m.geometry), angle);
    const pos = edges.getAttribute('position');
    const dst = wi >= 0 ? set.wheels[wi].pts : set.body;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat);
      dst.push(v.x, v.y, v.z);
    }
    edges.dispose();
  });
  return set;
}
