// The Ekotehnika site seen from the side, drawn in the variant 2 flat vector style. Three layers move past the
// forklift at three speeds, a far tree line, the site itself (building, vans, trees, parked trucks, fence) and
// the yard floor under the wheels. The forklift stays in one place on screen, so everything here is a function
// of the distance driven. Tokens only.
import { memo, type ReactNode } from 'react';
import { ein, eout, io, kf, lerp, range, seg, smooth, W, H, K, G, G2, LG, SG, WH } from './frame';

export const GY = 620; // the wheels stand on this line
export const TS = 1.47; // forklift units to pixels, a 232 unit truck is about 340px tall
const MY = 602; // where the site stands, a little behind the wheels
const FY = 586; // where the far tree line stands

// Distance driven in pixels. D1 eases out of rest to the stop at the building, D2 accelerates away from it,
// F carries the speed on and brings the truck to rest on the path.
export function dist(pos: number) {
  return 2000 * smooth(seg(pos, 'D1')) + 700 * ein(seg(pos, 'D2')) + 700 * eout(seg(pos, 'F'));
}

// Where the front axle stands on screen. It rests to the right for the hero, then settles centre right.
export const axleX = (pos: number) => lerp(1140, 790, io(range(pos, 500, 800)));

// Mast height in truck units, raised at the building, lowered to a carrying height for the drive.
export const liftAt = (pos: number) =>
  kf(pos, [
    [1080, 0],
    [1440, 225],
    [2300, 225],
    [2760, 44],
  ]);

const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// The far layer, a soft hill line and a tree line, drawn from the world position so it repeats forever.
function Far({ off }: { off: number }) {
  let hill = `M -60 ${FY + 2}`;
  for (let x = -60; x <= W + 60; x += 30) hill += ` L ${x} ${FY - 26 - 20 * Math.sin((x + off) / 190) - 9 * Math.sin((x + off) / 71)}`;
  hill += ` L ${W + 60} ${FY + 2} Z`;
  const first = Math.floor((off - 80) / 46);
  const last = Math.ceil((off + W + 80) / 46);
  const trees: ReactNode[] = [];
  for (let n = first; n <= last; n++) {
    const h = hash(n);
    const r = 15 + h * 16;
    const x = n * 46 - off + hash(n + 9) * 20;
    trees.push(<circle key={n} cx={x} cy={FY - r * 0.55 - 4 - hash(n + 4) * 6} r={r} fill={SG} />);
  }
  return (
    <g>
      <path d={hill} fill={LG} />
      {trees}
      <rect x={-60} y={FY - 8} width={W + 120} height={14} fill={SG} />
    </g>
  );
}

function Cypress({ x, h }: { x: number; h: number }) {
  return (
    <g transform={`translate(${x} ${MY})`}>
      <path d={`M 0 0 Q ${-h * 0.11} ${-h * 0.35} 0 ${-h} Q ${h * 0.11} ${-h * 0.35} 0 0 Z`} fill={G} opacity={0.5} />
      <path d={`M 0 0 Q ${-h * 0.05} ${-h * 0.4} 0 ${-h * 0.92}`} stroke={G2} strokeWidth={1.2} fill="none" opacity={0.5} />
    </g>
  );
}

function Round({ x, r }: { x: number; r: number }) {
  return (
    <g transform={`translate(${x} ${MY})`}>
      <rect x={-4} y={-r * 1.1} width={8} height={r * 1.1} fill={G2} opacity={0.6} />
      <circle cx={0} cy={-r * 1.6} r={r} fill={SG} stroke={G2} strokeOpacity={0.5} strokeWidth={1.2} />
      <circle cx={-r * 0.3} cy={-r * 1.75} r={r * 0.45} fill={LG} />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${MY})`}>
      <line x1={0} y1={0} x2={0} y2={-150} stroke={G} strokeWidth={4} />
      <circle cx={0} cy={-160} r={11} fill={WH} stroke={G} strokeWidth={2.4} />
      <rect x={-9} y={-14} width={18} height={14} fill={G} />
    </g>
  );
}

function Van({ x, flip = false }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${MY + 6}) ${flip ? 'translate(190 0) scale(-1 1)' : ''}`}>
      <ellipse cx={95} cy={1} rx={100} ry={4} fill={K} opacity={0.1} />
      <path d="M 0 -16 L 0 -66 Q 0 -80 14 -80 L 112 -80 Q 124 -80 132 -66 L 160 -52 Q 190 -48 190 -30 L 190 -16 Z" fill={WH} stroke={G} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M 118 -74 L 150 -54 L 110 -54 Z" fill={LG} stroke={G} strokeWidth={1.2} />
      <path d="M 10 -70 L 100 -70 L 100 -54 L 10 -54 Z" fill={LG} stroke={G} strokeWidth={1.2} />
      <line x1={0} y1={-30} x2={190} y2={-30} stroke={SG} strokeWidth={2} />
      <rect x={176} y={-38} width={9} height={6} fill={SG} stroke={G} strokeWidth={0.8} />
      {[38, 150].map((cx) => (
        <g key={cx} transform={`translate(${cx} -16)`}>
          <circle r={17} fill={K} />
          <circle r={8} fill={G} />
        </g>
      ))}
    </g>
  );
}

