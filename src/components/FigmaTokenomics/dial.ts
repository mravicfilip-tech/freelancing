/**
 * Geometry for the tokenomics dial and the chain wires.
 *
 * The design (Figma 2592:485) draws the dial as ONE gradient arc — `Ellipse 3479`, a 442 box at
 * (559, 72) with arcData 0° → 214.91° — plus two concentric arcs at the hub that share its span:
 * `Ellipse 3480` (142, indigo at 24%) and `Ellipse 3483` (128, white at 52%). So "adjusting the
 * arc" means re-aiming and re-sizing that one gradient shape, and the halos follow it.
 *
 * Each allocation gets a sweep equal to its own share of the supply and is centred on the line its
 * own label row runs along, so the arc both points at the allocation and shows how big it is.
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
  /** Bearing the arc centres on — see aimOf. */
  aim: number;
  /** Which flank the allocation reads out to. */
  side: 'l' | 'r';
  /** Chip position in stage coordinates; y is the row's centre line. */
  x: number;
  y: number;
  /** A fixed chip width, where the frame sets one rather than letting the label size it. */
  w?: number;
};

/** The dial's centre in stage coordinates — the hub disc and every wire converge here. */
export const HUB = { x: 780, y: 293 } as const;

/**
 * The direction an allocation reads in: the bearing of the point where its row's centre line
 * leaves the dial. The rows are horizontal, so the arc's centreline exits the circle exactly where
 * the row crosses it and the row then carries straight on to the chip — the arc and the label are
 * on one continuous line.
 *
 * Aiming at the label box instead (its centre, or the chip within it) looks reasonable written
 * down but comes out 8-12 degrees shallower on every corner, because the box sits far outside the
 * circle and well off the row's exit point.
 */
export function aimOf(y: number, side: 'l' | 'r'): number {
  const dy = y - HUB.y;
  const dx = Math.sqrt(Math.max(DIAL.r * DIAL.r - dy * dy, 1)) * (side === 'l' ? -1 : 1);
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Keep the left flank in 90..270 so a lap reads as one continuous anticlockwise sweep.
  return side === 'l' && deg < 0 ? deg + 360 : deg;
}

const ROWS: Omit<Segment, 'aim'>[] = [
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', side: 'l', x: 435.6, y: 162 },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', side: 'l', x: 414, y: 292 },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', side: 'l', x: 436.5, y: 424 },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', side: 'r', x: 942.6, y: 424 },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', side: 'r', x: 982, y: 292 },
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', side: 'r', x: 951.4, y: 162 },
];

export const SEGMENTS: Segment[] = ROWS.map((r) => ({ ...r, aim: aimOf(r.y, r.side) }));

export const SEG_BY_ID = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<string, Segment>;

/** The arc span for one allocation: its share of the circle, centred on its row's bearing. */
export function spanOf(s: Segment): [number, number] {
  const sweep = (s.pct / 100) * 360;
  return [s.aim - sweep / 2, s.aim + sweep / 2];
}

/**
 * The order the arc walks the dial: top-left, left-centre, left-bottom, then right-bottom,
 * right-centre, right-top. Reserves is where it rests, so a lap starts and ends at the top left.
 */
export const TOUR = ['reserves', 'presale', 'rewards', 'marketing', 'team', 'listings'];
export const REST = 'reserves';

/**
 * One lap, as spans. Starting from the resting allocation it steps through the other five and
 * returns, unwrapping each aim so the bearing only ever decreases — which is a single, unbroken
 * anticlockwise rotation, with every allocation visited exactly once.
 */
