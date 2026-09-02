/**
 * Every tunable number for the hero planet lives here.
 * Angles are degrees, durations are seconds, sizes are either world units
 * (sphere radius = 1) or CSS pixels as noted. Tune freely — nothing in the
 * shaders or PlanetScene hard-codes these.
 *
 * `variant` picks a preset from ./variants.ts which overrides any of these keys.
 * Override at runtime with `?variant=<name>` for review.
 */
export const PLANET_CONFIG = {
  variant: 'globe-halftone' as
    | 'globe-halftone'
    | 'globe-atlas'
    | 'globe-matte'
    | 'orbital'
    | 'orbital-rise'
    | 'orbital-stage'
    | 'ledger'
    | 'core'
    | 'network',

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
  landMaskSource: 'noise' as 'noise' | 'image', // image = real geography from landMaskUrl
  landMaskUrl: '/land-mask.png',                // equirectangular, white = land (npm run landmask)
  landCoverage: 0.3,        // noise mode only: fraction of the sphere that reads as land
  landMaskSize: [160, 80] as [number, number],
  landMaskSeed: 7,
  landMaskFrequency: 1.6,   // lower = bigger blobs
  coastSoftness: 0.06,
  landPointSizePx: 2.7,     // CSS px at the reference sphere radius below
  oceanPointSizePx: 1.7,
  sizeByLight: false,       // true = dot size follows lighting (halftone); uses sizeMinPx/sizeMaxPx
  sizeMinPx: 0.7,
  sizeMaxPx: 3.2,
  litInfluence: 0,          // 0..1 — how much lighting shrinks dots on the shadow side (all modes)
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

  // ---------- Body disc: a soft solid disc behind the dots so the sphere has volume ----------
  body: false,
  bodyColor: '#E2E5E8',
  bodyOpacity: 1,
  bodyEdge: 0.9,            // 0..1 — where the disc's edge starts to soften

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

  // ---------- Orbit rings (paths are always used by the coins; the lines are optional) ----------
  ringsVisible: true,
  ringRadii: [1.12, 1.22, 1.32],
  ringInclinationsDeg: [12, 68, 105],
  ringAzimuthsDeg: [8, 70, -75],
  ringRollsDeg: [-8, 30, -40],
  ringTubeRadius: 0.0028,
  ringOpacity: 0.28,
  ringBackFade: 0.2,
  ringSegments: 320,

  // ---------- Coins ----------
  coinMode: 'orbit' as 'orbit' | 'popup', // popup = coins land at cities on the surface
  popupVisible: 3,                        // how many are up at once
  popupHoldSec: [2.6, 4.4] as [number, number],
  popupSpawnGapSec: 0.9,
  popupSiteCooldownSec: 20,
  popupMinFacing: 0.45,                   // only sites this well turned toward the camera are chosen
  popupLift: 0.17,                        // coin height above the surface, world units
  popupMarkerSize: 0.05,
  popupPingSize: 0.6,
  popupPingSec: 1.4,
  popupSites: [
    ['Lagos', 6.5, 3.4], ['London', 51.5, -0.1], ['Madrid', 40.4, -3.7], ['Manila', 14.6, 121.0],
    ['Singapore', 1.3, 103.8], ['Dubai', 25.2, 55.3], ['New York', 40.7, -74.0], ['São Paulo', -23.5, -46.6],
    ['Nairobi', -1.3, 36.8], ['Mumbai', 19.1, 72.9], ['Mexico City', 19.4, -99.1], ['Sydney', -33.9, 151.2],
    ['Tokyo', 35.7, 139.7], ['Johannesburg', -26.2, 28.0], ['Toronto', 43.7, -79.4], ['Istanbul', 41.0, 29.0],
    ['Buenos Aires', -34.6, -58.4], ['Cairo', 30.0, 31.2], ['Seoul', 37.6, 127.0], ['Berlin', 52.5, 13.4],
  ] as [string, number, number][],

  // ---------- Orbit nodes: crypto badges in transit ----------
  nodePeriodsSec: [16, 20, 24],
  // Badges are assigned to rings round-robin with evenly spaced phases per ring.
  // Add `logo: '/coins/btc.svg'` to use an image instead of the drawn mark.
  coins: [
    { symbol: 'BTC', color: '#F7931A' },
    { symbol: 'ETH', color: '#627EEA' },
    { symbol: 'USDT', color: '#26A17B' },
    { symbol: 'USDC', color: '#2775CA' },
  ] as { symbol: string; color: string; logo?: string }[],
  badgeSize: 0.13,
  badgeTexturePx: 192,
  nodeBackFade: 0.2,
  nodeTrailLength: 5,
  nodeTrailSpan: 1.0,
  nodeTrailOpacity: 0.35,
  nodeTrailSize: 0.035,

  // ---------- Motion ----------
  entranceTotalSec: 1.8,
  assemble: false,          // true = dots fly in from a swirling cloud and settle into the sphere
  assembleSec: 2.6,
  assembleSpread: 2.4,      // how far out the cloud starts, in sphere radii
  assembleSwirlDeg: 160,    // how much the cloud is twisted around the axis before it settles
  entranceSpinDeg: 70,      // extra rotation that decelerates as the sphere settles
  scrollDriftFraction: 0.08,

  // ---------- Rendering ----------
  maxPixelRatio: 2,
  resizeDebounceMs: 120,
  occluderRadius: 0.985,
};

export type PlanetConfig = typeof PLANET_CONFIG;
