// Camera-facing quad. `uSize` is the quad's world-space width; the mesh's own
// rotation and scale are ignored so it always faces the camera.
uniform float uSize;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  centre.xy += position.xy * uSize;
  gl_Position = projectionMatrix * centre;
}
