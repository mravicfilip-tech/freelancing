// Flat technical vector drawings for V2 Linija, in the United Carriers reel's illustration style.
// Side view units are centimetres, ground at y 0, front axle at x 0, the truck faces +x.
// Every fill and stroke is a token from src/tokens.ts.
import type { ReactNode, Ref } from 'react';
import { C } from '../../tokens';

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

type GRef = Ref<SVGGElement>;

// A tyre seen side on, with tread blocks, sidewall, rim, bolts and hub.
export function Wheel({ r, spin }: { r: number; spin?: GRef }) {
  const bolts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(a) * r * 0.34} cy={Math.sin(a) * r * 0.34} r={r * 0.045} fill={K} />;
  });
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return (
      <circle key={i} cx={Math.cos(a) * r * 0.46} cy={Math.sin(a) * r * 0.46} r={r * 0.06} fill={K} />
    );
  });
  return (
    <g ref={spin}>
      <circle r={r} fill={K} />
      <circle r={r - 1.7} fill="none" stroke={G} strokeWidth={2.6} strokeDasharray="2.4 2.2" />
      <circle r={r * 0.78} fill={K} stroke={G} strokeWidth={0.7} />
      <path d={`M ${-r * 0.7} ${-r * 0.42} A ${r * 0.82} ${r * 0.82} 0 0 1 ${-r * 0.1} ${-r * 0.81}`} fill="none" stroke={G2} strokeWidth={1.2} strokeLinecap="round" />
      <circle r={r * 0.6} fill={G} />
      <circle r={r * 0.6} fill="none" stroke={G2} strokeWidth={1.1} />
      <circle r={r * 0.52} fill="none" stroke={K} strokeWidth={0.9} />
      {spokes}
      <circle r={r * 0.27} fill={G2} stroke={K} strokeWidth={0.8} />
      {bolts}
      <circle r={r * 0.13} fill={G} />
      <circle r={r * 0.05} fill={LG} />
    </g>
  );
}

// A pallet in profile, 120 long, 14.4 tall, origin at its bottom left. Open between the blocks so a
// fork shows through.
export function PalletSide({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-2.2} width={120} height={2.2} fill={SG} stroke={G2} strokeWidth={0.5} />
      {[0, 52.75, 105.5].map((bx) => (
        <g key={bx}>
          <rect x={bx} y={-10} width={14.5} height={7.8} fill={LG} stroke={G2} strokeWidth={0.5} />
          <circle cx={bx + 3.2} cy={-6.1} r={0.6} fill={G2} />
          <circle cx={bx + 11.3} cy={-6.1} r={0.6} fill={G2} />
        </g>
      ))}
      <rect x={0} y={-14.4} width={120} height={4.4} fill={SG} stroke={G2} strokeWidth={0.5} />
      {[10, 30, 50, 70, 90, 110].map((lx) => (
        <line key={lx} x1={lx} y1={-14.4} x2={lx} y2={-10} stroke={G2} strokeWidth={0.35} />
      ))}
    </g>
  );
}

// One carton, side view. Origin bottom left.
function Carton({ x, y, w, h, mark }: { x: number; y: number; w: number; h: number; mark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-h} width={w} height={h} fill={LG} stroke={G2} strokeWidth={0.6} />
      <line x1={0} y1={-h + 4} x2={w} y2={-h + 4} stroke={G2} strokeWidth={0.4} />
      <rect x={w / 2 - 2.5} y={-h} width={5} height={h} fill={SG} />
      <line x1={w / 2 - 2.5} y1={-h} x2={w / 2 - 2.5} y2={0} stroke={G2} strokeWidth={0.3} />
      <line x1={w / 2 + 2.5} y1={-h} x2={w / 2 + 2.5} y2={0} stroke={G2} strokeWidth={0.3} />
      <rect x={4} y={-h + 8} width={Math.min(15, w / 2 - 8)} height={9} fill={W} stroke={G2} strokeWidth={0.4} />
      <line x1={6} y1={-h + 11} x2={4 + Math.min(15, w / 2 - 8) - 2} y2={-h + 11} stroke={G2} strokeWidth={0.5} />
      <line x1={6} y1={-h + 14} x2={4 + Math.min(10, w / 2 - 12)} y2={-h + 14} stroke={G2} strokeWidth={0.5} />
      {mark && <rect x={w - 9} y={-h + 8} width={4} height={4} fill={G2} />}
    </g>
  );
}

