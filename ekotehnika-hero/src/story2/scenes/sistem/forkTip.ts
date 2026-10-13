// Where the L fork's blade tip is on screen, shared by the overlay that draws the steel and the shell that draws Najam on
// behind it, so the page and the canvas can never disagree for a frame. Kept free of three, like darkTop.ts.
// Units are half screen heights from the frame's centre, the overlay's own units, and the tip is the bevelled point of the
// blade's front face. The tine docks at L k 0.5 and backs out to the left from k 0.58 to k 0.9 (round 5, Filip's note 3).
import { TIMELINE } from '../../timeline';

const L = TIMELINE.find((b) => b.id === 'L')!;
const TAN = Math.tan((28 / 2) * (Math.PI / 180));
// the steel's front face sits 0.152 nearer the lens than the masks
export const NEAR = 1 - 0.152 * TAN;
// from the hook plate's back edge to the blade's tip, both with their chamfer
const HOOK = 1.422;
const TIP = 3.462;
export const BACK_FROM = 0.58;
export const BACK_TO = 0.9;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// the smoothstep of kit.ts ease, so the tip here is the tip the overlay draws
const ease = (t: number) => t * t * (3 - 2 * t);

// the outer grid line the hook plate rides on, in half heights from the centre
const lineX = (w: number, h: number) => (48 - w / 2) / (h / 2);

// The tine's origin in the overlay, before the lens shift the overlay adds back, and how far it has backed out.
export function forkX(k: number, w: number, h: number) {
  const x0 = lineX(w, h) * NEAR + HOOK;
  const back = (x0 + TIP + 0.14 + (w / h) * 1.05) * ease(clamp01((k - BACK_FROM) / (BACK_TO - BACK_FROM)));
  return x0 - back;
}

// The tip's screen x in px from the left edge of a w by h frame, at story pixel pos.
export function forkTipPx(pos: number, w: number, h: number) {
  const k = (pos - L.start) / (L.end - L.start);
  const tip = (forkX(k, w, h) + TIP) / NEAR;
  return w / 2 + tip * (h / 2);
}

// The story pixel at which the tip has backed past screen x px, by bisection, the tip only moves left.
export function forkPassesPx(px: number, w: number, h: number) {
  let a = L.start + BACK_FROM * (L.end - L.start);
  let b = L.start + BACK_TO * (L.end - L.start);
  if (forkTipPx(a, w, h) <= px) return a;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (forkTipPx(m, w, h) > px) a = m;
    else b = m;
  }
  return b;
}

export const forkBackFrom = L.start + BACK_FROM * (L.end - L.start);
export const forkBackTo = L.start + BACK_TO * (L.end - L.start);
