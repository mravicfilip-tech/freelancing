// The fork blade that lifts the next section up out of the dark servis screen. Variant 2 flat vector style, token fills
// only. The servis schematic is in schematic.tsx, the rental grid in rental.tsx and the automation floor in automation.tsx.
import { W, K, G, G2, WH } from './frame';

// ---- the fork blade ----------------------------------------------------------------------------------------
export function Blade({ y }: { y: number }) {
  const t = 168;
  return (
    <g>
      <path
        d={`M 150 ${y + 26} Q 150 ${y} 190 ${y} L ${W + 80} ${y} L ${W + 80} ${y + t} L 420 ${y + t} Q 210 ${y + t - 4} 164 ${y + 92} Q 148 ${y + 62} 150 ${y + 26} Z`}
        fill={G}
        stroke={K}
        strokeOpacity={0.5}
        strokeWidth={1.4}
      />
      <path d={`M 190 ${y} L ${W + 80} ${y} L ${W + 80} ${y + 36} L 214 ${y + 36} Q 150 ${y + 30} 150 ${y + 26} Q 150 ${y} 190 ${y} Z`} fill={G2} />
      <path d={`M 196 ${y + 8} L ${W + 80} ${y + 8}`} stroke={WH} strokeOpacity={0.4} strokeWidth={2} />
      <path d={`M 300 ${y + 34} L ${W + 80} ${y + 34}`} stroke={WH} strokeOpacity={0.12} strokeWidth={1.4} />
      <path d={`M 470 ${y + t - 24} L ${W + 80} ${y + t - 24}`} stroke={K} strokeOpacity={0.35} strokeWidth={1.4} />
    </g>
  );
}
