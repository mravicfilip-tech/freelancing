// Decorative art for pathway 3, all inline SVG and CSS. Everything here is aria-hidden.
import type { ReactNode } from 'react';

/* ---------- small icons ---------- */

export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="p3-arrow" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      <path d="M3.5 3.5 L12 12" />
      <path d="M5 12.25 H12.25 V5" />
    </svg>
  );
}

export function TagIcon() {
  return (
    <svg className="p3-tagicon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <rect x="0.5" y="0.5" width="13" height="13" />
      <path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 1 V11 M1 6 H11" />
    </svg>
  );
}

export function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 1.5 L8.5 6 L4 10.5" />
    </svg>
  );
}

export function ChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2.5 5.5 L8 11 L13.5 5.5" />
    </svg>
  );
}

export function ChevronUp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2.5 10.5 L8 5 L13.5 10.5" />
    </svg>
  );
}

export function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M10.5 2.5 L5 8 L10.5 13.5" />
    </svg>
  );
}

export function ChevronRightLg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5.5 2.5 L11 8 L5.5 13.5" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 8 H20 M4 16 H14" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3.5 H9 L10.5 8 L8.5 9.5 C9.6 12 11.5 13.9 14 15 L15.5 13 L20 14.5 V18.5 C20 19.6 19.1 20.5 18 20.5 C10.3 20.5 3.5 13.7 3.5 6 C3.5 4.6 4.1 3.5 5 3.5 Z" />
    </svg>
  );
}

/* ---------- registration marks ---------- */

// Four white L marks that frame a full bleed photo.
export function Corners() {
  return (
    <span className="p3-corners" aria-hidden="true">
      <i /> <i /> <i /> <i />
    </span>
  );
}

// A plus shaped crosshair at a corner, used on notched frames and grids.
export function Crosshairs({ long = false }: { long?: boolean }) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
        <i key={k} className={`p3-xh p3-xh--${k}${long ? ' p3-xh--long' : ''}`} aria-hidden="true" />
      ))}
    </>
  );
}

/* ---------- isometric wireframe toolkit ---------- */

type Pt = [number, number];
type Ln = { d: string; o: number; dash?: string };
type Iso = ReturnType<typeof makeIso>;

const f = (n: number) => n.toFixed(1);

function makeIso(S: number, ox: number, oy: number) {
  // Oblique axonometric, x runs right and down a little, y comes toward the viewer to the left.
  const ex: Pt = [0.96, 0.18];
  const ey: Pt = [-0.42, 0.45];
  const p = (x: number, y: number, z: number): Pt => [ox + (x * ex[0] + y * ey[0]) * S, oy + (x * ex[1] + y * ey[1]) * S - z * S];
  const path = (pts: Pt[], close = false) => 'M' + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join(' L') + (close ? ' Z' : '');
  return { S, ex, ey, p, path };
}

// The edges of a box that face the viewer. With top false only the front and end faces are drawn,
// which keeps stacked layers from piling hidden back edges on top of each other.
function box(iso: Iso, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, o: number, end = true, top = true): Ln[] {
  const { p, path } = iso;
  const out: Ln[] = [];
  if (top) out.push({ d: path([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], true), o });
  else out.push({ d: path([p(x0, y1, z1), p(x1, y1, z1)]), o });
  out.push({ d: path([p(x0, y1, z1), p(x0, y1, z0), p(x1, y1, z0)]), o });
  out.push({ d: path([p(x1, y1, z1), p(x1, y1, z0)]), o });
  if (end) {
    out.push({ d: path([p(x1, y1, z0), p(x1, y0, z0), p(x1, y0, z1)]), o });
    if (!top) out.push({ d: path([p(x1, y1, z1), p(x1, y0, z1)]), o });
  }
  return out;
}

function ellipseX(iso: Iso, x: number, yc: number, zc: number, r: number, o: number): Ln {
  const { p, S, ey } = iso;
  const c = p(x, yc, zc);
  const a: Pt = [ey[0] * r * S, ey[1] * r * S];
  const b: Pt = [0, -r * S];
  const pts: Pt[] = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    pts.push([c[0] + Math.cos(t) * a[0] + Math.sin(t) * b[0], c[1] + Math.cos(t) * a[1] + Math.sin(t) * b[1]]);
  }
  return { d: iso.path(pts, true), o };
}

