// Flat illustration shading. Every face takes an exact brand token picked by the way it faces,
// tops light, fronts the base colour, sides and backs darker. No lights, no shadows, no gradients,
// so what renders is the token itself.

import * as THREE from 'three';
import { C } from '../tokens';

export type Tone = { top: string; front: string; side: string; back: string };

export const RED: Tone = { top: C.tonedRed, front: C.lindeRed, side: C.primary700, back: C.primary900 };
export const INK: Tone = { top: C.textGrey, front: C.ink, side: C.ink, back: C.ink };
export const STEEL: Tone = { top: C.tonedTextGrey, front: C.textGrey, side: C.ink, back: C.ink };
export const PALE: Tone = { top: C.white, front: C.hoverLightGrey, side: C.shadeGrey, back: C.lightGrey };
export const GREY: Tone = { top: C.shadeGrey, front: C.tonedTextGrey, side: C.textGrey, back: C.textGrey };
export const FLOOR: Tone = { top: C.shadeGrey, front: C.lightGrey, side: C.lightGrey, back: C.lightGrey };
export const WALL: Tone = { top: C.white, front: C.lightGrey, side: C.shadeGrey, back: C.shadeGrey };
export const WHITE_LINE: Tone = { top: C.white, front: C.white, side: C.white, back: C.white };
export const RED_LINE: Tone = { top: C.lindeRed, front: C.lindeRed, side: C.lindeRed, back: C.lindeRed };

// One material for every toned mesh, exported so a direction can fade all solids at once.
export const material = new THREE.MeshBasicMaterial({ vertexColors: true });
const colour = new THREE.Color();

export function toned(source: THREE.BufferGeometry, tone: Tone) {
  const geo = source.index ? source.toNonIndexed() : source;
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  const out = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) {
    const x = n.getX(i);
    const y = n.getY(i);
    const z = n.getZ(i);
    let hex = tone.side;
    if (y > 0.6) hex = tone.top;
    else if (y < -0.6) hex = tone.back;
    else if (Math.abs(z) >= Math.abs(x)) hex = z > 0 ? tone.front : tone.back;
    colour.set(hex);
    out[i * 3] = colour.r;
    out[i * 3 + 1] = colour.g;
    out[i * 3 + 2] = colour.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3));
  return geo;
}

export function mesh(geo: THREE.BufferGeometry, tone: Tone, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(toned(geo, tone), material);
  m.position.set(x, y, z);
  return m;
}

// A box placed by its bottom face, which is how most things stand on a floor.
export function block(w: number, h: number, d: number, tone: Tone, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), tone, x, y + h / 2, z);
}
