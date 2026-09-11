import * as THREE from 'three';
import { GLASS as C } from '../config';
import { extrudeLogo } from '../logoPath';
import { addLights, makeEnvironment, type Environment } from './environment';
import { makeSlabs, spreadSlabs } from './slabs';
import type { FrameState, Treatment, TreatmentContext } from './types';

/** Three slabs of tinted, transmissive glass under the procedural studio. */
export class GlassTreatment implements Treatment {
  readonly physical = true;
  readonly maxPixelRatio = C.maxPixelRatio;
  readonly entrance = 'rise' as const;

  private geometry!: THREE.BufferGeometry;
  private material!: THREE.MeshPhysicalMaterial;
  private slabs: THREE.Mesh[] = [];
  private env!: Environment;
  private removeLights: () => void = () => undefined;

  build({ pivot, scene, renderer }: TreatmentContext) {
    this.env = makeEnvironment(renderer);
    this.geometry = extrudeLogo({ depth: C.slabDepth, bevel: C.bevel, bevelSegments: 4 });
    this.material = new THREE.MeshPhysicalMaterial({
      color: C.color,
      transmission: 1,
      roughness: C.roughness,
      metalness: 0,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color(C.attenuationColor),
      envMap: this.env.texture,
      envMapIntensity: C.envIntensity,
    });
    this.slabs = makeSlabs(this.geometry, this.material, 3, C.slabGap);
    this.slabs.forEach((s) => pivot.add(s));

    const key = new THREE.DirectionalLight(0xfff1e0, 2.5);
    key.position.set(2, 3, 4);
    const rim = new THREE.DirectionalLight(C.color, 3);
    rim.position.set(-3, 1, -4);
    this.removeLights = addLights(scene, [key, rim, new THREE.AmbientLight(0xffffff, 0.15)]);
  }

  layout(f: FrameState) {
    // three scales `thickness` by the object's world scale (the mark's height in pixels) on its own;
    // `attenuationDistance` is compared against that scaled ray, so it is the one to scale here.
    this.material.thickness = C.thickness;
    this.material.attenuationDistance = C.attenuationDistance * f.size;
  }

  update(f: FrameState) {
    spreadSlabs(this.slabs, C.slabGap, 1 + f.scroll * C.scrollSpread);
  }

  dispose() {
    this.removeLights();
    this.geometry.dispose();
    this.material.dispose();
    this.env.dispose();
  }
}
