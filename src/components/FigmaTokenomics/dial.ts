/**
 * Geometry for the tokenomics dial and the chain wires.
 *
 * The design (Figma 2592:485) draws the dial as ONE gradient arc — `Ellipse 3479`, a 442 box at
 * (559, 72) with arcData 0° → 214.91° — plus two concentric arcs at the hub that share its span:
 * `Ellipse 3480` (142, indigo at 24%) and `Ellipse 3483` (128, white at 52%). So "adjusting the
 * arc" means re-aiming and re-sizing that one gradient shape, and the halos follow it.
 *
 * Each allocation gets a sweep equal to its own share of the supply and is aimed at its chip, so
 * the arc both points at the allocation and shows how big it is.
 *
 * Angles are degrees, clockwise, 0° at three o'clock — the same convention Figma's arcData uses.
 */

export const DIAL = { size: 442, c: 221, r: 221 } as const;
/** The hub halos, as drawn in the design: diameter and paint. */
export const HALOS = [
  { d: 142, fill: 'rgb(73,107,240)', opacity: 0.24 },
  { d: 128, fill: '#ffffff', opacity: 0.52 },
] as const;

export type Segment = {
  id: string;
  label: string;
  pct: number;
  icon: string;
  /**
   * Direction the arc centres on: the bearing, from the hub at (780, 293), of the centre of this
   * allocation's whole chip + percentage row. Derived from Figma's own chip widths
   * (reserves 124, presale 115, rewards 122, marketing 133, team 94, listings 115, each + a 64
   * circle), so the arc lands square on the row rather than near it.
   */
  aim: number;
  /** Chip position in stage coordinates; y is the row's centre line. */
  x: number;
  y: number;
};

export const SEGMENTS: Segment[] = [
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', aim: 207.6, x: 435.6, y: 162 },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', aim: 180.2, x: 414, y: 292 },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', aim: 152.4, x: 436.5, y: 424 },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', aim: 26.6, x: 942.6, y: 424 },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', aim: -0.2, x: 982, y: 292 },
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', aim: -26.7, x: 951.4, y: 162 },
];

export const SEG_BY_ID = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<string, Segment>;

/** The arc span for one allocation: its share of the circle, centred on its chip. */
export function spanOf(s: Segment): [number, number] {
  const sweep = (s.pct / 100) * 360;
  return [s.aim - sweep / 2, s.aim + sweep / 2];
}

/**
 * The order the arc walks the dial. The aims decrease monotonically, so stepping through this
 * list rotates the arc anticlockwise all the way round. Presale is the resting state.
 */
export const TOUR = ['reserves', 'presale', 'rewards', 'marketing', 'team', 'listings'];
export const REST = 'presale';

/** Tour spans unwrapped, so the arc never jumps the long way round. */
export function tourStops() {
  let prev = Infinity;
  return TOUR.map((id) => {
    const seg = SEG_BY_ID[id];
    let [a0, a1] = spanOf(seg);
    while (a1 > prev) {
      a0 -= 360;
      a1 -= 360;
    }
    prev = a0;
    return { id, a0, a1, seg };
  });
}

const polar = (c: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
};

/** A pie slice from `a0` to `a1`. The hub disc covers the middle, so it runs to the centre. */
export function slicePath(a0: number, a1: number, r: number = DIAL.r, c: number = DIAL.c): string {
  const sweep = a1 - a0;
  if (sweep <= 0.01) return '';
  if (sweep >= 359.99) {
    const [mx, my] = polar(c, r, a0 + 180);
    const [sx, sy] = polar(c, r, a0);
    return `M ${c} ${c} L ${sx} ${sy} A ${r} ${r} 0 0 1 ${mx} ${my} A ${r} ${r} 0 0 1 ${sx} ${sy} Z`;
  }
  const [x0, y0] = polar(c, r, a0);
  const [x1, y1] = polar(c, r, a1);
  return `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
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

/**
 * The order the load-in draws the wires: top-left, left-centre, left-bottom, then right-bottom,
 * right-centre, right-top — so the lines come in around the section rather than all at once.
 */
export const SPATIAL = ['l2', 'l0', 'l1', 'r1', 'r0', 'r2'];

/** Which wire feeds which allocation, so an arrival can be handed to the chip beside it. */
export const WIRE_FOR: Record<string, string> = {
  reserves: 'l2',
  presale: 'l0',
  rewards: 'l1',
  marketing: 'r1',
  team: 'r0',
  listings: 'r2',
};

export const COINS: { id: string; x: number; y: number }[] = [
  { id: 'coin-btc', x: 136, y: 134 },
  { id: 'coin-eth', x: 226, y: 293 },
  { id: 'coin-usdt', x: 136, y: 453 },
  { id: 'coin-tron', x: 1348, y: 134 },
  { id: 'coin-bnb', x: 1264, y: 293 },
  { id: 'coin-sol', x: 1348, y: 453 },
];
