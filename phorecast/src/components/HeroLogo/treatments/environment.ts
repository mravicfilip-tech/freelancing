// Named imports, not a namespace import: `import * as THREE` defeats
// tree-shaking, so the whole library ships whether it is used or not.
import { BackSide, BoxGeometry, BufferGeometry, DoubleSide, Light, Material, Mesh, MeshBasicMaterial, PMREMGenerator, PlaneGeometry, Scene, Texture, Vector3, WebGLRenderer } from 'three';

export interface Environment {
  texture: Texture;
  dispose(): void;
}

/**
 * A small procedural studio for reflections: a dark room with a warm strip light above-right, a
 * cool strip on the left and an orange bounce below. Pre-filtered once with PMREM.
 */
export function makeEnvironment(renderer: WebGLRenderer): Environment {
  const room = new Scene();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const add = (geometry: BufferGeometry, material: Material, position?: Vector3) => {
    const mesh = new Mesh(geometry, material);
    if (position) {
      mesh.position.copy(position);
      mesh.lookAt(0, 0, 0);
    }
    room.add(mesh);
    geometries.push(geometry);
    materials.push(material);
  };
  const panel = (color: number, intensity: number, w: number, h: number, position: Vector3) => {
    const material = new MeshBasicMaterial({ color, side: DoubleSide });
    material.color.multiplyScalar(intensity);
    add(new PlaneGeometry(w, h), material, position);
  };
  add(new BoxGeometry(12, 12, 12), new MeshBasicMaterial({ color: 0x0a0908, side: BackSide }));
  panel(0xfff3e6, 7, 4.5, 1.2, new Vector3(2.5, 4, 2.5));
  panel(0xdfe8ff, 2.5, 1, 3.5, new Vector3(-4.5, 1, 1.5));
  panel(0xff632a, 3.5, 4, 3, new Vector3(0.5, -3.5, -3));

  const pmrem = new PMREMGenerator(renderer);
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
export function addLights(scene: Scene, lights: Light[]): () => void {
  lights.forEach((l) => scene.add(l));
  return () => {
    lights.forEach((l) => {
      scene.remove(l);
      l.dispose();
    });
  };
}
