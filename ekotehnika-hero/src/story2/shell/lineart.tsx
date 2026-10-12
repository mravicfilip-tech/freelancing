// Black line art of four Linde trucks seen from the side, standing on the bottom rule of the footer. MT15 pallet truck,
// H30 counterbalance, R16 reach truck and N20 order picker. One stroke weight, no fill, drawn with the ground at y 0.
// Decorative, aria-hidden. Hand built for this footer, not traced from a Linde file.
import type { ReactNode } from 'react';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' } as const;

// A tyre with its rim and hub, centre height equals the radius so it stands on the ground.
const Wheel = ({ cx, r }: { cx: number; r: number }) => (
  <g>
    <circle cx={cx} cy={-r} r={r} {...S} />
    <circle cx={cx} cy={-r} r={r * 0.68} {...S} />
    <circle cx={cx} cy={-r} r={r * 0.22} {...S} />
  </g>
);

// Linde H30, counterbalance truck with a rounded counterweight, overhead guard, mast and forks
function H30() {
  return (
    <g>
      <Wheel cx={58} r={26} />
      <Wheel cx={176} r={33} />
      {/* body, counterweight, seat deck and dash, with the two wheel arches cut into the sill */}
      <path d="M12 -34 C4 -56 4 -92 22 -104 H74 L82 -90 H128 L134 -72 H216 V-34 H214 A38 38 0 0 0 138 -34 H90 A32 32 0 0 0 26 -34 Z" {...S} />
      <path d="M22 -104 C16 -84 16 -56 12 -34" {...S} strokeOpacity={0.5} />
      <path d="M140 -72 V-52 H212" {...S} strokeOpacity={0.5} />
      {/* overhead guard, two posts and a roof plate */}
      <path d="M96 -90 L90 -204 M192 -72 L186 -204" {...S} />
      <path d="M80 -204 H202 V-196 H80 Z" {...S} />
      <path d="M96 -150 L92 -190" {...S} strokeOpacity={0.5} />
      {/* seat and steering wheel */}
      <path d="M98 -90 V-100 H132 V-90 M100 -100 L94 -142 Q94 -148 100 -148 H108 L112 -100" {...S} />
      <path d="M170 -72 L154 -122" {...S} />
      <path d="M142 -126 Q154 -132 164 -122" {...S} />
      {/* mast, carriage and forks */}
      <path d="M218 -232 V-6 M228 -232 V-6 M238 -246 V-6" {...S} />
      <path d="M218 -232 H238" {...S} />
      <path d="M228 -190 H238 M228 -140 H238 M228 -90 H238" {...S} strokeOpacity={0.5} />
      <path d="M242 -96 V-6 H250 V-96 Z" {...S} />
      <path d="M242 -10 H336 Q340 -10 340 -6 V-2 Q340 0 336 0 H242" {...S} />
    </g>
  );
}

// Linde R16, reach truck, a compartment at the rear, a tall three stage mast and a reach carriage with forks
function R16() {
  return (
    <g>
      <Wheel cx={46} r={22} />
      <Wheel cx={206} r={11} />
      <Wheel cx={284} r={11} />
      {/* battery housing and drive unit */}
      <path d="M12 -26 V-86 Q12 -94 20 -94 H152 V-26 H72 A26 26 0 0 0 20 -26 Z" {...S} />
      <path d="M12 -26 H20 M152 -26 V-22 H300 V-12 H152" {...S} />
      <path d="M96 -94 V-26 M96 -60 H152" {...S} strokeOpacity={0.5} />
      {/* operator compartment and overhead guard */}
      <path d="M16 -94 V-228 H100 L104 -94" {...S} />
      <path d="M8 -228 H112" {...S} />
      <path d="M26 -94 L26 -128 H80 V-94" {...S} />
      <path d="M92 -94 L84 -150 H72" {...S} />
      <path d="M62 -154 H84" {...S} />
      {/* mast, three stages, with its cross members */}
      <path d="M200 -296 V-24 M214 -296 V-24 M228 -280 V-24" {...S} />
      <path d="M200 -296 H214 M200 -240 H214 M200 -184 H214 M200 -128 H214 M200 -72 H214" {...S} strokeOpacity={0.5} />
      {/* reach carriage and forks */}
      <path d="M232 -110 V-14 H244 V-110 Z" {...S} />
      <path d="M232 -86 H152 M232 -52 H152" {...S} strokeOpacity={0.5} />
      <path d="M244 -12 H342 Q346 -12 346 -8 V-3 Q346 0 342 0 H244" {...S} />
    </g>
  );
}

