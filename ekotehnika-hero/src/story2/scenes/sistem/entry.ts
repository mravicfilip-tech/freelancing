// The way from Prodaja into the warehouse aisle, round 7. One camera move and one build, both written here so the camera (camera.tsx)
// and the warehouse (warehouse.tsx) read the same marks. The camera holds the top down view that Z ended on through the words of P, which
// leave at u 7.93, and then tilts down in one eased move on one lens to the aisle, a three quarter view from the near side of the middle
// aisle. The hall builds as it goes. First the floor lines and the outlines of the rack rows draw on, thin, from the middle outward, then
// the rack frames slide in along their lines, then the pallets slide along the beams into their places, and the walls and the trucks come
// in last. Nothing is ever scaled, a part is either somewhere out of frame or on its line, and no part ever stands at a frame edge.
// Kept free of everything so a node check can read it.
import { range } from './kit';

/** The camera tilt, u from where it starts to where the aisle pose is reached. Pose from 8.42 to 8.5 is held, the flight round the end starts at 8.5. */
export const SWING = [7.78, 8.42] as const;
/** The floor lines, the outlines of the rack rows and of the walls draw on. */
export const LINES = [7.93, 8.3] as const;
/** The walls come down onto their outline and the trucks drive in through the open east end. */
export const WALLS_IN = [8.1, 8.4] as const;
export const TRUCKS_IN = [8.0, 8.4] as const;
/** The far rows slide in along x from the east, frame first and then the pallets a little behind, row by row 0.03 apart. */
export const FAR_FRAME = [8.1, 8.3] as const;
export const FAR_LOAD = [8.22, 8.42] as const;
export const ROW_STAGGER = 0.03;
/** The near rows stay out while the camera runs the aisle so the view into the racks is open. They slide in along z from the near side. */
export const NEAR_FRAME = [8.7, 8.86] as const;
export const NEAR_LOAD = [8.78, 8.94] as const;

/** How far a thing still has to go at u, 1 where it starts and 0 in place, a hard start and a soft landing. */
export const toGo = (u: number, from: number, to: number) => Math.pow(1 - range(u, from, to), 3);

/** Metres a part waits outside the hall, along its own line. The rows and trucks wait east of the open end, the near rows south of the hall, 26 m, which is past the near row and clear of the camera's way in. */
export const WAIT_X = 40;
export const WAIT_Z = 26;
/** The walls wait this far over the floor. */
export const WAIT_Y = 16;
