// Camera-facing quad. `uSize` is the quad's world-space width, `uAspect` = height / width.
uniform float uSize;
uniform float uAspect;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  centre.xy += vec2(position.x * uSize, position.y * uSize * uAspect);
  gl_Position = projectionMatrix * centre;
}
