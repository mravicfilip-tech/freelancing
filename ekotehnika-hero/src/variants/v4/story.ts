// The camera keys of the fly through. A key with stop set is one the story rests on.
export type Vec = [number, number, number];

// A camera key. Target point, azimuth from +z toward -x in degrees, elevation in degrees,
// distance, vertical field of view. stop marks a key the story rests on.
export type Key = { p: number; t: Vec; az: number; el: number; d: number; fov: number; stop?: number };

export const keys: Key[] = [
  { p: 0.0, t: [-56, 2.5, -2], az: 40, el: 26, d: 120, fov: 20, stop: 0 },
  { p: 0.09, t: [-22, 4, -16], az: 30, el: 46, d: 153, fov: 20 },
  { p: 0.17, t: [3, 0.5, -20], az: 38, el: 31, d: 108, fov: 20, stop: 1 },
  { p: 0.255, t: [-26, 0, 18], az: 18, el: 58, d: 195, fov: 20 },
  { p: 0.34, t: [-58, 0.5, 39], az: 40, el: 37, d: 109, fov: 20, stop: 2 },
  { p: 0.425, t: [-4, 1.5, 20], az: 62, el: 22, d: 125, fov: 22 },
  { p: 0.51, t: [44, 1.5, -12], az: 32, el: 33, d: 122, fov: 20, stop: 3 },
  { p: 0.585, t: [50, 0, 14], az: 40, el: 52, d: 156, fov: 20 },
  { p: 0.66, t: [46, 0.5, 38], az: 44, el: 38, d: 96, fov: 20, stop: 4 },
  { p: 0.74, t: [68, 4, 6], az: 28, el: 34, d: 156, fov: 22 },
  { p: 0.82, t: [82, 10, -20], az: 34, el: 17, d: 127, fov: 24, stop: 5 },
  { p: 0.9, t: [40, 2, 0], az: 30, el: 38, d: 299, fov: 22 },
  { p: 1.0, t: [8, 0, 6], az: 32, el: 48, d: 507, fov: 22, stop: 6 },
];
