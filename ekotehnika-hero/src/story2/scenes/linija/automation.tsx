// The automation floor, T and AT. A warehouse seen from above as a precise plan drawing on the dark ground, laid out in
// metres. Pallet racks stand on both sides of one aisle, a cross lane runs along the bottom with the docking station at its
// left end and a pallet pick at its right end. The C-Matic 10 and C-Matic HP are drawn at true scale, 1.2 m, against 1.2 by 0.8
// pallets, no enlargement. Their routes are system lines, 1px, dashed, one info colour (LMH blue), with small square stop
// markers and a ring at each start. No arrowheads. Red outlines are gone, the robots are white line art on the dark floor.
// Everything sits in columns 7 to 12 so the text column stays plain. The drawing is built in T, the floor lines first, then
// the racks, the stations and the routes, and the robots drive in AT.
import { memo, type ReactNode } from 'react';
import { K, WH, clamp01, io, lerp, range, smooth } from './frame';
import type { Cols } from './stage';

const INFO = '#468cc4'; // LMH blue, 72 percent tint, the one info colour of the automation floor

type V = [number, number];

// ---- the plan in metres, x to the right, y down, origin at the top left ---------------------------------------------------
const PW = 11;
const PH = 11;
const AISLE_L = 4.1;
const AISLE_R = 6.9;
const LANE_L = 4.8;
const LANE_R = 6.2;
const CROSS_T = 8.35;
const CROSS_B = 10.75;
const BAY = 2.4;
const RACK_Y0 = 0.9;
const BAYS = 3;
const DOCK: V = [1.5, 9.2];

type Route = { kind: 'c10' | 'hp'; pts: V[]; stops: V[]; off: number };
const ROUTES: Route[] = [
  { kind: 'c10', pts: [DOCK, [LANE_L, 9.2], [LANE_L, 1.5]], stops: [[LANE_L, 6.9], [LANE_L, 4.5], [LANE_L, 2.1]], off: 0 },
  { kind: 'hp', pts: [[8.9, 9.2], [LANE_R, 9.2], [LANE_R, 1.5]], stops: [[LANE_R, 6.9], [LANE_R, 4.5], [LANE_R, 2.1]], off: 0.34 },
  { kind: 'c10', pts: [[9.0, 10.1], [1.6, 10.1]], stops: [[5.3, 10.1]], off: 0.7 },
];

const len = (pts: V[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function at(pts: V[], d: number): { p: V; ang: number } {
  let rest = d;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (rest <= l || i === pts.length - 2) {
      const t = Math.min(1, rest / l);
      return { p: [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)], ang: Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) };
    }
    rest -= l;
  }
  return { p: pts[pts.length - 1], ang: 0 };
}
// the first share of a polyline, for the routes that draw on
function sub(pts: V[], f: number): V[] {
  const L = len(pts) * clamp01(f);
  const out: V[] = [pts[0]];
  let rest = L;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (rest >= l) {
      out.push(pts[i + 1]);
      rest -= l;
    } else {
      const t = rest / l;
      out.push([lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]);
      break;
    }
  }
  return out;
}
const poly = (pts: V[]) => pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');

const hatch = (x: number, y: number, w: number, h: number, step: number): ReactNode[] => {
  const out: ReactNode[] = [];
  for (let u = -h + step / 2; u < w; u += step) {
    let x1 = u;
    let y1 = h;
    let x2 = u + h;
    let y2 = 0;
    if (x1 < 0) {
      y1 = h + x1;
      x1 = 0;
    }
    if (x2 > w) {
      y2 = x2 - w;
      x2 = w;
    }
    out.push(<line key={u} x1={x + x1} y1={y + y1} x2={x + x2} y2={y + y2} />);
  }
  return out;
};

const line = (o = 1, w = 1, fill = 'none') => ({ fill, stroke: WH, strokeOpacity: o, strokeWidth: w });

