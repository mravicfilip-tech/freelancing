precision highp float;

uniform vec3  uColor;
uniform float uOpacity;
uniform float uBackFade;   // opacity multiplier when fully behind the sphere
uniform float uRadius;     // sphere radius, for scale-independent fade

varying float vDepth;

void main() {
  float behind = smoothstep(0.15 * uRadius, -0.55 * uRadius, vDepth);
  float a = uOpacity * mix(1.0, uBackFade, behind);
  gl_FragColor = vec4(uColor, a);
}
