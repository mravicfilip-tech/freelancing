// The top down yard. A grey S path runs from the top down to the warehouse roof, the forklift follows it with
// its load, then the camera zooms into the roof. World units are pixels at the resting camera, the path is
// 124 wide. Drawn in the variant 2 flat vector style from tokens.
import { memo, type ReactNode } from 'react';
import { ForkliftTop } from '../../../variants/v2/art';
import { K, G, G2, LG, SG, HG, WH } from './frame';

// ---- the path -------------------------------------------------------------------------------------------
const PW = 124;
type Pt = { x: number; y: number; a: number; l: number };
const pts: Pt[] = [];
{
  let l = 0;
  const push = (x: number, y: number, a: number) => {
    const p = pts[pts.length - 1];
    if (p) l += Math.hypot(x - p.x, y - p.y);
    pts.push({ x, y, a, l });
  };
  const R = 120;
  const XC = 270; // where the straight across ends
  for (let y = -1200; y < -100; y += 10) push(0, y, Math.PI / 2); // A, down
  for (let i = 0; i <= 24; i++) {
    // B, turn from down to right about (R, -100)
    const t = (i / 24) * (Math.PI / 2);
    push(R - R * Math.cos(t), -100 + R * Math.sin(t), Math.PI / 2 - t);
  }
  for (let x = R + 10; x < XC; x += 10) push(x, -100 + R, 0); // C, right
  for (let i = 0; i <= 24; i++) {
    // D, turn from right to down about (XC, 20 + R)
    const t = (i / 24) * (Math.PI / 2);
    push(XC + R * Math.sin(t), 20 + R - R * Math.cos(t), t);
  }
  for (let y = 20 + R + 10; y <= 1500; y += 10) push(XC + R, y, Math.PI / 2); // E, down to the roof
}
export const PATH_LEN = pts[pts.length - 1].l;
export const ROOF = { x0: 140, x1: 640, y0: 1500, y1: 2800 };

export function pathAt(l: number): Pt {
  const L = Math.min(PATH_LEN, Math.max(0, l));
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pts[m].l <= L) lo = m;
    else hi = m;
  }
  const a = pts[lo];
  const b = pts[hi];
  const t = b.l === a.l ? 0 : (L - a.l) / (b.l - a.l);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: a.a + (b.a - a.a) * t, l: L };
}

const D_PATH = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

// ---- the yard -------------------------------------------------------------------------------------------
function Tree({ x, y, r }: { x: number; y: number; r: number }) {
  const lobes = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + (x % 7);
    return <circle key={i} cx={Math.cos(a) * r * 0.55} cy={Math.sin(a) * r * 0.55} r={r * 0.5} />;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`translate(${r * 0.16} ${r * 0.2})`} fill={K} opacity={0.08}>
        <circle r={r * 0.8} />
        {lobes}
      </g>
      <g fill={SG} stroke={G2} strokeOpacity={0.45} strokeWidth={1.4}>
        {lobes}
        <circle r={r * 0.7} stroke="none" />
      </g>
      <circle cx={-r * 0.12} cy={-r * 0.12} r={r * 0.34} fill={LG} />
      <circle cx={r * 0.1} cy={r * 0.12} r={r * 0.1} fill={G2} opacity={0.35} />
    </g>
  );
}

const TREES: [number, number, number][] = [
  [-220, -900, 40], [-340, -700, 50], [-180, -480, 34], [-300, -260, 44], [-160, -60, 38],
  [190, -980, 38], [300, -760, 48], [160, -560, 34], [250, -340, 42], [330, -150, 36],
  [90, 300, 38], [120, 760, 36], [60, 1200, 40], [-60, 1380, 34],
  [600, 200, 46], [720, 420, 38], [560, 640, 52], [680, 860, 40], [600, 1100, 44], [760, 1300, 50],
  [900, 100, 44], [-520, -300, 46], [560, -400, 50], [880, 700, 42], [1020, 1000, 48], [1000, 400, 40],
];

