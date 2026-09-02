// Dot-matrix sphere — one point per Fibonacci-sphere sample.
attribute float aLand;     // 0 = ocean, 1 = land (soft coasts in between)
attribute float aSeed;     // 0..1 per-point jitter

uniform float uPointScale;      // dpr * cameraDistance * (onScreenRadius / referenceRadius)
uniform float uLandSize;        // px
uniform float uOceanSize;       // px
uniform float uLandOpacity;
uniform float uOceanOpacity;
uniform float uSilhouettePower;
uniform float uProgress;        // entrance 0..1
uniform float uLighten;
uniform vec3  uLightDir;        // view space, normalised
uniform vec3  uColorLand;
uniform vec3  uColorOcean;

varying float vAlpha;
varying vec3  vColor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Unit sphere: the position *is* the normal.
  vec3 n = normalize(normalMatrix * position);
  vec3 viewDir = normalize(-mvPosition.xyz);
  float facing = dot(n, viewDir);            // 1 at centre, 0 at the silhouette, <0 behind
  float rim = pow(clamp(facing, 0.0, 1.0), uSilhouettePower);

  // Entrance: fade in from the centre outward with a small stagger.
  float stagger = (1.0 - clamp(facing, 0.0, 1.0)) * 0.35 + aSeed * 0.1;
  float appear = smoothstep(stagger, stagger + 0.6, uProgress * 1.05);

  float land = aLand;
  float size = mix(uOceanSize, uLandSize, land) * (0.85 + aSeed * 0.3);
  float opacity = mix(uOceanOpacity, uLandOpacity, land);

  // Implied light from the top-left: lighten a touch on the lit side.
  float lit = max(dot(n, uLightDir), 0.0);
  vec3 base = mix(uColorOcean, uColorLand, land);
  vColor = mix(base, vec3(1.0), lit * uLighten);

  vAlpha = opacity * rim * appear;

  gl_PointSize = size * uPointScale / max(-mvPosition.z, 0.001) * (0.7 + 0.3 * rim);
  gl_Position = projectionMatrix * mvPosition;
}
