// Physically based materials in README token hues. Lighting shades them, the hue stays the token.
import * as THREE from 'three';
import { C } from '../tokens';

export const M = {
  paint: new THREE.MeshPhysicalMaterial({ color: C.lindeRed, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
  paintDark: new THREE.MeshPhysicalMaterial({ color: C.primary700, roughness: 0.4, clearcoat: 0.4 }),
  black: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55, metalness: 0.15 }),
  rubber: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.92 }),
  steel: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.38, metalness: 0.75 }),
  steelLight: new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.3, metalness: 0.8 }),
  chrome: new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.15, metalness: 1 }),
  white: new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6 }),
  card: new THREE.MeshStandardMaterial({ color: C.hoverLightGrey, roughness: 0.85 }),
  pallet: new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.05, metalness: 0, transmission: 0, opacity: 0.55, transparent: true }),
  lamp: new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 2.5 }),
  beacon: new THREE.MeshStandardMaterial({ color: C.tonedRed, emissive: C.tonedRed, emissiveIntensity: 3 }),
  floor: new THREE.MeshStandardMaterial({ color: C.lightGrey, roughness: 0.95 }),
  wall: new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.9 }),
};

export type MaterialSet = typeof M;
