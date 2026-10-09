// Shared small things for the Sistem scene, materials, textures and the story position helpers.
import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { clamp01, range, smooth } from '../../../story/scenes/sistem/tracks';
import geist from './geistCaps.json';

export { clamp01, range, smooth };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => smooth(clamp01(t));
export const rad = (d: number) => (d * Math.PI) / 180;

// Beat index plus k, so 0.5 is the middle of H and 14.5 the middle of AT.
export const uOf = (c: StoryClock) => c.beat.current + c.k.current;
export const BEAT = { H: 0, D1: 1, C1: 2, D2: 3, F: 4, R: 5, Z: 6, P: 7, A: 8, B: 9, S: 10, L: 11, N: 12, T: 13, AT: 14 } as const;

export const GROUND = '#0a0b0c';

// Dark, lit by the studio rig. Whites and greys from the README, nothing else.
export const K = {
  ground: new THREE.MeshLambertMaterial({ color: '#0d1011' }),
  road: new THREE.MeshStandardMaterial({ color: '#2a3134', roughness: 0.8, metalness: 0.05 }),
  silhouette: new THREE.MeshLambertMaterial({ color: '#1a2023' }),
  silhouetteFar: new THREE.MeshLambertMaterial({ color: '#12171a' }),
  windowOn: new THREE.MeshStandardMaterial({ color: '#1b2123', emissive: '#9aa7ab', emissiveIntensity: 0.3, roughness: 0.4 }),
  windowDim: new THREE.MeshStandardMaterial({ color: '#1b2123', emissive: '#5e7175', emissiveIntensity: 0.2, roughness: 0.4 }),
  glow: new THREE.MeshBasicMaterial({ color: C.white, toneMapped: false }),
  glowSoft: new THREE.MeshBasicMaterial({ color: C.lightGrey, toneMapped: false, transparent: true, opacity: 0.55 }),
  sign: new THREE.MeshStandardMaterial({ color: C.lightGrey, emissive: C.white, emissiveIntensity: 0.85, roughness: 0.4 }),
  metalGrey: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.4, metalness: 0.7 }),
  van: new THREE.MeshStandardMaterial({ color: '#8b979b', roughness: 0.5, metalness: 0.15 }),
  vanGlass: new THREE.MeshStandardMaterial({ color: '#0b0d0e', roughness: 0.1, metalness: 0.6 }),
  tyre: new THREE.MeshStandardMaterial({ color: '#0c0e0f', roughness: 0.9 }),
  carton: new THREE.MeshStandardMaterial({ color: '#7d8c91', roughness: 0.85 }),
  tape: new THREE.MeshStandardMaterial({ color: '#aeb9bd', roughness: 0.7 }),
};

let sprite: THREE.Texture | undefined;
export const softTexture = () => {
  if (sprite) return sprite;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  grd.addColorStop(0.65, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  sprite = new THREE.CanvasTexture(c);
  sprite.colorSpace = THREE.SRGBColorSpace;
  return sprite;
};

// A soft pool of light lying on a surface, additive.
export function poolMaterial(opacity = 1, color: string = C.white) {
  return new THREE.MeshBasicMaterial({ map: softTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
}

// "EKOTEHNIKA" in extruded Geist caps, the live 3D sign. Origin at the left baseline, cap height = capH metres.
export function signGeometry(text: string, capH: number, depth: number) {
  const font = new Font(geist as never);
  const size = capH / 0.71;
  const g = new TextGeometry(text, { font, size, depth, curveSegments: 6, bevelEnabled: false });
  g.computeBoundingBox();
  return g;
}

// Deterministic noise so every frame and every session builds the same warehouse.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
