// Preloader 3, Paleta, a small WebGL scene of its own, apart from the story's. It is built from boxes and cylinders only and loads nothing,
// no model, no texture, no font. Cartons drop onto a pallet one after the other as the assets load, eighteen of them in three layers, and
// the stack turns with the mouse, so the loading is a pile that grows. When the loading is done the stack squares up to the screen, a fork
// slides in from the right under the pallet, lifts it, and carries it out of frame to the left as the page arrives behind. The scene is a
// transparent canvas over the white sheet, flat greys of the brand with the fine ink edges the main scene's line drawings have, the truck
// in the LMH red. With no WebGL, or if the renderer cannot start, Preloader.tsx puts Viljuska in its place (onFail). This file is loaded
// when the preloader asks for it, so the other three never pay for it.
import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  MeshBasicMaterial,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';
import { GREY, INK, LMH_RED, inOutCubic, lerp, outCubic, span, type LoaderState } from './state';
import { Readout } from './Readout';

// the carton is 0.38 by 0.28 by 0.38, three across the pallet's 1.2 and two along its 0.8, in three layers
const COLS = 3;
const ROWS = 2;
const LAYERS = 3;
const CARTON = { x: 0.38, y: 0.28, z: 0.38 };
// the pallet's runners are 0.1 high and its deck 0.025, so the first layer stands on 0.125
const RUNNER = 0.1;
const DECK = 0.025;
// where the fork's carriage stands when it has pushed the tines home, and how far it has to come from, in metres along x
const TOUCH = 0.62;
const FROM = 7;
// how far the pair drives to be out of the frame on the left
const CARRY = 5.2;
// the tine's thickness and how far it rises to meet the deck, then how far it lifts the pallet
const TINE_Y = 0.04;
const MEET = RUNNER - TINE_Y;
const LIFT = 0.05;

type Cleanup = { geo: BufferGeometry[]; mat: Material[] };

