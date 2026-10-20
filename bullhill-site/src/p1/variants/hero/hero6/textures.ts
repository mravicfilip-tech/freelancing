// Procedural ground textures for the render half, three.js textures from the painter in groundPaint.ts.

import * as THREE from 'three';
import { rng } from './geometry';
import { field, paintGround, type Kind } from './groundPaint';

export type { Kind };
const makeCanvas = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });

export const TILE_W = 2.6; // world units one tile spans across
export const TILE_H = 1.3;

export function makeGround(kind: Kind, w = 1024, h = 512) {
  const cv = paintGround(kind, makeCanvas, w, h) as HTMLCanvasElement;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;

  // bump from luminance
  const src = ctx.getImageData(0, 0, w, h);
  const bc = document.createElement('canvas');
  bc.width = w;
  bc.height = h;
  const bctx = bc.getContext('2d')!;
  const bi = bctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const l = src.data[i * 4] * 0.3 + src.data[i * 4 + 1] * 0.59 + src.data[i * 4 + 2] * 0.11;
    bi.data[i * 4] = bi.data[i * 4 + 1] = bi.data[i * 4 + 2] = Math.min(255, Math.max(0, (l - 30) * 1.25));
    bi.data[i * 4 + 3] = 255;
  }
  bctx.putImageData(bi, 0, 0);

  const map = new THREE.CanvasTexture(cv);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(bc);
  for (const t of [map, bump]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return { map, bump };
}

// A soft dark falloff, for the contact shading under each layer edge and round each duct.
export function falloff(kind: 'edge' | 'ring') {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d')!;
  if (kind === 'edge') {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.35, 'rgba(0,0,0,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  } else {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Fine dust and streaks along a duct, for its roughness.
export function ductRough() {
  const w = 256;
  const h = 256;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const f = field(w, h, 77, 8, 4, 0.55);
  const img = ctx.createImageData(w, h);
  const r = rng(5);
  for (let i = 0; i < w * h; i++) {
    const v = 70 + f[i] * 120 + (r() - 0.5) * 18;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