function Shed({ x, w = 380, h = 170 }: { x: number; w?: number; h?: number }) {
  const lines: ReactNode[] = [];
  for (let i = 12; i < w; i += 14) lines.push(<line key={i} x1={i} y1={-h + 8} x2={i} y2={0} stroke={G2} strokeOpacity={0.35} strokeWidth={1.4} />);
  return (
    <g transform={`translate(${x} ${MY})`}>
      <rect x={0} y={-h} width={w} height={h} fill={SG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.4} />
      {lines}
      <rect x={-6} y={-h - 10} width={w + 12} height={12} fill={LG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.4} />
      <rect x={w * 0.55} y={-118} width={96} height={118} fill={G} opacity={0.55} />
      <line x1={w * 0.55 + 48} y1={-118} x2={w * 0.55 + 48} y2={0} stroke={LG} strokeWidth={2} />
    </g>
  );
}

// A parked truck with its mast up, as in the old photo of the yard.
function Parked({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${MY}) scale(${s})`} opacity={0.62}>
      <rect x={0} y={-150} width={7} height={150} fill={G} />
      <rect x={-34} y={-46} width={72} height={46} rx={6} fill={G} />
      <rect x={-34} y={-70} width={44} height={26} fill={G2} />
      <path d="M -30 -70 L -26 -96 L 6 -96 L 6 -70" fill="none" stroke={K} strokeWidth={4} />
      <circle cx={-20} cy={-8} r={11} fill={K} />
      <circle cx={24} cy={-8} r={11} fill={K} />
    </g>
  );
}

function Fence({ x, w }: { x: number; w: number }) {
  const posts: ReactNode[] = [];
  for (let i = 0; i <= w; i += 60) posts.push(<line key={i} x1={x + i} y1={MY - 54} x2={x + i} y2={MY + 4} stroke={G} strokeWidth={4} />);
  return (
    <g opacity={0.7}>
      {posts}
      <line x1={x} y1={MY - 50} x2={x + w} y2={MY - 50} stroke={G} strokeWidth={3} />
      <line x1={x} y1={MY - 26} x2={x + w} y2={MY - 26} stroke={G} strokeWidth={3} />
    </g>
  );
}

// The Ekotehnika building, a tall block with the sign at the left and a lower block with an awning and a glass
// entrance at the right. The logo is the real image file.
const Building = memo(function Building({ x }: { x: number }) {
  const win = (wx: number, wy: number, ww = 44, hh = 54) => (
    <g key={`${wx}-${wy}`}>
      <rect x={wx} y={wy} width={ww} height={hh} fill={G} opacity={0.62} />
      <rect x={wx} y={wy} width={ww} height={hh} fill="none" stroke={WH} strokeWidth={4} />
      <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + hh} stroke={WH} strokeWidth={2.5} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${MY})`}>
      {/* tall block */}
      <rect x={0} y={-292} width={340} height={292} fill={LG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.6} />
      <rect x={-6} y={-306} width={352} height={16} fill={SG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.6} />
      <rect x={14} y={-262} width={290} height={80} fill={WH} stroke={G2} strokeOpacity={0.5} strokeWidth={1.4} />
      <image href="/brand/ekotehnika.png" x={30} y={-255} width={236} height={64} preserveAspectRatio="xMidYMid meet" />
      {[40, 130, 220].map((wx) => win(wx, -156))}
      {[40, 130, 220].map((wx) => win(wx, -84, 44, 50))}
      {/* lower block */}
      <rect x={340} y={-236} width={620} height={236} fill={LG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.6} />
      <rect x={334} y={-250} width={632} height={16} fill={SG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.6} />
      {[380, 480, 580, 680, 780, 880].map((wx) => win(wx, -204))}
      {[380, 480, 880].map((wx) => win(wx, -126, 44, 64))}
      <path d="M 560 -140 L 880 -140 L 900 -110 L 540 -110 Z" fill={G} opacity={0.82} />
      {[560, 620, 680, 740, 800, 860].map((ax) => (
        <line key={ax} x1={ax} y1={-140} x2={ax - 8} y2={-110} stroke={WH} strokeWidth={2} opacity={0.5} />
      ))}
      <rect x={604} y={-104} width={170} height={104} fill={G} opacity={0.55} />
      <rect x={604} y={-104} width={170} height={104} fill="none" stroke={WH} strokeWidth={4} />
      <line x1={689} y1={-104} x2={689} y2={0} stroke={WH} strokeWidth={3} />
      <rect x={410} y={-276} width={44} height={26} fill={SG} stroke={G2} strokeOpacity={0.6} strokeWidth={1.2} />
      {/* shrubs along the front */}
      {[-30, 30, 330, 360, 970, 1004].map((sx, i) => (
        <circle key={sx} cx={sx} cy={-18 - (i % 2) * 6} r={26 - (i % 3) * 3} fill={SG} stroke={G2} strokeOpacity={0.5} strokeWidth={1.2} />
      ))}
    </g>
  );
});

