// Top down plan of the yard for the last chapter. Black aisles between cream blocks, a curve that
// splits, a junction, a cross aisle and the dock. Units are screen pixels at camera scale 1.
import type { Ref } from 'react';
import { C } from '../../tokens';
import { ForkliftTop } from './art';

export const AISLE = 190;
export const ROUTE = 'M 0 0 L 900 0 C 1150 0 1200 340 1450 340 L 1600 340 Q 1750 340 1750 490 L 1750 2190';

const AISLES = [
  'M -2600 0 L 3600 0',
  'M 900 0 C 1150 0 1200 340 1450 340 L 3600 340',
  'M 1750 340 L 1750 2515',
  'M -1600 1250 L 3600 1250',
  'M 1750 760 Q 1750 950 1560 950 L -1600 950',
  'M 1655 2420 L 3600 2420',
];

// Rounds a cream block's corner at a junction. (cx, cy) is the sharp corner, (dx, dy) points into
// the block.
function fillet(cx: number, cy: number, dx: number, dy: number, r = 64) {
  const sweep = -dx * dy > 0 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx + dx * r} ${cy} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + dy * r} Z`;
}

const FILLETS = [
  fillet(1655, 435, -1, 1),
  fillet(1845, 435, 1, 1),
  fillet(1655, 1155, -1, -1),
  fillet(1845, 1155, 1, -1),
  fillet(1655, 1345, -1, 1),
  fillet(1845, 1345, 1, 1),
  fillet(1655, 1045, -1, 1, 40),
  fillet(1845, 2325, 1, -1),
];

export type MapRefs = {
  cam: Ref<SVGGElement>;
  truck: Ref<SVGGElement>;
  truckInner: Ref<SVGGElement>;
  route: Ref<SVGPathElement>;
  reveal: Ref<SVGPathElement>;
};

export function YardMap({ refs }: { refs: MapRefs }) {
  const doors = [];
  for (let x = 1960; x < 3500; x += 132) doors.push(x);
  return (
    <g ref={refs.cam}>
      <defs>
        <mask id="v2-reveal" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={9000} height={9000}>
          <path ref={refs.reveal} d={ROUTE} fill="none" stroke={C.white} strokeWidth={14} />
        </mask>
        <pattern id="v2-hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={14} stroke={C.textGrey} strokeWidth={2} />
        </pattern>
      </defs>
      {/* white curb line under every aisle edge */}
      {AISLES.map((d) => (
        <path key={`c${d}`} d={d} fill="none" stroke={C.white} strokeWidth={AISLE + 6} />
      ))}
      {AISLES.map((d) => (
        <path key={d} d={d} fill="none" stroke={C.ink} strokeWidth={AISLE} />
      ))}
      {FILLETS.map((d) => (
        <path key={d} d={d} fill={C.ink} />
      ))}
      {/* faint lane marks on the aisles the truck does not take */}
      <path d="M -2600 0 L 860 0" fill="none" stroke={C.textGrey} strokeWidth={2} strokeDasharray="28 34" opacity={0.7} />
      <path d="M 1600 340 L 3600 340" fill="none" stroke={C.textGrey} strokeWidth={2} strokeDasharray="28 34" opacity={0.7} />
      <path d="M 900 0 L 3600 0" fill="none" stroke={C.textGrey} strokeWidth={2} strokeDasharray="28 34" opacity={0.7} />
      <path d="M -1600 1250 L 1640 1250 M 1860 1250 L 3600 1250" fill="none" stroke={C.textGrey} strokeWidth={2} strokeDasharray="28 34" opacity={0.7} />
      <path d="M 1560 950 L -1600 950" fill="none" stroke={C.textGrey} strokeWidth={2} strokeDasharray="28 34" opacity={0.7} />
      {/* hatched junction boxes */}
      <rect x={1665} y={255} width={170} height={170} fill="url(#v2-hatch)" opacity={0.55} />
      <rect x={1665} y={1165} width={170} height={170} fill="url(#v2-hatch)" opacity={0.55} />
      {/* stop line and dock */}
      <line x1={1660} y1={2310} x2={1840} y2={2310} stroke={C.white} strokeWidth={6} />
      {doors.map((x) => (
        <g key={x}>
          <rect x={x} y={2515} width={92} height={18} fill={C.textGrey} />
          <rect x={x - 8} y={2515} width={8} height={10} fill={C.ink} />
          <rect x={x + 92} y={2515} width={8} height={10} fill={C.ink} />
          <rect x={x + 6} y={2533} width={80} height={4} fill={C.ink} />
        </g>
      ))}
      {/* the planned route, dashed white on the ink aisle, revealed ahead of the truck */}
      <path ref={refs.route} d={ROUTE} fill="none" stroke={C.white} strokeWidth={4} strokeDasharray="22 18" mask="url(#v2-reveal)" />
      <g ref={refs.truck}>
        <g ref={refs.truckInner}>
          <g transform="scale(0.55) translate(-10 0)">
            <ForkliftTop />
          </g>
        </g>
      </g>
    </g>
  );
}
