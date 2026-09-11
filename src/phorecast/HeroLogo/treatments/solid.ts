import * as THREE from 'three';
import { SOLID as C } from '../config';
import { extrudeLogo } from '../logoPath';
import { addLights, makeEnvironment, type Environment } from './environment';
import { makeSlabs, spreadSlabs } from './slabs';
import type { FrameState, Treatment, TreatmentContext } from './types';

/** Matte slabs: an orange face, dark sides, a warm key and one orange rim light from behind. */
export class SolidTreatment implements Treatment {
  readonly physical = true;
  readonly maxPixelRatio = 2;
  readonly entrance = 'rise' as const;

  private geometry!: THREE.BufferGeometry;
  private materials: THREE.MeshStandardMaterial[] = [];
  private slabs: THREE.Mesh[] = [];
  private env!: Environment;
  private removeLights: () => void = () => undefined;

  build({ pivot, scene, renderer }: TreatmentContext) {
    this.env = makeEnvironment(renderer);
    this.geometry = extrudeLogo({ depth: C.slabDepth, bevel: C.bevel, bevelSegments: 2 });
    // ExtrudeGeometry groups: 0 = front and back faces, 1 = the sides.
    const face = new THREE.MeshStandardMaterial({
      color: C.face,
      emissive: C.faceEmissive,
      roughness: 0.42,
      metalness: 0.05,
      envMap: this.env.texture,
      envMapIntensity: C.faceEnvIntensity,
    });
    const side = new THREE.MeshStandardMaterial({
      color: C.side,
      roughness: 0.55,
      metalness: 0.3,
      envMap: this.env.texture,
      envMapIntensity: C.sideEnvIntensity,
    });
    this.materials = [face, side];
    this.slabs = makeSlabs(this.geometry, this.materials, 3, C.slabGap);
    this.slabs.forEach((s) => pivot.add(s));

    const key = new THREE.DirectionalLight(0xfff4ea, 2.2);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(C.face, 4);
    rim.position.set(-4, 2, -3);
    const fill = new THREE.DirectionalLight(0x6a5040, 0.5);
    fill.position.set(-3, -2, 3);
    this.removeLights = addLights(scene, [key, rim, fill, new THREE.AmbientLight(0xffffff, 0.1)]);
  }

  layout() {
    /* nothing pixel- or size-dependent */
  }

  update(f: FrameState) {
    spreadSlabs(this.slabs, C.slabGap, 1 + f.scroll * C.scrollSpread);
  }

  dispose() {
    this.removeLights();
    this.geometry.dispose();
    this.materials.forEach((m) => m.dispose());
    this.env.dispose();
  }
}
