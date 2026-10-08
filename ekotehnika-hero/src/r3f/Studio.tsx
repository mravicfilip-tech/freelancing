// The shared light rig that passed the model gate. Renderer ACES tone mapping, an HDRI from
// public/hdri for image based light, one soft shadow casting key light. No effects composer, it
// washed colours out in testing, glows are done with additive sprites (see Glow).
import { Environment } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export type Hdri = 'studio_small_03_1k' | 'venice_sunset_1k' | 'empty_warehouse_01_1k' | 'dikhololo_night_1k' | 'potsdamer_platz_1k';

export function Studio({
  hdri = 'studio_small_03_1k',
  env = 0.3,
  key = [-5, 9, 7],
  intensity = 3.4,
  shadowSize = 8,
  background = false,
}: {
  hdri?: Hdri;
  env?: number;
  key?: [number, number, number];
  intensity?: number;
  shadowSize?: number;
  background?: boolean;
}) {
  return (
    <>
      <Environment files={`/hdri/${hdri}.hdr`} environmentIntensity={env} background={background} />
      <directionalLight
        position={key}
        intensity={intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-bias={-0.0004}
      />
    </>
  );
}

// A soft additive glow sprite, for rim light, beams, lamps and the globe atmosphere.
export function Glow({ colour, size = 1, opacity = 1, ...rest }: { colour: string; size?: number; opacity?: number } & Record<string, unknown>) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <sprite scale={[size, size, 1]} {...rest}>
      <spriteMaterial map={tex} color={colour} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
