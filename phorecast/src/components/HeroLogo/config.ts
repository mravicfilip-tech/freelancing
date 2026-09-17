/** Every tunable number for the 3D mark, in one place. Distances are in CSS pixels unless noted; the mark itself is normalised to height 1. */
export const LOGO_CONFIG = {
  cameraFovDeg: 32,
  maxPixelRatio: 2,

  // ---------- Frame budget ----------
  // The mark is ~18,800 blended line quads drawn with depthTest off, so every
  // fragment is shaded and composited and the cost is overdraw, not geometry.
  // That is fine on a GPU and ruinous without one, where it can take the whole
  // page down to single-digit frames. These three numbers let it notice.

  /** Idle cap. The sway has a 15s period; past this nobody can see the difference. */
  idleFps: 30,
  /** First frames of a scene compile shaders and are always slow; skip them. */
  warmupFrames: 4,
  /**
   * Budget overrun, in milliseconds, before dropping resolution and before
   * giving up entirely -- accumulated, not counted. Counting frames cannot tell
   * a device that is slightly late from one taking 480ms a frame, and on the
   * second the count takes half a minute to reach any threshold worth setting
   * for the first. Overrun crosses these in a few frames when frames are
   * catastrophic and never when they are merely imperfect.
   */
  overrunBeforeDegrade: 250,
  overrunBeforeFallback: 1500,
  /** Slow frames required alongside the overrun, so one hiccup cannot trip it. */
  slowFramesBeforeDegrade: 4,
  slowFramesBeforeFallback: 8,
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
  color: 0xf03725,
  core: { width: 1.4, feather: 1.4, opacity: 1.0, pulse: 0.9 },
  glow: { width: 11, feather: 11, opacity: 0.11, pulse: 1.4 },
  pulseSpeed: 0.11,
  depthFade: 0.55,
  scrollSpread: 2.4,

  /**
   * On paper the mark is a different medium, not a different colour.
   *
   * Dark draws the mark as emitted light: both passes blend additively over a
   * near-black ground, so crossings brighten and the wide feathered pass reads
   * as a glow. Neither survives a move to `#fffbf8`. Additive light over paper
   * can only push channels toward white, so the slices and ribs wash out to a
   * ~1.5:1 haze and only the very densest strokes survive — measured, 0.2% of
   * the mark's pixels cleared 3:1 before this existed. And a *dark* 11px
   * feathered pass is not a glow inverted, it is a smudge: a halo, which this
   * page does not get.
   *
   * So light composites ONE pass of ink OVER the page. Everything else — the
   * geometry, the widths, the draw-in, the depth fade, the travelling
   * highlight — is shared with dark, because none of it is about luminance.
   */
  lightInk: {
    /** Read from the palette first; the literal is the fallback and the documented value. */
    colorToken: '--accent',
    color: 0xa21605,
    /**
     * Headroom for the travelling highlight. Dark gets its highlight from the
     * glow pass adding on top of an already-full core; with no glow pass and
     * `f` clamped at 1, a cap at full intensity has nowhere left to go. Resting
     * the outline a little short of full ink gives the pulse somewhere to
     * travel: 5.78:1 at rest, 7.69:1 as it passes. On paper "lit" is more ink.
     */
    capIntensity: 0.85,
    core: { width: 1.4, feather: 1.4, opacity: 1.0, pulse: 0.9 },
  },
} as const;

/** Glass: three slabs of tinted, transmissive glass. */
export const GLASS = {
  /** Near white: with transmission, `color` filters everything seen through a slab, and three slabs stack. The tint comes from attenuation. */
  color: 0xfff2ea,
  attenuationColor: 0xf03f2b,
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
  face: 0xf03f2b,
  /** Lifts the tone-mapped face back to the brand orange. */
  faceEmissive: 0x460e0a,
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
  color: 0xf03725,
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
  color: 0xf14632,
  sizePx: 2.1,
  depth: 0.3,
  /** Scatter radius at the start of the entrance, × mark height. */
  scatter: 0.9,
  /** Scroll: how far along their normals the points fly, × mark height. */
  scrollFly: 0.5,
  depthFade: 0.6,
} as const;
