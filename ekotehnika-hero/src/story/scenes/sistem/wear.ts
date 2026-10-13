// Material work for the Sistem scene. prepare() swaps every mesh under a root for its own clone, so
// a clipping plane and the wear shader stay on this truck and never touch the shared materials in
// src/r3f/materials.ts.
//
// Wear. A truck can be worn from one end to the other. Everything behind uCut in the truck's own x
// is dull, scuffed and rougher, everything ahead is as new, with a thin bright edge on the line
// between, so a rebuilding pass reads as a front of light moving along the truck.
import * as THREE from 'three';

export type WearU = { uCut: { value: number }; uAmt: { value: number }; uGlow: { value: number } };
export const makeWear = (): WearU => ({ uCut: { value: -99 }, uAmt: { value: 1 }, uGlow: { value: 0 } });

const NOISE = /* glsl */ `
varying vec3 vLoc;
uniform float uCut;
uniform float uAmt;
uniform float uGlow;
float wh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float wn(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(wh(i), wh(i + vec3(1, 0, 0)), u.x), mix(wh(i + vec3(0, 1, 0)), wh(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(wh(i + vec3(0, 0, 1)), wh(i + vec3(1, 0, 1)), u.x), mix(wh(i + vec3(0, 1, 1)), wh(i + vec3(1, 1, 1)), u.x), u.y),
    u.z);
}
`;

function patch(mat: THREE.Material, u: WearU) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCut = u.uCut;
    sh.uniforms.uAmt = u.uAmt;
    sh.uniforms.uGlow = u.uGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float nw = smoothstep(uCut - 0.1, uCut + 0.1, vLoc.x);
        float worn = (1.0 - nw) * uAmt;
        float wnz = wn(vLoc * 6.0) * 0.6 + wn(vLoc * 21.0) * 0.4;
        float chip = smoothstep(0.74, 0.82, wn(vLoc * 33.0 + 3.0));
        float scr = smoothstep(0.9, 0.96, wn(vec3(vLoc.x * 40.0, vLoc.y * 3.0, vLoc.z * 3.0) + 7.0));
        vec3 dull = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.34))) * 0.92, 0.5 * worn);
        dull *= 1.0 - 0.42 * worn * smoothstep(0.32, 0.78, wnz);
        dull = mix(dull, vec3(0.42), (chip * 0.18 + scr * 0.22) * worn * step(0.06, dot(diffuseColor.rgb, vec3(0.34))));
        diffuseColor.rgb = dull;`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.94, worn);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.95) * exp(-pow((vLoc.x - uCut) / 0.07, 2.0)) * uGlow;')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= (1.0 - worn);\n#endif');
  };
  mat.customProgramCacheKey = () => 'sistem-wear';
}

export function prepare(root: THREE.Object3D, opts: { planes?: THREE.Plane[]; wear?: WearU } = {}) {
  const cache = new Map<THREE.Material, THREE.Material>();
  const made: THREE.Material[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const src = mesh.material as THREE.Material;
    if (!(src as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
    let c = cache.get(src);
    if (!c) {
      c = src.clone();
      if (opts.planes) {
        c.clippingPlanes = opts.planes;
        c.clipShadows = true;
      }
      if (opts.wear) patch(c, opts.wear);
      cache.set(src, c);
      made.push(c);
    }
    mesh.material = c;
  });
  return made;
}
