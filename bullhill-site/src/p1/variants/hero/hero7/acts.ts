import { clamp01, smooth } from '../hero6/geometry';

// Hero 7 as five named steps, briefs/website/hero7-excavator.md. p runs 0 to 1 across the pin. All five
// are built (hero7/world.ts).
//
//   1 Mark the route        p 0 to 0.15
//   2 Dig                   p 0.15 to 0.45
//   3 Lay ducts             p 0.45 to 0.6
//   4 Fibre blown in        p 0.6 to 0.75
//   5 Backfill and restore  p 0.75 to 1

export const STEPS = [0, 0.15, 0.45, 0.6, 0.75, 1] as const;
// how many of the five steps are built. The label of the last built step stays up to the end of the pin,
// and the headline holds, until the next one is built. All five are, so the headline leaves in the last
// part of step 5.
export const BUILT = 5;

// the step p is in, 0 to 4
export function stepAt(p: number) {
  let i = 0;
  for (let k = 1; k < 5; k++) if (p >= STEPS[k]) i = k;
  return i;
}

// The label of each step, opacity at p. A step's label fades out just before the next boundary and
// the next label fades in just after it, so the two never show at once in the same place. The first
// one waits for the first bit of scroll, so the idle state at p 0 carries no label.
const FADE = 0.014;
export function labelAt(p: number, i: number) {
  const a = i === 0 ? clamp01(p / 0.02) : clamp01((p - STEPS[i]) / FADE);
  const b = i >= BUILT - 1 ? 1 : 1 - clamp01((p - STEPS[i + 1] + FADE) / FADE);
  if (i >= BUILT) return 0;
  return Math.min(a, b);
}

// the headline, lede and buttons leave in the last part of step 5, 0 to 1
export const textGone = (p: number) => (BUILT < 5 ? 0 : smooth(clamp01((p - 0.82) / 0.18)));

// ---- the phone's flipbook. Phones draw no WebGL, they show 24 stills of the scene at a tall framing, rendered
// by scripts/render-hero7.mjs at these p, which it reads from this line. The frames sit where the picture
// changes, close in the dig and the backfill, wide apart while the camera only drifts. Each one holds, and a
// short crossfade between two neighbours carries the scroll from one to the next, so two viewpoints are never
// on screen together for long and never more than a frame apart.
export const FRAME_P = [0, 0.19, 0.245, 0.3, 0.355, 0.41, 0.45, 0.49, 0.54, 0.6, 0.64, 0.68, 0.72, 0.75, 0.79, 0.82, 0.85, 0.88, 0.91, 0.935, 0.955, 0.97, 0.985, 1];
export const FRAMES = FRAME_P.length;
// where frame i + 1 takes over from frame i, halfway between the two, except the first, which waits for the
// dig to open at 0.15, and how wide the crossfade there is, in p
const CENTRE = FRAME_P.slice(0, -1).map((p, i) => (i === 0 ? 0.17 : (p + FRAME_P[i + 1]) / 2));
const HALF = FRAME_P.slice(0, -1).map((p, i) => Math.max(0.006, 0.17 * (FRAME_P[i + 1] - p)));
// the opacity of each frame at p, written into out. A frame fades in over the one below it and goes when the
// next one is all the way in, so at most two are visible. Returns the one on top.
export function frameFades(p: number, out: number[]): number {
  let top = 0;
  const into: number[] = [];
  for (let i = 0; i < FRAMES - 1; i++) {
    const k = clamp01((p - (CENTRE[i] - HALF[i])) / (2 * HALF[i]));
    into.push(k * k * (3 - 2 * k));
  }
  for (let j = 0; j < FRAMES; j++) {
    const a = j === 0 ? 1 : into[j - 1];
    out[j] = j < FRAMES - 1 && into[j] >= 0.999 ? 0 : a;
    if (a > 0 && out[j] > 0) top = j;
  }
  return top;
}
