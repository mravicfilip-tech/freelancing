import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { PlanetConfig } from './config';
import { resolveConfig } from './variants';
import { generateLandMask, loadLandMask, sampleMask, type LandMask } from './landMask';
import { makeBadgeTexture } from './badges';
import { CoinPopups } from './popups';
import { CoinCorridors } from './corridors';
import dotsVert from './shaders/dots.vert.glsl?raw';
import dotsFrag from './shaders/dots.frag.glsl?raw';
import billboardVert from './shaders/billboard.vert.glsl?raw';
import glowFrag from './shaders/glow.frag.glsl?raw';
import outlineFrag from './shaders/outline.frag.glsl?raw';
import ringVert from './shaders/ring.vert.glsl?raw';
import ringFrag from './shaders/ring.frag.glsl?raw';
import shellVert from './shaders/shell.vert.glsl?raw';
import shellFrag from './shaders/shell.frag.glsl?raw';
import latticeVert from './shaders/lattice.vert.glsl?raw';
import latticeFrag from './shaders/lattice.frag.glsl?raw';
import arcVert from './shaders/arc.vert.glsl?raw';
import arcFrag from './shaders/arc.frag.glsl?raw';

gsap.registerPlugin(ScrollTrigger);
// Brand hexes go straight to the framebuffer — no sRGB/linear round-trip.
THREE.ColorManagement.enabled = false;

export type PlanetLayout = 'desktop' | 'tablet' | 'mobile' | 'capture';

export interface PlanetSceneOptions {
  canvas: HTMLCanvasElement;
  /** The hero section: drives sizing, scroll drift and visibility. */
  host: HTMLElement;
  layout: PlanetLayout;
  reducedMotion: boolean;
  touch: boolean;
  /** Wire the ScrollTrigger drift/fade (off for the capture stage). */
  scroll?: boolean;
  /** Preset name from ./variants.ts; defaults to config.variant. */
  variant?: string | null;
}

interface Badge {
  sprite: THREE.Sprite;
  phase: number;
  trail: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
}

interface Ring {
  pivot: THREE.Group;
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>;
  curve: THREE.Curve<THREE.Vector3>;
  indexCount: number;
  indexStep: number;
  badges: Badge[];
}