type Item = { x: number; w: number; node: () => ReactNode };
const MID: Item[] = [
  { x: 1000, w: 200, node: () => <Van x={1000} flip /> },
  { x: 1160, w: 60, node: () => <Cypress x={1190} h={175} /> },
  { x: 1200, w: 60, node: () => <Cypress x={1228} h={140} /> },
  { x: 1250, w: 60, node: () => <Cypress x={1262} h={205} /> },
  { x: 1290, w: 40, node: () => <Lamp x={1316} /> },
  { x: 1340, w: 1040, node: () => <Building x={1380} /> },
  { x: 1720, w: 40, node: () => <Lamp x={1730} /> },
  { x: 2440, w: 400, node: () => <Shed x={2440} /> },
  { x: 2880, w: 80, node: () => <Parked x={2900} /> },
  { x: 2970, w: 80, node: () => <Parked x={2990} s={0.95} /> },
  { x: 3060, w: 80, node: () => <Parked x={3080} s={1.05} /> },
  { x: 3150, w: 80, node: () => <Parked x={3170} /> },
  { x: 3260, w: 200, node: () => <Van x={3260} /> },
  { x: 3500, w: 120, node: () => <Round x={3560} r={46} /> },
  { x: 3660, w: 60, node: () => <Cypress x={3680} h={180} /> },
  { x: 800, w: 120, node: () => <Round x={860} r={40} /> },
];

function Mid({ off }: { off: number }) {
  return (
    <g>
      <Fence x={2380 - off} w={1400} />
      {MID.map((it) => {
        const sx = it.x - off;
        if (sx > W + 80 || sx + it.w < -80) return null;
        return <g key={it.x} transform={`translate(${-off} 0)`}>{it.node()}</g>;
      })}
    </g>
  );
}

// The yard floor under the wheels, slab joints and a lane dash move at the speed of the ground.
function Ground({ d }: { d: number }) {
  const joints: ReactNode[] = [];
  const pitch = 340;
  const first = Math.floor((d - 40) / pitch);
  for (let n = first; n <= first + Math.ceil(W / pitch) + 1; n++) {
    const x = n * pitch - d;
    joints.push(<line key={n} x1={x} y1={GY + 16} x2={x - 70} y2={H + 10} stroke={G2} strokeOpacity={0.14} strokeWidth={1.6} />);
  }
  return (
    <g>
      <rect x={0} y={GY} width={W} height={H - GY} fill={SG} />
      <rect x={0} y={GY} width={W} height={14} fill={G2} opacity={0.14} />
      <line x1={0} y1={GY} x2={W} y2={GY} stroke={G2} strokeOpacity={0.55} strokeWidth={1.6} />
      {joints}
      <line x1={0} x2={W} y1={H - 22} y2={H - 22} stroke={WH} strokeWidth={5} strokeDasharray="110 150" strokeDashoffset={d} opacity={0.9} />
    </g>
  );
}

export function Outdoor({ pos }: { pos: number }) {
  const d = dist(pos);
  return (
    <g>
      <rect x={0} y={0} width={W} height={GY} fill={WH} />
      <Far off={0.22 * d} />
      <Mid off={0.62 * d} />
      <Ground d={d} />
    </g>
  );
}