// A loaded pallet. kind picks the load so the rack reads varied, like the reel's container stack.
export function LoadSide({ x = 0, y = 0, kind = 'cartons' }: { x?: number; y?: number; kind?: 'cartons' | 'wrap' | 'crates' | 'tall' }) {
  let load: ReactNode;
  if (kind === 'cartons') {
    load = (
      <>
        <Carton x={1} y={-14.4} w={58} h={34} mark />
        <Carton x={61} y={-14.4} w={58} h={34} />
        <Carton x={4} y={-48.4} w={54} h={30} />
        <Carton x={61} y={-48.4} w={55} h={30} mark />
      </>
    );
  } else if (kind === 'tall') {
    load = (
      <>
        <Carton x={1} y={-14.4} w={58} h={40} />
        <Carton x={61} y={-14.4} w={58} h={40} mark />
        <Carton x={1} y={-54.4} w={58} h={40} mark />
        <Carton x={61} y={-54.4} w={58} h={40} />
        <Carton x={14} y={-94.4} w={42} h={26} />
      </>
    );
  } else if (kind === 'wrap') {
    const lines = [];
    for (let i = -80; i < 120; i += 9) lines.push(<line key={i} x1={i} y1={-14.4} x2={i + 70} y2={-84} stroke={SG} strokeWidth={1} />);
    load = (
      <>
        <clipPath id={`v2wrap${x}${y}`}>
          <rect x={1} y={-84} width={118} height={69.6} rx={3} />
        </clipPath>
        <rect x={1} y={-84} width={118} height={69.6} rx={3} fill={W} stroke={G2} strokeWidth={0.6} />
        <g clipPath={`url(#v2wrap${x}${y})`}>{lines}</g>
        <line x1={1} y1={-62} x2={119} y2={-62} stroke={SG} strokeWidth={1.4} />
        <line x1={1} y1={-38} x2={119} y2={-38} stroke={SG} strokeWidth={1.4} />
        <rect x={48} y={-56} width={24} height={13} fill={W} stroke={G2} strokeWidth={0.4} />
        <line x1={51} y1={-52} x2={68} y2={-52} stroke={G2} strokeWidth={0.6} />
        <line x1={51} y1={-48} x2={62} y2={-48} stroke={G2} strokeWidth={0.6} />
      </>
    );
  } else {
    load = (
      <>
        {[0, 40, 80].map((cx) => (
          <g key={cx} transform={`translate(${cx + 1} -14.4)`}>
            <rect x={0} y={-36} width={38} height={36} fill={G} stroke={K} strokeWidth={0.6} />
            <rect x={0} y={-36} width={38} height={4} fill={G2} />
            {[8, 16, 24].map((ly) => (
              <line key={ly} x1={3} y1={-ly - 4} x2={35} y2={-ly - 4} stroke={K} strokeWidth={0.8} />
            ))}
            <rect x={13} y={-24} width={12} height={6} fill={K} />
          </g>
        ))}
        <Carton x={8} y={-50.4} w={50} h={28} />
        <Carton x={62} y={-50.4} w={50} h={28} mark />
      </>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <PalletSide />
      {load}
    </g>
  );
}

// A pallet rack frame seen from its side, uprights with slots, zigzag bracing and beam ends.
export function RackSide({ x = 0, levels = [150, 300, 450], height = 470, children }: { x?: number; levels?: number[]; height?: number; children?: ReactNode }) {
  const D = 110;
  const zig: string[] = [];
  for (let yy = 12, i = 0; yy < height - 20; yy += 46, i++) zig.push(`${i % 2 ? D - 9 : 9} ${-yy}`);
  return (
    <g transform={`translate(${x} 0)`}>
      <polyline points={zig.join(' ')} fill="none" stroke={G2} strokeWidth={2.2} strokeLinejoin="round" />
      <line x1={9} y1={-12} x2={D - 9} y2={-12} stroke={G2} strokeWidth={2.2} />
      <line x1={9} y1={-height + 14} x2={D - 9} y2={-height + 14} stroke={G2} strokeWidth={2.2} />
      {[0, D - 9].map((ux) => (
        <g key={ux}>
          <rect x={ux} y={-height} width={9} height={height} fill={G} />
          <rect x={ux + 0.8} y={-height} width={1.6} height={height} fill={G2} />
          <line x1={ux + 5.4} y1={-height + 6} x2={ux + 5.4} y2={-4} stroke={K} strokeWidth={1.6} strokeDasharray="3 4.5" />
          <rect x={ux - 3} y={-3} width={15} height={3} fill={K} />
          <circle cx={ux + 1} cy={-1.5} r={0.7} fill={G} />
          <circle cx={ux + 8} cy={-1.5} r={0.7} fill={G} />
          <rect x={ux - 0.5} y={-height - 1.5} width={10} height={2} fill={K} />
        </g>
      ))}
      {levels.map((lv) => (
        <g key={lv}>
          {[-2, D - 11].map((bx) => (
            <g key={bx}>
              <rect x={bx} y={-lv} width={13} height={12} fill={K} />
              <rect x={bx} y={-lv} width={13} height={2.2} fill={G2} />
              <rect x={bx + 2.5} y={-lv + 4} width={8} height={5} fill={G} />
              <circle cx={bx + 6.5} cy={-lv + 6.5} r={1} fill={G2} />
            </g>
          ))}
        </g>
      ))}
      {children}
    </g>
  );
}

export type SideParts = {
  body?: GRef;
  mast?: GRef;
  inner?: GRef;
  rod?: Ref<SVGRectElement>;
  chain?: Ref<SVGLineElement>;
  carriage?: GRef;
  wheelF?: GRef;
  wheelR?: GRef;
};

// The Linde style counterbalance truck, side view. Red shell with the big rounded counterweight,
// black overhead guard with a leaning front post, grey duplex mast with chain and lift cylinder,
// forks, tyres and the operator seat. load renders on the carriage.
export function ForkliftSide({ parts = {}, lift = 0, load }: { parts?: SideParts; lift?: number; load?: ReactNode }) {
  const off = Math.max(0, lift - 120);
  return (
    <g>
      <defs>
        <linearGradient id="v2-gBody" gradientUnits="userSpaceOnUse" x1={0} y1={-134} x2={0} y2={-22}>
          <stop offset={0} stopColor={RH} />
          <stop offset={0.22} stopColor={R} />
          <stop offset={0.8} stopColor={R} />
          <stop offset={1} stopColor={RD} />
        </linearGradient>
        <linearGradient id="v2-gChassis" gradientUnits="userSpaceOnUse" x1={0} y1={-134} x2={0} y2={-22}>
          <stop offset={0} stopColor={G} />
          <stop offset={0.3} stopColor={K} />
          <stop offset={1} stopColor={K} />
        </linearGradient>
        <linearGradient id="v2-gMast" x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor={G2} />
          <stop offset={0.5} stopColor={G} />
          <stop offset={1} stopColor={K} />
        </linearGradient>
        <linearGradient id="v2-gTank" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={W} />
          <stop offset={0.55} stopColor={SG} />
          <stop offset={1} stopColor={G2} />
        </linearGradient>
      </defs>
      <ellipse cx={-80} cy={1} rx={150} ry={4} fill={SG} />
      {/* far side guard post and far wheel give the drawing depth */}
      <line x1={-118} y1={-212} x2={-124} y2={-130} stroke={G} strokeWidth={5} strokeLinecap="round" />
      <path d="M 22 -212 Q 18 -160 8 -116" stroke={G} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* tilt cylinder */}
      <line x1={-8} y1={-74} x2={34} y2={-92} stroke={K} strokeWidth={6} strokeLinecap="round" />
      <line x1={14} y1={-83} x2={34} y2={-92} stroke={SG} strokeWidth={2.6} strokeLinecap="round" />
      <g ref={parts.body}>
        {/* wheel wells */}
        <path d="M -190.6 -22 A 33 33 0 1 1 -125.4 -22 Z" fill={K} />
        <path d="M -34.9 -22 A 36 36 0 0 1 27 -54.8 L 27 -22 Z" fill={K} />
        {/* chassis and cowl in ink, the red shell sits over the rear body only */}
        <path
          d="M 27 -55 L 23 -104 Q 22 -112 14 -112 L -4 -112 Q -10 -112 -12 -106 L -18 -60 L -40 -60 L -44 -104 Q -45 -110 -52 -110 L -126 -110 Q -133 -110 -137 -116 L -141 -124 Q -145 -131 -154 -131 L -178 -131 C -198 -131 -213 -116 -215 -92 L -215 -48 Q -215 -24 -198 -22 L -190.6 -22 A 33 33 0 1 1 -125.4 -22 L -34.9 -22 A 36 36 0 0 1 27 -55 Z"
          fill="url(#v2-gChassis)"
        />
        {/* lower sill between the wheels */}
        <path d="M -125.4 -22 L -34.9 -22 L -36 -38 L -122 -38 Z" fill={K} />
        <rect x={-122} y={-38} width={86} height={1.2} fill={G} />
        {/* red rear body shell and counterweight */}
        <path
          d="M -44 -104 Q -45 -110 -52 -110 L -126 -110 Q -133 -110 -137 -116 L -141 -124 Q -145 -131 -154 -131 L -178 -131 C -198 -131 -213 -116 -215 -92 L -215 -48 Q -215 -24 -198 -22 L -190.6 -22 A 33 33 0 1 1 -125.4 -22 L -122 -38 L -36 -38 L -40 -60 Z"
          fill="url(#v2-gBody)"
        />
        <path d="M -215 -60 L -215 -48 Q -215 -24 -198 -22 L -190.6 -22 L -192 -40 L -206 -44 Z" fill={RD} />
        {/* counterweight panel, vents and tail lamp */}
        <path d="M -206 -100 C -204 -116 -194 -123 -178 -123 L -160 -123 L -160 -58 L -206 -58 Z" fill={RD} opacity={0.55} />
        {[-110, -103, -96, -89].map((vy) => (
          <line key={vy} x1={-196} y1={vy} x2={-168} y2={vy} stroke={RDD} strokeWidth={1.6} strokeLinecap="round" />
        ))}
        <rect x={-216} y={-84} width={4} height={14} rx={1} fill={G} stroke={K} strokeWidth={0.6} />
        <rect x={-216} y={-68} width={4} height={6} rx={1} fill={W} stroke={G2} strokeWidth={0.5} />
        <rect x={-206} y={-30} width={14} height={5} rx={1.5} fill={K} />
        {/* highlights along the top edges */}
        <path d="M -52 -110 L -126 -110 Q -133 -110 -137 -116 L -141 -124 Q -145 -131 -154 -131 L -178 -131 C -198 -131 -213 -116 -215 -92" fill="none" stroke={RH} strokeWidth={1.6} />
        <path d="M 14 -112 L -4 -112" stroke={G2} strokeWidth={1.6} />
        {/* panel seams */}
        <line x1={-160} y1={-123} x2={-160} y2={-40} stroke={RDD} strokeWidth={0.7} />
        <path d="M -122 -104 L -60 -104 L -58 -66 L -118 -66 Z" fill={G} stroke={K} strokeWidth={0.7} />
        <line x1={-121} y1={-107} x2={-61} y2={-107} stroke={SG} strokeWidth={1.4} strokeLinecap="round" />
        <rect x={-108} y={-98} width={22} height={9} rx={2} fill={G2} />
        <circle cx={-66} cy={-74} r={2} fill={G2} />
        {/* footstep and floor plate */}
        <rect x={-40} y={-62} width={22} height={3} fill={K} />
        <rect x={-36} y={-36} width={16} height={4} rx={1} fill={G} />
        <rect x={-36} y={-36} width={16} height={1.2} fill={SG} />
        {/* front lamp on the cowl, load plate, warning label and pinstripe */}
        <rect x={16} y={-100} width={7} height={5} rx={1} fill={W} stroke={G2} strokeWidth={0.5} />
        <rect x={-2} y={-96} width={13} height={9} rx={0.8} fill={SG} stroke={G2} strokeWidth={0.4} />
        {[-93.5, -91, -88.5].map((ly) => (
          <line key={ly} x1={0} y1={ly} x2={9} y2={ly} stroke={G2} strokeWidth={0.45} />
        ))}
        <rect x={-110} y={-84} width={14} height={8} fill={W} stroke={K} strokeWidth={0.4} />
        <path d="M -108 -77.5 L -105 -82.5 L -102 -77.5 Z" fill={K} />
        <line x1={-100.5} y1={-81} x2={-97.5} y2={-81} stroke={G2} strokeWidth={0.5} />
        <line x1={-100.5} y1={-78.5} x2={-98} y2={-78.5} stroke={G2} strokeWidth={0.5} />
        <path d="M -210 -64 L -40 -64" stroke={RDD} strokeWidth={0.6} />
        <path d="M -122 -46 L -40 -46" stroke={RH} strokeWidth={0.8} opacity={0.7} />
        <rect x={-218} y={-42} width={7} height={8} rx={1} fill={K} />
        <circle cx={-216} cy={-38} r={1.4} fill={G} />
      </g>
      {/* rear wheel and front wheel */}
      <g transform="translate(-158 -27)">
        <Wheel r={27} spin={parts.wheelR} />
      </g>
      <g transform="translate(0 -31)">
        <Wheel r={31} spin={parts.wheelF} />
      </g>
      {/* gas bottle on the counterweight behind the seat */}
      <rect x={-112} y={-122} width={8} height={10} fill={K} />
      <rect x={-176} y={-153} width={66} height={22} rx={11} fill="url(#v2-gTank)" stroke={G2} strokeWidth={0.7} />
      <line x1={-170} y1={-142} x2={-116} y2={-142} stroke={G2} strokeWidth={0.5} />
      <rect x={-150} y={-156} width={6} height={28} rx={1} fill={K} />
      <rect x={-130} y={-156} width={6} height={28} rx={1} fill={K} />
      <circle cx={-112} cy={-142} r={3} fill={G} stroke={K} strokeWidth={0.8} />
      <path d="M -112 -139 Q -104 -132 -100 -120" fill="none" stroke={K} strokeWidth={1.2} />
      {/* operator seat */}
      <rect x={-98} y={-114} width={30} height={5} fill={K} />
      <path d="M -104 -122 Q -104 -126 -100 -126 L -64 -126 Q -60 -126 -61 -121 L -62 -116 L -104 -116 Z" fill={K} />
      <path d="M -104 -122 L -110 -170 Q -111 -176 -105 -176 L -96 -176 Q -91 -176 -91 -170 L -90 -124 Z" fill={K} />
      <path d="M -106 -164 L -95 -164" stroke={G} strokeWidth={0.8} />
      <path d="M -107 -150 L -94 -150" stroke={G} strokeWidth={0.8} />
      <rect x={-88} y={-138} width={24} height={5} rx={2.5} fill={K} />
      <line x1={-70} y1={-138} x2={-68} y2={-150} stroke={K} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={-68} cy={-151} r={2.6} fill={G2} />
      {/* steering column and wheel */}
      <line x1={-4} y1={-112} x2={-24} y2={-150} stroke={K} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={-27} cy={-153} rx={16} ry={3} transform="rotate(-24 -27 -153)" fill="none" stroke={K} strokeWidth={3} />
      <circle cx={-38} cy={-149} r={1.8} fill={G} />
      {/* overhead guard */}
      <line x1={-123} y1={-214} x2={-128} y2={-128} stroke={K} strokeWidth={8} strokeLinecap="round" />
      <line x1={-127} y1={-182} x2={-104} y2={-213} stroke={K} strokeWidth={3} />
      <path d="M 27 -214 Q 23 -160 11 -114" stroke={K} strokeWidth={7.5} fill="none" strokeLinecap="round" />
      <rect x={-132} y={-221} width={164} height={8} rx={2.5} fill={K} />
      <line x1={-128} y1={-219.5} x2={28} y2={-219.5} stroke={G} strokeWidth={1} />
      <line x1={18} y1={-178} x2={14} y2={-150} stroke={SG} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={20} y={-230} width={11} height={9} rx={1.5} fill={SG} stroke={G2} strokeWidth={0.6} />
      <rect x={28} y={-228} width={3} height={5} fill={W} />
      <path d="M -122 -221 Q -122 -230 -115 -230 Q -108 -230 -108 -221 Z" fill={LG} stroke={G2} strokeWidth={0.6} />
      <rect x={-117} y={-228} width={2} height={4} fill={W} opacity={0.8} />
      <path d="M 22 -84 C 30 -84 30 -70 36 -66" fill="none" stroke={K} strokeWidth={1.3} />
      <path d="M 22 -80 C 28 -78 28 -62 35 -58" fill="none" stroke={K} strokeWidth={1.3} />
      <rect x={-130} y={-226} width={6} height={5} rx={1} fill={SG} stroke={G2} strokeWidth={0.5} />
      {/* mast, tilted as one group about its foot */}
      <g ref={parts.mast}>
        <rect x={28} y={-196} width={5} height={180} fill={K} />
        <rect ref={parts.rod} x={29} y={-196 - off} width={3} height={off} fill={SG} />
        <g ref={parts.inner} transform={`translate(0 ${-off})`}>
          <rect x={37} y={-214} width={9} height={204} fill={G2} stroke={G} strokeWidth={0.6} />
          <rect x={35} y={-218} width={14} height={6} fill={K} />
          <circle cx={50} cy={-212} r={5.5} fill={SG} stroke={K} strokeWidth={1.6} />
          <circle cx={50} cy={-212} r={1.4} fill={K} />
        </g>
        <rect x={34} y={-212} width={14} height={200} fill="url(#v2-gMast)" />
        <rect x={35.5} y={-212} width={1.4} height={200} fill={SG} opacity={0.7} />
        {[-176, -120, -64].map((ty) => (
          <rect key={ty} x={33} y={ty} width={16} height={3} fill={K} />
        ))}
        {[-190, -150, -110, -70, -30].map((ry) => (
          <circle key={ry} cx={44} cy={ry} r={1} fill={K} />
        ))}
        <rect x={32} y={-215} width={18} height={6} fill={K} />
        <rect x={30} y={-22} width={20} height={10} rx={2} fill={K} />
        <line ref={parts.chain} x1={55.4} y1={-212 - off} x2={55.4} y2={-lift - 40} stroke={K} strokeWidth={1.8} strokeDasharray="2.2 1.1" />
        <g ref={parts.carriage} transform={`translate(0 ${-lift - 5})`}>
          <rect x={52} y={-100} width={5} height={60} fill={K} />
          {[-92, -80, -68, -56].map((by) => (
            <line key={by} x1={52} y1={by} x2={57} y2={by} stroke={G} strokeWidth={0.8} />
          ))}
          <rect x={50} y={-44} width={11} height={44} rx={1.5} fill={K} />
          <rect x={51.5} y={-40} width={2} height={36} fill={G} />
          <circle cx={56} cy={-36} r={1.3} fill={G2} />
          <circle cx={56} cy={-10} r={1.3} fill={G2} />
          <path d="M 47 -44 Q 40 -60 46 -80" fill="none" stroke={K} strokeWidth={1.5} />
          <rect x={59} y={-40} width={6} height={44.5} fill={K} />
          <path d="M 59 0 L 184 0 L 184 1.4 Q 184 4.5 172 4.5 L 65 4.5 Q 59 4.5 59 0 Z" fill={G} />
          <line x1={65} y1={0.6} x2={182} y2={0.6} stroke={G2} strokeWidth={0.9} />
          {load}
        </g>
      </g>
    </g>
  );
}

