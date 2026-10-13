// Inside the warehouse. First a side view with a forklift driving past a row of racks, then the camera lowers
// into the aisle and runs down the middle of it in one point perspective, toward a forklift seen from the
// front. Variant 2 flat vector style, token fills only.
import { memo, type ReactNode, type Ref } from 'react';
import { ForkliftFront, ForkliftSide, LoadSide, RackSide } from '../../../variants/v2/art';
import { W, H, K, G, G2, LG, SG, HG, WH } from './frame';

// ---- side view ---------------------------------------------------------------------------------------------
// Stretch film over a pallet load, straight diagonal turns and two flat bands, drawn as exact lines. h is the height of the load.
const Film = ({ x, y, h, k }: { x: number; y: number; h: number; k: string }) => {
  const turns: ReactNode[] = [];
  for (let i = -h; i < 120; i += 12) turns.push(<line key={i} x1={i} y1={-14.4} x2={i + h * 0.9} y2={-14.4 - h} />);
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={`lj-film-${k}`}>
        <rect x={1} y={-14.4 - h} width={118} height={h} />
      </clipPath>
      <g clipPath={`url(#lj-film-${k})`} fill="none">
        <g stroke={WH} strokeOpacity={0.9} strokeWidth={1}>{turns}</g>
        <g stroke={G2} strokeOpacity={0.3} strokeWidth={1} transform="translate(2 0)">{turns}</g>
        {[0.34, 0.68].map((f) => (
          <line key={f} x1={1} y1={-14.4 - h * f} x2={119} y2={-14.4 - h * f} stroke={G2} strokeOpacity={0.45} strokeWidth={1.4} />
        ))}
      </g>
      <rect x={1} y={-14.4 - h} width={118} height={h} fill="none" stroke={G2} strokeOpacity={0.55} strokeWidth={1} />
    </g>
  );
};

// A pallet label, a white plate with a bar code and its number, on the face of a load. Numbers are bay and level codes.
const PalletTag = ({ x, y, code }: { x: number; y: number; code: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={34} height={20} fill={WH} stroke={G2} strokeOpacity={0.8} strokeWidth={1} />
    {[3, 6, 8, 11, 13, 16, 19, 22, 25, 29].map((bx, i) => (
      <line key={bx} x1={bx + 2} y1={3} x2={bx + 2} y2={9} stroke={K} strokeWidth={i % 3 === 0 ? 1.6 : 0.8} />
    ))}
    {[3, 8, 14, 21].map((bx) => (
      <line key={bx} x1={bx + 3} y1={13} x2={bx + 3 + (code.length % 5)} y2={13} stroke={K} strokeWidth={1.2} />
    ))}
    <line x1={4} y1={17} x2={30} y2={17} stroke={G2} strokeWidth={1.2} />
  </g>
);

const LOAD_H: Record<string, number> = { wrap: 70, crates: 64, cartons: 64, tall: 106 };

const RackRow = memo(function RackRow() {
  const kinds = ['wrap', 'crates', 'cartons', 'tall'] as const;
  return (
    <g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <RackSide key={i} x={i * 250} levels={[150, 300, 450]} height={470}>
          {[0, 150, 300, 450].map((lv, j) => {
            if ((i + j) % 5 === 3) return null;
            const kind = kinds[(i + j) % 4];
            return (
              <g key={lv}>
                <LoadSide x={-5} y={-lv} kind={kind} />
                {kind !== 'crates' && <Film x={-5} y={-lv} h={LOAD_H[kind]} k={`${i}${j}`} />}
                {kind !== 'wrap' && <PalletTag x={-5 + 70} y={-lv - 52} code={`A${i + 1}-0${j + 1}`} />}
              </g>
            );
          })}
          {/* the bay sign on the top beam, the aisle code and the beam levels */}
          <rect x={8} y={-512} width={94} height={30} fill={WH} stroke={K} strokeWidth={2} />
          <text x={55} y={-491} textAnchor="middle" fontSize={20} fontWeight={600} fill={K} letterSpacing="1.5" style={{ fontFamily: 'inherit' }}>
            {`A-0${i + 1}`}
          </text>
          {[150, 300, 450].map((lv, li) => (
            <g key={lv}>
              <rect x={-26} y={-lv - 20} width={20} height={16} fill={WH} stroke={G2} strokeWidth={1} />
              <text x={-16} y={-lv - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill={K} style={{ fontFamily: 'inherit' }}>
                {`0${li + 1}`}
              </text>
            </g>
          ))}
        </RackSide>
      ))}
    </g>
  );
});

export type SideRefs = {
  wheelF: Ref<SVGGElement>;
  wheelR: Ref<SVGGElement>;
  inner: Ref<SVGGElement>;
  rod: Ref<SVGRectElement>;
  chain: Ref<SVGLineElement>;
  carriage: Ref<SVGGElement>;
};