// a small seeded spread, so the cartons are not all the same grey nor all dead square, and the same every load
const seeded = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export function Paleta({ state, onFail }: { state: LoaderState; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      onFail();
      return;
    }
    const own: Cleanup = { geo: [], mat: [] };
    const geo = <T extends BufferGeometry>(g: T) => {
      own.geo.push(g);
      return g;
    };
    const mat = <T extends Material>(m: T) => {
      own.mat.push(m);
      return m;
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(state.w, state.h);
    renderer.setClearColor(0xffffff, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(22, state.w / state.h, 0.1, 60);
    scene.add(new AmbientLight(0xffffff, 1.35));
    const sun = new DirectionalLight(0xffffff, 1.7);
    sun.position.set(3, 5, 4);
    scene.add(sun);

    const edge = mat(new LineBasicMaterial({ color: INK, transparent: true, opacity: 0.5 }));
    // a box with its fine ink edges, at a place, in a group
    const box = (parent: Group, w: number, h: number, d: number, colour: string, x: number, y: number, z: number, lines = true) => {
      const g = geo(new BoxGeometry(w, h, d));
      const mesh = new Mesh(g, mat(new MeshLambertMaterial({ color: colour })));
      mesh.position.set(x, y, z);
      if (lines) {
        const e = geo(new EdgesGeometry(g));
        mesh.add(new LineSegments(e, edge));
      }
      parent.add(mesh);
      return mesh;
    };

    // the pallet, three runners along x under five boards of the deck
    const pallet = new Group();
    for (const z of [-0.34, 0, 0.34]) box(pallet, 1.2, RUNNER, 0.1, GREY.light, 0, RUNNER / 2, z);
    for (let i = 0; i < 5; i++) box(pallet, 1.2, DECK, 0.145, GREY.pale, 0, RUNNER + DECK / 2, -0.328 + i * 0.164);
    scene.add(pallet);

    // the stack, each carton in its own group so it can drop in on its own
    const stack = new Group();
    pallet.add(stack);
    const cartons: { g: Group; y: number; spin: number }[] = [];
    for (let l = 0; l < LAYERS; l++)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const i = l * COLS * ROWS + r * COLS + c;
          const g = new Group();
          const shade = [GREY.pale, GREY.light, '#f5f6fa'][Math.floor(seeded(i) * 3)];
          box(g, CARTON.x, CARTON.y, CARTON.z, shade, 0, 0, 0);
          // the tape band over the lid
          box(g, 0.05, 0.004, CARTON.z, GREY.mid, 0, CARTON.y / 2 + 0.002, 0, false);
          const y = RUNNER + DECK + CARTON.y / 2 + l * CARTON.y;
          g.position.set(-0.4 + c * 0.4, y + 4, -0.2 + r * 0.4);
          g.rotation.y = (seeded(i + 40) - 0.5) * 0.05;
          stack.add(g);
          cartons.push({ g, y, spin: (seeded(i + 80) - 0.5) * 1.6 });
        }

    // the fork, the tines and the carriage at x 0 and the truck behind it on +x, facing the pallet
    const truck = new Group();
    const tines: Mesh[] = [];
    for (const z of [-0.17, 0.17]) tines.push(box(truck, 1.05, TINE_Y, 0.12, GREY.dark, -0.525, TINE_Y / 2, z));
    box(truck, 0.04, 0.5, 0.62, GREY.mid, 0.02, 0.25, 0);
    for (const z of [-0.22, 0.22]) box(truck, 0.07, 1.05, 0.07, GREY.dark, 0.1, 0.52, z);
    // the body in the LMH red, the seat block on it, and the overhead guard over the seat
    box(truck, 0.95, 0.5, 0.8, LMH_RED, 0.7, 0.34, 0);
    box(truck, 0.4, 0.14, 0.62, GREY.dark, 0.98, 0.66, 0);
    for (const z of [-0.3, 0.3]) {
      box(truck, 0.035, 0.7, 0.035, GREY.dark, 0.52, 0.99, z);
      box(truck, 0.035, 0.7, 0.035, GREY.dark, 1.08, 0.99, z);
    }
    box(truck, 0.68, 0.035, 0.68, GREY.dark, 0.8, 1.35, 0);
    const wheelGeo = geo(new CylinderGeometry(0.22, 0.22, 0.16, 28));
    const wheelMat = mat(new MeshLambertMaterial({ color: INK }));
    const wheels: [number, number, number][] = [
      [0.5, 0.22, 0.43],
      [0.5, 0.22, -0.43],
      [1.1, 0.18, 0.42],
      [1.1, 0.18, -0.42],
    ];
    for (const [x, y, z] of wheels) {
      const wheel = new Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      if (y < 0.2) wheel.scale.set(0.82, 1, 0.82);
      truck.add(wheel);
    }
    scene.add(truck);

    // one soft shadow on the floor under the pallet and the truck, a radial gradient on a plane
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const g2 = sc.getContext('2d');
    if (g2) {
      const grd = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(34,34,34,0.5)');
      grd.addColorStop(1, 'rgba(34,34,34,0)');
      g2.fillStyle = grd;
      g2.fillRect(0, 0, 64, 64);
    }
    const shadowTex = new CanvasTexture(sc);
    const shadowMat = mat(new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }));
    const shadow = new Mesh(geo(new PlaneGeometry(1, 1)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    scene.add(shadow);
    const shadow2 = new Mesh(shadow.geometry, shadowMat);
    shadow2.rotation.x = -Math.PI / 2;
    shadow2.position.y = 0.002;
    shadow2.scale.set(2.2, 1.5, 1);
    scene.add(shadow2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      state.w = w;
      state.h = h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // keep the stack the same share of a short or a narrow screen, the vertical field is what the stack is sized by
      camera.fov = 22 * Math.max(1, 1.45 / Math.max(0.1, camera.aspect));
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (s: LoaderState) => {
      // the cartons fall one after the other, each from above the frame, turning as it comes, and land where the loading has got to
      const n = cartons.length;
      cartons.forEach((c, i) => {
        const a = 0.04 + (i / n) * 0.86;
        const t = outCubic(span(s.p, a, a + 0.1));
        c.g.position.y = lerp(c.y + 4, c.y, t);
        c.g.rotation.x = (1 - t) * c.spin;
        c.g.visible = t > 0;
      });
      // the stack turns with the mouse and squares up to the screen when the loading is done, so the fork can come in from the right
      const free = 1 - span(s.full, 0, 0.3);
      const yaw = (0.3 + s.mx * 0.95 + Math.sin(s.t * 0.7) * 0.05) * free;
      pallet.rotation.y = yaw;
      // the camera draws back while the fork comes in, so the stack fills the screen while it grows and the truck fits when it arrives
      const back = inOutCubic(span(s.full, 0.05, 0.45));
      camera.position.set(0, lerp(1.7, 2.1, back) - s.my * 0.4 * free, lerp(6.1, 7.7, back));
      camera.lookAt(0, lerp(0.5, 0.62, back), 0);
      // the fork slides in under the pallet, meets the deck, lifts it, then drives out to the left with it as the page comes in
      const slide = inOutCubic(span(s.full, 0.1, 0.42));
      const lift = inOutCubic(span(s.full, 0.42, 0.52));
      const carry = inOutCubic(s.out) * CARRY;
      const tx = lerp(TOUCH + FROM, TOUCH, slide) - carry;
      truck.position.x = tx;
      const rise = lift * (MEET + LIFT);
      tines.forEach((m) => (m.position.y = TINE_Y / 2 + Math.min(rise, MEET)));
      // before the fork is in, the pallet stands where it is, its yaw is the mouse's, and it moves with the fork after that
      pallet.position.x = Math.min(0, tx - TOUCH);
      pallet.position.y = Math.max(0, rise - MEET);
      shadow.position.x = pallet.position.x;
      shadow.scale.set(1.7, 1.3, 1);
      shadow.rotation.z = -yaw;
      shadow2.position.x = tx + 0.7;
      shadow2.visible = tx < 6;
      renderer.render(scene, camera);
    };
    state.frames.add(frame);

    return () => {
      state.frames.delete(frame);
      window.removeEventListener('resize', resize);
      own.geo.forEach((g) => g.dispose());
      own.mat.forEach((m) => m.dispose());
      shadowTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // the scene is built once for this mount
  }, []);

  const ground = useRef<HTMLDivElement>(null);
  // the sheet's white fades while the fork carries the pallet out, see the exit in Preloader.tsx
  useEffect(() => {
    const f = (s: LoaderState) => {
      if (ground.current) ground.current.style.opacity = String(1 - outCubic(span(s.out, 0.1, 0.8)));
    };
    state.frames.add(f);
    return () => {
      state.frames.delete(f);
    };
  }, [state]);

  return (
    <div className="pa">
      <div className="pl-ground" ref={ground} />
      <div className="pa-host" ref={host} />
      <Readout state={state} />
    </div>
  );
}
