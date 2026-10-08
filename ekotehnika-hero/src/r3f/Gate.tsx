// The model gate. One lit forklift on a light floor in the Emons look, to judge the shared model
// before any variant builds on it. Open with ?gate=1.
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Forklift, Pallet } from './Forklift';
import { C } from '../tokens';

export function Gate() {
  const q = new URLSearchParams(window.location.search);
  const fx = q.get('fx') ?? 'none';
  const env = Number(q.get('env') ?? 0.35);
  return (
    <div style={{ height: '100vh', background: C.hoverLightGrey }}>
      <Canvas shadows="soft" dpr={[1, 1.5]} camera={{ position: [5.2, 3.4, 6.2], fov: 30 }} gl={{ antialias: false }}>
        <color attach="background" args={[C.hoverLightGrey]} />
        <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={env} />
        <directionalLight position={[-5, 9, 7]} intensity={3.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0004} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <meshStandardMaterial color={C.lightGrey} roughness={1} />
          <planeGeometry args={[60, 60]} />
        </mesh>
        <ContactShadows position={[0, 0.005, 0]} scale={24} resolution={1024} blur={2.6} opacity={0.55} far={4} color="#222222" />
        <Forklift lift={0.55} position={[0, 0, 0]} rotation={[0, 0.0, 0]}>
          <Pallet position={[1.74, 0.05, 0]} />
        </Forklift>
        <Pallet position={[3.6, 0, -1.6]} rotation={[0, 0.3, 0]} />
        <Forklift position={[-3.2, 0, -3.4]} rotation={[0, 0.9, 0]} />
        <OrbitControls target={[0.2, 0.9, 0]} />
        {fx !== 'none' && (
          <EffectComposer multisampling={0}>
            {fx === 'full' || fx === 'ao' ? <N8AO aoRadius={1.1} intensity={3.5} distanceFalloff={1} quality="high" /> : <></>}
            {fx === 'full' ? <Bloom luminanceThreshold={1} intensity={0.4} mipmapBlur /> : <></>}
            {fx === 'tm' || fx === 'full' || fx === 'ao' ? <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /> : <></>}
            <SMAA />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
