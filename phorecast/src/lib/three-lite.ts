// The slice of Three.js the bento card shaders need, re-exported by name.
//
// `await import('three')` pulls the whole library: a dynamic namespace import
// gives the bundler no way to know which members are used, so it emits all of
// it as one chunk — 708 KB for a few decorative halftone layers. Importing this
// module instead keeps the call lazy while letting the named re-exports be
// tree-shaken, because every member is statically known here.
export {
  Camera,
  Color,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
