// S, the dark servis stage. The X50 drawn as a precise schematic (see schematic.tsx), standing still while its tyres
// turn. A few faint diagonal lines slide across the scene half behind it so the truck seems to drive. The lines are cut square to
// columns 5 to 12 between the two rules, they never cross the text columns or the top row.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoryClock } from '../../clock';
import { BP_Z, T, lift } from './choreo';
import { colEdge } from './look';
import { ScreenSpace } from './screen';
import Schematic from './schematic';

/* ------------------------------------------------------------------ the diagonal lines */

const ANG = THREE.MathUtils.degToRad(40);
const NORM = new THREE.Vector2(-Math.sin(ANG), Math.cos(ANG));
const SP = 0.37;
const WEIGHT = [1, 2]; // px, a 2px line every fourth
const ALPHA = [0.16, 0.3];
const CENTRE = new THREE.Vector2(0.32, 0.0);
const N_LINES = 14;

export function Streaks({ clock, strength, rise }: { clock: StoryClock; strength: (pos: number) => number; rise: (pos: number) => number }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  // each line is one sheet of white that is cut square to the scene cell in page pixels, columns 5 to 12 between the two rules
  const rect = useMemo(() => new THREE.Vector4(), []);
  const mats = useMemo(
    () =>
      Array.from(
        { length: N_LINES },
        () =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            uniforms: { uA: { value: 0 }, uRect: { value: rect }, uRes: { value: new THREE.Vector2(1, 1) } },
            vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: `
              uniform float uA; uniform vec4 uRect; uniform vec2 uRes;
              void main() {
                vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
                if (p.x < uRect.x || p.x > uRect.z || p.y < uRect.y || p.y > uRect.w) discard;
                float a = uA;
                gl_FragColor = vec4(vec3(1.0), a);
              }`,
          }),
      ),
    [rect],
  );
  const geo = useMemo(() => new THREE.PlaneGeometry(6, 1), []);
  useFrame(() => {
    const k = gl.getPixelRatio();
    const x0 = colEdge(size.width, 5);
    // between the top rule (136px) and the bottom rule, 65px up from the bottom edge, inside the right margin
    rect.set(x0 * k, 136 * k, (size.width - 48) * k, (size.height - 65) * k);
    const pos = clock.pos.current;
    const off = (pos - T.S.start) * 0.0006;
    const base = NORM.dot(CENTRE);
    const s = strength(pos);
    const up = rise(pos);
    for (let i = 0; i < N_LINES; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      // lines sit at q = (i - 6.5 + 0.5) * SP, slid by off, wrapped over the span, which is far wider than the scene cell
      const span = N_LINES * SP;
      let q = (i - N_LINES / 2 + 0.5) * SP - off;
      q = ((((q + span / 2) % span) + span) % span) - span / 2;
      const p = base + q;
      m.position.set(CENTRE.x + NORM.x * (p - base), CENTRE.y + NORM.y * (p - base) + up, 0);
      m.rotation.z = ANG;
      const heavy = i % 4 === 0 ? 1 : 0;
      m.scale.y = WEIGHT[heavy] / size.height;
      mats[i].uniforms.uRes.value.set(size.width * k, size.height * k);
      mats[i].uniforms.uA.value = ALPHA[heavy] * s;
    }
  });
  // far behind the drawing, so the black fills of the truck hide them
  return (
    <ScreenSpace dist={60}>
      {mats.map((mat, i) => (
        <mesh key={i} ref={(m) => { meshes.current[i] = m; }} geometry={geo} material={mat} renderOrder={-4} />
      ))}
    </ScreenSpace>
  );
}

// Group that carries a stage off the top of the screen as the next section lifts. shift is in screens.
export function useLifted(clock: StoryClock, group: React.RefObject<THREE.Group | null>, base: [number, number, number], shift: (pos: number) => number, dist: number) {
  const up = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateMatrixWorld();
    up.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
    const hh = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const s = shift(clock.pos.current) * 2 * hh;
    g.position.set(base[0] + up.x * s, base[1] + up.y * s, base[2] + up.z * s);
  });
}

export function BlueprintStage({ clock }: { clock: StoryClock }) {
  const g = useRef<THREE.Group>(null);
  // as the lifter rises, the dark section is carried up out of the frame with it
  useLifted(clock, g, [0, 0, BP_Z], (pos) => (lift(pos) + 1.2) / 2, 13);
  return (
    <>
      <group ref={g}>
        <Schematic clock={clock} />
      </group>
      <Streaks clock={clock} strength={() => 1} rise={(pos) => (lift(pos) + 1.2) / 2} />
    </>
  );
}
