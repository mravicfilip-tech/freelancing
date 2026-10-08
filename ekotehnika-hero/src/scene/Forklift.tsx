// Side view counterbalance forklift, facing right, ground at y = 0. Drawn in brand tokens only,
// see studio/clients/ekotehnika/README.md. The hero's main truck carries data-part hooks that the
// motion code moves, wheels rotate, the carriage and inner mast lift, the floor spot pulses.

import { C } from './tokens';

type Tone = 'red' | 'grey';

type Props = {
  tone?: Tone;
  load?: boolean;
  spot?: boolean;
  main?: boolean;
  lift?: number;
};

const tones: Record<Tone, { body: string; rear: string }> = {
  red: { body: C.lindeRed, rear: C.primary700 },
  grey: { body: C.tonedTextGrey, rear: C.textGrey },
};

export function Forklift({ tone = 'red', load = false, spot = false, main = false, lift = 0 }: Props) {
  const t = tones[tone];
  const part = (name: string) => (main ? { 'data-part': name } : {});
  return (
    <g>
      <ellipse cx="168" cy="2" rx="176" ry="7" fill={C.ink} opacity="0.08" />

      {spot && (
        <g {...part('spot')}>
          <ellipse cx="470" cy="2" rx="74" ry="11" fill="none" stroke={C.lindeRed} strokeWidth="2" strokeDasharray="8 7" />
          <ellipse cx="470" cy="2" rx="40" ry="6" fill={C.lindeRed} opacity="0.9" />
        </g>
      )}

      {/* overhead guard */}
      <polygon points="82,-110 91,-110 101,-238 92,-238" fill={C.ink} />
      <polygon points="177,-96 186,-96 186,-238 177,-238" fill={C.ink} />
      <rect x="86" y="-246" width="108" height="9" rx="2" fill={C.ink} />
      <rect x="96" y="-238" width="84" height="3" fill={C.textGrey} />

      {/* seat and steering */}
      <path d="M100,-112 L100,-152 Q100,-162 110,-162 L116,-162 L121,-130 L140,-130 L140,-112 Z" fill={C.ink} />
      <line x1="156" y1="-104" x2="168" y2="-144" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="169" cy="-146" rx="13" ry="3.5" fill={C.ink} transform="rotate(-18 169 -146)" />

      {/* tilt cylinder, behind the body */}
      <line x1="186" y1="-60" x2="208" y2="-132" stroke={C.textGrey} strokeWidth="7" strokeLinecap="round" />

      {/* body */}
      <path d="M6,-26 L6,-88 Q6,-116 34,-116 L98,-116 L98,-26 Z" fill={t.rear} />
      <path d="M62,-26 L62,-114 L150,-114 L178,-100 L202,-100 L202,-26 Z" fill={t.body} />
      <rect x="62" y="-114" width="88" height="5" fill={t.rear} />
      <rect x="118" y="-84" width="38" height="11" rx="2" fill={C.white} />
      <rect x="8" y="-82" width="6" height="16" rx="1" fill={C.white} />

      {/* chassis and wheel arches */}
      <rect x="0" y="-36" width="208" height="22" rx="4" fill={C.ink} />
      <circle cx="48" cy="-26" r="31" fill={C.ink} />
      <circle cx="170" cy="-30" r="35" fill={C.ink} />

      <Wheel cx={48} cy={-26} r={26} {...part('wheel-rear')} />
      <Wheel cx={170} cy={-30} r={30} {...part('wheel-front')} />

      {/* outer mast */}
      <rect x="204" y="-268" width="12" height="262" fill={C.textGrey} />
      <g {...part('inner')} transform={`translate(0 ${-lift / 2})`}>
        <rect x="214" y="-262" width="9" height="256" fill={C.ink} />
      </g>

      {/* carriage, forks and load */}
      <g {...part('carriage')} transform={`translate(0 ${-lift})`}>
        <rect x="224" y="-122" width="7" height="116" fill={C.ink} />
        <rect x="224" y="-122" width="20" height="6" fill={C.ink} />
        <rect x="224" y="-96" width="20" height="5" fill={C.ink} />
        <rect x="224" y="-66" width="16" height="58" fill={C.ink} />
        <path d="M230,-12 L334,-12 L340,-8 L340,-6 L230,-6 Z" fill={C.ink} />
        {load && <Load />}
      </g>
    </g>
  );
}

function Wheel({ cx, cy, r, ...rest }: { cx: number; cy: number; r: number }) {
  return (
    <g {...rest} data-cx={cx} data-cy={cy}>
      <circle cx={cx} cy={cy} r={r} fill={C.ink} />
      <circle cx={cx} cy={cy} r={r * 0.5} fill={C.textGrey} />
      <rect x={cx - 2.5} y={cy - r * 0.5} width="5" height={r * 0.32} fill={C.shadeGrey} />
      <rect x={cx - 2.5} y={cy + r * 0.18} width="5" height={r * 0.32} fill={C.shadeGrey} />
      <circle cx={cx} cy={cy} r={r * 0.16} fill={C.shadeGrey} />
    </g>
  );
}

// A pallet with one boxed order on it. Sits on the forks, bottom at y = -12.
export function Load({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="238" y="-27" width="94" height="6" fill={C.tonedTextGrey} />
      <rect x="240" y="-21" width="12" height="9" fill={C.textGrey} />
      <rect x="279" y="-21" width="12" height="9" fill={C.textGrey} />
      <rect x="318" y="-21" width="12" height="9" fill={C.textGrey} />
      <Box x={244} y={-103} w={82} h={76} />
    </g>
  );
}

export function Box({ x, y, w, h, tape = true }: { x: number; y: number; w: number; h: number; tape?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.white} stroke={C.textGrey} strokeWidth="2" />
      <line x1={x} y1={y + h * 0.16} x2={x + w} y2={y + h * 0.16} stroke={C.shadeGrey} strokeWidth="2" />
      {tape && <rect x={x + w * 0.44} y={y} width={Math.max(5, w * 0.1)} height={h} fill={C.lindeRed} />}
      {w > 50 && <rect x={x + w * 0.64} y={y + h * 0.52} width={w * 0.26} height={h * 0.22} fill={C.lightGrey} />}
    </g>
  );
}