export function tourStops(segments: Segment[] = SEGMENTS) {
  const byId = Object.fromEntries(segments.map((s) => [s.id, s])) as Record<string, Segment>;
  const at = TOUR.indexOf(REST);
  const order = [...TOUR.slice(at + 1), ...TOUR.slice(0, at + 1)];
  let prev = byId[REST].aim;
  return order.map((id) => {
    const seg = byId[id];
    let aim = seg.aim;
    while (aim > prev) aim -= 360;
    prev = aim;
    const sweep = (seg.pct / 100) * 360;
    return { id, seg, a0: aim - sweep / 2, a1: aim + sweep / 2 };
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

/* ---------------------------------------------------------------------------
 * Portrait (Figma 2639:1627)
 *
 * The phone frame stands the band up: the six allocations stack in two groups of three around a
 * 210 dial, fed by a wire tree reaching down from the head of the frame and up from its foot.
 * Same parts, same motion — only the geometry below changes.
 * ------------------------------------------------------------------------ */

export const STAGE = { w: 1560, h: 586 } as const;
export const STAGE_M = { w: 394, h: 1123 } as const;
/**
 * The frame is 1123 tall against 1010 of content plus its 160 padding, so `justify-center` is not
 * the no-op it looks like — it drops the whole stack 56.5px. Rows therefore run from 216.5, not
 * from the padding edge, and the dial's centre follows.
 */
export const HUB_M = { x: 197, y: 561.5 } as const;

/**
 * Aims are given rather than derived here. `aimOf` reads the bearing where a row's centre line
 * leaves the circle, which needs the rows to flank the dial; stacked above and below it, every row
 * in a group would exit at the same bearing. So the top three fan across the top and the bottom
 * three across the bottom, in the order TOUR walks them, which keeps a lap one unbroken sweep.
 */
const ROWS_M: Segment[] = [
  // The phone frame pins each chip's width rather than letting the label set it, which is also
  // what places the percent circle beside it — so they are given here, from the file.
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', side: 'l', x: 103, y: 248.5, aim: 315, w: 124 },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', side: 'l', x: 103, y: 328.5, aim: 270, w: 124 },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', side: 'l', x: 103, y: 408.5, aim: 225, w: 124 },
  // Below the dial the frame reads Listings, Team, Marketing — the arc's TOUR walks them in the
  // other direction, which is why the aims still fall as the tour steps and not as the rows do.
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', side: 'r', x: 103, y: 714.5, aim: 45, w: 114 },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', side: 'r', x: 103, y: 794.5, aim: 90, w: 94 },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', side: 'r', x: 103, y: 874.5, aim: 135, w: 132 },
];
export const SEGMENTS_M: Segment[] = ROWS_M;

/**
 * The two wire trees, drawn rather than exported: a dot animated along one of these sits exactly on
 * the line, which an image behind a separately-positioned dot cannot promise. Each is written from
 * the chain mark inward, so 0 → 1 travels toward the hub. The middle mark of each trio sits on the
 * trunk, so its wire is the trunk itself.
 */
export const WIRES_M: { id: string; d: string; coin: string }[] = [
  { id: 'l0', coin: 'coin-eth', d: 'M 197 123 L 197 456.5' },
  { id: 'l1', coin: 'coin-usdt', d: 'M 104 70 L 104 104 C 104 124 148 118 180 132 C 194 138 197 148 197 164 L 197 456.5' },
  { id: 'l2', coin: 'coin-btc', d: 'M 293 70 L 293 104 C 293 124 246 118 214 132 C 200 138 197 148 197 164 L 197 456.5' },
  { id: 'r0', coin: 'coin-bnb', d: 'M 197 1003 L 197 666.5' },
  { id: 'r1', coin: 'coin-sol', d: 'M 102 1053 L 102 1019 C 102 999 148 1005 180 991 C 194 985 197 975 197 959 L 197 666.5' },
  { id: 'r2', coin: 'coin-tron', d: 'M 290 1053 L 290 1019 C 290 999 246 1005 214 991 C 200 985 197 975 197 959 L 197 666.5' },
];

/**
 * Chain marks, from the file's rotated frames (2639:1875 and 2639:1915). As on the desk table, `x`
 * is the disc's left edge and `y` its centre line; the discs are 40 here against the desk's 64.
 */
export const COINS_M: { id: string; x: number; y: number }[] = [
  { id: 'coin-usdt', x: 84, y: 50 },
  { id: 'coin-btc', x: 273, y: 50 },
  { id: 'coin-eth', x: 174, y: 103 },
  { id: 'coin-bnb', x: 176, y: 1023 },
  { id: 'coin-sol', x: 82, y: 1073 },
  { id: 'coin-tron', x: 270, y: 1073 },
];

/** Everything the band's layout depends on, for whichever frame is on screen. */
export function geometry(mobile: boolean) {
  return mobile
    ? { stage: STAGE_M, hub: HUB_M, segments: SEGMENTS_M, wires: WIRES_M, coins: COINS_M, disc: 40, mark: 18.883 }
    : { stage: STAGE, hub: HUB, segments: SEGMENTS, wires: WIRES, coins: COINS, disc: 64, mark: 32 };
}
export type Geometry = ReturnType<typeof geometry>;
