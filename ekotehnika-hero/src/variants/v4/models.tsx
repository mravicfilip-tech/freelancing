// Small models of the miniature that the shared kit does not have, the service van, the approved
// truck shield and the sign letters. Vans and shields are baked into instances by the world.
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../tokens';
import { W, vanSideTexture, withAO } from './look';
import { wordGeometry } from './letters';

const vanPaint = withAO(new THREE.MeshPhysicalMaterial({ color: C.textGrey, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }), 1.0, 0.6);
const vanBlack = withAO(new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.6 }), 1.0, 0.6);
const vanGlass = new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.05, clearcoat: 1, envMapIntensity: 2 });
const vanChrome = new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.25, metalness: 0.9 });

let sideMat: THREE.MeshStandardMaterial | null = null;
const side = () => (sideMat ??= new THREE.MeshStandardMaterial({ map: vanSideTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }));

// A text-grey service van, about 6 m long, nose along +x, wheels on y = 0.
export function VanModel() {
  return (
    <group>
      <RoundedBox args={[4.5, 2.25, 2.1]} radius={0.14} smoothness={3} position={[-0.75, 1.55, 0]} material={vanPaint} />
      <RoundedBox args={[1.55, 1.75, 2.06]} radius={0.3} smoothness={3} position={[2.2, 1.27, 0]} material={vanPaint} />
      <RoundedBox args={[0.8, 0.82, 2.0]} radius={0.22} smoothness={3} position={[2.78, 0.86, 0]} material={vanPaint} />
      <RoundedBox args={[0.7, 0.74, 1.9]} radius={0.12} smoothness={2} position={[2.55, 1.74, 0]} rotation={[0, 0, -0.42]} material={vanGlass} />
      <RoundedBox args={[0.78, 0.6, 2.09]} radius={0.08} smoothness={2} position={[2.12, 1.78, 0]} material={vanGlass} />
      <RoundedBox args={[0.3, 0.3, 2.12]} radius={0.08} position={[3.12, 0.55, 0]} material={vanBlack} />
      <RoundedBox args={[0.22, 0.28, 2.12]} radius={0.06} position={[-3.02, 0.6, 0]} material={vanBlack} />
      <mesh position={[-0.75, 0.62, 0]} material={vanBlack}>
        <boxGeometry args={[4.4, 0.3, 1.96]} />
      </mesh>
      <mesh position={[0.6, 0.5, 0]} material={vanBlack}>
        <boxGeometry args={[2.4, 0.3, 1.9]} />
      </mesh>
      <mesh position={[-0.7, 0.92, 0]} material={W.mark}>
        <boxGeometry args={[4.48, 0.1, 2.12]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.75, 1.72, s * 1.058]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={side()}>
          <planeGeometry args={[3.6, 0.68]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={`l${s}`} position={[3.2, 0.95, s * 0.72]} material={W.lamp}>
          <boxGeometry args={[0.06, 0.16, 0.36]} />
        </mesh>
      ))}
      {[2.15, -1.95].map((x) =>
        [0.94, -0.94].map((z) => (
          <group key={`${x}${z}`} position={[x, 0.42, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={vanBlack}>
              <cylinderGeometry args={[0.42, 0.42, 0.3, 24]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z > 0 ? 0.13 : -0.13]} material={vanChrome}>
              <cylinderGeometry args={[0.22, 0.22, 0.06, 18]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

// The Linde Approved Trucks mark in the scene, an ink shield with a white tick, upright, 1 m tall.
export function ShieldModel() {
  const { body, tick } = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.5);
    s.quadraticCurveTo(0.2, 0.42, 0.4, 0.4);
    s.lineTo(0.4, 0.02);
    s.quadraticCurveTo(0.38, -0.32, 0, -0.5);
    s.quadraticCurveTo(-0.38, -0.32, -0.4, 0.02);
    s.lineTo(-0.4, 0.4);
    s.quadraticCurveTo(-0.2, 0.42, 0, 0.5);
    const body = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 16 });
    body.translate(0, 0, -0.06);
    const t = new THREE.Shape();
    t.moveTo(-0.2, 0.02);
    t.lineTo(-0.06, -0.14);
    t.lineTo(0.22, 0.18);
    t.lineTo(0.16, 0.24);
    t.lineTo(-0.06, -0.02);
    t.lineTo(-0.14, 0.08);
    const tick = new THREE.ExtrudeGeometry(t, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 });
    return { body, tick };
  }, []);
  return (
    <group>
      <mesh geometry={body} material={vanBlack} />
      <mesh geometry={tick} position={[0, 0, 0.09]} material={W.letters} />
      <mesh geometry={tick} position={[0, 0, -0.09]} rotation={[0, Math.PI, 0]} material={W.letters} />
    </group>
  );
}

// The company name as extruded sign letters, cap height h, front toward +z.
export function SignWord({ word = 'EKOTEHNIKA', h = 2.4, ...rest }: { word?: string; h?: number } & Record<string, unknown>) {
  const geo = useMemo(() => wordGeometry(word).geo, [word]);
  return <mesh geometry={geo} scale={[h, h, h]} material={W.letters} castShadow {...rest} />;
}
