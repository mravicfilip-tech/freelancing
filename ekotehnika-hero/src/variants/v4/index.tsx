// Variant 4, Grad. The Emons hero 1:1 in Linde red. A bright soft lit miniature of Ekotehnika in
// Vrčin and a camera that flies stop to stop through the world on scroll. The scene is full bleed
// and the shared hero frame sits on top in ink, see src/ui/HeroFrame.tsx.
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from '../../scroll/useScrollStory';
import { HeroFrame } from '../../ui/HeroFrame';
import { Stage } from './Stage';
import './v4.css';

const LENGTH = 8000;
// dev only, the shot script renders in software at a frame or two a second, so it asks for the
// smoothing to settle at once
const SHOT = import.meta.env.DEV && new URLSearchParams(window.location.search).has('v4shot');

export default function Variant4({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: SHOT ? 0.45 : 0.06 });
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

  return (
    <section className="v4" ref={stageRef} aria-label="Ekotehnika, Linde viljuškari">
      <div className="v4-canvas" aria-hidden="true">
        <Canvas
          shadows="soft"
          dpr={[1, 1.5]}
          camera={{ position: [-110, 80, 80], fov: 20, near: 5, far: 2000 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl, scene }) => {
            // dev only, lets the shot script read draw calls and triangles
            if (import.meta.env.DEV) Object.assign(window, { __v4gl: gl, __v4scene: scene });
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.95;
          }}
        >
          {ready && <Stage progress={progress} reduced={reduced} />}
        </Canvas>
      </div>

      <div className="v4-veil" aria-hidden="true" />
      <div className="v4-veil-top" aria-hidden="true" />
      <HeroFrame tone="ink" />
    </section>
  );
}