export type FrontParts = { inner?: GRef; carriage?: GRef; rods?: GRef; chains?: GRef };

// Pallet and cartons seen end on, 100 wide, centred on x 0, origin at its bottom.
function LoadFront() {
  return (
    <g>
      <rect x={-50} y={-2.2} width={100} height={2.2} fill={SG} stroke={G2} strokeWidth={0.5} />
      <rect x={-50} y={-10} width={100} height={7.8} fill={G2} />
      {[-50, -7, 36].map((bx) => (
        <rect key={bx} x={bx} y={-10} width={14} height={7.8} fill={LG} stroke={G2} strokeWidth={0.5} />
      ))}
      <rect x={-50} y={-14.4} width={100} height={4.4} fill={SG} stroke={G2} strokeWidth={0.5} />
      <Carton x={-49} y={-14.4} w={48} h={34} mark />
      <Carton x={1} y={-14.4} w={48} h={34} />
      <Carton x={-46} y={-48.4} w={45} h={30} />
      <Carton x={1} y={-48.4} w={45} h={30} mark />
    </g>
  );
}

// The same truck seen from the front, for the reel's turn toward the camera.
export function ForkliftFront({ parts = {}, lift = 0 }: { parts?: FrontParts; lift?: number }) {
  const off = Math.max(0, lift - 120);
  const tread: number[] = [];
  for (let y = -58; y < -2; y += 5) tread.push(y);
  return (
    <g>
      <ellipse cx={0} cy={1} rx={86} ry={4} fill={SG} />
      {/* counterweight top seen behind the cowl */}
      <path d="M -62 -100 L -62 -118 Q -62 -132 -48 -132 L 48 -132 Q 62 -132 62 -118 L 62 -100 Z" fill={R} />
      <path d="M -58 -128 L 58 -128" stroke={RH} strokeWidth={1.4} />
      {/* rear guard posts */}
      <line x1={-54} y1={-214} x2={-56} y2={-130} stroke={G} strokeWidth={5} />
      <line x1={54} y1={-214} x2={56} y2={-130} stroke={G} strokeWidth={5} />
      {/* seat back and wheel */}
      <path d="M -20 -122 L -21 -170 Q -21 -176 -15 -176 L 15 -176 Q 21 -176 21 -170 L 20 -122 Z" fill={K} />
      <line x1={-14} y1={-160} x2={14} y2={-160} stroke={G} strokeWidth={0.8} />
      <ellipse cx={-4} cy={-150} rx={17} ry={4.5} fill="none" stroke={K} strokeWidth={3} />
      <line x1={-4} y1={-146} x2={-4} y2={-112} stroke={K} strokeWidth={5} />
      {/* cowl and front body */}
      <path d="M -58 -40 L -58 -104 Q -58 -112 -50 -112 L 50 -112 Q 58 -112 58 -104 L 58 -40 Z" fill={K} />
      <path d="M -54 -112 L 54 -112" stroke={G2} strokeWidth={1.6} />
      <rect x={-58} y={-60} width={116} height={20} fill={G} />
      <rect x={-58} y={-60} width={116} height={1.4} fill={SG} />
      <rect x={-50} y={-102} width={9} height={6} rx={1} fill={W} stroke={G2} strokeWidth={0.5} />
      <rect x={41} y={-102} width={9} height={6} rx={1} fill={W} stroke={G2} strokeWidth={0.5} />
      <rect x={-42} y={-40} width={84} height={14} fill={K} />
      {/* front tyres */}
      {[-64, 38].map((tx) => (
        <g key={tx}>
          <rect x={tx} y={-62} width={26} height={62} rx={8} fill={K} />
          {tread.map((ty) => (
            <line key={ty} x1={tx + 3} y1={ty} x2={tx + 23} y2={ty} stroke={G} strokeWidth={1.6} />
          ))}
        </g>
      ))}
      {/* front guard posts and roof */}
      <line x1={-58} y1={-216} x2={-50} y2={-114} stroke={K} strokeWidth={7} strokeLinecap="round" />
      <line x1={58} y1={-216} x2={50} y2={-114} stroke={K} strokeWidth={7} strokeLinecap="round" />
      <rect x={-64} y={-222} width={128} height={8} rx={2.5} fill={K} />
      <rect x={-62} y={-232} width={12} height={10} rx={1.5} fill={LG} stroke={G2} strokeWidth={0.6} />
      <rect x={50} y={-232} width={12} height={10} rx={1.5} fill={LG} stroke={G2} strokeWidth={0.6} />
      <rect x={-59} y={-229} width={6} height={4} fill={W} />
      <rect x={53} y={-229} width={6} height={4} fill={W} />
      {/* mast */}
      <g ref={parts.rods}>
        {[-17, 13].map((cx) => (
          <g key={cx}>
            <rect x={cx} y={-196} width={4} height={180} fill={K} />
            <rect className="v2-frod" x={cx + 0.6} y={-196 - off} width={2.8} height={off} fill={SG} />
          </g>
        ))}
      </g>
      <g ref={parts.inner} transform={`translate(0 ${-off})`}>
        {[-33, 25].map((ux) => (
          <rect key={ux} x={ux} y={-214} width={8} height={204} fill={G2} stroke={G} strokeWidth={0.6} />
        ))}
        <rect x={-36} y={-218} width={72} height={6} fill={K} />
        <circle cx={-22} cy={-212} r={4} fill={SG} stroke={K} strokeWidth={1.4} />
        <circle cx={22} cy={-212} r={4} fill={SG} stroke={K} strokeWidth={1.4} />
      </g>
      {[-38, 28].map((ux) => (
        <g key={ux}>
          <rect x={ux} y={-212} width={10} height={200} fill={G} />
          <rect x={ux + 1} y={-212} width={2} height={200} fill={G2} />
        </g>
      ))}
      <rect x={-40} y={-215} width={80} height={5} fill={K} />
      <rect x={-38} y={-120} width={76} height={4} fill={G} />
      <rect x={-40} y={-22} width={80} height={9} rx={2} fill={K} />
      <g ref={parts.chains}>
        <line className="v2-fchain" x1={-22} y1={-212 - off} x2={-22} y2={-lift - 45} stroke={K} strokeWidth={1.8} strokeDasharray="2.2 1.1" />
        <line className="v2-fchain" x1={22} y1={-212 - off} x2={22} y2={-lift - 45} stroke={K} strokeWidth={1.8} strokeDasharray="2.2 1.1" />
      </g>
      {/* carriage with load backrest, forks end on and the load */}
      <g ref={parts.carriage} transform={`translate(0 ${-lift - 5})`}>
        <rect x={-46} y={-100} width={92} height={56} fill="none" stroke={K} strokeWidth={2.4} />
        {[-34, -23, -12, -1, 10, 21, 32].map((bx) => (
          <line key={bx} x1={bx + 1} y1={-100} x2={bx + 1} y2={-44} stroke={K} strokeWidth={1.4} />
        ))}
        <rect x={-48} y={-44} width={96} height={44} rx={1.5} fill={K} />
        <rect x={-48} y={-40} width={96} height={2} fill={G} />
        <rect x={-48} y={-8} width={96} height={2} fill={G} />
        <rect x={-29} y={-40} width={10} height={44.5} fill={G} />
        <rect x={19} y={-40} width={10} height={44.5} fill={G} />
        <g transform="translate(0 10)">
          <LoadFront />
        </g>
        <rect x={-29} y={0} width={10} height={4.5} fill={G} />
        <rect x={19} y={0} width={10} height={4.5} fill={G} />
        <rect x={-29} y={0} width={10} height={1.2} fill={G2} />
        <rect x={19} y={0} width={10} height={1.2} fill={G2} />
      </g>
    </g>
  );
}

