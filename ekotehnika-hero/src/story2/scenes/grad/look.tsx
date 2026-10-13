// The neutral palette and small material helpers of the Grad scene, round 3. The LMH greys from brand-rules.md
// section 2, with no blue or teal cast, so the city reads white and grey with the real Linde red only on the trucks.
// Materials are the same lit standard materials the miniature uses, a touch of self light keeps the shaded faces pale.
import * as THREE from 'three';
import { withAO } from '../../../variants/v4/look';

export const G = { white: '#ffffff', pale: '#e9e9e9', light: '#d2d2d2', mid: '#a1a1a1', dark: '#6b6b6b', graphite: '#4d4d4d', black: '#111111' } as const;
export const INFO = '#7fbccd'; // LMH turquoise at 72 percent, the one info colour on the dark grounds

// A lit material in one grey, with a share of its own colour as light so it never goes muddy in the shade.
export function mat(color: string, glow = 0.3, rough = 0.85, ao = true): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: color, emissiveIntensity: glow });
  return ao ? withAO(m, 1.6, 0.7) : m;
}

// Unlit flat colour for painted lines and floors, it never takes the light.
export const flat = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

/* ------------------------------------------------------------------ the page grid */

// The left edge in page pixels of a column of the 12 column grid, 48px margins and 24px gutters.
export const colEdge = (width: number, col: number) => 48 + (col - 1) * ((width - 96 - 11 * 24) / 12 + 24);
