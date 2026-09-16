import * as THREE from 'three';

/** `count` copies of a geometry stacked through the depth, `gap` apart, centred on z = 0. */
export function makeSlabs(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], count: number, gap: number): THREE.Mesh[] {
  const slabs: THREE.Mesh[] = [];
  for (let k = 0; k < count; k++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = (k - (count - 1) / 2) * gap;
    slabs.push(mesh);
  }
  return slabs;
}

/** The exploded view: multiplies every slab's spacing. */
export function spreadSlabs(slabs: THREE.Mesh[], gap: number, spread: number) {
  const n = slabs.length;
  slabs.forEach((s, k) => {
    s.position.z = (k - (n - 1) / 2) * gap * spread;
  });
}
