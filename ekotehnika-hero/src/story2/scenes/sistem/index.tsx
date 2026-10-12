// Sistem, the 3D studio telling storyline 2. One R3F canvas, dpr capped at 1.5. The real Linde forklift in a bright
// white and grey site (low poly trees, hedges, lamp posts, the company building, vans), the yard from above, the
// warehouse as a lit model with racks and wrapped pallets, a precise side elevation schematic of the X50 on the dark
// servis ground, a steel fork tine, the rental depot floor and the automation floor with robots at true scale on system
// routes. Every pose is a pure function of the story clock, so a frozen clock (?at=<beat>&k=<0 to 1>) always draws the
// same picture.
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { track } from '../../../story/scenes/sistem/tracks';
import type { SceneProps } from '../../clock';
import Schematic from './schematic';
import { Dust, Lights, Rig, type CamState } from './camera';
import Grid, { Depot } from './grid';
import { Truck, type TruckApi } from './models';
import { GROUND, uOf } from './kit';
import Outdoor from './outdoor';
import Overlay from './overlay';
import Aisle from './aisle';
import { routeAt, truckS } from './route';
import Warehouse from './warehouse';

// Forks low while driving, raised in front of the building and set down again for the road.
const HERO_LIFT = track([[0, 0.12], [1.6, 0.12], [2.15, 1.55], [2.85, 1.55], [3.25, 0.15], [12, 0.15]]);

function Hero({ clock }: SceneProps) {
  const g = useRef<THREE.Group>(null);
  const api = useRef<TruckApi | null>(null);
  useFrame(() => {
    const u = uOf(clock);
    const rp = routeAt(truckS(clock.pos.current));
    if (!g.current) return;
    g.current.visible = u < 7;
    g.current.position.set(rp.x, 0, rp.z);
    g.current.rotation.y = rp.yaw;
    api.current?.set(HERO_LIFT(u), rp.s);
  });
  return (
    <group ref={g}>
      <Truck name="x50" apiRef={api} load />
    </group>
  );
}

// Shows its children only while the story is inside a stretch of u, so far away places never draw or show at a horizon.
function Place({ clock, from, to, children }: SceneProps & { from: number; to: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const u = uOf(clock);
    if (g.current) g.current.visible = u >= from && u < to;
  });
  return (
    <group ref={g}>
      <Suspense fallback={null}>{children}</Suspense>
    </group>
  );
}

function World({ clock }: SceneProps) {
  const state = useRef<CamState>({ target: new THREE.Vector3(), d: 12, shadow: 10 });
  const invalidate = useThree((s) => s.invalidate);
  const b = clock.beat.current;
  const need = (a: number, z: number) => !clock.still || (b >= a && b <= z);

  // A frozen clock draws on demand, so ask for a few frames while fonts, the environment and the bake arrive.
  useEffect(() => {
    if (!clock.still) return;
    const ids = [400, 2500].map((ms) => window.setTimeout(invalidate, ms));
    return () => ids.forEach(clearTimeout);
  }, [clock, invalidate]);

  return (
    <>
      <color attach="background" args={[GROUND]} />
      <fog attach="fog" args={[GROUND, 40, 160]} />
      <Environment files="/hdri/studio_small_03_1k.hdr" />
      <Rig clock={clock} state={state} />
      <Lights clock={clock} state={state} />
      <Dust clock={clock} state={state} />
      {need(0, 9) && (
        <Place clock={clock} from={0} to={7.4}>
          <Outdoor clock={clock} />
        </Place>
      )}
      {need(0, 7) && (
        <Suspense fallback={null}>
          <Hero clock={clock} />
        </Suspense>
      )}
      {need(5, 9) && (
        <Place clock={clock} from={4.8} to={10.1}>
          <Warehouse clock={clock} />
        </Place>
      )}
      {need(10, 11) && (
        <Place clock={clock} from={9.95} to={12.0}>
          <Schematic clock={clock} />
        </Place>
      )}
      {need(11, 14) && (
        <Place clock={clock} from={11.85} to={15.1}>
          <Depot clock={clock} />
        </Place>
      )}
      {need(11, 13) && (
        <Place clock={clock} from={11.85} to={14.0}>
          <Grid clock={clock} />
        </Place>
      )}
      {need(12, 14) && (
        <Place clock={clock} from={12.9} to={15.1}>
          <Aisle clock={clock} />
        </Place>
      )}
      <Overlay clock={clock} />
    </>
  );
}

export default function Scene({ clock }: SceneProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: GROUND }} aria-hidden="true">
      <Canvas shadows="soft" dpr={[1, 1.5]} frameloop={clock.still ? 'demand' : 'always'} camera={{ fov: 28, near: 0.1, far: 280, position: [0, 2, 12] }} gl={{ antialias: true }}>
        <World clock={clock} />
      </Canvas>
    </div>
  );
}
