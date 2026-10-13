// The top down yard. A grey S path runs from the top down to the warehouse roof, the forklift follows it with
// its load, then the camera zooms into the roof. World units are pixels at the resting camera, the path is
// 124 wide. Drawn in the variant 2 flat vector style from tokens.
import { memo, type ReactNode } from 'react';
import { ForkliftTop } from '../../../variants/v2/art';
import { C } from '../../../tokens';
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

// Trees only where no text column sits at the hold, so everything left of x -110 stays empty, see the yard note below.
const TREES: [number, number, number][] = [
  [150, -1120, 38], [260, -900, 46], [180, -640, 34], [320, -420, 42], [120, -250, 34],
  [-82, -980, 30], [-86, -520, 28], [-84, -180, 26],
  [520, -1100, 44], [640, -820, 50], [460, -560, 36], [700, -300, 44], [560, -60, 38], [820, -980, 46], [900, -620, 40], [980, -240, 48],
  [1040, 220, 44], [1060, 700, 50], [1040, 1180, 46], [-80, 1540, 30],
];

// A forklift parked in its bay seen from above, nose up. The art of the moving truck without its load, same units, half size.
const ParkedTop = memo(function ParkedTop() {
  return (
    <g transform="rotate(-90) scale(0.5) translate(15 0)">
      <rect x={-206} y={-60} width={400} height={128} rx={30} fill={K} opacity={0.08} transform="translate(8 8)" />
      {[-1, 1].map((sg) => (
        <g key={sg}>
          <rect x={-31} y={sg > 0 ? 40 : -64} width={62} height={24} rx={6} fill={K} />
          <rect x={-184} y={sg > 0 ? 34 : -54} width={52} height={20} rx={6} fill={K} />
        </g>
      ))}
      <path d="M 28 -54 L 28 54 L -170 56 Q -216 56 -216 10 L -216 -10 Q -216 -56 -170 -56 Z" fill={C.lindeRed} />
      <path d="M -150 -46 L -150 46 L -176 46 Q -206 46 -206 10 L -206 -10 Q -206 -46 -176 -46 Z" fill={C.tonedRed} />
      {[-30, -18, -6, 6, 18, 30].map((vy) => (
        <line key={vy} x1={-196} y1={vy} x2={-168} y2={vy} stroke={C.primary700} strokeWidth={2} />
      ))}
      <rect x={-40} y={-40} width={56} height={80} rx={4} fill={K} />
      <rect x={-134} y={-60} width={166} height={120} rx={8} fill={K} />
      {[-112, -88, -64, -40, -16, 8].map((sx) => (
        <rect key={sx} x={sx} y={-46} width={14} height={92} rx={2} fill={G} />
      ))}
      <rect x={32} y={-44} width={18} height={88} fill={G} />
      <rect x={50} y={-48} width={11} height={96} fill={K} />
      <rect x={60} y={-30} width={126} height={11} fill={G} />
      <rect x={60} y={19} width={126} height={11} fill={G} />
    </g>
  );
});

const Bay = ({ x, y, truck }: { x: number; y: number; truck: boolean }) => (
  <g>
    <rect x={x} y={y} width={80} height={214} fill="none" stroke={G2} strokeOpacity={0.5} strokeWidth={2} />
    {truck && (
      <g transform={`translate(${x + 40} ${y + 107})`}>
        <ParkedTop />
      </g>
    )}
  </g>
);

// A row of bays, every n-th one empty so the rows read as a working yard.
const BayRow = ({ x, y, n, gap }: { x: number; y: number; n: number; gap: number }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <Bay key={i} x={x + i * 86} y={y} truck={(i + gap) % 4 !== 3} />
    ))}
  </g>
);

const PalletStack = ({ x, y, k = 0 }: { x: number; y: number; k?: number }) => (
  <g>
    <rect x={x + 3} y={y + 3} width={56} height={56} fill={K} opacity={0.1} />
    <rect x={x} y={y} width={56} height={56} fill={k % 3 === 0 ? WH : LG} stroke={G2} strokeOpacity={0.7} strokeWidth={1.4} />
    <line x1={x} y1={y} x2={x + 56} y2={y + 56} stroke={G2} strokeOpacity={0.35} strokeWidth={1} />
    <line x1={x + 56} y1={y} x2={x} y2={y + 56} stroke={G2} strokeOpacity={0.35} strokeWidth={1} />
    <rect x={x + 8} y={y + 8} width={40} height={40} fill="none" stroke={G2} strokeOpacity={0.5} strokeWidth={1} />
  </g>
);

// An outdoor rack seen from above, long frame with the cross ties and the pallets on its beams.
const RackYard = ({ x, y, w }: { x: number; y: number; w: number }) => {
  const ties: ReactNode[] = [];
  for (let i = 0; i <= w; i += 60) ties.push(<line key={i} x1={x + i} y1={y} x2={x + i} y2={y + 34} stroke={K} strokeOpacity={0.55} strokeWidth={2} />);
  const pal: ReactNode[] = [];
  for (let i = 0; i + 60 <= w; i += 60) pal.push(<rect key={i} x={x + i + 6} y={y + 5} width={48} height={24} fill={WH} stroke={G2} strokeOpacity={0.6} strokeWidth={1} />);
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} fill={LG} stroke={G2} strokeOpacity={0.7} strokeWidth={1.6} />
      {pal}
      {ties}
    </g>
  );
};

