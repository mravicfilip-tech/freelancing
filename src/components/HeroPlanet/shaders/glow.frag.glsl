// Radial bloom. Used for the big glow behind the sphere and for node halos.
precision highp float;

uniform vec3  uColor;
uniform float uOpacity;   // peak alpha
uniform float uInner;     // 0..1 — where the falloff begins
uniform float uFalloff;   // curve exponent; higher = tighter

varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float d = length(vUv - 0.5) * 2.0;          // 0 centre → 1 edge
  float g = 1.0 - smoothstep(uInner, 1.0, d);
  g = pow(g, uFalloff);
  // ±1/255 alpha dither kills banding in the gradient.
  float dither = (hash(gl_FragCoord.xy) - 0.5) * (2.0 / 255.0);
  float a = clamp(uOpacity * g + dither * step(0.001, g), 0.0, 1.0);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(uColor, a);
}
