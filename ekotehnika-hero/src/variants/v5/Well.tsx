// A small live render of the forklift for each card's image well. One canvas per well, drawn only
// while the white panel is on screen.
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Forklift, Pallet, setPose, type ForkliftApi } from '../../r3f/Forklift';
import { M } from '../../r3f/materials';
import { Glow } from '../../r3f/Studio';
import { C } from '../../tokens';
import type { PillarId } from '../../content';

type Kind = Extract<PillarId, 'novi' | 'najam' | 'servis'>;

const CAMS: Record<Kind, { pos: [number, number, number]; tgt: [number, number, number]; fov: number }> = {
  novi: { pos: [5.0, 2.4, 5.6], tgt: [0.3, 0.95, 0], fov: 26 },
  najam: { pos: [1.2, 1.5, 8.6], tgt: [0.4, 0.9, 0], fov: 25 },
  servis: { pos: [5.6, 2.3, 4.4], tgt: [0.5, 1.15, 0], fov: 30 },
};

function Rig({ kind, still }: { kind: Kind; still: boolean }) {
  const api = useRef<ForkliftApi | null>(null);
  const turn = useRef<THREE.Group>(null);
  const floor = useRef<THREE.Group>(null);
  useFrame(({ camera, clock }) => {
    const c = CAMS[kind];
    camera.position.set(...c.pos);
    camera.lookAt(...c.tgt);
    const t = still ? 2 : clock.elapsedTime;
    if (kind === 'novi' && turn.current) turn.current.rotation.y = -0.45 + Math.sin(t * 0.32) * 0.65;
    if (kind === 'najam') {
      setPose(api.current, { lift: 0.25, roll: t * 1.4 });
      if (floor.current) floor.current.position.x = -((t * 1.4) % 2);
    }
    if (kind === 'servis') {
      setPose(api.current, { lift: 0.15 + (0.5 - 0.5 * Math.cos(t * 0.9)) * 1.1 });
      if (turn.current) turn.current.rotation.y = 0.35 + Math.sin(t * 0.35) * 0.3;
    }
  });
  return (
    <>
      <group ref={floor}>
        {kind === 'najam' &&
          Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[-10 + i * 2, 0.003, 1.15]} rotation-x={-Math.PI / 2} material={M.white}>
              <planeGeometry args={[1.0, 0.08]} />
            </mesh>
          ))}
      </group>
      <group ref={turn}>
        <Forklift apiRef={api} lift={0.25}>
          {kind !== 'servis' && <Pallet position={[1.74, 0.05, 0]} />}
        </Forklift>
        {kind === 'servis' && (
          <>
            <RoundedBox args={[0.5, 0.36, 0.36]} radius={0.04} position={[-1.9, 0.18, 0.9]} material={M.paint} castShadow />
            <RoundedBox args={[0.5, 0.06, 0.36]} radius={0.02} position={[-1.9, 0.39, 0.9]} material={M.black} castShadow />
            <Glow colour={C.tonedRed} size={0.5} opacity={0.6} position={[-0.55, 2.33, 0.42]} />
          </>
        )}
      </group>
    </>
  );
}

export function Well({ kind, active, still }: { kind: Kind; active: boolean; still: boolean }) {
  const c = CAMS[kind];
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      frameloop={active && !still ? 'always' : 'demand'}
      camera={{ position: c.pos, fov: c.fov }}
      gl={{ antialias: true }}
      aria-hidden="true"
    >
      <color attach="background" args={[C.hoverLightGrey]} />
      <fog attach="fog" args={[C.hoverLightGrey, 9, 20]} />
      <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.42} />
      <directionalLight
        position={[-4, 8, 6]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={C.lightGrey} roughness={0.95} />
      </mesh>
      <Rig kind={kind} still={still} />
    </Canvas>
  );
}
