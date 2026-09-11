import * as THREE from 'three';
import { LINED as C } from '../config';
import { logoOutline } from '../logoPath';
import linesVert from '../shaders/lines.vert.glsl?raw';
import linesFrag from '../shaders/lines.frag.glsl?raw';
import type { FrameState, Treatment, TreatmentContext } from './types';

/**
 * The outline extruded into a stack of slices joined by ribs, drawn as additive orange lines:
 * one instanced quad per segment, widened in screen space, in a thin core pass and a wide glow pass.
 */
export class LinedTreatment implements Treatment {
  readonly physical = false;
  readonly maxPixelRatio = 2;
  readonly entrance = 'draw' as const;

  private geometry!: THREE.InstancedBufferGeometry;
  private readonly materials: THREE.ShaderMaterial[] = [];
  private readonly shared = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSpread: { value: 1 },
    uDepthNear: { value: 0 },
    uDepthFar: { value: -1 },
  };

  build({ pivot }: TreatmentContext) {
    const pts = logoOutline(C.outlineSamples);
    const n = pts.length;
    const K = C.slices;
    const depth = C.depth;

    const start: number[] = [];
    const end: number[] = [];
    const t: number[] = [];
    const intensity: number[] = [];
    const delay: number[] = [];
    const seg = (a: THREE.Vector2, az: number, b: THREE.Vector2, bz: number, ta: number, tb: number, ia: number, ib: number, d: number) => {
      start.push(a.x, a.y, az);
      end.push(b.x, b.y, bz);
      t.push(ta, tb);
      intensity.push(ia, ib);
      delay.push(d);
    };

    for (let k = 0; k < K; k++) {
      const f = K > 1 ? k / (K - 1) : 1; // 0 = back, 1 = front
      const z = (f - 0.5) * depth;
      const cap = k === 0 || k === K - 1;
      const i0 = cap ? C.capIntensity : C.sliceIntensity;
      // The front outline draws first, the inner slices follow front to back, the back cap last.
      const d = k === K - 1 ? 0 : cap ? 0.85 : 0.15 + 0.6 * (1 - f);
      for (let i = 0; i < n; i++) seg(pts[i], z, pts[(i + 1) % n], z, i / n, (i + 1) / n, i0, i0, d);
    }

    // Ribs: evenly spaced, plus every corner so the extrusion's silhouette edges read.
    const ribAt = new Set<number>();
    for (let j = 0; j < C.ribs; j++) ribAt.add(Math.floor((j * n) / C.ribs));
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      const u = b.clone().sub(a).normalize(), v = c.clone().sub(b).normalize();
      if (Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1)) > C.cornerAngleRad) ribAt.add(i);
    }
    for (const i of ribAt) seg(pts[i], -depth / 2, pts[i], depth / 2, i / n, i / n, C.ribIntensity, C.ribIntensity, 0.5);

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aStart', new THREE.InstancedBufferAttribute(new Float32Array(start), 3));
    geo.setAttribute('aEnd', new THREE.InstancedBufferAttribute(new Float32Array(end), 3));
    geo.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(t), 2));
    geo.setAttribute('aIntensity', new THREE.InstancedBufferAttribute(new Float32Array(intensity), 2));
    geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(new Float32Array(delay), 1));
    geo.instanceCount = delay.length;
    this.geometry = geo;

    // Glow underneath, core on top; both additive so crossings brighten.
    for (const pass of [C.glow, C.core]) {
      const material = new THREE.ShaderMaterial({
        vertexShader: linesVert,
        fragmentShader: linesFrag,
        uniforms: {
          ...this.shared,
          uColor: { value: new THREE.Color(C.color) },
          uOpacity: { value: pass.opacity },
          uWidth: { value: pass.width },
          uFeather: { value: pass.feather },
          uCore: { value: pass.width / (pass.width + pass.feather) },
          uPulse: { value: pass.pulse },
          uPulseSpeed: { value: C.pulseSpeed },
          uDepthFade: { value: C.depthFade },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        // rgb: additive; alpha: "over" — so a lone faded line composites like a normal one.
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      });
      this.materials.push(material);
      const mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      pivot.add(mesh);
    }
  }

  layout(f: FrameState) {
    this.shared.uResolution.value.copy(f.resolution);
    this.shared.uDepthNear.value = -f.viewDist + f.size * 0.6;
    this.shared.uDepthFar.value = -f.viewDist - f.size * 0.6;
    this.materials.forEach((m, i) => {
      const pass = i === 0 ? C.glow : C.core;
      m.uniforms.uWidth.value = pass.width * f.dpr;
      m.uniforms.uFeather.value = pass.feather * f.dpr;
    });
  }

  update(f: FrameState) {
    this.shared.uProgress.value = f.progress;
    this.shared.uTime.value = f.time;
    this.shared.uSpread.value = 1 + f.scroll * C.scrollSpread;
  }

  dispose() {
    this.geometry.dispose();
    this.materials.forEach((m) => m.dispose());
  }
}
