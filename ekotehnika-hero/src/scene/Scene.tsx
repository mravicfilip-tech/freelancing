// The warehouse the forklift drives through. One station per pillar, each STATION_W wide, in
// pillar order. The world layer pans left as the visitor scrolls, the back layer pans at half
// speed for depth, and the main forklift stays put in the frame.

import type { ReactNode } from 'react';
import { Box, Forklift } from './Forklift';
import { C } from './tokens';

export const STATION_W = 840;
export const SCENE_H = 700;
export const FLOOR_Y = 600;
export const TRUCK_X = 200;
const STATIONS = 4;
const WORLD_W = STATION_W * STATIONS + 200;

export function Scene({ spot }: { spot: boolean }) {
  return (
    <svg
      className="scene-svg"
      viewBox={`0 0 ${STATION_W} ${SCENE_H}`}
      preserveAspectRatio="xMinYMax slice"
      role="img"
      aria-label="Ilustracija, Linde viljuškar prenosi paletu sa robom kroz skladište, od novih viljuškara, preko najma i servisa, do polovnih viljuškara"
    >
      <rect width={STATION_W} height={SCENE_H} fill={C.hoverLightGrey} />
      <g data-part="back">
        <BackRacks />
      </g>
      <g data-part="world">
        <World />
      </g>
      <g data-part="truck" transform={`translate(${TRUCK_X} ${FLOOR_Y})`}>
        <Forklift main load spot={spot} lift={40} />
      </g>
    </svg>
  );
}

function BackRacks() {
  const mods = [];
  for (let x = 40; x < STATION_W + WORLD_W / 2; x += 300) {
    mods.push(
      <g key={x}>
        <rect x={x} y={250} width={6} height={320} fill={C.shadeGrey} />
        <rect x={x + 214} y={250} width={6} height={320} fill={C.shadeGrey} />
        {[330, 410, 490].map((y) => (
          <g key={y}>
            <rect x={x} y={y} width={220} height={5} fill={C.shadeGrey} />
            <rect x={x + 16} y={y - 44} width={56} height={44} fill={C.lightGrey} />
            <rect x={x + 82} y={y - 34} width={48} height={34} fill={C.lightGrey} />
            {y !== 410 && <rect x={x + 142} y={y - 44} width={60} height={44} fill={C.lightGrey} />}
          </g>
        ))}
      </g>,
    );
  }
  return (
    <>
      <rect y={570} width={STATION_W + WORLD_W} height={14} fill={C.lightGrey} />
      {mods}
    </>
  );
}

function World() {
  return (
    <>
      {/* ceiling and lamps */}
      <rect width={WORLD_W} height={26} fill={C.shadeGrey} />
      {Array.from({ length: Math.ceil(WORLD_W / 280) }, (_, i) => (
        <g key={i} transform={`translate(${140 + i * 280} 26)`}>
          <rect x={-1.5} width={3} height={34} fill={C.textGrey} />
          <path d="M-26,52 L-14,34 L14,34 L26,52 Z" fill={C.textGrey} />
          <rect x={-22} y={52} width={44} height={4} fill={C.white} />
        </g>
      ))}

      {/* building columns mark each station */}
      {Array.from({ length: STATIONS + 1 }, (_, i) => (
        <rect key={i} x={i * STATION_W - 12} y={26} width={24} height={FLOOR_Y - 26} fill={C.shadeGrey} />
      ))}

      <StationNovi x={0} />
      <StationNajam x={STATION_W} />
      <StationServis x={STATION_W * 2} />
      <StationPolovni x={STATION_W * 3} />

      {/* floor */}
      <rect y={FLOOR_Y - 14} width={WORLD_W} height={14} fill={C.lightGrey} />
      <rect y={FLOOR_Y} width={WORLD_W} height={SCENE_H - FLOOR_Y} fill={C.shadeGrey} />
      <rect y={FLOOR_Y} width={WORLD_W} height={3} fill={C.tonedTextGrey} />
      {Array.from({ length: Math.ceil(WORLD_W / 70) }, (_, i) => (
        <rect key={i} x={i * 70} y={638} width={34} height={4} fill={C.white} />
      ))}
    </>
  );
}

