// Hairline circle on a billboard quad, optionally drawn in as a sweep from uStart.
precision highp float;

uniform vec3  uColor;
uniform float uOpacity;
uniform float uRadius;     // circle radius in quad units (0..0.5)
uniform float uWidth;      // stroke width in quad units
uniform float uSweep;      // 0..1 fraction of the circle drawn (clockwise from uStart)
uniform float uStart;      // start angle, radians
uniform float uPulse;      // 0..1 position of a travelling highlight along the circle (loop)
uniform float uPulseLen;   // 0..1 length of its tail; 0 disables
uniform vec3  uPulseColor;

varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c);
  float aa = fwidth(d) * 1.2;
  float ring = smoothstep(uRadius - uWidth - aa, uRadius - uWidth, d) * (1.0 - smoothstep(uRadius, uRadius + aa, d));
  float ang = fract((uStart - atan(c.y, c.x)) / 6.28318530718);
  float head = fwidth(ang) * 2.0;
  float sweep = 1.0 - smoothstep(uSweep - head, uSweep, ang);
  // travelling highlight: brightest at the head, fading along its tail
  float behind = fract(uPulse - ang);
  float tail = uPulseLen > 0.0 ? pow(clamp(1.0 - behind / uPulseLen, 0.0, 1.0), 1.6) : 0.0;
  vec3 col = mix(uColor, uPulseColor, tail);
  float a = uOpacity * ring * sweep * (1.0 + tail * 0.6);
  if (a <= 0.002) discard;
  gl_FragColor = vec4(col, min(a, 1.0));
}