const IndoorTruck = memo(function IndoorTruck({ refs }: { refs: SideRefs }) {
  return <ForkliftSide parts={refs} load={<LoadSide x={66} y={10} kind="tall" />} />;
});

export const SIDE_GY = 742;
export const SIDE_S = 1.3;

export function SideRoom({ axle, refs, top }: { axle: number; refs: SideRefs; top: number }) {
  // the racks with their bay signs stay under the grid rule at the top
  const rs = Math.min(1.2, (700 - top - 16) / 520);
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={HG} />
      <rect x={0} y={0} width={W} height={150} fill={LG} />
      {[160, 520, 880, 1240].map((lx) => (
        <rect key={lx} x={lx} y={64} width={150} height={7} rx={3} fill={WH} />
      ))}
      <line x1={0} y1={150} x2={W} y2={150} stroke={G2} strokeOpacity={0.35} strokeWidth={1.4} />
      <g transform={`translate(70 700) scale(${rs.toFixed(4)})`}>
        <RackRow />
      </g>
      <rect x={0} y={700} width={W} height={H - 700} fill={SG} />
      <rect x={0} y={700} width={W} height={16} fill={G2} opacity={0.14} />
      <line x1={0} y1={700} x2={W} y2={700} stroke={G2} strokeOpacity={0.55} strokeWidth={1.6} />
      <line x1={0} y1={840} x2={W} y2={840} stroke={WH} strokeWidth={5} strokeDasharray="110 150" opacity={0.9} />
      <g transform={`translate(${axle.toFixed(1)} ${SIDE_GY}) scale(${SIDE_S})`}>
        <IndoorTruck refs={refs} />
      </g>
    </g>
  );
}

// ---- the aisle in perspective --------------------------------------------------------------------------------
const F = 1000;
const CX = W / 2;
const HALF = 190;
const BAY = 130;
const LEVELS = [18, 168, 318, 468, 618];
const NEAR = 28;

export type Cam = { hC: number; yH: number; zc: number };

const quad = (cam: Cam, X: number, Y0: number, Y1: number, Z0: number, Z1: number) => {
  const p = (Y: number, Z: number) => `${(CX + (X * F) / Z).toFixed(1)},${(cam.yH + ((cam.hC - Y) * F) / Z).toFixed(1)}`;
  return `${p(Y0, Z0)} ${p(Y1, Z0)} ${p(Y1, Z1)} ${p(Y0, Z1)}`;
};
const quadX = (cam: Cam, X0: number, X1: number, Y0: number, Y1: number, Z: number) => {
  const p = (X: number, Y: number) => `${(CX + (X * F) / Z).toFixed(1)},${(cam.yH + ((cam.hC - Y) * F) / Z).toFixed(1)}`;
  return `${p(X0, Y0)} ${p(X1, Y0)} ${p(X1, Y1)} ${p(X0, Y1)}`;
};
const quadFloor = (cam: Cam, X0: number, X1: number, Z0: number, Z1: number, Y = 0) => {
  const p = (X: number, Z: number) => `${(CX + (X * F) / Z).toFixed(1)},${(cam.yH + ((cam.hC - Y) * F) / Z).toFixed(1)}`;
  return `${p(X0, Z0)} ${p(X1, Z0)} ${p(X1, Z1)} ${p(X0, Z1)}`;
};

