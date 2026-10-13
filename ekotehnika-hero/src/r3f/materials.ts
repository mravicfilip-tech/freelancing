// Physically based materials in README token hues. Lighting shades them, the hue stays the token.
import * as THREE from 'three';
import { C } from '../tokens';

export const M = {
  // The one red on a truck, the rear body shell and counterweight. Nothing else may use it.
  paint: new THREE.MeshPhysicalMaterial({ color: C.lindeRed, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
  // Front cowl and the second tone on the cab side, the insert under the cab, the fork blades.
  cowl: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.5, metalness: 0.1 }),
  fork: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.4, metalness: 0.35 }),
  stripe: new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.4 }),
  tape: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.7 }),
  black: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55, metalness: 0.15 }),
  rubber: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.92 }),
  steel: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.38, metalness: 0.75 }),
  steelLight: new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.3, metalness: 0.8 }),
  chrome: new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.15, metalness: 1 }),
  white: new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6 }),
  card: new THREE.MeshStandardMaterial({ color: C.hoverLightGrey, roughness: 0.85 }),
  pallet: new THREE.MeshStandardMaterial({ color: C.tonedTextGrey, roughness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: C.lightGrey, roughness: 0.05, metalness: 0, transmission: 0, opacity: 0.5, transparent: true }),
  lamp: new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 2.5 }),
  // Beacon and tail light lens, light grey, no colour and no glow.
  beacon: new THREE.MeshStandardMaterial({ color: C.lightGrey, roughness: 0.25, metalness: 0.1 }),
  floor: new THREE.MeshStandardMaterial({ color: C.lightGrey, roughness: 0.95 }),
  wall: new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.9 }),
};

export type MaterialSet = typeof M;
