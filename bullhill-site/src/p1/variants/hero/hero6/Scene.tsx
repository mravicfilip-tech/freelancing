// The lazy chunk for hero 6. Imports three.js, react three fiber and the scene, so heroes 1 to 5
// never load it. One camera, two scenes, drawn with the scissor test. The left half is the
// schematic, the right the render, split at `seam`, a fraction of the canvas width, 0.5 by default.
// 0 is all render, 1 is all schematic. With `drive`, every frame reads p from the scroll, sets the
// work from it, draws, and then calls onFrame(p), so the step label and the overlay move in the same
// animation frame as the canvas. The seam and the camera hold still, the schematic is the plan.
//
// Beats 1 to 3 ride on the same frame. With `drive.load` the scene is built up by the load clock
// (hero6/timeline.ts). The seam drops, the schematic's lines trace in and its dots settle, and the
// render wipes out from the seam. Once assembled, an idle loop turns the camera a degree or two, tilts
// it towards the pointer and runs light across the fibre ends. frameloop stays "demand", a frame is
// asked for only while something moves, idle frames are capped at 30 a second, and the loop stops
// when the hero is out of view or the tab is hidden.

//
// The five steps (hero6/acts.ts). With `drive.acts` the same frame sets the cut, the bed, the ducts
// and the light from p (Dig.ts), and draws the ground's points and the light over the render half,
// after it, so the points are depth tested against the block. `stillP` sets the same work for one
// frame without a scroll, for scripts/render-hero6.mjs, and `dust` false leaves the ground's points
// out of it, the phones play them in 2D.

export type Drive = { progress: Progress; onFrame: (p: number) => void; load?: LoadClock; acts?: boolean };

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CAMS, OVERSCAN, VIEWS, clamp01, driftCam, seamAt, smooth, type View } from './geometry';
import { P_DUCTS, P_LIGHT } from './acts';
import { applyRig, buildDig, makeRig, type DigRig } from './Dig';
import type { Progress } from './progress';
import { Specimen, type FibreRig } from './Render';
import { buildSchematic } from './Schematic';
import { ASSEMBLE, SETTLED, assembleAt, idlePulse, msToNextPulse, pulseLevel, type LoadClock } from './timeline';

// What casts a shadow and moves with p, the ducts as they slide, the fibre and its strands while they
// are blown in, the trench floor and the trench itself. The shadow map is drawn again only when this
// changes, so the dig, where only the points and the cut faces move, costs no shadow pass.
function shadowKey(d: DigRig, p: number) {
  let k = '';
  for (const g of d.ducts) k += g ? `${g.position.x.toFixed(4)},` : '-,';
  if (d.fibre) k += `${d.fibre.position.x.toFixed(4)}${d.fibre.visible ? 'v' : 'h'}`;
  if (d.floor) k += d.floor.position.y.toFixed(4);
  if (d.trench?.visible) k += 't';
  if (p > P_DUCTS - 0.01 && p < P_LIGHT + 0.01) k += p.toFixed(4);
  return k;
}

