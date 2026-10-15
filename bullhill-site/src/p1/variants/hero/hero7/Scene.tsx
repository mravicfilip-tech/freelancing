// The lazy chunk for hero 7. Imports three.js, react three fiber and the stage, so the other heroes
// never load it. One camera, one scene, one render pass. The plan and the render are the same
// ground, split in its own shader by a world x the machine carries, so nothing is drawn twice.
// frameloop stays "demand", a frame is asked for only when p changes, the load or the idle rock moves,
// or the canvas is resized, and the frame sets the machine, the ground, the spoil, the ducts, the house
// and the camera from p alone and then calls onFrame(p), so the step label moves in the same animation
// frame as the canvas. p is the damped one, progress.current(), which glides towards the scroll, so a
// frame is asked for again while it is still moving and the dolly, the arm and the trench all ease to a
// stop together. The shadow map is drawn only on a frame where something that casts a shadow moved.
// Pixel ratio is held to 1.5. In still mode, for the phone's stills and the posters, it draws one frame of
// the scene at ?p= at the still's own framing, 2 pixels to the pixel, with the ground melting into the page.
// On a phone that can take it the scene is live in the tall framing the stills were rendered from, a square
// box, the same ground fade, a shadow map of 1024 and the same pixel ratio of 1 to 1.5.

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Progress } from '../hero6/progress';
import { LoadClock, riseEase } from '../hero6/timeline';
import { buildStage, type Stage } from './stage';
import { CAM, ROUTE_LEN, camAt, makeCam, type View } from './world';

const dbg = import.meta.env.DEV
  ? (() => {
      const v = new URLSearchParams(window.location.search).get('cam');
      const n = v ? v.split(',').map(Number) : [];
      return n.length === 6 && n.every(Number.isFinite) ? n : null;
    })()
  : null;

// `?glfail=1` makes context creation throw and `?glfail=lost` loses the context after a moment, to test the fallback
const glfail = new URLSearchParams(window.location.search).get('glfail');
// how long a lost context may take to come back before the hero gives up on it
const LOST_MS = 2000;

export type Drive = { progress: Progress; clock: LoadClock; onFrame: (p: number) => void };
export type StillSpec = { view: View; p: number; w: number; h: number };

// the route draws in over this long once the load has begun
const ROUTE_MS = 1500;
// how much of the route is drawn, in metres from the cabinet, ms into the load. From the cabinet to the house
// wall, eased.
const routeAt = (a: number) => {
  if (a === Infinity) return ROUTE_LEN + 1;
  if (a < 0) return -1;
  const t = riseEase(Math.min(1, a / ROUTE_MS));
  return (ROUTE_LEN + 1) * t;
};
const smooth = (t: number) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

