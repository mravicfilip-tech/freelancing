import { ductDots, houseDots, layerDots, trenchDots } from '../../art';
import type { SvcN } from './params';

// Per dot motion data for the four service drawings. The dots themselves come from art.tsx, so the
// drawing is the one on the page today. Each dot gets
//   a  the draw in move, fall, pop, fade or wave (versions 1 and 4)
//   l  the loop move, run, fan or glow (version 2)
//   v  CSS variables, d delay in seconds, w wave offset, sx and sy scatter offset, gs glow scale
//   g  set on the outer duct ring, which turns as one group in version 2

export type Kind = 'trench' | 'ducts' | 'house' | 'layers';
type DotT = ReturnType<typeof trenchDots>[number];
export type Item = { dot: DotT; a?: string; l?: string; g?: boolean; v: Record<string, number> };

const r2 = (n: number) => Math.round(n * 100) / 100;
const jit = (x: number, y: number) => (((x * 13 + y * 7) % 7) / 7) * 0.06;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DUCT_C = [120, 150];
const D = 40;
const SPOTS: [number, number][] = [[0, 0], [D, 0], [-D, 0], [D / 2, D * 0.866], [-D / 2, D * 0.866], [D / 2, -D * 0.866], [-D / 2, -D * 0.866]];
// 0 at the top going clockwise, 1 after a full turn
const turn = (dx: number, dy: number) => (((Math.atan2(dy, dx) + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2);

function drawIn(kind: Kind, dots: DotT[]): Item[] {
  return dots.map((dot): Item => {
    const { x, y } = dot;
    const red = dot.t === 'r';
    if (kind === 'trench') {
      const row = Math.round((y - 16) / 12) / 21;
      return red
        ? { dot, a: 'pop', v: { d: r2(0.55 + row * 0.3), u: 0.35 } }
        : { dot, a: 'fall', v: { d: r2(row * 0.45 + jit(x, y)), u: 0.4 } };
    }
    if (kind === 'ducts') {
      const dist = Math.hypot(x - DUCT_C[0], y - DUCT_C[1]);
      if (dist > 99) return { dot, a: 'pop', v: { d: r2(turn(x - 120, y - 150) * 0.5), u: 0.3 } };
      if (dist > 80) return { dot, a: 'pop', v: { d: r2(0.1 + turn(x - 120, y - 150) * 0.5), u: 0.3 } };
      let s = 0;
      let best = 1e9;
      SPOTS.forEach(([dx, dy], i) => {
        const e = Math.hypot(x - 120 - dx, y - 150 - dy);
        if (e < best) {
          best = e;
          s = i;
        }
      });
      const ang = turn(x - 120 - SPOTS[s][0], y - 150 - SPOTS[s][1]);
      const d = s === 0 ? 0.85 + ang * 0.15 : 0.55 + (s - 1) * 0.05 + ang * 0.25;
      return { dot, a: 'pop', v: { d: r2(d), u: 0.3 } };
    }
    if (kind === 'house') {
      if (dot.t === 1) return { dot, a: 'fade', v: { d: r2(((y - 6) / 90) * 0.3), u: 0.4 } };
      if (red) return { dot, a: 'pop', v: { d: r2(((x - 14) / 56) * 0.3), u: 0.3 } };
      // door
      if (y < 237 && y >= 197 && x >= 104 && x <= 136) return { dot, a: 'pop', v: { d: r2(0.85 + ((238 - y) / 40) * 0.15), u: 0.3 } };
      // the outline grows from the street duct both ways round and meets at the roof
      let p: number;
      if (x < 70.5 && y > 158) p = (238 - y) / 153.6;
      else if (x > 169.5 && y > 158) p = (100 + (238 - y)) / 253.6;
      else if (y < 237 && x < 120) p = (80 + Math.hypot(x - 70, y - 158)) / 153.6;
      else if (y < 237 && x > 120) p = (180 + Math.hypot(x - 170, y - 158)) / 253.6;
      else if (y >= 237) p = (x - 70) / 253.6;
      else p = 1;
      return { dot, a: 'pop', v: { d: r2(0.3 + Math.min(1, p) * 0.55), u: 0.3 } };
    }
    const k = Math.min(7, Math.max(0, Math.round((y - 30) / 32)));
    return { dot, a: 'wave', v: { d: r2(k * 0.09 + ((x - 24) / 192) * 0.1), u: 0.55, w: r2(14 * Math.sin(x * 0.09 + k * 1.7)) } };
  });
}

function loop(kind: Kind, dots: DotT[]): Item[] {
  return dots.map((dot): Item => {
    const { x, y } = dot;
    const v: Record<string, number> = { o: dot.o };
    if (kind === 'trench' && dot.t === 'r') return { dot, l: 'run', v: { ...v, d: r2(((y - 16) / 12 / 21) * 3.2) } };
    if (kind === 'ducts' && Math.hypot(x - 120, y - 150) > 99) return { dot, g: true, v };
    if (kind === 'house') {
      if (dot.t === 1) return { dot, l: 'fan', v: { ...v, d: r2(((y - 6) / 90) * 2.4 + (x / 240) * 0.3) } };
      if (dot.t === 'r') return { dot, l: 'fan', v: { ...v, d: r2(2.6 + ((x - 14) / 56) * 0.6) } };
    }
    if (kind === 'layers' && Math.abs(y - 190) < 5) return { dot, l: 'glow', v: { ...v, d: r2(((x - 24) / 192) * 3), gs: dot.t === 'r' ? 1.9 : 1.5 } };
    return { dot, v };
  });
}

function assemble(kind: Kind, dots: DotT[]): Item[] {
  const rnd = mulberry(kind.length * 977 + dots.length);
  return dots.map((dot): Item => {
    const tx = -20 + rnd() * 280;
    const ty = -60 + rnd() * 420;
    return { dot, a: 'scatter', v: { d: r2(rnd() * 0.3), o: dot.o, sx: Math.round(tx - dot.x), sy: Math.round(ty - dot.y) } };
  });
}

const SRC = { trench: trenchDots, ducts: ductDots, house: houseDots, layers: layerDots };
const cache = new Map<string, Item[]>();

export function plan(kind: Kind, version: SvcN): Item[] {
  const key = `${kind}${version}`;
  let hit = cache.get(key);
  if (!hit) {
    const dots = SRC[kind]();
    hit = version === 2 ? loop(kind, dots) : version === 3 ? assemble(kind, dots) : drawIn(kind, dots);
    cache.set(key, hit);
  }
  return hit;
}
