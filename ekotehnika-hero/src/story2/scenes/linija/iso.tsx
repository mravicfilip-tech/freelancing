// The isometric warehouse, a cutaway room with two back walls, racks, pallets and two Linde forklifts at work.
// Drawn in the variant 2 flat vector style, token fills only, red on the truck shells only.
import type { ReactNode } from 'react';
import { C } from '../../../tokens';
import { K, G, G2, LG, SG, HG, WH, clamp01 } from './frame';

const U = 56;
const C30 = 0.8660254;
const OX = 668;
const OY = 262;
const px = (x: number, y: number, z: number) => `${(OX + (x - y) * C30 * U).toFixed(1)},${(OY + (x + y) * 0.5 * U - z * U).toFixed(1)}`;
const poly = (...p: [number, number, number][]) => p.map(([x, y, z]) => px(x, y, z)).join(' ');

type Face = { t: string; l: string; r: string };
type Box = { x: number; y: number; z: number; w: number; d: number; h: number; f: Face; sw?: number; key?: number };

const CARTON: Face = { t: WH, l: LG, r: SG };
const PALLET: Face = { t: LG, l: SG, r: G2 };
const IRON: Face = { t: G, l: K, r: K };
const BEAM: Face = { t: G2, l: G, r: G };
const SHELL: Face = { t: C.lindeRed, l: C.primary700, r: C.primary900 };
const DARK: Face = { t: G, l: K, r: K };
const STEEL: Face = { t: G2, l: G, r: K };

