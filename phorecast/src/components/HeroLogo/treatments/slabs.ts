// Named imports, not a namespace import: `import * as THREE` defeats
// tree-shaking, so the whole library ships whether it is used or not.
import { BufferGeometry, Material, Mesh } from 'three';

/** `count` copies of a geometry stacked through the depth, `gap` apart, centred on z = 0. */
export function makeSlabs(geometry: BufferGeometry, material: Material | Material[], count: number, gap: number): Mesh[] {
  const slabs: Mesh[] = [];
  for (let k = 0; k < count; k++) {
    const mesh = new Mesh(geometry, material);
    mesh.position.z = (k - (count - 1) / 2) * gap;
    slabs.push(mesh);
  }
  return slabs;
}

/** The exploded view: multiplies every slab's spacing. */
export function spreadSlabs(slabs: Mesh[], gap: number, spread: number) {
  const n = slabs.length;
  slabs.forEach((s, k) => {
    s.position.z = (k - (n - 1) / 2) * gap * spread;
  });
}
