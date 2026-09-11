import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LOGO_CONFIG as C } from './config';
import { logoOutline } from './logoPath';
import linesVert from './shaders/lines.vert.glsl?raw';
import linesFrag from './shaders/lines.frag.glsl?raw';

gsap.registerPlugin(ScrollTrigger);
// Brand hexes go straight to the framebuffer — no sRGB/linear round-trip.
THREE.ColorManagement.enabled = false;

export type LogoLayout = 'desktop' | 'tablet' | 'mobile';

export interface LogoSceneOptions {
  canvas: HTMLCanvasElement;
  /** The hero section: sizing, pointer tilt, scroll and visibility are all relative to it. */
  host: HTMLElement;
  layout: LogoLayout;
  reducedMotion: boolean;
  touch: boolean;
  /** Wire the ScrollTrigger turn/spread/fade. */
  scroll?: boolean;
}

const TAU = Math.PI * 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The Phorecast mark as a lined 3D model: the outline extruded into a stack of slices joined by
 * ribs, drawn as additive orange lines. World units are CSS pixels of the host, origin at its
 * centre, so layout numbers read like the design.
 */
export class LogoScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  /** Resolves once fonts are ready and the first frame has been scheduled. */
  readonly ready: Promise<void>;

  private readonly opts: Required<LogoSceneOptions>;
  private readonly timer = new THREE.Timer();
  private readonly root = new THREE.Group(); // layout position, scale, scroll rise
  private readonly pivot = new THREE.Group(); // rotation: rest + idle + pointer + scroll
  private geometry!: THREE.InstancedBufferGeometry;
  private readonly materials: THREE.ShaderMaterial[] = [];
  /** Uniforms shared by the core and glow passes. */
  private readonly shared = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSpread: { value: 1 },
    uDepthNear: { value: 0 },
    uDepthFar: { value: -1 },
  };

  /** Entrance state, tweened by GSAP and applied every frame. */
  private readonly state = { progress: 0, scale: C.entranceScaleFrom as number };
  private entrance: gsap.core.Tween[] = [];
  private scrollTrigger: ScrollTrigger | null = null;
  private scrollProgress = 0;
  private readonly pointer = new THREE.Vector2();
  private readonly pointerTarget = new THREE.Vector2();
  private readonly basePosition = new THREE.Vector3();
  private size = 1;
  private hostHeight = 1;
  private time = 0;
  private canvasOpacity = 1;

  private raf = 0;
  private running = false;
  private disposed = false;
  private hostVisible = true;
  private resizeTimer = 0;
  private resizeObserver: ResizeObserver | null = null;
  private intersection: IntersectionObserver | null = null;
  private entranceStarted = false;

  constructor(options: LogoSceneOptions) {
    this.opts = { scroll: true, ...options };
    const { canvas } = this.opts;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false, // the line shader feathers its own edges
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, C.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0); // transparent — the swoosh lines show through
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(C.cameraFovDeg, 1, 1, 10000);
    this.scene.add(this.root);
    this.root.add(this.pivot);

    this.build();
    this.layout();
    this.attach();

    this.ready = document.fonts.ready.then(() => {
      if (this.disposed) return;
      if (this.opts.reducedMotion) {
        this.setStaticPose();
        this.renderOnce();
      } else {
        this.updateRunning();
        this.startEntrance();
      }
    });
  }

  // ---------- Geometry ----------

  /** Outline slices through the depth plus ribs between the caps, one instanced quad per segment. */
  private build() {
    const pts = logoOutline(C.outlineSamples);
    const n = pts.length;
    const K = C.slices;
    const depth = C.depth;

    const start: number[] = [];
    const end: number[] = [];
    const t: number[] = [];
    const intensity: number[] = [];
    const delay: number[] = [];
    const seg = (a: THREE.Vector2, az: number, b: THREE.Vector2, bz: number, ta: number, tb: number, ia: number, ib: number, d: number) => {
      start.push(a.x, a.y, az);
      end.push(b.x, b.y, bz);
      t.push(ta, tb);
      intensity.push(ia, ib);
      delay.push(d);
    };

    for (let k = 0; k < K; k++) {
      const f = K > 1 ? k / (K - 1) : 1; // 0 = back, 1 = front
      const z = (f - 0.5) * depth;
      const cap = k === 0 || k === K - 1;
      const i0 = cap ? C.capIntensity : C.sliceIntensity;
      // The front outline draws first, the inner slices follow front to back, the back cap last.
      const d = k === K - 1 ? 0 : cap ? 0.85 : 0.15 + 0.6 * (1 - f);
      for (let i = 0; i < n; i++) seg(pts[i], z, pts[(i + 1) % n], z, i / n, (i + 1) / n, i0, i0, d);
    }

    // Ribs: evenly spaced, plus every corner so the extrusion's silhouette edges read.
    const ribAt = new Set<number>();
    for (let j = 0; j < C.ribs; j++) ribAt.add(Math.floor((j * n) / C.ribs));
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      const u = b.clone().sub(a).normalize(), v = c.clone().sub(b).normalize();
      if (Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1)) > C.cornerAngleRad) ribAt.add(i);
    }
    for (const i of ribAt) seg(pts[i], -depth / 2, pts[i], depth / 2, i / n, i / n, C.ribIntensity, C.ribIntensity, 0.5);

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aStart', new THREE.InstancedBufferAttribute(new Float32Array(start), 3));
    geo.setAttribute('aEnd', new THREE.InstancedBufferAttribute(new Float32Array(end), 3));
    geo.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(t), 2));
    geo.setAttribute('aIntensity', new THREE.InstancedBufferAttribute(new Float32Array(intensity), 2));
    geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(new Float32Array(delay), 1));
    geo.instanceCount = delay.length;
    this.geometry = geo;

    // Glow underneath, core on top; both additive so crossings brighten.
    for (const pass of [C.glow, C.core]) {
      const material = new THREE.ShaderMaterial({
        vertexShader: linesVert,
        fragmentShader: linesFrag,
        uniforms: {
          ...this.shared,
          uColor: { value: new THREE.Color(C.color) },
          uOpacity: { value: pass.opacity },
          uWidth: { value: pass.width },
          uFeather: { value: pass.feather },
          uCore: { value: pass.width / (pass.width + pass.feather) },
          uPulse: { value: pass.pulse },
          uPulseSpeed: { value: C.pulseSpeed },
          uDepthFade: { value: C.depthFade },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        // rgb: additive; alpha: "over" — so a lone faded line composites like a normal one.
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      });
      this.materials.push(material);
      const mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      this.pivot.add(mesh);
    }
  }

  // ---------- Layout ----------

  /** Sizes the canvas to its box and places the mark per breakpoint; world units = CSS pixels. */
  private layout() {
    const { host, canvas, layout } = this.opts;
    const box = canvas.parentElement ?? host;
    const w = Math.max(1, box.clientWidth);
    const h = Math.max(1, box.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.getDrawingBufferSize(this.shared.uResolution.value);

    const dist = h / 2 / Math.tan(THREE.MathUtils.degToRad(C.cameraFovDeg) / 2);
    this.camera.aspect = w / h;
    this.camera.near = dist * 0.1;
    this.camera.far = dist * 4;
    this.camera.position.set(0, 0, dist);
    this.camera.updateProjectionMatrix();

    const L = C.layouts[layout];
    this.size = Math.min(L.heightFraction * h, L.widthFraction * w);
    this.hostHeight = h;
    this.basePosition.set(w * L.cx - w / 2, h / 2 - h * L.cy, 0);
    this.shared.uDepthNear.value = -dist + this.size * 0.6;
    this.shared.uDepthFar.value = -dist - this.size * 0.6;

    const dpr = this.renderer.getPixelRatio();
    this.materials.forEach((m, i) => {
      const pass = i === 0 ? C.glow : C.core;
      m.uniforms.uWidth.value = pass.width * dpr;
      m.uniforms.uFeather.value = pass.feather * dpr;
    });
    this.applyPose();
  }

  /** Rest + idle + pointer + scroll → transforms and uniforms. */
  private applyPose() {
    const s = this.scrollProgress;
    const idleYaw = Math.sin((this.time * TAU) / C.idleYawPeriodSec) * C.idleYawAmp;
    const idlePitch = Math.sin((this.time * TAU) / C.idlePitchPeriodSec + 1.3) * C.idlePitchAmp;
    const yaw = C.restYaw + idleYaw + this.pointer.x * C.pointerYaw + s * C.scrollYaw;
    const pitch = C.restPitch + idlePitch + this.pointer.y * C.pointerPitch + s * C.scrollPitch;
    this.pivot.rotation.set(pitch, yaw, 0);

    this.root.position.copy(this.basePosition);
    this.root.position.y += s * this.hostHeight * C.scrollRise;
    this.root.scale.setScalar(this.size * this.state.scale);

    this.shared.uSpread.value = 1 + s * C.scrollSpread;
    this.shared.uProgress.value = this.state.progress;
    this.shared.uTime.value = this.time;

    const opacity = 1 - smoothstep(C.fadeStart, 1, s);
    if (opacity !== this.canvasOpacity) {
      this.canvasOpacity = opacity;
      this.opts.canvas.style.opacity = opacity === 1 ? '' : opacity.toFixed(3);
    }
  }

  // ---------- Wiring ----------

  private attach() {
    const { host, canvas, reducedMotion, touch, scroll } = this.opts;

    this.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        if (this.disposed) return;
        this.layout();
        if (!this.running) this.renderOnce();
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
          if (!this.running) {
            this.applyPose();
            this.renderOnce();
          }
        },
      });
    }
  }

  private readonly onVisibility = () => this.updateRunning();

  private readonly onPointerMove = (e: PointerEvent) => {
    const r = this.opts.host.getBoundingClientRect();
    this.pointerTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };

  private readonly onPointerLeave = () => this.pointerTarget.set(0, 0);

  private updateRunning() {
    const shouldRun = !this.disposed && !this.opts.reducedMotion && this.hostVisible && document.visibilityState === 'visible';
    if (shouldRun && !this.running) this.start();
    else if (!shouldRun && this.running) this.stop();
  }

  private start() {
    this.running = true;
    this.timer.update(); // so the first frame's delta is not the whole pause
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  get isRunning() {
    return this.running;
  }

  private readonly tick = () => {
    if (!this.running || this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    this.time += dt;
    const k = 1 - Math.exp(-C.pointerEase * dt);
    this.pointer.lerp(this.pointerTarget, k);
    this.applyPose();
    this.renderer.render(this.scene, this.camera);
  };

  private renderOnce() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  // ---------- Entrance / static ----------

  private startEntrance() {
    if (this.entranceStarted) return;
    this.entranceStarted = true;
    this.entrance = [
      gsap.to(this.state, { progress: 1, duration: C.entranceSec, ease: 'power2.inOut' }),
      gsap.to(this.state, { scale: 1, duration: C.entranceSec * 0.9, ease: 'power3.out' }),
    ];
  }

  /** Reduced motion: the finished pose, one frame. */
  private setStaticPose() {
    this.state.progress = 1;
    this.state.scale = 1;
    this.time = 0;
    this.pointer.set(0, 0);
    this.scrollProgress = 0;
    this.applyPose();
  }

  /** Counters for the leak / motion checks in scripts/. */
  info() {
    const { render, memory } = this.renderer.info;
    return { calls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    window.clearTimeout(this.resizeTimer);
    this.entrance.forEach((t) => t.kill());
    this.entrance = [];
    this.scrollTrigger?.kill();
    this.scrollTrigger = null;
    gsap.killTweensOf(this.state);

    this.resizeObserver?.disconnect();
    this.intersection?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.opts.host.removeEventListener('pointermove', this.onPointerMove);
    this.opts.host.removeEventListener('pointerleave', this.onPointerLeave);
    this.opts.canvas.style.opacity = '';

    this.timer.dispose();
    this.geometry.dispose();
    this.materials.forEach((m) => m.dispose());
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
  }
}
