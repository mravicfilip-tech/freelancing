// Scene pieces for the board frames. Everything is drawn in "scene units", the storyboard's
// 360 by 225 keyframe space, and the Scene wrapper scales it up to the 1440 by 900 frame. Ground is
// at y 186. Only ink, the greys and white, red lives on truck shells in vehicles.tsx.
import type { ReactNode } from 'react';
import { C } from '../tokens';
import { LoadSide, RackSide } from '../variants/v2/art';
import { BoardDefs } from './vehicles';

export const GROUND = 186;
export const SCALE = 4.5;
export const SCENE_L = 488; // left edge of the scene area in frame pixels
export const SCENE_CX = 952;
// Scene unit to frame pixel, x 251 and y 186 are the scene centre line and the ground.
export const SU = `translate(${SCENE_CX - 251 * SCALE} ${744 - GROUND * SCALE}) scale(${SCALE})`;

const K = C.ink;
const G = C.textGrey;
const G2 = C.tonedTextGrey;
const LG = C.lightGrey;
const SG = C.shadeGrey;
const W = C.white;
export const FONT = 'Geist, system-ui, sans-serif';

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// The frame's scene layer. Backdrop, a floor, then the beat's scene clipped to the scene area.
export function Scene({ dim = 0, children, overlay }: { dim?: number; children: ReactNode; overlay?: ReactNode }) {
  return (
    <svg className="bd-scene" width={1440} height={900} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
      <BoardDefs />
      <clipPath id="bd-clip">
        <rect x={SCENE_L} y={0} width={1440 - SCENE_L} height={900} />
      </clipPath>
      <rect width={1440} height={900} fill={C.hoverLightGrey} />
      <g clipPath="url(#bd-clip)">
        <rect x={SCENE_L} y={744} width={1440 - SCENE_L} height={156} fill={SG} />
        <rect x={SCENE_L} y={743} width={1440 - SCENE_L} height={1.4} fill={G2} opacity={0.35} />
        <g transform={SU}>{children}</g>
        
        {overlay}
      </g>
      {dim > 0 && <rect width={1440} height={900} fill={K} opacity={dim} />}
    </svg>
  );
}

// A hall outline, a gable roof with a second inner line, purlins and a few columns. top is the ridge.
export function Hall({ top = 64, columns = true }: { top?: number; columns?: boolean }) {
  const stroke = { stroke: G2, fill: 'none', strokeLinejoin: 'round' as const };
  const L = 154;
  const R = 350;
  const wallTop = top + 26;
  const purlins = [0.25, 0.5, 0.75].map((f) => {
    const y1 = lerp(wallTop, top, f);
    const xa = lerp(L, 252, f);
    const xb = lerp(R, 252, f);
    return <line key={f} x1={xa} y1={y1} x2={xb} y2={y1} {...stroke} strokeWidth={0.18} opacity={0.35} />;
  });
  return (
    <g>
      <path d={`M ${L} ${GROUND} V ${wallTop} L 252 ${top} L ${R} ${wallTop} V ${GROUND}`} {...stroke} strokeWidth={0.4} opacity={0.55} />
      <path d={`M ${L + 5} ${GROUND} V ${wallTop + 2.4} L 252 ${top + 5} L ${R - 5} ${wallTop + 2.4} V ${GROUND}`} {...stroke} strokeWidth={0.2} opacity={0.35} />
      {purlins}
      {columns &&
        [L + 5, 203, 252, 301, R - 5].map((cx) => {
          const roofY = cx <= 252 ? lerp(wallTop, top, (cx - L) / 98) : lerp(top, wallTop, (cx - 252) / 98);
          return <line key={cx} x1={cx} y1={GROUND} x2={cx} y2={roofY + 2.4} {...stroke} strokeWidth={0.16} opacity={0.22} />;
        })}
    </g>
  );
}

