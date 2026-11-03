// Sistem, the 3D studio telling storyline 2. One R3F canvas, dpr capped at 1.25 and let down to 1 when the frame rate sags. The real Linde forklift in a bright
// white and grey site (low poly trees, hedges, lamp posts, the company building, vans), the yard from above, the
// warehouse as a lit model with racks and wrapped pallets, a precise side elevation schematic of the X50 on the dark
// servis ground, a steel fork tine, the Najam warehouse, the rental depot floor and the automation floor with robots at true scale on system
// routes. Every pose is a pure function of the story clock, so a frozen clock (?at=<beat>&k=<0 to 1>) always draws the
// same picture. The one exception is the build in on load (props.tsx), timed from the first frame, which a frozen clock
// and reduced motion skip.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, addEffect, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerformanceMonitor, useProgress } from '@react-three/drei';
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
import { CartonMarks, useWordmark } from './wordmark';
import { loader } from './loader';
import LoaderStage, { EnvReady, LoaderCargo, heroPost, heroPre, useStaged, type HeroIo } from './loaderscene';
import { DEBUG_FPS, perf } from '../../perf';
import { setAssets } from './intro';
import Overlay from './overlay';
import Aisle from './aisle';
import { routeAt, truckS } from './route';
import Warehouse from './warehouse';

// The models and textures the scene asks for, counted by three's loading manager, are passed to the preloader (intro.ts). The models
// start loading as this module loads, see models.tsx, so the counter is read from here and not from a component.
const feedAssets = (s: { progress: number; active: boolean; total: number; loaded: number }) => setAssets(s.progress, s.active, s.total, s.loaded);
feedAssets(useProgress.getState());
useProgress.subscribe(feedAssets);

// Forks low while driving, raised in front of the building and set down again for the road.
const HERO_LIFT = track([[0, 0.12], [1.6, 0.12], [2.15, 1.55], [2.85, 1.55], [3.25, 0.15], [12, 0.15]]);

// On load the forklift drives into its hero place along the road once its model is ready, and comes to rest. Metres it
// starts back along the road, and the seconds the drive takes.
const DRIVE_IN = 16;
const DRIVE_S = 1.7;

function Hero({ clock }: SceneProps) {
  const g = useRef<THREE.Group>(null);
  const marks = useRef<THREE.Group>(null);
  const cartonMarks = useRef<THREE.Group>(null);
  const api = useRef<TruckApi | null>(null);
  const readyAt = useRef(-1);
  const tex = useWordmark();
  const load = SPEC.x50.load!;
  const io = useRef<HeroIo>({ back: 0, lift: 0 }).current;
  // the X50 is the first of the first set, the preloader shows its scene once it is in (loader.ts)
  useEffect(() => {
    loader.x50 = true;
  }, []);
  useFrame(() => {
    const u = uOf(clock);
    const t = introClock();
    let back = 0;
    if (t !== Infinity) {
      if (readyAt.current < 0) readyAt.current = Math.max(t, 0.45);
      const e = Math.min(1, Math.max(0, (t - readyAt.current) / DRIVE_S));
      back = DRIVE_IN * Math.pow(1 - e, 3);
    }
    let lift = HERO_LIFT(u);
    // while a preloader plays the loader says how far back the truck stands and how high its forks are, see loaderscene.tsx
    io.back = back;
    io.lift = lift;
    const owned = heroPre(io);
    if (owned) {
      back = io.back;
      lift = io.lift;
    }
    const rp = routeAt(truckS(clock.pos.current) - back);
    if (!g.current) return;
    g.current.visible = u < 7;
    g.current.position.set(rp.x, 0, rp.z);
    g.current.rotation.y = rp.yaw;
    api.current?.set(lift, rp.s);
    if (marks.current) marks.current.position.set(load[0], load[1] + lift, load[2]);
    heroPost(api.current, marks.current, cartonMarks.current, rp.x, lift);
  });
  return (
    <group ref={g}>
      <Truck name="x50" apiRef={api} load>
        <group ref={marks}>
          <group ref={cartonMarks}>{tex && <CartonMarks tex={tex} />}</group>
          {loader.version > 0 && <LoaderCargo tex={tex} />}
        </group>
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
  // the later groups mount one after the other once a preloader's first set is in, see useStaged
  const later = useStaged();
  const need = (a: number, z: number, stage = 0) => (!clock.still || (b >= a && b <= z)) && later >= stage;

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
      <EnvReady />
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
      {loader.version > 0 && <LoaderStage />}
      {need(5, 9, 1) && (
        <Place clock={clock} from={4.8} to={10.1}>
          <Warehouse clock={clock} />
        </Place>
      )}
      {need(10, 11, 2) && (
        <Place clock={clock} from={9.95} to={12.0}>
          <Schematic clock={clock} />
        </Place>
      )}
      {need(11, 14, 3) && (
        <Place clock={clock} from={11.5} to={15.1}>
          <Depot clock={clock} />
        </Place>
      )}
      {/* Najam 0 is production's, the grid of forklifts from the cut under the L curtain to the end of T. Najam 2 is the warehouse of
          najam.tsx, from the cut on. It stays through AT, since its hall is the hall the automation aisle stands in, and the grid set is
          not shown in it at all */}
      {WAREHOUSE ? (
        need(11, 14, 3) && (
          <Place clock={clock} from={11.5} to={15.1}>
            <Najam clock={clock} />
          </Place>
        )
      ) : (
        need(11, 13, 3) && (
          <Place clock={clock} from={11.5} to={14.0}>
            <Grid clock={clock} />
          </Place>
        )
      )}
      {need(12, 14, 4) && (
        <Place clock={clock} from={12.9} to={15.1}>
          <Aisle clock={clock} />
        </Place>
      )}
      <Overlay clock={clock} />
    </>
  );
}

