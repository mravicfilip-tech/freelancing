// The chapters after the warehouse. Servis, a white line blueprint of the forklift on dark ground with its wheels
// turning and diagonal lines moving past. Then the very large fork blade, Najam with a grid of fifteen
// forklifts seen from the front, the dark floor with dotted paths, and Automatizacija with small robots.
// Variant 2 flat vector style, token fills only. Red only on the robot shells.
import { memo, type ReactNode } from 'react';
import { ForkliftFront } from '../../../variants/v2/art';
import { C } from '../../../tokens';
import { W, H, K, G, G2, LG, SG, WH, RED, clamp01, lerp, range, smooth, io, eout3 } from './frame';

// ---- the blueprint ------------------------------------------------------------------------------------------
export const BP = { x: 1085, y: 640, s: 1.6 };

const line = { fill: 'none', stroke: WH, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function BpWheel({ r, rot }: { r: number; rot: number }) {
  const bolts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(a) * r * 0.34} cy={Math.sin(a) * r * 0.34} r={r * 0.05} />;
  });
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return <line key={i} x1={Math.cos(a) * r * 0.27} y1={Math.sin(a) * r * 0.27} x2={Math.cos(a) * r * 0.6} y2={Math.sin(a) * r * 0.6} />;
  });
  const lugs = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return <line key={i} x1={Math.cos(a) * r} y1={Math.sin(a) * r} x2={Math.cos(a) * r * 0.9} y2={Math.sin(a) * r * 0.9} />;
  });
  return (
    <g transform={`rotate(${((rot * 180) / Math.PI).toFixed(2)})`} {...line} strokeWidth={1.6}>
      <circle r={r} />
      {lugs}
      <circle r={r * 0.78} strokeOpacity={0.7} />
      <circle r={r * 0.6} />
      <circle r={r * 0.27} />
      {spokes}
      {bolts}
    </g>
  );
}

const BpTruck = memo(function BpTruck() {
  return (
    <g {...line} strokeWidth={1.7}>
      {/* body and counterweight */}
      <path d="M 27 -55 L 23 -104 Q 22 -112 14 -112 L -4 -112 Q -10 -112 -12 -106 L -18 -60 L -40 -60 L -44 -104 Q -45 -110 -52 -110 L -126 -110 Q -133 -110 -137 -116 L -141 -124 Q -145 -131 -154 -131 L -178 -131 C -198 -131 -213 -116 -215 -92 L -215 -48 Q -215 -24 -198 -22 L -190.6 -22 A 33 33 0 0 1 -125.4 -22 L -34.9 -22 A 36 36 0 0 1 27 -55 Z" />
      <path d="M -206 -100 C -204 -116 -194 -123 -178 -123 L -160 -123 L -160 -58 L -206 -58 Z" strokeOpacity={0.7} />
      <path d="M -196 -110 H -168 M -196 -103 H -168 M -196 -96 H -168 M -196 -89 H -168" strokeOpacity={0.7} />
      <path d="M -122 -104 L -60 -104 L -58 -66 L -118 -66 Z" strokeOpacity={0.8} />
      <path d="M -125.4 -22 L -122 -38 L -36 -38 L -34.9 -22" strokeOpacity={0.7} />
      <path d="M -210 -64 L -40 -64" strokeOpacity={0.4} />
      {/* guard */}
      <path d="M -123 -214 L -128 -128" strokeWidth={2.2} />
      <path d="M 27 -214 Q 23 -160 11 -114" strokeWidth={2.2} />
      <rect x={-132} y={-221} width={164} height={8} rx={2.5} />
      <path d="M -127 -182 L -104 -213" />
      <path d="M -118 -214 L -122 -150" strokeOpacity={0.5} />
      {/* seat and wheel */}
      <path d="M -104 -122 Q -104 -126 -100 -126 L -64 -126 Q -60 -126 -61 -121 L -62 -116 L -104 -116 Z" />
      <path d="M -104 -122 L -110 -170 Q -111 -176 -105 -176 L -96 -176 Q -91 -176 -91 -170 L -90 -124" />
      <path d="M -4 -112 L -24 -150" />
      <ellipse cx={-27} cy={-153} rx={16} ry={3} transform="rotate(-24 -27 -153)" />
      <path d="M -8 -74 L 34 -92" />
      {/* mast, carriage and forks */}
      <rect x={28} y={-196} width={5} height={180} />
      <rect x={37} y={-214} width={9} height={204} />
      <rect x={34} y={-212} width={14} height={200} strokeOpacity={0.8} />
      <path d="M 32 -215 H 50 M 30 -22 H 50 M 33 -176 H 49 M 33 -120 H 49 M 33 -64 H 49" strokeOpacity={0.7} />
      <rect x={52} y={-100} width={5} height={60} />
      <rect x={50} y={-44} width={11} height={44} rx={1.5} />
      <rect x={59} y={-40} width={6} height={44.5} />
      <path d="M 59 0 L 184 0 L 184 1.4 Q 184 4.5 172 4.5 L 65 4.5 Q 59 4.5 59 0 Z" />
      <path d="M 55 -212 V -40" strokeDasharray="3 3" strokeOpacity={0.6} />
      {/* centre lines and dimensions */}
      <path d="M -158 -66 V 12 M 0 -72 V 12 M -240 -27 H -90 M -30 -31 H 48" strokeOpacity={0.35} strokeDasharray="10 4 2 4" strokeWidth={1.2} />
      <path d="M -215 40 H 184 M -215 34 V 46 M 184 34 V 46 M 0 34 V 46 M -158 34 V 46" strokeOpacity={0.55} strokeWidth={1.2} />
      <path d="M -250 0 V -232 M -256 0 H -244 M -256 -232 H -244" strokeOpacity={0.55} strokeWidth={1.2} />
    </g>
  );
});

