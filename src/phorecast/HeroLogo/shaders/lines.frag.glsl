uniform vec3 uColor;
uniform float uOpacity;
uniform float uCore;       // fraction of the quad that is solid line: width / (width + feather)
uniform float uProgress;   // draw-in, 0-1
uniform float uTime;
uniform float uPulse;      // strength of the travelling highlight
uniform float uPulseSpeed; // laps of the outline per second
uniform float uDepthNear;  // view-space z of the nearest point of the model
uniform float uDepthFar;   // ... and the farthest; lines dim towards it
uniform float uDepthFade;  // how much the far end dims, 0-1

varying float vAcross;
varying float vT;
varying float vIntensity;
varying float vDelay;
varying float vViewZ;

void main() {
  // Anti-aliased edge: solid inside uCore, feathered to the quad's edge.
  float cover = 1.0 - smoothstep(uCore, 1.0, abs(vAcross));

  // Draw-in: every segment waits for its delay, then appears along the outline's parameter.
  float p = clamp((uProgress - 0.35 * vDelay) / 0.65, 0.0, 1.0);
  float drawn = (1.0 - smoothstep(p, p + 0.015, vT)) * smoothstep(0.0, 0.03, p);

  // A highlight that travels around the outline (and lights the ribs as it passes).
  float d = fract(vT - uTime * uPulseSpeed);
  d = min(d, 1.0 - d);
  float pulse = exp(-d * d / 0.0016);

  // Depth cue: the far side of the model is dimmer than the near side.
  float depth = clamp((vViewZ - uDepthFar) / (uDepthNear - uDepthFar), 0.0, 1.0);
  float dim = mix(1.0 - uDepthFade, 1.0, depth);

  float f = clamp(vIntensity * dim * (1.0 + uPulse * pulse), 0.0, 1.0);
  float alpha = cover * drawn * f * uOpacity;
  // Premultiplied output; the material blends rgb additively and alpha with "over".
  gl_FragColor = vec4(uColor * alpha, alpha);
}
