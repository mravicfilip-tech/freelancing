// The render look of the miniature. Postprocessing is off the table in this setup, so ambient
// occlusion is faked two ways. Every lit material darkens toward the ground in world space, which
// reads as contact occlusion at the foot of walls, wheels and trunks. Soft dark decals sit on the
// ground under buildings and vehicles for the wider occlusion pool.
import * as THREE from 'three';
import { C } from '../../tokens';
import { M } from '../../r3f/materials';

type Lit = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

// Patches a material so it darkens below height h, down to k at the ground.
export function withAO<T extends Lit>(mat: T, h = 1.4, k = 0.62): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.aoH = { value: h };
    shader.uniforms.aoK = { value: k };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vAoY;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 aoW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          aoW = instanceMatrix * aoW;
        #endif
        aoW = modelMatrix * aoW;
        vAoY = aoW.y;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAoY;\nuniform float aoH;\nuniform float aoK;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float aoT = smoothstep(0.0, aoH, vAoY);
        diffuseColor.rgb *= mix(aoK, 1.0, aoT * aoT * (3.0 - 2.0 * aoT));`,
      );
  };
  mat.customProgramCacheKey = () => `ao${h}_${k}`;
  return mat;
}

const std = (color: string, roughness = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  withAO(new THREE.MeshStandardMaterial({ color, roughness, ...extra }));

// Materials of the miniature. Hues are tokens only.
export const W = {
  ground: new THREE.MeshStandardMaterial({ color: C.white, roughness: 1 }),
  yard: new THREE.MeshStandardMaterial({ color: C.hoverLightGrey, roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ color: C.lightGrey, roughness: 0.95 }),
  mark: new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.7 }),
  wall: std(C.white, 0.85),
  wallShade: std(C.hoverLightGrey, 0.9),
  roof: std(C.shadeGrey, 0.95),
  kerb: std(C.white, 0.8, {}),
  red: withAO(new THREE.MeshPhysicalMaterial({ color: C.lindeRed, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 })),
  redDeep: std(C.primary700, 0.55),
  ink: std(C.ink, 0.6),
  door: std(C.textGrey, 0.7),
  steel: std(C.tonedTextGrey, 0.45, { metalness: 0.5 }),
  glass: withAO(new THREE.MeshPhysicalMaterial({ color: C.tonedTextGrey, roughness: 0.08, metalness: 0.3, clearcoat: 1, envMapIntensity: 9 })),
  glassLit: new THREE.MeshStandardMaterial({ color: C.shadeGrey, emissive: C.white, emissiveIntensity: 0.55, roughness: 0.3 }),
  letters: new THREE.MeshPhysicalMaterial({ color: C.white, roughness: 0.3, clearcoat: 0.6 }),
  tree: withAO(new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.85, flatShading: true }), 2.2, 0.7),
  treeLight: withAO(new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.85, flatShading: true }), 2.2, 0.7),
  trunk: std(C.textGrey, 0.9),
  carton: std(C.white, 0.85),
  cartonShade: std(C.hoverLightGrey, 0.85),
  tape: std(C.lindeRed, 0.6),
  pallet: std(C.tonedTextGrey, 0.9),
  person: std(C.ink, 0.7),
  lamp: new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 1.6 }),
};

// AO patched copies of the shared forklift materials, used by the baked fleets.
const fork = new Map<THREE.Material, THREE.Material>();
export function aoFor(m: THREE.Material): THREE.Material {
  let c = fork.get(m);
  if (!c) {
    c = m === M.lamp || m === M.beacon ? m : withAO((m as Lit).clone(), 0.9, 0.55);
    fork.set(m, c);
  }
  return c;
}

let soft: THREE.CanvasTexture | null = null;
// A blurred rectangle, white in the middle, for ground occlusion decals.
export function softRect() {
  if (soft) return soft;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.filter = 'blur(14px)';
  g.fillStyle = '#fff';
  g.fillRect(26, 26, 76, 76);
  soft = new THREE.CanvasTexture(c);
  return soft;
}

let aoMat: THREE.MeshBasicMaterial | null = null;
export function decalMaterial() {
  if (!aoMat) aoMat = new THREE.MeshBasicMaterial({ color: C.ink, alphaMap: softRect(), transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return aoMat;
}

// Horizontal slats for roller doors.
let slats: THREE.CanvasTexture | null = null;
export function slatTexture() {
  if (slats) return slats;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = C.textGrey;
  g.fillRect(0, 0, 16, 128);
  g.fillStyle = C.ink;
  for (let y = 0; y < 128; y += 8) g.fillRect(0, y, 16, 2);
  slats = new THREE.CanvasTexture(c);
  slats.wrapS = slats.wrapT = THREE.RepeatWrapping;
  slats.colorSpace = THREE.SRGBColorSpace;
  return slats;
}

// The company name as a side decal for the vans, white letters on a clear ground.
let vanSide: THREE.CanvasTexture | null = null;
export function vanSideTexture() {
  if (vanSide) return vanSide;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = C.white;
  g.font = '800 64px Archivo, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('EKOTEHNIKA', 256, 52);
  vanSide = new THREE.CanvasTexture(c);
  vanSide.colorSpace = THREE.SRGBColorSpace;
  vanSide.anisotropy = 4;
  return vanSide;
}
