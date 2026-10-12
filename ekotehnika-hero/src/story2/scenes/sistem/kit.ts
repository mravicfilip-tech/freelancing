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

// Light ground, README tokens only. The servis blueprint keeps the dark ground, see isDark.
export const PAPER = {
  bg: C.lightGrey, // background and fog
  floor: C.hoverLightGrey,
  white: C.white,
  shade: C.shadeGrey,
  ink: C.ink,
  grey: C.textGrey,
  toned: C.tonedTextGrey,
};
export const GROUND = PAPER.bg;
export const DARK_BG = '#0a0b0c';
// The servis blueprint hold is dark, everything else is light. B ends fully black before it and L covers it.
export const isDark = (u: number) => u >= 10 && u < 11.9;

// The light rig is bright enough for the real models, so flat surfaces start at a third of their token and light up
// to it. That keeps shading visible instead of clipping to white.
// The studio environment leans blue, so each channel gets its own gain to keep greys neutral on screen.
export const lit = (hex: string) => {
  const c = new THREE.Color(hex);
  return c.setRGB(c.r * 0.35, c.g * 0.317, c.b * 0.29);
};
const lam = (color: string, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) => new THREE.MeshLambertMaterial({ color: lit(color), toneMapped: false, ...extra });

// Pale forms with soft shading on a light ground. Lambert and no tone mapping keep the tokens true on screen.
export const K = {
  ground: lam(PAPER.floor),
  road: lam(PAPER.toned),
  silhouette: lam(PAPER.shade, { emissive: lit(PAPER.shade).multiplyScalar(0.55) }),
  silhouetteFar: lam(PAPER.shade, { emissive: lit(PAPER.shade).multiplyScalar(0.55) }),
  windowOn: lam(PAPER.grey),
  windowDim: lam(PAPER.toned),
  glow: new THREE.MeshBasicMaterial({ color: PAPER.ink, toneMapped: false }),
  white: new THREE.MeshBasicMaterial({ color: PAPER.white, toneMapped: false }),
  glowSoft: new THREE.MeshBasicMaterial({ color: PAPER.toned, toneMapped: false, transparent: true, opacity: 0.55 }),
  sign: new THREE.MeshLambertMaterial({ color: lit(PAPER.ink), toneMapped: false }),
  metalGrey: new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.5, metalness: 0.4 }),
  van: lam(PAPER.white, { emissive: lit(PAPER.white).multiplyScalar(0.5) }),
  vanGlass: lam(PAPER.grey),
  tyre: lam(PAPER.ink),
  carton: lam(PAPER.white),
  tape: lam(PAPER.grey),
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

// A soft pool of light lying on a surface, white and normal blended so it lifts the ground under it.
export function poolMaterial(opacity = 1, color: string = C.white) {
  return new THREE.MeshBasicMaterial({ map: softTexture(), color, transparent: true, opacity, depthWrite: false, toneMapped: false });
}

let blobTex: THREE.Texture | undefined;
// A soft contact shadow under a truck or a robot, ink at the middle, clear at the edge.
export function blobMaterial(opacity = 0.32) {
  if (!blobTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(34,34,34,1)');
    grd.addColorStop(0.45, 'rgba(34,34,34,0.55)');
    grd.addColorStop(1, 'rgba(34,34,34,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
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
