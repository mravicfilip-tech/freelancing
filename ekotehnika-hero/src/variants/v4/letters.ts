// Extruded block letters for the facade signs. There is no typeface file in the app, so the ten
// letters the word EKOTEHNIKA needs are drawn here as geometric polygons, cap height 1, then
// extruded with a small bevel so they catch the light like real sign letters.
import * as THREE from 'three';

const S = 0.2;

type Poly = [number, number][];
type Glyph = { w: number; polys: Poly[]; holes?: Poly[][]; ring?: boolean };

// A slanted bar with horizontal ends, bottom left corner (x1, y1), top left corner (x2, y2).
const slant = (x1: number, y1: number, x2: number, y2: number, w: number): Poly => [
  [x1, y1],
  [x1 + w, y1],
  [x2 + w, y2],
  [x2, y2],
];

const rect = (x: number, y: number, w: number, h: number): Poly => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const glyphs: Record<string, Glyph> = {
  E: {
    w: 0.6,
    polys: [[[0, 0], [0.6, 0], [0.6, S], [S, S], [S, 0.5 - S / 2], [0.54, 0.5 - S / 2], [0.54, 0.5 + S / 2], [S, 0.5 + S / 2], [S, 1 - S], [0.6, 1 - S], [0.6, 1], [0, 1]]],
  },
  K: { w: 0.7, polys: [rect(0, 0, S, 1), slant(S - 0.02, 0.36, 0.46, 1, 0.26), slant(0.44, 0, S + 0.06, 0.56, 0.26)] },
  O: { w: 0.94, polys: [], ring: true },
  T: { w: 0.66, polys: [[[0.33 - S / 2, 0], [0.33 + S / 2, 0], [0.33 + S / 2, 1 - S], [0.66, 1 - S], [0.66, 1], [0, 1], [0, 1 - S], [0.33 - S / 2, 1 - S]]] },
  H: {
    w: 0.74,
    polys: [[[0, 0], [S, 0], [S, 0.5 - S / 2], [0.74 - S, 0.5 - S / 2], [0.74 - S, 0], [0.74, 0], [0.74, 1], [0.74 - S, 1], [0.74 - S, 0.5 + S / 2], [S, 0.5 + S / 2], [S, 1], [0, 1]]],
  },
  N: { w: 0.76, polys: [[[0, 0], [S, 0], [S, 0.66], [0.76 - S - 0.02, 0], [0.76, 0], [0.76, 1], [0.76 - S, 1], [0.76 - S, 0.34], [S + 0.02, 1], [0, 1]]] },
  I: { w: S, polys: [rect(0, 0, S, 1)] },
  A: {
    w: 0.84,
    polys: [[[0, 0], [0.23, 0], [0.29, 0.2], [0.55, 0.2], [0.61, 0], [0.84, 0], [0.54, 1], [0.3, 1]]],
    holes: [[[[0.35, 0.38], [0.49, 0.38], [0.42, 0.66]]]],
  },
};

function toShape(p: Poly, holes?: Poly[]) {
  const s = new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes ?? []) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return s;
}

function ringShape(cx: number) {
  const s = new THREE.Shape();
  s.absellipse(cx + 0.47, 0.5, 0.47, 0.5, 0, Math.PI * 2, false, 0);
  const h = new THREE.Path();
  h.absellipse(cx + 0.47, 0.5, 0.47 - S * 1.02, 0.5 - S * 0.95, 0, Math.PI * 2, true, 0);
  s.holes.push(h);
  return s;
}

// One geometry for a whole word, centred on x, sitting on y = 0, front face toward +z.
export function wordGeometry(word: string, depth = 0.22, tracking = 0.13) {
  const shapes: THREE.Shape[] = [];
  let x = 0;
  for (const ch of word) {
    const g = glyphs[ch];
    if (!g) {
      x += 0.4;
      continue;
    }
    if (g.ring) shapes.push(ringShape(x));
    g.polys.forEach((p, i) => shapes.push(toShape(p.map(([px, py]) => [px + x, py] as [number, number]), g.holes?.[i]?.map((h) => h.map(([hx, hy]) => [hx + x, hy] as [number, number])))));
    x += g.w + tracking;
  }
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 28 });
  geo.translate(-(x - tracking) / 2, 0, 0);
  return { geo, width: x - tracking };
}
