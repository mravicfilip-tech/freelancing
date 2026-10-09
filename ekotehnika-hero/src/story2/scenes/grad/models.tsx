// Small models the shared kit does not have. The service van, a robot (AGV) and a carton.
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { C } from '../../../tokens';
import { W, withAO } from '../../../variants/v4/look';

const vanPaint = withAO(new THREE.MeshPhysicalMaterial({ color: C.white, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 }), 1.0, 0.7);
const vanBlack = withAO(new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.6 }), 1.0, 0.6);
const vanGlass = new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.05, clearcoat: 1, envMapIntensity: 2 });
const vanChrome = new THREE.MeshStandardMaterial({ color: C.shadeGrey, roughness: 0.25, metalness: 0.9 });

// The company name on the van side, ink letters on the white body, Geist
let sideTex: THREE.CanvasTexture | null = null;
function sideTexture() {
  if (sideTex) return sideTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = C.ink;
  g.font = '600 62px Geist, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('EKOTEHNIKA', 256, 50);
  sideTex = new THREE.CanvasTexture(c);
  sideTex.colorSpace = THREE.SRGBColorSpace;
  sideTex.anisotropy = 4;
  return sideTex;
}
let sideMat: THREE.MeshStandardMaterial | null = null;
const side = () => (sideMat ??= new THREE.MeshStandardMaterial({ map: sideTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }));

// A white service van about 6 m long, nose along +x, wheels on y = 0
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
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.75, 1.62, s * 1.058]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={side()}>
          <planeGeometry args={[3.4, 0.64]} />
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

/* ------------------------------------------------------------------ the robot */

const botBody = withAO(new THREE.MeshStandardMaterial({ color: C.textGrey, roughness: 0.45, metalness: 0.2 }), 0.4, 0.7);
const botTop = withAO(new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.5 }), 0.4, 0.7);
// red only on the shell edge of a Linde truck
const botEdge = new THREE.MeshPhysicalMaterial({ color: C.lindeRed, roughness: 0.32, clearcoat: 0.7 });
const botLight = new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 1.4 });

// A low Linde style AGV, 1.3 by 0.9 m and 0.28 tall, a rounded body with a red edge and a round lift plate. Nose along +x.
export function BotModel() {
  return (
    <group>
      <RoundedBox args={[1.32, 0.12, 0.92]} radius={0.06} smoothness={3} position={[0, 0.08, 0]} material={botEdge} castShadow />
      <RoundedBox args={[1.24, 0.17, 0.84]} radius={0.07} smoothness={3} position={[0, 0.19, 0]} material={botBody} castShadow />
      <mesh position={[0, 0.285, 0]} material={botTop} castShadow>
        <cylinderGeometry args={[0.31, 0.33, 0.045, 28]} />
      </mesh>
      <mesh position={[0, 0.31, 0]} material={botBody}>
        <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
      </mesh>
      <mesh position={[0.64, 0.17, 0]} material={botLight}>
        <boxGeometry args={[0.04, 0.05, 0.4]} />
      </mesh>
      <mesh position={[-0.64, 0.17, 0.2]} material={botTop}>
        <boxGeometry args={[0.04, 0.07, 0.12]} />
      </mesh>
    </group>
  );
}

// A taped carton, bottom at the origin, 0.7 by 0.5 and 0.42 tall
export function CartonModel() {
  return (
    <group>
      <RoundedBox args={[0.7, 0.42, 0.5]} radius={0.015} smoothness={2} position={[0, 0.21, 0]} material={W.carton} castShadow />
      <mesh position={[0, 0.21, 0]} material={W.tape}>
        <boxGeometry args={[0.1, 0.425, 0.505]} />
      </mesh>
    </group>
  );
}
