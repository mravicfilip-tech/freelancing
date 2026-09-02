/**
 * Every tunable number for the hero planet lives here.
 * Angles are degrees, durations are seconds, sizes are either world units
 * (sphere radius = 1) or CSS pixels as noted. Tune freely — nothing in the
 * shaders or PlanetScene hard-codes these.
 *
 * `variant` picks a preset from ./variants.ts which overrides any of these keys.
 * Override at runtime with `?variant=ledger|core|network` for review.
 */
export const PLANET_CONFIG = {
  variant: 'ledger' as 'ledger' | 'core' | 'network',

  // ---------- Colours (brand tokens; keep in sync with src/styles/tokens.css) ----------
  colorAccent: '#4B4BF7',   // brand indigo
  colorInk: '#111214',
  colorLime: '#D9F24E',
  colorPlanet: '#7C858D',   // land dots
  colorOcean: '#B9BEC4',    // ocean dots
  colorRing: '#A9AFB6',     // orbit ring stroke
  lightenAmount: 0.0,       // 0..1 — how much dots lighten toward the light
  lightDirection: [-0.55, 0.65, 0.55] as [number, number, number], // view-space, normalised at runtime

  // ---------- Sphere: dots ----------
  pointLayout: 'fibonacci' as 'fibonacci' | 'grid', // grid = tidy latitude rows (halftone look)
  pointCountDesktop: 14000,
  pointCountMobile: 6000,
  useLandMask: true,        // false = uniform dots
  landCoverage: 0.3,        // fraction of the sphere that reads as land
  landMaskSize: [160, 80] as [number, number],
  landMaskSeed: 7,
  landMaskFrequency: 1.6,   // lower = bigger blobs
  coastSoftness: 0.06,
  landPointSizePx: 2.7,     // CSS px at the reference sphere radius below
  oceanPointSizePx: 1.7,
  sizeByLight: false,       // true = dot size follows lighting (halftone); uses sizeMinPx/sizeMaxPx
  sizeMinPx: 0.7,
  sizeMaxPx: 3.2,
  referenceSphereRadiusPx: 250,
  landOpacity: 0.95,
  oceanOpacity: 0.42,
  silhouettePower: 0.85,    // higher = edge dissolves sooner
  axisTiltDeg: 23,
  rotationPeriodSec: 90,
  staticRotationDeg: 38,    // pose used for reduced-motion / fallback capture

  // ---------- Sphere: solid shell (variant "core") ----------
  shell: false,
  shellColorDark: '#111214',
  shellColorLight: '#4B4BF7',
  shellColorRim: '#9D9DFF',
  shellSpecular: 0.35,

  // ---------- Sphere: wire lattice + payment arcs (variant "network") ----------
  lattice: false,
  latticeStepDeg: 15,
  latticeColor: '#7C858D',
  latticeOpacity: 0.28,
  arcs: false,
  arcCount: 9,
  arcSeed: 3,
  arcLift: 0.22,            // arc apex height above the surface, world units
  arcColor: '#7C858D',
  arcOpacity: 0.22,
  arcPulseColor: '#4B4BF7',
  arcPulseLength: 0.12,     // fraction of the arc
  arcPulsePeriodSec: 4.5,

  // ---------- Silhouette outline + contact shadow ----------
  outline: false,
  outlineColor: '#7C858D',
  outlineOpacity: 0.35,
  outlineWidthPx: 1,
  shadow: false,
  shadowOpacity: 0.16,
  shadowOffsetY: -1.28,     // world units below the centre
  shadowWidth: 2.4,         // world units
  shadowAspect: 0.22,       // height / width

  // ---------- Layout (fractions of the hero box) ----------
  planetCenterX: 0.63,
  planetCenterY: 0.5,
  sphereDiameterFraction: 0.56,
  tabletPlanetCenterX: 0.66,
  tabletSphereDiameterFraction: 0.5,
  mobilePlanetCenterX: 0.5,
  mobileSphereDiameterFraction: 0.72,
  captureSphereDiameterFraction: 0.56,
  cameraFovDeg: 30,

  // ---------- Glow ----------
  glow: true,
  glowScale: 3.6,           // plane width in sphere radii
  glowOpacity: 0.10,
  glowInner: 0.0,
  glowFalloff: 2.6,
  glowAdditive: false,

  // ---------- Orbit rings ----------
  ringRadii: [1.12, 1.22, 1.32],
  ringInclinationsDeg: [12, 68, 105],
  ringAzimuthsDeg: [8, 70, -75],
  ringRollsDeg: [-8, 30, -40],
  ringTubeRadius: 0.0028,
  ringOpacity: 0.28,
  ringBackFade: 0.2,
  ringSegments: 320,

  // ---------- Orbit nodes: crypto badges in transit ----------
  nodePeriodsSec: [16, 20, 24],
  // Badges are assigned to rings round-robin with evenly spaced phases per ring.
  // Add `logo: '/coins/btc.svg'` to use an image instead of the generated glyph badge.
  coins: [
    { symbol: 'BTC', color: '#F7931A', glyph: '₿' },
    { symbol: 'ETH', color: '#627EEA', glyph: 'Ξ' },
    { symbol: 'USDT', color: '#26A17B', glyph: '₮' },
    { symbol: 'USDC', color: '#2775CA', glyph: '$' },
    { symbol: 'SOL', color: '#9945FF', glyph: 'S' },
    { symbol: 'XRP', color: '#23292F', glyph: 'X' },
  ] as { symbol: string; color: string; glyph: string; logo?: string }[],
  badgeSize: 0.13,
  badgeTexturePx: 192,
  nodeBackFade: 0.2,
  nodeTrailLength: 5,
  nodeTrailSpan: 1.0,
  nodeTrailOpacity: 0.35,
  nodeTrailSize: 0.035,

  // ---------- Motion ----------
  entranceTotalSec: 1.8,
  parallaxStrength: 0.06,
  parallaxLerp: 0.05,
  scrollDriftFraction: 0.08,

  // ---------- Rendering ----------
  maxPixelRatio: 2,
  resizeDebounceMs: 120,
  occluderRadius: 0.985,
};

export type PlanetConfig = typeof PLANET_CONFIG;
