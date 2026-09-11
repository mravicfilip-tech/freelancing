import * as THREE from 'three';
import { LIQUID as C } from '../config';
import { extrudeLogo } from '../logoPath';
import rippleGlsl from '../shaders/ripple.glsl?raw';
import { addLights, makeEnvironment, type Environment } from './environment';
import type { FrameState, Treatment, TreatmentContext } from './types';

/**
 * One extrusion with a wet, rippling surface: a sum-of-sines field over object space tilts the
 * shading normal in the fragment shader, so highlights and reflections move while the geometry
 * stays put. On scroll the ripple boils harder and the mark stretches through its depth.
 */
export class LiquidTreatment implements Treatment {
  readonly physical = true;
  readonly maxPixelRatio = 2;
  readonly entrance = 'rise' as const;

  private geometry!: THREE.BufferGeometry;
  private material!: THREE.MeshPhysicalMaterial;
  private mesh!: THREE.Mesh;
  private env!: Environment;
  private removeLights: () => void = () => undefined;
  private readonly ripple = {
    uRippleTime: { value: 0 },
    uRippleAmp: { value: C.ripple as number },
    uRippleFreq: { value: C.freq },
  };

  build({ pivot, scene, renderer }: TreatmentContext) {
    this.env = makeEnvironment(renderer);
    this.geometry = extrudeLogo({ depth: C.depth, bevel: C.bevel, bevelSegments: 3, divisions: 16 });

    this.material = new THREE.MeshPhysicalMaterial({
      color: C.color,
      roughness: C.roughness,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMap: this.env.texture,
      envMapIntensity: C.envIntensity,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.ripple);
      // The gradient is in object space; normalMatrix only exists in the vertex stage, so its
      // columns ride along as varyings to rotate the gradient into view space per fragment.
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRipplePos;\nvarying vec3 vRippleX;\nvarying vec3 vRippleY;\nvarying vec3 vRippleZ;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvRipplePos = position;\nvRippleX = normalMatrix[0];\nvRippleY = normalMatrix[1];\nvRippleZ = normalMatrix[2];',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vRipplePos;\nvarying vec3 vRippleX;\nvarying vec3 vRippleY;\nvarying vec3 vRippleZ;\n${rippleGlsl}`)
        .replace(
          '#include <normal_fragment_maps>',
          '#include <normal_fragment_maps>\nvec3 rippleG = rippleGradient(vRipplePos);\nnormal = normalize(normal + (vRippleX * rippleG.x + vRippleY * rippleG.y + vRippleZ * rippleG.z) * uRippleAmp);',
        );
    };
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    pivot.add(this.mesh);

    const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
    key.position.set(2, 3, 4);
    const rim = new THREE.DirectionalLight(0xffb088, 2.5);
    rim.position.set(-3, 1, -4);
    this.removeLights = addLights(scene, [key, rim, new THREE.AmbientLight(0xffffff, 0.12)]);
  }

  layout() {
    /* nothing pixel- or size-dependent */
  }

  update(f: FrameState) {
    this.ripple.uRippleTime.value = f.time * C.speed * (1 + f.scroll * 2);
    this.ripple.uRippleAmp.value = C.ripple * (1 + f.scroll * C.scrollBoil);
    this.mesh.scale.z = 1 + f.scroll * C.scrollStretch;
  }

  dispose() {
    this.removeLights();
    this.geometry.dispose();
    this.material.dispose();
    this.env.dispose();
  }
}