// ---- the static plan, racks, floor markings and the two stations ------------------------------------------------------------
const Pallet = ({ x, y, w = 1.2, h = 0.8, full }: { x: number; y: number; w?: number; h?: number; full: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} {...line(0.5)} />
    {[0.25, 0.5, 0.75].map((f) => (
      <line key={f} x1={x + w * f} y1={y} x2={x + w * f} y2={y + h} {...line(0.3)} />
    ))}
    {full && (
      <g>
        <rect x={x + 0.08} y={y + 0.07} width={w - 0.16} height={h - 0.14} {...line(0.75)} />
        <line x1={x + w / 2} y1={y + 0.07} x2={x + w / 2} y2={y + h - 0.07} {...line(0.4)} />
        <line x1={x + 0.08} y1={y + h / 2} x2={x + w - 0.08} y2={y + h / 2} {...line(0.4)} />
      </g>
    )}
  </g>
);

// A rack row, one side of one aisle. x0 to x1 across, bays run down the plan.
function RackRow({ x0, x1, key0 }: { x0: number; x1: number; key0: number }) {
  const els: ReactNode[] = [];
  const dep = x1 - x0;
  for (let b = 0; b < BAYS; b++) {
    const y = RACK_Y0 + b * BAY;
    els.push(<rect key={`f${b}`} x={x0} y={y} width={dep} height={BAY} {...line(0.6)} />);
    for (let p = 0; p < 2; p++) {
      const full = (key0 + b * 2 + p) % 5 !== 2;
      els.push(<Pallet key={`p${b}${p}`} x={x0 + (dep - 0.8) / 2} y={y + 0.1 + p * 1.1} w={0.8} h={1.2} full={full} />);
    }
  }
  // the uprights, a small solid square at every bay line
  for (let b = 0; b <= BAYS; b++) {
    const y = RACK_Y0 + b * BAY;
    els.push(<rect key={`u${b}a`} x={x0 - 0.05} y={y - 0.05} width={0.1} height={0.1} fill={WH} fillOpacity={0.85} stroke="none" />);
    els.push(<rect key={`u${b}b`} x={x1 - 0.05} y={y - 0.05} width={0.1} height={0.1} fill={WH} fillOpacity={0.85} stroke="none" />);
  }
  return <g>{els}</g>;
}

const Racks = memo(function Racks() {
  return (
    <g>
      <RackRow x0={1.9} x1={3.0} key0={0} />
      <RackRow x0={3.0} x1={AISLE_L} key0={1} />
      <RackRow x0={AISLE_R} x1={8.0} key0={2} />
      <RackRow x0={8.0} x1={9.1} key0={3} />
    </g>
  );
});

const Floor = memo(function Floor() {
  const ys = RACK_Y0 + BAYS * BAY;
  return (
    <g>
      {/* aisle and cross lane edges, solid at 30 percent */}
      <g {...line(0.3)}>
        <line x1={AISLE_L} y1={0.4} x2={AISLE_L} y2={CROSS_T} />
        <line x1={AISLE_R} y1={0.4} x2={AISLE_R} y2={CROSS_T} />
        <line x1={0} y1={CROSS_T} x2={PW} y2={CROSS_T} />
        <line x1={0} y1={CROSS_B} x2={PW} y2={CROSS_B} />
      </g>
      {/* walkways at the outer edges, dashed */}
      <g {...line(0.3)} strokeDasharray="6 5">
        <line x1={0.9} y1={0.4} x2={0.9} y2={CROSS_T} />
        <line x1={10.1} y1={0.4} x2={10.1} y2={CROSS_T} />
      </g>
      {/* the aisle's own centre line, long dash and dot */}
      <line x1={(AISLE_L + AISLE_R) / 2} y1={0.4} x2={(AISLE_L + AISLE_R) / 2} y2={CROSS_T} {...line(0.22)} strokeDasharray="14 3 2 3" />
      {/* end of the racks, a wall line across the top */}
      <line x1={1.9} y1={0.4} x2={9.1} y2={0.4} {...line(0.45)} />
      <line x1={1.9} y1={ys + 0.3} x2={9.1} y2={ys + 0.3} {...line(0.2)} strokeDasharray="6 5" />
    </g>
  );
});

