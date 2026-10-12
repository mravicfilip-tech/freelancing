// The hard edges of the real X50 for the servis schematic. The glTF files are quantised, so positions are copied into
// plain floats before any transform, and the edges of every part are taken in the part's own frame, so the wheels
// keep their lines when they turn. The X50 faces its forks toward -x in the file, the schematic turns it to +x.
import * as THREE from 'three';

export const X50 = {
  yaw: Math.PI, // turn that puts the forks toward +x
  ground: 0.425, // height of the model origin above the ground
  spin: 1, // sign of the wheel spin
  wheels: [
    { node: 'fl_wheel', r: 0.41 },
    { node: 'fr_wheel', r: 0.41 },
    { node: 'bl_wheel', r: 0.38 },
    { node: 'br_wheel', r: 0.38 },
  ],
};

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

// A clone of the model with its logos hidden and its matrices up to date.
export function prepareX50(src: THREE.Object3D) {
  const scene = src.clone(true);
  scene.updateMatrixWorld(true);
  return scene;
}

// Body edges at the given angle, short bits dropped. Wheel parts are left out, the schematic draws clean circles for them.
export function bodyEdges(src: THREE.Object3D, angle = 40, minLen = 0.03): number[] {
  const scene = prepareX50(src);
  const wheelNodes = X50.wheels.map((w) => scene.getObjectByName(w.node)).filter((o): o is THREE.Object3D => !!o);
  const out: number[] = [];
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (p.visible === false || wheelNodes.includes(p)) return;
    const e = new THREE.EdgesGeometry(plain(m.geometry), angle);
    const pos = e.getAttribute('position');
    for (let i = 0; i < pos.count; i += 2) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1).applyMatrix4(m.matrixWorld);
      if (a.distanceTo(b) >= minLen) out.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    e.dispose();
    void v;
  });
  return out;
}