// A duct is a cylinder along x. The two outline lines sit where the tangent runs along x.
function duct(iso: Iso, x0: number, x1: number, yc: number, zc: number, r: number, o: number, joints = 3): Ln[] {
  const { p, S, ex, ey } = iso;
  const a: Pt = [ey[0] * r * S, ey[1] * r * S];
  const b: Pt = [0, -r * S];
  const cross = (u: Pt, v: Pt) => u[0] * v[1] - u[1] * v[0];
  const exv: Pt = [ex[0], ex[1]];
  const t0 = Math.atan2(cross(b, exv), cross(a, exv));
  const edge = (x: number, t: number): Pt => {
    const c = p(x, yc, zc);
    return [c[0] + Math.cos(t) * a[0] + Math.sin(t) * b[0], c[1] + Math.cos(t) * a[1] + Math.sin(t) * b[1]];
  };
  const out: Ln[] = [];
  out.push(ellipseX(iso, x1, yc, zc, r, o));
  out.push(ellipseX(iso, x0, yc, zc, r, o * 0.4));
  for (const t of [t0, t0 + Math.PI]) out.push({ d: iso.path([edge(x0, t), edge(x1, t)]), o });
  for (let k = 1; k <= joints; k++) out.push(ellipseX(iso, x0 + ((x1 - x0) * k) / (joints + 1), yc, zc, r, o * 0.28));
  return out;
}

function circleZ(iso: Iso, cx: number, cy: number, z: number, r: number, o: number): Ln {
  const pts: Pt[] = [];
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    pts.push(iso.p(cx + Math.cos(t) * r, cy + Math.sin(t) * r, z));
  }
  return { d: iso.path(pts, true), o };
}

type TrenchOpts = { L?: number; chamber?: boolean; ducts?: boolean; tape?: boolean; slab?: boolean };

// The trench section, the slab cut open with its layers, the sand bed, four ducts, warning tape and a chamber.
// Units are decimetre-ish, not to scale. y runs 0 to 6 across, the trench sits at y 2 to 4.
function trenchLines(iso: Iso, o: TrenchOpts = {}): Ln[] {
  const { L = 16, chamber = true, ducts = true, tape = true, slab = true } = o;
  const { p, path } = iso;
  const out: Ln[] = [];
  const cx = chamber ? 2.4 : 0;
  if (slab) {
    const layers: [number, number, number][] = [
      [-0.5, 0, 0.9],
      [-1.1, -0.5, 0.6],
      [-3.4, -1.1, 0.42],
    ];
    const pieces: { x0: number; x1: number; y0: number; y1: number; end: boolean }[] = [
      { x0: cx, x1: L, y0: 0, y1: 2, end: true },
      { x0: cx, x1: L, y0: 4, y1: 6, end: true },
    ];
    if (chamber) {
      pieces.push({ x0: 0, x1: cx, y0: 0, y1: 1.4, end: false }, { x0: 0, x1: cx, y0: 4.6, y1: 6, end: false });
    }
    for (const pc of pieces) layers.forEach(([z0, z1, op], li) => out.push(...box(iso, pc.x0, pc.y0, z0, pc.x1, pc.y1, z1, op, pc.end, li === 0)));
    // earth under the trench
    out.push(...box(iso, cx, 2, -3.4, L, 4, -2.8, 0.42, true, false));
    // stratification on the front face
    for (const z of [-1.9, -2.6]) out.push({ d: path([p(0, 6, z), p(L, 6, z)]), o: 0.22, dash: '2 7' });
    // trench floor lines
    out.push({ d: path([p(cx, 2, -2.8), p(L, 2, -2.8)]), o: 0.7 });
    out.push({ d: path([p(cx, 4, -2.8), p(L, 4, -2.8)]), o: 0.5 });
  }
  // sand bed
  out.push(...box(iso, cx, 2, -2.8, L, 4, -2.4, 0.7, true));
  for (let x = cx + 0.7; x < L; x += 0.8) out.push({ d: path([p(x, 2.1, -2.4), p(x + 0.25, 3.9, -2.4)]), o: 0.18, dash: '1 4' });
  if (ducts) {
    for (const yc of [2.65, 3.35]) for (const zc of [-2.14, -1.6]) out.push(...duct(iso, chamber ? 1.0 : 0.4, L, yc, zc, 0.26, 0.85));
  }
  if (tape) {
    const x0 = cx + 0.3;
    out.push({ d: path([p(x0, 2.15, -0.9), p(L, 2.15, -0.9), p(L, 3.85, -0.9), p(x0, 3.85, -0.9)], true), o: 0.75 });
    for (let x = x0; x < L - 0.4; x += 0.6) out.push({ d: path([p(x, 2.15, -0.9), p(x + 0.4, 3.85, -0.9)]), o: 0.45 });
  }
  if (chamber) {
    out.push(...box(iso, 0, 1.4, -3.0, cx, 4.6, 0.25, 0.95, true));
    out.push(circleZ(iso, cx / 2, 3, 0.25, 0.8, 0.8));
    out.push(circleZ(iso, cx / 2, 3, 0.25, 0.52, 0.45));
  }
  return out;
}