const Yard = memo(function Yard() {
  return (
    <g>
      <rect x={-2400} y={-2400} width={5200} height={6400} fill={HG} />
      {TREES.map(([x, y, r]) => (
        <Tree key={`${x}${y}`} x={x} y={y} r={r} />
      ))}
      {/* the apron in front of the warehouse and parking bays beside it */}
      <rect x={ROOF.x0 - 40} y={ROOF.y0 - 10} width={ROOF.x1 - ROOF.x0 + 80} height={60} fill={SG} opacity={0.8} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={700 + (i % 2) * 90} y={1560 + Math.floor(i / 2) * 120} width={80} height={110} fill="none" stroke={G2} strokeOpacity={0.4} strokeWidth={2} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`b${i}`} x={-30 - (i % 2) * 90} y={1560 + Math.floor(i / 2) * 120} width={80} height={110} fill="none" stroke={G2} strokeOpacity={0.4} strokeWidth={2} />
      ))}
      {/* the path, a hairline edge, the surface and a dashed centre line */}
      <path d={D_PATH} fill="none" stroke={K} strokeOpacity={0.16} strokeWidth={PW + 8} strokeLinejoin="round" />
      <path d={D_PATH} fill="none" stroke={G2} strokeOpacity={0.4} strokeWidth={PW} strokeLinejoin="round" />
      <path d={D_PATH} fill="none" stroke={WH} strokeOpacity={0.85} strokeWidth={4} strokeDasharray="30 30" strokeLinejoin="round" />
    </g>
  );
});

// The warehouse roof, two halves of corrugated sheet with round vents along the ridge.
const Roof = memo(function Roof() {
  const { x0, x1, y0, y1 } = ROOF;
  const mid = (x0 + x1) / 2;
  const vents: ReactNode[] = [];
  for (let y = y0 + 120; y < y1; y += 240) {
    vents.push(
      <g key={y}>
        {[mid - 18, mid + 18].map((vx) => (
          <g key={vx}>
            <circle cx={vx} cy={y} r={11} fill={LG} stroke={K} strokeOpacity={0.5} strokeWidth={1.6} />
            <circle cx={vx} cy={y} r={4} fill={G2} opacity={0.7} />
          </g>
        ))}
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <pattern id="lj-sheet" width={8} height={6} patternUnits="userSpaceOnUse">
          <rect width={8} height={6} fill="none" />
          <line x1={0} y1={5.2} x2={8} y2={5.2} stroke={G2} strokeOpacity={0.4} strokeWidth={1.1} />
        </pattern>
      </defs>
      <rect x={x0 + 6} y={y0 + 6} width={x1 - x0} height={y1 - y0} fill={K} opacity={0.1} />
      <rect x={x0} y={y0} width={mid - x0} height={y1 - y0} fill={WH} />
      <rect x={mid} y={y0} width={x1 - mid} height={y1 - y0} fill={G2} opacity={0.4} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#lj-sheet)" />
      <line x1={mid} y1={y0} x2={mid} y2={y1} stroke={K} strokeOpacity={0.55} strokeWidth={2} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={K} strokeOpacity={0.5} strokeWidth={3} />
      {vents}
    </g>
  );
});

// ---- the truck seen from above ----------------------------------------------------------------------------
const TopTruck = memo(function TopTruck() {
  return <ForkliftTop />;
});

// Tread lines on the four tyres, moved with the distance so the wheels read as turning. Same units as the art.
function Tread({ d }: { d: number }) {
  const o = (((d * 1.2) % 9) + 9) % 9;
  const rects: [number, number, number][] = [
    [-31, -64, 62],
    [-31, 40, 62],
    [-184, -54, 52],
    [-184, 34, 52],
  ];
  const lines: ReactNode[] = [];
  rects.forEach(([x, y, w], ri) => {
    for (let t = -9; t < w; t += 9) {
      const lx = x + t + o;
      if (lx < x + 3 || lx > x + w - 3) continue;
      lines.push(<line key={`${ri}-${t}`} x1={lx} y1={y + 2} x2={lx} y2={y + (ri < 2 ? 24 : 20) - 2} stroke={G} strokeWidth={2.2} />);
    }
  });
  return <g>{lines}</g>;
}

export function TopTruckAt({ x, y, rot, scale, d, opacity = 1 }: { x: number; y: number; rot: number; scale: number; d: number; opacity?: number }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((rot * 180) / Math.PI).toFixed(3)}) scale(${scale.toFixed(4)}) translate(15 0)`} opacity={opacity}>
      <TopTruck />
      <Tread d={d} />
    </g>
  );
}

// The world, drawn through a camera. World point (cx, cy) lands on screen (sx, sy) at scale s.
export function TopWorld({ cx, cy, sx, sy, s, opacity = 1 }: { cx: number; cy: number; sx: number; sy: number; s: number; opacity?: number }) {
  return (
    <g opacity={opacity} transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`}>
      <Yard />
      <Roof />
    </g>
  );
}

export const TOP_S = 0.5;