export function Blueprint({ wheel, draw, cid }: { wheel: number; draw: number; cid: string }) {
  const { x, y, s } = BP;
  return (
    <g>
      <defs>
        <clipPath id={`${cid}-bp`}>
          <rect x={x - 460} y={y - 420} width={Math.max(0.01, 920 * draw)} height={620} />
        </clipPath>
        <pattern id="lj-bp-grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 H 0 V 40" fill="none" stroke={WH} strokeOpacity={0.09} strokeWidth={1} />
        </pattern>
      </defs>
      <g clipPath={`url(#${cid}-bp)`}>
        <rect x={x - 380} y={y - 400} width={760} height={560} fill={WH} fillOpacity={0.045} stroke={WH} strokeOpacity={0.22} strokeWidth={1} />
        <rect x={x - 380} y={y - 400} width={760} height={560} fill="url(#lj-bp-grid)" />
        <g transform={`translate(${x} ${y}) scale(${s})`} className="lj-bp">
          <BpTruck />
          <g transform="translate(-158 -27)">
            <BpWheel r={27} rot={wheel * (31 / 27)} />
          </g>
          <g transform="translate(0 -31)">
            <BpWheel r={31} rot={wheel} />
          </g>
        </g>
      </g>
    </g>
  );
}

// Diagonal lines moving past. A line near the blueprint is bright and bold, the ones at the sides are faint.
export function Streaks({ shift, opacity = 1 }: { shift: number; opacity?: number }) {
  const pitch = 330;
  const dxdy = 1.235;
  const els: ReactNode[] = [];
  const n0 = Math.floor((shift - 700) / pitch);
  for (let n = n0; n < n0 + 9; n++) {
    const x0 = n * pitch - shift + 160;
    const mid = x0 + 450 * dxdy;
    const w = Math.exp(-(((mid - 1050) / 200) ** 2));
    els.push(
      <line
        key={n}
        x1={x0}
        y1={H + 20}
        x2={x0 + (H + 60) * dxdy}
        y2={-40}
        stroke={WH}
        strokeLinecap="round"
        strokeOpacity={0.12 + 0.88 * w}
        strokeWidth={1.2 + 2.8 * w}
      />,
    );
  }
  return <g opacity={opacity}>{els}</g>;
}

// ---- the fork blade ----------------------------------------------------------------------------------------
export function Blade({ y }: { y: number }) {
  const t = 168;
  return (
    <g>
      <defs>
        <linearGradient id="lj-blade" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={G2} />
          <stop offset={0.22} stopColor={G} />
          <stop offset={1} stopColor={K} />
        </linearGradient>
        <linearGradient id="lj-blade-shadow" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={K} stopOpacity={0.3} />
          <stop offset={1} stopColor={K} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={y + t} width={W} height={70} fill="url(#lj-blade-shadow)" />
      <path
        d={`M 150 ${y + 26} Q 150 ${y} 190 ${y} L ${W + 80} ${y} L ${W + 80} ${y + t} L 420 ${y + t} Q 210 ${y + t - 4} 164 ${y + 92} Q 148 ${y + 62} 150 ${y + 26} Z`}
        fill="url(#lj-blade)"
        stroke={K}
        strokeOpacity={0.5}
        strokeWidth={1.4}
      />
      <path d={`M 196 ${y + 8} L ${W + 80} ${y + 8}`} stroke={WH} strokeOpacity={0.4} strokeWidth={2} />
      <path d={`M 300 ${y + 34} L ${W + 80} ${y + 34}`} stroke={WH} strokeOpacity={0.12} strokeWidth={1.4} />
      <path d={`M 470 ${y + t - 24} L ${W + 80} ${y + t - 24}`} stroke={K} strokeOpacity={0.35} strokeWidth={1.4} />
    </g>
  );
}

// ---- the grid of rental forklifts ------------------------------------------------------------------------------
const GridTruck = memo(function GridTruck() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={106} ry={10} fill={K} opacity={0.16} />
      <ForkliftFront />
    </g>
  );
});

