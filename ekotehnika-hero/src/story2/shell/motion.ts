// Motion for the storyline 2 shell. Every reveal is a function of the story clock, so it scrubs with the scroll and
// freezes with ?at=. Nothing here runs a timer of its own except the hero intro at load, which reads real time
// and falls back to the clock when the clock is frozen.

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

// cubic-bezier(x1, y1, x2, y2) as a function of t, the CSS timing curve solved with a few Newton steps.
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-4) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = clamp01(t);
    return sy(t);
  };
}

// The block wipe easing from the plan, B1.
export const wipeEase = bezier(0.7, 0, 0.2, 1);
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// Every reveal on a hold beat finishes inside the first 18 percent of the beat, the count up by 25 percent and the
// scroll fill by 40 percent, so the beat reads for most of its span. The hero block runs on real time after load,
// 1.2s for all its lines.
export const WIPE_DONE = 0.18;
export const COUNT_DONE = 0.25;
export const PX_PER_S = 500;
export const HERO_SECONDS = 1.2;
// Line reveal, a share of the wipe budget, the rest is the stagger between lines.
export const WIPE_SHARE = 0.6;

// A bar covers the line over the first 0.35 of the reveal, then leaves to the right. Returns the bar offset in
// percent of its own width and whether the text under it shows.
export function wipeAt(p: number) {
  const a = wipeEase(range(p, 0, 0.35));
  const b = wipeEase(range(p, 0.35, 1));
  // the bar waits at minus 101 percent and leaves to 101, not 100, so on a block of fractional width no sliver of it shows at
  // either edge through the clip (round 4 item 6, the line on the right of Hitan servis, and the marks at the left of a block
  // before its reveal)
  return { bx: p < 0.35 ? -101 + 101 * a : 101 * b, shown: p >= 0.35 };
}

export const formatCount = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Scroll fill window, plan B2 tightened, the lede fills as k runs from 0.04 to 0.4 of its beat.
export const FILL_FROM = 0.04;
export const FILL_TO = 0.4;
