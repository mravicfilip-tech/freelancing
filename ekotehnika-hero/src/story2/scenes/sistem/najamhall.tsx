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
import { BoxSet, Hedge, Kerb, Trees, type BoxItem, type TreeSpec } from './props';
import { K, rng } from './kit';
import { HALL } from './najamplan';
import { Load, Slats, apron, arrow, beamFlange, beamWeb, black, columnMat, darkGrey, doorMat, glazing, hatch, line, lineFaint, lineWhite, loadMats, palletBase, rackGrey, roadMat, roofMat, slab, wallBase, wallMat, wrapBand, wrapShell, type SlatItem } from './najamkit';

// ---- the hall's measures ----------------------------------------------------------------------------------------------

export const DOOR_W = 3.6;
export const DOOR_H = 3.9;
export const WALL_T = 0.4;
export const PLINTH = 1.0;
export const WALL_H = 9.6;
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
// The two trucks on their chargers in the charging corner, nose to the front wall. Model, x, z, heading in radians.
export const CHARGING: [ModelName, number, number, number][] = [
  ['d12', -26.4, 13.3, Math.PI / 2],
  ['h30d', -23.2, 13.3, Math.PI / 2],
];
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

export function Hall({ dock }: { dock: React.RefObject<THREE.Group | null> }) {
  const d = useMemo(() => {
    // the platform and its kerb, the floor is its top face
    const platform: BoxItem[] = [[(PX0 + PX1) / 2, -0.6, MIDZ, PX1 - PX0, 1.2, PZ1 - PZ0]];
    const kerb: BoxItem[] = [
      [(PX0 + PX1) / 2, 0.03, PZ1 - 0.07, PX1 - PX0, 0.06, 0.14],
      [PX1 - 0.07, 0.03, MIDZ, 0.14, 0.06, PZ1 - PZ0],
    ];

    // the far walls, a panel, a column every 6 m with its beam over the top, the roof's edge as a thin slab with a lip, and the glazing
    // ribbon of the long wall between the columns. The back wall stays plain behind its columns, the words of N3 lie over it.
    const wall: BoxItem[] = [];
    const cols: BoxItem[] = [];
    const beam: BoxItem[] = [];
    const roof: BoxItem[] = [];
    const lip: BoxItem[] = [];
    const glass: BoxItem[] = [];
    const lenZ = PZ1 - PZ0;
    wall.push([BACK_X + 0.15, WALL_H / 2, MIDZ, 0.3, WALL_H, lenZ]);
    for (let z = HALL.sideZ + 1.2; z < PZ1; z += 6) cols.push([BACK_X + 0.5, WALL_H / 2, z, 0.4, WALL_H, 0.4]);
    beam.push([BACK_X + 0.4, WALL_H + 0.05, MIDZ, 0.7, 0.5, lenZ]);
    roof.push([BACK_X + 1.05, WALL_H + 0.3, MIDZ, 2.2, 0.2, lenZ]);
    lip.push([BACK_X + 2.1, WALL_H + 0.1, MIDZ, 0.1, 0.5, lenZ]);
    const lenX = PX1 - PX0;
    wall.push([(PX0 + PX1) / 2 + 0.15, WALL_H / 2, HALL.sideZ - 0.15, lenX - 0.3, WALL_H, 0.3]);
    for (let x = BACK_X + 1.5; x < HALL.dockX - 5; x += 6) {
      cols.push([x, WALL_H / 2, HALL.sideZ + 0.2, 0.4, WALL_H, 0.4]);
      glass.push([x + 3, 7.5, HALL.sideZ + 0.01, 4.8, 1.4, 0.05]);
    }
    beam.push([(PX0 + PX1) / 2, WALL_H + 0.05, HALL.sideZ + 0.05, lenX, 0.5, 0.7]);
    roof.push([(PX0 + PX1) / 2, WALL_H + 0.3, HALL.sideZ + 0.8, lenX, 0.2, 2.2]);
    lip.push([(PX0 + PX1) / 2, WALL_H + 0.1, HALL.sideZ + 1.9, lenX, 0.5, 0.1]);
    // the corner column. The long wall's last column stands 8 m short of the dock wall, so the camera of N2 at the first door does not look
    // past a column 0.4 m wide into the words, and the beam runs on over the last bay as it does over any bay
    cols.push([BACK_X + 0.5, WALL_H / 2, HALL.sideZ + 0.2, 0.5, WALL_H, 0.5]);

    // the near walls, a low plinth with a cap. The dock wall stands in piers between the doors, the front wall runs the length of the hall.
    const plinth: BoxItem[] = [];
    const cap: BoxItem[] = [];
    const door: BoxItem[] = [];
    const groove: BoxItem[] = [];
    const frame: BoxItem[] = [];
    const bumper: BoxItem[] = [];
    const lev: BoxItem[] = [];
    const wx = HALL.dockX + WALL_T / 2;
    const edges = [HALL.sideZ, ...HALL.docks.flatMap((z) => [z - DOOR_W / 2, z + DOOR_W / 2]), FRONT_Z];
    for (let i = 0; i < edges.length; i += 2) {
      const zc = (edges[i] + edges[i + 1]) / 2;
      const len = edges[i + 1] - edges[i];
      plinth.push([wx, PLINTH / 2, zc, WALL_T, PLINTH, len]);
      cap.push([wx, PLINTH + 0.04, zc, WALL_T + 0.1, 0.08, len]);
    }
    plinth.push([(BACK_X + PX1) / 2, PLINTH / 2, FRONT_Z + 0.15, PX1 - BACK_X, PLINTH, 0.3]);
    cap.push([(BACK_X + PX1) / 2, PLINTH + 0.04, FRONT_Z + 0.15, PX1 - BACK_X, 0.08, 0.4]);
    HALL.docks.forEach((z, i) => {
      // the door frame, two posts and a head, in the rack grey
      frame.push([HALL.dockX + 0.2, DOOR_H / 2, z - DOOR_W / 2 - 0.06, 0.4, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H / 2, z + DOOR_W / 2 + 0.06, 0.4, DOOR_H, 0.12], [HALL.dockX + 0.2, DOOR_H + 0.06, z, 0.4, 0.12, DOOR_W + 0.24]);
      // the first door is rolled up for the lorry, the others are shut sectional doors with their joints, the door over the lorry bay
      // of the fourth is shut too
      if (i > 0) {
        door.push([HALL.dockX + 0.2, DOOR_H / 2, z, 0.1, DOOR_H, DOOR_W]);
        for (let g = 1; g < 6; g++) groove.push([HALL.dockX + 0.26, (DOOR_H / 6) * g, z, 0.03, 0.04, DOOR_W - 0.1]);
      } else door.push([HALL.dockX + 0.2, DOOR_H + 0.1, z, 0.1, 0.2, DOOR_W]);
      // bumpers on the outside of the wall, down the platform's edge, and a dock leveller on the floor inside
      for (const s of [-1.35, 1.35]) bumper.push([PX1 + 0.15, -0.35, z + s, 0.3, 0.5, 0.3]);
      lev.push([HALL.dockX - 1.2, 0.04, z, 2.4, 0.08, 2.4]);
    });

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
    // floor storage, pallets in stacks of two
    for (const x of [-11.25, -8.75, -3.75, -1.25]) {
      loadedPallet(pal, r, x, 14.0, false);
      if (r() < 0.6) loadedPallet(pal, r, x, 14.0, false, 1.3);
    }

    // the floor storage of the open edge, a bay holds one stack, two or three pallets high, a few bays are empty
    for (let b = 0; b < 7; b++) {
      if (b === 2 || b === 5) continue;
      const x = -22.7 + b * 2.6;
      for (const dx of [-0.65, 0.65]) {
        loadedPallet(pal, r, x + dx, 11.7, false);
        loadedPallet(pal, r, x + dx, 11.7, false, 1.3);
      }
    }
    // empty pallets in stacks of eight, by the back wall's corner and by the front wall
    const empties: BoxItem[] = [];
    const stackOf = (x: number, z: number, n: number, turned = false) => {
      for (let i = 0; i < n; i++) empties.push([x + (i % 2) * 0.02, 0.07 + i * 0.15, z, turned ? 0.82 : 1.2, 0.14, turned ? 1.2 : 0.82]);
    };
    [-18.5, -17.2, -15.9].forEach((x) => stackOf(x, 14.2, 9));
    [-5.2, -3.9].forEach((x) => stackOf(x, 14.2, 7));
    stackOf(-27.5, -13.2, 10, true);
    stackOf(-27.5, -11.8, 10, true);

    // the chargers of the charging corner, a cabinet with a lamp on its top, and the cable
    const chargers: BoxItem[] = [];
    const lamps: BoxItem[] = [];
    CHARGING.forEach(([, x]) => {
      chargers.push([x, 0.7, 15.1, 0.7, 1.4, 0.4], [x + 0.9, 0.03, 14.3, 0.04, 0.03, 1.6]);
      lamps.push([x, 1.5, 15.1, 0.2, 0.1, 0.2]);
    });

    // the wrapping station, a turntable, a mast with the film carriage and a pallet being wrapped
    const wrap: BoxItem[] = [[-12.4, 0.07, 14.1, 1.7, 0.14, 1.7]];
    const wrapMast: BoxItem[] = [[-11.2, 1.1, 14.1, 0.18, 2.2, 0.18], [-11.45, 1.1, 14.1, 0.3, 0.9, 0.12]];

    // the office cabin, 1.9 by 4.4 m and 2.7 m high in the corner behind the racks, out of the way of the cross aisle, its roof proud all
    // round, a door and two windows on the side that faces the hall, and two steps
    const cx = -29.7;
    const cz = -13.4;
    const cabin: BoxItem[] = [[cx, 1.4, cz, 1.9, 2.8, 4.4]];
    const cabinRoof: BoxItem[] = [[cx, 2.9, cz, 2.3, 0.14, 4.8]];
    const cabinGlass: BoxItem[] = [[cx + 0.96, 1.75, cz - 1.2, 0.04, 0.8, 1.6], [cx + 0.96, 1.75, cz + 0.5, 0.04, 0.8, 0.8]];
    const cabinDoor: BoxItem[] = [[cx + 0.96, 1.05, cz + 1.6, 0.05, 2.1, 0.9]];
    const cabinStep: BoxItem[] = [[cx + 1.25, 0.1, cz + 1.6, 0.55, 0.2, 1.2], [cx + 1.13, 0.25, cz + 1.6, 0.3, 0.1, 1.2]];
    return { platform, kerb, wall, cols, beam, roof, lip, glass, plinth, cap, door, groove, frame, bumper, lev, joints, marks, slats, pal, empties, chargers, lamps, wrap, wrapMast, cabin, cabinRoof, cabinGlass, cabinDoor, cabinStep };
  }, []);
  return (
    <group>
      <BoxSet items={d.platform} mat={slab} />
      <BoxSet items={d.kerb} mat={wallBase} receive={false} />
      <BoxSet items={d.wall} mat={wallMat} />
      <BoxSet items={d.cols} mat={columnMat} cast />
      <BoxSet items={d.beam} mat={beamFlange} />
      <BoxSet items={d.roof} mat={roofMat} />
      <BoxSet items={d.lip} mat={beamWeb} />
      <BoxSet items={d.glass} mat={glazing} receive={false} />
      {/* the near walls stand for the high views and sink into the floor while the camera is low in the yard, outside them, in N3 */}
      <group ref={dock}>
        <BoxSet items={d.plinth} mat={wallMat} cast />
        <BoxSet items={d.cap} mat={wallBase} />
        <BoxSet items={d.frame} mat={columnMat} />
        <BoxSet items={d.door} mat={doorMat} />
        <BoxSet items={d.groove} mat={beamFlange} receive={false} />
        <BoxSet items={d.bumper} mat={black} />
        <BoxSet items={d.lev} mat={beamWeb} />
      </group>
      <BoxSet items={d.joints} mat={lineFaint} receive={false} />
      <BoxSet items={d.marks} mat={line} receive={false} />
      <Slats items={d.slats} mat={line} />
      <PalletSet s={d.pal} />
      <BoxSet items={d.empties} mat={palletBase} cast />
      <BoxSet items={d.chargers} mat={darkGrey} cast />
      <BoxSet items={d.lamps} mat={lineWhite} receive={false} />
      <BoxSet items={d.wrap} mat={beamWeb} cast />
      <BoxSet items={d.wrapMast} mat={rackGrey} cast />
      <BoxSet items={d.cabin} mat={wallMat} cast />
      <BoxSet items={d.cabinRoof} mat={roofMat} cast />
      <BoxSet items={d.cabinGlass} mat={K.vanGlass} receive={false} />
      <BoxSet items={d.cabinDoor} mat={doorMat} />
      <BoxSet items={d.cabinStep} mat={beamFlange} />
      {/* a pallet on the turntable, being wrapped */}
      <group position={[-12.4, 0.14, 14.1]}>
        <Load h={1.0} colour={1} />
      </group>
    </group>
  );
}
// the x where the aisles open on the staging floor
const X_MOUTH = HALL.rackX0 + 0.4;

