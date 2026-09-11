/** Every tunable number for the 3D mark, in one place. Distances are in CSS pixels unless noted; the mark itself is normalised to height 1. */
export const LOGO_CONFIG = {
  cameraFovDeg: 32,
  maxPixelRatio: 2,
  /** Per breakpoint: the mark's height as a fraction of the host's height and width (the smaller wins), and its centre. */
  layouts: {
    desktop: { heightFraction: 0.6, widthFraction: 0.34, cx: 0.72, cy: 0.42 },
    tablet: { heightFraction: 0.5, widthFraction: 0.42, cx: 0.7, cy: 0.36 },
    mobile: { heightFraction: 0.86, widthFraction: 0.7, cx: 0.5, cy: 0.5 },
  },

  // ---------- Motion (radians, seconds) — the contract every treatment shares ----------
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
  /** As the hero scrolls out: extra turn, rise (fraction of host height) and the fade. Each treatment adds its own spread. */
  scrollYaw: 0.75,
  scrollPitch: 0.55,
  scrollRise: 0.12,
  fadeStart: 0.55,
  /** Entrance after fonts are ready. 'rise' treatments also turn in from `entranceYaw` and lift by `entranceDrop` × height. */
  entranceSec: 2.2,
  entranceScaleFrom: 0.94,
  entranceYaw: -0.9,
  entranceDrop: 0.22,

  resizeDebounceMs: 120,
} as const;

/** Lined: the outline as stacked slices and ribs, drawn as additive line segments. */
export const LINED = {
  outlineSamples: 720,
  slices: 13,
  depth: 0.34,
  capIntensity: 1.0,
  sliceIntensity: 0.26,
  ribs: 56,
  ribIntensity: 0.42,
  cornerAngleRad: 0.45,
  color: 0xff632a,
  core: { width: 1.4, feather: 1.4, opacity: 1.0, pulse: 0.9 },
  glow: { width: 11, feather: 11, opacity: 0.11, pulse: 1.4 },
  pulseSpeed: 0.11,
  depthFade: 0.55,
  scrollSpread: 2.4,
} as const;

/** Glass: three slabs of tinted, transmissive glass. */
export const GLASS = {
  /** Near white: with transmission, `color` filters everything seen through a slab, and three slabs stack. The tint comes from attenuation. */
  color: 0xfff2ea,
  attenuationColor: 0xff6a30,
  /** World units (× mark height): how far light travels before the tint fully takes. */
  attenuationDistance: 0.14,
  /** Object units — three multiplies it by the object's world scale itself. */
  thickness: 0.12,
  roughness: 0.08,
  envIntensity: 1.6,
  slabDepth: 0.085,
  slabGap: 0.115,
  bevel: 0.012,
  scrollSpread: 3.5,
  maxPixelRatio: 1.5,
} as const;

/** Solid: matte slabs, orange face, dark sides, one orange rim light. */
export const SOLID = {
  face: 0xff6a30,
  /** Lifts the tone-mapped face back to the brand orange. */
  faceEmissive: 0x4a1606,
  side: 0x1b1816,
  slabDepth: 0.1,
  slabGap: 0.11,
  bevel: 0.008,
  faceEnvIntensity: 0.45,
  sideEnvIntensity: 1.1,
  scrollSpread: 3.5,
} as const;

/** Liquid: one extrusion whose surface normals ripple in the shader (see shaders/ripple.glsl). */
export const LIQUID = {
  color: 0xff632a,
  depth: 0.3,
  bevel: 0.02,
  /** Ripple strength (normal tilt), spatial frequency (× mark height) and speed. */
  ripple: 0.5,
  freq: 9,
  speed: 0.6,
  /** Scroll: the surface boils harder and the mark stretches through its depth. */
  scrollBoil: 2.5,
  scrollStretch: 2.5,
  roughness: 0.16,
  envIntensity: 1.3,
} as const;

/** Particles: points on the mark's surface, assembling from a scatter. */
export const PARTICLES = {
  count: 40000,
  color: 0xff7038,
  sizePx: 2.1,
  depth: 0.3,
  /** Scatter radius at the start of the entrance, × mark height. */
  scatter: 0.9,
  /** Scroll: how far along their normals the points fly, × mark height. */
  scrollFly: 0.5,
  depthFade: 0.6,
} as const;
