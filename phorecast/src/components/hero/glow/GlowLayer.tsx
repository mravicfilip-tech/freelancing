import { useEffect, useRef, type RefObject } from 'react';
import { FRAG, VERT } from './shader';
import './GlowLayer.css';

/**
 * Live state for the glow. A plain object on purpose: GSAP tweens its numbers
 * directly (the disc anchors when the slide changes, `intro` on load) and the
 * render loop reads whatever is in it on the frame it draws.
 */
export interface GlowState {
  /** Left edge of each disc in design px: ember, sun, core, peach, cream. */
  x: number[];
  intro: number;
  scroll: number;
  pointerX: number;
  pointerY: number;
  pointerIn: number;
  depth: number;
  breath: number;
}

/** The `left` each disc is given per slide — the same numbers as Hero.css. */
export const GLOW_ANCHORS: Record<string, number[]> = {
  mark: [788, 802, 1000, 486, 786],
  bonus: [788, 802, 1000, 486, 786],
  account: [-285, -271, -120, -587, -287],
  future: [566, 580, 760, 264, 564],
};

export const newGlowState = (id: string): GlowState => ({
  x: [...(GLOW_ANCHORS[id] ?? GLOW_ANCHORS.mark)],
  intro: 0,
  scroll: 0,
  pointerX: 960,
  pointerY: 540,
  pointerIn: 0,
  depth: 0,
  breath: 1,
});

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return false;
    // Drop the probe context straight away so it does not count against the
    // browser's limit — HeroLogo needs one too.
    (gl.getExtension('WEBGL_lose_context') as WEBGL_lose_context | null)?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface Props {
  /** The `.hero__bg` element the canvas fills and takes its design unit from. */
  hostRef: RefObject<HTMLElement | null>;
  state: RefObject<GlowState>;
  /** Called once the first frame is on screen, so the CSS glows can step back. */
  onReady: () => void;
  /** Reduced motion: draw one static frame and stop. */
  still: boolean;
}

/**
 * The shader glow. Lazy-imports three after the page is idle, probes for a
 * context and simply never appears if there is not one — the CSS stack in
 * Hero.css keeps the hero looking exactly as it does today.
 */
export function GlowLayer({ hostRef, state, onReady, still }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let disposed = false;
    let stop: (() => void) | undefined;

    const idle = () =>
      new Promise<void>((resolve) => {
        const go = () =>
          typeof requestIdleCallback === 'function'
            ? requestIdleCallback(() => resolve(), { timeout: 600 })
            : setTimeout(resolve, 60);
        if (document.readyState === 'complete') go();
        else addEventListener('load', go, { once: true });
      });

    idle()
      .then(() => {
        if (disposed || !hasWebGL()) return;
        return import('three');
      })
      .then((THREE) => {
        if (disposed || !THREE) return;
        try {
          stop = start(THREE, canvas, host, state, () => readyRef.current(), still);
        } catch (err) {
          console.warn('[hero glow] shader unavailable, keeping the CSS glow', err);
        }
      })
      .catch((err) => console.warn('[hero glow] failed to load, keeping the CSS glow', err));

    return () => {
      disposed = true;
      stop?.();
    };
  }, [hostRef, state, still]);

  return <canvas ref={canvasRef} className="hero__shader" aria-hidden="true" />;
}

type Three = typeof import('three');

function start(
  THREE: Three,
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  state: RefObject<GlowState>,
  ready: () => void,
  still: boolean,
): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uPixel: { value: 1 },
    uUnit: { value: 1 },
    uHeight: { value: 1080 },
    uTime: { value: 0 },
    uIntro: { value: 0 },
    uScroll: { value: 0 },
    uDepth: { value: 0 },
    uPointer: { value: new THREE.Vector2(960, 540) },
    uPointerIn: { value: 0 },
    uX: { value: [788, 802, 1000, 486, 786] },
    uBreath: { value: 1 },
    uFade: { value: 1 },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false }),
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  let dpr = Math.min(devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
    uniforms.uPixel.value = dpr;
    // .hero__bg is always `1080 * var(--u)` tall, so its height is the most
    // reliable way back to the design unit at every breakpoint.
    uniforms.uUnit.value = h / 1080;
    uniforms.uHeight.value = 1080;
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* The loop only runs while the hero is on screen and the tab is visible. */
  let frame = 0;
  let onScreen = true;
  let slow = 0;
  let last = performance.now();
  let started = false;
  const clock = { t: 0 };

  const draw = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const s = state.current;
    clock.t += still ? 0 : dt;
    uniforms.uTime.value = clock.t;
    uniforms.uIntro.value = s.intro;
    uniforms.uScroll.value = s.scroll;
    uniforms.uDepth.value = s.depth;
    uniforms.uPointer.value.set(s.pointerX, s.pointerY);
    uniforms.uPointerIn.value = s.pointerIn;
    uniforms.uBreath.value = s.breath;
    for (let i = 0; i < 5; i++) uniforms.uX.value[i] = s.x[i];
    renderer.render(scene, camera);

    if (!started) {
      started = true;
      canvas.classList.add('is-live');
      ready();
    }
    // Adaptive resolution: a machine that cannot hold the frame drops to 1x
    // rather than dragging the whole page down.
    if (dt > 0.028 && dpr > 1) {
      if (++slow > 24) { dpr = 1; slow = 0; resize(); }
    } else if (slow > 0) slow--;

    frame = still ? 0 : requestAnimationFrame(draw);
  };

  const run = () => {
    if (frame || !onScreen || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(draw);
  };
  const halt = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) run(); else halt();
  });
  io.observe(host);
  const onVisibility = () => (document.hidden ? halt() : run());
  document.addEventListener('visibilitychange', onVisibility);

  if (still) requestAnimationFrame(draw);
  else run();

  return () => {
    halt();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    mesh.geometry.dispose();
    (mesh.material as { dispose(): void }).dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
