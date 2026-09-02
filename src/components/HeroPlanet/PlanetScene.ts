import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PLANET_CONFIG as C } from './config';
import { generateLandMask, sampleMask, type LandMask } from './landMask';
import dotsVert from './shaders/dots.vert.glsl?raw';
import dotsFrag from './shaders/dots.frag.glsl?raw';
import billboardVert from './shaders/billboard.vert.glsl?raw';
import glowFrag from './shaders/glow.frag.glsl?raw';
import ringVert from './shaders/ring.vert.glsl?raw';
import ringFrag from './shaders/ring.frag.glsl?raw';

gsap.registerPlugin(ScrollTrigger);
// Brand hexes go straight to the framebuffer — no sRGB/linear round-trip.
THREE.ColorManagement.enabled = false;

export type PlanetLayout = 'desktop' | 'tablet' | 'mobile' | 'capture';

export interface PlanetSceneOptions {
  canvas: HTMLCanvasElement;
  /** The hero section: drives sizing, pointer parallax, scroll drift and visibility. */
  host: HTMLElement;
  layout: PlanetLayout;
  reducedMotion: boolean;
  touch: boolean;
  /** Wire the ScrollTrigger drift/fade (off for the capture stage). */
  scroll?: boolean;
}

interface Ring {
  pivot: THREE.Group;
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>;
  curve: THREE.Curve<THREE.Vector3>;
  indexCount: number;
  indexStep: number;
  node: THREE.Group;
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  trail: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
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

export class PlanetScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly opts: Required<PlanetSceneOptions>;
  private readonly clock = new THREE.Clock(false);
  private readonly root = new THREE.Group(); // layout position + scroll drift
  private readonly tilt = new THREE.Group(); // tilted axis
  private readonly spinner = new THREE.Group(); // rotates about its Y
  private dots!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private glow!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private rings: Ring[] = [];

  /** Entrance state, tweened by GSAP and applied every frame. */
  private readonly state = { glow: 0, dots: 0, scale: 0.92, ring0: 0, ring1: 0, ring2: 0, nodes: 0 };
  private entrance: gsap.core.Timeline | null = null;
  private scrollTrigger: ScrollTrigger | null = null;
  private scrollProgress = 0;

  private basePosition = new THREE.Vector3();
  private drift = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();

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
    this.opts = { scroll: true, ...options };
    const { canvas } = this.opts;

