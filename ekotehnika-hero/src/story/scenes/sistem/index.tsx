// Sistem, the dark studio scene for the four service story. A lit Linde truck on a floor of light, with
// particles. One R3F Canvas, dpr capped at 1.5, the subject kept in the right 65 percent so the shell's
// left panel never covers it. The scene is a pure function of the story clock, so any still clock
// gives the right picture, see stage.ts.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Forklift, type ForkliftApi } from '../../../r3f/Forklift';
import type { SceneProps } from '../../clock';
import { Stage } from './stage';

function World({ clock }: SceneProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const stage = useMemo(() => new Stage(dpr), [dpr]);
  const hero = useRef<THREE.Group>(null);
  const heroLift = useRef<THREE.Group>(null);
  const heroApi = useRef<ForkliftApi | null>(null);
  const k1 = useRef<THREE.Group>(null);
  const k1Api = useRef<ForkliftApi | null>(null);

  useEffect(() => {
    gl.localClippingEnabled = true;
    let id = 0;
    let tries = 0;
    const go = () => {
      if (hero.current && heroLift.current && heroApi.current && k1.current && k1Api.current) {
        stage.attach({ hero: hero.current, heroLift: heroLift.current, heroApi: heroApi.current, k1: k1.current, k1Api: k1Api.current });
        invalidate();
      } else if (tries++ < 60) id = requestAnimationFrame(go);
    };
    id = requestAnimationFrame(go);
    return () => cancelAnimationFrame(id);
  }, [stage, gl, invalidate]);

  useEffect(() => () => stage.dispose(), [stage]);

  // A still clock draws on demand, so ask for a few frames while the font and the cloud arrive.
  useEffect(() => {
    if (!clock.still) return;
    const ids = [200, 600, 1500, 3000].map((ms) => window.setTimeout(invalidate, ms));
    return () => ids.forEach(clearTimeout);
  }, [clock, invalidate]);

  useFrame(({ camera, clock: c, size }) => {
    stage.update(clock.beat.current, clock.k.current, c.elapsedTime, camera as THREE.PerspectiveCamera, size.width, size.height, clock.still);
  });

  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      <fog attach="fog" args={['#0a0a0b', 34, 95]} />
      <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.2} />
      <primitive object={stage.root} />
      <group ref={hero}>
        <group ref={heroLift}>
          <Forklift apiRef={heroApi} lift={0.32} />
        </group>
      </group>
      <group ref={k1} visible={false}>
        <Forklift apiRef={k1Api} lift={0.32} />
      </group>
    </>
  );
}

export default function Scene({ clock }: SceneProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a0b' }} aria-hidden="true">
      <Canvas shadows="soft" dpr={[1, 1.5]} frameloop={clock.still ? 'demand' : 'always'} camera={{ fov: 28, near: 0.1, far: 240, position: [4, 3, 16] }} gl={{ antialias: true }}>
        <World clock={clock} />
      </Canvas>
    </div>
  );
}
