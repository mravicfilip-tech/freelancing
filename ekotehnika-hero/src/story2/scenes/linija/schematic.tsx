// Servis, the X50 as a precise technical drawing on the dark ground. An orthographic side elevation built from exact
// numbers in millimetres, straight lines, true circles and chamfers only, so no stroke wobbles. Two weights, 2px for the
// outline and 1px for detail, dashed hidden and centre lines, a 24px measuring grid at 8 percent, and dimension lines in
// LMH turquoise with the X50 figures from the data sheet (the same ones the Sistem schematic carries). Dimension ends are
// plain bars, never arrowheads. The wheels turn with the story clock. No glow, no red.
// The speed lines live here too. They stay inside the scene half, columns 5 to 12 between the two grid rules, so they never
// cross the text column or the top row.
import { memo, type ReactNode } from 'react';
import { H, WH } from './frame';
import type { Cols } from './stage';

const TURQ = '#7fbccd'; // LMH turquoise, 72 percent tint
const SHEET = '#2b2b2b'; // the dark ground with the sheet's 4.5 percent white lift, the fill that hides what is behind a solid

// ---- the numbers, millimetres, x from the rear end toward the forks, y up from the ground -------------------------------
const FIG = { l1: 4373, l2: 3173, y: 2120, h1: 2523, h6: 2495, c: 600, q: 4990 };
const REAR = { x: 560, y: 380, r: 380 };
const FRONT = { x: 560 + FIG.y, y: 410, r: 410 };
const MAST_X = 3040;

type P = [number, number];
const BODY: P[] = [[0, 300], [0, 1190], [120, 1330], [900, 1330], [990, 1240], [1190, 1240], [1250, 1150], [2330, 1150], [2330, 960], [2990, 960], [2990, 300]];
const SEAT_BACK: P[] = [[1330, 1235], [1270, 1790], [1360, 1800], [1450, 1235]];
const POST_REAR: P[] = [[1190, 1240], [1250, 1240], [1360, 2430], [1300, 2430]];
const POST_FRONT: P[] = [[2270, 1150], [2330, 1150], [2250, 2430], [2190, 2430]];
const FORK: P[] = [[3173, 1050], [3233, 1050], [3233, 60], [4170, 60], [4373, 20], [4373, 0], [3173, 0]];

type Geo = { x0: number; base: number; s: number };

const stroke = (w: number, o = 1, fill = 'none') => ({ fill, stroke: WH, strokeWidth: w, strokeOpacity: o, strokeLinejoin: 'miter' as const, strokeLinecap: 'butt' as const });

