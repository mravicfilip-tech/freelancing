// Line drawing overlays. addEdges walks a subtree and gives every mesh a LineSegments outline of
// its hard edges in one colour, for x-ray and blueprint looks. The returned material sets the
// opacity of every outline at once. Call it after the subtree is built.

import * as THREE from 'three';

export function addEdges(root: THREE.Object3D, colour: string, threshold = 20) {
  const mat = new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 1 });
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  for (const m of meshes) {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, threshold), mat);
    lines.renderOrder = 1;
    m.add(lines);
  }
  return mat;
}

// Fades a solid material and lets lines behind it show through as it goes.
export function setSolidOpacity(mat: THREE.Material, o: number) {
  mat.transparent = o < 1;
  mat.opacity = o;
  mat.depthWrite = o > 0.5;
  mat.visible = o > 0.001;
}
