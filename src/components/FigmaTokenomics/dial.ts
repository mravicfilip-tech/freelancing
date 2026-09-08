/**
 * Geometry for the tokenomics dial and the chain wires.
 *
 * The dial is drawn as real arcs rather than the three flat wedge exports, so the motion can
 * highlight one allocation at a time and slide a pointer arc onto it. Angles are degrees,
 * clockwise, 0° at three o'clock — so the ring starts at -90° (twelve o'clock).
 *
 * All coordinates are the design's own: the stage is 1560 × 586 and the dial is a 442 box at
 * (559, 72), which puts its centre on the hub at (780, 293) in stage space.
 */

export const DIAL = { size: 442, c: 221, r: 221 } as const;

export type Segment = {
  id: string;
  label: string;
  pct: number;
  icon: string;
  /** Start and end angle of the slice, degrees clockwise from three o'clock. */
  a0: number;
  a1: number;
  /** Chip position in stage coordinates; y is the row's centre line. */
  x: number;
  y: number;
  dark: boolean;
};

/**
 * Clockwise from twelve, ordered so each slice sits on the same side as its own chip:
 * listings and team to the right, marketing and rewards below, presale up the left, reserves top-left.
 */
const RAW: Omit<Segment, 'a0' | 'a1'>[] = [
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', x: 951.4, y: 162, dark: true },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', x: 982, y: 292, dark: true },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', x: 942.6, y: 424, dark: true },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', x: 436.5, y: 424, dark: true },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', x: 414, y: 292, dark: true },
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', x: 435.6, y: 162, dark: false },
];

export const SEGMENTS: Segment[] = (() => {
  let a = -90;
  return RAW.map((s) => {
    const seg = { ...s, a0: a, a1: a + (s.pct / 100) * 360 };
    a = seg.a1;
    return seg;
  });
})();

export const SEG_BY_ID = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<string, Segment>;

/**
 * The order the motion walks the dial: anticlockwise from the top-left, so the pointer sweeps
 * continuously around the ring and every step lands next to the chip it lights.
 * Change this one line to re-order the story.
 */
export const TOUR = ['reserves', 'presale', 'rewards', 'marketing', 'team', 'listings'];

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};

/** A pie slice from `a0` to `a1`. The hub disc covers the middle, so it runs to the centre. */
export function slicePath(a0: number, a1: number, r = DIAL.r, c = DIAL.c): string {
  const sweep = a1 - a0;
  // A full turn cannot be drawn as one arc — split it in half.
  if (sweep >= 359.999) {
    const [mx, my] = polar(c, c, r, a0 + 180);
    const [sx, sy] = polar(c, c, r, a0);
    return `M ${c} ${c} L ${sx} ${sy} A ${r} ${r} 0 0 1 ${mx} ${my} A ${r} ${r} 0 0 1 ${sx} ${sy} Z`;
  }
  const [x0, y0] = polar(c, c, r, a0);
  const [x1, y1] = polar(c, c, r, a1);
  return `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
}

/** Midpoint angle of a slice — where its pointer and any radial nudge aim. */
export const midAngle = (s: Segment) => (s.a0 + s.a1) / 2;

/** Unit vector along a slice's midline, for exploding it outward. */
export function midVector(s: Segment): [number, number] {
  const a = (midAngle(s) * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

/**
 * The six chain wires, in stage coordinates, each written from the outer edge inward — so a dot
 * animated 0 → 1 along the path travels toward the hub. These trace the same geometry as the
 * original wire exports, which is what keeps a travelling dot exactly on the line.
 */
export const WIRES: { id: string; d: string; coin: string }[] = [
  { id: 'l0', coin: 'coin-eth', d: 'M 0 293 L 559 293' },
  { id: 'l1', coin: 'coin-usdt', d: 'M 0.5 452.87 L 240.42 452.87 C 248.19 452.87 255.68 449.95 261.4 444.69 L 426 293.37' },
  { id: 'l2', coin: 'coin-btc', d: 'M 0.5 134.5 L 240.42 134.5 C 248.19 134.5 255.68 137.42 261.4 142.68 L 426 294' },
  { id: 'r0', coin: 'coin-bnb', d: 'M 1560 293 L 1001 293' },
  { id: 'r1', coin: 'coin-sol', d: 'M 1559.84 452.87 L 1319.92 452.87 C 1312.15 452.87 1304.66 449.95 1298.94 444.69 L 1134.34 293.37' },
  { id: 'r2', coin: 'coin-tron', d: 'M 1559.84 134.5 L 1319.92 134.5 C 1312.15 134.5 1304.66 137.42 1298.94 142.68 L 1134.34 294' },
];

/** Which wire feeds which allocation, so an arrival can be handed to the slice beside it. */
export const WIRE_FOR: Record<string, string> = {
  reserves: 'l2',
  presale: 'l0',
  rewards: 'l1',
  marketing: 'r1',
  team: 'r0',
  listings: 'r2',
};
