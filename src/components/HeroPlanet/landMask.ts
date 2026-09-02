import { SimplexNoise3D } from './noise';

export interface LandMask {
  width: number;
  height: number;
  /** Raw noise value per texel, row-major, top row = north pole. */
  values: Float32Array;
  /** Values above this are land. Chosen so `coverage` of the sphere is land. */
  threshold: number;
}

/**
 * Procedural equirectangular land/sea mask. Sampled in 3D on the unit sphere so
 * there is no seam at the antimeridian and no pinching at the poles.
 */
export function generateLandMask(
  width: number,
  height: number,
  coverage: number,
  seed: number,
  frequency: number,
): LandMask {
  const noise = new SimplexNoise3D(seed);
  const warp = new SimplexNoise3D(seed + 101);
  const values = new Float32Array(width * height);
  // Weight each texel by cos(lat) so the threshold reflects true sphere-area coverage.
  const weighted: { v: number; w: number }[] = [];

  for (let y = 0; y < height; y++) {
    const lat = Math.PI / 2 - ((y + 0.5) / height) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < width; x++) {
      const lon = ((x + 0.5) / width) * Math.PI * 2 - Math.PI;
      const px = cl * Math.cos(lon), py = sl, pz = cl * Math.sin(lon);
      // Domain warp for organic, blobby edges rather than cellular noise shapes.
      const wx = warp.fbm(px * frequency * 0.8 + 3.1, py * frequency * 0.8, pz * frequency * 0.8, 2) * 0.35;
      const wy = warp.fbm(px * frequency * 0.8, py * frequency * 0.8 + 7.7, pz * frequency * 0.8, 2) * 0.35;
      const wz = warp.fbm(px * frequency * 0.8, py * frequency * 0.8, pz * frequency * 0.8 + 11.3, 2) * 0.35;
      const v = noise.fbm((px + wx) * frequency, (py + wy) * frequency, (pz + wz) * frequency, 4);
      values[y * width + x] = v;
      weighted.push({ v, w: cl });
    }
  }

  // Area-weighted quantile → threshold.
  weighted.sort((a, b) => b.v - a.v);
  let total = 0;
  for (const s of weighted) total += s.w;
  let acc = 0;
  let threshold = weighted[weighted.length - 1].v;
  for (const s of weighted) {
    acc += s.w;
    if (acc >= total * coverage) { threshold = s.v; break; }
  }
  return { width, height, values, threshold };
}

/** Bilinear sample of the raw mask at a unit direction. */
export function sampleMask(mask: LandMask, x: number, y: number, z: number): number {
  const lon = Math.atan2(z, x); // -π..π
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  const u = ((lon + Math.PI) / (Math.PI * 2)) * mask.width - 0.5;
  const v = ((Math.PI / 2 - lat) / Math.PI) * mask.height - 0.5;
  const x0 = Math.floor(u), y0 = Math.floor(v);
  const fx = u - x0, fy = v - y0;
  const wrapX = (i: number) => ((i % mask.width) + mask.width) % mask.width;
  const clampY = (j: number) => Math.max(0, Math.min(mask.height - 1, j));
  const at = (i: number, j: number) => mask.values[clampY(j) * mask.width + wrapX(i)];
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
  const bot = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bot * fy;
}
