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

// ---- the phone's flipbook. Phones that cannot run the live scene show 28 stills of the scene in the portrait
// framing, rendered by scripts/render-hero7.mjs at these p, which it reads from this line. The frames are spaced
// by how far the picture moves, the camera across the screen and the machine, the ducts and the ground under it,
// so neighbouring frames sit about the same distance apart on the screen. That puts them close where the camera
// pans and the machine works and wide apart where the shot holds. The frame at 0.17 is the dig just opened.
// The story plays by itself, so a frame is not held. Each one dissolves into the next across most of the way
// between them, and the picture is moving all the time and never steps.
export const FRAME_P = [0, 0.17, 0.215, 0.254, 0.289, 0.324, 0.357, 0.396, 0.461, 0.494, 0.519, 0.549, 0.575, 0.61, 0.64, 0.666, 0.697, 0.73, 0.756, 0.78, 0.808, 0.832, 0.86, 0.888, 0.915, 0.945, 0.972, 1];
export const FRAMES = FRAME_P.length;
// The flipbook's reference screen, a phone 390 wide and 844 tall, the middle of its clear band at cy, and the
// strip of it that is kept, rows tall from top, all in CSS pixels, at 2x in the files. The script reads this
// line. On any other screen the strip is as wide as the screen and its band goes on the screen's band.
export const FLIP = { w: 390, h: 844, cy: 450, top: 150, rows: 600 };
// Between frame i and frame i + 1 the next one fades in over the one below it, smoothly, from FADE_FROM to
// FADE_TO of the way between them. The first gap starts at 0.15, where the dig begins, since the first frame
// is the route marked and nothing moves before it.
const FADE_FROM = 0.1;
const FADE_TO = 0.9;
const START = FRAME_P.map((p, i) => (i === 0 ? 0.15 : p));
// the opacity of each frame at p, written into out. The frame below stays at full opacity until the one above
// it is all the way in, so at most two are visible. Returns the one on top.
export function frameFades(p: number, out: number[]): number {
  let i = 0;
  while (i < FRAMES - 2 && p >= FRAME_P[i + 1]) i++;
  const gap = FRAME_P[i + 1] - START[i];
  const u = p >= FRAME_P[FRAMES - 1] ? 1 : clamp01((p - START[i]) / gap);
  const k = smooth(clamp01((u - FADE_FROM) / (FADE_TO - FADE_FROM)));
  for (let j = 0; j < FRAMES; j++) out[j] = 0;
  if (k >= 0.999) {
    out[i + 1] = 1;
    return i + 1;
  }
  out[i] = 1;
  out[i + 1] = k;
  return k > 0 ? i + 1 : i;
}
