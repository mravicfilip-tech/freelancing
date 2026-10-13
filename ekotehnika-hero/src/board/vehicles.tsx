// Vehicles for the storyboard board frames, drawn in the same flat technical vector style as the
// variant 2 drawings. Red appears only on a truck's rear shell, everything else is ink, the greys
// and white, per the colour rulings in studio/clients/ekotehnika/taste.md.
// The forklift is the real ForkliftSide from variant 2. The reach truck, pallet truck, order
// picker, delivery truck and service van are new and live here.
import type { ReactNode } from 'react';
import { C } from '../tokens';
import { ForkliftSide, LoadSide, PalletSide, Wheel } from '../variants/v2/art';

const R = C.lindeRed;
const RD = C.primary700;
const RDD = C.primary900;
const RH = C.tonedRed;
const K = C.ink;
const G = C.textGrey;
const G2 = C.tonedTextGrey;
const LG = C.lightGrey;
const SG = C.shadeGrey;
const W = C.white;

// A tyre drawn by the shared Wheel at a different size. Wheel is built around r 30.
function Tyre({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${r / 30})`}>
      <Wheel r={30} />
    </g>
  );
}

// The vertical red shell gradient shared by every new truck.
export function BoardDefs() {
  return (
    <defs>
      <linearGradient id="bd-red" x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor={RH} />
        <stop offset={0.2} stopColor={R} />
        <stop offset={0.8} stopColor={R} />
        <stop offset={1} stopColor={RD} />
      </linearGradient>
      <linearGradient id="bd-mast" x1={0} y1={0} x2={1} y2={0}>
        <stop offset={0} stopColor={G2} />
        <stop offset={0.5} stopColor={G} />
        <stop offset={1} stopColor={K} />
      </linearGradient>
      <filter id="bd-ghost" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
      </filter>
      {/* worn trucks, every colour pulled to a faded grey */}
      <filter id="bd-worn" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="0.72" intercept="0.28" />
          <feFuncG type="linear" slope="0.72" intercept="0.29" />
          <feFuncB type="linear" slope="0.72" intercept="0.30" />
        </feComponentTransfer>
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------------------------
// The counterbalance forklift, placed by box. x is the left edge of its 402 unit drawing box, w the
// width in scene units, so a 58 wide truck is 58 units from rear to fork tip.

const FORK_W = 402;
const FORK_REAR = 218;

// Scuffs, dents and grime over the rear shell and frame, in the forklift's own centimetre units.
function Scuffs() {
  return (
    <g strokeLinecap="round" fill="none">
      {/* long scratches over the counterweight */}
      <path d="M -208 -112 L -176 -86" stroke={SG} strokeWidth={1.6} opacity={0.9} />
      <path d="M -204 -96 L -186 -82" stroke={G} strokeWidth={1.2} opacity={0.7} />
      <path d="M -170 -118 L -148 -100 L -142 -96" stroke={SG} strokeWidth={1.4} opacity={0.9} />
      <path d="M -190 -70 L -168 -76" stroke={K} strokeWidth={1.1} opacity={0.4} />
      <path d="M -134 -118 L -118 -112" stroke={SG} strokeWidth={1.2} opacity={0.8} />
      <path d="M -98 -100 L -72 -96" stroke={SG} strokeWidth={1.4} opacity={0.8} />
      <path d="M -150 -52 L -110 -56 L -96 -52" stroke={K} strokeWidth={1} opacity={0.35} />
      {/* a dent and a paint chip */}
      <path d="M -214 -62 Q -204 -70 -208 -52 Z" fill={K} stroke="none" opacity={0.35} />
      <ellipse cx={-186} cy={-30} rx={8} ry={4} fill={K} stroke="none" opacity={0.28} />
      <path d="M -118 -40 L -108 -46 L -104 -38 Z" fill={LG} stroke="none" opacity={0.9} />
      <path d="M -62 -96 L -54 -100 L -52 -92 Z" fill={LG} stroke="none" opacity={0.9} />
      {/* grime along the sill and the floor plate */}
      <rect x={-124} y={-42} width={88} height={6} fill={K} stroke="none" opacity={0.22} />
      <rect x={-34} y={-62} width={50} height={6} fill={K} stroke="none" opacity={0.18} />
      {/* chips on the guard posts, the mast and the forks */}
      <circle cx={-125} cy={-190} r={2.4} fill={LG} stroke="none" />
      <circle cx={25} cy={-196} r={2.2} fill={LG} stroke="none" />
      <circle cx={41} cy={-120} r={2} fill={SG} stroke="none" />
      <path d="M 150 -1 L 166 -1" stroke={SG} strokeWidth={1.2} opacity={0.9} />
      <path d="M 30 -170 L 30 -150" stroke={SG} strokeWidth={1.2} opacity={0.8} />
      {/* faded sticker residue on the side panel */}
      <rect x={-112} y={-82} width={16} height={9} fill={SG} stroke="none" opacity={0.55} />
    </g>
  );
}

export type ForkProps = {
  x: number;
  w: number;
  /** Ground offset in scene units, negative lifts the truck. */
  y?: number;
  /** Mirror the truck so it faces left. The drawing box stays at x to x plus w. */
  flip?: boolean;
  /** 0 is the worn truck, 1 is the new one. Anything between blends the two. */
  k?: number;
  lift?: number;
  load?: ReactNode;
  opacity?: number;
  scuffs?: number;
  /** Ground line of the frame the truck is drawn in, 186 in scene space, 0 inside the delivery truck. */
  g?: number;
};

export function Fork({ x, w, y = 0, flip = false, k = 1, lift = 0, load, opacity = 1, scuffs, g = 186 }: ForkProps) {
  const sc = w / FORK_W;
  const ox = flip ? x + w - FORK_REAR * sc : x + FORK_REAR * sc;
  const sx = flip ? -sc : sc;
  const showScuffs = scuffs ?? 1 - k;
  const truck = <ForkliftSide lift={lift} load={load} />;
  return (
    <g transform={`translate(${ox} ${g + y}) scale(${sx} ${sc})`} opacity={opacity}>
      {k < 1 && (
        <g filter="url(#bd-worn)">
          {truck}
          <g opacity={Math.min(1, showScuffs * 1.2)}>
            <Scuffs />
          </g>
        </g>
      )}
      {k > 0 && <g opacity={k}>{truck}</g>}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Shared helper that places a centimetre drawing by box in scene units. The drawing spans x0 to x1
// in its own units, ground at y 0.

type BoxProps = { x: number; w: number; x0: number; x1: number; y?: number; opacity?: number; flip?: boolean; children: ReactNode };

function Boxed({ x, w, x0, x1, y = 0, opacity = 1, flip = false, children }: BoxProps) {
  const sc = w / (x1 - x0);
  const ox = flip ? x + w + x0 * sc : x - x0 * sc;
  return (
    <g transform={`translate(${ox} ${186 + y}) scale(${flip ? -sc : sc} ${sc})`} opacity={opacity}>
      {children}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Reach truck, side view, centimetres, facing +x. Red rear body, ink frame, a tall triple mast and
// a reach carriage on two crossed arms. lift raises the carriage.

export function ReachSide({ lift = 0, load }: { lift?: number; load?: ReactNode }) {
  const H = 440;
  const off = Math.max(0, lift - 150);
  return (
    <g>
      <ellipse cx={-30} cy={1} rx={170} ry={4} fill={SG} />
      {/* far guard post and far leg give depth */}
      <line x1={-168} y1={-218} x2={-168} y2={-120} stroke={G} strokeWidth={5} strokeLinecap="round" />
      <rect x={-60} y={-24} width={190} height={5} fill={G2} />
      {/* outriggers (legs) running forward under the load, load wheel at the tip */}
      <path d="M -66 -26 L 126 -26 Q 134 -26 134 -18 L 134 -10 L -66 -10 Z" fill={K} />
      <rect x={-66} y={-26} width={192} height={2} fill={G} />
      <Tyre cx={112} cy={-10} r={10} />
      {/* rear body, red shell over an ink plinth */}
      <path d="M -180 -22 L -180 -92 Q -180 -112 -162 -112 L -90 -112 Q -76 -112 -70 -100 L -62 -86 L -62 -22 Z" fill="url(#bd-red)" />
      <path d="M -180 -62 L -180 -92 Q -180 -112 -162 -112 L -150 -112 L -150 -62 Z" fill={RD} opacity={0.5} />
      {[-100, -93, -86, -79].map((vy) => (
        <line key={vy} x1={-172} y1={vy} x2={-156} y2={vy} stroke={RDD} strokeWidth={1.4} strokeLinecap="round" />
      ))}
      <path d="M -162 -112 L -90 -112" stroke={RH} strokeWidth={1.6} fill="none" />
      <path d="M -180 -66 L -62 -66" stroke={RDD} strokeWidth={0.6} />
      <path d="M -142 -100 L -76 -100 L -72 -72 L -140 -72 Z" fill={G} stroke={K} strokeWidth={0.7} />
      <line x1={-141} y1={-103} x2={-77} y2={-103} stroke={SG} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={-124} y={-92} width={26} height={9} rx={2} fill={G2} />
      <rect x={-130} y={-60} width={50} height={4} fill={RDD} opacity={0.5} />
      <rect x={-182} y={-80} width={4} height={14} rx={1} fill={G} stroke={K} strokeWidth={0.6} />
      {/* wheel arch and the drive tyre */}
      <path d="M -164 -22 A 29 29 0 0 1 -106 -22 Z" fill={K} />
      <Tyre cx={-135} cy={-21} r={21} />
      {/* operator floor and chassis between body and mast */}
      <rect x={-62} y={-38} width={74} height={14} fill={K} />
      <rect x={-62} y={-38} width={74} height={2} fill={G} />
      <rect x={-58} y={-50} width={40} height={12} fill={K} />
      <rect x={-52} y={-52} width={28} height={3} fill={G} />
      {/* seat */}
      <rect x={-148} y={-122} width={54} height={10} rx={3} fill={K} />
      <path d="M -150 -122 L -156 -180 Q -157 -186 -151 -186 L -142 -186 Q -137 -186 -137 -180 L -138 -124 Z" fill={K} />
      <path d="M -152 -168 L -141 -168" stroke={G} strokeWidth={0.8} />
      <path d="M -153 -152 L -140 -152" stroke={G} strokeWidth={0.8} />
      {/* console, armrest and the steering lever */}
      <rect x={-96} y={-142} width={36} height={8} rx={3} fill={K} />
      <line x1={-82} y1={-142} x2={-82} y2={-120} stroke={K} strokeWidth={6} strokeLinecap="round" />
      <path d="M -84 -142 L -78 -170 Q -77 -176 -71 -174 L -66 -173" fill="none" stroke={K} strokeWidth={5} strokeLinecap="round" />
      <circle cx={-66} cy={-173} r={3.6} fill={G2} />
      <rect x={-34} y={-62} width={6} height={12} fill={G} />
      {/* overhead guard */}
      <line x1={-172} y1={-222} x2={-162} y2={-114} stroke={K} strokeWidth={7} strokeLinecap="round" />
      <line x1={-8} y1={-222} x2={-14} y2={-52} stroke={K} strokeWidth={7} strokeLinecap="round" />
      <rect x={-180} y={-230} width={178} height={9} rx={3} fill={K} />
      <line x1={-174} y1={-228} x2={-8} y2={-228} stroke={G} strokeWidth={1} />
      {[-160, -138, -116, -94, -72, -50, -28].map((hx) => (
        <line key={hx} x1={hx} y1={-221} x2={hx - 2} y2={-214} stroke={G} strokeWidth={1.2} />
      ))}
      <rect x={-12} y={-240} width={11} height={10} rx={1.5} fill={SG} stroke={G2} strokeWidth={0.6} />
      <rect x={-178} y={-240} width={11} height={10} rx={1.5} fill={LG} stroke={G2} strokeWidth={0.6} />
      {/* mast, outer to inner */}
      <rect x={6} y={-H} width={22} height={H - 12} fill="url(#bd-mast)" />
      <rect x={8} y={-H} width={2} height={H - 12} fill={SG} opacity={0.7} />
      <g transform={`translate(0 ${-off})`}>
        <rect x={10} y={-H + 6} width={14} height={H - 40} fill={G2} stroke={G} strokeWidth={0.6} />
        <rect x={4} y={-H - 4} width={26} height={7} fill={K} />
        <circle cx={34} cy={-H + 2} r={5.5} fill={SG} stroke={K} strokeWidth={1.5} />
      </g>
      {[-400, -340, -280, -220, -160, -100, -50].map((ty) => (
        <rect key={ty} x={5} y={ty} width={24} height={3} fill={K} />
      ))}
      <rect x={2} y={-22} width={32} height={10} rx={2} fill={K} />
      <line x1={38} y1={-H + 2} x2={38} y2={-lift - 66} stroke={K} strokeWidth={1.8} strokeDasharray="2.2 1.1" />
      {/* reach carriage, the two crossed arms and the fork heel */}
      <g transform={`translate(0 ${-lift})`}>
        <rect x={28} y={-108} width={10} height={104} fill={K} />
        <path d="M 38 -96 L 66 -30 M 38 -30 L 66 -96" stroke={G} strokeWidth={4} fill="none" />
        <path d="M 38 -96 L 66 -30 M 38 -30 L 66 -96" stroke={K} strokeWidth={2} fill="none" />
        <rect x={64} y={-102} width={8} height={104} fill={K} />
        <rect x={66} y={-98} width={2} height={92} fill={G} />
        {load}
        <path d="M 64 -6 L 180 -6 Q 192 -6 192 0 L 192 2 L 64 2 Z" fill={G} />
        <line x1={70} y1={-3.6} x2={188} y2={-3.6} stroke={G2} strokeWidth={0.9} />
        <circle cx={68} cy={-86} r={1.3} fill={G2} />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Electric pallet truck in the MT15 C style, side view, centimetres, facing +x. A low red power
// unit at the rear, the tiller rising behind it, fork blades under the pallet.

export function PalletTruckSide({ load = true, lift = 10 }: { load?: boolean; lift?: number }) {
  const top = lift + 9;
  return (
    <g>
      <ellipse cx={60} cy={1} rx={112} ry={3.4} fill={SG} />
      {/* the pallet and its load sit on the blades, the blades show through the pallet openings */}
      {load && <LoadSide x={50} y={-lift} kind="cartons" />}
      {!load && <PalletSide x={50} y={-lift} />}
      {/* blades */}
      <path d={`M 44 -${top} L 160 -${top} Q 172 -${top} 172 -${lift + 4} L 172 -${lift} L 44 -${lift} Z`} fill={G} />
      <line x1={50} y1={-top + 2.4} x2={166} y2={-top + 2.4} stroke={G2} strokeWidth={0.8} />
      <Tyre cx={156} cy={-6} r={6} />
      {/* power unit, red shell */}
      <path d="M 0 -8 L 0 -62 Q 0 -72 10 -72 L 36 -72 Q 48 -72 48 -60 L 48 -8 Q 48 -2 42 -2 L 6 -2 Q 0 -2 0 -8 Z" fill="url(#bd-red)" />
      <path d="M 0 -30 L 0 -62 Q 0 -72 10 -72 L 14 -72 L 14 -30 Z" fill={RD} opacity={0.5} />
      <rect x={-2} y={-76} width={52} height={7} rx={3} fill={K} />
      <path d="M 18 -60 L 44 -60 L 44 -26 L 18 -26 Z" fill={G} stroke={K} strokeWidth={0.7} />
      <line x1={19} y1={-57} x2={43} y2={-57} stroke={SG} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={24} y={-50} width={14} height={7} rx={1.5} fill={G2} />
      {[-64, -60].map((vy) => (
        <line key={vy} x1={4} y1={vy} x2={11} y2={vy} stroke={RDD} strokeWidth={1.2} strokeLinecap="round" />
      ))}
      <rect x={-2} y={-12} width={52} height={5} rx={2} fill={K} />
      <Tyre cx={24} cy={-11} r={11} />
      {/* tiller rising behind the unit with the grip head */}
      <path d="M 10 -76 L -34 -122" stroke={K} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M 10 -76 L -34 -122" stroke={G} strokeWidth={1.2} strokeLinecap="round" />
      <rect x={-52} y={-132} width={34} height={13} rx={6} fill={K} transform="rotate(-24 -35 -126)" />
      <rect x={-46} y={-130} width={22} height={5} rx={2.5} fill={G} transform="rotate(-24 -35 -126)" />
      <circle cx={-31} cy={-134} r={2.4} fill={W} />
      <circle cx={-41} cy={-128} r={2.4} fill={SG} />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Order picker, side view, centimetres, facing +x. Red power unit at the rear, an operator cab with
// side rails and an overhead guard that rises with the forks on one mast.

export function PickerSide({ lift = 120, load }: { lift?: number; load?: ReactNode }) {
  const H = Math.max(440, lift + 300);
  return (
    <g>
      <ellipse cx={-10} cy={1} rx={170} ry={4} fill={SG} />
      {/* legs and the front load wheels */}
      <path d="M -40 -26 L 150 -26 Q 158 -26 158 -18 L 158 -10 L -40 -10 Z" fill={K} />
      <rect x={-40} y={-26} width={190} height={2} fill={G} />
      <Tyre cx={134} cy={-10} r={10} />
      {/* rear power unit, red shell */}
      <path d="M -182 -22 L -182 -86 Q -182 -104 -166 -104 L -70 -104 L -50 -86 L -50 -22 Z" fill="url(#bd-red)" />
      <path d="M -182 -56 L -182 -86 Q -182 -104 -166 -104 L -150 -104 L -150 -56 Z" fill={RD} opacity={0.5} />
      {[-94, -87, -80].map((vy) => (
        <line key={vy} x1={-174} y1={vy} x2={-158} y2={vy} stroke={RDD} strokeWidth={1.4} strokeLinecap="round" />
      ))}
      <path d="M -166 -104 L -70 -104" stroke={RH} strokeWidth={1.6} fill="none" />
      <path d="M -182 -60 L -50 -60" stroke={RDD} strokeWidth={0.6} />
      <path d="M -140 -92 L -64 -92 L -58 -66 L -138 -66 Z" fill={G} stroke={K} strokeWidth={0.7} />
      <line x1={-139} y1={-95} x2={-66} y2={-95} stroke={SG} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={-122} y={-84} width={26} height={9} rx={2} fill={G2} />
      <path d="M -168 -22 A 29 29 0 0 1 -110 -22 Z" fill={K} />
      <Tyre cx={-139} cy={-21} r={21} />
      {/* mast, two uprights and the cross members */}
      <rect x={2} y={-H} width={24} height={H - 12} fill="url(#bd-mast)" />
      <rect x={4} y={-H} width={2} height={H - 12} fill={SG} opacity={0.7} />
      <rect x={9} y={-H + 6} width={14} height={H - 40} fill={G2} stroke={G} strokeWidth={0.6} />
      {[-H + 20, -H + 90, -H + 160, -H + 230, -H + 300].map((ty) => (
        <rect key={ty} x={1} y={ty} width={26} height={3} fill={K} />
      ))}
      <rect x={-2} y={-22} width={34} height={10} rx={2} fill={K} />
      <line x1={32} y1={-H + 4} x2={32} y2={-lift - 8} stroke={K} strokeWidth={1.8} strokeDasharray="2.2 1.1" />
      {/* the cab and the forks travel together */}
      <g transform={`translate(0 ${-lift})`}>
        {/* platform */}
        <rect x={-96} y={-10} width={98} height={10} fill={K} />
        <rect x={-96} y={-10} width={98} height={1.6} fill={G} />
        <rect x={-104} y={-4} width={8} height={6} fill={G2} />
        {/* side rails and gate */}
        <line x1={-94} y1={-10} x2={-94} y2={-214} stroke={K} strokeWidth={6} strokeLinecap="round" />
        <line x1={-4} y1={-10} x2={-4} y2={-214} stroke={K} strokeWidth={6} strokeLinecap="round" />
        <line x1={-94} y1={-62} x2={-4} y2={-62} stroke={K} strokeWidth={4} />
        <line x1={-94} y1={-108} x2={-4} y2={-108} stroke={K} strokeWidth={5} />
        <rect x={-92} y={-100} width={86} height={34} fill={LG} opacity={0.5} />
        {[-80, -64, -48, -32, -16].map((gx) => (
          <line key={gx} x1={gx} y1={-62} x2={gx} y2={-100} stroke={G2} strokeWidth={1} />
        ))}
        {/* overhead guard */}
        <rect x={-102} y={-224} width={106} height={9} rx={3} fill={K} />
        <line x1={-96} y1={-222} x2={-2} y2={-222} stroke={G} strokeWidth={1} />
        {[-90, -74, -58, -42, -26, -10].map((hx) => (
          <line key={hx} x1={hx} y1={-215} x2={hx - 2} y2={-208} stroke={G} strokeWidth={1.2} />
        ))}
        <rect x={-100} y={-234} width={11} height={10} rx={1.5} fill={LG} stroke={G2} strokeWidth={0.6} />
        {/* control head and the fork carriage fixed to the cab front */}
        <rect x={-22} y={-132} width={20} height={26} rx={4} fill={K} />
        <rect x={-18} y={-128} width={12} height={5} rx={1} fill={G2} />
        <rect x={0} y={-60} width={10} height={64} fill={K} />
        <rect x={2} y={-56} width={2} height={56} fill={G} />
        {load}
        <path d="M 10 -6 L 150 -6 Q 162 -6 162 0 L 162 2 L 10 2 Z" fill={G} />
        <line x1={16} y1={-3.6} x2={156} y2={-3.6} stroke={G2} strokeWidth={0.9} />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// The Ekotehnika delivery truck, a box body in side view with a cutaway window so a forklift can
// ride inside. Scene units, ground at y 0 of the local frame, rear at x 0, cab on the right. Place it
// with x. children render inside the cutaway, in the truck's local frame, so a forklift can be
// drawn at floor level y -13.

const BOX_R = 88;
export const BED = 17;
const BOX_T = -(BED + 46);
const WIN_T = BOX_T + 14;

export function DeliveryTruck({ x, ramp = 0, children, opacity = 1 }: { x: number; ramp?: number; children?: ReactNode; opacity?: number }) {
  // ramp 0 is closed against the rear door, 1 is down to the floor.
  const RAMP_L = 36;
  const down = (Math.asin(BED / RAMP_L) * 180) / Math.PI;
  const ang = 90 - ramp * (90 + down);
  const cabTop = -(BED + 39);
  return (
    <g transform={`translate(${x} 186)`} opacity={opacity}>
      <ellipse cx={62} cy={1.2} rx={72} ry={1.5} fill={G2} opacity={0.18} />
      {/* box shell and the interior seen through the cutaway */}
      <rect x={0} y={BOX_T} width={BOX_R} height={46} rx={1.6} fill={W} stroke={K} strokeWidth={0.5} />
      <rect x={1.5} y={WIN_T} width={BOX_R - 3} height={-WIN_T - BED - 0.5} fill={LG} />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={6 + i * 6.2} y1={WIN_T} x2={6 + i * 6.2} y2={-BED - 0.5} stroke={G2} strokeWidth={0.18} opacity={0.5} />
      ))}
      <rect x={1.5} y={-BED - 3} width={BOX_R - 3} height={2.6} fill={SG} />
      {/* cargo sits between the interior and the front frame */}
      {children}
      {/* frame of the cutaway and the wordmark band */}
      <path d={`M 1.5 ${WIN_T} H ${BOX_R - 1.5} V ${-BED - 0.5} H 1.5 Z`} fill="none" stroke={K} strokeWidth={0.45} />
      <rect x={0} y={-BED - 0.5} width={BOX_R} height={1} fill={G2} opacity={0.6} />
      <line x1={0.6} y1={WIN_T - 5} x2={BOX_R - 0.6} y2={WIN_T - 5} stroke={SG} strokeWidth={0.35} />
      <text x={BOX_R / 2} y={WIN_T - 5.6} textAnchor="middle" fontFamily="Geist, sans-serif" fontSize={6.6} fontWeight={500} letterSpacing={0.5} fill={K}>
        EKOTEHNIKA
      </text>
      {/* chassis rail */}
      <rect x={-1} y={-BED} width={112} height={3.4} fill={K} />
      <rect x={104} y={-BED + 3.4} width={14} height={3} fill={K} />
      {/* rear lamps and the underrun bar */}
      <rect x={-1.4} y={-28} width={1.6} height={4} rx={0.6} fill={G} stroke={K} strokeWidth={0.25} />
      <rect x={-2} y={-8.6} width={6} height={1.6} fill={K} />
      {/* cab */}
      <path d={`M 90.5 ${-BED} V ${cabTop + 4} Q 90.5 ${cabTop} 94.5 ${cabTop} H 108 L 121.5 ${-BED - 17} V ${-BED} Z`} fill={W} stroke={K} strokeWidth={0.5} strokeLinejoin="round" />
      <path d={`M 95 ${cabTop + 4.5} H 107 L 116.5 ${-BED - 18} H 95 Z`} fill={LG} stroke={G2} strokeWidth={0.3} />
      <path d={`M 95 ${cabTop + 4.5} L 99 ${cabTop + 4.5} L 99 ${-BED - 18} L 95 ${-BED - 18} Z`} fill={SG} opacity={0.7} />
      <line x1={94.5} y1={-BED - 14} x2={94.5} y2={-BED - 1} stroke={SG} strokeWidth={0.4} />
      <line x1={94.5} y1={-BED - 14} x2={116} y2={-BED - 14} stroke={SG} strokeWidth={0.4} />
      <rect x={96.6} y={-BED - 12} width={4} height={1.1} rx={0.5} fill={G2} />
      <rect x={118.6} y={-BED - 11.6} width={3.2} height={3.6} rx={0.8} fill={W} stroke={G2} strokeWidth={0.3} />
      <rect x={119} y={-BED - 1.5} width={4.4} height={2.6} rx={0.8} fill={K} />
      <rect x={88.6} y={cabTop + 6} width={2.2} height={6} rx={0.8} fill={K} />
      {/* wheel arches and the three axles */}
      {[20, 34, 108].map((wx) => (
        <g key={wx}>
          <path d={`M ${wx - 9.6} -8 A 9.6 9.6 0 0 1 ${wx + 9.6} -8 Z`} fill={K} />
          <Tyre cx={wx} cy={-8} r={8} />
        </g>
      ))}
      {/* ramp, hinged at the rear floor edge */}
      <g transform={`translate(0 ${-BED}) rotate(${ang})`}>
        <rect x={-RAMP_L} y={-1.4} width={RAMP_L} height={2.8} rx={0.6} fill={K} />
        <rect x={-RAMP_L} y={-1.4} width={RAMP_L} height={0.6} fill={G} />
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1={-3 - i * 3.3} y1={-0.8} x2={-3 - i * 3.3} y2={1} stroke={G} strokeWidth={0.35} />
        ))}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// A small service van for the Servis map and the pit stop. Scene units, w wide, facing right.

export function Van({ x, y = 0, w = 30, opacity = 1 }: { x: number; y?: number; w?: number; opacity?: number }) {
  const sc = w / 80;
  return (
    <g transform={`translate(${x} ${186 + y}) scale(${sc})`} opacity={opacity}>
      <ellipse cx={42} cy={3} rx={46} ry={2.4} fill={G2} opacity={0.18} />
      <path d="M 2 -42 Q 2 -44 4 -44 H 50 L 70 -26 L 77 -23 V -9 H 2 Z" fill={W} stroke={K} strokeWidth={1.8} strokeLinejoin="round" />
      <rect x={2} y={-26} width={50} height={4} fill={SG} />
      <path d="M 54 -37 L 66 -26 H 54 Z" fill={LG} stroke={G2} strokeWidth={0.8} />
      <path d="M 40 -44 V -9" stroke={SG} strokeWidth={1.4} />
      <rect x={72} y={-22} width={6} height={5} rx={1.4} fill={W} stroke={G2} strokeWidth={1} />
      <rect x={74} y={-9} width={5} height={4} fill={K} />
      <rect x={0} y={-9} width={6} height={4} fill={K} />
      <g transform="translate(12 -40) scale(0.46)">
        <ServiceMark />
      </g>
      <path d="M 7 -9 A 11 11 0 0 1 29 -9 Z" fill={K} />
      <path d="M 51 -9 A 11 11 0 0 1 73 -9 Z" fill={K} />
      <Tyre cx={18} cy={-8} r={8.5} />
      <Tyre cx={62} cy={-8} r={8.5} />
    </g>
  );
}

// The wrench mark on the van side, drawn once in ink so it reads as a service van.
function ServiceMark() {
  return (
    <g fill="none" stroke={K} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 6 A9 9 0 0 0 20 18 L6 32 A3.5 3.5 0 0 0 11 37 L25 23 A9 9 0 0 0 37 13 L31 18 L26 17 L25 12 Z" />
    </g>
  );
}

export { Boxed };
