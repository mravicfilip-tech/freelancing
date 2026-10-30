// The Najam hall and the site around it, everything that stands still. The hall is a cutaway on a platform 1.2 m over the yard, the
// height of a lorry's bed. The two far walls stand the full 9.6 m with their columns, an eave beam and the edge of the roof drawn as a thin
// slab on top of them, so the camera always looks in and no column stands without the beam it carries. The two near walls are a low
// plinth, and the four dock doors stand in the dock wall. The floor carries its markings edge to edge, the aisle lines, the lane
// arrows, the staging lanes in front of the docks with their pallets, the hatched walkway, the dock bays and the bays of the floor
// storage. A charging corner, a small office, stacks of empty pallets and a wrapping station fill the floor the racks leave. Outside
// the docks a paved yard has a marked bay at every door, a yard road with a kerb that runs out to the frame edge, and a hedge and a
// line of the site's low poly trees closing it off, with the marked bays of a car park on the forecourt in front of the hall. All of it is instanced and
// in the light ground and the LMH greys. The hall's metres are the ones of najamplan.ts, the platform top is y 0 in them.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { ModelName } from './models';
import { BoxSet, Hedge, Kerb, LampPost, Trees, Van, type BoxItem, type TreeSpec } from './props';
import { Barrier, GateHouse } from './yard';
import { K, lam, lit, rng, wordmarkSign } from './kit';
import { HALL } from './najamplan';
import { Slats, apron, arrow, beamFlange, beamWeb, black, darkGrey, doorMat, glazing, hatch, line, lineFaint, lineWhite, loadMats, palletBase, rackGrey, roadMat, roofMat, slab, wallBase, wallMat, wrapBand, wrapShell, type SlatItem } from './najamkit';

// ---- the hall's measures ----------------------------------------------------------------------------------------------

export const DOOR_W = 3.6;
export const DOOR_H = 3.9;
export const WALL_T = 0.4;
export const PLINTH = 1.0;
export const WALL_H = 10;
// the wordmark on the long wall that faces the forecourt, 8 m wide, low on the wall from the dock corner, so it shows from the high views and is never behind the words of N2 or of the flights
export const SIGN_W = 8;
const SIGN_Y = 3.0;
const SIGN_X = -1;
export const BACK_X = HALL.backX;
export const FRONT_Z = 15.6;
// the platform, a little proud of the walls
const PX0 = BACK_X - 0.3;
const PX1 = HALL.dockX + WALL_T;
const PZ0 = HALL.sideZ - 0.3;
const PZ1 = FRONT_Z + 0.3;
const MIDZ = (PZ0 + PZ1) / 2;
// the face of the dock wall the lorries back onto, and the walls' footprints
export const DOCK_OUT = PX1 + 0.35;

// The rented trucks that wait at their bays along the far wall, facing the docks. Model, x, heading in radians. The row runs the length
// of the wall, six trucks, so the strip in front of it reads as a depot's bays and not as a few trucks left about.
export const PARK_Z = -14.5;
export const PARKED: [ModelName, number, number][] = [
  ['h30d', 3.0, 0],
  ['x50', -2.4, 0],
  ['n20', -8.0, 0],
  ['r16', -13.6, 0],
  ['x50', -19.2, 0],
  ['d12', -24.8, 0],
];
// No charging corner and no wrapping station any more. The inside is seen from the dock end of the work aisle in N3, where the whole left of the frame
// is the long wall of the hall and the words lie over it, so the left of the hall is left as floor and its markings.
export const CHARGING: [ModelName, number, number, number][] = [];
// the two lanes of the dock bays the trucks of the plan work in, see najamdock.ts
export const DOCK_LANE_X = 10.4;

// ---- pallets standing on the floor ------------------------------------------------------------------------------------

export type PalletSets = { base: BoxItem[]; loads: BoxItem[][]; shell: BoxItem[]; bands: BoxItem[] };
export const newSets = (): PalletSets => ({ base: [], loads: [[], [], []], shell: [], bands: [] });

// A loaded pallet on the floor, 1.2 m along x or, turned, along z.
export function loadedPallet(s: PalletSets, r: () => number, x: number, z: number, turned = false, y0 = 0) {
  const h = 0.9 + r() * 0.4;
  const [a, b] = turned ? [0.82, 1.2] : [1.2, 0.82];
  const [la, lb] = turned ? [0.88, 1.08] : [1.08, 0.88];
  s.base.push([x, y0 + 0.07, z, a, 0.14, b]);
  s.loads[Math.floor(r() * 3)].push([x, y0 + 0.14 + h / 2, z, la, h, lb]);
  s.shell.push([x, y0 + 0.14 + h / 2, z, la + 0.05, h + 0.03, lb + 0.05]);
  s.bands.push([x, y0 + 0.14 + h * 0.3, z, la + 0.07, 0.07, lb + 0.07], [x, y0 + 0.14 + h * 0.68, z, la + 0.07, 0.07, lb + 0.07]);
}

