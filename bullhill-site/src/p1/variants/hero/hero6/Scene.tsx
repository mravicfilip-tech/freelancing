// The lazy chunk for hero 6. Imports three.js, react three fiber and the scene, so heroes 1 to 5
// never load it. One camera, two scenes, drawn with the scissor test. The left half is the
// schematic, the right the render, split at `seam`, a fraction of the canvas width, 0.5 by default.
// 0 is all render, 1 is all schematic. Beat 4 drives it from the scroll.

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CAMS, VIEWS, type View } from './geometry';
import { Specimen } from './Render';
import { buildSchematic } from './Schematic';

function Dual({ view, seam, onReady }: { view: View; seam: number; onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const cam = CAMS[view];
  const dpr = gl.getPixelRatio();
  const schem = useMemo(() => buildSchematic(dpr, view === 'tall' ? 0.65 : view === 'mid' ? 0.85 : 1, view === 'tall'), [dpr, view]);
  const done = useRef(false);

  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 1;
    camera.far = 120;
    camera.lookAt(...cam.target);
    camera.updateProjectionMatrix();
  }, [camera, cam, size.width, size.height]);

  useFrame(({ scene }) => {
    const bw = Math.round(size.width * dpr);
    const bh = Math.round(size.height * dpr);
    const sx = Math.floor(bw * Math.min(1, Math.max(0, seam)));
    const eps = 0.001;
    schem.setResolution(bw, bh);
    gl.setClearColor(0x000000, 0);
    gl.setScissorTest(true);
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, (sx + eps) / dpr, size.height);
    gl.clear();
    gl.render(schem.scene, camera);
    gl.setScissor((sx + eps) / dpr, 0, (bw - sx) / dpr, size.height);
    gl.clear();
    gl.render(scene, camera);
    gl.setScissorTest(false);
    if (!done.current) {
      done.current = true;
      // read one pixel back, so the flag means the frame is really drawn
      const ctx = gl.getContext();
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      document.documentElement.dataset.h6 = 'ready';
      onReady();
      // draw once more a moment later, some compositors only present the second frame
      window.setTimeout(() => invalidate(), 800);
    }
  }, 1);
  return null;
}

export default function Scene({ view, still, seam = 0.5, onReady }: { view: View; still?: boolean; seam?: number; onReady: () => void }) {
  const cam = CAMS[view];
  return (
    <Canvas
      frameloop="demand"
      shadows="soft"
      dpr={still ? 2 : [1, 1.5]}
      camera={{ position: cam.pos, fov: VIEWS[view].fov, near: 1, far: 120 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: !!still, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Specimen view={view} />
      <Dual view={view} seam={seam} onReady={onReady} />
    </Canvas>
  );
}
