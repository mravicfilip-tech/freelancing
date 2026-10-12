// The automation floor, T and AT. One order carried out from start to finish across the AT hold, in a clean axonometric view
// of a warehouse, line art on the dark ground. The back wall and the floor run edge to edge, the left half of the frame is plain
// floor so the text sits on the warehouse's own floor, and the work happens in columns 7 to 12.
//
//   k 0 to 0.3     the C-Matic 10 leaves its charger and drives under the shelf unit with the target box
//   k 0.3 to 0.6   it lifts the shelf unit and carries it out to the pick station
//   k 0.6 to 1.0   a person walks up and takes the box from the highlighted slot and sets it on the pick table
//
// Two more C-Matics carry shelf units in the back aisle in the same windows, so it reads as a fleet run by one system. The only
// system graphic is a 1px path drawn just ahead of the active robot and gone behind it, and a calm highlight on the target slot.
// Every object is real size in metres, the robot is 1.2 m, a shelf unit 1.0 by 0.8 by 2.1 m, the person 1.75 m. Everything is a
// function of k, so it scrubs and freezes. Nothing fades, parts move or they are drawn. White 1px lines on dark, no red.
import type { ReactNode } from 'react';
import { WH, io, lerp, range } from './frame';
import type { Cols } from './stage';

// ---- the view, x runs down and to the right, y down and to the left, z up. Metres to pixels by U ---------------------------------
const HX = 0.866;
const HY = 0.62;
const HZ = 0.9;

type Proj = (x: number, y: number, z: number) => [number, number];

export function viewOf(c: Cols) {
  // the drawing is sized by its height and may run off the right edge of the frame, the left is held at column 7
  const U = Math.min(54, (c.bottom - c.top - 40) / (18.5 * HY + 2.2 * HZ));
  const ox = c.left(7) + 14 + 6.5 * HX * U;
  const oy = c.top + 30 + Math.max(0, (c.bottom - c.top - 40 - (18.5 * HY + 2.2 * HZ) * U) / 2);
  const P: Proj = (x, y, z) => [ox + (x - y) * HX * U, oy + (x + y) * HY * U - z * HZ * U];
  return { U, ox, oy, P };
}

// ---- tones, fills that hide what is behind a solid, so every drawn edge reads as a hidden line removed drawing -----------------
type Tone = { t: string; l: string; r: string };
const FLOOR = '#2d2d2d';
const WALL = '#1b1b1b';
const PLATE: Tone = { t: '#3c3c3c', l: '#2b2b2b', r: '#333333' };
const CARTON: Tone = { t: '#5a5a5a', l: '#3f3f3f', r: '#4b4b4b' };
const BODY: Tone = { t: '#585858', l: '#383838', r: '#444444' };
const PERSON: Tone = { t: '#505050', l: '#363636', r: '#434343' };
const LINE = 0.85;

const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

// A box by its centre, size and turn about the vertical, drawn as the visible sides and the top.
function prism(P: Proj, key: string, cx: number, cy: number, z: number, w: number, d: number, h: number, ang: number, tone: Tone, o = LINE): ReactNode {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [cx + a * c - b * s, cy + a * s + b * c] as [number, number]);
  const faces: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    let nx = ey;
    let ny = -ex;
    if (nx * ((a[0] + b[0]) / 2 - cx) + ny * ((a[1] + b[1]) / 2 - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    if (nx + ny <= 1e-6) continue;
    const poly = [P(a[0], a[1], z), P(b[0], b[1], z), P(b[0], b[1], z + h), P(a[0], a[1], z + h)];
    faces.push(<polygon key={i} points={poly.map(fmt).join(' ')} fill={Math.abs(nx) >= Math.abs(ny) ? tone.r : tone.l} />);
  }
  const top = pts.map((p) => fmt(P(p[0], p[1], z + h))).join(' ');
  return (
    <g key={key} stroke={WH} strokeOpacity={o} strokeWidth={1} strokeLinejoin="miter">
      {faces}
      <polygon points={top} fill={tone.t} />
    </g>
  );
}

const seg3 = (P: Proj, key: string, a: [number, number, number], b: [number, number, number], w = 1, o = LINE): ReactNode => {
  const p = P(...a);
  const q = P(...b);
  return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={WH} strokeOpacity={o} strokeWidth={w} />;
};

