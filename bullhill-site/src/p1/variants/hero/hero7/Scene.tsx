// The lazy chunk for hero 7. Imports three.js, react three fiber and the stage, so the other heroes
// never load it. One camera, one scene, one render pass. The plan and the render are the same
// ground, split in its own shader by a world x the machine carries, so nothing is drawn twice.
// frameloop stays "demand", a frame is asked for only when p changes or the canvas is resized, and the
// frame sets the machine, the ground, the spoil and the camera from p alone and then calls onFrame(p), so the step
// label moves in the same animation frame as the canvas. Pixel ratio is held to 1.5.

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Progress } from '../hero6/progress';
import { buildStage, type Stage } from './stage';
import { CAM, camAt, makeCam } from './world';

export type Drive = { progress: Progress; onFrame: (p: number) => void };

function Rig({ drive, onReady }: { drive: Drive; onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const stage = useRef<Stage | null>(null);
  const cam = useMemo(makeCam, []);
  const state = useRef({ drawn: 0, done: false });

  useLayoutEffect(() => {
    const st = buildStage(gl, gl.getPixelRatio());
    stage.current = st;
    // the shoots read the render cost from here, development only
    if (import.meta.env.DEV) (window as unknown as { __h7gl?: THREE.WebGLRenderer }).__h7gl = gl;
    scene.add(st.group);
    scene.environment = st.env;
    scene.environmentIntensity = 0.75;
    state.current = { drawn: 0, done: false };
    invalidate();
    return () => {
      scene.remove(st.group);
      scene.environment = null;
      st.dispose();
      stage.current = null;
    };
  }, [gl, scene, invalidate]);

  // a scroll tick asks for one frame, R3F draws it at most once per animation frame
  useEffect(() => drive.progress.subscribe(() => invalidate()), [drive, invalidate]);

  useFrame(() => {
    const st = stage.current;
    if (!st) return;
    const p = drive.progress.sample();
    st.update(p);
    camAt(p, cam);
    camera.position.set(cam.px, cam.py, cam.pz);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    drive.onFrame(p);
    const s = state.current;
    s.drawn++;
    if (s.drawn === 1) {
      // the first frame compiles the shaders, the next one is the first that is really on screen
      invalidate();
    } else if (!s.done) {
      s.done = true;
      // read one pixel back, so the flag means the frame is really drawn
      const ctx = gl.getContext();
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      document.documentElement.dataset.h7 = 'ready';
      onReady();
      // draw once more a moment later, some compositors only present the second frame
      window.setTimeout(() => invalidate(), 800);
    }
  });
  return null;
}

export default function Scene({ drive, onReady }: { drive: Drive; onReady: () => void }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [-10, 4, 8], fov: CAM.fov, near: 0.5, far: 140 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Rig drive={drive} onReady={onReady} />
    </Canvas>
  );
}
