precision highp float;

varying float vAlpha;
varying vec3  vColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  // Soft-edged disc; the 0.5 radius maps to the point's edge.
  float disc = 1.0 - smoothstep(0.32, 0.5, d);
  float a = disc * vAlpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor, a);
}
