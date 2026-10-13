// The moment the street starts building in on load, the scene's first frame, shared with the shell so the hero text rises
// with the street and not before it (round 5, Filip's "letter animation and graphic not loading in sync together"). Kept free
// of three, like darkTop.ts. A frozen clock (?at=) or reduced motion skips the build in, so the text needs no wait there.
export const INTRO_SKIP =
  typeof window === 'undefined' ||
  new URLSearchParams(window.location.search).has('at') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let start = -1;

/** performance.now() of the scene's first frame, -1 until it has drawn. */
export const introStart = () => start;

export function markIntroStart(now: number) {
  if (start < 0) start = now;
}
