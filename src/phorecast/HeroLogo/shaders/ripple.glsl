// Sum-of-sines ripple field over object space, with its analytic gradient. Injected into
// MeshPhysicalMaterial (see treatments/liquid.ts) to tilt the surface normal — a wet surface
// whose highlights move, without touching the geometry.
uniform float uRippleTime;
uniform float uRippleAmp;
uniform float uRippleFreq;

vec3 rippleGradient(vec3 p) {
  vec3 g = vec3(0.0);
  vec3 k;
  float ph;
  k = vec3(1.0, 0.35, 0.2) * uRippleFreq;        ph = dot(k, p) + uRippleTime * 1.1; g += k * cos(ph) * 0.5;
  k = vec3(-0.4, 1.0, 0.3) * uRippleFreq * 1.7;  ph = dot(k, p) - uRippleTime * 1.6; g += k * cos(ph) * 0.3;
  k = vec3(0.7, -0.6, 0.9) * uRippleFreq * 2.9;  ph = dot(k, p) + uRippleTime * 2.3; g += k * cos(ph) * 0.16;
  k = vec3(-0.9, -0.2, -0.5) * uRippleFreq * 4.7; ph = dot(k, p) - uRippleTime * 3.1; g += k * cos(ph) * 0.08;
  return g / uRippleFreq;
}