    const t0 = performance.now();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, C.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0); // transparent — the hero's dot grid shows through
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    performance.measure('planet:context', { start: t0, end: performance.now() });

    this.camera = new THREE.PerspectiveCamera(C.cameraFovDeg, 1, 0.1, 100);
    this.scene.add(this.root);
    this.root.add(this.tilt);
    this.tilt.rotation.z = -C.axisTiltDeg * DEG;
    this.tilt.add(this.spinner);

    this.buildGlow();
    this.buildOccluder();
    this.ready = this.init();
  }

  /** Resolves once shaders are compiled and the first frame has been scheduled. */
  readonly ready: Promise<void>;
  private compiled = false;

  /**
   * Construction is spread over idle callbacks — context creation, the point cloud (land mask +
   * Fibonacci sampling), then rings and shader compilation — so no single main-thread task is long.
   */
  private async init() {
    const mark = (name: string, fn: () => void) => {
      const t0 = performance.now();
      fn();
      performance.measure(`planet:${name}`, { start: t0, end: performance.now() });
    };
    await idle();
    if (this.disposed) return;
    const [mw, mh] = C.landMaskSize;
    let mask!: LandMask;
    mark('mask', () => {
      mask = generateLandMask(mw, mh, C.landCoverage, C.landMaskSeed, C.landMaskFrequency);
    });
    await idle();
    if (this.disposed) return;
    mark('dots', () => this.buildDots(mask));
    await idle();
    if (this.disposed) return;
    mark('rings', () => {
      this.buildRings();
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

  private buildGlow() {
    const mat = new THREE.ShaderMaterial({
      vertexShader: billboardVert,
      fragmentShader: glowFrag,
      uniforms: {
        uSize: { value: C.glowScale },
        uColor: { value: new THREE.Color(C.colorAccent) },
        uOpacity: { value: 0 },
        uInner: { value: C.glowInner },
        uFalloff: { value: C.glowFalloff },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: C.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.glow.position.z = -0.3;
    this.glow.renderOrder = -1;
    this.glow.frustumCulled = false;
    this.root.add(this.glow);
  }

  private buildOccluder() {
    // Depth-only sphere: anything passing behind the planet is hidden by it.
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(C.occluderRadius, 48, 32),
      new THREE.MeshBasicMaterial({ colorWrite: false }),
    );
    mesh.renderOrder = 0;
    this.root.add(mesh);
  }

  private buildDots(mask: LandMask) {
    const n = this.opts.layout === 'mobile' ? C.pointCountMobile : C.pointCountDesktop;
    const positions = new Float32Array(n * 3);
    const land = new Float32Array(n);
    const seed = new Float32Array(n);
    const golden = Math.PI * (3 - Math.sqrt(5));
    let s = C.landMaskSeed * 7919 + 1;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const v = sampleMask(mask, x, y, z);
      land[i] = smoothstep(mask.threshold - C.coastSoftness, mask.threshold + C.coastSoftness, v);
      seed[i] = rand();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aLand', new THREE.BufferAttribute(land, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);

    const light = new THREE.Vector3(...C.lightDirection).normalize();
    const mat = new THREE.ShaderMaterial({
      vertexShader: dotsVert,
      fragmentShader: dotsFrag,
      uniforms: {
        uPointScale: { value: 1 },
        uLandSize: { value: C.landPointSizePx },
        uOceanSize: { value: C.oceanPointSizePx },
        uLandOpacity: { value: C.landOpacity },
        uOceanOpacity: { value: C.oceanOpacity },
        uSilhouettePower: { value: C.silhouettePower },
        uProgress: { value: 0 },
        uLighten: { value: C.lightenAmount },
        uLightDir: { value: light },
        uColorLand: { value: new THREE.Color(C.colorAccent) },
        uColorOcean: { value: new THREE.Color(C.colorOcean) },
      },
      transparent: true,
      depthWrite: false,
    });
    this.dots = new THREE.Points(geo, mat);
    this.dots.renderOrder = 2;
    this.spinner.add(this.dots);
  }

  private buildRings() {
    const radialSegments = 6;
    const haloGeo = new THREE.PlaneGeometry(1, 1);
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
      pivot.rotation.set(C.ringInclinationsDeg[i] * DEG, C.ringAzimuthsDeg[i] * DEG, C.ringRollsDeg[i] * DEG, 'ZYX');
      pivot.add(mesh);

      // --- node: core + halo + short trail ---
      const colorHex = C.nodeColors[i] === 'lime' ? C.colorLime : C.colorAccent;
      const node = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(C.nodeRadius, 16, 12),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0 }),
      );
      core.renderOrder = 4;
      const makeHalo = (size: number, falloff: number) => {
        const m = new THREE.Mesh(
          haloGeo,
          new THREE.ShaderMaterial({
            vertexShader: billboardVert,
            fragmentShader: glowFrag,
            uniforms: {
              uSize: { value: size },
              uColor: { value: new THREE.Color(colorHex) },
              uOpacity: { value: 0 },
              uInner: { value: 0.0 },
              uFalloff: { value: falloff },
            },
            transparent: true,
            depthWrite: false,
          }),
        );
        m.renderOrder = 3;
        m.frustumCulled = false;
        return m;
      };
      const halo = makeHalo(C.nodeRadius * C.nodeHaloScale, 2.2);
      node.add(core, halo);
      pivot.add(node);

      const trail: Ring['trail'] = [];
      for (let k = 0; k < C.nodeTrailLength; k++) {
        const bead = makeHalo(C.nodeRadius * 2.4, 1.6);
        pivot.add(bead);
        trail.push(bead);
      }

      this.root.add(pivot);
      this.rings.push({ pivot, mesh, curve, indexCount, indexStep: radialSegments * 6, node, core, halo, trail });
    }
  }

  // ---------------------------------------------------------------- layout

  /** Recompute camera distance and planet placement from the hero / canvas boxes. */
  layout() {
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
  }

  private applyScroll() {
    const p = this.scrollProgress;
    this.root.position.set(this.basePosition.x + this.drift.x * p, this.basePosition.y + this.drift.y * p, 0);
    this.opts.canvas.style.opacity = String(1 - p);
  }

  // ---------------------------------------------------------------- lifecycle

  private attach() {
    const { host, canvas, touch, reducedMotion, scroll } = this.opts;

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

    if (!touch) {
      host.addEventListener('pointermove', this.onPointerMove);
      host.addEventListener('pointerleave', this.onPointerLeave);
    }

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

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.opts.host.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    this.pointerTarget.set(nx * C.parallaxStrength, -ny * C.parallaxStrength);
  };

  private onPointerLeave = () => this.pointerTarget.set(0, 0);

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
    const k = C.entranceTotalSec / 1.8; // time-scale against the reference choreography
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(this.state, { glow: 1, duration: 0.7 * k }, 0)
      .to(this.state, { scale: 1, duration: 1.2 * k }, 0.1 * k)
      .to(this.state, { dots: 1, duration: 1.2 * k }, 0.1 * k)
      .to(this.state, { ring0: 1, duration: 0.7 * k }, 0.75 * k)
      .to(this.state, { ring1: 1, duration: 0.7 * k }, 0.87 * k)
      .to(this.state, { ring2: 1, duration: 0.7 * k }, 0.99 * k)
      .to(this.state, { nodes: 1, duration: 0.4 * k, ease: 'back.out(2)' }, 1.4 * k);
    this.entrance = tl;
  }

  private setStaticPose() {
    Object.assign(this.state, { glow: 1, dots: 1, scale: 1, ring0: 1, ring1: 1, ring2: 1, nodes: 1 });
    this.pointerTarget.set(0, 0);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
  }

  private applyState() {
    const s = this.state;
    this.glow.material.uniforms.uOpacity.value = C.glowOpacity * s.glow;
    this.dots.material.uniforms.uProgress.value = s.dots;
    this.spinner.scale.setScalar(s.scale);
    const ringProgress = [s.ring0, s.ring1, s.ring2];
    this.rings.forEach((ring, i) => {
      const p = ringProgress[i] ?? 1;
      const count = Math.floor((ring.indexCount * p) / ring.indexStep) * ring.indexStep;
      ring.mesh.geometry.setDrawRange(0, count);
    });
  }

  private update(elapsed: number) {
    this.applyState();

    // Continuous rotation about the tilted axis.
    this.spinner.rotation.y = C.staticRotationDeg * DEG + (elapsed * Math.PI * 2) / C.rotationPeriodSec;

    // Pointer parallax on the camera, not the object.
    if (!this.opts.reducedMotion) {
      this.camera.position.x += (this.pointerTarget.x - this.camera.position.x) * C.parallaxLerp;
      this.camera.position.y += (this.pointerTarget.y - this.camera.position.y) * C.parallaxLerp;
    }
    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();

    // Planet centre depth in view space, for the behind-the-sphere fades.
    this.root.updateMatrixWorld();
    const centerViewZ = this.tmpV3
      .setFromMatrixPosition(this.root.matrixWorld)
      .applyMatrix4(this.camera.matrixWorldInverse).z;

    const appear = this.state.nodes;
    this.rings.forEach((ring, i) => {
      ring.mesh.material.uniforms.uCenterViewZ.value = centerViewZ;

      const period = C.nodePeriodsSec[i];
      const t = (C.nodeStartOffsets[i] + elapsed / period) % 1;
      ring.curve.getPointAt(t, ring.node.position);

      // Fade the node as it passes behind the sphere (the occluder hides it inside the disc).
      ring.node.updateMatrixWorld();
      const dz =
        this.tmpV3.setFromMatrixPosition(ring.core.matrixWorld).applyMatrix4(this.camera.matrixWorldInverse).z -
        centerViewZ;
      const behind = smoothstep(0.15, -0.55, dz);
      const vis = appear * (1 - behind * (1 - C.nodeBackFade));
      ring.core.material.opacity = vis;
      ring.core.scale.setScalar(Math.max(0.0001, appear));
      ring.halo.material.uniforms.uOpacity.value = C.nodeHaloOpacity * vis;
      ring.halo.material.uniforms.uSize.value = C.nodeRadius * C.nodeHaloScale * appear;

      // Trail: a few fading beads behind the node along the ring.
      const len = ring.trail.length;
      for (let k = 0; k < len; k++) {
        const bead = ring.trail[k];
        const back = ((k + 1) / len) * (C.nodeTrailSpan / period);
        ring.curve.getPointAt((((t - back) % 1) + 1) % 1, bead.position);
        const fade = 1 - (k + 1) / (len + 1);
        bead.material.uniforms.uOpacity.value = C.nodeTrailOpacity * fade * vis;
        bead.material.uniforms.uSize.value = C.nodeRadius * 2.4 * fade * appear;
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
    this.opts.host.removeEventListener('pointermove', this.onPointerMove);
    this.opts.host.removeEventListener('pointerleave', this.onPointerLeave);
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
        m.dispose();
      }
    });
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
  }
}