// A red sign on the wall above each station, in the Linde logo's red box.
function Sign({ x, children }: { x: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} 92)`}>
      <rect x={30} y={-28} width={2} height={28} fill={C.textGrey} />
      <rect x={64} y={-28} width={2} height={28} fill={C.textGrey} />
      <rect width={96} height={96} fill={C.lindeRed} />
      <g fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </g>
  );
}

function Rack({ x, w = 170, levels = [110, 220, 330], fill = true }: { x: number; w?: number; levels?: number[]; fill?: boolean }) {
  const top = FLOOR_Y - Math.max(...levels) - 70;
  return (
    <g>
      <rect x={x} y={top} width={8} height={FLOOR_Y - top} fill={C.textGrey} />
      <rect x={x + w - 8} y={top} width={8} height={FLOOR_Y - top} fill={C.textGrey} />
      {levels.map((lv, i) => {
        const y = FLOOR_Y - lv;
        return (
          <g key={lv}>
            <rect x={x} y={y} width={w} height={8} fill={C.lindeRed} />
            {fill && (
              <>
                <Box x={x + 14} y={y - 62} w={64} h={62} tape={i !== 1} />
                {i !== 2 && <Box x={x + 88} y={y - 50} w={66} h={50} tape={i === 0} />}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Pallet({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={94} height={6} fill={C.tonedTextGrey} />
      <rect x={2} y={6} width={12} height={9} fill={C.textGrey} />
      <rect x={41} y={6} width={12} height={9} fill={C.textGrey} />
      <rect x={80} y={6} width={12} height={9} fill={C.textGrey} />
    </g>
  );
}

// Novi viljuskari. A showroom plinth with a new truck, the stock rack behind the main truck.
function StationNovi({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <Rack x={28} />
      <Sign x={372}>
        <path d="M48 20 L55 41 L76 48 L55 55 L48 76 L41 55 L20 48 L41 41 Z" fill={C.white} stroke="none" />
      </Sign>
      <rect x={596} y={FLOOR_Y - 14} width={232} height={14} fill={C.white} />
      <rect x={596} y={FLOOR_Y - 14} width={232} height={4} fill={C.lindeRed} />
      <g transform={`translate(812 ${FLOOR_Y - 14}) scale(-0.62 0.62)`}>
        <Forklift lift={0} />
      </g>
    </g>
  );
}

// Najam. A loading dock with the shutter half up, orders waiting inside, empty pallets behind.
function StationNajam({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Pallet key={i} x={50} y={FLOOR_Y - 15 - i * 15} />
      ))}
      <Sign x={372}>
        <circle cx={48} cy={50} r={25} />
        <path d="M48 36 V50 L59 57" />
        <path d="M30 22 L22 30 M66 22 L74 30" />
      </Sign>
      <rect x={604} y={300} width={216} height={FLOOR_Y - 300} fill={C.textGrey} />
      <rect x={616} y={312} width={192} height={FLOOR_Y - 312} fill={C.ink} />
      <rect x={616} y={312} width={192} height={138} fill={C.shadeGrey} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={616} y={330 + i * 20} width={192} height={2} fill={C.tonedTextGrey} />
      ))}
      <rect x={698} y={444} width={28} height={6} fill={C.textGrey} />
      <Pallet x={640} y={FLOOR_Y - 15} />
      <Box x={646} y={FLOOR_Y - 15 - 70} w={80} h={70} />
      <Box x={738} y={FLOOR_Y - 52} w={56} h={52} tape={false} />
      <rect x={600} y={FLOOR_Y - 44} width={10} height={30} fill={C.ink} />
      <rect x={814} y={FLOOR_Y - 44} width={10} height={30} fill={C.ink} />
    </g>
  );
}

// Servis. A truck up on the service lift, the tool wall behind it, a tool cart and charger at the back.
function StationServis({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={34} y={FLOOR_Y - 104} width={98} height={90} fill={C.lindeRed} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={44} y={FLOOR_Y - 94 + i * 26} width={78} height={3} fill={C.white} />
      ))}
      <rect x={30} y={FLOOR_Y - 110} width={106} height={8} fill={C.primary700} />
      <circle cx={48} cy={FLOOR_Y - 8} r={8} fill={C.ink} />
      <circle cx={118} cy={FLOOR_Y - 8} r={8} fill={C.ink} />
      <rect x={146} y={FLOOR_Y - 134} width={40} height={120} fill={C.textGrey} />
      <rect x={154} y={FLOOR_Y - 122} width={24} height={14} fill={C.white} />
      <rect x={162} y={FLOOR_Y - 96} width={8} height={8} fill={C.lindeRed} />

      <Sign x={372}>
        <path d="M28 70 L56 42" strokeWidth={11} />
        <circle cx={62} cy={36} r={17} fill={C.white} stroke="none" />
        <rect x={56} y={12} width={12} height={22} fill={C.lindeRed} stroke="none" transform="rotate(45 62 36)" />
      </Sign>

      <rect x={608} y={150} width={210} height={150} fill={C.lightGrey} />
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={622 + c * 20} cy={164 + r * 24} r={2} fill={C.shadeGrey} />
        )),
      )}
      <path d="M640 180 L640 260 M628 180 L652 180" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <path d="M690 176 L690 238 M682 238 L698 238 L694 270 L686 270 Z" stroke={C.textGrey} strokeWidth={6} strokeLinejoin="round" fill={C.textGrey} />
      <path d="M740 262 L774 196" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <circle cx={778} cy={188} r={12} fill="none" stroke={C.ink} strokeWidth={7} />

      <rect x={606} y={326} width={14} height={FLOOR_Y - 326} fill={C.ink} />
      <rect x={812} y={326} width={14} height={FLOOR_Y - 326} fill={C.ink} />
      <rect x={606} y={FLOOR_Y - 62} width={220} height={8} fill={C.textGrey} />
      <g transform={`translate(806 ${FLOOR_Y - 62}) scale(-0.62 0.62)`}>
        <Forklift tone="grey" lift={0} />
      </g>
    </g>
  );
}

// Polovni. A checked used truck in a marked bay under the warranty shield, stock rack behind.
function StationPolovni({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <Rack x={28} levels={[120, 240]} />
      <Sign x={372}>
        <path d="M48 18 L74 28 L74 48 C74 64 62 74 48 80 C34 74 22 64 22 48 L22 28 Z" />
        <path d="M36 48 L45 57 L61 40" />
      </Sign>
      <rect x={596} y={FLOOR_Y} width={6} height={60} fill={C.white} />
      <rect x={826} y={FLOOR_Y} width={6} height={60} fill={C.white} />
      <g transform={`translate(812 ${FLOOR_Y}) scale(-0.62 0.62)`}>
        <Forklift lift={0} />
      </g>
      <g transform={`translate(676 330)`}>
        <rect x={34} y={60} width={2} height={40} fill={C.textGrey} />
        <path d="M35 0 L64 10 L64 32 C64 48 52 58 35 64 C18 58 6 48 6 32 L6 10 Z" fill={C.lindeRed} />
        <path d="M22 32 L31 41 L48 24" fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}