export function PalletSet({ s }: { s: PalletSets }) {
  return (
    <group>
      <BoxSet items={s.base} mat={palletBase} cast />
      {s.loads.map((l, i) => (
        <BoxSet key={i} items={l} mat={loadMats[i]} cast />
      ))}
      <BoxSet items={s.shell} mat={wrapShell} receive={false} />
      <BoxSet items={s.bands} mat={wrapBand} receive={false} />
    </group>
  );
}

// ---- the lanes of the staging floor -----------------------------------------------------------------------------------

// In front of every dock two lanes run along x from the walkway toward the racks, 1.3 m wide with three pallet places each. The lanes of
// dock 4 are one, the office takes the place of the other. Between the doors the wall lane holds what has just come off a lorry, 1.2 m
// pallets turned along the wall.
const LANE_X0 = 2.8;
const LANE_X1 = 6.8;
export const LANE_W = 1.3;
export const laneZ = (dock: number, side: -1 | 1) => HALL.docks[dock] + side * 1.55;
export const WALL_LANE_X = 13.15;
// the places of the wall lane between dock i and i + 1, three of them 1.3 m apart on the middle of the gap
export const wallLaneZ = (gap: number, slot: number) => (HALL.docks[gap] + HALL.docks[gap + 1]) / 2 + (slot - 1) * 1.3;

// ---- the hall ---------------------------------------------------------------------------------------------------------

export type HallRefs = { doors: React.MutableRefObject<(THREE.Group | null)[]>; roofHatch: React.RefObject<THREE.Group | null>; roof: React.RefObject<THREE.Group | null> };