// The renderer's side of ?debug=fps (story2/perf.ts). R3F runs the frame's effects first, then every useFrame callback, then the one
// gl.render call, so the gap from the effect to the call is the JS of the scene's useFrame work, and the call itself is the draw. After
// the draw the renderer's own counters give the calls and triangles of the frame, shadow pass included. Nothing is wrapped without the
// parameter. A frozen clock draws on demand, so with the parameter it also asks for a frame every frame, and a shot of one beat then
// measures the same work a scrolled page does there.
function Probe({ clock }: SceneProps) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!DEBUG_FPS) return;
    let from = 0;
    let id = 0;
    const again = () => {
      invalidate();
      id = requestAnimationFrame(again);
    };
    if (clock.still) id = requestAnimationFrame(again);
    const off = addEffect(() => {
      from = performance.now();
    });
    const draw = gl.render.bind(gl);
    gl.render = (scene, camera) => {
      const t = performance.now();
      if (from) perf.scene.add(t - from);
      draw(scene, camera);
      perf.draw.add(performance.now() - t);
      perf.calls = gl.info.render.calls;
      perf.tris = gl.info.render.triangles;
      perf.dpr = gl.getPixelRatio();
    };
    return () => {
      off();
      cancelAnimationFrame(id);
      gl.render = draw;
    };
  }, [gl, invalidate, clock]);
  return null;
}

// The key light's shadow map was 2048 by 2048, four times the pixels of the 1024 map that holds the same shadow over the 20 or so metres
// its frustum covers (camera.tsx sizes the frustum to the view), 1 to 2cm a texel. Round 7, Filip, "feels like 15 FPS". The light is
// resized here, once, where the renderer is set up, and its map is thrown away so three allocates the smaller one.
const SHADOW_MAP = 1024;
function Tune() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const fit = () =>
      scene.traverse((o) => {
        const l = o as THREE.DirectionalLight;
        if (l.isDirectionalLight && l.castShadow && l.shadow.mapSize.x > SHADOW_MAP) {
          l.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
          l.shadow.map?.dispose();
          l.shadow.map = null;
        }
      });
    fit();
    // a light that mounts a moment later is caught too
    const id = window.setTimeout(fit, 600);
    return () => window.clearTimeout(id);
  }, [scene]);
  return null;
}

// The device pixel ratio is capped at DPR_MAX, and drops to 1 when the frame rate sags (drei's PerformanceMonitor measures it, a decline
// lowers the cap, a lasting recovery lifts it, and after two flips it stays down). A 1.5 cap drew 2.25 times the pixels of 1.
const DPR_MAX = 1.25;

export default function Scene({ clock }: SceneProps) {
  const [cap, setCap] = useState(DPR_MAX);
  return (
    <div style={{ position: 'absolute', inset: 0, background: GROUND }} aria-hidden="true">
      <Canvas shadows="soft" dpr={[1, cap]} frameloop={clock.still ? 'demand' : 'always'} camera={{ fov: 28, near: 0.1, far: 280, position: [0, 2, 12] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <World clock={clock} />
        <Tune />
        {!clock.still && <PerformanceMonitor flipflops={2} onDecline={() => setCap(1)} onIncline={() => setCap(DPR_MAX)} onFallback={() => setCap(1)} />}
        <Probe clock={clock} />
      </Canvas>
    </div>
  );
}
