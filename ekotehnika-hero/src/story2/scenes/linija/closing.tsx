// B, the way from the aisle into the servis schematic. The forklift stands at the end of the aisle, front on. Two dark drawing
// sheets close in from the left and right edge, each with a hard 1px edge, and on the sheets the same truck is drawn as exact
// line art at the same place and size, so the real truck is converted to a drawing as the sheets pass over it. When they meet the
// frame is the dark measuring grid with the front elevation drawn on it, centre line, ground line and a scale ruler. Then S
// takes over, its sheet wipes in from the left and the same edge removes this drawing. No fades, no zoom into flat blocks.
// Units are the art units of ForkliftFront, ground at y 0, y negative up, x 0 on the centre line.
import { memo, type ReactNode } from 'react';
import { WH } from './frame';
import type { Cols } from './stage';

const SHEET = '#2b2b2b';
const GROUND = '#222222';

const o = (w: number, op = 0.92) => ({ fill: 'none', stroke: WH, strokeWidth: w, strokeOpacity: op, strokeLinejoin: 'miter' as const });
const solid = (w: number, op = 0.92) => ({ ...o(w, op), fill: SHEET });

// The front elevation of the truck, two weights, 2px for the outline and 1px for detail.
const FrontLines = memo(function FrontLines() {
  const rods: ReactNode[] = [];
  for (let y = -190; y < -20; y += 34) rods.push(<line key={y} x1={-38} y1={y} x2={-28} y2={y} {...o(1, 0.5)} />, <line key={`r${y}`} x1={28} y1={y} x2={38} y2={y} {...o(1, 0.5)} />);
  const tread: ReactNode[] = [];
  for (let y = -56; y < -4; y += 6) tread.push(<line key={y} x1={-61} y1={y} x2={-41} y2={y} {...o(1, 0.45)} />, <line key={`t${y}`} x1={41} y1={y} x2={61} y2={y} {...o(1, 0.45)} />);
  return (
    <g className="lj-bp">
      {/* mast, behind the guard */}
      <rect x={-38} y={-212} width={10} height={200} {...solid(2)} />
      <rect x={28} y={-212} width={10} height={200} {...solid(2)} />
      <rect x={-33} y={-214} width={8} height={204} {...o(1, 0.7)} />
      <rect x={25} y={-214} width={8} height={204} {...o(1, 0.7)} />
      <rect x={-40} y={-217} width={80} height={5} {...solid(2)} />
      {rods}
      {/* counterweight and cowl */}
      <rect x={-62} y={-132} width={124} height={34} {...solid(2)} />
      <line x1={-58} y1={-128} x2={58} y2={-128} {...o(1, 0.5)} />
      <rect x={-58} y={-112} width={116} height={72} {...solid(2)} />
      <rect x={-58} y={-60} width={116} height={20} {...o(1, 0.7)} />
      <rect x={-42} y={-40} width={84} height={14} {...o(1, 0.7)} />
      <rect x={-50} y={-102} width={9} height={6} {...o(1, 0.8)} />
      <rect x={41} y={-102} width={9} height={6} {...o(1, 0.8)} />
      {/* tyres, true to the art, with tread lines */}
      <rect x={-64} y={-62} width={26} height={62} {...solid(2)} />
      <rect x={38} y={-62} width={26} height={62} {...solid(2)} />
      {tread}
      {/* overhead guard */}
      <line x1={-58} y1={-216} x2={-50} y2={-114} {...o(2)} />
      <line x1={58} y1={-216} x2={50} y2={-114} {...o(2)} />
      <line x1={-54} y1={-214} x2={-56} y2={-130} {...o(1, 0.6)} />
      <line x1={54} y1={-214} x2={56} y2={-130} {...o(1, 0.6)} />
      <rect x={-64} y={-222} width={128} height={8} {...solid(2)} />
      {/* carriage, backrest and forks */}
      <rect x={-46} y={-100} width={92} height={56} {...o(2)} />
      {[-34, -23, -12, -1, 10, 21, 32].map((bx) => (
        <line key={bx} x1={bx + 1} y1={-100} x2={bx + 1} y2={-44} {...o(1, 0.5)} />
      ))}
      <rect x={-48} y={-44} width={96} height={44} {...solid(2)} />
      <rect x={-29} y={-40} width={10} height={44.5} {...o(1, 0.8)} />
      <rect x={19} y={-40} width={10} height={44.5} {...o(1, 0.8)} />
      {/* the load, a pallet with four cartons */}
      <rect x={-50} y={2.8} width={100} height={2.2} {...solid(1.5)} />
      <rect x={-50} y={-5} width={100} height={7.8} {...o(1, 0.6)} />
      <rect x={-50} y={-9.4} width={100} height={4.4} {...solid(1.5)} />
      <rect x={-49} y={-43.4} width={48} height={34} {...solid(1.5)} />
      <rect x={1} y={-43.4} width={48} height={34} {...solid(1.5)} />
      <rect x={-46} y={-73.4} width={45} height={30} {...solid(1.5)} />
      <rect x={1} y={-73.4} width={45} height={30} {...solid(1.5)} />
      <line x1={-25} y1={-43.4} x2={-25} y2={-9.4} {...o(1, 0.5)} />
      <line x1={25} y1={-43.4} x2={25} y2={-9.4} {...o(1, 0.5)} />
    </g>
  );
});

