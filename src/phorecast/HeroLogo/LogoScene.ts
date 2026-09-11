import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LOGO_CONFIG as C } from './config';
import { createTreatment } from './treatments';
import type { FrameState, Treatment } from './treatments/types';
import type { VariantId } from './variants';

gsap.registerPlugin(ScrollTrigger);

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
  /** Which treatment of the mark to build (see ./variants.ts). */
  variant: VariantId;
}

const TAU = Math.PI * 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Hosts one treatment of the Phorecast mark and gives every treatment the same motion contract:
 * entrance, idle sway, turn-toward-pointer, scroll turn/rise/fade. World units are CSS pixels of
 * the host, origin at its centre, so layout numbers read like the design; the mark is height 1
 * inside a pivot scaled to its height in pixels.
 */
export class LogoScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly variant: VariantId;
  /** Resolves once fonts are ready and the first frame has been scheduled. */
  readonly ready: Promise<void>;

  private readonly opts: Required<LogoSceneOptions>;
  private readonly treatment: Treatment;
  private readonly timer = new THREE.Timer();
  private readonly root = new THREE.Group(); // layout position, scale, scroll rise
  private readonly pivot = new THREE.Group(); // rotation: rest + idle + pointer + scroll
  private readonly frame: FrameState = {
    progress: 0,
    time: 0,
    scroll: 0,
    pointer: new THREE.Vector2(),
    size: 1,
    dpr: 1,
    resolution: new THREE.Vector2(1, 1),
    viewDist: 1,
  };

  /** Entrance state, tweened by GSAP and applied every frame. */
  private readonly state = { progress: 0, scale: C.entranceScaleFrom as number };
  private entrance: gsap.core.Tween[] = [];
  private scrollTrigger: ScrollTrigger | null = null;
  private readonly pointerTarget = new THREE.Vector2();
  private readonly basePosition = new THREE.Vector3();
  private hostHeight = 1;
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
    this.variant = options.variant;
    this.treatment = createTreatment(this.variant);
    const t = this.treatment;
    const { canvas } = this.opts;

    // Colour pipeline per treatment: the line/point shaders take brand hexes raw; the physically
    // based ones want managed colour, sRGB output and tone mapping. Set before any Color is made.
    THREE.ColorManagement.enabled = t.physical;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: t.physical, // the line/point shaders feather their own edges
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, C.maxPixelRatio, t.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0); // transparent — the hero's ground shows through
    this.renderer.outputColorSpace = t.physical ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
    this.renderer.toneMapping = t.physical ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(C.cameraFovDeg, 1, 1, 10000);
    this.scene.add(this.root);
    this.root.add(this.pivot);

    t.build({ pivot: this.pivot, scene: this.scene, renderer: this.renderer, camera: this.camera });
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

  // ---------- Layout ----------

  /** Sizes the canvas to its box and places the mark per breakpoint; world units = CSS pixels. */
  private layout() {
    const { host, canvas, layout } = this.opts;
    const f = this.frame;
    const box = canvas.parentElement ?? host;
    const w = Math.max(1, box.clientWidth);
    const h = Math.max(1, box.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.getDrawingBufferSize(f.resolution);
    f.dpr = this.renderer.getPixelRatio();

    const dist = h / 2 / Math.tan(THREE.MathUtils.degToRad(C.cameraFovDeg) / 2);
    this.camera.aspect = w / h;
    this.camera.near = dist * 0.1;
    this.camera.far = dist * 4;
    this.camera.position.set(0, 0, dist);
    this.camera.updateProjectionMatrix();
    f.viewDist = dist;

    const L = C.layouts[layout];
    f.size = Math.min(L.heightFraction * h, L.widthFraction * w);
    this.hostHeight = h;
    this.basePosition.set(w * L.cx - w / 2, h / 2 - h * L.cy, 0);

    this.treatment.layout(f);
    this.applyPose();
  }

  /** Rest + idle + pointer + scroll (+ the 'rise' entrance) → transforms, then the treatment's own update. */
  private applyPose() {
    const f = this.frame;
    f.progress = this.state.progress;
    const s = f.scroll;
    const rise = this.treatment.entrance === 'rise' ? 1 - easeOutCubic(f.progress) : 0;

    const idleYaw = Math.sin((f.time * TAU) / C.idleYawPeriodSec) * C.idleYawAmp;
    const idlePitch = Math.sin((f.time * TAU) / C.idlePitchPeriodSec + 1.3) * C.idlePitchAmp;
    const yaw = C.restYaw + idleYaw + f.pointer.x * C.pointerYaw + s * C.scrollYaw + rise * C.entranceYaw;
    const pitch = C.restPitch + idlePitch + f.pointer.y * C.pointerPitch + s * C.scrollPitch + rise * 0.15;
    this.pivot.rotation.set(pitch, yaw, 0);

    this.root.position.copy(this.basePosition);
    this.root.position.y += s * this.hostHeight * C.scrollRise - rise * f.size * C.entranceDrop;
    this.root.scale.setScalar(f.size * this.state.scale);

    const opacity = 1 - smoothstep(C.fadeStart, 1, s);
    if (opacity !== this.canvasOpacity) {
      this.canvasOpacity = opacity;
      this.opts.canvas.style.opacity = opacity === 1 ? '' : opacity.toFixed(3);
    }

    this.treatment.update(f);
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
          this.frame.scroll = self.progress;
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
    this.frame.time += dt;
    const k = 1 - Math.exp(-C.pointerEase * dt);
    this.frame.pointer.lerp(this.pointerTarget, k);
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
    this.frame.time = 0;
    this.frame.pointer.set(0, 0);
    this.frame.scroll = 0;
    this.applyPose();
  }

  /** Counters for the leak / motion checks in scripts/. */
  info() {
    const { render, memory } = this.renderer.info;
    return { calls: render.calls, triangles: render.triangles, points: render.points, geometries: memory.geometries, textures: memory.textures };
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
    this.treatment.dispose();
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
  }
}
