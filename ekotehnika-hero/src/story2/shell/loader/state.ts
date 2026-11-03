// What the four preloaders share, round 8. Preloader.tsx owns the one loop and the one set of numbers, a LoaderState, and each version
// (Viljuska, Nacrt, Paleta, Ruta) only draws it. A version registers a function with useFrame and the loop calls it once a frame after the
// numbers are brought up to date, so no version runs a timer or a loop of its own and none can disagree with the others about how far the
// loading has got, where the mouse is or when the exit starts. Kept free of three, the three of Paleta stays in its own file.
import { useLayoutEffect } from 'react';
import { bezier } from '../motion';

export type Frame = (s: LoaderState, dt: number) => void;

export type LoaderState = {
  // how far the loading has got, 0 to 1, eased toward the real number and never backwards, see Preloader.tsx
  p: number;
  // seconds since the preloader mounted
  t: number;
  // the viewport in px
  w: number;
  h: number;
  // the mouse from the centre of the viewport, -1 to 1 on both axes, eased, and in px from the top left, eased. Until the first move the
  // mouse is taken to be at rest in the centre and moved is false
  mx: number;
  my: number;
  cx: number;
  cy: number;
  moved: boolean;
  // seconds since the loading was done, 0 before. The version plays its closing move in this time, then the page is let go
  full: number;
  // 0 to 1 over the exit, from the moment the page is let go, 0 before
  out: number;
  frames: Set<Frame>;
};

export const newState = (): LoaderState => ({
  p: 0,
  t: 0,
  w: typeof window === 'undefined' ? 1440 : window.innerWidth,
  h: typeof window === 'undefined' ? 900 : window.innerHeight,
  mx: 0,
  my: 0,
  cx: typeof window === 'undefined' ? 720 : window.innerWidth / 2,
  cy: typeof window === 'undefined' ? 450 : window.innerHeight / 2,
  moved: false,
  full: 0,
  out: 0,
  frames: new Set(),
});

// How long each version holds the finished load before the page is let go, in ms, and how long the exit takes after that. The exit is the
// same 650ms for all four, under the 700ms of the brief, and the hold is what a version needs to play its closing move, the fork lifting
// the sheet or the pallet being picked up.
export const HOLD_MS: Record<number, number> = { 1: 240, 2: 200, 3: 520, 4: 260 };
export const EXIT_MS = 650;

// Register a drawing function for as long as the version is on screen. The function reads the state and writes straight to the DOM, a
// canvas or three, there is no React render per frame.
export function useFrame(state: LoaderState, frame: Frame) {
  useLayoutEffect(() => {
    state.frames.add(frame);
    return () => {
      state.frames.delete(frame);
    };
    // the frame closes over refs and the state only, so it is registered once
  }, [state]);
}

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// a share of v between a and b
export const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// the plan's wipe curve, the one the sheet has always lifted on
export const liftEase = bezier(0.7, 0, 0.2, 1);

// The colour tokens of the brand, studio/clients/ekotehnika/README.md, for the parts drawn in SVG and three. The CSS reads the same
// values from the variables of styles.css.
export const INK = '#222222';
export const LMH_RED = '#a00020';
export const GREY = { pale: '#e9e9e9', light: '#d2d2d2', mid: '#a1a1a1', dark: '#6b6b6b' } as const;