export function Hall({ doors, roofHatch, roof }: HallRefs) {
  const sign = useMemo(() => {
    const { parts, s, view } = wordmarkSign(SIGN_W, 0.25, 0.08);
    return { parts: parts.map((p) => ({ ...p, material: lam(p.fill, { emissive: lit(p.fill).multiplyScalar(0.5) }) })), s, view };
  }, []);
  const d = useMemo(() => {
    // the platform and its kerb, the floor is its top face
    const platform: BoxItem[] = [[(PX0 + PX1) / 2, -0.6, MIDZ, PX1 - PX0, 1.2, PZ1 - PZ0]];
    const kerb: BoxItem[] = [
      [(PX0 + PX1) / 2, 0.03, PZ1 - 0.07, PX1 - PX0, 0.06, 0.14],
      [PX1 - 0.07, 0.03, MIDZ, 0.14, 0.06, PZ1 - PZ0],
    ];

    // the shell, closed on four sides. The back wall, the far side wall and the near side wall are a panel 10 m high with a column every 6 m on
    // their inside faces, the dock wall is a facade of piers between the doors with a lintel over each door, a plinth band round the foot of all
    // four, a parapet round the roof and a roof of slabs with a long roof light between them. The inside shows only to a camera that has gone
    // through a door or a roof light. None of it casts a shadow, so the hall is lit as brightly as the yard.
    const wall: BoxItem[] = [];
    const base: BoxItem[] = [];
    const cols: BoxItem[] = [];
    const lenZ = PZ1 - PZ0;
    const lenX = PX1 - PX0;
    wall.push([BACK_X + 0.15, WALL_H / 2, MIDZ, 0.3, WALL_H, lenZ]);
    wall.push([(PX0 + PX1) / 2 + 0.15, WALL_H / 2, HALL.sideZ - 0.15, lenX - 0.3, WALL_H, 0.3]);
    wall.push([(BACK_X + PX1) / 2, WALL_H / 2, FRONT_Z + 0.15, PX1 - BACK_X, WALL_H, 0.3]);
    base.push([BACK_X - 0.02, 0.35, MIDZ, 0.06, 0.7, lenZ], [(PX0 + PX1) / 2, 0.35, HALL.sideZ - 0.32, lenX, 0.7, 0.06], [(BACK_X + PX1) / 2, 0.35, FRONT_Z + 0.32, PX1 - BACK_X, 0.7, 0.06]);
    for (let z = HALL.sideZ + 1.2; z < PZ1; z += 6) cols.push([BACK_X + 0.5, WALL_H / 2, z, 0.4, WALL_H, 0.4]);
    // columns on the back wall and the far side wall only, the near long wall stays plain, the words of N3 lie over it
    for (let x = BACK_X + 1.5; x < HALL.dockX - 2; x += 6) cols.push([x, WALL_H / 2, HALL.sideZ + 0.2, 0.4, WALL_H, 0.4]);
    // the dock wall, piers between the doors and a lintel over each, the base band across the piers
    const wx = HALL.dockX + WALL_T / 2;
    const edges = [HALL.sideZ, ...HALL.docks.flatMap((z) => [z - DOOR_W / 2, z + DOOR_W / 2]), FRONT_Z];
    for (let i = 0; i < edges.length; i += 2) {
      const zc = (edges[i] + edges[i + 1]) / 2;
      const len = edges[i + 1] - edges[i];
      wall.push([wx, WALL_H / 2, zc, WALL_T, WALL_H, len]);
      base.push([PX1 + 0.02, 0.35, zc, 0.06, 0.7, len]);
    }
    wall.push([wx, WALL_H / 2, FRONT_Z + 0.15, WALL_T, WALL_H, 0.3]);
    HALL.docks.forEach((z) => wall.push([wx, (DOOR_H + WALL_H) / 2, z, WALL_T, WALL_H - DOOR_H, DOOR_W]));
    // the roof, slabs along z between the five long roof lights, 1.8 m wide, a parapet round it with a light cap, and the roof units
    const roofS: BoxItem[] = [];
    const lightsX = LIGHTS_X;
    let x0 = PX0;
    lightsX.forEach((lx) => {
      roofS.push([(x0 + lx - 0.9) / 2, WALL_H + 0.2, MIDZ, lx - 0.9 - x0, 0.4, lenZ]);
      x0 = lx + 0.9;
    });
    roofS.push([(x0 + PX1) / 2, WALL_H + 0.2, MIDZ, PX1 - x0, 0.4, lenZ]);
    const lights = lightsX.map((lx) => [[lx, WALL_H + 0.16, MIDZ, 1.8, 0.1, lenZ - 0.6] as BoxItem]);
    const para: BoxItem[] = [
      [PX0 + 0.1, WALL_H + 0.7, MIDZ, 0.3, 0.6, lenZ],
      [PX1 - 0.15, WALL_H + 0.7, MIDZ, 0.3, 0.6, lenZ],
      [(PX0 + PX1) / 2, WALL_H + 0.7, PZ0 + 0.15, lenX, 0.6, 0.3],
      [(PX0 + PX1) / 2, WALL_H + 0.7, PZ1 - 0.15, lenX, 0.6, 0.3],
    ];
    const paraCap: BoxItem[] = [
      [PX0 + 0.1, WALL_H + 1.03, MIDZ, 0.42, 0.06, lenZ + 0.1],
      [PX1 - 0.15, WALL_H + 1.03, MIDZ, 0.42, 0.06, lenZ + 0.1],
      [(PX0 + PX1) / 2, WALL_H + 1.03, PZ0 + 0.15, lenX, 0.06, 0.42],
      [(PX0 + PX1) / 2, WALL_H + 1.03, PZ1 - 0.15, lenX, 0.06, 0.42],
    ];
    const units: BoxItem[] = [];
    const unitFans: BoxItem[] = [];
    ([[-20, -8, 3.4, 2.0, 1.7], [-9, 6, 2.6, 1.7, 1.5], [7, -9, 3.0, 1.9, 1.6], [-27, 9, 2.2, 2.2, 1.3], [9, 10, 2.4, 1.5, 1.3], [-12, -12, 1.6, 1.6, 2.4]] as const).forEach(([x, z, w, dd, h]) => {
      units.push([x, WALL_H + 0.4 + h / 2, z, w, h, dd]);
      unitFans.push([x, WALL_H + 0.4 + h + 0.03, z, w * 0.6, 0.06, dd * 0.6]);
    });
    // the ceiling seen from inside, a truss every 6 m with its lamps hung below and a line of lamps between
    const trusses: BoxItem[] = [];
    const ceilLamps: BoxItem[] = [];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) trusses.push([x, WALL_H - 0.5, MIDZ, 0.3, 0.9, lenZ - 0.6]);
    for (let x = BACK_X + 6; x < HALL.dockX - 1; x += 6) for (let z = HALL.sideZ + 3; z < FRONT_Z - 1; z += 5) ceilLamps.push([x, WALL_H - 1.2, z, 0.3, 0.1, 3.2]);
    // the door frames, a lintel head, the canopy over each door with its fascia, the bumpers on the outside of the wall and the levellers
    const canopy: BoxItem[] = [];
    const fascia: BoxItem[] = [];
    const frame: BoxItem[] = [];
    const door: BoxItem[] = [];
    const bumper: BoxItem[] = [];
    const lev: BoxItem[] = [];
    HALL.docks.forEach((z) => {
      frame.push([HALL.dockX + 0.2, DOOR_H / 2, z - DOOR_W / 2 - 0.06, 0.4, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H / 2, z + DOOR_W / 2 + 0.06, 0.4, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H + 0.06, z, 0.4, 0.12, DOOR_W + 0.24]);
      // the slat the door rolls up into
      door.push([HALL.dockX + 0.2, DOOR_H + 0.2, z, 0.1, 0.2, DOOR_W]);
      canopy.push([PX1 + 1.3, 5.0, z, 2.6, 0.25, 5.4]);
      fascia.push([PX1 + 2.55, 4.85, z, 0.1, 0.55, 5.4]);
      for (const sd of [-1.35, 1.35]) bumper.push([PX1 + 0.15, -0.35, z + sd, 0.3, 0.5, 0.3]);
      lev.push([HALL.dockX - 1.2, 0.04, z, 2.4, 0.08, 2.4]);
    });
    void edges;

    // ---- the floor, slab joints every 6 m and the markings of the whole of it
    const joints: BoxItem[] = [];
    for (let x = BACK_X + 3; x < HALL.dockX; x += 6) joints.push([x, 0.02, MIDZ, 0.04, 0.01, FRONT_Z - HALL.sideZ]);
    for (let z = HALL.sideZ + 4; z < FRONT_Z; z += 6) joints.push([(HALL.dockX + BACK_X) / 2, 0.02, z, HALL.dockX - BACK_X, 0.01, 0.04]);

    const marks: BoxItem[] = [];
    const slats: SlatItem[] = [];
    const hl = (x0: number, x1: number, z: number, t = 0.1) => marks.push([(x0 + x1) / 2, 0.03, z, x1 - x0, 0.01, t]);
    const vl = (x: number, z0: number, z1: number, t = 0.1) => marks.push([x, 0.03, (z0 + z1) / 2, t, 0.01, z1 - z0]);
    const rect = (x0: number, x1: number, z0: number, z1: number) => {
      hl(x0, x1, z0);
      hl(x0, x1, z1);
      vl(x0, z0, z1);
      vl(x1, z0, z1);
    };
    const dashH = (x0: number, x1: number, z: number, dash = 1.4, gap = 1.4) => {
      for (let x = x0; x + dash <= x1; x += dash + gap) marks.push([x + dash / 2, 0.03, z, dash, 0.01, 0.1]);
    };
    const dashV = (x: number, z0: number, z1: number, dash = 1.4, gap = 1.4) => {
      for (let z = z0; z + dash <= z1; z += dash + gap) marks.push([x, 0.03, z + dash / 2, 0.1, 0.01, dash]);
    };
    // the three aisles, an edge line on each side from the back wall to the mouth, a dashed middle and an arrow every 9 m, pointing the
    // way in on one side of the middle and out on the other
    HALL.aisles.forEach((za) => {
      hl(BACK_X, X_MOUTH, za - 2.3);
      hl(BACK_X, X_MOUTH, za + 2.3);
      dashH(BACK_X + 0.4, X_MOUTH, za);
      for (let x = -4; x > BACK_X + 3; x -= 9) {
        slats.push(...arrow(x, za - 1.15, Math.PI));
        slats.push(...arrow(x - 4.5, za + 1.15, 0));
      }
    });
    // the cross aisle behind the last bay, two edges and an arrow down the middle every 6 m, and the hatched keep clear at the walls
    const back = HALL.rackX0 - HALL.bays * HALL.bay;
    vl(back - 0.9, PZ0 + 0.2, PZ1 - 0.2);
    vl(back - 5.4, PZ0 + 0.2, PZ1 - 0.2);
    for (let z = HALL.sideZ + 3; z < FRONT_Z - 2; z += 6) slats.push(...arrow(back - 3.15, z, z % 12 < 6 ? Math.PI / 2 : -Math.PI / 2));
    slats.push(...hatch(back - 5.4, back - 0.9, PZ0 + 0.3, PZ0 + 1.5, 0.8), ...hatch(back - 5.4, back - 0.9, PZ1 - 1.5, PZ1 - 0.3, 0.8));
    // the hatched walkway along the dock wall, 1.2 m wide with an edge line on each side and a bar every 0.7 m
    vl(7.0, PZ0 + 0.2, PZ1 - 0.2);
    vl(8.2, PZ0 + 0.2, PZ1 - 0.2);
    slats.push(...hatch(7.0, 8.2, PZ0 + 0.2, PZ1 - 0.2, 0.7));
    // a dock bay in front of each door, two side lines and a dashed stop line with an arrow in
    HALL.docks.forEach((z) => {
      hl(DOCK_LANE_X, HALL.dockX - 0.05, z - 1.9);
      hl(DOCK_LANE_X, HALL.dockX - 0.05, z + 1.9);
      dashV(DOCK_LANE_X, z - 1.9, z + 1.9, 0.5, 0.35);
      slats.push(...arrow(DOCK_LANE_X + 1.6, z, 0, 1.8));
    });
    // the wall lane between the doors, a cell for each pallet
    for (let g = 0; g < 3; g++) {
      const a = HALL.docks[g] + 2.0;
      const b = HALL.docks[g + 1] - 2.0;
      rect(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, a, b);
      for (let s = 0; s < 4; s++) hl(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, a + ((b - a) / 3) * s * 0.9999 + 0.0, 0.06);
    }
    // the staging lanes in front of the docks, closed cells with an arrow at the walkway end
    HALL.docks.forEach((_, i) => {
      for (const side of [-1, 1] as const) {
        if (i === 3 && side === 1) continue;
        const zc = laneZ(i, side);
        rect(LANE_X0, LANE_X1, zc - LANE_W / 2, zc + LANE_W / 2);
        slats.push(...arrow(LANE_X1 - 0.6, zc, Math.PI, 1.0));
      }
    });
    // the far corner of the wall lane, where the second pallet of the lorry is set down
    rect(WALL_LANE_X - 0.8, WALL_LANE_X + 0.8, HALL.docks[0] - 4.0, HALL.docks[0] - 2.2);
    // the edge of the staging floor where the racks begin
    vl(X_MOUTH + 0.1, PZ0 + 0.2, PZ1 - 0.2, 0.14);
    // the floor storage of the front lane, five bays of 2.5 by 2.2 m, and the corner of the chargers hatched
    for (let x = -12.5; x < 0; x += 2.5) vl(x, 12.9, 15.1);
    hl(-12.5, 0, 12.9);
    hl(-12.5, 0, 15.1);
    // and a row of seven bays of 2.6 by 2.4 m along the open edge of the work aisle, where a rack block would have stood, pallets two high
    for (let x = -24.0; x <= -5.8; x += 2.6) vl(x, 10.5, 12.9);
    hl(-24.0, -5.8, 10.5);
    hl(-24.0, -5.8, 12.9);
    rect(-29.2, -21.4, 12.2, 15.2);
    slats.push(...hatch(-29.2, -21.4, 12.2, 15.2, 1.1));
    // a bay for each of the rented trucks that stand along the far wall
    PARKED.forEach(([, x]) => rect(x - 2.3, x + 2.3, PARK_Z - 1.1, PARK_Z + 1.1));

    // ---- what stands on the floor, pallets in the lanes, in the wall lane and in the floor storage
    const r = rng(77);
    const pal = newSets();
    HALL.docks.forEach((_, i) => {
      for (const side of [-1, 1] as const) {
        if (i === 3 && side === 1) continue;
        // the lanes of the first dock stay empty at the lane's walkway end for the pallets that come off the lorry
        // only the lanes right of the work aisle hold pallets, the lanes on its left lie under the term cells in N3
        if (HALL.docks[i] > 0 && !(i === 2 && side < 0)) continue;
        const n = i === 0 ? 2 : side < 0 ? 3 : 2;
        for (let p = 0; p < n; p++) loadedPallet(pal, r, LANE_X0 + 0.8 + p * 1.3, laneZ(i, side), false);
      }
    });
    // empty pallets in stacks of eight, by the back wall's corner and by the front wall
    const empties: BoxItem[] = [];
    const stackOf = (x: number, z: number, n: number, turned = false) => {
      for (let i = 0; i < n; i++) empties.push([x + (i % 2) * 0.02, 0.07 + i * 0.15, z, turned ? 0.82 : 1.2, 0.14, turned ? 1.2 : 0.82]);
    };
    stackOf(-27.5, -13.2, 10, true);
    stackOf(-27.5, -11.8, 10, true);
    stackOf(-26.1, -13.2, 8, true);

    // the chargers of the charging corner, a cabinet with a lamp on its top, and the cable
    const chargers: BoxItem[] = [];
    const lamps: BoxItem[] = [];
    CHARGING.forEach(([, x]) => {
      chargers.push([x, 0.7, 15.1, 0.7, 1.4, 0.4], [x + 0.9, 0.03, 14.3, 0.04, 0.03, 1.6]);
      lamps.push([x, 1.5, 15.1, 0.2, 0.1, 0.2]);
    });


    // the office cabin, 1.9 by 4.4 m and 2.7 m high in the corner behind the racks, out of the way of the cross aisle, its roof proud all
    // round, a door and two windows on the side that faces the hall, and two steps
    const cx = -29.7;
    const cz = -13.4;
    const cabin: BoxItem[] = [[cx, 1.4, cz, 1.9, 2.8, 4.4]];
    const cabinRoof: BoxItem[] = [[cx, 2.9, cz, 2.3, 0.14, 4.8]];
    const cabinGlass: BoxItem[] = [[cx + 0.96, 1.75, cz - 1.2, 0.04, 0.8, 1.6], [cx + 0.96, 1.75, cz + 0.5, 0.04, 0.8, 0.8]];
    const cabinDoor: BoxItem[] = [[cx + 0.96, 1.05, cz + 1.6, 0.05, 2.1, 0.9]];
    const cabinStep: BoxItem[] = [[cx + 1.25, 0.1, cz + 1.6, 0.55, 0.2, 1.2], [cx + 1.13, 0.25, cz + 1.6, 0.3, 0.1, 1.2]];
    return { platform, kerb, wall, base, cols, roofS, lights, para, paraCap, units, unitFans, trusses, ceilLamps, canopy, fascia, door, frame, bumper, lev, joints, marks, slats, pal, empties, chargers, lamps, cabin, cabinRoof, cabinGlass, cabinDoor, cabinStep };
  }, []);
  return (
    <group>
      <BoxSet items={d.platform} mat={slab} />
      <BoxSet items={d.kerb} mat={wallBase} receive={false} />
      <BoxSet items={d.wall} mat={wallMat} />
      <BoxSet items={d.base} mat={wallBase} receive={false} />
      <BoxSet items={d.cols} mat={wallMat} />
      <BoxSet items={d.frame} mat={roofMat} />
      <BoxSet items={d.door} mat={wallMat} />
      <BoxSet items={d.canopy} mat={wallMat} />
      <BoxSet items={d.fascia} mat={wallMat} />
      <BoxSet items={d.bumper} mat={black} />
      <BoxSet items={d.lev} mat={beamWeb} />
      {/* the doors roll up into their slat, hung from the head of the frame so each draws up as its scale falls */}
      {HALL.docks.map((z, i) => (
        <group key={i} ref={(g) => { doors.current[i] = g; }} position={[HALL.dockX + 0.2, DOOR_H, z]}>
          <BoxSet items={[[0, -DOOR_H / 2, 0, 0.1, DOOR_H, DOOR_W]]} mat={wallMat} />
          <BoxSet items={[1, 2, 3, 4, 5].map((g) => [0.06, -(DOOR_H / 6) * g, 0, 0.03, 0.03, DOOR_W - 0.1] as BoxItem)} mat={wallBase} receive={false} />
        </group>
      ))}
      {/* the wordmark on the front wall, extruded from the brand file the way the Kompanija building has it, reading from the forecourt */}
      <group position={[SIGN_X, SIGN_Y, PZ1 + 0.04]}>
        <group position={[-sign.s * sign.view[0], sign.s * (sign.view[1] + sign.view[3]), 0]} scale={[sign.s, -sign.s, sign.s]}>
          {sign.parts.map((p, i) => (
            <mesh key={i} geometry={p.geo} material={p.material} />
          ))}
        </group>
      </group>
      {/* the roof, which an iris closes in T, with the roof lights and the units on it, the trusses and lamps under it */}
      <group ref={roof} position={[(PX0 + PX1) / 2, 0, MIDZ]}>
        <group position={[-(PX0 + PX1) / 2, 0, -MIDZ]}>
          <BoxSet items={d.roofS} mat={roofMat} />
          <BoxSet items={d.para} mat={wallMat} />
          <BoxSet items={d.paraCap} mat={roofMat} receive={false} />
          <BoxSet items={d.units} mat={wallMat} />
          <BoxSet items={d.unitFans} mat={darkGrey} receive={false} />
          <BoxSet items={d.trusses} mat={wallMat} />
          <BoxSet items={d.ceilLamps} mat={K.white} receive={false} />
          {d.lights.slice(0, 4).map((l, i) => (
            <BoxSet key={i} items={l} mat={glazing} receive={false} />
          ))}
          <group ref={roofHatch} position={[lightsAt(4), WALL_H + 0.16, MIDZ]}>
            <BoxSet items={[[0, 0, 0, 1.8, 0.1, PZ1 - PZ0 - 0.6]]} mat={glazing} receive={false} />
          </group>
        </group>
      </group>
      <BoxSet items={d.joints} mat={lineFaint} receive={false} />
      <BoxSet items={d.marks} mat={line} receive={false} />
      <Slats items={d.slats} mat={line} />
      <PalletSet s={d.pal} />
      <BoxSet items={d.empties} mat={palletBase} cast />
      <BoxSet items={d.chargers} mat={darkGrey} cast />
      <BoxSet items={d.lamps} mat={lineWhite} receive={false} />
      <BoxSet items={d.cabin} mat={wallMat} cast />
      <BoxSet items={d.cabinRoof} mat={roofMat} cast />
      <BoxSet items={d.cabinGlass} mat={K.vanGlass} receive={false} />
      <BoxSet items={d.cabinDoor} mat={doorMat} />
      <BoxSet items={d.cabinStep} mat={beamFlange} />
    </group>
  );
}
// the long roof lights along z, 1.8 m wide, the last one over the dock end of the hall opens in the third flight for the camera to leave through
const LIGHTS_X = [-24, -15, -6, 3, 12];
const lightsAt = (i: number) => LIGHTS_X[i];
// the x where the aisles open on the staging floor
const X_MOUTH = HALL.rackX0 + 0.4;