const DEG = Math.PI / 180;
const idle = () =>
  new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 500 });
    else window.setTimeout(resolve, 16);
  });
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lcg = (seed: number) => {
  let s = (seed * 7919 + 1) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export class PlanetScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly cfg: PlanetConfig;

  private readonly opts: Required<PlanetSceneOptions>;
  private readonly clock = new THREE.Clock(false);
  private readonly root = new THREE.Group(); // layout position + scroll drift
  private readonly tilt = new THREE.Group(); // tilted axis
  private readonly spinner = new THREE.Group(); // rotates about its Y
  private dots!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private glow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private outline: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private shell: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null = null;
  private lattice: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null;
  private arcs: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null;
  private rings: Ring[] = [];
  private popups: CoinPopups | CoinCorridors | null = null;
  private readonly quad = new THREE.PlaneGeometry(1, 1);

  /** Entrance state, tweened by GSAP and applied every frame. */
  private readonly state = { glow: 0, dots: 0, assemble: 0, spin: 1, scale: 0.92, halo: 0, ring0: 0, ring1: 0, ring2: 0, nodes: 0 };
  private entrance: gsap.core.Timeline | null = null;
  private scrollTrigger: ScrollTrigger | null = null;
  private scrollProgress = 0;

  private basePosition = new THREE.Vector3();
  private drift = new THREE.Vector2();

  private raf = 0;
  private running = false;
  private disposed = false;
  private hostVisible = true;
  private resizeTimer = 0;
  private resizeObserver: ResizeObserver | null = null;
  private intersection: IntersectionObserver | null = null;
  private entranceStarted = false;

  private readonly tmpV3 = new THREE.Vector3();

  constructor(options: PlanetSceneOptions) {
    this.opts = { scroll: true, variant: null, ...options };
    this.cfg = resolveConfig(this.opts.variant);
    const { canvas } = this.opts;

    const t0 = performance.now();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.cfg.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0); // transparent — the hero's dot grid shows through
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    performance.measure('planet:context', { start: t0, end: performance.now() });

    this.camera = new THREE.PerspectiveCamera(this.cfg.cameraFovDeg, 1, 0.1, 100);
    this.scene.add(this.root);
    this.root.add(this.tilt);
    this.tilt.rotation.z = -this.cfg.axisTiltDeg * DEG;
    this.tilt.add(this.spinner);

    this.buildBackdrop();
    this.buildOccluder();
    this.ready = this.init();
  }

  /** Resolves once shaders are compiled and the first frame has been scheduled. */
  readonly ready: Promise<void>;
  private compiled = false;

  /**
   * Construction is spread over idle callbacks — context creation, the land mask, the point
   * cloud, then rings and shader compilation — so no single main-thread task is long.
   */
  private async init() {
    const mark = (name: string, fn: () => void) => {
      const t0 = performance.now();
      fn();
      performance.measure(`planet:${name}`, { start: t0, end: performance.now() });
    };
    await idle();
    if (this.disposed) return;
    const [mw, mh] = this.cfg.landMaskSize;
    let mask: LandMask | null = null;
    if (this.cfg.useLandMask) {
      if (this.cfg.landMaskSource === 'image') {
        const t0 = performance.now();
        mask = await loadLandMask(this.cfg.landMaskUrl).catch(() => null);
        performance.measure('planet:mask', { start: t0, end: performance.now() });
      }
      if (!mask) {
        mark('mask', () => {
          mask = generateLandMask(mw, mh, this.cfg.landCoverage, this.cfg.landMaskSeed, this.cfg.landMaskFrequency);
        });
      }
      await idle();
      if (this.disposed) return;
    }
    mark('dots', () => this.buildDots(mask));
    await idle();
    if (this.disposed) return;
    mark('rings', () => {
      if (this.cfg.shell) this.buildShell();
      if (this.cfg.lattice) this.buildLattice();
      if (this.cfg.arcs) this.buildArcs();
      this.buildRings();
      if (this.cfg.coinMode === 'popup') this.popups = new CoinPopups(this.cfg, this.spinner, this.camera, this.quad);
      if (this.cfg.coinMode === 'corridor') this.popups = new CoinCorridors(this.cfg, this.spinner, this.camera, this.quad);
      this.layout();
      this.attach();
      if (this.opts.reducedMotion) this.setStaticPose();
      else this.applyState();
    });

    // Compile all programs off the critical path (KHR_parallel_shader_compile where available).
    const tc = performance.now();
    await this.renderer.compileAsync(this.scene, this.camera).catch(() => undefined);
    performance.measure('planet:compile', { start: tc, end: performance.now() });
    if (this.disposed) return;
    this.compiled = true;
    if (this.opts.reducedMotion) {
      mark('firstFrame', () => this.renderOnce());
      return;
    }
    await idle();
    if (this.disposed) return;
    mark('firstFrame', () => this.renderOnce());
    this.updateRunning();
    await (document.fonts?.ready ?? Promise.resolve());
    if (!this.disposed) this.playEntrance();
  }

  // ---------------------------------------------------------------- build

  private billboard(
    fragment: string,
    uniforms: Record<string, THREE.IUniform>,
    extra: Partial<THREE.ShaderMaterialParameters> = {},
  ) {
    const mesh = new THREE.Mesh(
      this.quad,
      new THREE.ShaderMaterial({
        vertexShader: billboardVert,
        fragmentShader: fragment,
        uniforms: { uSize: { value: 1 }, uAspect: { value: 1 }, ...uniforms },
        transparent: true,
        depthWrite: false,
        ...extra,
      }),
    );
    mesh.frustumCulled = false;
    return mesh;
  }

  /** Glow, contact shadow and silhouette outline — whichever the variant enables. */
  private buildBackdrop() {
    const C = this.cfg;
    if (C.glow) {
      this.glow = this.billboard(
        glowFrag,
        {
          uSize: { value: C.glowScale },
          uColor: { value: new THREE.Color(C.colorAccent) },
          uOpacity: { value: 0 },
          uInner: { value: C.glowInner },
          uFalloff: { value: C.glowFalloff },
        },
        { depthTest: false, blending: C.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending },
      );
      this.glow.position.z = -0.3;
      this.glow.renderOrder = -2;
      this.root.add(this.glow);
    }
    if (C.body) {
      const body = this.billboard(
        glowFrag,
        {
          uSize: { value: 2.02 },
          uColor: { value: new THREE.Color(C.bodyColor) },
          uOpacity: { value: C.bodyOpacity },
          uInner: { value: C.bodyEdge },
          uFalloff: { value: 1.0 },
        },
        { depthTest: false },
      );
      body.position.z = -0.05;
      body.renderOrder = -1;
      this.root.add(body);
    }
    if (C.shadow) {
      this.shadow = this.billboard(
        glowFrag,
        {
          uSize: { value: C.shadowWidth },
          uAspect: { value: C.shadowAspect },
          uColor: { value: new THREE.Color(C.colorInk) },
          uOpacity: { value: 0 },
          uInner: { value: 0.0 },
          uFalloff: { value: 2.2 },
        },
        { depthTest: false },
      );
      this.shadow.position.set(0.05, C.shadowOffsetY, -0.2);
      this.shadow.renderOrder = -1;
      this.root.add(this.shadow);
    }
    if (C.halo) {
      const size = C.haloRadius * 2 * 1.04;
      this.halo = this.billboard(
        outlineFrag,
        {
          uSize: { value: size },
          uColor: { value: new THREE.Color(C.haloColor) },
          uOpacity: { value: C.haloOpacity },
          uRadius: { value: C.haloRadius / size },
          uWidth: { value: 0.002 },
          uSweep: { value: 0 },
          uStart: { value: C.haloStartDeg * DEG },
          uPulse: { value: 0 },
          uPulseLen: { value: 0 },
          uPulseColor: { value: new THREE.Color(C.haloPulseColor) },
        },
        { depthTest: false },
      );
      this.halo.renderOrder = -1;
      this.root.add(this.halo);
    }
    if (C.outline) {
      this.outline = this.billboard(
        outlineFrag,
        {
          uSize: { value: 2.08 },
          uColor: { value: new THREE.Color(C.outlineColor) },
          uOpacity: { value: 0 },
          uRadius: { value: 1 / 2.08 },
          uWidth: { value: 0.003 },
          uSweep: { value: 1 },
          uStart: { value: 0 },
          uPulse: { value: 0 },
          uPulseLen: { value: 0 },
          uPulseColor: { value: new THREE.Color(C.outlineColor) },
        },
        { depthTest: false },
      );
      this.outline.renderOrder = 5;
      this.root.add(this.outline);
    }
  }

  private buildOccluder() {
    // Depth-only sphere: anything passing behind the planet is hidden by it.
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.cfg.occluderRadius, 48, 32),
      new THREE.MeshBasicMaterial({ colorWrite: false }),
    );
    mesh.renderOrder = 0;
    this.root.add(mesh);
  }

  private buildShell() {
    const C = this.cfg;
    this.shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.992, 96, 64),
      new THREE.ShaderMaterial({
        vertexShader: shellVert,
        fragmentShader: shellFrag,
        uniforms: {
          uColorDark: { value: new THREE.Color(C.shellColorDark) },
          uColorLight: { value: new THREE.Color(C.shellColorLight) },
          uColorRim: { value: new THREE.Color(C.shellColorRim) },
          uLightDir: { value: new THREE.Vector3(...C.lightDirection).normalize() },
          uSpecular: { value: C.shellSpecular },
          uProgress: { value: 0 },
        },
        transparent: true,
      }),
    );
    this.shell.renderOrder = 1;
    this.spinner.add(this.shell);
  }

  private buildDots(mask: LandMask | null) {
    const C = this.cfg;
    const n = this.opts.layout === 'mobile' ? C.pointCountMobile : C.pointCountDesktop;
    const pts: number[] = [];
    if (C.pointLayout === 'grid') {
      // Latitude rows with equal arc spacing — the tidy halftone look.
      const spacing = Math.sqrt((4 * Math.PI) / n);
      const rows = Math.max(8, Math.round(Math.PI / spacing));
      for (let r = 0; r < rows; r++) {
        const lat = -Math.PI / 2 + ((r + 0.5) / rows) * Math.PI;
        const cl = Math.cos(lat);
        const count = Math.max(1, Math.round((2 * Math.PI * cl) / spacing));
        const offset = (r % 2) * 0.5;
        for (let k = 0; k < count; k++) {
          const lon = ((k + offset) / count) * Math.PI * 2;
          pts.push(cl * Math.cos(lon), Math.sin(lat), cl * Math.sin(lon));
        }
      }
    } else {
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        pts.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      }
    }
    const count = pts.length / 3;
    const positions = new Float32Array(pts);
    const land = new Float32Array(count);
    const seed = new Float32Array(count);
    const rand = lcg(C.landMaskSeed);
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      land[i] = mask
        ? smoothstep(mask.threshold - C.coastSoftness, mask.threshold + C.coastSoftness, sampleMask(mask, x, y, z))
        : 1;
      seed[i] = rand();
    }

    // Assemble entrance: start each dot further out, twisted around the axis, with some scatter.
    const start = new Float32Array(count * 3);
    const swirl = C.assembleSwirlDeg * DEG;
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
      const r = 1 + C.assembleSpread * (0.4 + seed[i] * 0.6);
      const a = swirl * (0.5 + seed[i]) * (y > 0 ? 1 : -1);
      const ca = Math.cos(a), sa = Math.sin(a);
      start[i * 3] = (x * ca + z * sa) * r;
      start[i * 3 + 1] = y * r * 1.3 + (seed[i] - 0.5) * 0.6;
      start[i * 3 + 2] = (-x * sa + z * ca) * r;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aLand', new THREE.BufferAttribute(land, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1 + C.assembleSpread);

    const light = new THREE.Vector3(...C.lightDirection).normalize();
    const mat = new THREE.ShaderMaterial({
      vertexShader: dotsVert,
      fragmentShader: dotsFrag,
      uniforms: {
        uPointScale: { value: 1 },
        uLandSize: { value: C.landPointSizePx },
        uOceanSize: { value: C.oceanPointSizePx },
        uSizeMin: { value: C.sizeMinPx },
        uSizeMax: { value: C.sizeMaxPx },
        uSizeByLight: { value: C.sizeByLight ? 1 : 0 },
        uLitInfluence: { value: C.litInfluence },
        uUseLand: { value: mask ? 1 : 0 },
        uLandOpacity: { value: C.landOpacity },
        uOceanOpacity: { value: C.oceanOpacity },
        uSilhouettePower: { value: C.silhouettePower },
        uProgress: { value: 0 },
        uAssemble: { value: 1 },
        uLighten: { value: C.lightenAmount },
        uLightDir: { value: light },
        uColorLand: { value: new THREE.Color(C.colorPlanet) },
        uColorOcean: { value: new THREE.Color(C.colorOcean) },
      },
      transparent: true,
      depthWrite: false,
    });
    this.dots = new THREE.Points(geo, mat);
    this.dots.renderOrder = 2;
    this.dots.frustumCulled = false;
    // Sit a hair above the solid shell so the dots are not depth-rejected by it.
    if (C.shell) this.dots.scale.setScalar(1.006);
    this.spinner.add(this.dots);
  }

  private buildLattice() {
    const C = this.cfg;
    const seg = 96;
    const verts: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const step = C.latticeStepDeg * DEG;
    // parallels
    for (let lat = -Math.PI / 2 + step; lat < Math.PI / 2 - 1e-6; lat += step) {
      const cl = Math.cos(lat);
      const sl = Math.sin(lat);
      for (let k = 0; k < seg; k++) {
        const a0 = (k / seg) * Math.PI * 2;
        const a1 = ((k + 1) / seg) * Math.PI * 2;
        push(
          new THREE.Vector3(cl * Math.cos(a0), sl, cl * Math.sin(a0)),
          new THREE.Vector3(cl * Math.cos(a1), sl, cl * Math.sin(a1)),
        );
      }
    }
    // meridians
    for (let lon = 0; lon < Math.PI * 2 - 1e-6; lon += step) {
      for (let k = 0; k < seg; k++) {
        const t0 = -Math.PI / 2 + (k / seg) * Math.PI;
        const t1 = -Math.PI / 2 + ((k + 1) / seg) * Math.PI;
        push(
          new THREE.Vector3(Math.cos(t0) * Math.cos(lon), Math.sin(t0), Math.cos(t0) * Math.sin(lon)),
          new THREE.Vector3(Math.cos(t1) * Math.cos(lon), Math.sin(t1), Math.cos(t1) * Math.sin(lon)),
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
    this.lattice = new THREE.LineSegments(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: latticeVert,
        fragmentShader: latticeFrag,
        uniforms: {
          uColor: { value: new THREE.Color(C.latticeColor) },
          uOpacity: { value: C.latticeOpacity },
          uProgress: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.lattice.renderOrder = 1;
    this.spinner.add(this.lattice);
  }

  private buildArcs() {
    const C = this.cfg;
    const rand = lcg(C.arcSeed);
    const randomDir = () => {
      const y = rand() * 1.6 - 0.8; // keep endpoints off the poles
      const r = Math.sqrt(1 - y * y);
      const a = rand() * Math.PI * 2;
      return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
    };
    const verts: number[] = [];
    const ts: number[] = [];
    const ids: number[] = [];
    const seg = 48;
    let made = 0;
    let guard = 0;
    while (made < C.arcCount && guard++ < 200) {
      const a = randomDir();
      const b = randomDir();
      const ang = a.angleTo(b);
      if (ang < 40 * DEG || ang > 125 * DEG) continue;
      const lift = C.arcLift * (0.7 + rand() * 0.6);
      let prev: THREE.Vector3 | null = null;
      for (let k = 0; k <= seg; k++) {
        const t = k / seg;
        // Renormalised lerp is close enough to a slerp for arcs under ~130°.
        const p = a
          .clone()
          .lerp(b, t)
          .normalize()
          .multiplyScalar(1.004 + Math.sin(t * Math.PI) * lift);
        if (prev) {
          verts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
          ts.push((k - 1) / seg, t);
          ids.push(made, made);
        }
        prev = p;
      }
      made++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
    geo.setAttribute('aArc', new THREE.Float32BufferAttribute(ids, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.5);
    this.arcs = new THREE.LineSegments(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: arcVert,
        fragmentShader: arcFrag,
        uniforms: {
          uCenterViewZ: { value: 0 },
          uColor: { value: new THREE.Color(C.arcColor) },
          uPulseColor: { value: new THREE.Color(C.arcPulseColor) },
          uOpacity: { value: C.arcOpacity },
          uPulseLength: { value: C.arcPulseLength },
          uTime: { value: 0 },
          uPeriod: { value: C.arcPulsePeriodSec },
          uProgress: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.arcs.renderOrder = 3;
    this.spinner.add(this.arcs);
  }

  private buildRings() {
    const C = this.cfg;
    const radialSegments = 6;
    for (let i = 0; i < C.ringRadii.length; i++) {
      const r = C.ringRadii[i];
      const ellipse = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
      const pts = ellipse.getPoints(C.ringSegments).map((p) => new THREE.Vector3(p.x, 0, p.y));
      pts.pop(); // closed curve — drop the duplicated end point
      const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
      const geo = new THREE.TubeGeometry(curve, C.ringSegments, C.ringTubeRadius, radialSegments, true);
      const mat = new THREE.ShaderMaterial({
        vertexShader: ringVert,
        fragmentShader: ringFrag,
        uniforms: {
          uCenterViewZ: { value: 0 },
          uColor: { value: new THREE.Color(C.colorRing) },
          uOpacity: { value: C.ringOpacity },
          uBackFade: { value: C.ringBackFade },
          uRadius: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      const indexCount = geo.index!.count;
      geo.setDrawRange(0, 0);

      const pivot = new THREE.Group();
      // 'ZYX': inclination first (X), then azimuth (Y), then in-screen roll (Z).
      pivot.rotation.set(
        C.ringInclinationsDeg[i] * DEG,
        (C.ringAzimuthsDeg[i] ?? 0) * DEG,
        (C.ringRollsDeg[i] ?? 0) * DEG,
        'ZYX',
      );
      mesh.visible = C.ringsVisible;
      pivot.add(mesh);

      // --- crypto badges travelling this ring, evenly phased ---
      const coins = C.coinMode === 'orbit' ? C.coins.filter((_, k) => k % C.ringRadii.length === i) : [];
      const badges: Badge[] = coins.map((coin, k) => {
        const texture = makeBadgeTexture(coin, C.badgeTexturePx);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false }),
        );
        sprite.scale.setScalar(0.0001);
        sprite.renderOrder = 4;
        pivot.add(sprite);
        const trail: Badge['trail'] = [];
        for (let t = 0; t < C.nodeTrailLength; t++) {
          const bead = this.billboard(glowFrag, {
            uSize: { value: C.nodeTrailSize },
            uColor: { value: new THREE.Color(coin.color) },
            uOpacity: { value: 0 },
            uInner: { value: 0.0 },
            uFalloff: { value: 1.6 },
          });
          bead.renderOrder = 3;
          pivot.add(bead);
          trail.push(bead);
        }
        return { sprite, phase: (k / Math.max(1, coins.length)) % 1, trail };
      });

      this.root.add(pivot);
      this.rings.push({ pivot, mesh, curve, indexCount, indexStep: radialSegments * 6, badges });
    }
  }

  // ---------------------------------------------------------------- layout

  /** Recompute camera distance and planet placement from the hero / canvas boxes. */
  layout() {
    const C = this.cfg;
    const { canvas, host, layout } = this.opts;
    const hostRect = host.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    this.renderer.setSize(cw, ch, false);

    const fraction =
      layout === 'mobile'
        ? C.mobileSphereDiameterFraction
        : layout === 'tablet'
          ? C.tabletSphereDiameterFraction
          : layout === 'capture'
            ? C.captureSphereDiameterFraction
            : C.sphereDiameterFraction;
    const aspect = cw / ch;
    const visibleH = 2 / fraction; // sphere diameter (2 units) is `fraction` of the visible height
    const dist = visibleH / 2 / Math.tan((C.cameraFovDeg * DEG) / 2);
    this.camera.aspect = aspect;
    this.camera.position.z = dist;
    this.camera.updateProjectionMatrix();
    const visibleW = visibleH * aspect;

    // Planet centre as a fraction of the *canvas* box.
    let fx: number;
    let fy: number;
    if (layout === 'mobile' || layout === 'capture') {
      fx = layout === 'mobile' ? C.mobilePlanetCenterX : 0.5;
      fy = 0.5;
    } else {
      const cx = layout === 'tablet' ? C.tabletPlanetCenterX : C.planetCenterX;
      fx = (cx * hostRect.width - (rect.left - hostRect.left)) / rect.width;
      fy = (C.planetCenterY * hostRect.height - (rect.top - hostRect.top)) / rect.height;
    }
    this.basePosition.set((fx - 0.5) * visibleW, (0.5 - fy) * visibleH, 0);
    this.drift.set(
      (hostRect.width / rect.width) * visibleW * C.scrollDriftFraction,
      -(hostRect.height / rect.height) * visibleH * C.scrollDriftFraction,
    );
    this.applyScroll();

    // Dot sizes are specified in CSS px at a reference on-screen radius.
    const radiusPx = (fraction * ch) / 2;
    const dpr = this.renderer.getPixelRatio();
    if (this.dots) this.dots.material.uniforms.uPointScale.value = dpr * dist * (radiusPx / C.referenceSphereRadiusPx);
    if (this.outline) this.outline.material.uniforms.uWidth.value = C.outlineWidthPx / radiusPx / 2.08;
    if (this.halo) this.halo.material.uniforms.uWidth.value = C.haloWidthPx / radiusPx / (C.haloRadius * 2 * 1.04);
  }

  private applyScroll() {
    const p = this.scrollProgress;
    this.root.position.set(this.basePosition.x + this.drift.x * p, this.basePosition.y + this.drift.y * p, 0);
    this.opts.canvas.style.opacity = String(1 - p);
  }

  // ---------------------------------------------------------------- lifecycle

  private attach() {
    const C = this.cfg;
    const { host, canvas, reducedMotion, scroll } = this.opts;

    this.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        if (this.disposed) return;
        this.layout();
        if (this.compiled && !this.running) this.renderOnce();
      }, C.resizeDebounceMs);
    });
    this.resizeObserver.observe(host);
    if (canvas.parentElement && canvas.parentElement !== host) this.resizeObserver.observe(canvas.parentElement);

    if (reducedMotion) return;

    this.intersection = new IntersectionObserver(
      (entries) => {
        this.hostVisible = entries.some((e) => e.isIntersecting);
        this.updateRunning();
      },
      { threshold: 0 },
    );
    this.intersection.observe(host);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (scroll) {
      this.scrollTrigger = ScrollTrigger.create({
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          this.scrollProgress = self.progress;
          this.applyScroll();
        },
      });
    }
  }

  private onVisibility = () => this.updateRunning();

  private updateRunning() {
    const should =
      this.compiled &&
      !this.disposed &&
      !this.opts.reducedMotion &&
      this.hostVisible &&
      document.visibilityState !== 'hidden';
    if (should) this.start();
    else this.stop();
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.start();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.clock.stop();
    cancelAnimationFrame(this.raf);
  }

  private tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    this.clock.getDelta();
    this.update(this.clock.elapsedTime);
    this.renderer.render(this.scene, this.camera);
  };

  /** One frame, no loop (reduced motion, resize while paused, capture). */
  renderOnce() {
    this.update(this.opts.reducedMotion ? 0 : this.clock.elapsedTime);
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------- animation

  playEntrance() {
    if (this.entranceStarted) return;
    this.entranceStarted = true;
    const k = this.cfg.entranceTotalSec / 1.8; // time-scale against the reference choreography
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    const C = this.cfg;
    if (C.assemble) {
      tl.to(this.state, { dots: 1, duration: 0.6 }, 0)
        .to(this.state, { assemble: 1, duration: C.assembleSec, ease: 'power2.inOut' }, 0)
        .to(this.state, { spin: 0, duration: C.assembleSec * 1.15, ease: 'power3.out' }, 0)
        .to(this.state, { scale: 1, duration: C.assembleSec, ease: 'power2.out' }, 0)
        .to(this.state, { glow: 1, duration: 0.9 }, C.assembleSec * 0.55)
        .to(this.state, { halo: 1, duration: C.haloSweepSec, ease: 'power2.inOut' }, C.assembleSec * 0.45);
      tl.to(this.state, { ring0: 1, duration: 0.7 * k }, C.assembleSec * 0.6)
        .to(this.state, { ring1: 1, duration: 0.7 * k }, C.assembleSec * 0.6 + 0.12)
        .to(this.state, { ring2: 1, duration: 0.7 * k }, C.assembleSec * 0.6 + 0.24)
        .to(this.state, { nodes: 1, duration: 0.5 * k, ease: 'power2.out' }, C.assembleSec * 0.75);
      this.entrance = tl;
      return;
    }
    this.state.assemble = 1;
    this.state.spin = 0;
    tl.to(this.state, { glow: 1, duration: 0.7 * k }, 0)
      .to(this.state, { halo: 1, duration: C.haloSweepSec, ease: 'power2.inOut' }, 0.3 * k)
      .to(this.state, { scale: 1, duration: 1.2 * k }, 0.1 * k)
      .to(this.state, { dots: 1, duration: 1.2 * k }, 0.1 * k)
      .to(this.state, { ring0: 1, duration: 0.7 * k }, 0.75 * k)
      .to(this.state, { ring1: 1, duration: 0.7 * k }, 0.87 * k)
      .to(this.state, { ring2: 1, duration: 0.7 * k }, 0.99 * k)
      .to(this.state, { nodes: 1, duration: 0.4 * k, ease: 'back.out(2)' }, 1.4 * k);
    this.entrance = tl;
  }

  private setStaticPose() {
    Object.assign(this.state, { glow: 1, dots: 1, assemble: 1, spin: 0, scale: 1, halo: 1, ring0: 1, ring1: 1, ring2: 1, nodes: 1 });
  }

  private applyState() {
    const C = this.cfg;
    const s = this.state;
    if (this.glow) this.glow.material.uniforms.uOpacity.value = C.glowOpacity * s.glow;
    if (this.shadow) this.shadow.material.uniforms.uOpacity.value = C.shadowOpacity * s.glow;
    if (this.outline) this.outline.material.uniforms.uOpacity.value = C.outlineOpacity * s.dots;
    if (this.halo) this.halo.material.uniforms.uSweep.value = s.halo;
    if (this.shell) this.shell.material.uniforms.uProgress.value = s.dots;
    if (this.lattice) this.lattice.material.uniforms.uProgress.value = s.dots;
    if (this.arcs) this.arcs.material.uniforms.uProgress.value = s.nodes;
    this.dots.material.uniforms.uProgress.value = s.dots;
    this.dots.material.uniforms.uAssemble.value = s.assemble;
    this.spinner.scale.setScalar(s.scale);
    const ringProgress = [s.ring0, s.ring1, s.ring2];
    this.rings.forEach((ring, i) => {
      const p = ringProgress[i] ?? 1;
      const count = Math.floor((ring.indexCount * p) / ring.indexStep) * ring.indexStep;
      ring.mesh.geometry.setDrawRange(0, count);
    });
  }

  private update(elapsed: number) {
    const C = this.cfg;
    this.applyState();

    // Continuous rotation about the tilted axis, plus an extra spin that decelerates as the sphere settles.
    this.spinner.rotation.y =
      C.staticRotationDeg * DEG + (elapsed * Math.PI * 2) / C.rotationPeriodSec - this.state.spin * C.entranceSpinDeg * DEG;

    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();

    // Planet centre depth in view space, for the behind-the-sphere fades.
    this.root.updateMatrixWorld();
    const centerViewZ = this.tmpV3
      .setFromMatrixPosition(this.root.matrixWorld)
      .applyMatrix4(this.camera.matrixWorldInverse).z;
    if (this.halo && C.haloLoop) {
      // The loop starts as the sweep lands: the highlight departs from the sweep's end point.
      const u = this.halo.material.uniforms;
      u.uPulseLen.value = C.haloPulseLength * Math.max(0, (this.state.halo - 0.85) / 0.15);
      u.uPulse.value = (elapsed / C.haloLoopPeriodSec) % 1;
    }
    if (this.arcs) {
      this.arcs.material.uniforms.uCenterViewZ.value = centerViewZ;
      this.arcs.material.uniforms.uTime.value = elapsed;
    }

    const appear = this.state.nodes;
    if (this.popups) {
      this.spinner.updateMatrixWorld();
      this.popups.update(elapsed, appear, this.opts.reducedMotion);
    }
    this.rings.forEach((ring, i) => {
      ring.mesh.material.uniforms.uCenterViewZ.value = centerViewZ;

      const period = C.nodePeriodsSec[i] ?? 20;
      for (const badge of ring.badges) {
        const t = (badge.phase + elapsed / period) % 1;
        ring.curve.getPointAt(t, badge.sprite.position);

        // Fade the badge as it passes behind the sphere (the occluder hides it inside the disc).
        badge.sprite.updateMatrixWorld();
        const dz =
          this.tmpV3.setFromMatrixPosition(badge.sprite.matrixWorld).applyMatrix4(this.camera.matrixWorldInverse).z -
          centerViewZ;
        const behind = smoothstep(0.15, -0.55, dz);
        const vis = appear * (1 - behind * (1 - C.nodeBackFade));
        badge.sprite.material.opacity = vis;
        badge.sprite.scale.setScalar(Math.max(0.0001, C.badgeSize * appear));

        // Trail: a few fading beads behind the badge along the ring.
        const len = badge.trail.length;
        for (let k = 0; k < len; k++) {
          const bead = badge.trail[k];
          const back = ((k + 1) / len) * (C.nodeTrailSpan / period);
          ring.curve.getPointAt((((t - back) % 1) + 1) % 1, bead.position);
          const fade = 1 - (k + 1) / (len + 1);
          bead.material.uniforms.uOpacity.value = C.nodeTrailOpacity * fade * vis;
          bead.material.uniforms.uSize.value = C.nodeTrailSize * (0.5 + 0.5 * fade) * appear;
        }
      }
    });
  }

  // ---------------------------------------------------------------- teardown

  get isRunning() {
    return this.running;
  }

  get isDisposed() {
    return this.disposed;
  }

  /** Live GPU resource counters plus GSAP bookkeeping, for leak checks. */
  info() {
    const { memory, render, programs } = this.renderer.info;
    return {
      variant: this.cfg.variant,
      geometries: memory.geometries,
      textures: memory.textures,
      programs: programs?.length ?? 0,
      calls: render.calls,
      points: render.points,
      triangles: render.triangles,
      scrollTriggers: ScrollTrigger.getAll().length,
      activeTweens: gsap.getTweensOf(this.state).length,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    window.clearTimeout(this.resizeTimer);
    this.entrance?.kill();
    this.entrance = null;
    this.scrollTrigger?.kill();
    this.scrollTrigger = null;
    gsap.killTweensOf(this.state);

    this.resizeObserver?.disconnect();
    this.intersection?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.opts.canvas.style.opacity = '';

    const seen = new Set<THREE.BufferGeometry | THREE.Material>();
    this.scene.traverse((obj) => {
      const o = obj as THREE.Mesh;
      if (o.geometry && !seen.has(o.geometry)) {
        seen.add(o.geometry);
        o.geometry.dispose();
      }
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        if (seen.has(m)) continue;
        seen.add(m);
        for (const u of Object.values((m as THREE.ShaderMaterial).uniforms ?? {})) {
          if (u.value instanceof THREE.Texture) u.value.dispose();
        }
        (m as THREE.SpriteMaterial).map?.dispose();
        m.dispose();
      }
    });
    this.popups?.dispose();
    this.popups = null;
    this.quad.dispose();
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
  }
}
