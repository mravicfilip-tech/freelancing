// Sistem, the 3D studio telling storyline 2. One R3F canvas, dpr capped at 1.5. The real Linde forklift in a bright
// white and grey site (low poly trees, hedges, lamp posts, the company building, vans), the yard from above, the
// warehouse as a lit model with racks and wrapped pallets, a precise side elevation schematic of the X50 on the dark
// servis ground, a steel fork tine, the Najam warehouse, the rental depot floor and the automation floor with robots at true scale on system
// routes. Every pose is a pure function of the story clock, so a frozen clock (?at=<beat>&k=<0 to 1>) always draws the
// same picture. The one exception is the build in on load (props.tsx), timed from the first frame, which a frozen clock
// and reduced motion skip.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { track } from '../../../story/scenes/sistem/tracks';
import type { SceneProps } from '../../clock';
import Schematic from './schematic';
import { Dust, Lights, Rig, type CamState } from './camera';
import Grid, { Depot } from './grid';
import Najam from './najam';
import { WAREHOUSE } from '../../timeline';
import { SPEC, Truck, type TruckApi } from './models';
import { GROUND, uOf } from './kit';
import Outdoor from './outdoor';
import { introClock } from './props';
import Overlay from './overlay';
import Aisle from './aisle';
import { routeAt, truckS } from './route';
import Warehouse from './warehouse';

// Forks low while driving, raised in front of the building and set down again for the road.
const HERO_LIFT = track([[0, 0.12], [1.6, 0.12], [2.15, 1.55], [2.85, 1.55], [3.25, 0.15], [12, 0.15]]);

// The EKOTEHNIKA wordmark from public/brand/ekotehnika.svg, the file itself drawn into a texture exactly as supplied,
// its red mark included, never redrawn or recoloured. It prints dark on the light carton.
const MARK_W = 0.7;
const MARK_H = (MARK_W * 33.75) / 164.76;
function useWordmark() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let off = false;
    fetch('/brand/ekotehnika.svg')
      .then((r) => r.text())
      .then((svg) => {
        const w = 1024;
        const h = Math.round((w * 33.75) / 164.76);
        const img = new Image();
        img.onload = () => {
          if (off) return;
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d')!.drawImage(img, 0, 0, w, h);
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          setTex(t);
          invalidate();
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `));
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [invalidate]);
  return tex;
}

// The wordmark printed on both long faces of the carton on the hero's pallet, high on the face above the bin label, in
// the pallet's own frame (Pallet in r3f/Forklift.tsx, carton 1.08 by 0.78 by 0.86 from 0.14 up).
function CartonMarks({ tex }: { tex: THREE.Texture }) {
  const mat = useRef(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })).current;
  mat.map = tex;
  mat.needsUpdate = true;
  return (
    <>
      <mesh position={[0, 0.8, 0.4345]} material={mat}>
        <planeGeometry args={[MARK_W, MARK_H]} />
      </mesh>
      <mesh position={[0, 0.8, -0.4345]} rotation={[0, Math.PI, 0]} material={mat}>
        <planeGeometry args={[MARK_W, MARK_H]} />
      </mesh>
    </>
  );
}

// On load the forklift drives into its hero place along the road once its model is ready, and comes to rest. Metres it
// starts back along the road, and the seconds the drive takes.
const DRIVE_IN = 16;
const DRIVE_S = 1.7;

function Hero({ clock }: SceneProps) {
  const g = useRef<THREE.Group>(null);
  const marks = useRef<THREE.Group>(null);
  const api = useRef<TruckApi | null>(null);
  const readyAt = useRef(-1);
  const tex = useWordmark();
  const load = SPEC.x50.load!;
  useFrame(() => {
    const u = uOf(clock);
    const t = introClock();
    let back = 0;
    if (t !== Infinity) {
      if (readyAt.current < 0) readyAt.current = Math.max(t, 0.45);
      const e = Math.min(1, Math.max(0, (t - readyAt.current) / DRIVE_S));
      back = DRIVE_IN * Math.pow(1 - e, 3);
    }
    const rp = routeAt(truckS(clock.pos.current) - back);
    if (!g.current) return;
    g.current.visible = u < 7;
    g.current.position.set(rp.x, 0, rp.z);
    g.current.rotation.y = rp.yaw;
    const lift = HERO_LIFT(u);
    api.current?.set(lift, rp.s);
    if (marks.current) marks.current.position.set(load[0], load[1] + lift, load[2]);
  });
  return (
    <group ref={g}>
      <Truck name="x50" apiRef={api} load>
        <group ref={marks}>{tex && <CartonMarks tex={tex} />}</group>
      </Truck>
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
      {need(0, 7) && (
        <Place clock={clock} from={0} to={7.05}>
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
        <Place clock={clock} from={11.5} to={15.1}>
          <Depot clock={clock} />
        </Place>
      )}
      {/* Najam 0 is production's, the grid of forklifts from the cut under the L curtain to the end of T. Najam 1 to 3 are the warehouse of
          najam.tsx to the end of N, and the grid set is T's alone, from u 13 */}
      {WAREHOUSE ? (
        <>
          {need(11, 12) && (
            <Place clock={clock} from={11.5} to={13.0}>
              <Najam clock={clock} />
            </Place>
          )}
          {need(13, 13) && (
            <Place clock={clock} from={13.0} to={14.0}>
              <Grid clock={clock} />
            </Place>
          )}
        </>
      ) : (
        need(11, 13) && (
          <Place clock={clock} from={11.5} to={14.0}>
            <Grid clock={clock} />
          </Place>
        )
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
