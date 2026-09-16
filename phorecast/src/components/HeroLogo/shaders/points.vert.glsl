// Surface points of the mark: assemble from aStart, jitter idly, fly along the normal on scroll.
attribute vec3 aNormal;
attribute vec3 aStart;
attribute float aSeed;   // 0-1, per-point variation
attribute float aDelay;  // 0-1, how late this point arrives

uniform float uProgress; // entrance, 0-1
uniform float uTime;
uniform float uFly;      // × mark height along the normal (scroll)
uniform float uSizePx;   // point diameter, CSS pixels at the mark's depth
uniform float uDpr;
uniform float uViewDist; // camera distance to the mark's centre
uniform float uDepthNear;
uniform float uDepthFar;
uniform float uDepthFade;

varying float vAlpha;

void main() {
  float p = clamp((uProgress - 0.5 * aDelay) / 0.5, 0.0, 1.0);
  p = p * p * (3.0 - 2.0 * p);
  vec3 pos = mix(aStart, position, p);
  pos += aNormal * sin(uTime * 1.3 + aSeed * 6.2832) * 0.004;
  pos += aNormal * uFly * (0.3 + 0.7 * aSeed);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSizePx * uDpr * (uViewDist / max(1.0, -mv.z)) * (0.7 + 0.6 * aSeed);

  float depth = clamp((mv.z - uDepthFar) / (uDepthNear - uDepthFar), 0.0, 1.0);
  float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + aSeed * 40.0);
  vAlpha = mix(1.0 - uDepthFade, 1.0, depth) * mix(0.5, 1.0, aSeed) * twinkle * p * (1.0 - 0.7 * clamp(uFly * 2.0, 0.0, 1.0));
}
