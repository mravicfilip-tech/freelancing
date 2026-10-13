// Grad, the variant 4 isometric city carrying the four service story. One Canvas, the bright
// miniature of Ekotehnika in Vrčin, a camera that flies from beat to beat and the story props and
// trucks that tell Najam, Polovni, Novi and Servis. Grey everywhere, red only on a truck's rear shell.
// Every position is a function of the story time u, so any still clock draws a correct frame.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps } from '../../clock';
import { C } from '../../../tokens';
import { City } from './city';
import { Rig } from './camera';
import { KEYS } from './keys';
import { Story } from './story';
import { LabelLayer } from './portal';

export default function Scene({ clock }: SceneProps) {
  const [ready, setReady] = useState(false);

  // the van decals draw text on a canvas, so the font has to be in before the world mounts
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.load('800 64px Archivo').then(go, go);
    const id = window.setTimeout(go, 1800);
    return () => window.clearTimeout(id);
  }, []);

  // a still draws on demand, give the baked models a few frames to land
  useEffect(() => {
    if (!clock.still) return;
    const ids = [400, 1200, 2600].map((ms) => window.setTimeout(() => invalidate(), ms));
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [clock.still, ready]);

  const labels = useRef<HTMLDivElement>(null);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.hoverLightGrey, isolation: 'isolate' }} aria-hidden="true">
      <LabelLayer.Provider value={labels}>
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        frameloop={clock.still ? 'demand' : 'always'}
        camera={{ position: [-110, 80, 80], fov: 20, near: 3, far: 2200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
        }}
      >
        <color attach="background" args={[C.hoverLightGrey]} />
        <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.07} />
        <hemisphereLight args={[C.white, C.lightGrey, 0.3]} />
        <Rig clock={clock} keys={KEYS} />
        {ready && (
          <Suspense fallback={null}>
            <City reduced={clock.still} />
            <Story clock={clock} />
          </Suspense>
        )}
      </Canvas>
      </LabelLayer.Provider>
      <div ref={labels} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}