// The centre line, the ground line and a scale ruler under the truck, drawn on by r from 0 to 1 from the left.
const Construction = ({ r, id }: { r: number; id: string }) => {
  const ticks: ReactNode[] = [];
  for (let x = -120; x <= 120; x += 10) ticks.push(<line key={x} x1={x} y1={32} x2={x} y2={x % 50 === 0 ? 42 : 37} {...o(1, 0.6)} />);
  return (
    <g className="lj-bp">
      <line x1={0} y1={-262} x2={0} y2={22} stroke={WH} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="14 3 2 3" />
      <line x1={-260} y1={0} x2={260} y2={0} {...o(1, 0.5)} />
      <clipPath id={`${id}-cr`}>
        <rect x={-130} y={-240} width={Math.max(0.01, 260 * r)} height={290} />
      </clipPath>
      <g clipPath={`url(#${id}-cr)`}>
        <line x1={-120} y1={32} x2={120} y2={32} {...o(1, 0.6)} />
        {ticks}
        <rect x={-76} y={-232} width={152} height={252} {...o(1, 0.3)} />
      </g>
    </g>
  );
};

// p is how far the two sheets have closed, 0 to 1. foot and s place the truck, wipe is the screen x where the servis sheet has got
// to, this drawing is only shown right of it. r draws the construction lines.
export function Closing({ cols, p, cid, foot, s, wipe, r }: { cols: Cols; p: number; cid: string; foot: number; s: number; wipe: number; r: number }) {
  const cx = (cols.x0 + cols.x1) / 2;
  const left = cols.x0 - 2 + (cx - cols.x0 + 2) * p;
  const right = cols.x1 + 2 - (cols.x1 + 2 - cx) * p;
  const top = cols.top;
  const h = cols.y1 - top + 4;
  const shown = Math.max(wipe, cols.x0);
  const rule: ReactNode[] = [];
  for (let x = Math.ceil((cols.x0 - 2) / 24) * 24; x < cols.x1 + 2; x += 24) {
    const major = x % 120 === 0;
    rule.push(<line key={x} x1={x} y1={foot + 3} x2={x} y2={foot + (major ? 16 : 8)} strokeOpacity={major ? 0.6 : 0.35} strokeWidth={1} />);
    if (major) rule.push(<line key={`m${x}`} x1={x} y1={top} x2={x} y2={foot + 16} strokeOpacity={0.1} strokeWidth={1} />);
  }
  return (
    <g>
      <defs>
        <clipPath id={`${cid}-cl`}>
          <rect x={cols.x0 - 2} y={top} width={Math.max(0.01, left - cols.x0 + 2)} height={h} />
          <rect x={right} y={top} width={Math.max(0.01, cols.x1 + 2 - right)} height={h} />
        </clipPath>
        <clipPath id={`${cid}-sh`}>
          <rect x={shown} y={top} width={Math.max(0.01, cols.x1 + 2 - shown)} height={h} />
        </clipPath>
        <pattern id={`${cid}-cg`} x={0} y={0} width={24} height={24} patternUnits="userSpaceOnUse">
          <path d="M 24 0 H 0 V 24" fill="none" stroke={WH} strokeOpacity={0.08} strokeWidth={1} />
        </pattern>
      </defs>
      <g clipPath={`url(#${cid}-sh)`}>
        <g clipPath={`url(#${cid}-cl)`}>
          <rect x={cols.x0 - 2} y={top} width={cols.x1 - cols.x0 + 4} height={h} fill={GROUND} />
          <rect x={cols.x0 - 2} y={top} width={cols.x1 - cols.x0 + 4} height={h} fill={`url(#${cid}-cg)`} />
          {/* the ground line and a 24px ruler under it run across both sheets to the frame edge, with a heavier line every 120 */}
          <g className="lj-bp" stroke={WH} fill="none">
            <line x1={cols.x0 - 2} y1={foot} x2={cols.x1 + 2} y2={foot} strokeOpacity={0.5} strokeWidth={1} />
            {rule}
          </g>
          <g transform={`translate(${cx.toFixed(2)} ${foot.toFixed(2)}) scale(${s.toFixed(4)})`}>
            <Construction r={r} id={cid} />
            <FrontLines />
          </g>
        </g>
        {p > 0 && p < 1 && (
          <g stroke={WH} strokeOpacity={0.9} strokeWidth={1}>
            <line x1={left} y1={top} x2={left} y2={top + h} />
            <line x1={right} y1={top} x2={right} y2={top + h} />
          </g>
        )}
      </g>
    </g>
  );
}