export function Aisle({ cam }: { cam: Cam }) {
  const far = 3400;
  const out: ReactNode[] = [];
  const n0 = Math.floor(cam.zc / BAY);
  const n1 = Math.floor((cam.zc + far) / BAY);
  // far to near so near racks overdraw
  for (let n = n1; n >= n0; n--) {
    const z0 = n * BAY - cam.zc;
    const z1 = z0 + BAY;
    if (z1 < NEAR || z0 > far) continue;
    const za = Math.max(NEAR, z0);
    for (const s of [-1, 1]) {
      const Xi = s * HALF;
      // two loads in each level of the bay, side and front faces, and the beam under them
      for (let li = 0; li < LEVELS.length; li++) {
        const y = LEVELS[li];
        if (li < LEVELS.length - 1) {
          const zm = (z0 + z1) / 2;
          for (const [ci, ca, cb] of [[1, zm + 5, z1 - 8], [0, z0 + 8, zm - 5]] as const) {
            if ((n * 7 + li * 3 + ci * 5 + (s > 0 ? 1 : 0)) % 6 === 0) continue;
            const a = Math.max(NEAR, ca);
            if (cb <= a) continue;
            const hh = 96 + ((n + li + ci) % 3) * 16;
            const shade = (n + li + ci) % 3;
            const fx0 = Xi + s * 6;
            const fx1 = Xi + s * 86;
            const fy0 = y + 12;
            const fy1 = y + 12 + hh;
            const film: ReactNode[] = [];
            if (a < 1900) {
              const P2 = (u: number, v: number) => `${(CX + ((fx0 + (fx1 - fx0) * u) * F) / a).toFixed(1)},${(cam.yH + ((cam.hC - (fy0 + (fy1 - fy0) * v)) * F) / a).toFixed(1)}`;
              for (const [u0, v0, u1, v1] of [[0, 0.1, 0.55, 1], [0.35, 0, 0.95, 0.95], [0.65, 0, 1, 0.6]]) film.push(<polyline key={`${u0}`} points={`${P2(u0, v0)} ${P2(u1, v1)}`} fill="none" stroke={WH} strokeOpacity={0.9} strokeWidth={1} />);
              for (const v of [0.34, 0.68]) film.push(<polyline key={`b${v}`} points={`${P2(0, v)} ${P2(1, v)}`} fill="none" stroke={G2} strokeOpacity={0.5} strokeWidth={1} />);
            }
            out.push(
              <polygon key={`f${n}${s}${li}${ci}`} points={quadX(cam, Xi + s * 6, Xi + s * 86, y + 12, y + 12 + hh, a)} fill={SG} stroke={G2} strokeOpacity={0.5} strokeWidth={0.8} />,
              <g key={`w${n}${s}${li}${ci}`}>{film}</g>,
              <polygon key={`c${n}${s}${li}${ci}`} points={quad(cam, Xi + s * 6, y + 12, y + 12 + hh, a, cb)} fill={shade === 0 ? WH : shade === 1 ? LG : HG} stroke={G2} strokeOpacity={0.55} strokeWidth={0.9} />,
              <polygon key={`t${n}${s}${li}${ci}`} points={quad(cam, Xi + s * 6, y + 12 + hh * 0.5, y + 12 + hh * 0.58, a, cb)} fill={G2} opacity={0.2} />,
            );
          }
        }
        out.push(<polygon key={`b${n}${s}${li}`} points={quad(cam, Xi, y, y + 12, za, z1)} fill={G2} opacity={0.95} />);
      }
      // the upright at the near end of the bay, and its bay label, a white plate with a bar code on the beam
      if (z0 > NEAR) {
        out.push(<polygon key={`u${n}${s}`} points={quad(cam, Xi, 0, LEVELS[LEVELS.length - 1] + 90, z0, z0 + 9)} fill={K} />);
        const za2 = z0 + 14;
        const zb2 = z0 + 112;
        if (za2 > NEAR) {
          const pt = (Y: number, Z: number) => `${(CX + (Xi * F) / Z).toFixed(1)},${(cam.yH + ((cam.hC - Y) * F) / Z).toFixed(1)}`;
          out.push(<polygon key={`lp${n}${s}`} points={quad(cam, Xi, 28, 62, za2, zb2)} fill={WH} stroke={K} strokeWidth={1.2} />);
          for (let t = 0.12; t < 0.9; t += 0.1) {
            const z = za2 + (zb2 - za2) * t;
            out.push(<polyline key={`lb${n}${s}${t}`} points={`${pt(34, z)} ${pt(t * 10 % 2 < 1 ? 56 : 50, z)}`} fill="none" stroke={K} strokeWidth={0.9} />);
          }
        }
      }
    }
  }
  // floor, lane lines and joints
  const lanes: ReactNode[] = [];
  const jn0 = Math.floor(cam.zc / 260);
  for (let n = jn0; n < jn0 + Math.ceil(far / 260) + 1; n++) {
    const z = n * 260 - cam.zc;
    if (z < NEAR || z > far) continue;
    lanes.push(<polygon key={`j${n}`} points={quadFloor(cam, -HALF, HALF, z, z + 3)} fill={G2} opacity={0.3} />);
  }
  const d0 = Math.floor(cam.zc / 240);
  for (let n = d0; n < d0 + Math.ceil(far / 240) + 1; n++) {
    const za = Math.max(NEAR, n * 240 - cam.zc);
    const zb = n * 240 + 120 - cam.zc;
    if (zb < NEAR || za > far) continue;
    for (const s of [-1, 1]) lanes.push(<polygon key={`l${n}${s}`} points={quadFloor(cam, s * 118, s * 134, za, zb)} fill={G} opacity={0.55} />);
  }
  const vy = cam.yH;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={LG} />
      <rect x={0} y={vy - 90} width={W} height={H} fill={LG} />
      <rect x={CX - (300 * F) / far} y={vy + ((cam.hC - 760) * F) / far} width={(600 * F) / far} height={(760 * F) / far} fill={WH} />
      <polygon points={quadFloor(cam, -HALF, HALF, NEAR, far)} fill={SG} />
      {lanes}
      {out}
    </g>
  );
}

export const FrontTruck = memo(function FrontTruck() {
  return <ForkliftFront />;
});