// The docking station, a hatched bay with the charging post at the wall.
const Dock = memo(function Dock() {
  return (
    <g>
      <rect x={0.25} y={8.7} width={2.0} height={1.6} {...line(0.5)} />
      <g {...line(0.28)}>{hatch(0.25, 8.7, 2.0, 1.6, 0.2)}</g>
      <rect x={0.25} y={8.85} width={0.34} height={0.7} {...line(0.9, 1.5, K)} />
      <line x1={0.59} y1={9.05} x2={0.74} y2={9.05} {...line(0.9)} />
      <line x1={0.59} y1={9.35} x2={0.74} y2={9.35} {...line(0.9)} />
    </g>
  );
});

// The pallet pick, a dashed zone with a loaded pallet waiting in it.
const Pick = memo(function Pick() {
  return (
    <g>
      <rect x={8.8} y={8.7} width={2.0} height={1.6} {...line(0.5)} strokeDasharray="6 4" />
      <rect x={9.2} y={8.8} width={1.2} height={0.8} {...line(0.9, 1.5, K)} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={9.2 + 1.2 * f} y1={8.8} x2={9.2 + 1.2 * f} y2={9.6} {...line(0.35)} />
      ))}
      <rect x={9.28} y={8.87} width={1.04} height={0.66} {...line(0.8)} />
      <line x1={9.28} y1={8.87} x2={10.32} y2={9.53} {...line(0.4)} />
      <line x1={10.32} y1={8.87} x2={9.28} y2={9.53} {...line(0.4)} />
    </g>
  );
});

// ---- a robot, plan view, nose along +x, 1.2 m by 0.78 m ---------------------------------------------------------------------
const Robot = memo(function Robot({ kind }: { kind: 'c10' | 'hp' }) {
  const hp = kind === 'hp';
  return (
    <g>
      {/* drive wheels, outside the body */}
      <rect x={-0.16} y={-0.47} width={0.32} height={0.09} {...line(0.8, 1, K)} />
      <rect x={-0.16} y={0.38} width={0.32} height={0.09} {...line(0.8, 1, K)} />
      <rect x={-0.6} y={-0.39} width={1.2} height={0.78} {...line(0.95, 1.5, K)} />
      <rect x={-0.53} y={-0.32} width={1.06} height={0.64} {...line(0.5)} />
      {/* the front sensor bar */}
      <line x1={0.5} y1={-0.26} x2={0.5} y2={0.26} {...line(0.9, 1.5)} />
      <circle cx={0.55} cy={-0.33} r={0.035} fill={WH} fillOpacity={0.9} stroke="none" />
      <circle cx={0.55} cy={0.33} r={0.035} fill={WH} fillOpacity={0.9} stroke="none" />
      {hp ? (
        <g>
          <rect x={-0.5} y={-0.35} width={0.98} height={0.7} {...line(0.75)} />
          {[-0.17, 0.17].map((y) => (
            <line key={y} x1={-0.5} y1={y} x2={0.48} y2={y} {...line(0.35)} />
          ))}
          <rect x={-0.4} y={-0.27} width={0.78} height={0.54} {...line(0.85)} />
        </g>
      ) : (
        <g>
          <rect x={-0.34} y={-0.25} width={0.62} height={0.5} {...line(0.9)} />
          <line x1={-0.34} y1={0} x2={0.28} y2={0} {...line(0.5)} />
          <line x1={-0.03} y1={-0.25} x2={-0.03} y2={0.25} {...line(0.5)} />
        </g>
      )}
    </g>
  );
});

function cycle(t: number) {
  const f = ((t % 1) + 1) % 1;
  if (f < 0.4) return { u: io(f / 0.4), back: 0 };
  if (f < 0.5) return { u: 1, back: io((f - 0.4) / 0.1) };
  if (f < 0.9) return { u: 1 - io((f - 0.5) / 0.4), back: 1 };
  return { u: 0, back: 1 - io((f - 0.9) / 0.1) };
}

