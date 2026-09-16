import * as THREE from 'three';

export interface Environment {
  texture: THREE.Texture;
  dispose(): void;
}

/**
 * A small procedural studio for reflections: a dark room with a warm strip light above-right, a
 * cool strip on the left and an orange bounce below. Pre-filtered once with PMREM.
 */
export function makeEnvironment(renderer: THREE.WebGLRenderer): Environment {
  const room = new THREE.Scene();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position?: THREE.Vector3) => {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) {
      mesh.position.copy(position);
      mesh.lookAt(0, 0, 0);
    }
    room.add(mesh);
    geometries.push(geometry);
    materials.push(material);
  };
  const panel = (color: number, intensity: number, w: number, h: number, position: THREE.Vector3) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    material.color.multiplyScalar(intensity);
    add(new THREE.PlaneGeometry(w, h), material, position);
  };
  add(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x0a0908, side: THREE.BackSide }));
  panel(0xfff3e6, 7, 4.5, 1.2, new THREE.Vector3(2.5, 4, 2.5));
  panel(0xdfe8ff, 2.5, 1, 3.5, new THREE.Vector3(-4.5, 1, 1.5));
  panel(0xff632a, 3.5, 4, 3, new THREE.Vector3(0.5, -3.5, -3));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.04);
  pmrem.dispose();
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());

  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  };
}

/** Adds lights to the scene and returns the function that removes them again. */
export function addLights(scene: THREE.Scene, lights: THREE.Light[]): () => void {
  lights.forEach((l) => scene.add(l));
  return () => {
    lights.forEach((l) => {
      scene.remove(l);
      l.dispose();
    });
  };
}