// Top view, nose along +x, origin at the front axle. Units as the side view.
export function ForkliftTop() {
  return (
    <g>
      <rect x={-206} y={-60} width={400} height={128} rx={30} fill={SG} opacity={0.7} transform="translate(8 8)" />
      {/* wheels */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={-31} y={s > 0 ? 40 : -64} width={62} height={24} rx={6} fill={K} />
          <rect x={-184} y={s > 0 ? 34 : -54} width={52} height={20} rx={6} fill={K} />
        </g>
      ))}
      {/* body */}
      <path d="M 28 -54 L 28 54 L -170 56 Q -216 56 -216 10 L -216 -10 Q -216 -56 -170 -56 Z" fill={R} />
      <path d="M -150 -46 L -150 46 L -176 46 Q -206 46 -206 10 L -206 -10 Q -206 -46 -176 -46 Z" fill={RH} />
      {[-30, -18, -6, 6, 18, 30].map((vy) => (
        <line key={vy} x1={-196} y1={vy} x2={-168} y2={vy} stroke={RD} strokeWidth={2} strokeLinecap="round" />
      ))}
      <rect x={-40} y={-40} width={56} height={80} rx={4} fill={K} />
      {/* overhead guard roof with slots */}
      <rect x={-134} y={-60} width={166} height={120} rx={8} fill={K} />
      {[-112, -88, -64, -40, -16, 8].map((sx) => (
        <rect key={sx} x={sx} y={-46} width={14} height={92} rx={2} fill={G} />
      ))}
      <rect x={20} y={-58} width={10} height={14} rx={2} fill={W} />
      <rect x={20} y={44} width={10} height={14} rx={2} fill={W} />
      <circle cx={-122} cy={0} r={7} fill={LG} stroke={G2} strokeWidth={1.2} />
      {/* mast, carriage, forks */}
      <rect x={32} y={-44} width={18} height={88} fill={G} />
      <rect x={34} y={-40} width={4} height={80} fill={G2} />
      <rect x={50} y={-48} width={11} height={96} fill={K} />
      <rect x={60} y={-30} width={126} height={11} fill={G} />
      <rect x={60} y={19} width={126} height={11} fill={G} />
      <rect x={60} y={-30} width={126} height={2.4} fill={G2} />
      <rect x={60} y={19} width={126} height={2.4} fill={G2} />
      {/* pallet and cartons */}
      <rect x={70} y={-42} width={116} height={84} fill={SG} stroke={G2} strokeWidth={1} />
      {[0, 1].map((cx) =>
        [0, 1].map((cy) => (
          <g key={`${cx}${cy}`} transform={`translate(${73 + cx * 56} ${-39 + cy * 40})`}>
            <rect width={54} height={38} fill={LG} stroke={G2} strokeWidth={1} />
            <rect x={0} y={16} width={54} height={6} fill={W} />
            <line x1={0} y1={16} x2={54} y2={16} stroke={G2} strokeWidth={0.5} />
            <line x1={0} y1={22} x2={54} y2={22} stroke={G2} strokeWidth={0.5} />
            {(cx + cy) % 2 === 0 && <rect x={42} y={5} width={7} height={7} fill={G2} />}
          </g>
        )),
      )}
    </g>
  );
}

