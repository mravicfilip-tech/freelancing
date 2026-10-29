// Shared small things for the Sistem scene, materials, textures and the story position helpers.
import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { C } from '../../../tokens';
import type { StoryClock } from '../../clock';
import { clamp01, range, smooth } from '../../../story/scenes/sistem/tracks';
import dax from './daxCaps.json';
// The brand files themselves, read as text so the scene draws their own paths and never a redraw.
import wordmarkSvg from '../../../../public/brand/ekotehnika.svg?raw';
import wordmarkWhiteSvg from '../../../../public/brand/ekotehnika-white.svg?raw';
import lindeSvg from '../../../../public/brand/linde-mh.svg?raw';

export { clamp01, range, smooth };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => smooth(clamp01(t));
export const rad = (d: number) => (d * Math.PI) / 180;

// Beat index plus k, so 0.5 is the middle of H and 14.5 the middle of AT.
export const uOf = (c: StoryClock) => c.beat.current + c.k.current;
export const BEAT = { H: 0, D1: 1, C1: 2, D2: 3, F: 4, R: 5, Z: 6, P: 7, A: 8, B: 9, S: 10, L: 11, N: 12, T: 13, AT: 14 } as const;

// The Linde LMH greys, brand-rules.md section 2. Everything lit in the scene is white, one of these greys or black.
export const G = { white: '#ffffff', pale: '#e9e9e9', light: '#d2d2d2', mid: '#a1a1a1', dark: '#6b6b6b', graphite: '#4d4d4d', black: '#000000' } as const;

// Light ground. The servis schematic keeps the dark ground, see isDark.
export const PAPER = {
  bg: G.white, // background and fog
  floor: '#f6f6f6',
  white: C.white,
  shade: G.pale,
  ink: C.ink,
  grey: G.dark,
  toned: G.dark,
};
export const GROUND = PAPER.bg;
// pure black, Filip round 5, "screen should be pure black background"
export const DARK_BG = '#000000';
// The servis blueprint hold is dark, everything else is light. B ends fully black before it and L covers it.
export const isDark = (u: number) => u >= 10 && u < 11.52;

// The light rig is bright enough for the real models, so flat surfaces start at a third of their token and light up
// to it. That keeps shading visible instead of clipping to white.
// The studio environment leans blue, so each channel gets its own gain to keep greys neutral on screen.
export const lit = (hex: string) => {
  const c = new THREE.Color(hex);
  return c.setRGB(c.r * 0.35, c.g * 0.317, c.b * 0.29);
};
export const lam = (color: string, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) => new THREE.MeshLambertMaterial({ color: lit(color), toneMapped: false, ...extra });

// Pale forms with soft shading on a light ground. Lambert and no tone mapping keep the tokens true on screen.
export const K = {
  ground: lam(PAPER.floor),
  road: lam(G.dark),
  silhouette: lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.55) }),
  silhouetteFar: lam(G.pale, { emissive: lit(G.pale).multiplyScalar(0.55) }),
  windowOn: lam(G.mid),
  windowDim: lam(G.dark),
  glow: new THREE.MeshBasicMaterial({ color: G.black, toneMapped: false }),
  white: new THREE.MeshBasicMaterial({ color: G.white, toneMapped: false }),
  glowSoft: new THREE.MeshBasicMaterial({ color: G.dark, toneMapped: false, transparent: true, opacity: 0.55 }),
  sign: new THREE.MeshLambertMaterial({ color: lit(G.black), toneMapped: false }),
  metalGrey: new THREE.MeshStandardMaterial({ color: G.graphite, roughness: 0.5, metalness: 0.4 }),
  van: lam(G.white, { emissive: lit(G.white).multiplyScalar(0.5) }),
  vanGlass: lam(G.mid),
  tyre: lam(PAPER.ink),
  carton: lam(G.white),
  tape: lam(G.mid),
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

// "EKOTEHNIKA" in extruded Daxline Pro Medium caps, the live 3D sign. Origin at the left baseline, cap height = capH metres.
export function signGeometry(text: string, capH: number, depth: number) {
  const font = new Font(dax as never);
  const size = capH / 0.735;
  const g = new TextGeometry(text, { font, size, depth, curveSegments: 6, bevelEnabled: false });
  g.computeBoundingBox();
  return g;
}

// ---- the brand files ----------------------------------------------------------------------------------------

export const BRAND = { wordmark: wordmarkSvg, wordmarkWhite: wordmarkWhiteSvg, linde: lindeSvg };

/** One path of a brand SVG as supplied, its own fill, its path data and its bounds in the file's units. */
export type BrandPath = { fill: string; d: string; x0: number; y0: number; x1: number; y1: number };

/** The view box of a brand SVG, x, y, width and height in the file's units. */
export const brandView = (svg: string) => svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number) as [number, number, number, number];

/** The paths of a brand SVG in file order. The files hold only absolute move, line and curve commands, so the numbers
 *  come in x, y pairs and the bounds are those of the points, which is exact enough to tell the words from the script. */
export function brandPaths(svg: string): BrandPath[] {
  return [...svg.matchAll(/<path fill="([^"]+)" d="([^"]+)"/g)].map(([, fill, d]) => {
    const n = d.match(/-?\d+\.?\d*/g)!.map(Number);
    const xs = n.filter((_, i) => i % 2 === 0);
    const ys = n.filter((_, i) => i % 2 === 1);
    return { fill, d, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  });
}

/** The EKOTEHNIKA wordmark of public/brand/ekotehnika.svg extruded from the file's own paths, one geometry per path with
 *  that path's own fill. The letters take depth, the tagline and the red mark under them take the shallower tagDepth so
 *  they stay crisp. The geometries stay in the file's units, y down, so the mesh group that holds them is scaled by
 *  [s, -s, s] with s the metres per file unit. Origin is the file's origin, see brandView for the frame. */
export function wordmarkSign(width: number, depth: number, tagDepth: number) {
  const view = brandView(wordmarkSvg);
  const s = width / view[2];
  const parts = new SVGLoader().parse(wordmarkSvg).paths.map((path) => {
    const shapes = path.toShapes();
    const flat = new THREE.ShapeGeometry(shapes);
    flat.computeBoundingBox();
    const tag = flat.boundingBox!.min.y > view[1] + view[3] * 0.4;
    flat.dispose();
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: (tag ? tagDepth : depth) / s, bevelEnabled: false, curveSegments: 6 });
    return { geo, fill: (path.userData as { style: { fill: string } }).style.fill };
  });
  return { parts, s, view };
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
