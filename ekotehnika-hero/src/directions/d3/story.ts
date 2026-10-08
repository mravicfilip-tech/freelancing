// Direction 3, Minijatura. The warehouse as an isometric miniature, after the Emons reel. A long
// lens far away flattens the perspective, and each chapter glides to the next zone with the
// viewing corner swinging between two sides, so the angle changes as well as the place.
// The truck runs the delivery, showroom, rack, aisle, service bay, approved bay, dock.

import { type Key, type Shot, type StoryDef, rel, v } from '../../three/engine';
import { PICK } from '../../three/warehouse';
import { C } from '../../tokens';

const HALF_PI = Math.PI / 2;

// Story times where scroll comes to rest, one per chapter.
export const RESTS = [0, 1.22, 2.45, 3.3, 4.25, 5.25, 6.35, 7];

const KEYS: Key[] = [
  { b: 0, x: 0, z: 0, h: 0, y: 0.2, lift: 0.1 },
  { b: 1.4, x: 0, z: 0, h: 0, y: 0.2, lift: 0.1 },
  { b: 1.75, x: 4, z: -0.5, h: 0.25, y: 0, lift: 0.1 },
  { b: 2.0, x: 8, z: -2, h: 0.9, y: 0, lift: 0.1 },
  { b: 2.15, x: PICK.x, z: -3.6, h: HALF_PI, y: 0, lift: 0.1 },
  { b: 2.3, x: PICK.x, z: -4.6, h: HALF_PI, y: 0, lift: 2.75 },
  { b: 2.45, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 2.75 },
  { b: 2.55, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 2.84 },
  { b: 2.65, x: PICK.x, z: PICK.z + 1.72, h: HALF_PI, y: 0, lift: 3.0 },
  { b: 2.85, x: PICK.x, z: -4.3, h: HALF_PI, y: 0, lift: 3.0 },
  { b: 2.95, x: PICK.x, z: -3.6, h: HALF_PI, y: 0, lift: 0.35 },
  { b: 3.05, x: 11.2, z: -2.3, h: 0.5, y: 0, lift: 0.35, ease: 'i' },
  { b: 3.2, x: 13, z: -2, h: 0, y: 0, lift: 0.35, ease: 'l' },
  { b: 4.25, x: 22, z: -2, h: 0, y: 0, lift: 0.35, ease: 'l' },
  { b: 5.25, x: 31, z: -2, h: 0, y: 0, lift: 0.35, ease: 'o' },
  { b: 5.8, x: 37, z: -2, h: 0, y: 0, lift: 0.35 },
  { b: 6.0, x: 38.2, z: -2, h: 0, y: 0, lift: 0.35 },
  { b: 6.2, x: 38.2, z: -2, h: 0, y: 0, lift: 0 },
  { b: 6.5, x: 36.4, z: -2, h: 0, y: 0, lift: 0.1 },
  { b: 7, x: 36.4, z: -2, h: 0, y: 0, lift: 0.1 },
];

// Two viewing corners. Front right and front left, both looking down at the same steep angle.
const RIGHT = v(1, 1.15, 1.1).normalize();
const LEFT = v(-0.8, 1.15, 1.1).normalize();
const DOCK = v(1, 1.05, 0.45).normalize();

function iso(look: [number, number, number], dist: number, dir = RIGHT, extra: Partial<Shot> = {}): Shot {
  const target = v(...look);
  const cam = target.clone().addScaledVector(dir, dist);
  return { cam: () => cam, look: () => target, fov: 16, offset: 0.2, ...extra };
}

function follow(dist: number, dir = RIGHT, extra: Partial<Shot> = {}): Shot {
  return {
    cam: (t) => v(t.x + 1.5 + dir.x * dist, dir.y * dist, t.z + dir.z * dist),
    look: rel(1.5, 0, 0),
    fov: 16,
    offset: 0.2,
    ...extra,
  };
}

const SHOTS: Shot[] = [
  iso([19, 0, -1.5], 125, RIGHT, { offset: 0.16 }),
  iso([0.5, 0.6, -2.2], 52, LEFT, { hold: 0.4 }),
  iso([PICK.x, 1.8, -5.6], 44, RIGHT, { hold: 0.55 }),
  follow(50, RIGHT, { hold: 0.45 }),
  iso([24, 1, -5.5], 48, LEFT, { hold: 0.4 }),
  iso([31.5, 0.5, 2], 50, RIGHT, { hold: 0.4 }),
  iso([39.2, 1, -2], 42, DOCK, { hold: 0.5 }),
  iso([19, 0, -1.5], 135, LEFT, { offset: 0.2 }),
];

export const STORY: StoryDef = {
  lastBeat: 7,
  keys: KEYS,
  shots: SHOTS,
  background: C.hoverLightGrey,
  pick: { b: 2.55, at: PICK, rotY: HALF_PI },
  drop: 6.2,
  spot: [3.15, 5.95],
  shutter: [5.6, 6.0],
};
