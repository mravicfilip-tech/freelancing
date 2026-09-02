// Hairline circle on a billboard quad (quad is slightly larger than the sphere).
precision highp float;

uniform vec3  uColor;
uniform float uOpacity;
uniform float uRadius;     // circle radius in quad units (0..0.5)
uniform float uWidth;      // stroke width in quad units

varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5);
  float aa = fwidth(d) * 1.2;
  float ring = smoothstep(uRadius - uWidth - aa, uRadius - uWidth, d) * (1.0 - smoothstep(uRadius, uRadius + aa, d));
  float a = uOpacity * ring;
  if (a <= 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
