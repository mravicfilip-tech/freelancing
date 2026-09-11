import * as THREE from 'three';

const lcg = (seed: number) => {
  let s = (seed * 7919 + 1) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** `count` points spread evenly (area-weighted) over a geometry's triangles, with the triangle's normal. */
export function sampleSurface(geometry: THREE.BufferGeometry, count: number, seed = 1): { positions: Float32Array; normals: Float32Array } {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const tris = pos.count / 3;
  const cumulative = new Float32Array(tris);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  let total = 0;
  for (let i = 0; i < tris; i++) {
    a.fromBufferAttribute(pos, i * 3);
    b.fromBufferAttribute(pos, i * 3 + 1);
    c.fromBufferAttribute(pos, i * 3 + 2);
    total += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
    cumulative[i] = total;
  }

  const rand = lcg(seed);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  for (let k = 0; k < count; k++) {
    const r = rand() * total;
    let lo = 0, hi = tris - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    a.fromBufferAttribute(pos, lo * 3);
    b.fromBufferAttribute(pos, lo * 3 + 1);
    c.fromBufferAttribute(pos, lo * 3 + 2);
    let u = rand(), v = rand();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac).normalize();
    positions[k * 3] = a.x + ab.x * u + ac.x * v;
    positions[k * 3 + 1] = a.y + ab.y * u + ac.y * v;
    positions[k * 3 + 2] = a.z + ab.z * u + ac.z * v;
    normals[k * 3] = n.x;
    normals[k * 3 + 1] = n.y;
    normals[k * 3 + 2] = n.z;
  }
  if (g !== geometry) g.dispose();
  return { positions, normals };
}