// A rack with loaded pallets on every level. x left edge, h height, w width in scene units.
const KINDS = ['cartons', 'wrap', 'crates', 'tall'] as const;
export function Rack({ x, h, w = 22, seed = 0, empty = false }: { x: number; h: number; w?: number; seed?: number; empty?: boolean }) {
  const sc = w / 110;
  const hc = h / sc;
  const levels: number[] = [];
  for (let lv = 150; lv < hc - 40; lv += 150) levels.push(lv);
  const slots = [0, ...levels];
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${sc})`}>
      <RackSide height={hc} levels={levels}>
        {!empty &&
          slots.map((lv, i) => {
            if ((seed * 3 + i * 5) % 7 === 0 || (lv > 0 && lv + 100 > hc)) return null;
            const kind = KINDS[(seed + i * 2) % 4];
            return (
              <g key={lv} transform="translate(5.5 0) scale(0.9)">
                <LoadSide x={0} y={-lv} kind={kind} />
              </g>
            );
          })}
      </RackSide>
    </g>
  );
}

// A loaded pallet on the floor or on a stack. x left, baseY the pallet bottom in scene units.
export function Pallet({ x, y = GROUND, s = 0.14, kind = 'cartons' }: { x: number; y?: number; s?: number; kind?: 'cartons' | 'wrap' | 'crates' | 'tall' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <LoadSide x={0} y={0} kind={kind} />
    </g>
  );
}

// A pile that stacks in three rows, five then four then three, loaded pallets all of them.
export function Pile({ n, x0 = 262, s = 0.14, base = GROUND }: { n: number; x0?: number; s?: number; base?: number }) {
  const pw = 120 * s;
  const rows = [5, 4, 3];
  const out: ReactNode[] = [];
  let c = 0;
  for (let r = 0; r < 3 && c < n; r++) {
    for (let i = 0; i < rows[r] && c < n; i++, c++) {
      out.push(<Pallet key={`${r}-${i}`} x={x0 + r * (pw / 2) + i * (pw + 0.2)} y={base - r * 80 * s} s={s} kind={(c % 3 === 1 ? 'wrap' : 'cartons')} />);
    }
  }
  return <g>{out}</g>;
}

// Motion streaks.
export function Streaks({ x, y, op = 1 }: { x: number; y: number; op?: number }) {
  return (
    <g opacity={op}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${x + i * 3} ${y + i * 8} h ${30 - i * 5}`} stroke={C.tonedTextGrey} opacity={0.5} strokeWidth={1.1} strokeLinecap="round" />
      ))}
    </g>
  );
}

// Seven numbered renewal stations as gantries over a line. done is how many have lit up.
export function Stations({ done }: { done: number }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const cx = 170 + i * 27.5;
    const on = i < done;
    out.push(
      <g key={i}>
        {/* light cone from the gantry head down to the line */}
        <path d={`M ${cx - 3} 124 L ${cx - 11} ${GROUND - 4} L ${cx + 11} ${GROUND - 4} L ${cx + 3} 124 Z`} fill={on ? SG : LG} opacity={on ? 0.85 : 0.55} />
        {/* posts, beam and the hanging tool head */}
        <rect x={cx - 9.5} y={112} width={1.5} height={GROUND - 4 - 112} fill={G2} />
        <rect x={cx + 8} y={112} width={1.5} height={GROUND - 4 - 112} fill={G2} />
        <rect x={cx - 11} y={GROUND - 5.4} width={4.6} height={1.6} fill={G} />
        <rect x={cx + 6.4} y={GROUND - 5.4} width={4.6} height={1.6} fill={G} />
        <rect x={cx - 11.5} y={110} width={23} height={3.4} rx={1.2} fill={G} />
        <rect x={cx - 11.5} y={110} width={23} height={0.8} rx={0.4} fill={G2} />
        <path d={`M ${cx - 3.4} 113.4 H ${cx + 3.4} L ${cx + 2} 124 H ${cx - 2} Z`} fill={K} />
        <circle cx={cx} cy={118.5} r={0.9} fill={on ? W : G2} />
        {/* the numbered badge */}
        <circle cx={cx} cy={99} r={6.6} fill={on ? K : W} stroke={on ? K : C.tonedTextGrey} strokeWidth={0.4} />
        <text x={cx} y={101.2} textAnchor="middle" fontFamily={FONT} fontSize={6.2} fontWeight={500} fill={on ? W : G}>
          {i + 1}
        </text>
        <line x1={cx} y1={105.6} x2={cx} y2={110} stroke={on ? K : G2} strokeWidth={0.5} />
      </g>,
    );
  }
  return (
    <g>
      {out}
      {/* the line itself, a belt with chevrons */}
      <rect x={150} y={GROUND - 4} width={212} height={4} fill={G2} />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={i} d={`M ${153 + i * 7} ${GROUND - 3.2} l 1.4 1.2 l -1.4 1.2`} stroke={W} strokeWidth={0.4} fill="none" opacity={0.7} />
      ))}
    </g>
  );
}

