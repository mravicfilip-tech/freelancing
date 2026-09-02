// Dot-matrix sphere — one point per sample.
attribute float aLand;     // 0 = ocean, 1 = land (soft coasts in between)
attribute float aSeed;     // 0..1 per-point jitter
attribute vec3  aStart;    // where the dot starts during the assemble entrance

uniform float uPointScale;      // dpr * cameraDistance * (onScreenRadius / referenceRadius)
uniform float uLandSize;        // px
uniform float uOceanSize;       // px
uniform float uSizeMin;         // px (sizeByLight mode)
uniform float uSizeMax;         // px (sizeByLight mode)
uniform float uSizeByLight;     // 0/1
uniform float uLitInfluence;    // 0..1
uniform float uUseLand;         // 0/1
uniform float uLandOpacity;
uniform float uOceanOpacity;
uniform float uSilhouettePower;
uniform float uProgress;        // entrance 0..1
uniform float uAssemble;        // 0 = flying in from aStart, 1 = settled
uniform float uLighten;
uniform vec3  uLightDir;        // view space, normalised
uniform vec3  uColorLand;
uniform vec3  uColorOcean;

varying float vAlpha;
varying vec3  vColor;

void main() {
  // Assemble: each dot eases from aStart to its place with a per-dot stagger.
  float at = clamp((uAssemble - aSeed * 0.35) / 0.65, 0.0, 1.0);
  at = 1.0 - pow(1.0 - at, 3.0);
  vec3 p = mix(aStart, position, at);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normalize(normalMatrix * position);
  vec3 viewDir = normalize(-mvPosition.xyz);
  float facing = dot(n, viewDir);            // 1 at centre, 0 at the silhouette, <0 behind
  float rim = pow(clamp(facing, 0.0, 1.0), uSilhouettePower);

  // Entrance: fade in from the centre outward with a small stagger.
  float stagger = (1.0 - clamp(facing, 0.0, 1.0)) * 0.35 + aSeed * 0.1;
  float appear = smoothstep(stagger, stagger + 0.6, uProgress * 1.05);

  float land = mix(1.0, aLand, uUseLand);
  float lit = clamp(dot(n, uLightDir), 0.0, 1.0);
  float baseSize = mix(uOceanSize, uLandSize, land);
  // Halftone: dense (large) dots in shadow, fine dots toward the light.
  float litSize = mix(uSizeMax, uSizeMin, pow(lit, 0.7));
  float size = mix(baseSize, litSize, uSizeByLight) * mix(0.85 + aSeed * 0.3, 1.0, uSizeByLight);
  size *= mix(1.0, 0.55 + 0.55 * lit, uLitInfluence);
  float opacity = mix(uOceanOpacity, uLandOpacity, land);

  vec3 base = mix(uColorOcean, uColorLand, land);
  vColor = mix(base, vec3(1.0), lit * uLighten);
  // Dots in flight stay visible regardless of which side they will land on.
  vAlpha = opacity * mix(0.55, rim, at) * appear;

  gl_PointSize = size * mix(0.6, 1.0, at) * uPointScale / max(-mvPosition.z, 0.001) * mix(0.7 + 0.3 * rim, 1.0, uSizeByLight);
  gl_Position = projectionMatrix * mvPosition;
}