// ---- routes and the clock ------------------------------------------------------------------------------------------------------
type V = [number, number];
const len = (pts: V[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function posAt(pts: V[], d: number): V {
  let rest = Math.max(0, d);
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (rest <= l || i === pts.length - 2) {
      const t = Math.min(1, rest / l);
      return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)];
    }
    rest -= l;
  }
  return pts[pts.length - 1];
}
// the part of a route between two distances, as points
function slice(pts: V[], a: number, b: number): V[] {
  const out: V[] = [posAt(pts, a)];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (run > a + 1e-6 && run < b - 1e-6) out.push(pts[i]);
  }
  out.push(posAt(pts, b));
  return out;
}
// heading from the route a little behind and ahead, so a corner is turned and not snapped
const headingAt = (pts: V[], d: number) => {
  const a = posAt(pts, d - 0.45);
  const b = posAt(pts, d + 0.45);
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
};

// The block of shelf units stands against the back wall in two rows, the aisle runs along it toward the viewer. The deep end of the
// aisle, small x, is where the fleet works. Two slots of the front row start empty, the fleet moves a unit into each.
const SLOT_X = [1.7, 3.1, 4.5, 5.9, 7.3, 8.7, 10.1];
const FRONT_Y = 2.5;
const BACK_Y = 1.5;
const LANE_M = 3.75; // the fleet's lane, nearest the units
const LANE_F = 5.3; // the order's lane
const UW = 1.0;
const UD = 0.8;
const LIFT = 0.15;
const LEVELS = [0.4, 0.95, 1.5, 2.05];
const TARGET = 3;

const lane = (x: number, y: number): V => [x, y];
// R1 the C-Matic 10 on the order, from its charger under the target unit and out to the pick station
const R1: V[] = [lane(0.9, LANE_F), lane(SLOT_X[TARGET], LANE_F), lane(SLOT_X[TARGET], FRONT_Y), lane(SLOT_X[TARGET], LANE_F), lane(8.0, LANE_F)];
// R2 and R3 each move a front row unit into an empty slot, then drive away empty
const R2: V[] = [lane(0.8, LANE_M), lane(SLOT_X[1], LANE_M), lane(SLOT_X[1], FRONT_Y), lane(SLOT_X[1], LANE_M), lane(SLOT_X[0], LANE_M), lane(SLOT_X[0], FRONT_Y), lane(SLOT_X[0], LANE_M), lane(0.8, LANE_M)];
const R3: V[] = [lane(10.9, LANE_M), lane(SLOT_X[5], LANE_M), lane(SLOT_X[5], FRONT_Y), lane(SLOT_X[5], LANE_M), lane(SLOT_X[6], LANE_M), lane(SLOT_X[6], FRONT_Y), lane(SLOT_X[6], LANE_M), lane(10.9, LANE_M)];

type Run = { s: number; lift: number; moving: boolean; carryEnd: number };
// distance along the route at k, and the lift of the unit
function runOf(k: number, route: V[], leave: boolean): Run {
  const under = len(route.slice(0, 3));
  const carryEnd = len(route.slice(0, leave ? 6 : 5));
  const leaveEnd = len(route);
  let s: number;
  if (k < 0.3) s = under * io(k / 0.3);
  else if (k < 0.36) s = under;
  else if (k < 0.6) s = lerp(under, carryEnd, io((k - 0.36) / 0.24));
  else if (!leave || k < 0.7) s = carryEnd;
  else s = lerp(carryEnd, leaveEnd, io((k - 0.7) / 0.3));
  const up = io(range(k, 0.3, 0.36));
  const down = leave ? io(range(k, 0.6, 0.66)) : 0;
  const moving = (k > 0 && k < 0.3) || (k > 0.36 && k < 0.6) || (leave && k > 0.7 && k < 1);
  return { s, lift: LIFT * up * (1 - down), moving, carryEnd };
}

// ---- parts -----------------------------------------------------------------------------------------------------------------------
type Shelf = { id: string; x: number; y: number; z: number; box: boolean };

function shelfUnit(P: Proj, u: Shelf): ReactNode[] {
  const { x, y, z } = u;
  const h = (i: number) => 0.26 + ((Math.round(x * 7) + i) % 3) * 0.04;
  const out: ReactNode[] = [];
  const top = z + LEVELS[3] + 0.04;
  out.push(seg3(P, 'p0', [x - UW / 2, y - UD / 2, z], [x - UW / 2, y - UD / 2, top], 1.2));
  LEVELS.forEach((lv, i) => {
    out.push(prism(P, `pl${i}`, x, y, z + lv, UW, UD, 0.04, 0, PLATE));
    if (i < 3) {
      out.push(prism(P, `ca${i}`, x - 0.22, y, z + lv + 0.04, 0.4, 0.52, h(i), 0, CARTON));
      const isTarget = u.id === 'T' && i === 1;
      if (!(isTarget && !u.box)) out.push(prism(P, `cb${i}`, x + 0.2, y, z + lv + 0.04, 0.34, 0.5, h(i + 1), 0, CARTON));
    }
  });
  out.push(seg3(P, 'p1', [x + UW / 2, y - UD / 2, z], [x + UW / 2, y - UD / 2, top], 1.2));
  out.push(seg3(P, 'p2', [x - UW / 2, y + UD / 2, z], [x - UW / 2, y + UD / 2, top], 1.2));
  out.push(seg3(P, 'p3', [x + UW / 2, y + UD / 2, z], [x + UW / 2, y + UD / 2, top], 1.2));
  return out;
}

