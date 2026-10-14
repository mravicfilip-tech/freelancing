import { clamp01, smooth } from '../hero6/geometry';

// Hero 7 as five named steps, briefs/website/hero7-excavator.md. p runs 0 to 1 across the pin. Only
// step 2, Dig, is built (hero7/world.ts), the others hold the Dig end state until they are.
//
//   1 Mark the route        p 0 to 0.15
//   2 Dig                   p 0.15 to 0.45
//   3 Lay ducts             p 0.45 to 0.6
//   4 Fibre blown in        p 0.6 to 0.75
//   5 Backfill and restore  p 0.75 to 1

export const STEPS = [0, 0.15, 0.45, 0.6, 0.75, 1] as const;
// how many of the five steps are built. The label of the last built step stays up to the end of the pin,
// and the headline holds, until the next one is built. Raise it as each step lands.
export const BUILT = 2;

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
