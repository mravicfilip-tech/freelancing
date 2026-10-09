// Grad for storyline 2, the variant 4 low poly miniature carrying the whole story in one Canvas. The Ekotehnika
// yard, the S path, the warehouse and its aisle, then a dark blueprint stage, the rental grid and the robot floor.
// Every position is a function of the scroll position in story pixels (clock.pos), so a frozen shot draws the
// same frame the live scroll does.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps, StoryClock } from '../../clock';
import { C } from '../../../tokens';
import { blackOut, camAt, lerp, regionAt, seg, smooth, type Region } from './choreo';
import { heroX, Hero } from './hero';
import { Site } from './site';
import { Warehouse } from './warehouse';
import { BlueprintStage } from './blueprint';
import { GridStage, Wipe } from './rental';
import { BotsStage } from './bots';

const rad = THREE.MathUtils.degToRad;
const GROUND: Record<Region, string> = { site: C.hoverLightGrey, bp: C.ink, grid: C.lightGrey, bots: C.ink };

function Rig({ clock }: { clock: StoryClock }) {
  const { camera, size, scene } = useThree();
  const light = useRef<THREE.DirectionalLight>(null);
  const fog = useMemo(() => new THREE.Fog(C.hoverLightGrey, 150, 600), []);
  const bg = useMemo(() => new THREE.Color(C.hoverLightGrey), []);
  scene.fog = fog;
  scene.background = bg;
  const tgt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const pos = clock.pos.current;
    const region = regionAt(pos);
    const p = camAt(pos, region);
    const fx = region === 'site' ? heroX(pos) : 0;
    tgt.set(p.t[0] + fx, p.t[1], p.t[2]);
    const yaw = rad(p.yaw);
    const el = rad(p.el);
    cam.position.set(tgt.x + Math.sin(yaw) * Math.cos(el) * p.d, tgt.y + Math.sin(el) * p.d, tgt.z + Math.cos(yaw) * Math.cos(el) * p.d);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(-el, yaw, 0);
    cam.fov = p.fov;
    cam.near = THREE.MathUtils.clamp(p.d * 0.04, 0.04, 3);
    cam.far = 2600;
    cam.setViewOffset(size.width, size.height, -size.width * (p.ox - 0.5), -size.height * (p.oy - 0.5), size.width, size.height);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    // the ground colour, and the fog that fades the far miniature into it
    bg.set(GROUND[region]);
    fog.color.set(GROUND[region]);
    if (region === 'site') {
      fog.near = p.d * 1.05;
      fog.far = p.d * 3.6 + 120;
    } else {
      fog.near = 1e5;
      fog.far = 2e5;
    }

    // the key light follows what the camera looks at, high and steep once the hall is open
    const inside = smooth(seg(pos, 5300, 5900));
    const L = light.current;
    if (L) {
      L.position.set(tgt.x + lerp(70, 36, inside), tgt.y + lerp(80, 95, inside), tgt.z + lerp(42, 26, inside));
      L.target.position.copy(tgt);
      L.target.updateMatrixWorld();
      const half = THREE.MathUtils.clamp(p.d * 0.42, 34, 120);
      const sc = L.shadow.camera;
      sc.left = -half;
      sc.right = half;
      sc.top = half;
      sc.bottom = -half;
      sc.near = 10;
      sc.far = 200 + half * 2;
      sc.updateProjectionMatrix();
    }
  });

  return (
    <directionalLight
      ref={light}
      intensity={7.5}
      color={C.white}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0006}
      shadow-normalBias={0.04}
      shadow-radius={4}
      shadow-intensity={0.6}
    />
  );
}

// Shows only the stage the camera is in, so the others cost nothing
function Stage({ clock, region, children }: { clock: StoryClock; region: Region; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = regionAt(clock.pos.current) === region;
  });
  return <group ref={g}>{children}</group>;
}

export default function Scene({ clock }: SceneProps) {
  const [ready, setReady] = useState(false);
  const veil = useRef<HTMLDivElement>(null);

  // the van decals draw text on a canvas, so the font has to be in before the world mounts
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.load('600 62px Geist').then(go, go);
    const id = window.setTimeout(go, 1800);
    return () => window.clearTimeout(id);
  }, []);

  // a still draws on demand, so give the baked models a few frames to land
  useEffect(() => {
    if (!clock.still) return;
    const ids = [500, 1500, 3000, 6000].map((ms) => window.setTimeout(() => invalidate(), ms));
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [clock.still, ready]);

  // the black of B and its fade into the blueprint, drawn over the canvas
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (veil.current) veil.current.style.opacity = String(blackOut(clock.pos.current));
      if (!clock.still) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [clock]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.hoverLightGrey, isolation: 'isolate' }} aria-hidden="true">
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        frameloop={clock.still ? 'demand' : 'always'}
        camera={{ position: [-110, 80, 80], fov: 26, near: 0.5, far: 2600 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
        }}
      >
        <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.07} />
        <hemisphereLight args={[C.white, C.lightGrey, 0.3]} />
        <Rig clock={clock} />
        {ready && (
          <Suspense fallback={null}>
            <Stage clock={clock} region="site">
              <Site />
              <Warehouse clock={clock} />
              <Hero clock={clock} />
            </Stage>
            <Stage clock={clock} region="bp">
              <BlueprintStage clock={clock} />
            </Stage>
            <Stage clock={clock} region="grid">
              <GridStage clock={clock} />
            </Stage>
            <Stage clock={clock} region="bots">
              <BotsStage clock={clock} />
            </Stage>
            <Wipe clock={clock} />
          </Suspense>
        )}
      </Canvas>
      <div ref={veil} style={{ position: 'absolute', inset: 0, background: C.ink, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
