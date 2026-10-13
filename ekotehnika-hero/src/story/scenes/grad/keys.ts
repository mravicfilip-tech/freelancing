// Camera poses on the story time u, the beat index plus k. Subject, azimuth, elevation, distance, lens.
// A stop pose holds the camera still there, the others flow into each other.
import type { Key } from './camera';

export const KEYS: Key[] = [
  // U1, settles on the site as the forklift drives in
  { u: 0, t: [-18, 1, 0.5], az: 44, el: 31, d: 78 },
  // N1, N2, N3 at the dock yard of the hall
  { u: 1, t: [-8, 1, -1.5], az: 34, el: 28, d: 60 },
  { u: 2, t: [1, 1.2, 2], az: 36, el: 29, d: 76 },
  { u: 3, t: [1.5, 1.2, 2], az: 36, el: 29, d: 76 },
  { u: 3.55, t: [1.5, 1.2, 2], az: 36, el: 29, d: 76, stop: true },
  // P1, P2, P3 along the renewal line, the camera follows the truck
  { u: 4, t: [-80, 1.3, 5.4], az: 24, el: 20, d: 62 },
  { u: 5, t: [-75, 1.3, 5.4], az: 24, el: 20, d: 60 },
  { u: 5.5, t: [-56, 1.3, 5.4], az: 26, el: 21, d: 58 },
  { u: 6, t: [-37, 1.3, 5.4], az: 28, el: 22, d: 58 },
  { u: 6.5, t: [-30, 1.3, 4.5], az: 30, el: 24, d: 62 },
  // V1, the racks of the hall grow
  { u: 7, t: [-1, 1.8, -10], az: 30, el: 32, d: 100 },
  { u: 7.7, t: [-1, 1.8, -10], az: 30, el: 32, d: 100, stop: true },
  // V2, four zones along the yard
  { u: 8, t: [-6.4, 1.8, 1.8], az: 24, el: 19, d: 46 },
  { u: 8.5, t: [2.6, 1.8, 1.8], az: 25, el: 19, d: 46 },
  { u: 8.75, t: [11.6, 1.8, 1.8], az: 26, el: 19, d: 46 },
  { u: 9, t: [20.6, 1.8, 1.8], az: 26, el: 21, d: 46 },
  // V3, the pallet truck at the dock
  { u: 9.3, t: [-3.5, 1, -1.5], az: 22, el: 17, d: 28 },
  { u: 9.6, t: [2, 1, -1.5], az: 22, el: 17, d: 28 },
  { u: 9.9, t: [10, 1, -2], az: 22, el: 18, d: 28 },
  // S1, the truck stops in the aisle of the hall
  { u: 10, t: [-8, 1.5, -9], az: 28, el: 36, d: 60 },
  { u: 10.5, t: [-5, 1.5, -11], az: 28, el: 38, d: 55 },
  { u: 11, t: [-5, 1, -11], az: 30, el: 40, d: 58 },
  // S2, an aerial over the route
  { u: 11.4, t: [-27, 0, 4], az: 40, el: 55, d: 240 },
  { u: 11.85, t: [-26, 0, 4], az: 40, el: 56, d: 236 },
  // S3, the pit stop
  { u: 12, t: [-4, 1.5, -14], az: 24, el: 38, d: 46 },
  { u: 12.6, t: [-2, 1.5, -14], az: 24, el: 36, d: 46 },
  { u: 13, t: [-4, 1, 1], az: 32, el: 34, d: 80 },
  // K1, the pull back over the whole city
  { u: 14, t: [8, 0, 3], az: 34, el: 44, d: 270, fov: 22 },
];
