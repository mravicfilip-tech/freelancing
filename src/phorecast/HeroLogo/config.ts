/** Every tunable number for the lined 3D logo, in one place. Distances are in CSS pixels unless noted. */
export const LOGO_CONFIG = {
  // ---------- Model ----------
  /** Points sampled around the outline; each becomes one segment per slice. */
  outlineSamples: 720,
  /** Outline copies stacked through the depth, front and back caps included. */
  slices: 13,
  /** Extrusion depth as a fraction of the mark's height. */
  depth: 0.34,
  /** Front/back outline brightness vs. the inner slices. */
  capIntensity: 1.0,
  sliceIntensity: 0.26,
  /** Evenly spaced front-to-back connectors, plus one at every corner sharper than `cornerAngleRad`. */
  ribs: 56,
  ribIntensity: 0.42,
  cornerAngleRad: 0.45,
  /** Brand orange, straight to the framebuffer (colour management is off). */
  color: 0xff632a,
  /** Thin, bright core line and a wide, faint glow line drawn from the same geometry. */
  core: { width: 1.4, feather: 1.4, opacity: 1.0, pulse: 0.9 },
  glow: { width: 11, feather: 11, opacity: 0.11, pulse: 1.4 },
  /** Laps of the outline the travelling highlight makes per second. */
  pulseSpeed: 0.11,
  /** Far-side dimming, 0-1. */
  depthFade: 0.55,

  // ---------- Camera and placement ----------
  cameraFovDeg: 32,
  maxPixelRatio: 2,
  /** Per breakpoint: the mark's height as a fraction of the host's height and width (the smaller wins), and its centre. */
  layouts: {
    desktop: { heightFraction: 0.6, widthFraction: 0.34, cx: 0.72, cy: 0.42 },
    tablet: { heightFraction: 0.5, widthFraction: 0.42, cx: 0.7, cy: 0.36 },
    mobile: { heightFraction: 0.86, widthFraction: 0.7, cx: 0.5, cy: 0.5 },
  },

  // ---------- Motion (radians, seconds) ----------
  restYaw: -0.32,
  restPitch: 0.1,
  idleYawAmp: 0.16,
  idleYawPeriodSec: 15,
  idlePitchAmp: 0.05,
  idlePitchPeriodSec: 9,
  /** Pointer at the host's edge turns the mark this far. */
  pointerYaw: 0.36,
  pointerPitch: 0.22,
  /** Pointer smoothing: fraction of the remaining distance covered per second (exponential). */
  pointerEase: 5,
  /** As the hero scrolls out: extra turn, rise (fraction of host height), slice spread and the fade. */
  scrollYaw: 0.75,
  scrollPitch: 0.55,
  scrollRise: 0.12,
  scrollSpread: 2.4,
  fadeStart: 0.55,
  /** Draw-in after fonts are ready. */
  entranceSec: 2.2,
  entranceScaleFrom: 0.94,

  resizeDebounceMs: 120,
} as const;

export type LogoConfig = typeof LOGO_CONFIG;