// The C-Matic 10, 1.2 by 0.8 by 0.3 m, turned by ang, its top plate rising with the lift.
function robot(P: Proj, x: number, y: number, ang: number, lift: number): ReactNode[] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [
    prism(P, 'body', x, y, 0.02, 1.2, 0.8, 0.26, ang, BODY),
    prism(P, 'bump', x + 0.6 * c, y + 0.6 * s, 0.07, 0.06, 0.7, 0.1, ang, PLATE),
    prism(P, 'plate', x, y, 0.28 + lift, 0.9, 0.6, 0.04, ang, PLATE),
  ];
}

type Group = { d: number; nodes: ReactNode };

// build runs 0 to 1 through T and is only used by the shell for the rise, k is the AT hold 0 to 1, ty is the screen y of the
// floor's top edge as it rises in T.
export function Automation({ cols, k, ty }: { cols: Cols; k: number; ty: number }) {
  const { U, ox, oy, P } = viewOf(cols);
  const x0 = cols.x0 - 4;
  const x1 = cols.x1 + 4;
  const y1 = cols.y1 + 4;
  const sl = HY / HX; // slope of the floor lines on screen
  const wallY = (sx: number) => oy + (sx - ox) * sl;

  // ---- the order ----
  const r1 = runOf(k, R1, false);
  const r2 = runOf(k, R2, true);
  const r3 = runOf(k, R3, true);
  const p1 = posAt(R1, r1.s);
  const p2 = posAt(R2, r2.s);
  const p3 = posAt(R3, r3.s);

  // the shelf units, the carried ones sit on their robot from the lift on
  const units: Shelf[] = [];
  const carried = (id: string, route: V[], r: Run, x: number, y: number): Shelf => {
    if (k < 0.3) return { id, x, y, z: 0, box: true };
    const p = posAt(route, Math.min(r.s, r.carryEnd));
    return { id, x: p[0], y: p[1], z: r.lift, box: true };
  };
  SLOT_X.forEach((x, i) => {
    units.push({ id: `b${i}`, x, y: BACK_Y, z: 0, box: true });
    if (i === TARGET) units.push(carried('T', R1, r1, x, FRONT_Y));
    else if (i === 1) units.push(carried('f1', R2, r2, x, FRONT_Y));
    else if (i === 5) units.push(carried('f5', R3, r3, x, FRONT_Y));
    else if (i !== 0 && i !== 6) units.push({ id: `f${i}`, x, y: FRONT_Y, z: 0, box: true });
  });
  // the person and the box they take
  const walk = io(range(k, 0.4, 0.66));
  const px = lerp(17.5, 9.15, walk);
  const py = LANE_F;
  const step = walk > 0 && walk < 1 ? Math.sin((px * 9) % (Math.PI * 2)) : 0;
  const reach = io(range(k, 0.68, 0.75));
  const carryT = io(range(k, 0.8, 0.92));
  const rest: [number, number, number] = [px - 0.04, py + 0.3, 0.95];
  const slotHand: [number, number, number] = [8.56, LANE_F + 0.02, 1.24];
  const tableHand: [number, number, number] = [9.3, LANE_F + 0.85, 1.08];
  const free = k < 0.75 ? 0 : 1;
  let hand: [number, number, number];
  if (k < 0.75) hand = [lerp(rest[0], slotHand[0], reach), lerp(rest[1], slotHand[1], reach), lerp(rest[2], slotHand[2], reach)];
  else if (k < 0.8) hand = slotHand;
  else if (k < 0.92) hand = [lerp(slotHand[0], tableHand[0], carryT), lerp(slotHand[1], tableHand[1], carryT), lerp(slotHand[2], tableHand[2], carryT) + 0.12 * Math.sin(carryT * Math.PI)];
  else {
    const back = io(range(k, 0.94, 1));
    hand = [lerp(tableHand[0], rest[0], back), lerp(tableHand[1], rest[1], back), lerp(tableHand[2], rest[2], back)];
  }
  const boxFree = k >= 0.75;
  const boxPos: [number, number, number] =
    k < 0.8 ? [r1.lift ? p1[0] + 0.2 : p1[0], p1[1], r1.lift + LEVELS[1] + 0.04] : k < 0.92 ? [hand[0] - 0.05, hand[1], hand[2] - 0.17] : [tableHand[0], LANE_F + 1.05, 0.9];

  // ---- the ground, wall and floor edge to edge, floor markings only inside the automation zone ----
  const ground: ReactNode[] = [];
  const wy = (sx: number) => wallY(sx);
  ground.push(<rect key="floor" x={x0} y={0} width={x1 - x0} height={y1} fill={FLOOR} />);
  // the wall is everything above the wall line, cut off at the top of the room
  const xc = Math.max(x0, ox - oy / sl);
  ground.push(<polygon key="wall" points={`${xc},${wy(xc)} ${x1},${wy(x1)} ${x1},0 ${xc},0`} fill={WALL} />);
  ground.push(<line key="wl" x1={xc} y1={wy(xc)} x2={x1} y2={wy(x1)} stroke={WH} strokeOpacity={0.35} strokeWidth={1} />);
  // the wall's own joints and rails, only where the drawing is, right of column 7
  const left7 = cols.left(7);
  for (let wx = 0; wx <= 14; wx += 3) {
    const a = P(wx, 0, 0);
    const b = P(wx, 0, 3.6);
    if (a[0] < left7) continue;
    ground.push(<line key={`wj${wx}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={WH} strokeOpacity={0.14} strokeWidth={1} />);
  }
  {
    const a = P(0, 0, 3.6);
    const b = P(30, 0, 3.6);
    const a0 = Math.max(a[0], left7);
    ground.push(<line key="rail" x1={a0} y1={a[1] + (a0 - a[0]) * sl} x2={b[0]} y2={b[1]} stroke={WH} strokeOpacity={0.14} strokeWidth={1} />);
    const s0 = P(0, 0, 0.25);
    const s1 = P(30, 0, 0.25);
    ground.push(<line key="skirt" x1={Math.max(s0[0], left7)} y1={s0[1] + (Math.max(s0[0], left7) - s0[0]) * sl} x2={s1[0]} y2={s1[1]} stroke={WH} strokeOpacity={0.14} strokeWidth={1} />);
  }
  // the zone, its left and front edges are designed edges, its lines run on to the frame edge
  const xr = (cols.x1 - ox) / (HX * U) + 8;
  const zoneY = 7.8;
  const fl = (key: string, ya: number, yb: number, xa: number, xb: number, o = 0.28) => {
    const a = P(xa, ya, 0);
    const b = P(xb, yb, 0);
    return <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={WH} strokeOpacity={o} strokeWidth={1} />;
  };
  ground.push(fl('z-left', 0, zoneY, 0, 0, 0.4));
  ground.push(fl('z-front', zoneY, zoneY, 0, xr, 0.4));
  [3.15, 6.3].forEach((yy) => ground.push(fl(`a${yy}`, yy, yy, 0, xr)));
  // footprints of the shelf unit slots and the staging slots, a rectangle on the floor
  const rect = (key: string, cx: number, cy: number, w: number, d: number, o = 0.28) => {
    const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => fmt(P(cx + a, cy + b, 0))).join(' ');
    return <polygon key={key} points={c} fill="none" stroke={WH} strokeOpacity={o} strokeWidth={1} />;
  };
  SLOT_X.forEach((x, i) => {
    ground.push(rect(`sf${i}`, x, FRONT_Y, UW + 0.1, UD + 0.1));
    ground.push(rect(`sb${i}`, x, BACK_Y, UW + 0.1, UD + 0.1));
  });
  // chargers, one pad each, and the pick station zone
  ground.push(rect('pad1', 0.95, LANE_F, 1.5, 1.1, 0.35));
  ground.push(rect('pad2', 0.8, LANE_M, 1.5, 1.1, 0.35));
  ground.push(rect('pad3', 10.9, LANE_M, 1.5, 1.1, 0.35));
  ground.push(rect('pick', 9.4, LANE_F + 0.3, 3.4, 2.1, 0.35));

  // the path, a thin solid line just ahead of the active robot and nothing behind it
  if (r1.moving) {
    const ahead = slice(R1, r1.s, Math.min(len(R1), r1.s + 2.8));
    if (ahead.length > 1) {
      ground.push(<polyline key="path" points={ahead.map((p) => fmt(P(p[0], p[1], 0.01))).join(' ')} fill="none" stroke={WH} strokeOpacity={0.95} strokeWidth={1} />);
    }
  }

  // ---- everything standing on the floor, sorted back to front by where it stands ----
  const groups: Group[] = [];
  const unitNode = (u: Shelf) => ({ d: u.x + u.y + 0.2, nodes: <g key={u.id}>{shelfUnit(P, u)}</g> });
  units.forEach((u) => {
    // the target unit carries the person's box only until it is taken
    groups.push(unitNode({ ...u, box: !boxFree }));
  });
  // the target slot highlight, calm, on the end face the person takes from
  const tu = units.find((u) => u.id === 'T')!;
  const hz = tu.z + LEVELS[1] + 0.04;
  const hl = [P(tu.x + UW / 2, tu.y - 0.38, hz), P(tu.x + UW / 2, tu.y + 0.38, hz), P(tu.x + UW / 2, tu.y + 0.38, hz + 0.44), P(tu.x + UW / 2, tu.y - 0.38, hz + 0.44)];
  groups.push({ d: tu.x + tu.y + 0.9, nodes: <polygon key="hl" points={hl.map(fmt).join(' ')} fill={WH} fillOpacity={0.12} stroke={WH} strokeOpacity={0.9} strokeWidth={1.5} /> });

  const rb = (key: string, p: V, route: V[], s: number, lift: number) => ({ d: p[0] + p[1], nodes: <g key={key}>{robot(P, p[0], p[1], headingAt(route, s), lift)}</g> });
  groups.push(rb('r1', p1, R1, r1.s, r1.lift));
  groups.push(rb('r2', p2, R2, r2.s, r2.lift));
  groups.push(rb('r3', p3, R3, r3.s, r3.lift));

  // charger posts at the pads
  [[0.2, LANE_F], [0.1, LANE_M], [11.6, LANE_M]].forEach(([cx, cy], i) =>
    groups.push({ d: cx + cy - 0.4, nodes: <g key={`ch${i}`}>{prism(P, 'post', cx, cy, 0, 0.3, 0.5, 1.1, 0, PLATE)}</g> }),
  );

  // the pick station, a table with a screen
  groups.push({
    d: 9.3 + LANE_F + 1.05 - 1.5,
    nodes: (
      <g key="table">
        {prism(P, 'tb', 9.3, LANE_F + 1.05, 0, 0.9, 0.7, 0.9, 0, PLATE)}
        {prism(P, 'scr', 9.7, LANE_F + 0.9, 0.9, 0.05, 0.4, 0.3, 0, BODY)}
      </g>
    ),
  });

  // the person, 1.75 m, walking in and taking the box
  const sway = step * 0.12;
  const person = (
    <g key="person">
      {prism(P, 'lg1', px + sway, py - 0.11, 0, 0.16, 0.16, 0.85, 0, PERSON)}
      {prism(P, 'lg2', px - sway, py + 0.11, 0, 0.16, 0.16, 0.85, 0, PERSON)}
      {seg3(P, 'arm-l', [px, py - 0.24, 1.42], [px - 0.05 + sway, py - 0.3, 0.82], 2, 0.9)}
      {prism(P, 'torso', px, py, 0.85, 0.24, 0.44, 0.62, 0, PERSON)}
      {(() => {
        const sh: [number, number, number] = [px, py + 0.24, 1.42];
        const el: [number, number, number] = [(sh[0] + hand[0]) / 2 + 0.06, (sh[1] + hand[1]) / 2 + 0.1, (sh[2] + hand[2]) / 2 - 0.12];
        return (
          <g>
            {seg3(P, 'ua', sh, el, 2, 0.95)}
            {seg3(P, 'fa', el, hand, 2, 0.95)}
          </g>
        );
      })()}
      {(() => {
        const c = P(px, py, 1.72);
        return <circle key="head" cx={c[0]} cy={c[1]} r={0.11 * U * 1.05} fill={PERSON.t} stroke={WH} strokeOpacity={LINE} strokeWidth={1} />;
      })()}
    </g>
  );
  groups.push({ d: px + py + 0.5, nodes: person });
  // the box once it is in the hand or on the table
  if (boxFree) groups.push({ d: boxPos[0] + boxPos[1] + 1.2, nodes: <g key="box">{prism(P, 'bx', boxPos[0], boxPos[1], boxPos[2], 0.34, 0.5, 0.3, 0, CARTON)}</g> });
  void free;

  groups.sort((a, b) => a.d - b.d);

  return (
    <g transform={`translate(0 ${ty.toFixed(2)})`}>
      {ground}
      {groups.map((g, i) => (
        <g key={i}>{g.nodes}</g>
      ))}
    </g>
  );
}