function Dual({ view, seam, drive, onReady, rig, dig, stillP, dust }: { view: View; seam: number; drive?: Drive; onReady: () => void; rig: React.MutableRefObject<FibreRig | null>; dig: DigRig; stillP: number; dust: boolean }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const cam = CAMS[view];
  const dpr = gl.getPixelRatio();
  const schem = useMemo(() => buildSchematic(dpr, view === 'wide' ? 1 : 0.85, false), [dpr, view]);
  const points = useMemo(() => (drive?.acts || stillP > 0 ? buildDig(dpr) : null), [dpr, drive?.acts, stillP]);
  const done = useRef(false);
  const load = drive?.load;
  const last = useRef({ t: 0, draw: 0, p: -1, warm: false, sk: '', n: 0 });
  const wake = useRef(0);

  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 1;
    camera.far = 120;
    camera.lookAt(...cam.target);
    camera.updateProjectionMatrix();
  }, [camera, cam, size.width, size.height]);

  // a scroll tick asks for one frame, R3F draws it at most once per animation frame
  useEffect(() => {
    if (!drive) return;
    return drive.progress.subscribe(() => invalidate());
  }, [drive, invalidate]);

  // the clock changing state (assembled, hidden, shown) asks for a frame
  useEffect(() => {
    if (!load) return;
    const off = load.on(() => invalidate());
    return () => {
      off();
      window.clearTimeout(wake.current);
    };
  }, [load, invalidate]);

  useFrame(({ scene }) => {
    let s = seam;
    let p = 0;
    let st = SETTLED;
    let moving = false;
    let idleOnly = false;
    const now = performance.now();
    const dt = Math.min(100, now - (last.current.t || now));
    last.current.t = now;
    // the p the scroll loop read this frame, reading the scroll here would lay the page out again
    if (drive) p = drive.progress.current();
    if (load) {
      if (load.frozen === null) {
        // scrolling during the load completes the assemble at once, beat 4 takes over from there
        if (p > 0) load.skip();
        if (!load.begun && !load.assembled()) {
          if (!last.current.warm) {
            // a first frame with nothing drawn compiles the shaders, then the clock starts
            last.current.warm = true;
            st = assembleAt(-1);
            moving = true;
          } else {
            load.begin();
          }
        }
        // hidden tab or out of view, once assembled, the loop stops and asks for nothing
        if (load.assembled() && !load.isVisible()) return;
      }
      if (load.begun || load.frozen !== null) st = assembleAt(load.a());
      const a = load.a();
      const idle = load.idle();
      const amp = 1 - smooth(clamp01(p * 4));
      const run = load.frozen !== null ? a >= ASSEMBLE : load.idleRun();
      const m = load.stepView(dt, amp, idle, run);
      const sp = run ? idlePulse(idle) : -1;
      const g = rig.current;
      if (g) for (let i = 0; i < g.u.length; i++) g.set(i, pulseLevel(sp, g.u[i]));
      if (load.frozen === null) {
        const assembling = !load.assembled();
        moving = moving || assembling || m || sp >= 0;
        idleOnly = !assembling && !load.tilting && p === last.current.p && !!last.current.draw;
        // nothing moves, wake for the next pulse
        if (!moving && run) {
          window.clearTimeout(wake.current);
          wake.current = window.setTimeout(() => invalidate(), msToNextPulse(idle));
        }
      }
    }
    // the idle drift is under a degree a second, so 20 frames a second draw it smoothly and leave the
    // GPU free for the page's own scrolling
    if (idleOnly && now - last.current.draw < 50) {
      invalidate();
      return;
    }
    last.current.draw = now;
    last.current.p = p;
    if (drive) {
      const c = driftCam(CAMS[view], load?.view.yaw ?? 0, load?.view.pitch ?? 0);
      camera.position.set(...c.pos);
      camera.lookAt(...c.target);
      camera.updateMatrixWorld();
      s = seamAt(view, 0);
      // the canvas is the stage plus OVERSCAN above and below, the camera frames the stage inside it
      const fh = size.height / (1 + 2 * OVERSCAN);
      const asp = size.width / fh;
      if (camera.aspect !== asp || !camera.view?.enabled) {
        camera.aspect = asp;
        camera.setViewOffset(size.width, fh, 0, -OVERSCAN * fh, size.width, size.height);
      }
    }
    // the acts, from p, before anything is drawn
    const ap = drive?.acts ? p : stillP;
    applyRig(dig, ap);
    // The key light is fixed, so the shadow map is drawn again only when something that casts a shadow
    // moved, and in the first frames while the specimen builds. The idle drift moves the camera alone
    // and reuses it, which spares a full pass of the scene on most frames.
    gl.shadowMap.autoUpdate = false;
    last.current.n++;
    const sk = shadowKey(dig, ap);
    if (sk !== last.current.sk || last.current.n < 90) {
      gl.shadowMap.needsUpdate = true;
      last.current.sk = sk;
    }
    const pts = points ? points.update(ap, dust) : false;
    const bw = Math.round(size.width * dpr);
    const bh = Math.round(size.height * dpr);
    const sx = Math.floor(bw * Math.min(1, Math.max(0, s)));
    const eps = 0.001;
    schem.setResolution(bw, bh);
    schem.setAssemble(st.edges, st.dots);
    gl.setClearColor(0x000000, 0);
    gl.setScissorTest(true);
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, (sx + eps) / dpr, size.height);
    gl.clear();
    gl.render(schem.scene, camera);
    gl.setScissor((sx + eps) / dpr, 0, ((bw - sx) / dpr) * st.wipe, size.height);
    gl.clear();
    if (st.wipe > 0) gl.render(scene, camera);
    gl.setScissorTest(false);
    if (pts && points) {
      // over the render half only, depth tested against the render, nothing cleared
      const ac = gl.autoClear;
      gl.autoClear = false;
      gl.setScissorTest(true);
      gl.setScissor((sx + eps) / dpr, 0, ((bw - sx) / dpr) * st.wipe, size.height);
      gl.render(points.scene, camera);
      gl.setScissorTest(false);
      gl.autoClear = ac;
    }
    if (drive) drive.onFrame(p);
    if (moving) invalidate();
    if (!done.current) {
      done.current = true;
      // read one pixel back, so the flag means the frame is really drawn
      const ctx = gl.getContext();
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      document.documentElement.dataset.h6 = 'ready';
      onReady();
      // draw once more a moment later, some compositors only present the second frame
      window.setTimeout(() => invalidate(), 800);
    }
  }, 1);
  return null;
}

export default function Scene({ view, still, seam = 0.5, drive, onReady, stillP = 0, dust = true }: { view: View; still?: boolean; seam?: number; drive?: Drive; onReady: () => void; stillP?: number; dust?: boolean }) {
  const cam = CAMS[view];
  const rig = useRef<FibreRig | null>(null);
  const [dig] = useState(makeRig);
  return (
    <Canvas
      frameloop="demand"
      shadows="soft"
      dpr={still ? 2 : [1, 1.5]}
      camera={{ position: cam.pos, fov: VIEWS[view].fov, near: 1, far: 120 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: !!still, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Specimen view={view} rig={rig} dig={dig} />
      <Dual view={view} seam={seam} drive={drive} onReady={onReady} rig={rig} dig={dig} stillP={stillP} dust={dust} />
    </Canvas>
  );
}