const COLS = 5;
const ROWS = 3;
const GRID_S = 0.84;
const ROW_FOOT = [686, 768, 850];
const COL_X = (c: number) => W / 2 + (c - 2) * 196;

export function RentalGrid({ k }: { k: number }) {
  const els: ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const a = eout3(range(k, 0.1 + i * 0.047, 0.1 + i * 0.047 + 0.12));
      if (a <= 0.001) continue;
      els.push(
        <g key={i} opacity={a} transform={`translate(${COL_X(c)} ${ROW_FOOT[r] - (1 - a) * 46}) scale(${GRID_S})`}>
          <GridTruck />
        </g>,
      );
    }
  }
  return <g>{els}</g>;
}

// ---- the dark floor and the robots ------------------------------------------------------------------------------
type Lane = { a: [number, number]; b: [number, number]; phase: number };
const LANES: Lane[] = [
  { a: [40, 868], b: [330, 340], phase: 0.0 },
  { a: [404, 892], b: [668, 566], phase: 0.3 },
  { a: [830, 892], b: [1000, 640], phase: 0.55 },
  { a: [1040, 872], b: [1344, 350], phase: 0.78 },
];

export function Paths({ p }: { p: number }) {
  return (
    <g>
      {LANES.map((l, i) => {
        const q = clamp01(p * 1.15 - i * 0.09);
        const x = lerp(l.a[0], l.b[0], q);
        const y = lerp(l.a[1], l.b[1], q);
        return (
          <g key={i}>
            <line x1={l.a[0]} y1={l.a[1]} x2={x} y2={y} stroke={WH} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="0 15" strokeOpacity={0.85} />
            {[l.a, l.b].map((d, j) => (
              <rect key={j} x={d[0] - 44} y={d[1] - 44} width={88} height={88} rx={14} transform={`rotate(${(Math.atan2(l.b[1] - l.a[1], l.b[0] - l.a[0]) * 180) / Math.PI} ${d[0]} ${d[1]})`} fill="none" stroke={WH} strokeOpacity={0.22 * q} strokeWidth={1.6} strokeDasharray="6 6" />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function cycle(t: number) {
  const f = ((t % 1) + 1) % 1;
  if (f < 0.4) return { u: io(f / 0.4), back: 0 };
  if (f < 0.5) return { u: 1, back: io((f - 0.4) / 0.1) };
  if (f < 0.9) return { u: 1 - io((f - 0.5) / 0.4), back: 1 };
  return { u: 0, back: 1 - io((f - 0.9) / 0.1) };
}

const Robot = memo(function Robot() {
  return (
    <g>
      <rect x={-50} y={-33} width={100} height={66} rx={17} fill={G} />
      <rect x={-50} y={-33} width={100} height={66} rx={17} fill="none" stroke={RED} strokeWidth={4.5} />
      <rect x={-44} y={-27} width={88} height={54} rx={12} fill="none" stroke={K} strokeOpacity={0.5} strokeWidth={1.2} />
      <rect x={42} y={-12} width={9} height={24} rx={3} fill={K} />
      <circle r={19} fill={K} />
      <circle r={19} fill="none" stroke={G2} strokeWidth={1.4} />
      <circle r={5} fill={LG} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={i} x1={Math.cos((i / 8) * 6.2832) * 9} y1={Math.sin((i / 8) * 6.2832) * 9} x2={Math.cos((i / 8) * 6.2832) * 15} y2={Math.sin((i / 8) * 6.2832) * 15} stroke={G2} strokeWidth={1.2} />
      ))}
    </g>
  );
});

const Parcel = memo(function Parcel() {
  return (
    <g>
      <rect x={-31} y={-23} width={62} height={46} fill={WH} stroke={G2} strokeWidth={1.2} />
      <rect x={-5} y={-23} width={10} height={46} fill={SG} />
      <line x1={-31} y1={0} x2={31} y2={0} stroke={LG} strokeWidth={1} />
      <rect x={-24} y={9} width={12} height={8} fill={WH} stroke={G2} strokeWidth={0.8} />
    </g>
  );
});

export function Robots({ t, appear }: { t: number; appear: number }) {
  return (
    <g>
      {LANES.map((l, i) => {
        const c = cycle(t / 700 + l.phase);
        const x = lerp(l.a[0], l.b[0], c.u);
        const y = lerp(l.a[1], l.b[1], c.u);
        const ang = (Math.atan2(l.b[1] - l.a[1], l.b[0] - l.a[0]) * 180) / Math.PI + 180 * c.back;
        const s = smooth(range(appear, i * 0.12, i * 0.12 + 0.3));
        if (s <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(2)}) scale(${s.toFixed(3)})`}>
            <ellipse cx={4} cy={6} rx={56} ry={38} fill={K} opacity={0.25} />
            <Robot />
            <g transform="translate(-4 0)">
              <Parcel />
            </g>
          </g>
        );
      })}
    </g>
  );
}

export const DARK = C.ink;
export const FLOOR_W = W;