// A hall roof seen from above, two pitches with a ridge, skylight strips along each pitch and round vents on the ridge.
const Hall = memo(function Hall({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const mid = x + w / 2;
  // standing seam lines across both pitches and three long skylight strips on each, parallel to the ridge
  const lights: ReactNode[] = [];
  for (let j = y + 14; j < y + h - 6; j += 14) lights.push(<line key={`s${j}`} x1={x} y1={j} x2={x + w} y2={j} stroke={G2} strokeOpacity={0.22} strokeWidth={1} />);
  for (const f of [0.14, 0.27, 0.40, 0.60, 0.73, 0.86]) {
    lights.push(<rect key={f} x={x + w * f - 7} y={y + 34} width={14} height={h - 68} fill={LG} stroke={K} strokeOpacity={0.5} strokeWidth={1.2} />);
    lights.push(<line key={`m${f}`} x1={x + w * f} y1={y + 34} x2={x + w * f} y2={y + h - 34} stroke={K} strokeOpacity={0.25} strokeWidth={1} />);
  }
  const vents: ReactNode[] = [];
  for (let j = y + 60; j < y + h - 30; j += 120) vents.push(<circle key={j} cx={mid} cy={j} r={9} fill={LG} stroke={K} strokeOpacity={0.5} strokeWidth={1.4} />);
  return (
    <g>
      <rect x={x + 6} y={y + 6} width={w} height={h} fill={K} opacity={0.1} />
      <rect x={x} y={y} width={mid - x} height={h} fill={WH} />
      <rect x={mid} y={y} width={x + w - mid} height={h} fill={G2} opacity={0.4} />
      {lights}
      <line x1={mid} y1={y} x2={mid} y2={y + h} stroke={K} strokeOpacity={0.55} strokeWidth={2} />
      {vents}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={K} strokeOpacity={0.5} strokeWidth={3} />
    </g>
  );
});

// A van at the gate seen from above, nose down.
const VanTop = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={3} y={3} width={58} height={128} fill={K} opacity={0.1} />
    <rect x={0} y={0} width={58} height={128} rx={6} fill={WH} stroke={G} strokeWidth={1.6} />
    <rect x={6} y={78} width={46} height={26} fill={LG} stroke={G} strokeWidth={1.2} />
    <rect x={4} y={14} width={50} height={56} fill={SG} stroke={G2} strokeOpacity={0.6} strokeWidth={1} />
    <line x1={29} y1={14} x2={29} y2={70} stroke={G2} strokeOpacity={0.5} strokeWidth={1} />
    {[8, 50].map((vx) => (
      <rect key={vx} x={vx - 4} y={86} width={8} height={4} fill={K} />
    ))}
  </g>
);

// The yard, left to right of the E stretch of the path. Nothing is drawn left of world x -110 because the R text column sits
// there at the hold, so the text lands on empty ground and no wash or fade is needed.
const Yard = memo(function Yard() {
  const rackRows: ReactNode[] = [];
  for (let i = 0; i < 4; i++) rackRows.push(<RackYard key={`l${i}`} x={-80} y={1160 + i * 58} w={360} />);
  const stacks: ReactNode[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) stacks.push(<PalletStack key={`s${r}${c}`} x={520 + c * 76} y={1180 + r * 76} k={r + c} />);
  const stacksL: ReactNode[] = [];
  for (let c = 0; c < 4; c++) stacksL.push(<PalletStack key={`m${c}`} x={-70 + c * 86} y={1440} k={c} />);
  return (
    <g>
      <rect x={-2400} y={-2400} width={5200} height={6400} fill={HG} />
      {TREES.map(([x, y, r]) => (
        <Tree key={`${x}${y}`} x={x} y={y} r={r} />
      ))}
      {/* paved aprons either side of the E stretch, with a kerb */}
      <rect x={-110} y={560} width={438} height={1000} fill={SG} opacity={0.8} stroke={G2} strokeOpacity={0.5} strokeWidth={2} />
      <rect x={452} y={560} width={560} height={1000} fill={SG} opacity={0.8} stroke={G2} strokeOpacity={0.5} strokeWidth={2} />
      {/* lane markings on the aprons */}
      <line x1={-110} y1={1112} x2={328} y2={1112} stroke={WH} strokeWidth={3} strokeDasharray="26 22" />
      <line x1={452} y1={1112} x2={1012} y2={1112} stroke={WH} strokeWidth={3} strokeDasharray="26 22" />
      {/* the halls */}
      <Hall x={-90} y={180} w={380} h={340} />
      <Hall x={520} y={140} w={400} h={400} />
      {/* parked forklifts in bays */}
      <BayRow x={-80} y={620} n={4} gap={0} />
      <BayRow x={-80} y={872} n={4} gap={2} />
      <BayRow x={500} y={620} n={6} gap={1} />
      <BayRow x={500} y={872} n={6} gap={3} />
      {rackRows}
      {stacks}
      {stacksL}
      <VanTop x={470} y={1420} />
      {/* the apron in front of the warehouse and the gate */}
      <rect x={ROOF.x0 - 40} y={ROOF.y0 - 10} width={ROOF.x1 - ROOF.x0 + 80} height={60} fill={SG} opacity={0.8} />
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
