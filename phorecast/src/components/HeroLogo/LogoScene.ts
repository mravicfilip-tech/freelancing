// Named imports, not a namespace import: `import * as THREE` defeats
// tree-shaking, so the whole library ships whether it is used or not.
import { ACESFilmicToneMapping, ColorManagement, Group, LinearSRGBColorSpace, MathUtils, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Timer, Vector2, Vector3, WebGLRenderer } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LOGO_CONFIG as C } from './config';
import { createTreatment } from './treatments';
import type { FrameState, Treatment } from './treatments/types';
import type { VariantId } from './variants';

gsap.registerPlugin(ScrollTrigger);

export type LogoLayout = 'desktop' | 'tablet' | 'mobile';

/** Where the mark sits in its host, as fractions. Overrides the breakpoint entry
 *  in config.ts, so the same scene can serve a hero and a small rail. */
export interface LogoPlacement {
  heightFraction: number;
  widthFraction: number;
  cx: number;
  cy: number;
}

export interface LogoSceneOptions {
  /** A treatment resolved by the caller, so non-default ones can load on demand. */
  treatment?: Treatment;
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
  /** Place the mark explicitly instead of using the breakpoint layout. */
  placement?: LogoPlacement;
  /**
   * Called when the device cannot draw the mark at a usable rate. The scene has
   * already stopped itself; the caller should swap in the static fallback.
   */
  onTooSlow?: () => void;
}

const TAU = Math.PI * 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Hosts one treatment of the Phorcast mark and gives every treatment the same motion contract:
 * entrance, idle sway, turn-toward-pointer, scroll turn/rise/fade. World units are CSS pixels of
 * the host, origin at its centre, so layout numbers read like the design; the mark is height 1
 * inside a pivot scaled to its height in pixels.
 */
export class LogoScene {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly variant: VariantId;
  /** Resolves once fonts are ready and the first frame has been scheduled. */
  readonly ready: Promise<void>;

  private readonly opts: Required<Omit<LogoSceneOptions, 'placement' | 'treatment' | 'onTooSlow'>>
    & Pick<LogoSceneOptions, 'placement' | 'treatment' | 'onTooSlow'>;
  private readonly treatment: Treatment;
  private readonly timer = new Timer();
  private readonly root = new Group(); // layout position, scale, scroll rise
  private readonly pivot = new Group(); // rotation: rest + idle + pointer + scroll
  private readonly frame: FrameState = {
    progress: 0,
    time: 0,
    scroll: 0,
    pointer: new Vector2(),
    size: 1,
    dpr: 1,
    resolution: new Vector2(1, 1),
    viewDist: 1,
  };

  /** Entrance state, tweened by GSAP and applied every frame. */
  private readonly state = { progress: 0, scale: C.entranceScaleFrom as number };
  private entrance: gsap.core.Tween[] = [];
  private scrollTrigger: ScrollTrigger | null = null;
  private readonly pointerTarget = new Vector2();
  private readonly basePosition = new Vector3();
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
  /** Set when the draw-in has landed; until then the loop runs uncapped. */
  private entranceDone = false;
  private lastDraw = 0;
  /** Set while the first frame after a start would measure the pause, not a frame. */
  private resumed = true;
  /** The idle rate we are currently asking for; halved once if the device cannot hold it. */
  private fpsCap: number = C.idleFps;
  /** Consecutive frames over budget, walked back down by every frame under it. */
  private slowFrames = 0;
  /** Accumulated milliseconds over the per-frame budget. */
  private overrun = 0;
  private drawn = 0;
  private degraded = false;

  constructor(options: LogoSceneOptions) {
    this.opts = { scroll: true, ...options };
    this.variant = options.variant;
    this.treatment = options.treatment ?? createTreatment(this.variant);
    const t = this.treatment;
    const { canvas } = this.opts;

    // Colour pipeline per treatment: the line/point shaders take brand hexes raw; the physically
    // based ones want managed colour, sRGB output and tone mapping. Set before any Color is made.
    ColorManagement.enabled = t.physical;
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: t.physical, // the line/point shaders feather their own edges
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, C.maxPixelRatio, t.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0); // transparent — the hero's ground shows through
    this.renderer.outputColorSpace = t.physical ? SRGBColorSpace : LinearSRGBColorSpace;
    this.renderer.toneMapping = t.physical ? ACESFilmicToneMapping : NoToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new PerspectiveCamera(C.cameraFovDeg, 1, 1, 10000);
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

