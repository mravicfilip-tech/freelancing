// The preloader as a mode of the story's own scene, round 8. Filip rejected the four drawn and primitive loaders (taste 2026-11-03 15:40,
// "none of the variants work and they're out of style for the graphics we're using on the website", "use the models, use the boxes we made"),
// so the loader is now the scene itself. It runs in the same renderer, light, environment, ground and materials as the story, with the
// real Linde models, the EKOTEHNIKA carton and the labelled loads of the warehouse, and it hands over to the hero shot with one camera move.
//   1 Utovar  a close shot of the hero X50's forks and its pallet, cartons settle onto the pallet as each group of assets loads, the forks lift
//             the load and the camera pulls back into the hero shot
//   2 Regal   one bay of racks with labelled loads, the reach truck lifts a pallet through the beams as the loading goes, and the camera
//             tracks out along the aisle to the hero
//   3 Kutija  the EKOTEHNIKA carton alone on its pallet, turning to the mouse, its bin label fills with the loading, then the X50 drives in,
//             forks under the pallet, lifts it and drives on into the hero place
// This file is the one set of numbers the shell (shell/Preloader.tsx) writes and the scene reads each frame, kept free of three and react so
// both can import it. The preloader owns the clock and the loading, the scene only draws what the numbers say, so no scene part runs a timer
// of its own. loaderscene.tsx draws the three, loadercam.ts places the camera, and index.tsx, camera.tsx and intro.ts each read live and
// version. Nothing here touches the story's beats, once the handover is done live is false and the scene is the story as it always was.
import { LOADER } from '../../preview';
import { INTRO_SKIP } from './intro';

/** Whether this page load plays a preloader at all. A frozen clock (?at=) and reduced motion do not, the page is there as it always was. */
export const LOADER_ON = !INTRO_SKIP;

export type LoaderState = {
  /** 1, 2 or 3, the version that plays, 0 when none does */
  version: number;
  /** true from the first render until the handover has landed, the scene reads this to know it is in loader mode */
  live: boolean;
  /** how far the loading has got, 0 to 1, eased toward the real number and never backwards */
  p: number;
  /** seconds since the preloader mounted */
  t: number;
  /** seconds since the loading was done, negative before */
  full: number;
  /** 0 to 1 over the one camera move to the hero, 0 before */
  go: number;
  /** the mouse from the centre of the viewport, -1 to 1 on both axes, eased, 0 until the first move */
  mx: number;
  my: number;
  /** the scene has mounted its environment, the first frames have drawn, and the X50 is in, the first set */
  env: boolean;
  x50: boolean;
  frames: number;
  /** how many of the later scene groups (the warehouse, the blueprint, the rental floor, the aisle) the scene may mount now, and how many it has */
  stage: number;
  mounted: number;
};

export const loader: LoaderState = {
  version: LOADER_ON ? LOADER : 0,
  live: LOADER_ON,
  p: 0,
  t: 0,
  full: -1,
  go: 0,
  mx: 0,
  my: 0,
  env: false,
  x50: false,
  frames: 0,
  stage: LOADER_ON ? 0 : 4,
  mounted: LOADER_ON ? 0 : 4,
};

// ?debug=loader hands the numbers to the console as window.__loader and keeps the time of each step of the first set, for timing a cold load.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'loader') {
  (window as unknown as { __loader: LoaderState }).__loader = loader;
}

/** The later scene groups, mounted one after the other once the first set is in so the first frames are not held by their geometry. */
export const STAGES = 4;

// The first set, the X50 model, the environment and the fonts, is in. The scene mounts the rest only after it, and the shell shows the
// loader at that moment. Listeners hear it once.
let first = !LOADER_ON;
const heard = new Set<() => void>();
export const isFirst = () => first;
export function markFirst() {
  if (first) return;
  first = true;
  heard.forEach((f) => f());
}
export function onFirst(f: () => void) {
  heard.add(f);
  return () => {
    heard.delete(f);
  };
}

// The stages are counted here so the scene and the shell read one number, and the scene hears when it changes.
const staged = new Set<() => void>();
export function setStage(n: number) {
  if (n === loader.stage) return;
  loader.stage = n;
  staged.forEach((f) => f());
}
export function onStage(f: () => void) {
  staged.add(f);
  return () => {
    staged.delete(f);
  };
}

/** Seconds after the loading is done when the camera starts its one move to the hero. */
export const MOVE_S: Record<number, number> = { 1: 0.85, 2: 0.65, 3: 1.6 };
/** Seconds after the loading is done when the camera has landed on the hero and the loader is gone. */
export const END_S: Record<number, number> = { 1: 2.25, 2: 2.2, 3: 2.9 };
/** Seconds after the loading is done when the hero's words and the page start to arrive, about half way through the move, so the words come in over a shot that is already opening out and not over the close one. */
export const REVEAL_S: Record<number, number> = { 1: 1.4, 2: 1.35, 3: 2.2 };

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
/** The eased share of the camera move to the hero at full seconds after the loading was done. */
export const goAt = (version: number, full: number) => {
  const a = MOVE_S[version] ?? 0.5;
  const b = END_S[version] ?? 1.8;
  return smooth((full - a) / (b - a));
};

// A debug hook for tuning a version without waiting for it and for stepping one frame at a time, ?lfreeze=<p>,<full>,<t>, the loading held at p
// (0 to 1), the seconds since it was done at full (negative for before) and the loader's own clock at t seconds. The shell holds the page there and
// never lets go, and the numbers can be changed from the console through window.__lfreeze, which a shot of the timeline does between frames. The
// mouse is held at mx and my the same way. Not shown anywhere and not a setting.
export type Freeze = { p: number; full: number; t: number | null; mx: number; my: number };
export const FREEZE: Freeze | null = (() => {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('lfreeze');
  if (!raw) return null;
  const [p, f, t] = raw.split(',').map(Number);
  const z: Freeze = { p: Number.isFinite(p) ? p : 0.5, full: Number.isFinite(f) ? f : -1, t: Number.isFinite(t) ? t : null, mx: 0, my: 0 };
  (window as unknown as { __lfreeze: Freeze }).__lfreeze = z;
  return z;
})();

/** Where the bay of Regal stands, metres, the middle of its two rack bays at the foot of the rack. It is on the bare ground in front of the street, behind the hero's camera and 11 m left of the truck, so no frame of the story ever shows it. */
export const BAY = { x: -11, z: 9 };

/** The seconds the page waits for the loading before it lets go whatever is missing, 10 under the shell's own HERO_WAIT_MS. ?llimit=<seconds> is for timing a build on a slow renderer. */
export const LIMIT_S = (() => {
  if (typeof window === 'undefined') return 9.5;
  const n = Number(new URLSearchParams(window.location.search).get('llimit'));
  return n > 0 ? n : 9.5;
})();
