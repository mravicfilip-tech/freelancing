// The footer still, rendered once by scripts/render-footer-scene.mjs on the dev server and never part of the site build.
// The Ekotehnika site from the hero's own street set, the company building with its name, the hall, the gate house and
// a barrier, trees in their pits, the hedges and planters, kerbs and paving, and one X50 parked by the door. Seen low
// and side on like the hero, on the footer's pale grey ground (--grey-pale #e9e9e9). The ground only takes shadows, so
// the set stands on the footer colour itself. The page is opened with ?at=, which skips the build in.
import { Suspense, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { BUILDING_X } from '../../src/story2/scenes/sistem/route';
import { Building, FrontGarden, Greenery, Pavement } from '../../src/story2/scenes/sistem/outdoor';
import { Barrier, GateHouse } from '../../src/story2/scenes/sistem/yard';
import { Kerb, LampPost } from '../../src/story2/scenes/sistem/props';
import { Truck } from '../../src/story2/scenes/sistem/models';

const GROUND = '#e9e9e9';
export const W = 1824;
export const H = 300;
// Frame, the site from x 15 to 73 m, looking a little down so a sliver of the paving shows.
const TARGET = new THREE.Vector3(44, 3.98, -6);
const EYE = new THREE.Vector3(44, 8.98, 76);
// The near kerb's foot, the point the image stands on.
const FOOT = new THREE.Vector3(44, 0, -2.02);

function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    camera.position.copy(EYE);
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const p = FOOT.clone().project(camera);
    // css px of the kerb foot from the bottom edge, read by the render script
    (window as unknown as { footFromBottom: number }).footFromBottom = ((p.y + 1) / 2) * H;
    invalidate();
  }, [camera, invalidate]);
  return null;
}

function Site() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0, -20]} receiveShadow>
        <planeGeometry args={[400, 200]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <Kerb x0={-90} x1={78} z={-2.12} />
      <Pavement />
      <Building />
      <FrontGarden />
      <Greenery />
      <LampPost x={53} z={-2.9} h={4.1} />
      <LampPost x={30} z={-2.9} h={4.1} />
      <GateHouse x={67.5} z={-6.2} />
      <Barrier x={64.4} z={-3.3} />
      <Suspense fallback={null}>
        <Truck name="x50" position={[BUILDING_X + 8.6, 0, -6.4]} rotation={[0, Math.PI, 0]} />
      </Suspense>
    </>
  );
}

function App() {
  return (
    <div style={{ width: W, height: H, background: GROUND }}>
      <Canvas
        shadows="soft"
        dpr={2}
        frameloop="always"
        camera={{ fov: 6.7, near: 1, far: 400 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          (window as unknown as { glCanvas: HTMLCanvasElement }).glCanvas = gl.domElement;
        }}
      >
        <color attach="background" args={[GROUND]} />
        <fog attach="fog" args={[GROUND, 95, 190]} />
        <Environment files="/hdri/studio_small_03_1k.hdr" />
        <Rig />
        <directionalLight
          castShadow
          position={[44 - 25, 45, -6 + 35]}
          intensity={3}
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-camera-far={160}
          target-position={[44, 0, -6]}
        />
        <directionalLight position={[44 + 6, 4, -6 - 9]} intensity={0.5} />
        <hemisphereLight args={['#ffffff', GROUND, 1.1]} />
        <Site />
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