    const dist = h / 2 / Math.tan(MathUtils.degToRad(C.cameraFovDeg) / 2);
    this.camera.aspect = w / h;
    this.camera.near = dist * 0.1;
    this.camera.far = dist * 4;
    this.camera.position.set(0, 0, dist);
    this.camera.updateProjectionMatrix();
    f.viewDist = dist;

    const L = this.opts.placement ?? C.layouts[layout];
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
    this.resumed = true;
    this.lastDraw = 0;
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

    // Cap the idle loop. The entrance runs at whatever the display gives it,
    // because that is the part anyone watches closely; once it has landed the
    // sway has a 15-second period and 30fps is indistinguishable from 60, at
    // half the draw. Skipped frames still advance time, so the motion keeps
    // wall-clock pace rather than slowing down.
    const now = performance.now();
    const budget = this.entranceDone ? 1000 / this.fpsCap : 1000 / 60;
    if (this.entranceDone && now - this.lastDraw < budget - 1) return; // -1ms so a 30Hz display is not halved

    // How late this frame is, measured from the last one we drew. This is the
    // only honest number available: renderer.render() queues GL commands and
    // returns, so timing the call itself reports near zero however long the
    // draw actually takes -- the cost lands at swap, and only the gap to the
    // next frame shows it.
    const gap = this.lastDraw ? now - this.lastDraw : budget;
    this.lastDraw = now;

    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    this.frame.time += dt;
    const k = 1 - Math.exp(-C.pointerEase * dt);
    this.frame.pointer.lerp(this.pointerTarget, k);
    this.applyPose();
    this.renderer.render(this.scene, this.camera);
    this.watchCost(gap, budget);
  };

  /**
   * Degrade, then give up. WebGL reports no device class and every heuristic
   * for guessing one is wrong somewhere, so the only honest signal is what the
   * frames actually cost. Resolution goes first because it is the cheapest
   * thing to give back; if that does not save it, the mark is decorative and a
   * static outline is worth more than a page running at three frames a second.
   *
   * The measure is accumulated overrun rather than a count of slow frames. A
   * count cannot tell a device that is slightly late from one spending half a
   * second on every frame, and on the second kind it takes half a minute to
   * reach any threshold loose enough for the first. Overrun crosses in a few
   * frames when frames are catastrophic and never when they are merely
   * imperfect, because good frames pay it back faster than bad ones add to it.
   */
  private watchCost(gap: number, budget: number) {
    if (this.drawn++ < C.warmupFrames) return; // shader compile, not the steady cost
    if (this.resumed) { this.resumed = false; return; } // first frame back spans the pause

    // 60% headroom over the rate we asked for, so ordinary jitter is not a verdict.
    const over = gap - budget * 1.6;
    if (over <= 0) {
      this.overrun = Math.max(0, this.overrun + over * 2);
      this.slowFrames = Math.max(0, this.slowFrames - 1);
      return;
    }
    this.overrun += over;
    this.slowFrames++;

    if (!this.degraded
      && this.overrun >= C.overrunBeforeDegrade
      && this.slowFrames >= C.slowFramesBeforeDegrade) {
      this.degraded = true;
      // Give back the cheapest thing first. Where there is no resolution to
      // give back -- a 1x display, which is most desktops -- halve the rate
      // instead, which halves the draw outright. On a device that is merely
      // short of the budget that is often enough to keep the mark, and keeping
      // it degraded is a better outcome than losing it.
      const dpr = this.renderer.getPixelRatio();
      if (dpr > 1) { this.renderer.setPixelRatio(1); this.layout(); }
      else this.fpsCap = Math.max(12, this.fpsCap / 2);
      this.overrun = 0;
      this.slowFrames = 0;
      return;
    }
    if (this.overrun >= C.overrunBeforeFallback && this.slowFrames >= C.slowFramesBeforeFallback) {
      this.stop();
      this.opts.onTooSlow?.();
    }
  }

  private renderOnce() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  // ---------- Entrance / static ----------

  private startEntrance() {
    if (this.entranceStarted) return;
    this.entranceStarted = true;
    this.entrance = [
      gsap.to(this.state, {
        progress: 1,
        duration: C.entranceSec,
        ease: 'power2.inOut',
        onComplete: () => { this.entranceDone = true; },
      }),
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