// Linde MT15, low lift pallet truck with a folding platform and a tiller
function MT15() {
  return (
    <g>
      <Wheel cx={56} r={15} />
      <circle cx={196} cy={-5} r={5} {...S} />
      <circle cx={338} cy={-5} r={5} {...S} />
      {/* power unit */}
      <path d="M16 -14 V-72 Q16 -84 30 -84 H100 Q114 -84 118 -70 L124 -14 H84 A28 28 0 0 0 28 -14 Z" {...S} />
      <path d="M30 -64 H104 M82 -84 V-92 H100 V-84" {...S} strokeOpacity={0.6} />
      {/* tiller arm and handle */}
      <path d="M62 -84 L50 -176" {...S} />
      <path d="M36 -178 H70 Q76 -178 76 -172 V-168 H36 Z" {...S} />
      {/* folding platform */}
      <path d="M16 -26 H-30 V-18 H16 M-30 -18 V-12 H16" {...S} />
      {/* forks */}
      <path d="M124 -14 H342 Q348 -14 348 -9 V-4 Q348 0 342 0 H124" {...S} />
      <path d="M124 -9 H348" {...S} strokeOpacity={0.5} />
    </g>
  );
}

// Linde N20, low level order picker with an operator platform, side guards and a load backrest
function N20() {
  return (
    <g>
      <Wheel cx={70} r={15} />
      <circle cx={214} cy={-5} r={5} {...S} />
      <circle cx={356} cy={-5} r={5} {...S} />
      {/* power unit with the operator platform at the rear */}
      <path d="M40 -14 V-70 Q40 -84 54 -84 H132 Q146 -84 150 -70 L154 -14 H100 A30 30 0 0 0 40 -14 Z" {...S} />
      <path d="M54 -64 H136" {...S} strokeOpacity={0.6} />
      <path d="M40 -26 H-34 V-16 H40 M-34 -16 V-12 H40" {...S} />
      {/* side guards and the back rail of the platform */}
      <path d="M-30 -26 V-132 H40 V-84" {...S} />
      <path d="M-30 -80 H40 M-30 -106 H40" {...S} strokeOpacity={0.6} />
      <path d="M40 -132 L54 -190 H76" {...S} />
      <path d="M44 -192 H90" {...S} />
      {/* load backrest and forks */}
      <path d="M154 -14 V-128 H162 V-14" {...S} />
      <path d="M154 -14 H360 Q366 -14 366 -9 V-4 Q366 0 360 0 H154" {...S} />
      <path d="M154 -9 H366" {...S} strokeOpacity={0.5} />
    </g>
  );
}

const TRUCKS: { id: string; x: number; Art: () => ReactNode }[] = [
  { id: 'MT15', x: 40, Art: MT15 },
  { id: 'H30', x: 420, Art: H30 },
  { id: 'R16', x: 800, Art: R16 },
  { id: 'N20', x: 1190, Art: N20 },
];

// A strip 1546 wide and 300 tall, from the tip of the MT15 platform at x 10 to the fork end of the N20 at x 1556. The ground line
// is at the bottom edge. It fills the width of the footer, so the drawing is as wide as the grid and scales with it.
export function FooterLine() {
  return (
    <svg className="sx-line" viewBox="10 -300 1546 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false" style={{ overflow: 'visible' }}>
      {TRUCKS.map((t) => (
        <g transform={`translate(${t.x} 0)`} key={t.id}>
          <t.Art />
        </g>
      ))}
    </svg>
  );
}
