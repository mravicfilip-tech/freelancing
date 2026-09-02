precision highp float;

uniform vec3  uColor;
uniform float uOpacity;
uniform float uProgress;

varying float vFacing;

void main() {
  float a = uOpacity * smoothstep(-0.02, 0.45, vFacing) * uProgress;
  if (a <= 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
