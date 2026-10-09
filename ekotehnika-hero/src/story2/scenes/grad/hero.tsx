// The outdoor Linde X50 of H to R. It follows the drive route, the wheels turn with the distance driven, and it
// carries a taped pallet that rides on the forks, up at the stop in front of the building. After Z it stays at
// the warehouse door.
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Pallet } from '../../../r3f/Forklift';
import type { StoryClock } from '../../clock';
import { driven, outLift, routeAt } from './choreo';
import { useTruck } from './trucks';

export function Hero({ clock }: { clock: StoryClock }) {
  const t = useTruck('x50');
  const g = useRef<THREE.Group>(null);
  const load = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    g.current?.add(t.root);
    return () => {
      t.root.removeFromParent();
    };
  }, [t]);
  useFrame(() => {
    const pos = clock.pos.current;
    const s = driven(pos);
    const p = routeAt(s);
    const lift = outLift(pos) - 0.35;
    if (g.current) {
      g.current.position.set(p.x, 0.02, p.z);
      g.current.rotation.set(0, p.yaw, 0);
      g.current.visible = pos < 5700;
    }
    t.roll(s);
    t.setLift(lift);
    if (load.current) load.current.position.set(t.tip - 0.7, 0.12 + lift, 0);
  });
  return (
    <group ref={g}>
      <group ref={load}>
        <Pallet />
      </group>
    </group>
  );
}

// The x of the outdoor truck, for the camera
export const heroX = (pos: number) => routeAt(driven(pos)).x;