const Body = memo(function Body({ x0, base, s }: Geo) {
  const X = (mm: number) => x0 + mm * s;
  const Y = (mm: number) => base - mm * s;
  const pts = (ps: P[]) => ps.map(([a, b]) => `${X(a).toFixed(2)},${Y(b).toFixed(2)}`).join(' ');
  const ln = (a: number, b: number, c: number, d: number, o = 0.55, extra: object = {}) => <line x1={X(a)} y1={Y(b)} x2={X(c)} y2={Y(d)} {...stroke(1, o)} {...extra} />;
  const louvres = [1130, 1170, 1210, 1250, 1290].map((y) => <g key={y}>{ln(200, y, 760, y, 0.5)}</g>);
  const ribs = Array.from({ length: 9 }, (_, i) => <g key={i}>{ln(1250 + i * 130, 2430, 1250 + i * 130, 2495, 0.5)}</g>);
  const braces = [2300, 1900, 1500, 1100, 700, 300].map((y) => <g key={y}>{ln(2985, y, 3095, y, 0.5)}</g>);
  return (
    <g>
      {/* hidden lines first, the lift cylinder and the chain inside the mast */}
      <rect x={X(2910)} y={Y(1500)} width={65 * s} height={1380 * s} {...stroke(1, 0.45)} strokeDasharray="5 3" />
      {ln(MAST_X, 2380, MAST_X, 1050, 0.45, { strokeDasharray: '5 3' })}
      {/* chassis and counterweight */}
      <polygon points={pts(BODY)} {...stroke(2, 0.92, SHEET)} />
      {ln(0, 1060, 1000, 1060)}
      {ln(1000, 300, 1000, 1240)}
      {louvres}
      <rect x={X(0)} y={Y(1130)} width={50 * s} height={130 * s} {...stroke(1, 0.55)} />
      <rect x={X(1350)} y={Y(960)} width={800 * s} height={540 * s} {...stroke(1, 0.5)} />
      {ln(1350, 780, 2150, 780, 0.4)}
      {/* seat, steering column and wheel */}
      <rect x={X(1330)} y={Y(1235)} width={460 * s} height={85 * s} {...stroke(1.5, 0.85, SHEET)} />
      <polygon points={pts(SEAT_BACK)} {...stroke(1.5, 0.85, SHEET)} />
      {ln(2260, 1150, 2130, 1480, 0.85)}
      <line x1={X(1953)} y1={Y(1410)} x2={X(2307)} y2={Y(1550)} {...stroke(2, 0.92)} />
      {/* overhead guard */}
      <polygon points={pts(POST_REAR)} {...stroke(2, 0.92, SHEET)} />
      <polygon points={pts(POST_FRONT)} {...stroke(2, 0.92, SHEET)} />
      <rect x={X(1150)} y={Y(2495)} width={1290 * s} height={65 * s} {...stroke(2, 0.92, SHEET)} />
      {ribs}
      {/* mast, carriage and forks */}
      <rect x={X(2985)} y={Y(FIG.h1)} width={110 * s} height={(FIG.h1 - 90) * s} {...stroke(2, 0.92, SHEET)} />
      <rect x={X(3095)} y={Y(2380)} width={65 * s} height={2230 * s} {...stroke(1, 0.8, SHEET)} />
      {braces}
      <rect x={X(3105)} y={Y(1050)} width={68 * s} height={960 * s} {...stroke(2, 0.92, SHEET)} />
      <polygon points={pts(FORK)} {...stroke(2, 0.92, SHEET)} />
      {ln(3233, 60, 3233, 1050, 0.55)}
    </g>
  );
});