// The fitting of the plan to columns 7 to 12 between the grid rules.
export function planOf(c: Cols) {
  const left = c.left(7);
  const right = c.right(12);
  const top = c.top + 16;
  const bottom = c.bottom - 12;
  const m = Math.min((right - left - 24) / PW, (bottom - top) / PH);
  return { m, ox: left + (right - left - PW * m) / 2, oy: top + (bottom - top - PH * m) / 2 };
}

// build runs 0 to 1 through T, t is story pixels since AT began, appear runs 0 to 1 as the robots drive in. Everything is drawn on
// by a hard edged wipe in plan metres, the floor lines from the top down, the racks up from the cross lane, the stations in from
// their walls, the routes along their length. Nothing dissolves.
export function Automation({ cols, cid, build, t, appear }: { cols: Cols; cid: string; build: number; t: number; appear: number }) {
  const { m, ox, oy } = planOf(cols);
  const fl = smooth(range(build, 0, 0.35));
  const rk = smooth(range(build, 0.25, 0.7));
  const st = smooth(range(build, 0.5, 0.82));
  const rp = io(range(build, 0.4, 1));
  const marks = build >= 0.82;
  const pad = 0.5;
  const clip = (id: string, x: number, y: number, w: number, h: number) => (
    <clipPath id={`${cid}-${id}`}>
      <rect x={x} y={y} width={Math.max(0.001, w)} height={Math.max(0.001, h)} />
    </clipPath>
  );
  return (
    <g transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${m.toFixed(4)})`} className="lj-bp">
      <defs>
        {clip('fl', -pad, -pad, PW + 2 * pad, (PH + 2 * pad) * fl)}
        {clip('rk', -pad, CROSS_T + pad - (CROSS_T + 2 * pad) * rk, PW + 2 * pad, (CROSS_T + 2 * pad) * rk)}
        {clip('dk', -pad, -pad, (2.6 + pad) * st, PH + 2 * pad)}
        {clip('pk', PW + pad - (2.6 + pad) * st, -pad, (2.6 + pad) * st, PH + 2 * pad)}
      </defs>
      <g clipPath={`url(#${cid}-fl)`}>
        <Floor />
      </g>
      <g clipPath={`url(#${cid}-rk)`}>
        <Racks />
      </g>
      <g clipPath={`url(#${cid}-dk)`}>
        <Dock />
      </g>
      <g clipPath={`url(#${cid}-pk)`}>
        <Pick />
      </g>
      {ROUTES.map((r, i) => (
        <g key={i}>
          <polyline points={poly(sub(r.pts, rp))} fill="none" stroke={INFO} strokeWidth={1} strokeDasharray="7 4" />
          {marks && (
            <g>
              {r.stops.map(([x, y]) => (
                <g key={`${x}${y}`} fill="none" stroke={INFO} strokeWidth={1}>
                  <rect x={x - 0.21} y={y - 0.21} width={0.42} height={0.42} />
                  <line x1={x - 0.1} y1={y} x2={x + 0.1} y2={y} />
                  <line x1={x} y1={y - 0.1} x2={x} y2={y + 0.1} />
                </g>
              ))}
              <circle cx={r.pts[0][0]} cy={r.pts[0][1]} r={0.2} fill="none" stroke={INFO} strokeWidth={1} />
            </g>
          )}
        </g>
      ))}
      {ROUTES.map((r, i) => {
        const c = cycle(t / 700 + r.off);
        const L = len(r.pts);
        const { p, ang } = at(r.pts, c.u * L);
        const turn = Math.PI * c.back;
        const s = smooth(range(appear, i * 0.12, i * 0.12 + 0.3));
        if (s <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${p[0].toFixed(3)} ${p[1].toFixed(3)}) rotate(${(((ang + turn) * 180) / Math.PI).toFixed(2)}) scale(${s.toFixed(3)})`}>
            <Robot kind={r.kind} />
          </g>
        );
      })}
    </g>
  );
}