// The ink warranty seal, scalloped, with the ribbon tails. cx cy is the centre, size the diameter.
export function Seal({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const r = size / 2;
  const pts: string[] = [];
  const n = 24;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.9 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return (
    <g>
      <path d={`M ${cx - r * 0.5} ${cy + r * 0.7} L ${cx - r * 0.72} ${cy + r * 1.5} L ${cx - r * 0.4} ${cy + r * 1.28} L ${cx - r * 0.1} ${cy + r * 1.55} L ${cx - r * 0.1} ${cy + r * 0.8} Z`} fill={G} />
      <path d={`M ${cx + r * 0.5} ${cy + r * 0.7} L ${cx + r * 0.72} ${cy + r * 1.5} L ${cx + r * 0.4} ${cy + r * 1.28} L ${cx + r * 0.1} ${cy + r * 1.55} L ${cx + r * 0.1} ${cy + r * 0.8} Z`} fill={K} />
      <path d={`M ${pts.join(' L ')} Z`} fill={K} />
      <circle cx={cx} cy={cy} r={r * 0.74} fill="none" stroke={W} strokeWidth={size * 0.035} strokeDasharray={`${size * 0.06} ${size * 0.075}`} />
      <path
        d={`M ${cx - r * 0.34} ${cy + r * 0.02} L ${cx - r * 0.08} ${cy + r * 0.3} L ${cx + r * 0.38} ${cy - r * 0.26}`}
        fill="none"
        stroke={W}
        strokeWidth={size * 0.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// The ink warning sign with pulse rings, cx cy the sign centre, size the height.
export function Warn({ cx, cy, size, pulse = 0 }: { cx: number; cy: number; size: number; pulse?: number }) {
  const h = size;
  const w = size * 1.12;
  return (
    <g>
      {pulse > 0 &&
        [1, 2].map((i) => (
          <circle key={i} cx={cx} cy={cy + h * 0.08} r={h * (0.78 + i * 0.3)} fill="none" stroke={K} strokeWidth={0.45} opacity={0.34 / i} />
        ))}
      <path d={`M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 2} L ${cx - w / 2} ${cy + h / 2} Z`} fill={K} stroke={K} strokeWidth={h * 0.1} strokeLinejoin="round" />
      <rect x={cx - h * 0.065} y={cy - h * 0.12} width={h * 0.13} height={h * 0.34} rx={h * 0.05} fill={W} />
      <circle cx={cx} cy={cy + h * 0.32} r={h * 0.075} fill={W} />
    </g>
  );
}

// A scissor lift platform. lift is the deck height above the floor in scene units.
export function LiftPlatform({ x, w, lift }: { x: number; w: number; lift: number }) {
  const base = GROUND - 3.4;
  const deckY = GROUND - 3.4 - lift - 3;
  const mid = (base + deckY + 3) / 2;
  const half = w * 0.28;
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x + 4} y={GROUND - 3.4} width={w - 8} height={3.4} rx={0.8} fill={K} />
      {lift > 1 && (
        <g stroke={G} strokeWidth={1.1} strokeLinecap="round">
          <line x1={cx - half} y1={base} x2={cx + half} y2={deckY + 3} />
          <line x1={cx + half} y1={base} x2={cx - half} y2={deckY + 3} />
          <line x1={cx - half} y1={mid} x2={cx + half} y2={mid} stroke={K} strokeWidth={0.8} />
          <circle cx={cx} cy={mid} r={0.9} fill={W} stroke={K} strokeWidth={0.4} />
        </g>
      )}
      {lift > 1 && <rect x={cx + half + 3} y={mid} width={2.2} height={base - mid} fill={G2} />}
      <rect x={x} y={deckY} width={w} height={3} rx={0.9} fill={K} />
      <rect x={x} y={deckY} width={w} height={0.8} rx={0.4} fill={G} />
      {Array.from({ length: Math.floor(w / 6) }, (_, i) => (
        <line key={i} x1={x + 4 + i * 6} y1={deckY + 0.5} x2={x + 6 + i * 6} y2={deckY + 2.5} stroke={G2} strokeWidth={0.35} />
      ))}
    </g>
  );
}

// A check ring for the pit stop. done fills it ink with a white tick.
export function CheckRing({ cx, cy, done, r = 8 }: { cx: number; cy: number; done: boolean; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={done ? K : W} stroke={done ? K : C.tonedTextGrey} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={r + 1.8} fill="none" stroke={done ? K : SG} strokeWidth={0.35} opacity={done ? 0.5 : 1} />
      {done ? (
        <path d={`M ${cx - r * 0.38} ${cy + r * 0.02} l ${r * 0.28} ${r * 0.28} l ${r * 0.5} ${-r * 0.56}`} fill="none" stroke={W} strokeWidth={r * 0.2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <circle cx={cx} cy={cy} r={r * 0.2} fill={SG} />
      )}
    </g>
  );
}

// A tag chip in the scene, an icon slot at the left and text. x y is the top left in scene units.
export function Tag({ x, y, label, icon }: { x: number; y: number; label: string; icon?: ReactNode }) {
  const w = label.length * 2.2 + 11;
  return (
    <g>
      <rect x={x} y={y} width={w} height={7.4} rx={3.7} fill={W} stroke={C.tonedTextGrey} strokeWidth={0.25} />
      {icon && (
        <g transform={`translate(${x + 1.6} ${y + 1.2}) scale(${5 / 44})`}>{icon}</g>
      )}
      <text x={x + 8} y={y + 5} fontFamily={FONT} fontSize={3.5} fontWeight={500} fill={K}>
        {label}
      </text>
    </g>
  );
}
