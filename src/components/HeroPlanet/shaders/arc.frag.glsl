precision highp float;

uniform vec3  uColor;
uniform vec3  uPulseColor;
uniform float uOpacity;
uniform float uPulseLength;
uniform float uTime;
uniform float uPeriod;
uniform float uProgress;

varying float vT;
varying float vArc;
varying float vDepth;

void main() {
  // Each arc's pulse is phase-shifted so they never fire together.
  float phase = fract(uTime / uPeriod + vArc * 0.37);
  float head = phase * (1.0 + uPulseLength * 2.0) - uPulseLength;
  float x = (head - vT) / uPulseLength;          // 0 at the head, 1 at the tail
  float pulse = (x >= 0.0 && x <= 1.0) ? pow(1.0 - x, 1.6) : 0.0;
  float behind = smoothstep(0.1, -0.5, vDepth);
  float base = uOpacity * mix(1.0, 0.25, behind);
  float a = (base + pulse * 0.95 * mix(1.0, 0.3, behind)) * uProgress;
  vec3 col = mix(uColor, uPulseColor, pulse);
  if (a <= 0.002) discard;
  gl_FragColor = vec4(col, min(a, 1.0));
}