function Lines({ lines }: { lines: Ln[] }) {
  return (
    <g fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round">
      {lines.map((l, i) => (
        <path key={i} d={l.d} opacity={l.o} strokeDasharray={l.dash} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

/* ---------- the big trench wireframe, with leader lines for the four tags ---------- */

export const TRENCH_VIEW = { w: 1000, h: 640 };
const bigIso = makeIso(44, 217, 131);

// Anchors for the four tags. tag is the position in viewBox units of the line start.
export function trenchAnchors() {
  const { p } = bigIso;
  return {
    surface: p(6, 1, 0),
    tape: p(9.5, 3, -0.9),
    ducts: p(16, 3.35, -2.14),
    sand: p(10, 4, -2.8),
  };
}

export function TrenchWireframe({ leaders }: { leaders: { from: Pt; to: Pt }[] }) {
  const lines = trenchLines(bigIso, {});
  return (
    <svg className="p3-trench" viewBox={`0 0 ${TRENCH_VIEW.w} ${TRENCH_VIEW.h}`} aria-hidden="true" focusable="false">
      <Lines lines={lines} />
      <g stroke="#fff" strokeWidth="1" opacity="0.7" fill="none">
        {leaders.map((l, i) => (
          <g key={i}>
            <path d={`M${f(l.from[0])} ${f(l.from[1])} L${f(l.to[0])} ${f(l.to[1])}`} vectorEffect="non-scaling-stroke" />
            <circle cx={l.to[0]} cy={l.to[1]} r="3" fill="#0e0f0f" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---------- small wireframes for the four services ---------- */

const MINI = { w: 440, h: 150 };

function MiniSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="p3-mini" viewBox={`0 0 ${MINI.w} ${MINI.h}`} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

export function MiniTrench() {
  const iso = makeIso(16, 163, 12);
  const lines = trenchLines(iso, { L: 10, chamber: false, ducts: false, tape: false });
  const { p, path } = iso;
  // depth dimension at the open end
  const dim: Ln[] = [
    { d: path([p(10.9, 3, 0), p(10.9, 3, -2.8)]), o: 0.9 },
    { d: path([p(10.6, 3, 0), p(11.2, 3, 0)]), o: 0.9 },
    { d: path([p(10.6, 3, -2.8), p(11.2, 3, -2.8)]), o: 0.9 },
  ];
  return (
    <MiniSvg>
      <Lines lines={lines} />
      <Lines lines={dim} />
    </MiniSvg>
  );
}

export function MiniDucts() {
  const iso = makeIso(17, 146, 16);
  const lines = trenchLines(iso, { L: 11, chamber: true, slab: false, ducts: true, tape: true });
  return (
    <MiniSvg>
      <Lines lines={lines} />
    </MiniSvg>
  );
}

export function MiniHouse() {
  const iso = makeIso(11.5, 174, 76);
  const { p, path } = iso;
  const lines: Ln[] = [];
  // plot and the street trench
  lines.push({ d: path([p(0, -3, 0), p(11, -3, 0), p(11, 6, 0), p(0, 6, 0)], true), o: 0.45 });
  lines.push({ d: path([p(0, 2, 0), p(11, 2, 0)]), o: 0.9 });
  lines.push({ d: path([p(0, 4, 0), p(11, 4, 0)]), o: 0.9 });
  lines.push({ d: path([p(11, 2, 0), p(11, 2, -1.5), p(11, 4, -1.5), p(11, 4, 0)]), o: 0.7 });
  // the house, a box with a gable roof
  lines.push(...box(iso, 3, -8, 0, 8, -3, 2.4, 0.9, true));
  lines.push({ d: path([p(3, -8, 2.4), p(3, -5.5, 3.8), p(8, -5.5, 3.8), p(8, -8, 2.4)]), o: 0.9 });
  lines.push({ d: path([p(3, -3, 2.4), p(3, -5.5, 3.8)]), o: 0.9 });
  lines.push({ d: path([p(8, -3, 2.4), p(8, -5.5, 3.8)]), o: 0.9 });
  // the duct from the street trench to the wall
  lines.push({ d: path([p(5.4, 2.5, -0.6), p(5.4, -3, -0.6)]), o: 0.9, dash: '3 3' });
  lines.push({ d: path([p(5.9, 2.5, -0.6), p(5.9, -3, -0.6)]), o: 0.9, dash: '3 3' });
  const wall = p(5.65, -3, -0.6);
  return (
    <MiniSvg>
      <Lines lines={lines} />
      <circle cx={wall[0]} cy={wall[1]} r="3" fill="none" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </MiniSvg>
  );
}

export function MiniRestore() {
  const iso = makeIso(16, 163, 17);
  const { p, path } = iso;
  const lines: Ln[] = [];
  const layers: [number, number, number][] = [
    [-0.5, 0, 0.9],
    [-1.1, -0.5, 0.6],
    [-2.6, -1.1, 0.42],
  ];
  layers.forEach(([z0, z1, o], li) => lines.push(...box(iso, 0, 0, z0, 11, 6, z1, o, true, li === 0)));
  // the fresh patch over the closed trench
  lines.push({ d: path([p(0, 2, 0), p(11, 2, 0), p(11, 4, 0), p(0, 4, 0)], true), o: 1 });
  for (let x = 0.2; x < 10.8; x += 0.55) lines.push({ d: path([p(x, 2, 0), p(x + 0.35, 4, 0)]), o: 0.5 });
  lines.push({ d: path([p(11, 2, -0.5), p(11, 4, -0.5)]), o: 0.9 });
  // compaction marks
  const tick = (x: number): Ln => ({ d: path([p(x, 3, 1.8), p(x, 3, 0.5), p(x - 0.25, 3, 0.9), p(x, 3, 0.5), p(x + 0.25, 3, 0.9)]), o: 0.8 });
  lines.push(tick(2.5), tick(5.5), tick(8.5));
  return (
    <MiniSvg>
      <Lines lines={lines} />
    </MiniSvg>
  );
}

export const MINI_SCENES = [MiniTrench, MiniDucts, MiniHouse, MiniRestore];

/* ---------- the descent, strata and roots in greys ---------- */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Root = { d: string; depth: number };

function makeRoots(w: number, h: number): Root[] {
  const r = rng(7);
  const out: Root[] = [];
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    let d = `M${f(x)} ${f(y)}`;
    let cx = x;
    let cy = y;
    let a = ang;
    const steps = Math.max(3, Math.round(len / 16));
    for (let i = 0; i < steps; i++) {
      a += (r() - 0.5) * 0.45;
      cx += (Math.cos(a) * len) / steps;
      cy += (Math.sin(a) * len) / steps;
      d += ` L${f(cx)} ${f(cy)}`;
      if (depth > 0 && r() < 0.34) grow(cx, cy, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7), len * 0.55, depth - 1);
    }
    out.push({ d, depth });
  };
  for (let i = 0; i < 12; i++) grow(r() * w, h * (0.08 + r() * 0.1), Math.PI / 2 + (r() - 0.5) * 0.7, h * (0.28 + r() * 0.3), 2);
  return out;
}

function makeStrata(w: number, ys: number[]): string[] {
  const r = rng(21);
  return ys.map((y) => {
    let d = `M0 ${f(y)}`;
    for (let x = 0; x <= w; x += 80) d += ` L${x} ${f(y + (r() - 0.5) * 14)}`;
    return d;
  });
}

const DESCENT = { w: 1440, h: 560 };
const ROOTS = makeRoots(DESCENT.w, DESCENT.h);
const STRATA_Y = [60, 120, 190, 260, 330, 410];
const STRATA = makeStrata(DESCENT.w, STRATA_Y);

export function Descent() {
  return (
    <div className="p3-descent" aria-hidden="true">
      <span className="p3-descent__hill" />
      <svg viewBox={`0 0 ${DESCENT.w} ${DESCENT.h}`} preserveAspectRatio="xMidYMin slice" focusable="false">
        <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
          {STRATA.map((d, i) => (
            <path key={i} d={d} strokeOpacity={0.24 - i * 0.035} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray={i % 2 ? '1 5' : undefined} />
          ))}
          {ROOTS.map((rt, i) => (
            <path key={i} d={rt.d} strokeOpacity={0.1 + rt.depth * 0.04} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ---------- machine icons for the matrix, 32px, 1.5 stroke ---------- */

function MachineSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="p3-machine" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function MachineIcon({ index }: { index: number }) {
  if (index === 0)
    return (
      <MachineSvg>
        <rect x="3" y="24" width="18" height="5" rx="2.5" />
        <path d="M6 24 V16 H13 V24" />
        <path d="M13 18 L19 8 L27 12 L25 20" />
        <path d="M25 20 H29 L28 24 H24 Z" />
      </MachineSvg>
    );
  if (index === 1)
    return (
      <MachineSvg>
        <rect x="5" y="25" width="13" height="4" rx="2" />
        <path d="M7 25 V19 H12 V25" />
        <path d="M12 21 L17 13 L24 16 L23 22" />
        <path d="M23 22 H27 L26 25 H22 Z" />
      </MachineSvg>
    );
  if (index === 2)
    return (
      <MachineSvg>
        <path d="M3 22 V10 H19 V22" />
        <path d="M19 13 H24.5 L29 18 V22 H19" />
        <path d="M2 22 H30" />
        <circle cx="9" cy="25" r="3" />
        <circle cx="24" cy="25" r="3" />
      </MachineSvg>
    );
  return (
    <MachineSvg>
      <path d="M4 28 H20 L22 24 H3 Z" />
      <path d="M8 24 V16 H17 V24" />
      <path d="M17 18 L27 7" />
      <path d="M25 6 H29" />
    </MachineSvg>
  );
}