// One tyre, a true circle with a tread band, lugs, rim, hub and bolts. The group turns, the lines stay exact.
function Wheel({ cx, cy, r, turn }: { cx: number; cy: number; r: number; turn: number }) {
  const lugs = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    return <line key={i} x1={Math.cos(a) * r * 0.92} y1={Math.sin(a) * r * 0.92} x2={Math.cos(a) * r} y2={Math.sin(a) * r} {...stroke(1, 0.7)} />;
  });
  const bolts = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(a) * r * 0.42} cy={Math.sin(a) * r * 0.42} r={r * 0.06} {...stroke(1, 0.8)} />;
  });
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    return <line key={i} x1={Math.cos(a) * r * 0.27} y1={Math.sin(a) * r * 0.27} x2={Math.cos(a) * r * 0.6} y2={Math.sin(a) * r * 0.6} {...stroke(1, 0.55)} />;
  });
  return (
    <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)})`}>
      <circle r={r} {...stroke(2, 0.92, SHEET)} />
      <g transform={`rotate(${((turn * 180) / Math.PI).toFixed(2)})`}>
        {lugs}
        <circle r={r * 0.86} {...stroke(1, 0.55)} />
        <circle r={r * 0.6} {...stroke(1, 0.9)} />
        <circle r={r * 0.27} {...stroke(1, 0.9)} />
        {spokes}
        {bolts}
      </g>
    </g>
  );
}

const labelProps = { fill: TURQ, fontSize: 14, fontWeight: 500, letterSpacing: 1.1, textAnchor: 'middle' as const };
const textW = (t: string) => t.length * 9 + 10;

// A dimension line with plain end bars and its label in a break of the line. h runs along x, v along y.
function DimH({ x1, x2, y, label, ext }: { x1: number; x2: number; y: number; label: string; ext: [number, number, number] }) {
  const mid = (x1 + x2) / 2;
  const g = textW(label) / 2;
  return (
    <g stroke={TURQ} strokeWidth={1} fill="none">
      <line x1={x1} y1={ext[0]} x2={x1} y2={y + 7} strokeOpacity={0.55} />
      <line x1={x2} y1={ext[1]} x2={x2} y2={y + 7} strokeOpacity={0.55} />
      <line x1={x1} y1={y} x2={mid - g} y2={y} />
      <line x1={mid + g} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <rect x={mid - g} y={y - 9} width={2 * g} height={18} fill={SHEET} stroke="none" />
      <text x={mid} y={y + 5} stroke="none" {...labelProps}>
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label, at, ext }: { x: number; y1: number; y2: number; label: string; at: number; ext: [number, number][] }) {
  const g = 11;
  return (
    <g stroke={TURQ} strokeWidth={1} fill="none">
      {ext.map(([ya, xa], i) => (
        <line key={i} x1={xa} y1={ya} x2={x + (xa > x ? 7 : -7)} y2={ya} strokeOpacity={0.55} />
      ))}
      <line x1={x} y1={y1} x2={x} y2={at - g} />
      <line x1={x} y1={at + g} x2={x} y2={y2} />
      <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} />
      <line x1={x - 6} y1={y2} x2={x + 6} y2={y2} />
      <rect x={x - textW(label) / 2} y={at - 9} width={textW(label)} height={18} fill={SHEET} stroke="none" />
      <text x={x} y={at + 5} stroke="none" {...labelProps}>
        {label}
      </text>
    </g>
  );
}

export function sheetOf(c: Cols) {
  const left = c.left(5);
  const right = c.right(12);
  const top = c.top + 40 / c.sc;
  const bottom = c.bottom - 24 / c.sc;
  return { left, right, top, bottom, w: right - left, h: bottom - top };
}

// travel is the ground the story has covered in drawing units, the wheels turn by it. draw runs 0 to 1 and wipes the sheet on.
export function Schematic({ cols, travel, draw, cid, dy, under }: { cols: Cols; travel: number; draw: number; cid: string; dy: number; under?: ReactNode }) {
  const sh = sheetOf(cols);
  const mmL = -430;
  const mmR = 4800;
  const s = Math.min(0.15, (sh.w - 56) / (mmR - mmL));
  const base = sh.bottom - 24 - 124;
  const x0 = (sh.left + sh.right) / 2 - ((mmL + mmR) / 2) * s;
  const X = (mm: number) => x0 + mm * s;
  const Y = (mm: number) => base - mm * s;
  const rows = [base + 38, base + 76, base + 114];
  const cl = (a: number, b: number, c: number, d: number, k: string): ReactNode => <line key={k} x1={a} y1={b} x2={c} y2={d} stroke={WH} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="14 3 2 3" />;
  const t = (r: number) => travel / (r * s);
  return (
    <g transform={`translate(0 ${dy.toFixed(1)})`}>
      <defs>
        <clipPath id={`${cid}-sheet`}>
          <rect x={sh.left} y={sh.top - 2} width={Math.max(0.01, (sh.w + 4) * draw)} height={sh.h + 4} />
        </clipPath>
        <pattern id={`${cid}-grid`} x={sh.left} y={sh.top} width={24} height={24} patternUnits="userSpaceOnUse">
          <path d="M 24 0 H 0 V 24" fill="none" stroke={WH} strokeOpacity={0.08} strokeWidth={1} />
        </pattern>
      </defs>
      <g clipPath={`url(#${cid}-sheet)`} className="lj-bp">
        <rect x={sh.left} y={sh.top} width={sh.w} height={sh.h} fill={SHEET} stroke={WH} strokeOpacity={0.22} strokeWidth={1} />
        <rect x={sh.left} y={sh.top} width={sh.w} height={sh.h} fill={`url(#${cid}-grid)`} />
        {under}
        {/* ground line */}
        <line x1={X(-330)} y1={Y(0)} x2={X(4700)} y2={Y(0)} stroke={WH} strokeOpacity={0.5} strokeWidth={1} />
        <Body x0={x0} base={base} s={s} />
        {/* centre lines through the axles and the mast */}
        {cl(X(REAR.x), Y(-60), X(REAR.x), Y(REAR.y + REAR.r + 130), 'ra')}
        {cl(X(FRONT.x), Y(-60), X(FRONT.x), Y(FRONT.y + FRONT.r + 130), 'fa')}
        {cl(X(REAR.x - REAR.r - 110), Y(REAR.y), X(REAR.x + REAR.r + 110), Y(REAR.y), 'rh')}
        {cl(X(FRONT.x - FRONT.r - 110), Y(FRONT.y), X(FRONT.x + FRONT.r + 110), Y(FRONT.y), 'fh')}
        {cl(X(MAST_X), Y(-60), X(MAST_X), Y(FIG.h1 + 140), 'ma')}
        <Wheel cx={X(REAR.x)} cy={Y(REAR.y)} r={REAR.r * s} turn={t(REAR.r)} />
        <Wheel cx={X(FRONT.x)} cy={Y(FRONT.y)} r={FRONT.r * s} turn={t(FRONT.r)} />
        {/* dimensions */}
        <DimH x1={X(REAR.x)} x2={X(FRONT.x)} y={rows[0]} label={`Y ${FIG.y}`} ext={[Y(0) + 8, Y(0) + 8, 0]} />
        <DimH x1={X(0)} x2={X(FIG.l2)} y={rows[1]} label={`L2 ${FIG.l2}`} ext={[Y(300) + 4, Y(0) + 8, 0]} />
        <DimH x1={X(0)} x2={X(FIG.l1)} y={rows[2]} label={`L1 ${FIG.l1}`} ext={[Y(300) + 4, Y(0) + 8, 0]} />
        <DimV x={X(-200)} y1={Y(0)} y2={Y(FIG.h6)} at={Y(1900)} label={`H6 ${FIG.h6}`} ext={[[Y(FIG.h6), X(1150)]]} />
        <DimV x={X(4570)} y1={Y(0)} y2={Y(FIG.h1)} at={Y(1400)} label={`H1 ${FIG.h1}`} ext={[[Y(FIG.h1), X(3095)]]} />
        <DimH x1={X(FIG.l2)} x2={X(FIG.l2 + FIG.c)} y={Y(330)} label={`c ${FIG.c}`} ext={[Y(60) - 2, Y(60) - 2, 0]} />
        <rect x={X(FIG.l2 + 560) - textW(`Q ${FIG.q} KG`) / 2} y={Y(640) - 14} width={textW(`Q ${FIG.q} KG`)} height={18} fill={SHEET} stroke="none" />
        <text x={X(FIG.l2 + 560)} y={Y(640)} stroke="none" {...labelProps} fillOpacity={0.9}>
          {`Q ${FIG.q} KG`}
        </text>
      </g>
    </g>
  );
}

// ---- the speed lines, diagonals moving past, inside the scene half only -----------------------------------------------
export function SpeedLines({ cols, shift, opacity, cid }: { cols: Cols; shift: number; opacity: number; cid: string }) {
  const pitch = 330;
  const dxdy = 1.235;
  const left = cols.left(5);
  const top = cols.top;
  const bottom = cols.bottom;
  const right = cols.x1 + 80;
  const hh = bottom - top;
  const els: ReactNode[] = [];
  const n0 = Math.floor((shift - 900) / pitch);
  for (let n = n0; n < n0 + 11; n++) {
    const x0 = n * pitch - shift + 160;
    // two fixed weights in a fixed rhythm, no line brightens or dims with its place on the screen
    const bold = ((n % 3) + 3) % 3 === 0;
    els.push(<line key={n} x1={x0} y1={H + 20} x2={x0 + (H + 60) * dxdy} y2={-40} stroke={WH} strokeOpacity={bold ? 0.9 : 0.3} strokeWidth={bold ? 2 : 1} />);
  }
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${cid}-slm`}>
          <rect x={left} y={top} width={right - left} height={hh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cid}-slm)`}>{els}</g>
    </g>
  );
}