function Rig({ drive, still, phone, onReady }: { drive?: Drive; still?: StillSpec; phone?: boolean; onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const stage = useRef<Stage | null>(null);
  const cam = useMemo(makeCam, []);
  const state = useRef({ drawn: 0, done: false, p: NaN });

  useLayoutEffect(() => {
    const st = buildStage(gl, gl.getPixelRatio(), phone ? 1024 : 2048);
    stage.current = st;
    // the shoots read the render cost from here, development only
    if (import.meta.env.DEV) (window as unknown as { __h7gl?: THREE.WebGLRenderer }).__h7gl = gl;
    scene.add(st.group);
    scene.environment = st.env;
    scene.environmentIntensity = 0.95;
    if (still) {
      const b = gl.getDrawingBufferSize(new THREE.Vector2());
      st.ground.setVignette(true, b.x, b.y);
    }
    state.current = { drawn: 0, done: false, p: NaN };
    invalidate();
    return () => {
      scene.remove(st.group);
      scene.environment = null;
      st.dispose();
      stage.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, invalidate]);

  // a scroll tick asks for one frame, R3F draws it at most once per animation frame. The clock asks for
  // one when it begins, when the hero leaves or comes back and when its idle starts.
  useEffect(() => {
    if (!drive) return;
    const a = drive.progress.subscribe(() => invalidate());
    const b = drive.clock.on(() => invalidate());
    return () => {
      a();
      b();
    };
  }, [drive, invalidate]);

  useFrame((fs) => {
    const st = stage.current;
    if (!st) return;
    const clock = drive?.clock;
    const p = still ? still.p : drive ? drive.progress.current() : 0;
    // the route's draw and the idle rock, both from the load clock
    const a = still ? Infinity : clock ? clock.a() : Infinity;
    const routeX = routeAt(a);
    let rock = 0;
    let idleMs = 0;
    if (clock && !still) {
      idleMs = clock.idle();
      rock = smooth(idleMs / 1400) * (1 - smooth(p / 0.1));
    }
    // frozen for a shot, the rock holds at its phase and no more frames are asked for
    const running = !!clock && clock.idleRun() && clock.frozen === null;
    if (st.update(p, routeX, rock, idleMs)) gl.shadowMap.needsUpdate = true;
    const aspect = still ? still.w / still.h : fs.size.width / Math.max(1, fs.size.height);
    camAt(p, cam, still ? still.view : phone ? 'tall' : 'wide', aspect);
    // the ground melts into the page at the edges of the phone's box, sized to the drawing buffer
    if (phone) st.ground.setVignette(true, fs.size.width * gl.getPixelRatio(), fs.size.height * gl.getPixelRatio());
    // DEBUG, development only, `?cam=tx,ty,tz,az,el,dist` frames the shot by eye
    if (import.meta.env.DEV && dbg) {
      const [tx, ty, tz, az, el, d] = dbg;
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      cam.tx = tx;
      cam.ty = ty;
      cam.tz = tz;
      cam.px = tx - d * Math.cos(a) * Math.cos(e);
      cam.py = ty + d * Math.sin(e);
      cam.pz = tz + d * Math.sin(a) * Math.cos(e);
    }
    camera.position.set(cam.px, cam.py, cam.pz);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    if (camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    drive?.onFrame(p);
    const s = state.current;
    // On the second frame every program is linked, with every part shown and drawn into one pixel, so none of
    // them stalls the scroll the first time its part appears, the strands, the sand, the house, the stubs. The
    // shadow map is drawn again for the real frame.
    if (s.drawn === 1) {
      const hidden: THREE.Object3D[] = [];
      st.group.traverse((o) => {
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
      });
      const vp = gl.getViewport(new THREE.Vector4());
      gl.setViewport(0, 0, 1, 1);
      gl.render(scene, camera);
      gl.setViewport(vp);
      hidden.forEach((o) => (o.visible = false));
      gl.shadowMap.needsUpdate = true;
    }
    s.drawn++;
    // the damped p is still gliding, the route is still being drawn or the house is still idling, so ask for the next frame
    if ((s.p !== p && s.drawn > 1) || (a >= 0 && a < ROUTE_MS + 40) || (running && p < 0.1)) invalidate();
    s.p = p;
    if (s.drawn === 1) {
      // the first frame compiles the shaders, the next one is the first that is really on screen
      invalidate();
    } else if (!s.done) {
      s.done = true;
      // read one pixel back, so the flag means the frame is really drawn
      const ctx = gl.getContext();
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      document.documentElement.dataset.h7 = 'ready';
      onReady();
      // draw once more a moment later, some compositors only present the second frame
      window.setTimeout(() => invalidate(), 800);
    }
  });
  return null;
}

export default function Scene({ drive, still, phone, onReady, onFail }: { drive?: Drive; still?: StillSpec; phone?: boolean; onReady: () => void; onFail?: () => void }) {
  // a context that cannot be made, or is lost and does not come back in LOST_MS, hands the hero to its fallback
  const fail = useRef(onFail);
  fail.current = onFail;
  const lost = useRef(0);
  useEffect(() => () => window.clearTimeout(lost.current), []);
  return (
    <Canvas
      frameloop="demand"
      dpr={still ? [2, 2] : [1, 1.5]}
      camera={{ position: [-10, 4, 8], fov: CAM.fov, near: 0.5, far: 320 }}
      gl={(d) => {
        const give = () => fail.current?.();
        d.canvas.addEventListener('webglcontextcreationerror', give, { once: true });
        try {
          if (glfail === '1') throw new Error('glfail');
          return new THREE.WebGLRenderer({ ...d, antialias: true, alpha: true, powerPreference: 'high-performance' });
        } catch (e) {
          give();
          throw e;
        }
      }}
      onCreated={({ gl }) => {
        const cv = gl.domElement;
        cv.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          window.clearTimeout(lost.current);
          lost.current = window.setTimeout(() => fail.current?.(), LOST_MS);
        });
        cv.addEventListener('webglcontextrestored', () => window.clearTimeout(lost.current));
        if (glfail === 'lost') window.setTimeout(() => gl.getContext().getExtension('WEBGL_lose_context')?.loseContext(), 1500);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
        // the house is rendered by a clipping plane that moves, and the ducts by one that stays
        gl.localClippingEnabled = true;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        // drawn by hand, only when something that casts a shadow moved
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
      }}
    >
      <Rig drive={drive} still={still} phone={phone} onReady={onReady} />
    </Canvas>
  );
}