function IsoBox({ b }: { b: Box }) {
  const { x, y, z, w, d, h, f } = b;
  const sw = b.sw ?? 0.9;
  const stroke = { stroke: K, strokeOpacity: 0.55, strokeWidth: sw, strokeLinejoin: 'round' as const };
  return (
    <g>
      <polygon points={poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={f.r} {...stroke} />
      <polygon points={poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={f.l} {...stroke} />
      <polygon points={poly([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={f.t} {...stroke} />
    </g>
  );
}

const carton = (x: number, y: number, z: number, w = 0.8, d = 0.9, h = 0.8): Box => ({ x, y, z, w, d, h, f: CARTON, sw: 0.8 });

// ---- the static room --------------------------------------------------------------------------------------
const statics: Box[] = [];
{
  // rack along the back wall at y 0, five bays
  const bays = 5;
  const bw = 1.4;
  const rx = 6.0;
  for (let b = 0; b <= bays; b++) {
    for (const yy of [0.2, 1.3]) statics.push({ x: rx + b * bw - 0.05, y: yy, z: 0, w: 0.1, d: 0.1, h: 3.7, f: IRON, sw: 0.6 });
  }
  for (const z of [0.25, 1.35, 2.45]) {
    for (const yy of [0.2, 1.3]) statics.push({ x: rx, y: yy, z, w: bays * bw, d: 0.08, h: 0.1, f: BEAM, sw: 0.6 });
    for (let b = 0; b < bays; b++) {
      if ((b + Math.round(z * 3)) % 4 === 3) continue;
      statics.push(carton(rx + b * bw + 0.08, 0.3, z + 0.1, 0.55, 0.9, 0.78));
      statics.push(carton(rx + b * bw + 0.72, 0.3, z + 0.1, 0.6, 0.9, 0.7));
    }
  }
  // rack along the left wall at x 0
  const ry = 3.2;
  for (let b = 0; b <= 4; b++) {
    for (const xx of [0.2, 1.3]) statics.push({ x: xx, y: ry + b * bw - 0.05, z: 0, w: 0.1, d: 0.1, h: 3.7, f: IRON, sw: 0.6 });
  }
  for (const z of [0.25, 1.35, 2.45]) {
    for (const xx of [0.2, 1.3]) statics.push({ x: xx, y: ry, z, w: 0.08, d: 4 * bw, h: 0.1, f: BEAM, sw: 0.6 });
    for (let b = 0; b < 4; b++) {
      if ((b + Math.round(z * 5)) % 4 === 1) continue;
      statics.push(carton(0.3, ry + b * bw + 0.08, z + 0.1, 0.9, 0.55, 0.78));
      statics.push(carton(0.3, ry + b * bw + 0.72, z + 0.1, 0.9, 0.6, 0.7));
    }
  }
  // pallets on the floor
  const pallet = (x: number, y: number, n: number) => {
    statics.push({ x, y, z: 0, w: 1.1, d: 1.1, h: 0.14, f: PALLET, sw: 0.7 });
    for (let i = 0; i < n; i++) {
      const z = 0.14 + i * 0.5;
      statics.push(carton(x + 0.04, y + 0.04, z, 0.5, 0.5, 0.5));
      statics.push(carton(x + 0.56, y + 0.04, z, 0.5, 0.5, 0.5));
      statics.push(carton(x + 0.04, y + 0.56, z, 0.5, 0.5, 0.5));
      statics.push(carton(x + 0.56, y + 0.56, z, 0.5, 0.5, 0.5));
    }
  };
  pallet(8.4, 6.4, 2);
  pallet(9.9, 7.6, 1);
  pallet(7.0, 8.4, 2);
  pallet(4.6, 8.7, 1);
  pallet(10.2, 3.0, 2);
  pallet(2.6, 2.2, 1);
  // a stack of empty pallets
  for (let i = 0; i < 5; i++) statics.push({ x: 1.0, y: 8.5, z: i * 0.15, w: 1.3, d: 1.2, h: 0.15, f: PALLET, sw: 0.7 });
  for (let i = 0; i < 4; i++) statics.push({ x: 2.7, y: 8.6, z: i * 0.15, w: 1.3, d: 1.2, h: 0.15, f: PALLET, sw: 0.7 });
}

// ---- a Linde forklift, built from boxes about its own centre, nose along +fx ----------------------------------
function forklift(cx: number, cy: number, theta: number, lift: number, loaded: boolean): Box[] {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const out: Box[] = [];
  const add = (fx0: number, fx1: number, fy0: number, fy1: number, z: number, h: number, f: Face, sw = 0.8) => {
    const a: [number, number] = [cx + fx0 * c - fy0 * s, cy + fx0 * s + fy0 * c];
    const b: [number, number] = [cx + fx1 * c - fy1 * s, cy + fx1 * s + fy1 * c];
    out.push({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), z, w: Math.abs(a[0] - b[0]), d: Math.abs(a[1] - b[1]), h, f, sw });
  };
  for (const sy of [-1, 1]) {
    add(-1.0, -0.6, sy * 0.5, sy * 0.66, 0, 0.5, DARK, 0.6);
    add(0.2, 0.62, sy * 0.52, sy * 0.68, 0, 0.42, DARK, 0.6);
  }
  add(-1.15, 0.0, -0.5, 0.5, 0.25, 0.8, SHELL);
  add(0.0, 0.72, -0.5, 0.5, 0.25, 0.46, STEEL);
  add(-0.5, -0.1, -0.22, 0.22, 1.05, 0.34, DARK);
  for (const [fx, fy] of [[-0.78, -0.46], [-0.78, 0.46], [0.12, -0.46], [0.12, 0.46]] as const)
    add(fx - 0.04, fx + 0.04, fy - 0.04, fy + 0.04, 1.05, 0.9, DARK, 0.5);
  add(-0.84, 0.2, -0.52, 0.52, 1.95, 0.07, DARK);
  for (const sy of [-1, 1]) add(0.74, 0.86, sy * 0.3, sy * 0.38, 0, 1.9, STEEL, 0.6);
  add(0.86, 0.94, -0.42, 0.42, 0.2 + lift, 0.7, DARK, 0.6);
  for (const sy of [-1, 1]) add(0.94, 1.9, sy * 0.28 - 0.06, sy * 0.28 + 0.06, 0.2 + lift, 0.05, STEEL, 0.6);
  if (loaded) {
    out.push(...(() => {
      const l: Box[] = [];
      const add2 = (fx0: number, fx1: number, fy0: number, fy1: number, z: number, h: number, f: Face) => {
        const a: [number, number] = [cx + fx0 * c - fy0 * s, cy + fx0 * s + fy0 * c];
        const b: [number, number] = [cx + fx1 * c - fy1 * s, cy + fx1 * s + fy1 * c];
        l.push({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), z, w: Math.abs(a[0] - b[0]), d: Math.abs(a[1] - b[1]), h, f, sw: 0.8 });
      };
      add2(1.0, 1.9, -0.45, 0.45, 0.25 + lift, 0.14, PALLET);
      add2(1.04, 1.46, -0.42, -0.0, 0.39 + lift, 0.5, CARTON);
      add2(1.04, 1.46, 0.02, 0.42, 0.39 + lift, 0.5, CARTON);
      add2(1.44, 1.86, -0.42, -0.0, 0.39 + lift, 0.5, CARTON);
      add2(1.44, 1.86, 0.02, 0.42, 0.39 + lift, 0.5, CARTON);
      return l;
    })());
  }
  return out;
}

// A lane triangle wave with a pause at each end, 0 to 1 and back.
function lane(p: number) {
  const t = ((p % 1) + 1) % 1;
  if (t < 0.42) return { u: t / 0.42, dir: 1 };
  if (t < 0.5) return { u: 1, dir: 1 };
  if (t < 0.92) return { u: 1 - (t - 0.5) / 0.42, dir: -1 };
  return { u: 0, dir: -1 };
}

const sortKey = (b: Box) => b.x + b.w / 2 + (b.y + b.d / 2) + (b.z + b.h / 2) * 0.12;
const staticSorted = statics.map((b) => ({ ...b, key: sortKey(b) }));

export function IsoWarehouse({ t }: { t: number }) {
  // two trucks at work, driven by the clock t in scroll pixels
  const a = lane(t / 760);
  const b = lane(t / 880 + 0.3);
  const trucks: Box[] = [
    ...forklift(3.4 + a.u * 6.4, 5.5, a.dir > 0 ? 0 : Math.PI, a.dir > 0 ? 0.0 : 0.25, a.dir < 0),
    ...forklift(2.0, 3.0 + b.u * 5.3, b.dir > 0 ? Math.PI / 2 : -Math.PI / 2, b.dir > 0 ? 0.3 : 0.0, b.dir > 0),
  ].map((bx) => ({ ...bx, key: sortKey(bx) + 0.05 }));
  const all = [...staticSorted, ...trucks].sort((p, q) => (p.key as number) - (q.key as number));

  const stripes: ReactNode[] = [];
  for (let i = 0; i < 11; i++) {
    const x0 = 1.6 + i * 0.36;
    stripes.push(<polygon key={i} points={poly([x0, 0, 3.12], [x0 + 0.18, 0, 3.12], [x0 + 0.36, 0, 3.46], [x0 + 0.18, 0, 3.46])} fill={i % 2 ? WH : K} />);
  }
  const grid: ReactNode[] = [];
  for (let i = 1; i < 12; i++) grid.push(<line key={`gx${i}`} x1={px(i, 0, 0).split(',')[0]} y1={px(i, 0, 0).split(',')[1]} x2={px(i, 10, 0).split(',')[0]} y2={px(i, 10, 0).split(',')[1]} />);
  for (let i = 1; i < 10; i++) grid.push(<line key={`gy${i}`} x1={px(0, i, 0).split(',')[0]} y1={px(0, i, 0).split(',')[1]} x2={px(12, i, 0).split(',')[0]} y2={px(12, i, 0).split(',')[1]} />);

  return (
    <g>
      {/* floor slab */}
      <polygon points={poly([0, 10, 0], [12, 10, 0], [12, 10, -0.34], [0, 10, -0.34])} fill={G} stroke={K} strokeOpacity={0.5} strokeWidth={1} />
      <polygon points={poly([12, 0, 0], [12, 10, 0], [12, 10, -0.34], [12, 0, -0.34])} fill={K} stroke={K} strokeOpacity={0.5} strokeWidth={1} />
      <polygon points={poly([0, 0, 0], [12, 0, 0], [12, 10, 0], [0, 10, 0])} fill={SG} stroke={G2} strokeOpacity={0.5} strokeWidth={1.2} />
      <g stroke={G2} strokeOpacity={0.18} strokeWidth={1}>
        {grid}
      </g>
      {/* lanes painted on the floor */}
      <polygon points={poly([1.4, 4.3, 0], [10.6, 4.3, 0], [10.6, 6.7, 0], [1.4, 6.7, 0])} fill="none" stroke={WH} strokeWidth={2.4} strokeOpacity={0.95} strokeLinejoin="round" />
      <polygon points={poly([1.0, 2.2, 0], [3.0, 2.2, 0], [3.0, 9.2, 0], [1.0, 9.2, 0])} fill="none" stroke={WH} strokeWidth={2.4} strokeOpacity={0.95} strokeLinejoin="round" />
      {/* back walls */}
      <polygon points={poly([0, 0, 0], [12, 0, 0], [12, 0, 4], [0, 0, 4])} fill={HG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.2} />
      <polygon points={poly([0, 0, 0], [0, 10, 0], [0, 10, 4], [0, 0, 4])} fill={LG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.2} />
      <polygon points={poly([0, -0.26, 4], [12, -0.26, 4], [12, 0, 4], [0, 0, 4])} fill={WH} stroke={G2} strokeOpacity={0.6} strokeWidth={1.2} />
      <polygon points={poly([-0.26, 0, 4], [0, 0, 4], [0, 10, 4], [-0.26, 10, 4])} fill={WH} stroke={G2} strokeOpacity={0.6} strokeWidth={1.2} />
      {/* the big door with its hazard stripe, and a side door */}
      <polygon points={poly([1.6, 0, 0], [5.4, 0, 0], [5.4, 0, 3.12], [1.6, 0, 3.12])} fill={WH} stroke={K} strokeOpacity={0.6} strokeWidth={1.4} />
      {stripes}
      <polygon points={poly([0, 6.2, 0], [0, 7.5, 0], [0, 7.5, 2.3], [0, 6.2, 2.3])} fill={K} opacity={0.88} />
      {all.map((bx, i) => (
        <IsoBox key={i} b={bx} />
      ))}
    </g>
  );
}

export const isoReveal = (k: number) => clamp01(k);
