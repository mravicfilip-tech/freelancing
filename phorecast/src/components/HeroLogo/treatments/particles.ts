import * as THREE from 'three';
import { PARTICLES as C } from '../config';
import { extrudeLogo } from '../logoPath';
import { sampleSurface } from './sampleSurface';
import pointsVert from '../shaders/points.vert.glsl?raw';
import pointsFrag from '../shaders/points.frag.glsl?raw';
import type { FrameState, Treatment, TreatmentContext } from './types';

const lcg = (seed: number) => {
  let s = (seed * 7919 + 1) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Points spread over the mark's surface; they assemble from a scatter and fly off along their normals on scroll. */
export class ParticlesTreatment implements Treatment {
  readonly physical = false;
  readonly maxPixelRatio = 2;
  readonly entrance = 'draw' as const;

  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;

  build({ pivot }: TreatmentContext) {
    const surface = extrudeLogo({ depth: C.depth, bevel: 0.01, bevelSegments: 1, divisions: 10 });
    const { positions, normals } = sampleSurface(surface, C.count, 7);
    surface.dispose();

    const rand = lcg(3);
    const start = new Float32Array(C.count * 3);
    const seed = new Float32Array(C.count);
    const delay = new Float32Array(C.count);
    const dir = new THREE.Vector3();
    for (let i = 0; i < C.count; i++) {
      // Scatter: the target pushed out along a random direction, further for later-arriving points.
      dir.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      const d = rand();
      const r = C.scatter * (0.4 + 0.6 * d);
      start[i * 3] = positions[i * 3] + dir.x * r;
      start[i * 3 + 1] = positions[i * 3 + 1] + dir.y * r;
      start[i * 3 + 2] = positions[i * 3 + 2] + dir.z * r * 0.6;
      seed[i] = rand();
      delay[i] = d;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
    this.geometry = geo;

    this.material = new THREE.ShaderMaterial({
      vertexShader: pointsVert,
      fragmentShader: pointsFrag,
      uniforms: {
        uColor: { value: new THREE.Color(C.color) },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uFly: { value: 0 },
        uSizePx: { value: C.sizePx },
        uDpr: { value: 1 },
        uViewDist: { value: 1 },
        uDepthNear: { value: 0 },
        uDepthFar: { value: -1 },
        uDepthFade: { value: C.depthFade },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const points = new THREE.Points(geo, this.material);
    points.frustumCulled = false;
    pivot.add(points);
  }

  layout(f: FrameState) {
    const u = this.material.uniforms;
    u.uDpr.value = f.dpr;
    u.uViewDist.value = f.viewDist;
    u.uDepthNear.value = -f.viewDist + f.size * 0.6;
    u.uDepthFar.value = -f.viewDist - f.size * 0.6;
  }

  update(f: FrameState) {
    const u = this.material.uniforms;
    u.uProgress.value = f.progress;
    u.uTime.value = f.time;
    u.uFly.value = f.scroll * C.scrollFly;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