// Thin line service icons in the reel's icon row style, 44 by 44, white strokes.
export function ServiceIcon({ id, color = W }: { id: string; color?: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1 };
  if (id === 'novi')
    return (
      <g {...s}>
        <path {...s} d="M6 34 L6 22 L14 22 L18 14 L26 14 L26 34" />
        <path {...s} d="M30 6 L30 36 M30 30 L42 30" />
        <circle {...s} cx={11} cy={36} r={3} />
        <circle {...s} cx={23} cy={36} r={3} />
        <path {...s} d="M18 14 L18 6 L28 6" />
      </g>
    );
  if (id === 'najam')
    return (
      <g {...s}>
        <rect {...s} x={6} y={9} width={32} height={29} rx={2} />
        <path {...s} d="M6 17 L38 17 M14 5 L14 12 M30 5 L30 12" />
        <path {...s} d="M14 26 L19 31 L30 22" />
      </g>
    );
  if (id === 'servis')
    return (
      <g {...s}>
        <path {...s} d="M30 6 A9 9 0 0 0 20 18 L6 32 A3.5 3.5 0 0 0 11 37 L25 23 A9 9 0 0 0 37 13 L31 18 L26 17 L25 12 Z" />
        <circle {...s} cx={9} cy={34} r={0.6} />
      </g>
    );
  return (
    <g {...s}>
      <path {...s} d="M22 5 L36 10 L36 21 C36 30 30 36 22 39 C14 36 8 30 8 21 L8 10 Z" />
      <path {...s} d="M15 22 L20 27 L30 17" />
    </g>
  );
}
