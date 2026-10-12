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
import { G } from './look';
import { camAt, gridFit, lerp, regionAt, seg, smooth, strip, textCell, topBand, BAND, type Region } from './choreo';
import { heroX, Hero } from './hero';
import { Site } from './site';
import { Warehouse } from './warehouse';
import { BlueprintStage } from './blueprint';
import { GridStage, Wipe } from './rental';
import { BotsStage } from './bots';

const rad = THREE.MathUtils.degToRad;
const GROUND: Record<Region, string> = { site: C.hoverLightGrey, bp: C.ink, grid: C.lightGrey, bots: C.ink };

type Groups = { [R in Region]?: THREE.Group | null };

// The director owns the camera, the key light and the drawing. Almost always the world is drawn once, from the pose of the region
// the story is in. In T it is drawn twice, the rental depot above a hard edge and the automation hall below it, and the two views
// ride a strip that scrolls up one screen, so the hall pushes the depot off the top as one move. Each view is cut by the scissor,
// nothing blends.
function Director({ clock, groups }: { clock: StoryClock; groups: React.MutableRefObject<Groups> }) {
  const { camera, size, scene, gl } = useThree();
  const light = useRef<THREE.DirectionalLight>(null);
  const bg = useMemo(() => new THREE.Color(C.hoverLightGrey), []);
  scene.background = bg;
  const tgt = useMemo(() => new THREE.Vector3(), []);

  // the depot is fitted under the spec row of N, wherever the shell puts its bottom rule
  const specBottom = () => {
    const e = document.querySelector('.s2-n .n-row');
    const b = e ? e.getBoundingClientRect().bottom : 0;
    return b > 200 ? b + 24 : 524;
  };

  // one pass, the pose of a region with its content slid down by dy screens, drawn into the scissor rows y0 and h from the bottom
  const pass = (pos: number, region: Region, dy: number, y0: number, h: number | null) => {
    const cam = camera as THREE.PerspectiveCamera;
    (Object.keys(groups.current) as Region[]).forEach((r) => {
      const g = groups.current[r];
      if (g) g.visible = r === region;
    });
    const p = camAt(pos, region);
    if (region === 'grid') Object.assign(p, gridFit(size.width, size.height, specBottom()));
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
    cam.setViewOffset(size.width, size.height, -size.width * (p.ox - 0.5), -size.height * (p.oy - 0.5 + dy), size.width, size.height);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    // the ground colour of the region, nothing fades into it, every part of the world runs to the frame or ends at its own edge
    bg.set(GROUND[region]);

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
    if (h === null) gl.setScissorTest(false);
    else {
      gl.setScissorTest(true);
      gl.setScissor(0, y0, size.width, h);
    }
    gl.render(scene, camera);
  };

  // priority 1 takes over the drawing from the default loop
  useFrame(() => {
    const pos = clock.pos.current;
    const s = strip(pos);
    if (s > 0 && s < 1) {
      const H = size.height;
      const edge = Math.round(H * s); // rows from the bottom that belong to the hall
      pass(pos, 'grid', -s, edge, H - edge);
      pass(pos, 'bots', 1 - s, 0, edge);
      gl.setScissorTest(false);
    } else pass(pos, regionAt(pos), 0, 0, null);
  }, 1);

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

// A stage of the world. The director shows one of them per pass, so the others cost nothing
function Stage({ groups, region, children }: { groups: React.MutableRefObject<Groups>; region: Region; children: React.ReactNode }) {
  return (
    <group
      ref={(g) => {
        groups.current[region] = g;
      }}
    >
      {children}
    </group>
  );
}

export default function Scene({ clock }: SceneProps) {
  const [ready, setReady] = useState(false);
  const band = useRef<HTMLDivElement>(null);
  const cell = useRef<HTMLDivElement>(null);
  const seam = useRef<HTMLDivElement>(null);
  const groups = useRef<Groups>({});

  // the van decals draw text on a canvas, so the font has to be in before the world mounts
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.load('500 62px "Daxline Pro"').then(go, go);
    const id = window.setTimeout(go, 1800);
    return () => window.clearTimeout(id);
  }, []);

  // a still draws on demand, so give the baked models a few frames to land
  useEffect(() => {
    if (!clock.still) return;
    const ids = [500, 1500, 3000, 6000].map((ms) => window.setTimeout(() => invalidate(), ms));
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [clock.still, ready]);

  // The plain band of the top row and the text cells of R and P, hard edged blocks of ground colour drawn over the canvas,
  // nothing fades. The band ends on the top rule of the grid, 136px down.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const pos = clock.pos.current;
      if (band.current) band.current.style.background = topBand(pos);
      if (seam.current) {
        const t = strip(pos);
        seam.current.style.display = t > 0.003 && t < 0.997 ? 'block' : 'none';
        seam.current.style.top = `calc(${((1 - t) * 100).toFixed(3)}% - 16px)`;
      }
      if (cell.current) {
        const c = textCell(pos);
        cell.current.style.display = c.share > 0.001 ? 'block' : 'none';
        cell.current.style.width = `calc((${c.edge}) * ${c.share.toFixed(4)})`;
        cell.current.style.background = c.ground;
      }
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
        <Director clock={clock} groups={groups} />
        {ready && (
          <Suspense fallback={null}>
            <Stage groups={groups} region="site">
              <Site />
              <Warehouse clock={clock} />
              <Hero clock={clock} />
            </Stage>
            <Stage groups={groups} region="bp">
              <BlueprintStage clock={clock} />
            </Stage>
            <Stage groups={groups} region="grid">
              <GridStage clock={clock} />
            </Stage>
            <Stage groups={groups} region="bots">
              <BotsStage clock={clock} />
            </Stage>
            <Wipe clock={clock} />
          </Suspense>
        )}
      </Canvas>
      <div ref={cell} style={{ position: 'absolute', left: 0, top: 136, bottom: 0, width: 0, display: 'none', background: BAND.site, pointerEvents: 'none' }} />
      <div ref={seam} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 32, display: 'none', background: `repeating-linear-gradient(135deg, ${C.ink} 0 14px, ${G.mid} 14px 28px)`, pointerEvents: 'none' }} />
      <div ref={band} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 136, pointerEvents: 'none' }} />
    </div>
  );
}
