// Najam, the depot of rental forklifts seen from the front, three rows in marked bays filling row by row, one drawing across the
// full width under the spec row, with the floor lines of each row running to the frame edge. Each truck stands in a marked bay painted on the floor. Variant 2 flat vector style,
// token fills only. Red only on the truck shells.
import { memo, type ReactNode } from 'react';
import { ForkliftFront } from '../../../variants/v2/art';
import { K, G2, eout3, range } from './frame';
import type { Cols } from './stage';

const GridTruck = memo(function GridTruck() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={106} ry={10} fill={K} opacity={0.16} />
      <ForkliftFront />
    </g>
  );
});

const COLS = 8;
const ROWS = 3;
// each row further back is a little smaller and stands higher, as a floor seen from slightly above
const ROW_SCALE = [0.8, 0.9, 1];
const TRUCK_H = 232; // the front view, guard roof to the ground, in art units
const TRUCK_W = 128;

// Screen y of the top of the depot area, below the spec row of the shell, as a pixel from the stage top.
const AREA_TOP_PX = 520;

export function depotOf(c: Cols) {
  const left = c.left(1);
  const right = c.right(12);
  const top = c.vy(AREA_TOP_PX);
  const bottom = c.bottom - 14;
  const spacing = (right - left) / COLS;
  // three rows set half a bay apart, so the rows interlock and each row's feet stand half a truck height above the one in front
  const h = (bottom - top) / 1.8;
  const sc = Math.min(0.9, h / TRUCK_H, (0.8 * spacing) / TRUCK_W);
  const hh = TRUCK_H * sc;
  const foot = [bottom - hh, bottom - 0.5 * hh, bottom];
  return { left, right, top, bottom, spacing, sc, foot };
}

export function RentalGrid({ k, cols, id }: { k: number; cols: Cols; id: string }) {
  const d = depotOf(cols);
  const bays: ReactNode[] = [];
  const trucks: ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const rs = d.sc * ROW_SCALE[r];
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      // the middle row is set half a bay over, so the rows interlock and no truck stands behind another
      if (r === 1 && c === COLS - 1) continue;
      const cx = d.left + d.spacing * (c + (r === 1 ? 1 : 0.5));
      // the bay as a floor quad, wide at the front edge and narrower at the back
      const fy = d.foot[r] + 10 * rs;
      const by = d.foot[r] - 34 * rs;
      const fw = 0.5 * 0.86 * d.spacing * (0.8 + 0.2 * (rs / d.sc));
      const bw = fw * 0.9;
      bays.push(
        <polygon
          key={`b${i}`}
          points={`${(cx - fw).toFixed(1)},${fy.toFixed(1)} ${(cx + fw).toFixed(1)},${fy.toFixed(1)} ${(cx + bw).toFixed(1)},${by.toFixed(1)} ${(cx - bw).toFixed(1)},${by.toFixed(1)}`}
          fill="none"
          stroke={G2}
          strokeOpacity={0.5}
          strokeWidth={1}
        />,
      );
      const a = eout3(range(k, 0.1 + i * 0.047, 0.1 + i * 0.047 + 0.12));
      if (a <= 0.001) continue;
      // a truck is wiped up out of its bay from the floor line, a hard edge, no fade
      const hh = (TRUCK_H + 12) * rs;
      trucks.push(
        <g key={i}>
          <clipPath id={`${id}-${i}`}>
            <rect x={cx - 80 * rs} y={d.foot[r] + 6 * rs - hh * a} width={160 * rs} height={hh * a} />
          </clipPath>
          <g clipPath={`url(#${id}-${i})`}>
            <g transform={`translate(${cx.toFixed(1)} ${d.foot[r].toFixed(1)}) scale(${rs.toFixed(4)})`}>
              <GridTruck />
            </g>
          </g>
        </g>,
      );
    }
  }
  // a floor line at the foot of each row runs across the whole frame
  const floor = d.foot.map((fy, r) => <line key={`fl${r}`} x1={cols.x0 - 2} y1={fy + 10 * d.sc * ROW_SCALE[r]} x2={cols.x1 + 2} y2={fy + 10 * d.sc * ROW_SCALE[r]} stroke={G2} strokeOpacity={0.35} strokeWidth={1} />);
  return (
    <g>
      {floor}
      {bays}
      {trucks}
    </g>
  );
}