// ---- the yard and the forecourt ---------------------------------------------------------------------------------------

// Hall metres in x and z, y 0 is the ground, so the yard sits 1.2 m under the hall's floor. The paved site runs 98 m behind the back wall, far
// enough that the haze takes it and no edge or hedge shows at the horizon of N3, to 47 m out from the docks and 27 m behind the far wall to
// 36 m in front of the near one. The yard road runs along z at x 34, 7 m wide,
// through a gap in the hedge at each end and on to the edge of any frame, with a kerb on both sides outside the hedge.
export const YARD = { x0: -130, x1: 47, z0: -27, z1: 36, road: 34, roadW: 7 };

export function Yard() {
  const y = useMemo(() => {
    const paving: BoxItem[] = [[(YARD.x0 + YARD.x1) / 2, 0.02, (YARD.z0 + YARD.z1) / 2, YARD.x1 - YARD.x0, 0.04, YARD.z1 - YARD.z0]];
    const roadLong = 190;
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
    for (let z = -90; z < 90; z += 6) white.push([YARD.road, 0.075, z + 1.5, 0.14, 0.01, 3]);
    // the apron's lanes between the bays and the road, a hatched strip along the platform's foot so no bay opens on bare paving
    const slats: SlatItem[] = [];
    slats.push(...hatch(PX1 + 0.1, PX1 + 0.6, YARD.z0 + 0.3, YARD.z1 - 0.3, 0.8, 0.066));

    // the car park on the forecourt in front of the hall, bays 2.6 m wide, 5 m deep, marked and empty, with a footpath along the wall
    const bays: BoxItem[] = [];
    for (let x = -32; x <= 14.01; x += 2.6) bays.push([x, 0.066, 20.6, 0.1, 0.01, 5]);
    bays.push([-9, 0.066, 18.1, 46, 0.01, 0.1], [-9, 0.066, 23.1, 46, 0.01, 0.1]);
    // a footpath along the front wall, edge lines and a dashed middle
    bays.push([-9, 0.066, 17.0, 46, 0.01, 0.1]);
    return { paving, road, marks, white, slats, bays };
  }, []);

  // trees in a line behind the hedge, 7 m apart, none across the road's gap and none along the forecourt, which is the left of the frame
  // in N3 and N4 where the words lie
  const trees = useMemo(() => {
    const out: TreeSpec[] = [];
    const gap = (v: number) => Math.abs(v - YARD.road) < 6;
    for (let x = YARD.x0 + 3; x < YARD.x1 + 4; x += 7) {
      if (!gap(x)) out.push({ x, z: YARD.z0 - 3.2, h: 4.4 + ((x * 7) % 5) * 0.28, v: out.length });
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
        <Kerb x0={-90} x1={-YARD.z1 - 1} z={-YARD.roadW / 2} />
        <Kerb x0={-90} x1={-YARD.z1 - 1} z={YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={90} z={-YARD.roadW / 2} />
        <Kerb x0={-YARD.z0 + 1} x1={90} z={YARD.roadW / 2} />
      </group>
    </group>
  );
}

export { PX0, PX1, PZ0, PZ1 };