// ---- the yard and the forecourt ---------------------------------------------------------------------------------------

// Hall metres in x and z, y 0 is the ground, so the yard sits 1.2 m under the hall's floor. The paved site runs 98 m behind the back wall, far
// enough that the haze takes it and no edge or hedge shows at the horizon of N3, to 47 m out from the docks and 27 m behind the far wall to
// 36 m in front of the near one. The yard road runs along z at x 34, 7 m wide,
// through a gap in the hedge at each end and on to the edge of any frame, with a kerb on both sides outside the hedge.
export const YARD = { x0: -400, x1: 47, z0: -27, z1: 36, road: 34, roadW: 7 };
const WORLD = 420;

export function Yard() {
  const y = useMemo(() => {
    // the paving runs on to 420 m each way, so the haze takes it and no slab edge ever shows, and so does the road
    const paving: BoxItem[] = [[0, 0.02, 0, WORLD * 2, 0.04, WORLD * 2]];
    const roadLong = WORLD * 2;
    const road: BoxItem[] = [[YARD.road, 0.04, 0, YARD.roadW, 0.04, roadLong]];
    const marks: BoxItem[] = [];
    const white: BoxItem[] = [];
    const hl = (x0: number, x1: number, z: number, t = 0.12) => marks.push([(x0 + x1) / 2, 0.066, z, x1 - x0, 0.01, t]);
    const vl = (x: number, z0: number, z1: number, t = 0.12) => marks.push([x, 0.066, (z0 + z1) / 2, t, 0.01, z1 - z0]);
    // the lorry bay at every dock, 3.6 m wide and 14.5 m long from the bumpers, with a wheel line across the end of it
    HALL.docks.forEach((z) => {
      hl(DOCK_OUT, DOCK_OUT + 14.5, z - 1.8);
      hl(DOCK_OUT, DOCK_OUT + 14.5, z + 1.8);
      vl(DOCK_OUT + 14.5, z - 1.8, z + 1.8);
      for (let g = 0; g < 4; g++) white.push([DOCK_OUT + 2.5 + g * 3.4, 0.07, z, 0.1, 0.01, 3.4]);
    });
    // the road's edge lines and a dashed middle, white
    for (const s of [-1, 1]) white.push([YARD.road + s * (YARD.roadW / 2 - 0.3), 0.075, 0, 0.14, 0.01, roadLong]);
    for (let z = -WORLD; z < WORLD; z += 6) white.push([YARD.road, 0.075, z + 1.5, 0.14, 0.01, 3]);
    // the apron's lanes between the bays and the road, a hatched strip along the platform's foot so no bay opens on bare paving
    const slats: SlatItem[] = [];
    slats.push(...hatch(PX1 + 0.1, PX1 + 0.6, YARD.z0 + 0.3, YARD.z1 - 0.3, 0.8, 0.066));

    // the car park on the forecourt in front of the hall, bays 2.6 m wide, 5 m deep, marked and empty, with a footpath along the wall
    const bays: BoxItem[] = [];
    // it runs from the dock end only 28 m along the wall, since from the high view of the last beat a longer strip lay behind the lede
    for (let x = -14; x <= 14.01; x += 2.6) bays.push([x, 0.066, 20.6, 0.1, 0.01, 5]);
    bays.push([0, 0.066, 18.1, 28, 0.01, 0.1], [0, 0.066, 23.1, 28, 0.01, 0.1]);
    // a footpath along the front wall, edge lines and a dashed middle
    bays.push([-9, 0.066, 17.0, 46, 0.01, 0.1]);
    // the fence round the yard, posts 4 m apart with two rails, along the east side and 40 m either side of each gate on the north and south sides
    const fence: BoxItem[] = [];
    const run = (x0: number, x1: number, z0: number, z1: number) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 4));
      for (let i = 0; i <= n; i++) fence.push([x0 + ((x1 - x0) * i) / n, 1.0, z0 + ((z1 - z0) * i) / n, 0.1, 2.0, 0.1]);
      for (const h of [0.55, 1.75]) fence.push([(x0 + x1) / 2, h, (z0 + z1) / 2, Math.max(x1 - x0, 0.05), 0.05, Math.max(z1 - z0, 0.05)]);
    };
    run(YARD.x1 + 0.2, YARD.x1 + 0.2, YARD.z0, YARD.z1);
    for (const zz of [YARD.z0 - 0.05, YARD.z1 + 0.05]) {
      run(YARD.road - 44, YARD.road - 4.5, zz, zz);
      run(YARD.road + 4.5, YARD.x1 + 0.2, zz, zz);
    }
    // low buildings of the neighbours in the haze round the site, plain boxes of 6 to 14 m in the pale grey
    const near: BoxItem[] = [];
    const nr = rng(61);
    const lot = (xa: number, xb: number, za: number, zb: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const w = 18 + nr() * 30;
        const dd = 14 + nr() * 22;
        const h = 6 + nr() * 8;
        near.push([xa + nr() * (xb - xa), h / 2, za + nr() * (zb - za), w, h, dd]);
      }
    };
    lot(-300, 300, -170, -70, 14);
    lot(-300, 300, 80, 180, 14);
    lot(75, 190, -70, 80, 8);
    lot(-300, -75, -70, 80, 10);
    return { paving, road, marks, white, slats, bays, fence, near };
  }, []);

  // trees in a line behind the hedge, 7 m apart, none across the road's gap and none along the forecourt, which is the left of the frame
  // in N3 and N4 where the words lie
  const trees = useMemo(() => {
    const out: TreeSpec[] = [];
    const gap = (v: number) => Math.abs(v - YARD.road) < 6;
    for (let x = YARD.x0 + 3; x < YARD.x1 + 4; x += 7) {
      // the north line stops short of the road's west side, the N2 camera looks over it into the words
      if (x > YARD.road && !gap(x)) out.push({ x, z: YARD.z0 - 3.2, h: 4.4 + ((x * 7) % 5) * 0.28, v: out.length });
    }
    for (let z = YARD.z0 + 3; z < YARD.z1; z += 7) out.push({ x: YARD.x1 + 3.2, z, h: 4.2 + ((z * 5) % 4) * 0.3, v: out.length });
    return out;
  }, []);

  const HG = 3.4;
  return (
    <group>
      <BoxSet items={y.paving} mat={apron} />
      <BoxSet items={y.road} mat={roadMat} />
      <BoxSet items={y.marks} mat={line} receive={false} />
      <BoxSet items={y.white} mat={lineWhite} receive={false} />
      <BoxSet items={y.bays} mat={line} receive={false} />
      <Slats items={y.slats} mat={line} />
      {/* the hedge closes the yard off, along the forecourt's front, the yard's far end and its two sides, with a gap for the road */}
      <Hedge x={YARD.x0} z={YARD.z1 + 0.6} len={YARD.road - HG - YARD.x0} />
      <Hedge x={YARD.road + HG} z={YARD.z1 + 0.6} len={YARD.x1 - YARD.road - HG} />
      <Hedge x={YARD.x0} z={YARD.z0 - 0.6} len={YARD.road - HG - YARD.x0} />
      <Hedge x={YARD.road + HG} z={YARD.z0 - 0.6} len={YARD.x1 - YARD.road - HG} />
      <group position={[YARD.x1 + 0.6, 0, YARD.z1]} rotation={[0, Math.PI / 2, 0]}>
        <Hedge x={0} z={0} len={YARD.z1 - YARD.z0} />
      </group>
      <Trees items={trees} pit={false} />
      {/* the kerb of the road beyond the hedge, a stone run on each side, north and south */}
      <group position={[YARD.road, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Kerb x0={-WORLD} x1={-YARD.z1 - 1} z={-YARD.roadW / 2} />
        <Kerb x0={-WORLD} x1={-YARD.z1 - 1} z={YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={WORLD} z={-YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={WORLD} z={YARD.roadW / 2} />
      </group>
      <BoxSet items={y.fence} mat={rackGrey} />
      <BoxSet items={y.near} mat={wallMat} />
      {/* the gate on the south side of the yard, a gate house east of the road with its window to the road, two barriers with their arms
          raised and the hatching before them, and a second pair of barriers on the north side. The lamp posts stand along the road
          inside the yard and along its east side */}
      <group position={[YARD.road + 6.2, 0, YARD.z1 - 3.4]} rotation={[0, Math.PI / 2, 0]}>
        <GateHouse x={0} z={0} />
      </group>
      <Barrier x={YARD.road - 3.6} z={YARD.z1 - 2.2} />
      <Barrier x={YARD.road + 3.6} z={YARD.z1 - 2.2} />
      <Barrier x={YARD.road - 3.6} z={YARD.z0 + 2.2} />
      <Barrier x={YARD.road + 3.6} z={YARD.z0 + 2.2} />
      {[-20, 6, 22].map((z) => (
        <LampPost key={z} x={YARD.road + 5.2} z={z} rot={Math.PI} />
      ))}
      {[-18, 4, 26].map((z) => (
        <LampPost key={`e${z}`} x={YARD.x1 - 3} z={z} rot={Math.PI} />
      ))}
      {/* cars of the staff and a van of the service on the east side of the yard and by the gate house */}
      <Van x={YARD.x1 - 7} z={-8} yaw={Math.PI / 2} />
      <Van x={YARD.x1 - 7} z={-3.2} yaw={Math.PI / 2} />
      <Van x={YARD.x1 - 7} z={12} yaw={Math.PI / 2} />
      <Van x={YARD.road + 12} z={YARD.z1 - 4.5} yaw={Math.PI} />
    </group>
  );
}

export { PX0, PX1, PZ0, PZ1 };
