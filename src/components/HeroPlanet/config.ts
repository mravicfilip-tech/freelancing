/**
 * Every tunable number for the hero planet lives here.
 * Angles are degrees, durations are seconds, sizes are either world units
 * (sphere radius = 1) or CSS pixels as noted. Tune freely — nothing in the
 * shaders or PlanetScene hard-codes these.
 */
export const PLANET_CONFIG = {
  // ---------- Colours (brand tokens; keep in sync with src/styles/tokens.css) ----------
  colorAccent: '#4B4BF7',   // brand indigo — used for the glow tint only
  colorLime: '#D9F24E',     // unused by the planet now (kept for tuning)
  colorPlanet: '#7C858D',   // land dots
  colorOcean: '#B9BEC4',    // lighter grey for ocean dots
  colorRing: '#7C858D',     // orbit ring stroke
  lightenAmount: 0.16,      // 0..1 — how much dots lighten toward the top-left light
  lightDirection: [-0.55, 0.65, 0.55] as [number, number, number], // view-space, normalised at runtime

  // ---------- Sphere ----------
  pointCountDesktop: 14000,
  pointCountMobile: 6000,
  landCoverage: 0.3,        // fraction of the sphere that reads as land
  landMaskSize: [160, 80] as [number, number], // equirectangular mask resolution (≈25ms to generate; 256×128 is ~100ms)
  landMaskSeed: 7,          // change for a different set of blobs
  landMaskFrequency: 1.6,   // lower = bigger blobs
  coastSoftness: 0.06,      // width of the land→ocean transition in mask units
  landPointSizePx: 2.7,     // CSS px at the reference sphere radius below
  oceanPointSizePx: 1.7,
  referenceSphereRadiusPx: 250, // dot sizes above are measured at this on-screen radius
  landOpacity: 0.95,
  oceanOpacity: 0.42,
  silhouettePower: 0.85,    // higher = edge dissolves sooner (dot(n, view)^power)
  axisTiltDeg: 23,          // tilt of the rotation axis, like Earth
  rotationPeriodSec: 90,    // one full revolution
  staticRotationDeg: 38,    // pose used for reduced-motion / fallback capture

  // ---------- Layout (fractions of the hero box) ----------
  planetCenterX: 0.63,
  planetCenterY: 0.5,
  sphereDiameterFraction: 0.56, // of hero height
  // Tablet (768–1279px): pull the planet right and shrink it so it clears the copy
  tabletPlanetCenterX: 0.66,
  tabletSphereDiameterFraction: 0.5,
  // Mobile (<768px): the canvas is its own box below the copy
  mobilePlanetCenterX: 0.5,
  mobileSphereDiameterFraction: 0.72, // of the canvas box height
  captureSphereDiameterFraction: 0.56, // fallback PNG export — keep equal to sphereDiameterFraction
  cameraFovDeg: 30,

  // ---------- Glow ----------
  glowScale: 3.6,           // plane width in sphere radii
  glowOpacity: 0.10,        // peak alpha — kept faint under the grey planet
  glowInner: 0.0,           // 0..1 — radius where the falloff starts
  glowFalloff: 2.6,         // higher = tighter bloom
  glowAdditive: false,      // true = additive blending (reads near-white on a light bg)

  // ---------- Orbit rings ----------
  ringRadii: [1.12, 1.22, 1.32],          // × sphere radius — tight orbits that hug the planet
  ringInclinationsDeg: [12, 68, 105],     // tilt of each ring plane (rotation about X)
  ringAzimuthsDeg: [8, 70, -75],          // rotation about Y — near ±90° makes a steep ring edge-on/thin
  ringRollsDeg: [-8, 30, -40],            // in-screen rotation (about Z) so the ellipses sit diagonally
  ringTubeRadius: 0.0028,                 // world units — ~1.4px at the reference radius
  ringOpacity: 0.5,
  ringBackFade: 0.14,                     // opacity multiplier on the half behind the sphere
  ringSegments: 320,

  // ---------- Orbit nodes: crypto badges in transit ----------
  nodePeriodsSec: [16, 20, 24],           // one loop per ring; all different so they never sync
  // Badges are assigned to rings round-robin (0,1,2,0,1,2…) with evenly spaced phases per ring.
  // Add `logo: '/coins/btc.svg'` to use an image instead of the generated glyph badge.
  coins: [
    { symbol: 'BTC', color: '#F7931A', glyph: '₿' },
    { symbol: 'ETH', color: '#627EEA', glyph: 'Ξ' },
    { symbol: 'USDT', color: '#26A17B', glyph: '₮' },
    { symbol: 'USDC', color: '#2775CA', glyph: '$' },
    { symbol: 'SOL', color: '#9945FF', glyph: 'S' },
    { symbol: 'XRP', color: '#23292F', glyph: 'X' },
  ] as { symbol: string; color: string; glyph: string; logo?: string }[],
  badgeSize: 0.13,                        // badge diameter, world units (sphere radius = 1)
  badgeTexturePx: 192,                    // generated badge texture size
  nodeBackFade: 0.2,                      // opacity multiplier when a badge passes behind the planet
  nodeTrailLength: 5,                     // beads behind each badge (0 = none)
  nodeTrailSpan: 1.0,                     // seconds of travel the trail covers
  nodeTrailOpacity: 0.35,
  nodeTrailSize: 0.035,                   // bead diameter, world units

  // ---------- Motion ----------
  entranceTotalSec: 1.8,
  parallaxStrength: 0.06,   // camera offset in world units at the hero's edge
  parallaxLerp: 0.05,       // per-frame lerp toward the pointer target
  scrollDriftFraction: 0.08, // drift right/down as the hero scrolls out (fraction of hero size)

  // ---------- Rendering ----------
  maxPixelRatio: 2,
  resizeDebounceMs: 120,
  occluderRadius: 0.985,    // invisible depth-only sphere that hides rings behind the planet
};

export type PlanetConfig = typeof PLANET_CONFIG;
