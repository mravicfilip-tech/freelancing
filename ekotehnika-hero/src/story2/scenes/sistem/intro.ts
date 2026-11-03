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

// ---- the preloader's side of it, round 7 -------------------------------------------------------------------------------------------
// Filip saw the top row, then the hero text, then the scene, "slowly and in three steps". The preloader (shell/Preloader.tsx) now holds
// the page on a white sheet until the fonts, the models and the scene's first frame are all in, and then lets go once. markReveal is that
// moment. The hero text, the top row and the grid read it through revealAt and start together, and the scene's build in starts
// INTRO_HEAD seconds ahead of it, so under the lifting sheet the street is already drawn and the forklift is already driving in, and the
// first thing Filip sees is a page that is arriving, not one that has yet to start.

/** Seconds of the build in that have already played behind the sheet when it lifts. */
export const INTRO_HEAD = 1;

let revealed = -1;

/** performance.now() of the moment the preloader let go, -1 until it has. */
export const revealAt = () => revealed;

export function markReveal(now: number) {
  if (revealed >= 0) return;
  revealed = now;
  // no first frame yet, a canvas that never drew, the build in starts at the reveal
  start = start < 0 ? now : Math.min(start, now - INTRO_HEAD * 1000);
}

// What the models and textures the scene asks for have got to, fed from drei's loading counter by the scene (sistem/index.tsx) and read by
// the preloader. seen is true once the scene has asked for anything at all, before that a progress of 0 means nothing has started.
export const assets = { progress: 0, active: false, seen: false, loaded: 0, total: 0 };

export function setAssets(progress: number, active: boolean, total: number, loaded = 0) {
  assets.progress = progress;
  assets.active = active;
  assets.loaded = loaded;
  assets.total = total;
  if (total > 0) assets.seen = true;
}
